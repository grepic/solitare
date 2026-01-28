import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/theme.store';

export default function TermsOfServiceScreen() {
  const { theme } = useThemeStore();

  return (
    <ScrollView style={[styles(theme).container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles(theme).content}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Terms of Service</Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>1. Acceptance of Terms</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        By accessing and using this mobile application, you accept and agree to be bound by the terms and provision of this agreement.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>2. Eligibility</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        You must be at least 18 years old to use this service. By using this service, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>3. Real Money Gaming</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        This application allows users to participate in skill-based gaming for real money. You acknowledge that there are risks involved and that outcomes are based on player skill.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>4. Account Security</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>5. Prohibited Conduct</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        You may not use bots, automated tools, or any form of cheating. Violation of this policy will result in immediate account termination and forfeiture of funds.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>6. Payments and Withdrawals</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        All payments are processed through Stripe. Withdrawals may take 3-5 business days to process. We reserve the right to request verification before processing withdrawals.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>7. Limitation of Liability</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We are not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
      </Text>

      <Text style={[styles(theme).lastUpdated, { color: theme.colors.textSecondary }]}>Last Updated: January 2026</Text>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: theme.spacing.xl },
    title: { ...theme.typography.h1, marginBottom: theme.spacing.xl },
    section: { ...theme.typography.h3, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
    text: { ...theme.typography.body, lineHeight: 22, marginBottom: theme.spacing.md },
    lastUpdated: { ...theme.typography.caption, marginTop: theme.spacing.xxl, fontStyle: 'italic' },
  });
