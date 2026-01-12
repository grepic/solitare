import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  tournamentService,
  Tournament,
  TournamentBracket,
  TournamentStanding,
  TournamentMatch,
} from '../../services/tournament.service';

type TabType = 'bracket' | 'standings' | 'info';

export default function TournamentDetailScreen({ route, navigation }: any) {
  const { theme } = useThemeStore();
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [currentMatch, setCurrentMatch] = useState<TournamentMatch | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    setLoading(true);
    try {
      const tourn = tournamentService.getTournament(tournamentId);
      setTournament(tourn);

      if (tourn && tourn.status !== 'REGISTRATION' && tourn.status !== 'UPCOMING') {
        const [bracketData, standingsData, matchData] = await Promise.all([
          tournamentService.getBracket(tournamentId),
          tournamentService.getStandings(tournamentId),
          tournamentService.getCurrentMatch(tournamentId),
        ]);

        setBracket(bracketData);
        setStandings(standingsData);
        setCurrentMatch(matchData);
      }
    } catch (error) {
      console.error('Failed to load tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await tournamentService.refresh();
    await loadTournamentData();
    setRefreshing(false);
  };

  const getStatusBadge = () => {
    if (!tournament) return { label: '', color: theme.colors.textSecondary };

    switch (tournament.status) {
      case 'REGISTRATION':
        return { label: 'Open for Registration', color: theme.colors.success };
      case 'IN_PROGRESS':
        return { label: 'Live Now', color: theme.colors.error };
      case 'UPCOMING':
        return { label: 'Starting Soon', color: theme.colors.warning };
      case 'COMPLETED':
        return { label: 'Completed', color: theme.colors.textSecondary };
      default:
        return { label: tournament.status, color: theme.colors.textSecondary };
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStandingItem = ({ item, index }: { item: TournamentStanding; index: number }) => {
    const rankColors: { [key: number]: string } = {
      1: '#FFD700', // Gold
      2: '#C0C0C0', // Silver
      3: '#CD7F32', // Bronze
    };

    return (
      <View style={[styles(theme).standingRow, { backgroundColor: theme.colors.surface }]}>
        <View
          style={[
            styles(theme).rankBadge,
            {
              backgroundColor: rankColors[index + 1] || theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles(theme).rankText,
              {
                color: index < 3 ? '#000000' : theme.colors.text,
              },
            ]}
          >
            {index + 1}
          </Text>
        </View>

        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
          style={styles(theme).standingAvatar}
        />

        <View style={styles(theme).standingInfo}>
          <Text style={[styles(theme).standingUsername, { color: theme.colors.text }]}>
            {item.username}
          </Text>
          <Text style={[styles(theme).standingStats, { color: theme.colors.textSecondary }]}>
            {item.wins}W - {item.losses}L • {item.points} pts
          </Text>
        </View>
      </View>
    );
  };

  const renderMatch = (match: TournamentMatch) => {
    const isCompleted = match.status === 'COMPLETED';
    const isLive = match.status === 'IN_PROGRESS';

    return (
      <View
        key={match.id}
        style={[
          styles(theme).matchCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isLive ? theme.colors.error : theme.colors.border,
            borderWidth: isLive ? 2 : 1,
          },
        ]}
      >
        {isLive && (
          <View style={[styles(theme).liveBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles(theme).liveBadgeText}>● LIVE</Text>
          </View>
        )}

        <Text style={[styles(theme).matchRound, { color: theme.colors.textSecondary }]}>
          Round {match.round} - Match {match.matchNumber}
        </Text>

        <View style={styles(theme).matchPlayers}>
          {/* Player 1 */}
          <View
            style={[
              styles(theme).playerRow,
              {
                backgroundColor:
                  isCompleted && match.winner === match.player1?.userId
                    ? theme.colors.success + '20'
                    : 'transparent',
              },
            ]}
          >
            <Image
              source={{ uri: match.player1?.avatar || 'https://via.placeholder.com/30' }}
              style={styles(theme).playerAvatar}
            />
            <Text style={[styles(theme).playerName, { color: theme.colors.text }]}>
              {match.player1?.username || 'TBD'}
            </Text>
            {isCompleted && match.score && (
              <Text
                style={[
                  styles(theme).playerScore,
                  {
                    color:
                      match.winner === match.player1?.userId
                        ? theme.colors.success
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {match.score.player1}
              </Text>
            )}
          </View>

          <Text style={[styles(theme).vsText, { color: theme.colors.textSecondary }]}>vs</Text>

          {/* Player 2 */}
          <View
            style={[
              styles(theme).playerRow,
              {
                backgroundColor:
                  isCompleted && match.winner === match.player2?.userId
                    ? theme.colors.success + '20'
                    : 'transparent',
              },
            ]}
          >
            <Image
              source={{ uri: match.player2?.avatar || 'https://via.placeholder.com/30' }}
              style={styles(theme).playerAvatar}
            />
            <Text style={[styles(theme).playerName, { color: theme.colors.text }]}>
              {match.player2?.username || 'TBD'}
            </Text>
            {isCompleted && match.score && (
              <Text
                style={[
                  styles(theme).playerScore,
                  {
                    color:
                      match.winner === match.player2?.userId
                        ? theme.colors.success
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {match.score.player2}
              </Text>
            )}
          </View>
        </View>

        {match.startTime && (
          <Text style={[styles(theme).matchTime, { color: theme.colors.textSecondary }]}>
            {isCompleted ? 'Completed' : isLive ? 'In Progress' : formatDate(match.startTime)}
          </Text>
        )}
      </View>
    );
  };

  const renderBracketTab = () => {
    if (!bracket) {
      return (
        <View style={styles(theme).emptyState}>
          <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
            Bracket not available yet
          </Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles(theme).bracketContainer}>
          {bracket.rounds.map((round, roundIndex) => (
            <View key={roundIndex} style={styles(theme).bracketRound}>
              <Text style={[styles(theme).bracketRoundTitle, { color: theme.colors.text }]}>
                Round {roundIndex + 1}
              </Text>
              {round.map((match) => renderMatch(match))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStandingsTab = () => {
    if (standings.length === 0) {
      return (
        <View style={styles(theme).emptyState}>
          <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
            Standings not available yet
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={standings}
        renderItem={renderStandingItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles(theme).standingsList}
      />
    );
  };

  const renderInfoTab = () => {
    if (!tournament) return null;

    return (
      <ScrollView contentContainerStyle={styles(theme).infoContainer}>
        <View style={styles(theme).infoSection}>
          <Text style={[styles(theme).infoSectionTitle, { color: theme.colors.text }]}>
            Description
          </Text>
          <Text style={[styles(theme).infoText, { color: theme.colors.textSecondary }]}>
            {tournament.description}
          </Text>
        </View>

        <View style={styles(theme).infoSection}>
          <Text style={[styles(theme).infoSectionTitle, { color: theme.colors.text }]}>
            Details
          </Text>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Format:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
              {tournament.format.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Participants:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
              {tournament.currentParticipants} / {tournament.maxParticipants}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Entry Fee:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
              ${(tournament.entryFee / 100).toFixed(2)}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Prize Pool:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.success }]}>
              ${(tournament.prizePool / 100).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles(theme).infoSection}>
          <Text style={[styles(theme).infoSectionTitle, { color: theme.colors.text }]}>
            Schedule
          </Text>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Registration:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
              {formatDate(tournament.registrationStart)} - {formatDate(tournament.registrationEnd)}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).infoLabel, { color: theme.colors.textSecondary }]}>
              Start Time:
            </Text>
            <Text style={[styles(theme).infoValue, { color: theme.colors.text }]}>
              {formatDate(tournament.startTime)}
            </Text>
          </View>
        </View>

        <View style={styles(theme).infoSection}>
          <Text style={[styles(theme).infoSectionTitle, { color: theme.colors.text }]}>
            Prize Distribution
          </Text>
          {tournament.prizeDistribution.map((prize) => (
            <View key={prize.position} style={styles(theme).prizeRow}>
              <Text style={[styles(theme).prizePosition, { color: theme.colors.text }]}>
                {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : prize.position === 3 ? '🥉' : `#${prize.position}`}
              </Text>
              <Text style={[styles(theme).prizeAmount, { color: theme.colors.success }]}>
                ${(prize.amount / 100).toFixed(2)}
              </Text>
              <Text style={[styles(theme).prizePercentage, { color: theme.colors.textSecondary }]}>
                ({prize.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (loading || !tournament) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).loadingText, { color: theme.colors.textSecondary }]}>
          Loading tournament...
        </Text>
      </View>
    );
  }

  const statusBadge = getStatusBadge();
  const isRegistered = tournamentService.isRegistered(tournamentId);

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles(theme).header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(theme).backButton}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <View style={styles(theme).headerContent}>
          <Text style={[styles(theme).headerTitle, { color: theme.colors.text }]}>
            {tournament.name}
          </Text>
          <View style={[styles(theme).statusBadgeSmall, { backgroundColor: statusBadge.color }]}>
            <Text style={styles(theme).statusBadgeText}>{statusBadge.label}</Text>
          </View>
        </View>
      </View>

      {/* Banner */}
      {tournament.imageUrl ? (
        <Image source={{ uri: tournament.imageUrl }} style={styles(theme).banner} />
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles(theme).bannerPlaceholder}
        >
          <Text style={styles(theme).bannerEmoji}>🏆</Text>
        </LinearGradient>
      )}

      {/* Current Match Alert (if user has active match) */}
      {currentMatch && (
        <View style={[styles(theme).currentMatchAlert, { backgroundColor: theme.colors.error + '20' }]}>
          <Text style={[styles(theme).currentMatchText, { color: theme.colors.error }]}>
            🎮 Your match is ready! Round {currentMatch.round}
          </Text>
          <TouchableOpacity
            style={[styles(theme).currentMatchButton, { backgroundColor: theme.colors.error }]}
          >
            <Text style={styles(theme).currentMatchButtonText}>Play Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles(theme).tabs}>
        {(['standings', 'bracket', 'info'] as TabType[]).map((tab) => (
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
              {tab === 'standings' && 'Standings'}
              {tab === 'bracket' && 'Bracket'}
              {tab === 'info' && 'Info'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles(theme).tabContent}>
        {activeTab === 'standings' && renderStandingsTab()}
        {activeTab === 'bracket' && renderBracketTab()}
        {activeTab === 'info' && renderInfoTab()}
      </View>

      {/* Action Button */}
      {!isRegistered && tournament.status === 'REGISTRATION' && (
        <View style={[styles(theme).bottomActions, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles(theme).registerButtonLarge, { backgroundColor: theme.colors.primary }]}
            onPress={() => tournamentService.registerForTournament(tournamentId)}
          >
            <Text style={styles(theme).registerButtonText}>
              Register Now - ${(tournament.entryFee / 100).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      ...theme.typography.h2,
      fontSize: 18,
      flex: 1,
    },
    statusBadgeSmall: {
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    statusBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    banner: {
      width: '100%',
      height: 120,
    },
    bannerPlaceholder: {
      width: '100%',
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerEmoji: {
      fontSize: 48,
    },
    currentMatchAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    currentMatchText: {
      ...theme.typography.bodyBold,
      fontSize: 14,
      flex: 1,
    },
    currentMatchButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    currentMatchButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 13,
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
      fontSize: 14,
    },
    tabContent: {
      flex: 1,
    },
    standingsList: {
      padding: theme.spacing.md,
    },
    standingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.radius.lg,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    rankText: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    standingAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: theme.spacing.md,
    },
    standingInfo: {
      flex: 1,
    },
    standingUsername: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      marginBottom: 2,
    },
    standingStats: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    bracketContainer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
    },
    bracketRound: {
      marginRight: theme.spacing.xl,
      minWidth: 250,
    },
    bracketRoundTitle: {
      ...theme.typography.h3,
      fontSize: 16,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    matchCard: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    liveBadge: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing.sm,
    },
    liveBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    matchRound: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: theme.spacing.sm,
    },
    matchPlayers: {
      marginVertical: theme.spacing.sm,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.xs,
    },
    playerAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: theme.spacing.sm,
    },
    playerName: {
      ...theme.typography.body,
      fontSize: 14,
      flex: 1,
    },
    playerScore: {
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    vsText: {
      ...theme.typography.caption,
      fontSize: 11,
      textAlign: 'center',
      marginVertical: 2,
    },
    matchTime: {
      ...theme.typography.caption,
      fontSize: 11,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    infoContainer: {
      padding: theme.spacing.md,
    },
    infoSection: {
      marginBottom: theme.spacing.xl,
    },
    infoSectionTitle: {
      ...theme.typography.h3,
      fontSize: 16,
      marginBottom: theme.spacing.md,
    },
    infoText: {
      ...theme.typography.body,
      fontSize: 14,
      lineHeight: 20,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    infoLabel: {
      ...theme.typography.body,
      fontSize: 14,
    },
    infoValue: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    prizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    prizePosition: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      width: 40,
    },
    prizeAmount: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      flex: 1,
    },
    prizePercentage: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    bottomActions: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    registerButtonLarge: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    registerButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
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
    loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
  });
