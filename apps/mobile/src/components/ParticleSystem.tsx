import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface ParticleSystemProps {
  type: 'sparkle' | 'confetti' | 'trail';
  count?: number;
  duration?: number;
  colors?: string[];
  active?: boolean;
}

/**
 * Particle System for visual effects
 * - Sparkles: Small glittering particles
 * - Confetti: Celebration particles
 * - Trail: Following particles for drag
 */
export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  count = 20,
  duration = 1000,
  colors = ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'],
  active = true,
}) => {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    // Initialize particles
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1),
      color: colors[i % colors.length],
    }));

    // Animate based on type
    if (type === 'confetti') {
      animateConfetti();
    } else if (type === 'sparkle') {
      animateSparkle();
    } else if (type === 'trail') {
      animateTrail();
    }

    return () => {
      // Cleanup
      particles.current.forEach((p) => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.opacity.stopAnimation();
        p.rotation.stopAnimation();
        p.scale.stopAnimation();
      });
    };
  }, [active, type]);

  const animateConfetti = () => {
    particles.current.forEach((particle, index) => {
      const delay = index * 50;
      const randomX = (Math.random() - 0.5) * 300;
      const randomRotation = Math.random() * 720;

      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.x, {
            toValue: randomX,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.y, {
            toValue: 400,
            duration: duration,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.rotation, {
            toValue: randomRotation,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const animateSparkle = () => {
    particles.current.forEach((particle, index) => {
      const delay = index * 100;
      const randomX = (Math.random() - 0.5) * 100;
      const randomY = (Math.random() - 0.5) * 100;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 1.5,
                duration: 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0,
                duration: 300,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.x, {
              toValue: randomX,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: randomY,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    });
  };

  const animateTrail = () => {
    particles.current.forEach((particle, index) => {
      const delay = index * 20;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    });
  };

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
