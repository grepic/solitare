import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import { tournamentService, Tournament, TournamentStatus } from '../../services/tournament.service';
import { SkeletonCard } from '../../components/EnhancedSkeleton';

type FilterType = 'all' | 'registration' | 'live' | 'my';

export default function TournamentsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<FilterType>('registration');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, [filter]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      await tournamentService.initialize();

      let tourns: Tournament[];
      switch (filter) {
        case 'registration':
          tourns = tournamentService.getTournamentsByStatus('REGISTRATION');
          break;
        case 'live':
          tourns = tournamentService.getTournamentsByStatus('IN_PROGRESS');
          break;
        case 'my':
          tourns = tournamentService.getUserTournaments();
          break;
        default:
          tourns = tournamentService.getTournaments();
      }

      setTournaments(tourns);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await tournamentService.refresh();
    await loadTournaments();
    setRefreshing(false);
  };

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case 'REGISTRATION':
        return { label: 'Open', color: theme.colors.success };
      case 'IN_PROGRESS':
        return { label: 'Live', color: theme.colors.error };
      case 'UPCOMING':
        return { label: 'Soon', color: theme.colors.warning };
      case 'COMPLETED':
        return { label: 'Ended', color: theme.colors.textSecondary };
      default:
        return { label: status, color: theme.colors.textSecondary };
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const tournDate = new Date(date);
    const diff = tournDate.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Starting soon';
    if (hours < 24) return `In ${hours}h`;
    if (days < 7) return `In ${days}d`;
    return tournDate.toLocaleDateString();
  };

  const renderTournament = ({ item }: { item: Tournament }) => {
    const statusBadge = getStatusBadge(item.status);
    const isRegistered = tournamentService.isRegistered(item.id);
    const spotsLeft = item.maxParticipants - item.currentParticipants;
    const fillPercentage = (item.currentParticipants / item.maxParticipants) * 100;

    return (
      <TouchableOpacity
        style={[styles(theme).tournamentCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('TournamentDetail', { tournamentId: item.id })}
      >
        {/* Header Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles(theme).tournamentImage} />
        ) : (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles(theme).tournamentImagePlaceholder}
          >
            <Text style={styles(theme).tournamentImageEmoji}>🏆</Text>
          </LinearGradient>
        )}

        {/* Status Badge */}
        <View style={[styles(theme).statusBadge, { backgroundColor: statusBadge.color }]}>
          <Text style={styles(theme).statusBadgeText}>{statusBadge.label}</Text>
        </View>

        {/* Content */}
        <View style={styles(theme).tournamentContent}>
          <View style={styles(theme).tournamentHeader}>
            <Text style={[styles(theme).tournamentName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {item.isSponsored && item.sponsorName && (
              <Text style={[styles(theme).sponsored, { color: theme.colors.primary }]}>
                Sponsored by {item.sponsorName}
              </Text>
            )}
          </View>

          <Text
            style={[styles(theme).tournamentDescription, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          {/* Info Grid */}
          <View style={styles(theme).infoGrid}>
            <View style={styles(theme).infoItem}>
              <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
                Format
              </Text>
              <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
                {item.format.replace(/_/g, ' ')}
              </Text>
            </View>

            <View style={styles(theme).infoItem}>
              <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
                Entry
              </Text>
              <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
                ${(item.entryFee / 100).toFixed(2)}
              </Text>
            </View>

            <View style={styles(theme).infoItem}>
              <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
                Prize
              </Text>
              <Text style={[styles(theme).infoValue, { color: theme.colors.success }]}>
                ${(item.prizePool / 100).toFixed(2)}
              </Text>
            </View>

            <View style={styles(theme).infoItem}>
              <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
                Starts
              </Text>
              <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
                {formatDate(item.startTime)}
              </Text>
            </View>
          </View>

          {/* Participants Progress */}
          <View style={styles(theme).participantsSection}>
            <View style={styles(theme).participantsHeader}>
              <Text style={[styles(theme).participantsText, { color: theme.colors.textSecondary }]}>
                {item.currentParticipants} / {item.maxParticipants} players
              </Text>
              {spotsLeft > 0 && spotsLeft <= 10 && (
                <Text style={[styles(theme).spotsLeft, { color: theme.colors.warning }]}>
                  {spotsLeft} spots left!
                </Text>
              )}
            </View>
            <View style={[styles(theme).progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles(theme).progressFill,
                  {
                    width: `${fillPercentage}%`,
                    backgroundColor:
                      fillPercentage >= 90
                        ? theme.colors.error
                        : fillPercentage >= 70
                        ? theme.colors.warning
                        : theme.colors.success,
                  },
                ]}
              />
            </View>
          </View>

          {/* Action Button */}
          {isRegistered ? (
            <View style={[styles(theme).registeredBadge, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={[styles(theme).registeredText, { color: theme.colors.success }]}>
                ✓ Registered
              </Text>
            </View>
          ) : item.status === 'REGISTRATION' ? (
            <TouchableOpacity
              style={[styles(theme).registerButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => tournamentService.registerForTournament(item.id)}
            >
              <Text style={styles(theme).registerButtonText}>Register Now</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Tournaments 🏟️</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Tournaments 🏟️</Text>

      {/* Filters */}
      <View style={styles(theme).filters}>
        {(['registration', 'live', 'my', 'all'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles(theme).filterButton,
              filter === f && styles(theme).filterButtonActive,
              {
                backgroundColor: filter === f ? theme.colors.primary : theme.colors.surface,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles(theme).filterButtonText,
                {
                  color: filter === f ? '#FFFFFF' : theme.colors.textSecondary,
                },
              ]}
            >
              {f === 'registration' && 'Open'}
              {f === 'live' && 'Live'}
              {f === 'my' && 'My Tournaments'}
              {f === 'all' && 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={tournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles(theme).list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles(theme).emptyState}>
            <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
              No tournaments available
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    filters: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    filterButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
    },
    filterButtonActive: {},
    filterButtonText: {
      ...theme.typography.body,
      fontSize: 13,
      fontWeight: '600',
    },
    list: {
      paddingBottom: theme.spacing.xl,
    },
    tournamentCard: {
      borderRadius: theme.radius.xl,
      marginBottom: theme.spacing.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tournamentImage: {
      width: '100%',
      height: 150,
    },
    tournamentImagePlaceholder: {
      width: '100%',
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tournamentImageEmoji: {
      fontSize: 64,
    },
    statusBadge: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    statusBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    tournamentContent: {
      padding: theme.spacing.lg,
    },
    tournamentHeader: {
      marginBottom: theme.spacing.sm,
    },
    tournamentName: {
      ...theme.typography.h2,
      fontSize: 20,
      marginBottom: 4,
    },
    sponsored: {
      ...theme.typography.caption,
      fontSize: 11,
      fontWeight: '600',
    },
    tournamentDescription: {
      ...theme.typography.body,
      fontSize: 14,
      marginBottom: theme.spacing.md,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    infoItem: {
      minWidth: '45%',
    },
    infoLabel: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: 2,
    },
    infoValue: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    participantsSection: {
      marginBottom: theme.spacing.md,
    },
    participantsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    participantsText: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    spotsLeft: {
      ...theme.typography.caption,
      fontSize: 11,
      fontWeight: '700',
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    registeredBadge: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    registeredText: {
      ...theme.typography.bodyBold,
      fontSize: 15,
    },
    registerButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    registerButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 15,
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
