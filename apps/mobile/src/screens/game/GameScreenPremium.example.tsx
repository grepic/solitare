/**
 * GameScreenPremium - Complete Example
 *
 * This file shows how to integrate ALL premium features:
 * - Premium card graphics
 * - Sound effects
 * - Haptic feedback
 * - Particle systems
 * - Win celebration
 *
 * Copy relevant parts to your existing GameScreen.tsx
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import { useGameStore } from '../../store/game.store';
import { PlayingCardPremium } from '../../components/PlayingCardPremium';
import { DraggableCardPremium } from '../../components/DraggableCardPremium';
import { ParticleSystem } from '../../components/ParticleSystem';
import { WinCelebration } from '../../components/WinCelebration';
import { DropZone, findDropZone } from '../../components/DropZone';
import { MoveType, Suit, getHints, canAutoComplete, getAutoCompleteMoves } from '@solitaire/engine';
import { Button } from '@solitaire/ui-kit';
import { soundService } from '../../services/sound.service';
import { hapticService } from '../../services/haptic.service';
import websocket from '../../services/websocket';

interface GameScreenPremiumProps {
  route: any;
  navigation: any;
}

export default function GameScreenPremium({ route, navigation }: GameScreenPremiumProps) {
  const { theme } = useThemeStore();
  const { matchId, seed } = route.params;
  const { gameState, initGame, makeMove, checkWin, reset, startTime } = useGameStore();

  // State
  const [draggedCard, setDraggedCard] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Premium features state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [cardBackTheme, setCardBackTheme] = useState<'classic' | 'royal' | 'neon' | 'galaxy' | 'gold'>('royal');
  const [placement, setPlacement] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [payoutCents, setPayoutCents] = useState(0);

  // Initialize sound service
  useEffect(() => {
    soundService.initialize();

    return () => {
      soundService.cleanup();
    };
  }, []);

  // Initialize game
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
              // Play start sound
              soundService.playButtonTap();
              hapticService.success();
              return 0;
            }
            // Countdown beep
            hapticService.light();
            return prev - 1;
          });
        }, 1000);
      } else {
        setCountdown(0);
      }
    });

    websocket.on('MATCH_END', (data) => {
      handleMatchEnd(data);
    });

    return () => {
      websocket.off('MATCH_START');
      websocket.off('MATCH_END');
      reset();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (countdown === 0 && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [countdown, startTime]);

  // Win detection
  useEffect(() => {
    if (gameState && checkWin()) {
      handleWin();
    }
  }, [gameState]);

  const handleWin = () => {
    // Trigger all celebrations!
    setShowConfetti(true);
    soundService.playWinFanfare();
    hapticService.winCelebration();

    // Show modal after brief delay
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
      let isFoundationMove = false;

      // Determine move type
      if (draggedCard.type === 'waste' && dropType === 'tableau') {
        move = { type: MoveType.WASTE_TO_TABLEAU, to: parseInt(dropIndex) };
      } else if (draggedCard.type === 'waste' && dropType === 'foundation') {
        const wasteCard = gameState?.waste[gameState.waste.length - 1];
        if (wasteCard) {
          move = { type: MoveType.WASTE_TO_FOUNDATION, suit: wasteCard.suit };
          isFoundationMove = true;
        }
      } else if (draggedCard.type === 'tableau' && dropType === 'foundation') {
        const pile = gameState?.tableau[draggedCard.index!];
        const topCard = pile?.[pile.length - 1];
        if (topCard) {
          move = { type: MoveType.TABLEAU_TO_FOUNDATION, from: draggedCard.index, suit: topCard.suit };
          isFoundationMove = true;
        }
      } else if (draggedCard.type === 'tableau' && dropType === 'tableau') {
        const pile = gameState?.tableau[draggedCard.index!];
        const cardCount = draggedCard.cardIndex !== undefined
          ? pile.length - draggedCard.cardIndex
          : 1;

        move = {
          type: MoveType.TABLEAU_TO_TABLEAU,
          from: draggedCard.index,
          to: parseInt(dropIndex),
          cardCount,
        };
      }

      // Execute move
      if (move) {
        const result = makeMove(move);

        if (result.success) {
          // Success feedback!
          if (isFoundationMove) {
            soundService.playFoundationDrop();
            setShowSparkles(true);
            setTimeout(() => setShowSparkles(false), 800);
          } else {
            soundService.playCardSnap();
          }
          hapticService.cardDrop();
        } else {
          // Error feedback
          soundService.playErrorBuzz();
          hapticService.invalidMove();
        }
      }
    }

    setDraggedCard(null);
  };

  const handleDrawCard = () => {
    if (countdown > 0) return;

    const move = { type: MoveType.DRAW };
    const result = makeMove(move);

    if (result.success) {
      soundService.playDrawCard();
      hapticService.light();
    } else {
      hapticService.error();
    }
  };

  const handleAutoComplete = () => {
    if (!canAutoComplete(gameState)) return;

    soundService.playButtonTap();
    hapticService.buttonTap();

    const moves = getAutoCompleteMoves(gameState);
    let delay = 0;

    moves.forEach((move) => {
      setTimeout(() => {
        makeMove(move);
        soundService.playFoundationDrop();
        hapticService.light();
      }, delay);
      delay += 300;
    });
  };

  const handleHint = () => {
    const hints = getHints(gameState);
    if (hints.length > 0) {
      soundService.playButtonTap();
      hapticService.buttonTap();
      // Show hint UI (implement as needed)
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.backgroundAlt]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.score}>Score: {gameState?.score || 0}</Text>
      </View>

      {/* Countdown overlay */}
      {countdown > 0 && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Game board */}
      <ScrollView style={styles.gameBoard}>
        {/* Foundation piles */}
        <View style={styles.foundationRow}>
          {[Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES].map((suit) => (
            <DropZone key={suit} id={`foundation-${suit}`} style={styles.foundationPile}>
              {gameState?.foundation[suit].map((card, idx) => (
                <PlayingCardPremium
                  key={`${suit}-${idx}`}
                  card={card}
                  cardBackTheme={cardBackTheme}
                  style={idx > 0 ? styles.stackedCard : undefined}
                />
              ))}
              {gameState?.foundation[suit].length === 0 && (
                <View style={styles.emptyFoundation}>
                  <Text style={styles.suitSymbol}>{getSuitSymbol(suit)}</Text>
                </View>
              )}
            </DropZone>
          ))}
        </View>

        {/* Stock and Waste */}
        <View style={styles.stockRow}>
          <TouchableOpacity onPress={handleDrawCard} disabled={countdown > 0}>
            <View style={styles.stockPile}>
              {gameState?.stock.length > 0 ? (
                <PlayingCardPremium
                  card={gameState.stock[gameState.stock.length - 1]}
                  cardBackTheme={cardBackTheme}
                />
              ) : (
                <View style={styles.emptyStock} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.wastePile}>
            {gameState?.waste.length > 0 && (
              <DraggableCardPremium
                card={gameState.waste[gameState.waste.length - 1]}
                isSelected={draggedCard?.type === 'waste'}
                onDragStart={() => handleDragStart('waste')}
                onDragEnd={handleDragEnd}
                cardBackTheme={cardBackTheme}
                disabled={countdown > 0}
              />
            )}
          </View>
        </View>

        {/* Tableau */}
        <View style={styles.tableauRow}>
          {gameState?.tableau.map((pile, pileIndex) => (
            <DropZone key={pileIndex} id={`tableau-${pileIndex}`} style={styles.tableauPile}>
              {pile.map((card, cardIndex) => (
                <DraggableCardPremium
                  key={`${pileIndex}-${cardIndex}`}
                  card={card}
                  isSelected={draggedCard?.index === pileIndex && draggedCard?.cardIndex === cardIndex}
                  onDragStart={() => handleDragStart('tableau', pileIndex, cardIndex)}
                  onDragEnd={handleDragEnd}
                  cardBackTheme={cardBackTheme}
                  disabled={!card.faceUp || countdown > 0}
                  style={cardIndex > 0 ? { marginTop: -60 } : undefined}
                />
              ))}
              {pile.length === 0 && (
                <View style={styles.emptyTableau} />
              )}
            </DropZone>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button variant="outline" onPress={handleHint}>
          <Text>💡 Hint</Text>
        </Button>
        <Button
          variant="solid"
          onPress={handleAutoComplete}
          disabled={!canAutoComplete(gameState)}
        >
          <Text>✨ Auto Complete</Text>
        </Button>
      </View>

      {/* Particle effects */}
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

      {/* Win celebration */}
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
    </LinearGradient>
  );
}

// Helper functions
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getSuitSymbol = (suit: Suit) => {
  const symbols = {
    [Suit.HEARTS]: '♥',
    [Suit.DIAMONDS]: '♦',
    [Suit.CLUBS]: '♣',
    [Suit.SPADES]: '♠',
  };
  return symbols[suit];
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  timer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFF',
  },
  gameBoard: {
    flex: 1,
    padding: 16,
  },
  foundationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  foundationPile: {
    width: 70,
    height: 98,
    borderRadius: 10,
    position: 'relative',
  },
  emptyFoundation: {
    width: 70,
    height: 98,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitSymbol: {
    fontSize: 32,
    opacity: 0.3,
  },
  stockRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  stockPile: {
    width: 70,
    height: 98,
  },
  wastePile: {
    width: 70,
    height: 98,
  },
  emptyStock: {
    width: 70,
    height: 98,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  tableauRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tableauPile: {
    width: 70,
    minHeight: 98,
  },
  emptyTableau: {
    width: 70,
    height: 98,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  stackedCard: {
    marginTop: -80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 12,
  },
});
