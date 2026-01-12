/**
 * Customization Service
 *
 * Manages player cosmetic customization:
 * - Avatars
 * - Card backs
 * - Emotes
 * - Titles
 * - Themes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { analyticsService } from './analytics.service';

export type CustomizationType = 'AVATAR' | 'CARD_BACK' | 'EMOTE' | 'TITLE' | 'THEME';
export type CustomizationRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface CustomizationItem {
  id: string;
  type: CustomizationType;
  name: string;
  description: string;
  rarity: CustomizationRarity;

  // Asset URLs
  imageUrl?: string;
  previewUrl?: string;
  animationUrl?: string;

  // Unlock conditions
  unlockMethod: 'PURCHASE' | 'ACHIEVEMENT' | 'SEASON' | 'EVENT' | 'DEFAULT';
  price?: {
    gems?: number;
    coins?: number;
  };
  unlockCondition?: string; // e.g., "Reach level 50", "Complete Season 1"

  // Metadata
  isLimited?: boolean; // Limited time availability
  availableUntil?: Date;
  season?: string;
  collection?: string;
}

export interface PlayerCustomization {
  // Owned items
  ownedItems: string[]; // Item IDs

  // Equipped items
  equipped: {
    avatar: string;
    cardBack: string;
    title?: string;
    theme?: string;
  };

  // Favorites
  favorites: string[];
}

export interface CustomizationCollection {
  id: string;
  name: string;
  description: string;
  items: CustomizationItem[];
  imageUrl?: string;
  isComplete: boolean;
  completionReward?: {
    gems?: number;
    coins?: number;
    exclusiveItem?: CustomizationItem;
  };
}

class CustomizationService {
  private items: Map<string, CustomizationItem> = new Map();
  private playerCustomization: PlayerCustomization | null = null;
  private loaded: boolean = false;

  /**
   * Initialize customization service
   */
  async initialize(): Promise<void> {
    await this.loadItems();
    await this.loadPlayerCustomization();

    console.log('✅ Customization service initialized');
  }

  /**
   * Load all available customization items
   */
  private async loadItems(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/customization/items');
      response.data.forEach((item: CustomizationItem) => {
        this.items.set(item.id, item);
      });
      */

      // Fallback: Load default items
      this.loadDefaultItems();

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load customization items:', error);
      this.loadDefaultItems();
    }
  }

  /**
   * Load default customization items
   */
  private loadDefaultItems(): void {
    // Default avatars
    const defaultAvatars: CustomizationItem[] = [
      {
        id: 'avatar_default',
        type: 'AVATAR',
        name: 'Default Avatar',
        description: 'Classic look',
        rarity: 'COMMON',
        unlockMethod: 'DEFAULT',
      },
      {
        id: 'avatar_ace',
        type: 'AVATAR',
        name: 'Ace Player',
        description: 'For skilled players',
        rarity: 'RARE',
        unlockMethod: 'ACHIEVEMENT',
        unlockCondition: 'Win 100 games',
      },
      {
        id: 'avatar_king',
        type: 'AVATAR',
        name: 'King of Solitaire',
        description: 'Royal avatar for champions',
        rarity: 'LEGENDARY',
        unlockMethod: 'ACHIEVEMENT',
        unlockCondition: 'Win 1000 games',
      },
    ];

    // Default card backs
    const defaultCardBacks: CustomizationItem[] = [
      {
        id: 'cardback_classic',
        type: 'CARD_BACK',
        name: 'Classic',
        description: 'Traditional card back',
        rarity: 'COMMON',
        unlockMethod: 'DEFAULT',
      },
      {
        id: 'cardback_royal',
        type: 'CARD_BACK',
        name: 'Royal',
        description: 'Elegant royal design',
        rarity: 'RARE',
        unlockMethod: 'PURCHASE',
        price: { gems: 500 },
      },
      {
        id: 'cardback_galaxy',
        type: 'CARD_BACK',
        name: 'Galaxy',
        description: 'Cosmic card back',
        rarity: 'EPIC',
        unlockMethod: 'SEASON',
        unlockCondition: 'Season 1 Battle Pass Tier 30',
      },
    ];

    // Default emotes
    const defaultEmotes: CustomizationItem[] = [
      {
        id: 'emote_gg',
        type: 'EMOTE',
        name: 'Good Game',
        description: 'Show respect',
        rarity: 'COMMON',
        unlockMethod: 'DEFAULT',
      },
      {
        id: 'emote_thinking',
        type: 'EMOTE',
        name: 'Thinking',
        description: 'Planning your move',
        rarity: 'COMMON',
        unlockMethod: 'PURCHASE',
        price: { gems: 100 },
      },
      {
        id: 'emote_celebrate',
        type: 'EMOTE',
        name: 'Celebrate',
        description: 'Victory dance',
        rarity: 'RARE',
        unlockMethod: 'PURCHASE',
        price: { gems: 250 },
      },
    ];

    // Add all to map
    [...defaultAvatars, ...defaultCardBacks, ...defaultEmotes].forEach((item) => {
      this.items.set(item.id, item);
    });
  }

  /**
   * Load player customization data
   */
  private async loadPlayerCustomization(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/customization/player');
      this.playerCustomization = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('player_customization');
      if (stored) {
        this.playerCustomization = JSON.parse(stored);
      } else {
        // Initialize with defaults
        this.playerCustomization = {
          ownedItems: ['avatar_default', 'cardback_classic', 'emote_gg'],
          equipped: {
            avatar: 'avatar_default',
            cardBack: 'cardback_classic',
          },
          favorites: [],
        };
        await this.savePlayerCustomization();
      }
    } catch (error) {
      console.error('Failed to load player customization:', error);
    }
  }

  /**
   * Save player customization to storage
   */
  private async savePlayerCustomization(): Promise<void> {
    try {
      if (this.playerCustomization) {
        await AsyncStorage.setItem(
          'player_customization',
          JSON.stringify(this.playerCustomization)
        );
      }
    } catch (error) {
      console.error('Failed to save player customization:', error);
    }
  }

  /**
   * Get all items by type
   */
  getItemsByType(type: CustomizationType): CustomizationItem[] {
    return Array.from(this.items.values()).filter((item) => item.type === type);
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): CustomizationItem | null {
    return this.items.get(itemId) || null;
  }

  /**
   * Get owned items
   */
  getOwnedItems(): CustomizationItem[] {
    if (!this.playerCustomization) return [];

    return this.playerCustomization.ownedItems
      .map((id) => this.items.get(id))
      .filter((item): item is CustomizationItem => item !== undefined);
  }

  /**
   * Check if player owns item
   */
  ownsItem(itemId: string): boolean {
    return this.playerCustomization?.ownedItems.includes(itemId) || false;
  }

  /**
   * Get equipped items
   */
  getEquipped(): PlayerCustomization['equipped'] | null {
    return this.playerCustomization?.equipped || null;
  }

  /**
   * Get equipped item by type
   */
  getEquippedItem(type: CustomizationType): CustomizationItem | null {
    if (!this.playerCustomization) return null;

    let itemId: string | undefined;

    switch (type) {
      case 'AVATAR':
        itemId = this.playerCustomization.equipped.avatar;
        break;
      case 'CARD_BACK':
        itemId = this.playerCustomization.equipped.cardBack;
        break;
      case 'TITLE':
        itemId = this.playerCustomization.equipped.title;
        break;
      case 'THEME':
        itemId = this.playerCustomization.equipped.theme;
        break;
      default:
        return null;
    }

    return itemId ? this.items.get(itemId) || null : null;
  }

  /**
   * Equip item
   */
  async equipItem(itemId: string): Promise<boolean> {
    try {
      const item = this.items.get(itemId);
      if (!item) {
        console.error('Item not found');
        return false;
      }

      if (!this.ownsItem(itemId)) {
        console.error('Item not owned');
        return false;
      }

      if (!this.playerCustomization) {
        console.error('No player customization data');
        return false;
      }

      // TODO: Update on backend
      /* Example:
      await api.post('/customization/equip', { itemId });
      */

      // Update locally
      switch (item.type) {
        case 'AVATAR':
          this.playerCustomization.equipped.avatar = itemId;
          break;
        case 'CARD_BACK':
          this.playerCustomization.equipped.cardBack = itemId;
          break;
        case 'TITLE':
          this.playerCustomization.equipped.title = itemId;
          break;
        case 'THEME':
          this.playerCustomization.equipped.theme = itemId;
          break;
        default:
          console.error('Cannot equip this item type');
          return false;
      }

      await this.savePlayerCustomization();

      // Track analytics
      await analyticsService.logEvent('customization_equipped', {
        item_id: itemId,
        item_type: item.type,
        item_name: item.name,
      });

      console.log(`✅ Equipped ${item.name}`);
      return true;
    } catch (error) {
      console.error('Failed to equip item:', error);
      return false;
    }
  }

  /**
   * Purchase item
   */
  async purchaseItem(itemId: string): Promise<boolean> {
    try {
      const item = this.items.get(itemId);
      if (!item) {
        console.error('Item not found');
        return false;
      }

      if (this.ownsItem(itemId)) {
        console.error('Already owns item');
        return false;
      }

      if (item.unlockMethod !== 'PURCHASE' || !item.price) {
        console.error('Item cannot be purchased');
        return false;
      }

      if (!this.playerCustomization) {
        console.error('No player customization data');
        return false;
      }

      // TODO: Process payment via backend
      /* Example:
      await api.post('/customization/purchase', {
        itemId,
        currency: item.price.gems ? 'gems' : 'coins',
      });
      */

      // Add to owned items
      this.playerCustomization.ownedItems.push(itemId);
      await this.savePlayerCustomization();

      // Track analytics
      await analyticsService.logPurchase(
        `customization_${item.type.toLowerCase()}`,
        item.price.gems || item.price.coins || 0,
        item.price.gems ? 'GEMS' : 'COINS'
      );

      console.log(`✅ Purchased ${item.name}`);
      return true;
    } catch (error) {
      console.error('Failed to purchase item:', error);
      return false;
    }
  }

  /**
   * Unlock item (from achievement, event, etc.)
   */
  async unlockItem(itemId: string, source: string): Promise<boolean> {
    try {
      const item = this.items.get(itemId);
      if (!item) {
        console.error('Item not found');
        return false;
      }

      if (this.ownsItem(itemId)) {
        console.log('Already owns item');
        return false;
      }

      if (!this.playerCustomization) {
        console.error('No player customization data');
        return false;
      }

      // TODO: Verify unlock condition on backend
      /* Example:
      await api.post('/customization/unlock', { itemId, source });
      */

      // Add to owned items
      this.playerCustomization.ownedItems.push(itemId);
      await this.savePlayerCustomization();

      // Track analytics
      await analyticsService.logEvent('customization_unlocked', {
        item_id: itemId,
        item_type: item.type,
        item_name: item.name,
        source,
      });

      console.log(`✅ Unlocked ${item.name} from ${source}`);
      return true;
    } catch (error) {
      console.error('Failed to unlock item:', error);
      return false;
    }
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(itemId: string): Promise<boolean> {
    try {
      if (!this.ownsItem(itemId)) {
        console.error('Cannot favorite unowned item');
        return false;
      }

      if (!this.playerCustomization) {
        console.error('No player customization data');
        return false;
      }

      const index = this.playerCustomization.favorites.indexOf(itemId);
      if (index >= 0) {
        // Remove from favorites
        this.playerCustomization.favorites.splice(index, 1);
      } else {
        // Add to favorites
        this.playerCustomization.favorites.push(itemId);
      }

      await this.savePlayerCustomization();
      return true;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  /**
   * Get favorite items
   */
  getFavoriteItems(): CustomizationItem[] {
    if (!this.playerCustomization) return [];

    return this.playerCustomization.favorites
      .map((id) => this.items.get(id))
      .filter((item): item is CustomizationItem => item !== undefined);
  }

  /**
   * Check if item is favorite
   */
  isFavorite(itemId: string): boolean {
    return this.playerCustomization?.favorites.includes(itemId) || false;
  }

  /**
   * Get collections
   */
  getCollections(): CustomizationCollection[] {
    // TODO: Implement collections
    return [];
  }

  /**
   * Get collection completion status
   */
  getCollectionCompletion(collectionId: string): {
    owned: number;
    total: number;
    percentage: number;
    isComplete: boolean;
  } {
    // TODO: Implement collection completion tracking
    return {
      owned: 0,
      total: 0,
      percentage: 0,
      isComplete: false,
    };
  }

  /**
   * Get shop items (purchasable)
   */
  getShopItems(): CustomizationItem[] {
    return Array.from(this.items.values()).filter(
      (item) => item.unlockMethod === 'PURCHASE' && !this.ownsItem(item.id)
    );
  }

  /**
   * Get featured items
   */
  getFeaturedItems(): CustomizationItem[] {
    return Array.from(this.items.values())
      .filter((item) => item.rarity === 'EPIC' || item.rarity === 'LEGENDARY')
      .slice(0, 5);
  }

  /**
   * Get limited time items
   */
  getLimitedTimeItems(): CustomizationItem[] {
    return Array.from(this.items.values()).filter((item) => {
      if (!item.isLimited || !item.availableUntil) return false;
      return new Date(item.availableUntil) > new Date();
    });
  }

  /**
   * Refresh data from server
   */
  async refresh(): Promise<void> {
    await this.loadItems();
    await this.loadPlayerCustomization();
  }
}

export const customizationService = new CustomizationService();
