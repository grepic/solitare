import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { chatService, ChatMessage } from '../../services/chat.service';

export default function ChatScreen({ route, navigation }: any) {
  const { theme } = useThemeStore();
  const { conversationId, otherUser } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = 'currentUser'; // TODO: Get from auth

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const unsubscribe = chatService.onMessage((message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [message, ...prev]);
        // Mark as read
        chatService.markAsRead(conversationId);
      }
    });

    // Mark conversation as read
    chatService.markAsRead(conversationId);

    return () => unsubscribe();
  }, [conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await chatService.loadMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    const message = await chatService.sendMessage(conversationId, inputText.trim());
    if (message) {
      setMessages((prev) => [message, ...prev]);
      setInputText('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return messageDate.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.fromUserId === currentUserId;

    return (
      <View
        style={[
          styles(theme).messageContainer,
          isOwnMessage ? styles(theme).ownMessageContainer : styles(theme).otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: item.fromAvatar || 'https://via.placeholder.com/30' }}
            style={styles(theme).messageAvatar}
          />
        )}

        <View
          style={[
            styles(theme).messageBubble,
            {
              backgroundColor: isOwnMessage ? theme.colors.primary : theme.colors.surface,
            },
          ]}
        >
          {item.type === 'TEXT' && (
            <Text
              style={[
                styles(theme).messageText,
                {
                  color: isOwnMessage ? '#FFFFFF' : theme.colors.text,
                },
              ]}
            >
              {item.content}
            </Text>
          )}

          {item.type === 'IMAGE' && (
            <View>
              <Image
                source={{ uri: item.metadata?.imageUrl }}
                style={styles(theme).messageImage}
              />
              {item.content && (
                <Text
                  style={[
                    styles(theme).messageText,
                    {
                      color: isOwnMessage ? '#FFFFFF' : theme.colors.text,
                      marginTop: theme.spacing.sm,
                    },
                  ]}
                >
                  {item.content}
                </Text>
              )}
            </View>
          )}

          {item.type === 'GAME_INVITE' && (
            <View style={styles(theme).gameInvite}>
              <Text
                style={[
                  styles(theme).gameInviteText,
                  {
                    color: isOwnMessage ? '#FFFFFF' : theme.colors.text,
                  },
                ]}
              >
                🎮 Game Invite
              </Text>
              <TouchableOpacity
                style={[
                  styles(theme).gameInviteButton,
                  {
                    backgroundColor: isOwnMessage
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.primary,
                  },
                ]}
                onPress={() => {
                  /* Handle game invite */
                }}
              >
                <Text
                  style={[
                    styles(theme).gameInviteButtonText,
                    {
                      color: '#FFFFFF',
                    },
                  ]}
                >
                  Join Game
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {item.type === 'SYSTEM' && (
            <Text
              style={[
                styles(theme).systemMessage,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {item.content}
            </Text>
          )}

          <Text
            style={[
              styles(theme).messageTimestamp,
              {
                color: isOwnMessage
                  ? 'rgba(255,255,255,0.7)'
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {formatTimestamp(item.createdAt)}
          </Text>
        </View>

        {isOwnMessage && item.read && (
          <Text style={styles(theme).readIndicator}>✓✓</Text>
        )}
      </View>
    );
  };

  const renderDateSeparator = (date: Date) => (
    <View style={styles(theme).dateSeparator}>
      <View style={[styles(theme).dateLine, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles(theme).dateText, { color: theme.colors.textSecondary }]}>
        {new Date(date).toLocaleDateString()}
      </Text>
      <View style={[styles(theme).dateLine, { backgroundColor: theme.colors.border }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles(theme).header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <View style={styles(theme).headerUser}>
          <Image
            source={{ uri: otherUser?.avatar || 'https://via.placeholder.com/40' }}
            style={styles(theme).headerAvatar}
          />
          <Text style={[styles(theme).headerUsername, { color: theme.colors.text }]}>
            {otherUser?.username || 'User'}
          </Text>
        </View>

        <TouchableOpacity onPress={() => {/* Show options */}}>
          <Text style={{ fontSize: 24 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles(theme).messagesList}
        inverted
        ListEmptyComponent={
          !loading ? (
            <View style={styles(theme).emptyState}>
              <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
                No messages yet. Say hi! 👋
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles(theme).inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles(theme).attachButton, { backgroundColor: theme.colors.background }]}
          onPress={() => {/* Handle attachment */}}
        >
          <Text style={{ fontSize: 20 }}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles(theme).input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[
            styles(theme).sendButton,
            {
              backgroundColor: inputText.trim().length > 0
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={handleSend}
          disabled={inputText.trim().length === 0}
        >
          <Text style={{ fontSize: 20 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerUser: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    headerUsername: {
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    messagesList: {
      padding: theme.spacing.md,
      flexGrow: 1,
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
      alignItems: 'flex-end',
    },
    ownMessageContainer: {
      justifyContent: 'flex-end',
    },
    otherMessageContainer: {
      justifyContent: 'flex-start',
    },
    messageAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: theme.spacing.sm,
    },
    messageBubble: {
      maxWidth: '70%',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    messageText: {
      ...theme.typography.body,
      fontSize: 15,
      lineHeight: 20,
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: theme.radius.md,
    },
    messageTimestamp: {
      ...theme.typography.caption,
      fontSize: 10,
      marginTop: 4,
    },
    readIndicator: {
      fontSize: 10,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    gameInvite: {
      alignItems: 'center',
    },
    gameInviteText: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      marginBottom: theme.spacing.sm,
    },
    gameInviteButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    gameInviteButtonText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    systemMessage: {
      ...theme.typography.caption,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    dateSeparator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dateLine: {
      flex: 1,
      height: 1,
    },
    dateText: {
      ...theme.typography.caption,
      fontSize: 11,
      marginHorizontal: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    attachButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      ...theme.typography.body,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      maxHeight: 100,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxl,
      transform: [{ scaleY: -1 }], // Flip back because list is inverted
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
    },
  });
