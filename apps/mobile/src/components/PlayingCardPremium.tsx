import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card as CardType, Suit, Rank } from '@solitaire/engine';
import { useThemeStore } from '../store/theme.store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  isSelected?: boolean;
  cardBackTheme?: 'classic' | 'royal' | 'neon' | 'galaxy' | 'gold';
  showShimmer?: boolean;
}

/**
 * Premium Playing Card with enhanced visuals
 * - 3D shadows and depth
 * - Shimmer effects
 * - Multiple card back themes
 * - Smooth animations
 */
export const PlayingCardPremium: React.FC<CardProps> = ({
  card,
  onPress,
  disabled,
  style,
  isSelected = false,
  cardBackTheme = 'classic',
  showShimmer = false,
}) => {
  const { theme } = useThemeStore();
  const shimmerPosition = useSharedValue(-200);

  useEffect(() => {
    if (showShimmer) {
      shimmerPosition.value = withRepeat(
        withSequence(
          withTiming(200, { duration: 1500, easing: Easing.linear }),
          withTiming(-200, { duration: 0 }),
        ),
        -1,
      );
    }
  }, [showShimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }],
  }));

  const suitSymbols = {
    [Suit.HEARTS]: '♥',
    [Suit.DIAMONDS]: '♦',
    [Suit.CLUBS]: '♣',
    [Suit.SPADES]: '♠',
  };

  const rankSymbols = {
    [Rank.ACE]: 'A',
    [Rank.TWO]: '2',
    [Rank.THREE]: '3',
    [Rank.FOUR]: '4',
    [Rank.FIVE]: '5',
    [Rank.SIX]: '6',
    [Rank.SEVEN]: '7',
    [Rank.EIGHT]: '8',
    [Rank.NINE]: '9',
    [Rank.TEN]: '10',
    [Rank.JACK]: 'J',
    [Rank.QUEEN]: 'Q',
    [Rank.KING]: 'K',
  };

  const cardBackThemes = {
    classic: {
      colors: ['#1E40AF', '#3B82F6', '#60A5FA'],
      borderColor: '#1E3A8A',
    },
    royal: {
      colors: ['#7C2D12', '#DC2626', '#EF4444'],
      borderColor: '#991B1B',
    },
    neon: {
      colors: ['#581C87', '#A21CAF', '#D946EF'],
      borderColor: '#701A75',
    },
    galaxy: {
      colors: ['#0F172A', '#1E293B', '#334155'],
      borderColor: '#020617',
    },
    gold: {
      colors: ['#78350F', '#D97706', '#FBBF24'],
      borderColor: '#92400E',
    },
  };

  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;

  if (!card.faceUp) {
    const backTheme = cardBackThemes[cardBackTheme];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.cardContainer, isSelected && styles.selectedCard, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={backTheme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardBack, { borderColor: backTheme.borderColor }]}
        >
          {/* Ornate pattern */}
          <View style={styles.cardBackInner}>
            {/* Diamond pattern */}
            <View style={styles.cardBackPattern}>
              <View style={[styles.diamond, styles.diamondLarge]} />
              <View style={[styles.diamond, styles.diamondSmall]} />
            </View>

            {/* Decorative borders */}
            <View style={styles.decorativeBorder} />
          </View>

          {/* Shimmer effect */}
          {showShimmer && (
            <Animated.View style={[styles.shimmer, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const cardColor = isRed ? '#DC2626' : '#1F2937';
  const cardGlow = isRed ? '#FCA5A5' : '#9CA3AF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.cardContainer, isSelected && styles.selectedCard, style]}
      activeOpacity={0.8}
    >
      {/* Card face with gradient background */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardFace}
      >
        {/* Glow effect for selected cards */}
        {isSelected && (
          <View style={[styles.glowEffect, { backgroundColor: cardGlow }]} />
        )}

        {/* Top left corner */}
        <View style={styles.cornerTopLeft}>
          <Text style={[styles.rankSmall, { color: cardColor }]}>
            {rankSymbols[card.rank]}
          </Text>
          <Text style={[styles.suitSmall, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
        </View>

        {/* Center suit symbol with gradient */}
        <View style={styles.centerSuit}>
          <Text style={[styles.suitLarge, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
          {/* Shadow for depth */}
          <Text style={[styles.suitLarge, styles.suitShadow, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
        </View>

        {/* Bottom right corner (rotated) */}
        <View style={styles.cornerBottomRight}>
          <Text style={[styles.suitSmall, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
          <Text style={[styles.rankSmall, { color: cardColor }]}>
            {rankSymbols[card.rank]}
          </Text>
        </View>

        {/* Decorative border for face cards */}
        {(card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING) && (
          <View style={[styles.faceCardBorder, { borderColor: cardColor }]} />
        )}

        {/* Shimmer effect */}
        {showShimmer && (
          <Animated.View style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 70,
    height: 98,
    borderRadius: 10,
  },
  cardFace: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBack: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  cardBackInner: {
    flex: 1,
    margin: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardBackPattern: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '45deg' }],
  },
  diamondLarge: {
    width: '70%',
    height: '70%',
  },
  diamondSmall: {
    width: '40%',
    height: '40%',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 6,
    left: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
    zIndex: 2,
  },
  centerSuit: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rankSmall: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  suitSmall: {
    fontSize: 16,
    lineHeight: 16,
    marginTop: 2,
  },
  suitLarge: {
    fontSize: 52,
    lineHeight: 52,
    opacity: 0.12,
  },
  suitShadow: {
    position: 'absolute',
    opacity: 0.05,
    transform: [{ translateY: 2 }],
  },
  faceCardBorder: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    opacity: 0.2,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 15,
    opacity: 0.15,
    zIndex: -1,
  },
  selectedCard: {
    transform: [{ scale: 1.08 }, { translateY: -4 }],
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
  },
});
