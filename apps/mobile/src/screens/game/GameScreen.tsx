import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { useGameStore } from '../../store/game.store';
import { PlayingCard } from '../../components/PlayingCard';
import { MoveType, Suit, Card } from '@solitaire/engine';
import { Button } from '@solitaire/ui-kit';
import websocket from '../../services/websocket';

interface GameScreenProps {
  route: any;
  navigation: any;
}

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { theme } = useThemeStore();
  const { matchId, seed } = route.params;
  const { gameState, initGame, makeMove, checkWin, moveSequence, reset } = useGameStore();
  const [selectedPile, setSelectedPile] = useState<{ type: string; index?: number } | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Initialize game
    initGame(seed, matchId);

    // Setup WebSocket listeners
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
    // Check win after each move
    if (gameState && checkWin()) {
      handleWin();
    }
  }, [gameState]);

  const handleWin = () => {
    const finalTime = Date.now() - (useGameStore.getState().startTime || 0);
    const finalScore = gameState?.score || 0;

    Alert.alert('Victory!', `You won! Time: ${(finalTime / 1000).toFixed(1)}s`, [
      {
        text: 'OK',
        onPress: () => {
          // WebSocket will handle MATCH_END
        },
      },
    ]);
  };

  const handleMatchEnd = (data: any) => {
    const isWinner = data.winnerId === matchId; // Simplified
    const prize = data.payoutCents / 100;

    Alert.alert(
      isWinner ? '🎉 You Won!' : 'Match Ended',
      isWinner ? `You won $${prize.toFixed(2)}!` : 'Better luck next time!',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home');
          },
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

    // Execute move based on selection
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
        cardCount: 1, // Simplified - just moving one card
      };
    }

    if (move && makeMove(move)) {
      // Send move to server
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
    Alert.alert('Resign', 'Are you sure you want to resign?', [
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
      <View
        style={[
          styles(theme).container,
          { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={[styles(theme).countdown, { color: theme.colors.primary }]}>{countdown}</Text>
        <Text style={{ color: theme.colors.text, marginTop: 16 }}>Get ready...</Text>
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.tableauGreen }]}>
      <View style={styles(theme).header}>
        <View>
          <Text style={styles(theme).headerText}>Score: {gameState.score}</Text>
          <Text style={styles(theme).headerText}>Moves: {gameState.moveCount}</Text>
        </View>
        <View>
          <Text style={styles(theme).headerText}>Opponent: {opponentProgress} moves</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles(theme).gameArea}>
        {/* Stock & Waste */}
        <View style={styles(theme).topRow}>
          <TouchableOpacity
            style={styles(theme).stockPile}
            onPress={() => handleCardPress('stock')}
          >
            {gameState.stock.length > 0 ? (
              <PlayingCard card={gameState.stock[0]} />
            ) : (
              <View style={styles(theme).emptyPile}>
                <Text style={{ color: theme.colors.textSecondary }}>↻</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(theme).wastePile}
            onPress={() => handleCardPress('waste')}
          >
            {gameState.waste.length > 0 ? (
              <PlayingCard card={gameState.waste[gameState.waste.length - 1]} />
            ) : (
              <View style={styles(theme).emptyPile} />
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Foundations */}
          {Object.values(Suit).map((suit, index) => (
            <TouchableOpacity
              key={suit}
              style={styles(theme).foundationPile}
              onPress={() => handleCardPress('foundation', index)}
            >
              {gameState.foundation[suit].length > 0 ? (
                <PlayingCard card={gameState.foundation[suit][gameState.foundation[suit].length - 1]} />
              ) : (
                <View style={styles(theme).emptyPile}>
                  <Text style={{ fontSize: 24, opacity: 0.3 }}>
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
            <TouchableOpacity
              key={pileIndex}
              style={styles(theme).tableauPile}
              onPress={() => handleCardPress('tableau', pileIndex)}
            >
              {pile.length === 0 ? (
                <View style={styles(theme).emptyPile} />
              ) : (
                pile.map((card, cardIndex) => (
                  <View
                    key={cardIndex}
                    style={{
                      position: cardIndex === 0 ? 'relative' : 'absolute',
                      top: cardIndex * 20,
                    }}
                  >
                    <PlayingCard card={card} />
                  </View>
                ))
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles(theme).footer}>
        <Button title="Resign" onPress={handleResign} variant="danger" theme={theme} size="small" />
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    headerText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    countdown: {
      fontSize: 72,
      fontWeight: '700',
    },
    gameArea: {
      padding: theme.spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    stockPile: {
      width: 60,
    },
    wastePile: {
      width: 60,
    },
    foundationPile: {
      width: 60,
    },
    tableau: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    tableauPile: {
      flex: 1,
      minHeight: 200,
    },
    emptyPile: {
      width: 60,
      height: 84,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      padding: theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
  });
