import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../stores/authStore';
import {
  GameLobbyCard,
  GameLobbyEvent,
  MatchTier,
  LobbyUpdatePayload,
  GameJoinPayload,
} from '@solitaire/shared';
import { GameCard } from '../../components/GameCard';
import { Button } from '@solitaire/ui-kit';

interface LobbyBrowserScreenProps {
  navigation: any;
}

export const LobbyBrowserScreen: React.FC<LobbyBrowserScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const { socket, isConnected } = useWebSocket();
  const user = useAuthStore((state) => state.user);

  const [games, setGames] = useState<GameLobbyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | MatchTier>('all');

  useEffect(() => {
    if (socket && isConnected) {
      // Subscribe to lobby updates
      socket.emit(GameLobbyEvent.LOBBY_SUBSCRIBE, {
        tier: selectedTab === 'all' ? undefined : selectedTab,
      });

      // Listen for lobby updates
      socket.on(GameLobbyEvent.LOBBY_UPDATE, handleLobbyUpdate);

      return () => {
        socket.off(GameLobbyEvent.LOBBY_UPDATE, handleLobbyUpdate);
        socket.emit(GameLobbyEvent.LOBBY_UNSUBSCRIBE);
      };
    }
  }, [socket, isConnected, selectedTab]);

  const handleLobbyUpdate = useCallback((payload: LobbyUpdatePayload) => {
    setGames(payload.games);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Re-subscribe to trigger immediate update
    if (socket && isConnected) {
      socket.emit(GameLobbyEvent.LOBBY_SUBSCRIBE, {
        tier: selectedTab === 'all' ? undefined : selectedTab,
      });
    }
  }, [socket, isConnected, selectedTab]);

  const handleJoinGame = useCallback(
    async (gameId: string) => {
      if (!socket || !isConnected) {
        Alert.alert('Error', 'Not connected to server');
        return;
      }

      socket.emit(
        GameLobbyEvent.GAME_JOIN,
        { gameId } as GameJoinPayload,
        (response: any) => {
          if (response.success) {
            // Navigate to game screen
            navigation.navigate('Game', {
              matchId: gameId,
              isMultiPlayer: true,
            });
          } else {
            Alert.alert('Error', response.error || 'Failed to join game');
          }
        },
      );
    },
    [socket, isConnected, navigation],
  );

  const handleCreateGame = useCallback(() => {
    navigation.navigate('CreateGame');
  }, [navigation]);

  const filteredGames =
    selectedTab === 'all'
      ? games
      : games.filter((g) => g.tier === selectedTab);

  const renderTabButton = (
    label: string,
    value: 'all' | MatchTier,
    badge?: number,
  ) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === value && styles.tabButtonActive,
        { borderColor: theme.colors.border },
      ]}
      onPress={() => setSelectedTab(value)}
    >
      <Text
        style={[
          styles.tabText,
          { color: theme.colors.text },
          selectedTab === value && styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Connecting to server...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Game Lobbies
        </Text>
        <Button
          title="Create Game"
          onPress={handleCreateGame}
          variant="primary"
          theme={theme}
          size="small"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTabButton('All', 'all', games.length)}
        {renderTabButton(
          'Practice',
          MatchTier.PRACTICE,
          games.filter((g) => g.tier === MatchTier.PRACTICE).length,
        )}
        {renderTabButton(
          '$1',
          MatchTier.TIER_1,
          games.filter((g) => g.tier === MatchTier.TIER_1).length,
        )}
        {renderTabButton(
          '$5',
          MatchTier.TIER_5,
          games.filter((g) => g.tier === MatchTier.TIER_5).length,
        )}
        {renderTabButton(
          '$10',
          MatchTier.TIER_10,
          games.filter((g) => g.tier === MatchTier.TIER_10).length,
        )}
      </View>

      {/* Game List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredGames.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No active lobbies
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { color: theme.colors.textSecondary },
            ]}
          >
            Create a new game to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              onJoin={() => handleJoinGame(item.id)}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
