/**
 * Enhanced Skeleton Loader Components
 *
 * Provides beautiful loading placeholders for different UI elements.
 * Uses shimmer animation for smooth loading experience.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Card skeleton for game cards
 */
export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={100} style={{ marginTop: 16 }} />
      <View style={styles.cardFooter}>
        <Skeleton width="30%" height={36} borderRadius={8} />
        <Skeleton width="30%" height={36} borderRadius={8} />
      </View>
    </View>
  );
};

/**
 * List item skeleton
 */
export const SkeletonListItem: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={60} height={30} borderRadius={15} />
    </View>
  );
};

/**
 * Leaderboard entry skeleton
 */
export const SkeletonLeaderboardEntry: React.FC = () => {
  return (
    <View style={styles.leaderboardEntry}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Skeleton width={50} height={50} borderRadius={25} style={{ marginLeft: 12 }} />
      <View style={styles.leaderboardContent}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.leaderboardStats}>
        <Skeleton width={60} height={24} />
        <Skeleton width={40} height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

/**
 * Match card skeleton
 */
export const SkeletonMatchCard: React.FC = () => {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Skeleton width={30} height={30} borderRadius={15} />
        <Skeleton width="50%" height={20} style={{ marginLeft: 12 }} />
        <Skeleton width={60} height={24} borderRadius={12} style={{ marginLeft: 'auto' }} />
      </View>
      <View style={styles.matchPlayers}>
        <View style={styles.player}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.player}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={80} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={44} borderRadius={8} style={{ marginTop: 16 }} />
    </View>
  );
};

/**
 * Profile skeleton
 */
export const SkeletonProfile: React.FC = () => {
  return (
    <View style={styles.profile}>
      <View style={styles.profileHeader}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <Skeleton width="60%" height={24} style={{ marginTop: 16 }} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.profileStats}>
        <View style={styles.stat}>
          <Skeleton width={60} height={32} />
          <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.stat}>
          <Skeleton width={60} height={32} />
          <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.stat}>
          <Skeleton width={60} height={32} />
          <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

/**
 * List of skeletons
 */
interface SkeletonListProps {
  count?: number;
  ItemComponent?: React.FC;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  ItemComponent = SkeletonListItem,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
  },
  leaderboardContent: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchPlayers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  player: {
    alignItems: 'center',
  },
  profile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
  },
  stat: {
    alignItems: 'center',
  },
});
