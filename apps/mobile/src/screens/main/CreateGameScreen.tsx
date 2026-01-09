import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  GameLobbyEvent,
  GameCreatePayload,
  MatchTier,
  MATCH_TIER_CONFIG,
} from '@solitaire/shared';
import { Button } from '@solitaire/ui-kit';

const GAME_NAMES = [
  'Gem-a-zing',
  'Easy Gains',
  'Quick Play',
  'Speed Run',
  'Pro League',
  'Championship',
  'Elite Match',
  'Fast Cash',
];

const PLAYER_COUNTS = [2, 4, 5, 6, 7, 8, 10];

interface CreateGameScreenProps {
  navigation: any;
}

export const CreateGameScreen: React.FC<CreateGameScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const { socket, isConnected } = useWebSocket();

  const [gameName, setGameName] = useState(
    GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)],
  );
  const [selectedTier, setSelectedTier] = useState<MatchTier>(MatchTier.PRACTICE);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isLimited, setIsLimited] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [creating, setCreating] = useState(false);

  const tierConfig = MATCH_TIER_CONFIG[selectedTier];

  const handleCreate = async () => {
    if (!socket || !isConnected) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    if (!gameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }

    setCreating(true);

    const payload: GameCreatePayload = {
      name: gameName.trim(),
      tier: selectedTier,
      maxPlayers,
      isLimited,
      durationMinutes: isLimited ? durationMinutes : undefined,
    };

    socket.emit(GameLobbyEvent.GAME_CREATE, payload, (response: any) => {
      setCreating(false);

      if (response.success) {
        Alert.alert('Success', 'Game created! Waiting for players...', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to game or back to lobby
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to create game');
      }
    });
  };

  const renderTierOption = (tier: MatchTier, label: string) => {
    const config = MATCH_TIER_CONFIG[tier];
    const isSelected = selectedTier === tier;

    return (
      <TouchableOpacity
        key={tier}
        style={[
          styles.tierOption,
          {
            backgroundColor: isSelected
              ? theme.colors.primary + '20'
              : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setSelectedTier(tier)}
      >
        <Text
          style={[
            styles.tierLabel,
            {
              color: isSelected ? theme.colors.primary : theme.colors.text,
              fontWeight: isSelected ? 'bold' : '600',
            },
          ]}
        >
          {label}
        </Text>
        {!config.isPractice && (
          <View>
            <Text style={[styles.tierEntry, { color: theme.colors.textSecondary }]}>
              Entry: ${(config.entryFeeCents / 100).toFixed(2)}
            </Text>
            <Text style={[styles.tierPrize, { color: '#4CAF50' }]}>
              Prize: ${(config.prizePoolCents / 100).toFixed(2)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPlayerCountOption = (count: number) => {
    const isSelected = maxPlayers === count;

    return (
      <TouchableOpacity
        key={count}
        style={[
          styles.playerOption,
          {
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setMaxPlayers(count)}
      >
        <Text
          style={[
            styles.playerText,
            { color: isSelected ? '#fff' : theme.colors.text },
          ]}
        >
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Create New Game
      </Text>

      {/* Game Name */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Game Name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={gameName}
          onChangeText={setGameName}
          placeholder="Enter game name"
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={30}
        />
        <View style={styles.nameButtons}>
          {GAME_NAMES.slice(0, 4).map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.nameButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => setGameName(name)}
            >
              <Text style={[styles.nameButtonText, { color: theme.colors.text }]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tier Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Select Tier
        </Text>
        <View style={styles.tierGrid}>
          {renderTierOption(MatchTier.PRACTICE, 'Practice (Free)')}
          {renderTierOption(MatchTier.TIER_1, '$1 Match')}
          {renderTierOption(MatchTier.TIER_5, '$5 Match')}
          {renderTierOption(MatchTier.TIER_10, '$10 Match')}
        </View>
      </View>

      {/* Player Count */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Max Players
        </Text>
        <View style={styles.playerGrid}>
          {PLAYER_COUNTS.map((count) => renderPlayerCountOption(count))}
        </View>
      </View>

      {/* Limited Time Tournament */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Limited-Time Tournament
            </Text>
            <Text style={[styles.switchSubtext, { color: theme.colors.textSecondary }]}>
              Game cancels if not filled in time
            </Text>
          </View>
          <Switch
            value={isLimited}
            onValueChange={setIsLimited}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {isLimited && (
          <View style={styles.durationSelector}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Duration (minutes)
            </Text>
            <View style={styles.durationButtons}>
              {[1, 3, 5, 10, 15].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationButton,
                    {
                      backgroundColor:
                        durationMinutes === mins
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor:
                        durationMinutes === mins
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => setDurationMinutes(mins)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          durationMinutes === mins ? '#fff' : theme.colors.text,
                      },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          Summary
        </Text>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          • Entry Fee: ${(tierConfig.entryFeeCents / 100).toFixed(2)}
          {tierConfig.isPractice && ' (Free)'}
        </Text>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          • Total Prize Pool: ${((tierConfig.prizePoolCents * maxPlayers) / 100).toFixed(2)}
        </Text>
        <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
          • Max Players: {maxPlayers}
        </Text>
        {isLimited && (
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            • Auto-cancel in: {durationMinutes} minutes
          </Text>
        )}
      </View>

      {/* Create Button */}
      <Button
        title={creating ? 'Creating...' : 'Create Game'}
        onPress={handleCreate}
        disabled={creating || !isConnected}
        variant="primary"
        theme={theme}
        size="large"
      />

      <View style={styles.spacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  nameButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  nameButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tierGrid: {
    gap: 12,
  },
  tierOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 16,
  },
  tierEntry: {
    fontSize: 12,
    marginBottom: 2,
  },
  tierPrize: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playerOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  durationSelector: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 6,
  },
  spacing: {
    height: 20,
  },
});
