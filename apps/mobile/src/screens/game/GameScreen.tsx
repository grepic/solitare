import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import { useGameStore } from '../../store/game.store';
import { PlayingCard } from '../../components/PlayingCard';
import { MoveType, Suit } from '@solitaire/engine';
import { Button } from '@solitaire/ui-kit';
import websocket from '../../services/websocket';

interface GameScreenProps {
  route: any;
  navigation: any;
}

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { theme } = useThemeStore();
  const { matchId, seed } = route.params;
  const { gameState, initGame, makeMove, checkWin, moveSequence, reset, startTime } = useGameStore();
  const [selectedPile, setSelectedPile] = useState<{ type: string; index?: number } | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    initGame(seed, matchId);

    websocket.on('MATCH_START', (data) => {
      const startAt = data.startAt;
      const now = Date.now();
      const delay = startAt - now;

      if (delay > 0) {
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setCountdown(0);
      }
    });

    websocket.on('OPPONENT_PROGRESS', (data) => {
      setOpponentProgress(data.movesCount);
    });

    websocket.on('MATCH_END', (data) => {
      handleMatchEnd(data);
    });

    return () => {
      websocket.off('MATCH_START');
      websocket.off('OPPONENT_PROGRESS');
      websocket.off('MATCH_END');
      reset();
    };
  }, []);

  useEffect(() => {
    if (countdown === 0 && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [countdown, startTime]);

  useEffect(() => {
    if (gameState && checkWin()) {
      handleWin();
    }
  }, [gameState]);

  const handleWin = () => {
    const finalTime = elapsedTime;
    const finalScore = gameState?.score || 0;

    Alert.alert(
      '🎉 Victory!',
      `You completed the game!\n\nTime: ${(finalTime / 1000).toFixed(1)}s\nScore: ${finalScore}`,
      [{ text: 'OK' }],
    );
  };

  const handleMatchEnd = (data: any) => {
    const prize = data.payoutCents / 100;

    Alert.alert(
      data.reason === 'COMPLETED' ? '🏆 Match Complete!' : 'Match Ended',
      data.winnerId
        ? `Winner: You!\nPrize: $${prize.toFixed(2)}`
        : 'Match ended - returning to lobby',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ],
    );
  };

  const handleCardPress = (type: string, index?: number) => {
    if (countdown > 0) return;

    if (!selectedPile) {
      setSelectedPile({ type, index });
      return;
    }

    let move: any = null;

    if (type === 'stock') {
      move = { type: MoveType.DRAW };
    } else if (selectedPile.type === 'waste' && type === 'tableau') {
      move = { type: MoveType.WASTE_TO_TABLEAU, to: index };
    } else if (selectedPile.type === 'waste' && type === 'foundation') {
      const wasteCard = gameState?.waste[gameState.waste.length - 1];
      if (wasteCard) {
        move = { type: MoveType.WASTE_TO_FOUNDATION, suit: wasteCard.suit };
      }
    } else if (selectedPile.type === 'tableau' && type === 'foundation') {
      const pile = gameState?.tableau[selectedPile.index!];
      const topCard = pile?.[pile.length - 1];
      if (topCard) {
        move = { type: MoveType.TABLEAU_TO_FOUNDATION, from: selectedPile.index, suit: topCard.suit };
      }
    } else if (selectedPile.type === 'tableau' && type === 'tableau') {
      move = {
        type: MoveType.TABLEAU_TO_TABLEAU,
        from: selectedPile.index,
        to: index,
        cardCount: 1,
      };
    }

    if (move && makeMove(move)) {
      websocket.emit('MOVE', {
        matchId,
        seq: moveSequence,
        moveType: move.type,
        payload: move,
      });
    }

    setSelectedPile(null);
  };

  const handleResign = () => {
    Alert.alert('Resign', 'Are you sure you want to forfeit this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resign',
        style: 'destructive',
        onPress: () => {
          websocket.emit('RESIGN', { matchId });
          navigation.navigate('Home');
        },
      },
    ]);
  };

  if (!gameState) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Loading game...</Text>
      </View>
    );
  }

  if (countdown > 0) {
    return (
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles(theme).countdownContainer}
      >
        <Text style={styles(theme).countdownNumber}>{countdown}</Text>
        <Text style={styles(theme).countdownText}>Get ready...</Text>
      </LinearGradient>
    );
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles(theme).container}>
      <LinearGradient
        colors={['#0A5C3C', '#0D7C54']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles(theme).gameBackground}
      >
        {/* Header Stats */}
        <View style={styles(theme).header}>
          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Time</Text>
            <Text style={styles(theme).statValue}>{formatTime(elapsedTime)}</Text>
          </View>

          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Score</Text>
            <Text style={styles(theme).statValue}>{gameState.score}</Text>
          </View>

          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Moves</Text>
            <Text style={styles(theme).statValue}>{gameState.moveCount}</Text>
          </View>

          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Opponent</Text>
            <Text style={styles(theme).statValue}>{opponentProgress}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles(theme).gameArea}>
          {/* Top Row: Stock, Waste, Foundations */}
          <View style={styles(theme).topRow}>
            {/* Stock Pile */}
            <TouchableOpacity onPress={() => handleCardPress('stock')}>
              {gameState.stock.length > 0 ? (
                <PlayingCard card={gameState.stock[0]} isSelected={selectedPile?.type === 'stock'} />
              ) : (
                <View style={styles(theme).emptyPile}>
                  <Text style={styles(theme).emptyPileText}>↻</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Waste Pile */}
            <TouchableOpacity onPress={() => handleCardPress('waste')}>
              {gameState.waste.length > 0 ? (
                <PlayingCard
                  card={gameState.waste[gameState.waste.length - 1]}
                  isSelected={selectedPile?.type === 'waste'}
                />
              ) : (
                <View style={styles(theme).emptyPile} />
              )}
            </TouchableOpacity>

            <View style={{ width: 20 }} />

            {/* Foundation Piles */}
            {Object.values(Suit).map((suit, index) => (
              <TouchableOpacity key={suit} onPress={() => handleCardPress('foundation', index)}>
                {gameState.foundation[suit].length > 0 ? (
                  <PlayingCard
                    card={gameState.foundation[suit][gameState.foundation[suit].length - 1]}
                    isSelected={selectedPile?.type === 'foundation' && selectedPile?.index === index}
                  />
                ) : (
                  <View style={styles(theme).foundationEmpty}>
                    <Text style={styles(theme).suitPlaceholder}>
                      {suit === Suit.HEARTS ? '♥' : suit === Suit.DIAMONDS ? '♦' : suit === Suit.CLUBS ? '♣' : '♠'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Tableau */}
          <View style={styles(theme).tableau}>
            {gameState.tableau.map((pile, pileIndex) => (
              <View key={pileIndex} style={styles(theme).tableauColumn}>
                <TouchableOpacity onPress={() => handleCardPress('tableau', pileIndex)}>
                  {pile.length === 0 ? (
                    <View style={styles(theme).emptyPile} />
                  ) : (
                    <View>
                      {pile.map((card, cardIndex) => (
                        <View
                          key={cardIndex}
                          style={{
                            marginTop: cardIndex === 0 ? 0 : 24,
                          }}
                        >
                          <PlayingCard
                            card={card}
                            isSelected={selectedPile?.type === 'tableau' && selectedPile?.index === pileIndex}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles(theme).footer}>
          <Button title="Resign" onPress={handleResign} variant="danger" theme={theme} size="small" />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gameBackground: {
      flex: 1,
    },
    countdownContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    countdownNumber: {
      fontSize: 120,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 8,
    },
    countdownText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
      textTransform: 'uppercase',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 2,
    },
    gameArea: {
      padding: theme.spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    tableau: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    tableauColumn: {
      flex: 1,
    },
    emptyPile: {
      width: 70,
      height: 98,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    emptyPileText: {
      fontSize: 32,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    foundationEmpty: {
      width: 70,
      height: 98,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    suitPlaceholder: {
      fontSize: 36,
      color: 'rgba(255, 255, 255, 0.3)',
    },
    footer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
  });
