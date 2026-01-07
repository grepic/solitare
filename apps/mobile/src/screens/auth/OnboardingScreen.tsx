import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';

export default function OnboardingScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: 'Skill-Based Solitaire',
      description: 'Compete head-to-head in fair, skill-based matches. Same deck, same rules.',
    },
    {
      title: 'Win Real Money',
      description: 'Play for cash prizes. Fast, secure, and transparent payouts.',
    },
    {
      title: 'Fair Play Guaranteed',
      description: 'Age 18+. Legal skill-based competition. Not gambling.',
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles(theme).content}>
        <View style={styles(theme).pageContainer}>
          <Text style={[styles(theme).title, { color: theme.colors.text }]}>
            {pages[currentPage].title}
          </Text>
          <Text style={[styles(theme).description, { color: theme.colors.textSecondary }]}>
            {pages[currentPage].description}
          </Text>
        </View>

        <View style={styles(theme).dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles(theme).dot,
                {
                  backgroundColor:
                    index === currentPage ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles(theme).footer}>
        <Button
          title={currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          theme={theme}
        />
        <Button
          title="Skip"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          theme={theme}
        />
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    pageContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxl,
    },
    title: {
      ...theme.typography.h1,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    description: {
      ...theme.typography.body,
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
    },
    footer: {
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
  });
