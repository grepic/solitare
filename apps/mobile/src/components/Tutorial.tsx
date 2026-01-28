import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button } from '@solitaire/ui-kit';

interface TutorialProps {
  visible: boolean;
  onComplete: () => void;
  theme: any;
}

const tutorialSteps = [
  {
    title: 'Welcome to Solitaire',
    description: 'Learn how to play competitive Klondike Solitaire and win real money!',
  },
  {
    title: 'Game Objective',
    description: 'Build four foundation piles from Ace to King, sorted by suit. Complete the game faster than your opponent to win!',
  },
  {
    title: 'Moving Cards',
    description: 'Tap a card and then tap where you want to move it. You can also drag cards to their destination.',
  },
  {
    title: 'Tableau Rules',
    description: 'Cards in the tableau must be placed in descending order with alternating colors (red on black, black on red).',
  },
  {
    title: 'Stock and Waste',
    description: 'Tap the stock pile to draw cards. Cards are drawn one at a time to the waste pile.',
  },
  {
    title: 'Scoring',
    description: 'Complete the game quickly for a higher score. Moving cards to foundations earns points. Compete for best time!',
  },
  {
    title: 'Match Types',
    description: 'Play practice matches for free, or enter paid matches to compete for real money prizes.',
  },
  {
    title: 'Fair Play',
    description: 'Both players get the same shuffled deck. The winner is determined by who completes it faster!',
  },
];

export const Tutorial: React.FC<TutorialProps> = ({ visible, onComplete, theme }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tutorialSteps[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles(theme).overlay}>
        <View style={[styles(theme).container, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).title, { color: theme.colors.text }]}>{step.title}</Text>
          <Text style={[styles(theme).description, { color: theme.colors.textSecondary }]}>
            {step.description}
          </Text>

          <View style={styles(theme).indicators}>
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles(theme).indicator,
                  {
                    backgroundColor: index === currentStep ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles(theme).buttons}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={[styles(theme).skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
            </TouchableOpacity>

            <Button
              title={currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
              onPress={handleNext}
              theme={theme}
            />
          </View>

          <Text style={[styles(theme).stepCounter, { color: theme.colors.textSecondary }]}>
            {currentStep + 1} / {tutorialSteps.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      padding: theme.spacing.xxl,
      borderRadius: theme.radius.xl,
    },
    title: {
      ...theme.typography.h2,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    description: {
      ...theme.typography.body,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
    },
    indicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xl,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    skipText: {
      ...theme.typography.body,
      fontWeight: '600',
    },
    stepCounter: {
      ...theme.typography.caption,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });
