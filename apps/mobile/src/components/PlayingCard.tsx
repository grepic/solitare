import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card as CardType, Suit, Rank } from '@solitaire/engine';
import { useThemeStore } from '../store/theme.store';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  isSelected?: boolean;
}

export const PlayingCard: React.FC<CardProps> = ({
  card,
  onPress,
  disabled,
  style,
  isSelected = false,
}) => {
  const { theme } = useThemeStore();

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

  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;

  if (!card.faceUp) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles(theme).cardContainer, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles(theme).cardBack}
        >
          <View style={styles(theme).cardBackInner}>
            <View style={styles(theme).cardBackPattern} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const cardColor = isRed ? theme.colors.cardRed : theme.colors.cardBlack;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles(theme).cardContainer, isSelected && styles(theme).selectedCard, style]}
      activeOpacity={0.8}
    >
      <View style={[styles(theme).cardFace, { backgroundColor: '#FFFFFF' }]}>
        {/* Top left corner */}
        <View style={styles(theme).cornerTopLeft}>
          <Text style={[styles(theme).rankSmall, { color: cardColor }]}>
            {rankSymbols[card.rank]}
          </Text>
          <Text style={[styles(theme).suitSmall, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
        </View>

        {/* Center suit symbol */}
        <View style={styles(theme).centerSuit}>
          <Text style={[styles(theme).suitLarge, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
        </View>

        {/* Bottom right corner (rotated) */}
        <View style={styles(theme).cornerBottomRight}>
          <Text style={[styles(theme).suitSmall, { color: cardColor }]}>
            {suitSymbols[card.suit]}
          </Text>
          <Text style={[styles(theme).rankSmall, { color: cardColor }]}>
            {rankSymbols[card.rank]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    cardContainer: {
      width: 70,
      height: 98,
      borderRadius: 8,
    },
    cardFace: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
      position: 'relative',
    },
    cardBack: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.primaryDark,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    cardBackInner: {
      flex: 1,
      margin: 6,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardBackPattern: {
      width: '60%',
      height: '60%',
      borderRadius: 4,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      transform: [{ rotate: '45deg' }],
    },
    cornerTopLeft: {
      position: 'absolute',
      top: 4,
      left: 6,
      alignItems: 'center',
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: 4,
      right: 6,
      alignItems: 'center',
      transform: [{ rotate: '180deg' }],
    },
    centerSuit: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rankSmall: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 16,
    },
    suitSmall: {
      fontSize: 14,
      lineHeight: 14,
    },
    suitLarge: {
      fontSize: 48,
      lineHeight: 48,
      opacity: 0.15,
    },
    selectedCard: {
      transform: [{ scale: 1.05 }],
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  });
