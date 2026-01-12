import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { friendsService, Friend, FriendRequest } from '../../services/friends.service';
import { SkeletonList } from '../../components/EnhancedSkeleton';

type TabType = 'friends' | 'requests' | 'search';

export default function FriendsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await friendsService.initialize();
      setFriends(friendsService.getFriends());
      setRequests(friendsService.getPendingRequests());
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await friendsService.refresh();
    setFriends(friendsService.getFriends());
    setRequests(friendsService.getPendingRequests());
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    const results = await friendsService.searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await friendsService.acceptFriendRequest(requestId);
    if (success) {
      setRequests(friendsService.getPendingRequests());
      setFriends(friendsService.getFriends());
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const success = await friendsService.declineFriendRequest(requestId);
    if (success) {
      setRequests(friendsService.getPendingRequests());
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    const success = await friendsService.removeFriend(userId);
    if (success) {
      setFriends(friendsService.getFriends());
    }
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'ONLINE':
        return '#10B981';
      case 'IN_GAME':
        return '#F59E0B';
      case 'OFFLINE':
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: Friend['status']) => {
    switch (status) {
      case 'ONLINE':
        return 'Online';
      case 'IN_GAME':
        return 'In Game';
      case 'OFFLINE':
      default:
        return 'Offline';
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[styles(theme).friendCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Profile', { userId: item.userId })}
    >
      <View style={styles(theme).friendContent}>
        <View style={styles(theme).avatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
            style={styles(theme).avatar}
          />
          <View
            style={[styles(theme).statusDot, { backgroundColor: getStatusColor(item.status) }]}
          />
        </View>

        <View style={styles(theme).friendInfo}>
          <Text style={[styles(theme).friendName, { color: theme.colors.text }]}>
            {item.username}
          </Text>
          <Text style={[styles(theme).friendStatus, { color: theme.colors.textSecondary }]}>
            {getStatusText(item.status)}
          </Text>
          {item.stats && (
            <Text style={[styles(theme).friendStats, { color: theme.colors.textSecondary }]}>
              {item.stats.wins}W / {item.stats.totalGames - item.stats.wins}L ({item.stats.winRate.toFixed(1)}%)
            </Text>
          )}
        </View>

        <View style={styles(theme).friendActions}>
          <TouchableOpacity
            style={[styles(theme).actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Chat', { userId: item.userId })}
          >
            <Text style={styles(theme).actionButtonText}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles(theme).actionButton, { backgroundColor: theme.colors.error }]}
            onPress={() => handleRemoveFriend(item.userId)}
          >
            <Text style={styles(theme).actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles(theme).requestCard, { backgroundColor: theme.colors.surface }]}>
      <Image
        source={{ uri: item.fromAvatar || 'https://via.placeholder.com/50' }}
        style={styles(theme).avatar}
      />

      <View style={styles(theme).requestInfo}>
        <Text style={[styles(theme).requestName, { color: theme.colors.text }]}>
          {item.fromUsername}
        </Text>
        {item.message && (
          <Text style={[styles(theme).requestMessage, { color: theme.colors.textSecondary }]}>
            "{item.message}"
          </Text>
        )}
      </View>

      <View style={styles(theme).requestActions}>
        <TouchableOpacity
          style={[styles(theme).requestButton, { backgroundColor: theme.colors.success }]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles(theme).requestButtonText}>✓</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).requestButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={styles(theme).requestButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={[styles(theme).searchCard, { backgroundColor: theme.colors.surface }]}>
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
        style={styles(theme).avatar}
      />

      <View style={styles(theme).searchInfo}>
        <Text style={[styles(theme).searchName, { color: theme.colors.text }]}>
          {item.username}
        </Text>
        {item.mutualFriends > 0 && (
          <Text style={[styles(theme).mutualFriends, { color: theme.colors.textSecondary }]}>
            {item.mutualFriends} mutual friend{item.mutualFriends > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {item.isFriend ? (
        <Text style={[styles(theme).alreadyFriends, { color: theme.colors.success }]}>
          ✓ Friends
        </Text>
      ) : item.hasPendingRequest ? (
        <Text style={[styles(theme).pending, { color: theme.colors.warning }]}>Pending</Text>
      ) : (
        <TouchableOpacity
          style={[styles(theme).addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => friendsService.sendFriendRequest(item.userId)}
        >
          <Text style={styles(theme).addButtonText}>Add Friend</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Friends 👥</Text>
        <SkeletonList count={8} />
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Friends 👥</Text>

      {/* Tabs */}
      <View style={styles(theme).tabs}>
        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'friends' && styles(theme).tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles(theme).tabText,
              {
                color: activeTab === 'friends' ? '#FFFFFF' : theme.colors.textSecondary,
              },
            ]}
          >
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'requests' && styles(theme).tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles(theme).tabText,
              {
                color: activeTab === 'requests' ? '#FFFFFF' : theme.colors.textSecondary,
              },
            ]}
          >
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'search' && styles(theme).tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text
            style={[
              styles(theme).tabText,
              {
                color: activeTab === 'search' ? '#FFFFFF' : theme.colors.textSecondary,
              },
            ]}
          >
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.userId}
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
                No friends yet. Use the search tab to find friends!
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          renderItem={renderRequest}
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
                No pending friend requests
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'search' && (
        <View style={styles(theme).searchContainer}>
          <View style={[styles(theme).searchBar, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              style={[styles(theme).searchInput, { color: theme.colors.text }]}
              placeholder="Search by username..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles(theme).searchButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSearch}
            >
              <Text style={styles(theme).searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles(theme).list}
            ListEmptyComponent={
              searchQuery.length > 0 ? (
                <View style={styles(theme).emptyState}>
                  <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
                    No users found
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    tabs: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      ...theme.typography.body,
      fontWeight: '600',
      fontSize: 13,
    },
    list: {
      paddingBottom: theme.spacing.xl,
    },
    friendCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    friendContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    statusDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    friendInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    friendName: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      marginBottom: 2,
    },
    friendStatus: {
      ...theme.typography.caption,
      fontSize: 12,
      marginBottom: 2,
    },
    friendStats: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    friendActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: 16,
    },
    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    requestInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    requestName: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      marginBottom: 4,
    },
    requestMessage: {
      ...theme.typography.caption,
      fontSize: 12,
      fontStyle: 'italic',
    },
    requestActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    requestButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestButtonText: {
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    searchContainer: {
      flex: 1,
    },
    searchBar: {
      flexDirection: 'row',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...theme.typography.body,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonText: {
      fontSize: 18,
    },
    searchCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    searchInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    searchName: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      marginBottom: 2,
    },
    mutualFriends: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    alreadyFriends: {
      ...theme.typography.body,
      fontSize: 13,
      fontWeight: '600',
    },
    pending: {
      ...theme.typography.body,
      fontSize: 13,
      fontWeight: '600',
    },
    addButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
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
