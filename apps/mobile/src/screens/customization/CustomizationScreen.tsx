import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  customizationService,
  CustomizationItem,
  CustomizationType,
  CustomizationRarity,
} from '../../services/customization.service';

type TabType = 'shop' | 'owned' | 'favorites';
type FilterType = 'ALL' | CustomizationType;

export default function CustomizationScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [items, setItems] = useState<CustomizationItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<CustomizationItem[]>([]);
  const [limitedItems, setLimitedItems] = useState<CustomizationItem[]>([]);
  const [equipped, setEquipped] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomizationData();
  }, [activeTab, filter]);

  const loadCustomizationData = async () => {
    setLoading(true);
    try {
      await customizationService.initialize();

      // Load based on tab
      let loadedItems: CustomizationItem[] = [];

      switch (activeTab) {
        case 'shop':
          loadedItems = customizationService.getShopItems();
          setFeaturedItems(customizationService.getFeaturedItems());
          setLimitedItems(customizationService.getLimitedTimeItems());
          break;
        case 'owned':
          loadedItems = customizationService.getOwnedItems();
          break;
        case 'favorites':
          loadedItems = customizationService.getFavoriteItems();
          break;
      }

      // Apply filter
      if (filter !== 'ALL') {
        loadedItems = loadedItems.filter((item) => item.type === filter);
      }

      setItems(loadedItems);
      setEquipped(customizationService.getEquipped());
    } catch (error) {
      console.error('Failed to load customization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await customizationService.refresh();
    await loadCustomizationData();
    setRefreshing(false);
  };

  const handleItemPress = (item: CustomizationItem) => {
    navigation.navigate('CustomizationDetail', { itemId: item.id });
  };

  const handleQuickEquip = async (item: CustomizationItem) => {
    const success = await customizationService.equipItem(item.id);
    if (success) {
      await loadCustomizationData();
    }
  };

  const handleToggleFavorite = async (item: CustomizationItem) => {
    await customizationService.toggleFavorite(item.id);
    await loadCustomizationData();
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

  const isEquipped = (item: CustomizationItem): boolean => {
    if (!equipped) return false;

    switch (item.type) {
      case 'AVATAR':
        return equipped.avatar === item.id;
      case 'CARD_BACK':
        return equipped.cardBack === item.id;
      case 'TITLE':
        return equipped.title === item.id;
      case 'THEME':
        return equipped.theme === item.id;
      default:
        return false;
    }
  };

  const renderFeaturedItem = ({ item }: { item: CustomizationItem }) => {
    const isFav = customizationService.isFavorite(item.id);

    return (
      <TouchableOpacity
        style={[
          styles(theme).featuredCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getRarityColor(item.rarity),
            borderWidth: 2,
          },
        ]}
        onPress={() => handleItemPress(item)}
      >
        <LinearGradient
          colors={[getRarityColor(item.rarity) + '40', 'transparent']}
          style={styles(theme).featuredGradient}
        >
          <Text style={styles(theme).featuredIcon}>{getTypeIcon(item.type)}</Text>

          <View style={styles(theme).featuredInfo}>
            <Text style={[styles(theme).featuredName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles(theme).featuredRarity, { color: getRarityColor(item.rarity) }]}>
              {item.rarity}
            </Text>
          </View>

          {item.price && (
            <View style={styles(theme).featuredPrice}>
              <Text style={[styles(theme).priceText, { color: theme.colors.text }]}>
                {item.price.gems && `💎 ${item.price.gems}`}
                {item.price.coins && `🪙 ${item.price.coins}`}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: CustomizationItem }) => {
    const owned = customizationService.ownsItem(item.id);
    const equipped = isEquipped(item);
    const isFav = customizationService.isFavorite(item.id);

    return (
      <TouchableOpacity
        style={[
          styles(theme).itemCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getRarityColor(item.rarity),
            borderWidth: 1,
          },
        ]}
        onPress={() => handleItemPress(item)}
      >
        {/* Rarity Indicator */}
        <View
          style={[
            styles(theme).rarityIndicator,
            { backgroundColor: getRarityColor(item.rarity) },
          ]}
        />

        {/* Preview */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles(theme).itemImage} />
        ) : (
          <View style={styles(theme).itemImagePlaceholder}>
            <Text style={styles(theme).itemIcon}>{getTypeIcon(item.type)}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles(theme).itemContent}>
          <Text style={[styles(theme).itemName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles(theme).itemDescription, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>

          {/* Badges */}
          <View style={styles(theme).itemBadges}>
            <View
              style={[
                styles(theme).rarityBadge,
                { backgroundColor: getRarityColor(item.rarity) + '30' },
              ]}
            >
              <Text style={[styles(theme).rarityText, { color: getRarityColor(item.rarity) }]}>
                {item.rarity}
              </Text>
            </View>

            {item.isLimited && (
              <View style={[styles(theme).limitedBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles(theme).limitedText}>LIMITED</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles(theme).itemActions}>
            {owned ? (
              <>
                {(item.type === 'AVATAR' ||
                  item.type === 'CARD_BACK' ||
                  item.type === 'TITLE' ||
                  item.type === 'THEME') && (
                  <TouchableOpacity
                    style={[
                      styles(theme).equipButton,
                      {
                        backgroundColor: equipped ? theme.colors.success : theme.colors.primary,
                      },
                    ]}
                    onPress={() => !equipped && handleQuickEquip(item)}
                    disabled={equipped}
                  >
                    <Text style={styles(theme).equipText}>
                      {equipped ? '✓ Equipped' : 'Equip'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles(theme).favoriteButton, { borderColor: theme.colors.border }]}
                  onPress={() => handleToggleFavorite(item)}
                >
                  <Text style={{ fontSize: 16 }}>{isFav ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles(theme).priceContainer}>
                {item.price ? (
                  <>
                    {item.price.gems && (
                      <Text style={[styles(theme).priceText, { color: theme.colors.text }]}>
                        💎 {item.price.gems}
                      </Text>
                    )}
                    {item.price.coins && (
                      <Text style={[styles(theme).priceText, { color: theme.colors.text }]}>
                        🪙 {item.price.coins}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text
                    style={[styles(theme).unlockText, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.unlockCondition || item.unlockMethod}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles(theme).header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Customization 🎨</Text>
      </View>

      {/* Tabs */}
      <View style={styles(theme).tabs}>
        {(['shop', 'owned', 'favorites'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles(theme).tab,
              activeTab === tab && styles(theme).tabActive,
              {
                backgroundColor: activeTab === tab ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles(theme).tabText,
                {
                  color: activeTab === tab ? '#FFFFFF' : theme.colors.textSecondary,
                },
              ]}
            >
              {tab === 'shop' && '🛍️ Shop'}
              {tab === 'owned' && '📦 Owned'}
              {tab === 'favorites' && '❤️ Favorites'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filter */}
      <View style={styles(theme).filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', 'AVATAR', 'CARD_BACK', 'EMOTE', 'TITLE', 'THEME'] as FilterType[]).map(
            (f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles(theme).filterChip,
                  {
                    backgroundColor: filter === f ? theme.colors.primary : theme.colors.surface,
                  },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles(theme).filterText,
                    {
                      color: filter === f ? '#FFFFFF' : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {f === 'ALL' && 'All'}
                  {f === 'AVATAR' && '👤 Avatars'}
                  {f === 'CARD_BACK' && '🎴 Card Backs'}
                  {f === 'EMOTE' && '😊 Emotes'}
                  {f === 'TITLE' && '🏅 Titles'}
                  {f === 'THEME' && '🎨 Themes'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Featured Section (Shop only) */}
      {activeTab === 'shop' && featuredItems.length > 0 && (
        <View style={styles(theme).featuredSection}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            ⭐ Featured
          </Text>
          <FlatList
            horizontal
            data={featuredItems}
            renderItem={renderFeaturedItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles(theme).featuredList}
          />
        </View>
      )}

      {/* Limited Time Items (Shop only) */}
      {activeTab === 'shop' && limitedItems.length > 0 && (
        <View style={styles(theme).limitedSection}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.error }]}>
            ⏰ Limited Time
          </Text>
        </View>
      )}

      {/* Items Grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles(theme).itemsList}
        columnWrapperStyle={styles(theme).itemsRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles(theme).emptyState}>
              <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
                {activeTab === 'shop' && 'No items available in shop'}
                {activeTab === 'owned' && 'You don\'t own any items yet'}
                {activeTab === 'favorites' && 'No favorite items'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.typography.h1,
      textAlign: 'center',
    },
    tabs: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      borderRadius: theme.radius.md,
    },
    tabActive: {},
    tabText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    filters: {
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    filterChip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      marginRight: theme.spacing.sm,
    },
    filterText: {
      ...theme.typography.body,
      fontSize: 13,
      fontWeight: '600',
    },
    featuredSection: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.h3,
      fontSize: 16,
      marginLeft: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    featuredList: {
      paddingHorizontal: theme.spacing.md,
    },
    featuredCard: {
      width: 200,
      height: 120,
      borderRadius: theme.radius.xl,
      marginRight: theme.spacing.md,
      overflow: 'hidden',
    },
    featuredGradient: {
      flex: 1,
      padding: theme.spacing.md,
      justifyContent: 'space-between',
    },
    featuredIcon: {
      fontSize: 32,
    },
    featuredInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    featuredName: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      marginBottom: 2,
    },
    featuredRarity: {
      ...theme.typography.caption,
      fontSize: 11,
      fontWeight: '700',
    },
    featuredPrice: {
      alignSelf: 'flex-end',
    },
    limitedSection: {
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    itemsList: {
      padding: theme.spacing.md,
    },
    itemsRow: {
      justifyContent: 'space-between',
    },
    itemCard: {
      width: '48%',
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    rarityIndicator: {
      height: 4,
    },
    itemImage: {
      width: '100%',
      height: 120,
    },
    itemImagePlaceholder: {
      width: '100%',
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.border + '30',
    },
    itemIcon: {
      fontSize: 48,
    },
    itemContent: {
      padding: theme.spacing.md,
    },
    itemName: {
      ...theme.typography.bodyBold,
      fontSize: 14,
      marginBottom: 2,
    },
    itemDescription: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: theme.spacing.sm,
    },
    itemBadges: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    rarityBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    rarityText: {
      fontSize: 9,
      fontWeight: '700',
    },
    limitedBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    limitedText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },
    itemActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    equipButton: {
      flex: 1,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    equipText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 12,
    },
    favoriteButton: {
      width: 32,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    unlockText: {
      ...theme.typography.caption,
      fontSize: 10,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxl,
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
    },
  });
