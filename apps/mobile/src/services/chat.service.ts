/**
 * Chat System Service
 *
 * Real-time messaging between friends.
 * Uses WebSocket for live updates (ready for Socket.IO integration).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { analyticsService } from './analytics.service';

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'GAME_INVITE' | 'SYSTEM';
  createdAt: Date;
  read: boolean;
  metadata?: {
    gameId?: string;
    imageUrl?: string;
  };
}

export interface Conversation {
  id: string;
  participants: {
    userId: string;
    username: string;
    avatar?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: Date;
  muted: boolean;
}

export type MessageListener = (message: ChatMessage) => void;
export type ConversationUpdateListener = (conversation: Conversation) => void;

class ChatService {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // conversationId -> messages
  private messageListeners: Set<MessageListener> = new Set();
  private conversationListeners: Set<ConversationUpdateListener> = new Set();
  private loaded: boolean = false;
  private socket: any = null; // WebSocket connection (TODO: Socket.IO)

  /**
   * Initialize chat service
   */
  async initialize(): Promise<void> {
    await this.loadConversations();
    // await this.connectWebSocket(); // TODO: Implement WebSocket

    console.log('✅ Chat service initialized');
  }

  /**
   * Load conversations from storage
   */
  private async loadConversations(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/chat/conversations');
      response.data.forEach((conv: Conversation) => {
        this.conversations.set(conv.id, conv);
      });
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('chat_conversations');
      if (stored) {
        const conversations: Conversation[] = JSON.parse(stored);
        conversations.forEach((conv) => {
          this.conversations.set(conv.id, conv);
        });
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  /**
   * Save conversations to storage
   */
  private async saveConversations(): Promise<void> {
    try {
      const conversations = Array.from(this.conversations.values());
      await AsyncStorage.setItem('chat_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  /**
   * Load messages for conversation
   */
  async loadMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      // Check cache first
      if (this.messages.has(conversationId)) {
        return this.messages.get(conversationId)!.slice(0, limit);
      }

      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { limit },
      });
      const messages = response.data;
      this.messages.set(conversationId, messages);
      return messages;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem(`chat_messages_${conversationId}`);
      if (stored) {
        const messages: ChatMessage[] = JSON.parse(stored);
        this.messages.set(conversationId, messages);
        return messages.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Save messages to storage
   */
  private async saveMessages(conversationId: string): Promise<void> {
    try {
      const messages = this.messages.get(conversationId);
      if (messages) {
        // Keep only last 100 messages in storage
        const recentMessages = messages.slice(0, 100);
        await AsyncStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(recentMessages));
      }
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }

  /**
   * Get all conversations
   */
  getConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get or create conversation with user
   */
  async getOrCreateConversation(userId: string, username: string, avatar?: string): Promise<string> {
    // Check if conversation already exists
    for (const [id, conv] of this.conversations) {
      const hasUser = conv.participants.some((p) => p.userId === userId);
      if (hasUser && conv.participants.length === 2) {
        return id;
      }
    }

    // Create new conversation
    try {
      // TODO: Create on backend
      /* Example:
      const response = await api.post('/chat/conversations', {
        participants: [userId],
      });
      const conversation = response.data;
      this.conversations.set(conversation.id, conversation);
      await this.saveConversations();
      return conversation.id;
      */

      // Fallback: Create locally
      const conversationId = `conv_${userId}_${Date.now()}`;
      const newConversation: Conversation = {
        id: conversationId,
        participants: [
          { userId, username, avatar },
          // Current user would be added by backend
        ],
        unreadCount: 0,
        updatedAt: new Date(),
        muted: false,
      };

      this.conversations.set(conversationId, newConversation);
      await this.saveConversations();

      return conversationId;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage['type'] = 'TEXT',
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage | null> {
    try {
      // TODO: Send via backend/WebSocket
      /* Example:
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content,
        type,
        metadata,
      });
      const message = response.data;
      */

      // Fallback: Create locally
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        conversationId,
        fromUserId: 'currentUser', // TODO: Get from auth
        fromUsername: 'You',
        toUserId: 'other', // TODO: Get from conversation
        content,
        type,
        createdAt: new Date(),
        read: false,
        metadata,
      };

      // Add to messages
      let messages = this.messages.get(conversationId) || [];
      messages.unshift(message);
      this.messages.set(conversationId, messages);
      await this.saveMessages(conversationId);

      // Update conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = new Date();
        await this.saveConversations();

        // Notify listeners
        this.conversationListeners.forEach((listener) => listener(conversation));
      }

      // Notify message listeners
      this.messageListeners.forEach((listener) => listener(message));

      // Track analytics
      await analyticsService.logEvent('message_sent', {
        conversation_id: conversationId,
        type,
      });

      console.log(`✅ Message sent to conversation ${conversationId}`);
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      // TODO: Update on backend
      /* Example:
      await api.post(`/chat/conversations/${conversationId}/read`);
      */

      // Update local conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
        await this.saveConversations();

        // Notify listeners
        this.conversationListeners.forEach((listener) => listener(conversation));
      }

      // Mark messages as read
      const messages = this.messages.get(conversationId);
      if (messages) {
        messages.forEach((msg) => {
          msg.read = true;
        });
        await this.saveMessages(conversationId);
      }

      console.log(`✅ Conversation ${conversationId} marked as read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // TODO: Delete on backend
      /* Example:
      await api.delete(`/chat/conversations/${conversationId}`);
      */

      // Delete locally
      this.conversations.delete(conversationId);
      this.messages.delete(conversationId);
      await this.saveConversations();
      await AsyncStorage.removeItem(`chat_messages_${conversationId}`);

      console.log(`✅ Conversation ${conversationId} deleted`);
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  /**
   * Mute/unmute conversation
   */
  async toggleMute(conversationId: string): Promise<boolean> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return false;

      // TODO: Update on backend
      /* Example:
      await api.post(`/chat/conversations/${conversationId}/mute`, {
        muted: !conversation.muted,
      });
      */

      // Update locally
      conversation.muted = !conversation.muted;
      await this.saveConversations();

      // Notify listeners
      this.conversationListeners.forEach((listener) => listener(conversation));

      console.log(`✅ Conversation ${conversationId} ${conversation.muted ? 'muted' : 'unmuted'}`);
      return true;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      return false;
    }
  }

  /**
   * Get total unread count
   */
  getTotalUnreadCount(): number {
    return Array.from(this.conversations.values()).reduce((sum, conv) => sum + conv.unreadCount, 0);
  }

  /**
   * Subscribe to new messages
   */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Subscribe to conversation updates
   */
  onConversationUpdate(listener: ConversationUpdateListener): () => void {
    this.conversationListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.conversationListeners.delete(listener);
    };
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  private async connectWebSocket(): Promise<void> {
    try {
      // TODO: Implement Socket.IO connection
      /* Example:
      import io from 'socket.io-client';

      this.socket = io(ENV.WEBSOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token: await getAuthToken(),
        },
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
      });

      this.socket.on('message', (message: ChatMessage) => {
        this.handleIncomingMessage(message);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
      });
      */
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  /**
   * Handle incoming message from WebSocket
   */
  private handleIncomingMessage(message: ChatMessage): void {
    // Add to messages
    let messages = this.messages.get(message.conversationId) || [];
    messages.unshift(message);
    this.messages.set(message.conversationId, messages);
    this.saveMessages(message.conversationId);

    // Update conversation
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.unreadCount++;
      conversation.updatedAt = new Date();
      this.saveConversations();

      // Notify listeners
      this.conversationListeners.forEach((listener) => listener(conversation));
    }

    // Notify message listeners
    this.messageListeners.forEach((listener) => listener(message));
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Refresh conversations from server
   */
  async refresh(): Promise<void> {
    await this.loadConversations();
  }
}

export const chatService = new ChatService();
