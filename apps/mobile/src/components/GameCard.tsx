import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { GameLobbyCard, GameStatus } from '@solitaire/shared';
import { Button } from '@solitaire/ui-kit';

interface GameCardProps {
  game: GameLobbyCard;
  onJoin: () => void;
  theme: any;
  index?: number; // For staggered entrance
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onJoin,
  theme,
  index = 0
}) => {
  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Pulse animation for progress bar
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Scale animation for press
  const pressAnim = useRef(new Animated.Value(1)).current;

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Entrance animation on mount
  useEffect(() => {
    const delay = index * 80; // Stagger by 80ms

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress bar animation with pulse effect
  useEffect(() => {
    // Smooth spring animation for progress
    Animated.spring(progressAnim, {
      toValue: game.playerProgress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();

    // Pulse effect when progress changes
    if (game.playerProgress > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [game.playerProgress]);

  // Timer update
  useEffect(() => {
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
      .slice(0, 3) // Show first 3 places
      .map((percent, index) => {
        const amount = Math.floor((total * percent) / 100);
        const place = index + 1;
        return `${place}${getOrdinalSuffix(place)}: ${formatPrize(amount)}`;
      })
      .join(' · ');
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
        return '#4CAF50';
      case GameStatus.READY_CHECK:
        return '#FF9800';
      case GameStatus.IN_PROGRESS:
        return '#2196F3';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (game.status) {
      case GameStatus.WAITING:
        return 'Open';
      case GameStatus.READY_CHECK:
        return 'Starting...';
      case GameStatus.IN_PROGRESS:
        return 'Live';
      default:
        return 'Closed';
    }
  };

  const canJoin = game.status === GameStatus.WAITING && game.currentPlayers < game.maxPlayers;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: Animated.multiply(scaleAnim, pressAnim) },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: canJoin ? theme.colors.primary + '40' : theme.colors.border,
            borderWidth: canJoin ? 2 : 1,
          },
        ]}
        activeOpacity={0.9}
        onPress={canJoin ? onJoin : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canJoin}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text style={[styles.gameName, { color: theme.colors.text }]}>
              {game.name}
            </Text>
            {game.isLimited && timeRemaining && (
              <Animated.View
                style={[
                  styles.timerBadge,
                  {
                    backgroundColor: '#FF5722',
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <Text style={styles.timerText}>⏱ {timeRemaining}</Text>
              </Animated.View>
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
              Entry
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
            💰 {getPrizeBreakdown()}
          </Text>
        </View>

        {/* Player Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
              👥 {game.currentPlayers}/{game.maxPlayers} Players
            </Text>
            <Animated.Text
              style={[
                styles.progressPercent,
                {
                  color: theme.colors.primary,
                  transform: [{ scale: pulseAnim }],
                }
              ]}
            >
              {game.playerProgress}%
            </Animated.Text>
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
              title="🎮 Join Now"
              onPress={onJoin}
              variant="primary"
              theme={theme}
              size="medium"
            />
          </View>
        )}

        {game.status === GameStatus.READY_CHECK && (
          <Animated.View
            style={[
              styles.readyMessage,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={[styles.readyText, { color: '#FF9800' }]}>
              ⏰ Starting in 10 seconds...
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  timerBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  prizeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 10,
  },
  prizeMain: {
    flex: 1,
  },
  entryLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  prizeDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 18,
  },
  prizePool: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  prizeAmount: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  breakdown: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  breakdownText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  joinButton: {
    marginTop: 6,
  },
  readyMessage: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  readyText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
