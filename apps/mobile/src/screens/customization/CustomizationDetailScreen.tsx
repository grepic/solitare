import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  customizationService,
  CustomizationItem,
  CustomizationRarity,
  CustomizationType,
} from '../../services/customization.service';

export default function CustomizationDetailScreen({ route, navigation }: any) {
  const { theme } = useThemeStore();
  const { itemId } = route.params;
  const [item, setItem] = useState<CustomizationItem | null>(null);
  const [owned, setOwned] = useState(false);
  const [equipped, setEquipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemData();
  }, [itemId]);

  const loadItemData = async () => {
    setLoading(true);
    try {
      await customizationService.initialize();

      const loadedItem = customizationService.getItem(itemId);
      setItem(loadedItem);

      if (loadedItem) {
        setOwned(customizationService.ownsItem(itemId));
        setEquipped(isItemEquipped(loadedItem));
        setIsFavorite(customizationService.isFavorite(itemId));
      }
    } catch (error) {
      console.error('Failed to load item data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isItemEquipped = (item: CustomizationItem): boolean => {
    const equippedItems = customizationService.getEquipped();
    if (!equippedItems) return false;

    switch (item.type) {
      case 'AVATAR':
        return equippedItems.avatar === item.id;
      case 'CARD_BACK':
        return equippedItems.cardBack === item.id;
      case 'TITLE':
        return equippedItems.title === item.id;
      case 'THEME':
        return equippedItems.theme === item.id;
      default:
        return false;
    }
  };

  const handlePurchase = async () => {
    if (!item || !item.price) return;

    const priceText =
      (item.price.gems ? `💎 ${item.price.gems}` : '') +
      (item.price.coins ? `🪙 ${item.price.coins}` : '');

    Alert.alert('Purchase Item', `Purchase ${item.name} for ${priceText}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Purchase',
        onPress: async () => {
          const success = await customizationService.purchaseItem(itemId);
          if (success) {
            await loadItemData();
            Alert.alert('Success!', `${item.name} purchased successfully!`);
          } else {
            Alert.alert('Purchase Failed', 'Not enough currency or item unavailable.');
          }
        },
      },
    ]);
  };

  const handleEquip = async () => {
    if (!item) return;

    const success = await customizationService.equipItem(itemId);
    if (success) {
      await loadItemData();
    }
  };

  const handleToggleFavorite = async () => {
    await customizationService.toggleFavorite(itemId);
    await loadItemData();
  };

  const getRarityColor = (rarity: CustomizationRarity): string => {
    switch (rarity) {
      case 'LEGENDARY':
        return '#FFD700';
      case 'EPIC':
        return '#9333EA';
      case 'RARE':
        return '#3B82F6';
      case 'COMMON':
        return '#6B7280';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTypeIcon = (type: CustomizationType): string => {
    switch (type) {
      case 'AVATAR':
        return '👤';
      case 'CARD_BACK':
        return '🎴';
      case 'EMOTE':
        return '😊';
      case 'TITLE':
        return '🏅';
      case 'THEME':
        return '🎨';
      default:
        return '🎁';
    }
  };

  const getUnlockMethodLabel = (item: CustomizationItem): string => {
    switch (item.unlockMethod) {
      case 'PURCHASE':
        return 'Available for Purchase';
      case 'ACHIEVEMENT':
        return `Unlock: ${item.unlockCondition || 'Complete achievement'}`;
      case 'SEASON':
        return `Season Reward: ${item.unlockCondition || item.season || 'Current season'}`;
      case 'EVENT':
        return `Event Reward: ${item.unlockCondition || 'Special event'}`;
      case 'DEFAULT':
        return 'Default Item';
      default:
        return item.unlockMethod;
    }
  };

  if (loading || !item) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).loadingText, { color: theme.colors.textSecondary }]}>
          Loading item...
        </Text>
      </View>
    );
  }

  const rarityColor = getRarityColor(item.rarity);
  const canEquip = owned && (item.type === 'AVATAR' || item.type === 'CARD_BACK' || item.type === 'TITLE' || item.type === 'THEME');

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles(theme).header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(theme).backButton}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <Text style={[styles(theme).headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>

        {owned && (
          <TouchableOpacity onPress={handleToggleFavorite} style={styles(theme).favoriteButton}>
            <Text style={{ fontSize: 24 }}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        {/* Preview */}
        <View
          style={[
            styles(theme).previewContainer,
            {
              borderBottomColor: rarityColor,
              borderBottomWidth: 4,
            },
          ]}
        >
          <LinearGradient
            colors={[rarityColor + '40', theme.colors.surface]}
            style={styles(theme).previewGradient}
          >
            {item.previewUrl || item.imageUrl ? (
              <Image
                source={{ uri: item.previewUrl || item.imageUrl }}
                style={styles(theme).previewImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles(theme).previewIcon}>{getTypeIcon(item.type)}</Text>
            )}

            {/* Badges */}
            <View style={styles(theme).badges}>
              {equipped && (
                <View style={[styles(theme).equippedBadge, { backgroundColor: theme.colors.success }]}>
                  <Text style={styles(theme).badgeText}>✓ EQUIPPED</Text>
                </View>
              )}

              {owned && !equipped && (
                <View style={[styles(theme).ownedBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles(theme).badgeText}>OWNED</Text>
                </View>
              )}

              {item.isLimited && (
                <View style={[styles(theme).limitedBadge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles(theme).badgeText}>LIMITED TIME</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Item Info */}
        <View style={styles(theme).infoSection}>
          <View style={styles(theme).nameRow}>
            <Text style={[styles(theme).itemName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <View
              style={[
                styles(theme).rarityBadge,
                { backgroundColor: rarityColor + '30', borderColor: rarityColor },
              ]}
            >
              <Text style={[styles(theme).rarityText, { color: rarityColor }]}>
                {item.rarity}
              </Text>
            </View>
          </View>

          <View style={styles(theme).typeRow}>
            <Text style={{ fontSize: 20 }}>{getTypeIcon(item.type)}</Text>
            <Text style={[styles(theme).typeText, { color: theme.colors.textSecondary }]}>
              {item.type.replace(/_/g, ' ')}
            </Text>
          </View>

          <Text style={[styles(theme).description, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>

        {/* Unlock Method */}
        <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            How to Obtain
          </Text>
          <Text style={[styles(theme).unlockMethod, { color: theme.colors.textSecondary }]}>
            {getUnlockMethodLabel(item)}
          </Text>

          {item.price && !owned && (
            <View style={styles(theme).priceBox}>
              {item.price.gems && (
                <View style={styles(theme).priceItem}>
                  <Text style={styles(theme).priceIcon}>💎</Text>
                  <Text style={[styles(theme).priceValue, { color: theme.colors.text }]}>
                    {item.price.gems}
                  </Text>
                  <Text style={[styles(theme).priceLabel, { color: theme.colors.textSecondary }]}>
                    Gems
                  </Text>
                </View>
              )}
              {item.price.coins && (
                <View style={styles(theme).priceItem}>
                  <Text style={styles(theme).priceIcon}>🪙</Text>
                  <Text style={[styles(theme).priceValue, { color: theme.colors.text }]}>
                    {item.price.coins}
                  </Text>
                  <Text style={[styles(theme).priceLabel, { color: theme.colors.textSecondary }]}>
                    Coins
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Collection Info */}
        {item.collection && (
          <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
              Collection
            </Text>
            <Text style={[styles(theme).collectionName, { color: theme.colors.primary }]}>
              {item.collection}
            </Text>
            <Text style={[styles(theme).collectionHint, { color: theme.colors.textSecondary }]}>
              Collect all items in this set for bonus rewards
            </Text>
          </View>
        )}

        {/* Season Info */}
        {item.season && (
          <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
              Season Exclusive
            </Text>
            <Text style={[styles(theme).seasonText, { color: theme.colors.textSecondary }]}>
              {item.season}
            </Text>
          </View>
        )}

        {/* Limited Time Info */}
        {item.isLimited && item.availableUntil && (
          <View style={[styles(theme).section, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles(theme).sectionTitle, { color: theme.colors.error }]}>
              ⏰ Limited Time
            </Text>
            <Text style={[styles(theme).availableText, { color: theme.colors.textSecondary }]}>
              Available until: {new Date(item.availableUntil).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles(theme).actionButtons, { backgroundColor: theme.colors.surface }]}>
        {!owned && item.unlockMethod === 'PURCHASE' && item.price && (
          <TouchableOpacity
            style={[styles(theme).purchaseButton, { backgroundColor: theme.colors.primary }]}
            onPress={handlePurchase}
          >
            <Text style={styles(theme).purchaseButtonText}>
              Purchase{' '}
              {item.price.gems && `💎 ${item.price.gems}`}
              {item.price.coins && `🪙 ${item.price.coins}`}
            </Text>
          </TouchableOpacity>
        )}

        {owned && canEquip && !equipped && (
          <TouchableOpacity
            style={[styles(theme).equipButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEquip}
          >
            <Text style={styles(theme).equipButtonText}>Equip</Text>
          </TouchableOpacity>
        )}

        {equipped && (
          <View style={[styles(theme).equippedButton, { backgroundColor: theme.colors.success }]}>
            <Text style={styles(theme).equippedButtonText}>✓ Currently Equipped</Text>
          </View>
        )}

        {owned && !canEquip && (
          <View style={[styles(theme).infoButton, { backgroundColor: theme.colors.border }]}>
            <Text style={[styles(theme).infoButtonText, { color: theme.colors.textSecondary }]}>
              {item.type === 'EMOTE' ? 'Use in games' : 'Item owned'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    headerTitle: {
      ...theme.typography.h2,
      fontSize: 18,
      flex: 1,
    },
    favoriteButton: {
      marginLeft: theme.spacing.md,
    },
    previewContainer: {
      height: 300,
    },
    previewGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    previewImage: {
      width: '80%',
      height: '80%',
    },
    previewIcon: {
      fontSize: 120,
    },
    badges: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    equippedBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    ownedBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    limitedBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    infoSection: {
      padding: theme.spacing.xl,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    itemName: {
      ...theme.typography.h1,
      fontSize: 24,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    rarityBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 2,
    },
    rarityText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    typeText: {
      ...theme.typography.body,
      fontSize: 14,
      textTransform: 'capitalize',
    },
    description: {
      ...theme.typography.body,
      fontSize: 15,
      lineHeight: 22,
    },
    section: {
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.h3,
      fontSize: 16,
      marginBottom: theme.spacing.sm,
    },
    unlockMethod: {
      ...theme.typography.body,
      fontSize: 14,
      lineHeight: 20,
    },
    priceBox: {
      flexDirection: 'row',
      gap: theme.spacing.xl,
      marginTop: theme.spacing.lg,
    },
    priceItem: {
      alignItems: 'center',
    },
    priceIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    priceValue: {
      ...theme.typography.h2,
      fontSize: 24,
      marginBottom: 2,
    },
    priceLabel: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    collectionName: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      marginBottom: theme.spacing.xs,
    },
    collectionHint: {
      ...theme.typography.caption,
      fontSize: 12,
      fontStyle: 'italic',
    },
    seasonText: {
      ...theme.typography.body,
      fontSize: 14,
    },
    availableText: {
      ...theme.typography.body,
      fontSize: 14,
    },
    actionButtons: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    purchaseButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    purchaseButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    equipButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    equipButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    equippedButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    equippedButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    infoButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    infoButtonText: {
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
  });
