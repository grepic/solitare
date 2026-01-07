import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { MatchTier, MATCH_TIER_CONFIG } from '@solitaire/shared';
import api from '../../services/api';
import websocket from '../../services/websocket';

export default function HomeScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { user, accessToken } = useAuthStore();
  const [wallet, setWallet] = useState<any>(null);
  const [inQueue, setInQueue] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MatchTier | null>(null);

  useEffect(() => {
    loadWallet();
    setupWebSocket();

    return () => {
      websocket.disconnect();
    };
  }, []);

  const loadWallet = async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const setupWebSocket = () => {
    if (!accessToken) return;

    websocket.connect(accessToken);

    websocket.on('MATCH_FOUND', (data) => {
      setInQueue(false);
      Alert.alert('Match Found!', `Playing against ${data.opponent?.nickname}`, [
        {
          text: 'Ready',
          onPress: () => {
            websocket.emit('MATCH_READY', { matchId: data.matchId });
            navigation.navigate('Game', { matchId: data.matchId, seed: data.seed });
          },
        },
      ]);
    });

    websocket.on('ERROR', (data) => {
      Alert.alert('Error', data.message);
      setInQueue(false);
    });
  };

  const handleJoinQueue = (tier: MatchTier) => {
    const config = MATCH_TIER_CONFIG[tier];

    if (!config.isPractice && wallet && wallet.availableCents < config.entryFeeCents) {
      Alert.alert('Insufficient Balance', 'Please deposit funds to play this tier');
      return;
    }

    setSelectedTier(tier);
    setInQueue(true);
    websocket.emit('QUEUE_JOIN', { tier });
  };

  const handleCancelQueue = () => {
    if (selectedTier) {
      websocket.emit('QUEUE_CANCEL', { tier: selectedTier });
    }
    setInQueue(false);
    setSelectedTier(null);
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <View style={styles(theme).header}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>
          Welcome, {user?.nickname}!
        </Text>
        {wallet && (
          <Text style={[styles(theme).balance, { color: theme.colors.primary }]}>
            Balance: ${(wallet.availableCents / 100).toFixed(2)}
          </Text>
        )}
      </View>

      <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
        {inQueue ? 'Finding Match...' : 'Select Match Type'}
      </Text>

      {inQueue ? (
        <Card theme={theme}>
          <Text style={{ color: theme.colors.text, textAlign: 'center', marginBottom: 16 }}>
            Looking for opponent...
          </Text>
          <Button title="Cancel" onPress={handleCancelQueue} variant="secondary" theme={theme} />
        </Card>
      ) : (
        <>
          <Card theme={theme}>
            <Text style={[styles(theme).tierTitle, { color: theme.colors.text }]}>
              Practice (Free)
            </Text>
            <Text style={[styles(theme).tierDesc, { color: theme.colors.textSecondary }]}>
              Practice your skills - no entry fee
            </Text>
            <Button
              title="Play Practice"
              onPress={() => handleJoinQueue(MatchTier.PRACTICE)}
              variant="secondary"
              theme={theme}
            />
          </Card>

          <Card theme={theme}>
            <Text style={[styles(theme).tierTitle, { color: theme.colors.text }]}>$1 Match</Text>
            <Text style={[styles(theme).tierDesc, { color: theme.colors.textSecondary }]}>
              Win $1.80 | Entry: $1.00
            </Text>
            <Button
              title="Join $1 Match"
              onPress={() => handleJoinQueue(MatchTier.TIER_1)}
              theme={theme}
            />
          </Card>

          <Card theme={theme}>
            <Text style={[styles(theme).tierTitle, { color: theme.colors.text }]}>$5 Match</Text>
            <Text style={[styles(theme).tierDesc, { color: theme.colors.textSecondary }]}>
              Win $9.00 | Entry: $5.00
            </Text>
            <Button
              title="Join $5 Match"
              onPress={() => handleJoinQueue(MatchTier.TIER_5)}
              theme={theme}
            />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h1,
    },
    balance: {
      ...theme.typography.h2,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.typography.h2,
    },
    tierTitle: {
      ...theme.typography.h3,
      marginBottom: theme.spacing.xs,
    },
    tierDesc: {
      ...theme.typography.body,
      marginBottom: theme.spacing.md,
    },
  });
