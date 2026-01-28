import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../../store/theme.store';
import { useGameStore } from '../../../store/game.store';
import { PlayingCardPremium } from '../components/PlayingCardPremium';
import { DraggableCardPremium } from '../components/DraggableCardPremium';
import { ParticleSystem } from '../components/ParticleSystem';
import { WinCelebration } from '../components/WinCelebration';
import { DropZone, findDropZone, triggerDrop } from '../../../components/DropZone';
import { MoveType, Suit, getHints, canAutoComplete, getAutoCompleteMoves } from '@solitaire/engine';
import { Button } from '@solitaire/ui-kit';
import websocket from '../../../services/websocket';
import { soundService } from '../../../services/sound.service';
import { hapticService } from '../../../services/haptic.service';

interface GameScreenProps {
  route: any;
  navigation: any;
}

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { theme } = useThemeStore();
  const { matchId, seed } = route.params;
  const { gameState, initGame, makeMove, checkWin, moveSequence, reset, startTime } = useGameStore();
  const [selectedPile, setSelectedPile] = useState<{ type: string; index?: number; cardIndex?: number } | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ type: string; index?: number; cardIndex?: number } | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showingHint, setShowingHint] = useState(false);

  // Premium features state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [cardBackTheme, setCardBackTheme] = useState<'classic' | 'royal' | 'neon' | 'galaxy' | 'gold'>('royal');
  const [placement, setPlacement] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [payoutCents, setPayoutCents] = useState(0);

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
              soundService.playButtonTap();
              hapticService.success();
              return 0;
            }
            hapticService.light();
            return prev - 1;
          });
        }, 1000);
      } else {
        setCountdown(0);
      }
    });

    websocket.on('STATE_SYNC', (data) => {
      setOpponentProgress(data.snapshot.opponentProgress?.movesCount ?? 0);
    });

    websocket.on('MATCH_END', (data) => {
      handleMatchEnd(data);
    });

    return () => {
      websocket.off('MATCH_START');
      websocket.off('STATE_SYNC');
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
    // Trigger premium celebrations!
    setShowConfetti(true);
    soundService.playWinFanfare();
    hapticService.winCelebration();

    // Show win modal after brief delay
    setTimeout(() => {
      setShowWinModal(true);
    }, 500);

    // Stop confetti after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const handleMatchEnd = (data: any) => {
    setPlacement(data.placement || 1);
    setTotalPlayers(data.totalPlayers || 1);
    setPayoutCents(data.payoutCents || 0);

    if (data.reason === 'COMPLETED') {
      handleWin();
    } else {
      // Non-completion - just navigate back
      Alert.alert(
        'Match Ended',
        'Returning to lobby',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      );
    }
  };

  const handleDragStart = (type: string, index?: number, cardIndex?: number) => {
    if (countdown > 0) return;
    setDraggedCard({ type, index, cardIndex });
  };

  const handleDragEnd = (x: number, y: number) => {
    if (!draggedCard) return;

    const dropZoneId = findDropZone(x, y);

    if (dropZoneId) {
      const [dropType, dropIndex] = dropZoneId.split('-');

      let move: any = null;

      if (draggedCard.type === 'waste' && dropType === 'tableau') {
        move = { type: MoveType.WASTE_TO_TABLEAU, to: parseInt(dropIndex) };
      } else if (draggedCard.type === 'waste' && dropType === 'foundation') {
        const wasteCard = gameState?.waste[gameState.waste.length - 1];
        if (wasteCard) {
          move = { type: MoveType.WASTE_TO_FOUNDATION, suit: wasteCard.suit };
        }
      } else if (draggedCard.type === 'tableau' && dropType === 'foundation') {
        const pile = gameState?.tableau[draggedCard.index!];
        const topCard = pile?.[pile.length - 1];
        if (topCard) {
          move = { type: MoveType.TABLEAU_TO_FOUNDATION, from: draggedCard.index, suit: topCard.suit };
        }
      } else if (draggedCard.type === 'tableau' && dropType === 'tableau') {
        const pile = gameState?.tableau[draggedCard.index!];
        const cardCount = draggedCard.cardIndex !== undefined && pile
          ? pile.length - draggedCard.cardIndex
          : 1;

        move = {
          type: MoveType.TABLEAU_TO_TABLEAU,
          from: draggedCard.index,
          to: parseInt(dropIndex),
          cardCount,
        };
      }

      if (move) {
        const ok = makeMove(move);

        if (ok) {
          // Success feedback!
          const isFoundationMove = move.type === MoveType.WASTE_TO_FOUNDATION ||
                                   move.type === MoveType.TABLEAU_TO_FOUNDATION;

          if (isFoundationMove) {
            soundService.playFoundationDrop();
            setShowSparkles(true);
            setTimeout(() => setShowSparkles(false), 800);
          } else {
            soundService.playCardSnap();
          }
          hapticService.cardDrop();

          websocket.emit('MOVE', {
            matchId,
            seq: moveSequence,
            moveType: move.type,
            payload: move,
          });
        } else {
          // Error feedback
          soundService.playErrorBuzz();
          hapticService.invalidMove();
        }
      }
    }

    setDraggedCard(null);
  };

  const handleCardPress = (type: string, index?: number, cardIndex?: number) => {
    if (countdown > 0) return;

    if (!selectedPile) {
      setSelectedPile({ type, index, cardIndex });
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
      const pile = gameState?.tableau[selectedPile.index!];
      // Calculate how many cards to move based on which card was selected
      const cardCount = selectedPile.cardIndex !== undefined && pile
        ? pile.length - selectedPile.cardIndex
        : 1;

      move = {
        type: MoveType.TABLEAU_TO_TABLEAU,
        from: selectedPile.index,
        to: index,
        cardCount,
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

  const handleShowHint = () => {
    if (!gameState) return;

    const hints = getHints(gameState);
    if (hints.length === 0) {
      Alert.alert('No Hints', 'No valid moves available. Try drawing from the stock pile.');
      return;
    }

    const hint = hints[0]; // Get best hint
    setShowingHint(true);

    // Show hint for 2 seconds
    setTimeout(() => setShowingHint(false), 2000);

    // Show alert with hint
    let message = '';
    if (hint.type === MoveType.WASTE_TO_FOUNDATION) {
      message = 'Try moving the waste card to the foundation';
    } else if (hint.type === MoveType.WASTE_TO_TABLEAU) {
      message = `Try moving the waste card to tableau pile ${hint.to! + 1}`;
    } else if (hint.type === MoveType.TABLEAU_TO_FOUNDATION) {
      message = `Try moving from tableau pile ${hint.from! + 1} to foundation`;
    } else if (hint.type === MoveType.TABLEAU_TO_TABLEAU) {
      message = `Try moving from tableau pile ${hint.from! + 1} to pile ${hint.to! + 1}`;
    }

    Alert.alert('Hint', message);
  };

  const handleAutoComplete = () => {
    if (!gameState) return;

    if (!canAutoComplete(gameState)) {
      Alert.alert('Not Yet', 'Auto-complete is only available when all cards are face-up.');
      return;
    }

    Alert.alert(
      'Auto-Complete',
      'Auto-complete will move all remaining cards to foundations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            const moves = getAutoCompleteMoves(gameState);
            // Execute moves one by one
            moves.forEach((move, index) => {
              setTimeout(() => {
                if (makeMove(move)) {
                  websocket.emit('MOVE', {
                    matchId,
                    seq: moveSequence + index,
                    moveType: move.type,
                    payload: move,
                  });
                }
              }, index * 300); // 300ms delay between moves
            });
          },
        },
      ]
    );
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
                <PlayingCardPremium
                  card={gameState.stock[0]}
                  cardBackTheme={cardBackTheme}
                  isSelected={selectedPile?.type === 'stock'}
                />
              ) : (
                <View style={styles(theme).emptyPile}>
                  <Text style={styles(theme).emptyPileText}>↻</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Waste Pile */}
            <TouchableOpacity onPress={() => handleCardPress('waste')}>
              {gameState.waste.length > 0 ? (
                <DraggableCardPremium
                  card={gameState.waste[gameState.waste.length - 1]}
                  cardBackTheme={cardBackTheme}
                  isSelected={selectedPile?.type === 'waste'}
                  onDragStart={() => handleDragStart('waste')}
                  onDragEnd={handleDragEnd}
                />
              ) : (
                <View style={styles(theme).emptyPile} />
              )}
            </TouchableOpacity>

            <View style={{ width: 20 }} />

            {/* Foundation Piles */}
            {Object.values(Suit).map((suit, index) => (
              <DropZone key={suit} id={`foundation-${index}`}>
                <TouchableOpacity onPress={() => handleCardPress('foundation', index)}>
                  {gameState.foundation[suit].length > 0 ? (
                    <PlayingCardPremium
                      card={gameState.foundation[suit][gameState.foundation[suit].length - 1]}
                      cardBackTheme={cardBackTheme}
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
              </DropZone>
            ))}
          </View>

          {/* Tableau */}
          <View style={styles(theme).tableau}>
            {gameState.tableau.map((pile, pileIndex) => (
              <DropZone key={pileIndex} id={`tableau-${pileIndex}`} style={styles(theme).tableauColumn}>
                {pile.length === 0 ? (
                  <TouchableOpacity onPress={() => handleCardPress('tableau', pileIndex)}>
                    <View style={styles(theme).emptyPile} />
                  </TouchableOpacity>
                ) : (
                  <View>
                    {pile.map((card, cardIndex) => (
                      <TouchableOpacity
                        key={cardIndex}
                        onPress={() => card.faceUp ? handleCardPress('tableau', pileIndex, cardIndex) : undefined}
                        disabled={!card.faceUp}
                        style={{
                          marginTop: cardIndex === 0 ? 0 : 24,
                        }}
                      >
                        <DraggableCardPremium
                          card={card}
                          cardBackTheme={cardBackTheme}
                          isSelected={
                            selectedPile?.type === 'tableau' &&
                            selectedPile?.index === pileIndex &&
                            selectedPile?.cardIndex === cardIndex
                          }
                          onDragStart={() => handleDragStart('tableau', pileIndex, cardIndex)}
                          onDragEnd={handleDragEnd}
                          disabled={!card.faceUp}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </DropZone>
            ))}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles(theme).footer}>
          <View style={styles(theme).footerRow}>
            <Button title="Hint" onPress={handleShowHint} variant="ghost" theme={theme} size="small" />
            <Button
              title="Auto"
              onPress={handleAutoComplete}
              variant="ghost"
              theme={theme}
              size="small"
              disabled={!gameState || !canAutoComplete(gameState)}
            />
          </View>
          <Button title="Resign" onPress={handleResign} variant="danger" theme={theme} size="small" />
        </View>
      </LinearGradient>

      {/* Premium Particle Effects */}
      <ParticleSystem
        type="confetti"
        count={30}
        duration={2000}
        active={showConfetti}
      />

      <ParticleSystem
        type="sparkle"
        count={15}
        duration={800}
        active={showSparkles}
      />

      {/* Win Celebration Modal */}
      <WinCelebration
        visible={showWinModal}
        placement={placement}
        totalPlayers={totalPlayers}
        completionTimeMs={elapsedTime}
        score={gameState?.score || 0}
        payoutCents={payoutCents}
        onContinue={() => {
          setShowWinModal(false);
          navigation.navigate('Home');
        }}
      />
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
      gap: theme.spacing.md,
    },
    footerRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
  });
