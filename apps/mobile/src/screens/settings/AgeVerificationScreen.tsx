import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../services/api';

export default function AgeVerificationScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to verify your age.');
      return false;
    }
    return true;
  };

  const pickImage = async (side: 'front' | 'back') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (side: 'front' | 'back') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!frontImage) {
      Alert.alert('Error', 'Please upload the front of your ID');
      return;
    }

    setUploading(true);

    try {
      // Convert images to base64
      const frontBase64 = await FileSystem.readAsStringAsync(frontImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let backBase64 = null;
      if (backImage) {
        backBase64 = await FileSystem.readAsStringAsync(backImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Upload to backend
      await api.post('/user/verify-age', {
        frontImage: `data:image/jpeg;base64,${frontBase64}`,
        backImage: backBase64 ? `data:image/jpeg;base64,${backBase64}` : null,
      });

      Alert.alert(
        'Submitted Successfully',
        'Your ID has been submitted for verification. We will review it within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit verification');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Age Verification</Text>
      <Text style={[styles(theme).subtitle, { color: theme.colors.textSecondary }]}>
        To comply with regulations, we need to verify that you are 18 years or older. Please upload a photo of your government-issued ID.
      </Text>

      {/* Front of ID */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).label, { color: theme.colors.text }]}>Front of ID *</Text>

        {frontImage ? (
          <View style={styles(theme).imageContainer}>
            <Image source={{ uri: frontImage }} style={styles(theme).image} />
            <Button
              title="Change Photo"
              onPress={() => pickImage('front')}
              variant="ghost"
              theme={theme}
              size="small"
            />
          </View>
        ) : (
          <View style={styles(theme).uploadButtons}>
            <Button
              title="Take Photo"
              onPress={() => takePhoto('front')}
              variant="secondary"
              theme={theme}
            />
            <Button
              title="Choose from Library"
              onPress={() => pickImage('front')}
              variant="secondary"
              theme={theme}
            />
          </View>
        )}
      </View>

      {/* Back of ID */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).label, { color: theme.colors.text }]}>
          Back of ID (Optional)
        </Text>

        {backImage ? (
          <View style={styles(theme).imageContainer}>
            <Image source={{ uri: backImage }} style={styles(theme).image} />
            <Button
              title="Change Photo"
              onPress={() => pickImage('back')}
              variant="ghost"
              theme={theme}
              size="small"
            />
          </View>
        ) : (
          <View style={styles(theme).uploadButtons}>
            <Button
              title="Take Photo"
              onPress={() => takePhoto('back')}
              variant="secondary"
              theme={theme}
            />
            <Button
              title="Choose from Library"
              onPress={() => pickImage('back')}
              variant="secondary"
              theme={theme}
            />
          </View>
        )}
      </View>

      {/* Guidelines */}
      <View style={[styles(theme).guidelines, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).guidelinesTitle, { color: theme.colors.text }]}>
          Photo Guidelines:
        </Text>
        <Text style={[styles(theme).guidelineText, { color: theme.colors.textSecondary }]}>
          • Entire ID must be visible{'\n'}
          • All text must be clearly readable{'\n'}
          • No glare or shadows{'\n'}
          • Photo should be in focus{'\n'}
          • Accepted: Driver's License, Passport, Government ID
        </Text>
      </View>

      {/* Submit Button */}
      <Button
        title="Submit for Verification"
        onPress={handleSubmit}
        loading={uploading}
        disabled={!frontImage}
        theme={theme}
        style={{ marginTop: theme.spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
      marginBottom: theme.spacing.xxl,
      lineHeight: 22,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    label: {
      ...theme.typography.h3,
      marginBottom: theme.spacing.md,
    },
    imageContainer: {
      gap: theme.spacing.md,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: theme.radius.lg,
      resizeMode: 'contain',
      backgroundColor: theme.colors.surface,
    },
    uploadButtons: {
      gap: theme.spacing.md,
    },
    guidelines: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      marginTop: theme.spacing.lg,
    },
    guidelinesTitle: {
      ...theme.typography.h3,
      marginBottom: theme.spacing.sm,
    },
    guidelineText: {
      ...theme.typography.body,
      lineHeight: 22,
    },
  });
