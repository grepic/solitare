import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import api from '../../services/api';

export default function WalletScreenWeb() {
  const { theme } = useThemeStore();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    void loadWallet();
    void loadTransactions();
  }, []);

  const loadWallet = async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data } = await api.get('/wallet/transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Wallet</Text>

      <Card theme={theme}>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
          Deposits via Stripe are disabled on web preview.
        </Text>
        <Text style={{ color: theme.colors.textSecondary }}>
          Use the mobile app build to test payments.
        </Text>
      </Card>

      {wallet && (
        <Card theme={theme}>
          <Text style={[styles(theme).balanceLabel, { color: theme.colors.textSecondary }]}>
            Available Balance
          </Text>
          <Text style={[styles(theme).balance, { color: theme.colors.primary }]}>
            ${(wallet.availableCents / 100).toFixed(2)}
          </Text>
          {wallet.lockedCents > 0 && (
            <Text style={[styles(theme).locked, { color: theme.colors.textSecondary }]}>
              Locked: ${(wallet.lockedCents / 100).toFixed(2)}
            </Text>
          )}
        </Card>
      )}

      <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>

      {transactions.length === 0 ? (
        <Card theme={theme} padding={theme.spacing.md}>
          <Text style={{ color: theme.colors.textSecondary }}>No transactions yet.</Text>
        </Card>
      ) : (
        transactions.map((tx) => (
          <Card key={tx.id} theme={theme} padding={theme.spacing.md}>
            <View style={styles(theme).transaction}>
              <View>
                <Text style={{ color: theme.colors.text }}>{tx.type}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={{
                  color: tx.amountCents > 0 ? theme.colors.success : theme.colors.error,
                  fontWeight: '600',
                }}
              >
                {tx.amountCents > 0 ? '+' : ''}${(tx.amountCents / 100).toFixed(2)}
              </Text>
            </View>
          </Card>
        ))
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
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.h1,
    },
    balanceLabel: {
      ...theme.typography.caption,
    },
    balance: {
      ...theme.typography.h1,
      marginTop: theme.spacing.xs,
    },
    locked: {
      ...theme.typography.caption,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.typography.h2,
    },
    transaction: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
