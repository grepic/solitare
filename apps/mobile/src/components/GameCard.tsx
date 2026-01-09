import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react';
import { GameLobbyCard, GameStatus } from '@solitaire/shared';
import { Button } from '@solitaire/ui-kit';

interface GameCardProps {
  game: GameLobbyCard;
  onJoin: () => void;
  theme: any;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onJoin, theme }) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: game.playerProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [game.playerProgress]);

  useEffect(() => {
    // Update time remaining for limited-time games
    if (game.isLimited && game.timeRemainingMs !== null) {
      const updateTimer = () => {
        const ms = game.timeRemainingMs!;
        if (ms <= 0) {
          setTimeRemaining('EXPIRED');
          return;
        }

        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [game.isLimited, game.timeRemainingMs]);

  const formatPrize = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPrizeBreakdown = () => {
    const total = game.prizePoolCents;
    return game.prizeDistribution
      .map((percent, index) => {
        const amount = Math.floor((total * percent) / 100);
        const place = index + 1;
        return `${place}${getOrdinalSuffix(place)}: ${formatPrize(amount)}`;
      })
      .join(' | ');
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const getStatusColor = () => {
    switch (game.status) {
      case GameStatus.WAITING:
        return '#4CAF50'; // Green
      case GameStatus.READY_CHECK:
        return '#FF9800'; // Orange
      case GameStatus.IN_PROGRESS:
        return '#2196F3'; // Blue
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (game.status) {
      case GameStatus.WAITING:
        return 'Open';
      case GameStatus.READY_CHECK:
        return 'Starting Soon';
      case GameStatus.IN_PROGRESS:
        return 'In Progress';
      default:
        return 'Closed';
    }
  };

  const canJoin = game.status === GameStatus.WAITING && game.currentPlayers < game.maxPlayers;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      activeOpacity={canJoin ? 0.7 : 1}
      onPress={canJoin ? onJoin : undefined}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={[styles.gameName, { color: theme.colors.text }]}>
            {game.name}
          </Text>
          {game.isLimited && timeRemaining && (
            <View style={[styles.timerBadge, { backgroundColor: '#FF5722' }]}>
              <Text style={styles.timerText}>⏱ {timeRemaining}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Prize Info */}
      <View style={styles.prizeSection}>
        <View style={styles.prizeMain}>
          <Text style={[styles.entryLabel, { color: theme.colors.textSecondary }]}>
            Entry Fee
          </Text>
          <Text style={[styles.entryAmount, { color: theme.colors.primary }]}>
            {formatPrize(game.entryFeeCents)}
          </Text>
        </View>
        <View style={styles.prizeDivider} />
        <View style={styles.prizePool}>
          <Text style={[styles.prizeLabel, { color: theme.colors.textSecondary }]}>
            Prize Pool
          </Text>
          <Text style={[styles.prizeAmount, { color: '#4CAF50' }]}>
            {formatPrize(game.prizePoolCents)}
          </Text>
        </View>
      </View>

      {/* Prize Breakdown */}
      <View style={styles.breakdown}>
        <Text style={[styles.breakdownText, { color: theme.colors.textSecondary }]}>
          {getPrizeBreakdown()}
        </Text>
      </View>

      {/* Player Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
            Players: {game.currentPlayers}/{game.maxPlayers}
          </Text>
          <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
            {game.playerProgress}%
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Join Button */}
      {canJoin && (
        <View style={styles.joinButton}>
          <Button
            title="Join Game"
            onPress={onJoin}
            variant="primary"
            theme={theme}
            size="medium"
          />
        </View>
      )}

      {game.status === GameStatus.READY_CHECK && (
        <View style={styles.readyMessage}>
          <Text style={[styles.readyText, { color: '#FF9800' }]}>
            Starting in 10 seconds...
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  prizeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prizeMain: {
    flex: 1,
  },
  entryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  entryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  prizeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  prizePool: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  prizeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  breakdown: {
    marginBottom: 12,
  },
  breakdownText: {
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  joinButton: {
    marginTop: 8,
  },
  readyMessage: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
