import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react';
import { useThemeStore } from '../../store/theme.store';

export default function PrivacyPolicyScreen() {
  const { theme } = useThemeStore();

  return (
    <ScrollView style={[styles(theme).container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles(theme).content}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Privacy Policy</Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>1. Information We Collect</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We collect information you provide when creating an account, including email, name, date of birth, and payment information. We also collect gameplay data, device information, and usage statistics.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>2. How We Use Your Information</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We use your information to provide and improve our services, process payments, verify your identity for compliance, communicate with you, and ensure fair play.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>3. Information Sharing</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We do not sell your personal information. We share information with payment processors (Stripe), cloud service providers, and as required by law.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>4. Data Security</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>5. Your Rights</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        You have the right to access, correct, or delete your personal information. You may also object to processing or request data portability. Contact us to exercise these rights.
      </Text>

      <Text style={[styles(theme).section, { color: theme.colors.text }]}>6. Cookies and Tracking</Text>
      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We use cookies and similar technologies to enhance user experience, analyze usage, and provide personalized content.
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
