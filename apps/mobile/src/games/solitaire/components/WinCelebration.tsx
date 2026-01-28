import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@solitaire/ui-kit';
import { ParticleSystem } from '../../../components/ParticleSystem';
import { soundService } from '../../../services/sound.service';
import { hapticService } from '../../../services/haptic.service';
import { useThemeStore } from '../../../store/theme.store';

interface WinCelebrationProps {
  visible: boolean;
  placement: number;
  totalPlayers: number;
  completionTimeMs: number;
  score: number;
  payoutCents?: number;
  onContinue: () => void;
}

/**
 * Win Celebration Modal
 * Shows when player completes the game
 * - Animated trophy/medal
 * - Confetti particles
 * - Stats display
 * - Payout information
 */
export const WinCelebration: React.FC<WinCelebrationProps> = ({
  visible,
  placement,
  totalPlayers,
  completionTimeMs,
  score,
  payoutCents,
  onContinue,
}) => {
  const { theme } = useThemeStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Play celebration effects
      soundService.playWinFanfare();
      hapticService.winCelebration();

      // Animate entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.5),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for trophy
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const getMedalEmoji = (place: number) => {
    if (place === 1) return '🏆';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '🎯';
  };

  const getPlacementText = (place: number) => {
    if (place === 1) return '1st Place!';
    if (place === 2) return '2nd Place!';
    if (place === 3) return '3rd Place!';
    return `${place}th Place`;
  };

  const getPlacementColor = (place: number) => {
    if (place === 1) return ['#FFD700', '#FFA500'];
    if (place === 2) return ['#C0C0C0', '#A8A8A8'];
    if (place === 3) return ['#CD7F32', '#B87333'];
    return ['#4B5563', '#374151'];
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Confetti particles */}
        <ParticleSystem type="confetti" count={30} duration={2000} active={visible} />

        {/* Celebration content */}
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={getPlacementColor(placement)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            {/* Trophy/Medal */}
            <Animated.View
              style={[
                styles.medalContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            >
              <Text style={styles.medalEmoji}>{getMedalEmoji(placement)}</Text>
            </Animated.View>

            {/* Placement text */}
            <Text style={styles.placementText}>{getPlacementText(placement)}</Text>
            <Text style={styles.subtitle}>
              Out of {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>⏱️ Time</Text>
                <Text style={styles.statValue}>{formatTime(completionTimeMs)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>⭐ Score</Text>
                <Text style={styles.statValue}>{score}</Text>
              </View>
              {payoutCents !== undefined && payoutCents > 0 && (
                <View style={[styles.statRow, styles.payoutRow]}>
                  <Text style={styles.statLabel}>💰 Prize</Text>
                  <Text style={styles.payoutValue}>${(payoutCents / 100).toFixed(2)}</Text>
                </View>
              )}
            </View>

            {/* Continue button */}
            <Button
              title="Continue"
              theme={theme}
              variant="primary"
              onPress={() => {
                hapticService.buttonTap();
                soundService.playButtonTap();
                onContinue();
              }}
              style={styles.continueButton}
              textStyle={styles.continueButtonText}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBackground: {
    padding: 32,
    alignItems: 'center',
  },
  medalContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  medalEmoji: {
    fontSize: 64,
  },
  placementText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  payoutRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  payoutValue: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
