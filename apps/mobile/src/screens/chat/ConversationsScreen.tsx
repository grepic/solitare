import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { chatService, Conversation } from '../../services/chat.service';
import { SkeletonList } from '../../components/EnhancedSkeleton';

export default function ConversationsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation updates
    const unsubscribe = chatService.onConversationUpdate((conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? conversation : c))
      );
      setTotalUnread(chatService.getTotalUnreadCount());
    });

    return () => unsubscribe();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      await chatService.initialize();
      const convs = chatService.getConversations();
      setConversations(convs);
      setTotalUnread(chatService.getTotalUnreadCount());
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await chatService.refresh();
    const convs = chatService.getConversations();
    setConversations(convs);
    setTotalUnread(chatService.getTotalUnreadCount());
    setRefreshing(false);
  };

  const handleConversationPress = async (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.participants[1], // Assuming 2-person conv
    });

    // Mark as read
    await chatService.markAsRead(conversation.id);
    setTotalUnread(chatService.getTotalUnreadCount());
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await chatService.deleteConversation(conversationId);
    if (success) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.participants[1] || item.participants[0];
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles(theme).conversationCard,
          {
            backgroundColor: hasUnread
              ? theme.colors.primary + '15'
              : theme.colors.surface,
          },
        ]}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleDeleteConversation(item.id)}
      >
        <Image
          source={{ uri: otherUser.avatar || 'https://via.placeholder.com/50' }}
          style={styles(theme).avatar}
        />

        <View style={styles(theme).conversationContent}>
          <View style={styles(theme).conversationHeader}>
            <Text
              style={[
                styles(theme).username,
                { color: theme.colors.text },
                hasUnread && styles(theme).usernameUnread,
              ]}
            >
              {otherUser.username}
            </Text>
            {item.lastMessage && (
              <Text style={[styles(theme).timestamp, { color: theme.colors.textSecondary }]}>
                {formatTimestamp(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <View style={styles(theme).lastMessageContainer}>
              <Text
                style={[
                  styles(theme).lastMessage,
                  { color: theme.colors.textSecondary },
                  hasUnread && styles(theme).lastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.type === 'TEXT' && item.lastMessage.content}
                {item.lastMessage.type === 'IMAGE' && '📷 Photo'}
                {item.lastMessage.type === 'GAME_INVITE' && '🎮 Game Invite'}
                {item.lastMessage.type === 'SYSTEM' && item.lastMessage.content}
              </Text>

              {hasUnread && (
                <View
                  style={[styles(theme).unreadBadge, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles(theme).unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          )}

          {item.muted && (
            <Text style={[styles(theme).mutedText, { color: theme.colors.textSecondary }]}>
              🔇 Muted
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Messages 💬</Text>
        <SkeletonList count={8} />
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Messages 💬</Text>
        {totalUnread > 0 && (
          <View style={[styles(theme).totalUnreadBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles(theme).totalUnreadText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles(theme).list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles(theme).emptyState}>
            <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
              No messages yet. Start chatting with your friends!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      position: 'relative',
    },
    title: {
      ...theme.typography.h1,
      textAlign: 'center',
    },
    totalUnreadBadge: {
      position: 'absolute',
      right: theme.spacing.xl,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalUnreadText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    list: {
      paddingBottom: theme.spacing.xl,
    },
    conversationCard: {
      flexDirection: 'row',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    conversationContent: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    username: {
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    usernameUnread: {
      fontWeight: '700',
    },
    timestamp: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    lastMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lastMessage: {
      ...theme.typography.body,
      fontSize: 14,
      flex: 1,
    },
    lastMessageUnread: {
      fontWeight: '600',
      color: theme.colors.text,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.sm,
    },
    unreadCount: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    mutedText: {
      ...theme.typography.caption,
      fontSize: 11,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxl,
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
    },
  });
