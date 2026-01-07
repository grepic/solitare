import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card as CardType, Suit, Rank } from '@solitaire/engine';
import { useThemeStore } from '../../store/theme.store';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

export const PlayingCard: React.FC<CardProps> = ({ card, onPress, disabled, style }) => {
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
        style={[styles(theme).card, styles(theme).cardBack, style]}
      >
        <View style={styles(theme).cardBackPattern} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles(theme).card,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
        style,
      ]}
    >
      <Text style={[styles(theme).rank, { color: isRed ? theme.colors.cardRed : theme.colors.cardBlack }]}>
        {rankSymbols[card.rank]}
      </Text>
      <Text style={[styles(theme).suit, { color: isRed ? theme.colors.cardRed : theme.colors.cardBlack }]}>
        {suitSymbols[card.suit]}
      </Text>
    </TouchableOpacity>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: 60,
      height: 84,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    cardBack: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primaryDark,
    },
    cardBackPattern: {
      width: '80%',
      height: '80%',
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: theme.colors.background,
      opacity: 0.3,
    },
    rank: {
      fontSize: 20,
      fontWeight: '700',
      position: 'absolute',
      top: 4,
      left: 6,
    },
    suit: {
      fontSize: 32,
      fontWeight: '400',
    },
  });
