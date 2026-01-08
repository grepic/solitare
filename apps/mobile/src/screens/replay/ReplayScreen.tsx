import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { Button } from '@solitaire/ui-kit';
import { PlayingCard } from '../../components/PlayingCard';
import { initializeGame, executeMove, GameState } from '@solitaire/engine';
import api from '../../services/api';

interface ReplayScreenProps {
  route: any;
  navigation: any;
}

export default function ReplayScreen({ route, navigation }: ReplayScreenProps) {
  const { theme } = useThemeStore();
  const { matchId } = route.params;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per move

  useEffect(() => {
    loadReplay();
  }, [matchId]);

  useEffect(() => {
    if (isPlaying && currentMoveIndex < moves.length - 1) {
      const timer = setTimeout(() => {
        handleNext();
      }, playbackSpeed);

      return () => clearTimeout(timer);
    } else if (isPlaying && currentMoveIndex >= moves.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMoveIndex]);

  const loadReplay = async () => {
    try {
      const { data } = await api.get(`/matches/${matchId}/replay`);

      // Initialize game with the same seed
      const initialState = initializeGame(data.seed);
      setGameState(initialState);
      setMoves(data.moves);
    } catch (error) {
      console.error('Error loading replay:', error);
    }
  };

  const handleNext = () => {
    if (currentMoveIndex >= moves.length - 1 || !gameState) return;

    const nextMove = moves[currentMoveIndex + 1];
    const result = executeMove(gameState, nextMove.payload);

    if (result.success && result.newState) {
      setGameState(result.newState);
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentMoveIndex < 0) return;

    // Replay from beginning up to previous move
    const seed = moves[0]?.seed || 'default';
    let state = initializeGame(seed);

    for (let i = 0; i < currentMoveIndex; i++) {
      const result = executeMove(state, moves[i].payload);
      if (result.success && result.newState) {
        state = result.newState;
      }
    }

    setGameState(state);
    setCurrentMoveIndex(currentMoveIndex - 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    loadReplay();
    setCurrentMoveIndex(-1);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const changeSpeed = () => {
    const speeds = [2000, 1000, 500, 250];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  if (!gameState) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Loading replay...</Text>
      </View>
    );
  }

  const speedLabel = playbackSpeed === 2000 ? '0.5x' : playbackSpeed === 1000 ? '1x' : playbackSpeed === 500 ? '2x' : '4x';

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Match Replay</Text>
        <Text style={[styles(theme).subtitle, { color: theme.colors.textSecondary }]}>
          Move {currentMoveIndex + 1} / {moves.length}
        </Text>
      </View>

      {/* Game Display (simplified) */}
      <View style={styles(theme).gameDisplay}>
        <View style={styles(theme).stockWaste}>
          {gameState.stock.length > 0 && (
            <PlayingCard card={gameState.stock[0]} />
          )}
          {gameState.waste.length > 0 && (
            <PlayingCard card={gameState.waste[gameState.waste.length - 1]} />
          )}
        </View>

        <View style={styles(theme).foundations}>
          {Object.values(gameState.foundation).map((pile, index) => (
            <View key={index} style={styles(theme).foundationPile}>
              {pile.length > 0 && <PlayingCard card={pile[pile.length - 1]} />}
            </View>
          ))}
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles(theme).controls}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentMoveIndex < 0}
          style={[
            styles(theme).controlButton,
            currentMoveIndex < 0 && styles(theme).controlButtonDisabled,
          ]}
        >
          <Text style={styles(theme).controlText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} style={styles(theme).playButton}>
          <Text style={styles(theme).playText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentMoveIndex >= moves.length - 1}
          style={[
            styles(theme).controlButton,
            currentMoveIndex >= moves.length - 1 && styles(theme).controlButtonDisabled,
          ]}
        >
          <Text style={styles(theme).controlText}>⏭</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} style={styles(theme).controlButton}>
          <Text style={styles(theme).controlText}>↺</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={changeSpeed} style={styles(theme).speedButton}>
          <Text style={[styles(theme).speedText, { color: theme.colors.text }]}>{speedLabel}</Text>
        </TouchableOpacity>
      </View>

      <Button title="Close" onPress={() => navigation.goBack()} theme={theme} />
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
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
    },
    gameDisplay: {
      flex: 1,
      marginBottom: theme.spacing.xl,
    },
    stockWaste: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    foundations: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    foundationPile: {
      width: 70,
      height: 98,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    controlButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButtonDisabled: {
      opacity: 0.3,
    },
    controlText: {
      fontSize: 24,
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playText: {
      fontSize: 32,
      color: '#ffffff',
    },
    speedButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    speedText: {
      ...theme.typography.caption,
      fontWeight: '600',
    },
  });
