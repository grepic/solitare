import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Input } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../../services/api';

export default function WalletScreen() {
  const { theme } = useThemeStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallet();
    loadTransactions();
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

  const handleDeposit = async () => {
    setLoading(true);

    try {
      const amountCents = Math.round(parseFloat(depositAmount) * 100);

      // Create payment intent
      const { data } = await api.post('/wallet/deposit-intent', { amountCents });

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'Solitaire Smash',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        Alert.alert('Payment Cancelled', paymentError.message);
      } else {
        Alert.alert('Success', 'Deposit successful!');
        loadWallet();
        loadTransactions();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Wallet</Text>

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

      <Card theme={theme}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          Deposit Funds
        </Text>
        <Input
          label="Amount (USD)"
          value={depositAmount}
          onChangeText={setDepositAmount}
          keyboardType="numeric"
          placeholder="10.00"
          theme={theme}
        />
        <Button
          title="Deposit"
          onPress={handleDeposit}
          loading={loading}
          theme={theme}
        />
      </Card>

      <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
        Recent Transactions
      </Text>

      {transactions.map((tx) => (
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
      ))}
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
