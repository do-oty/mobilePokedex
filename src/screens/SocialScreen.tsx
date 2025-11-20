import { memo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import { colors } from '../theme/colors';
import { getXPProgress } from '../utils/xpSystem';

type CapturePost = {
  id: string;
  username: string;
  pokemon: string;
  pokemonId: string;
  location: string;
  timestamp: string;
  sprite: string;
};

const mockPosts: CapturePost[] = [
  {
    id: '1',
    username: 'TrainerAsh',
    pokemon: 'Snivy',
    pokemonId: '#001',
    location: 'Nuvema Town',
    timestamp: '2h ago',
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/495.png',
  },
  {
    id: '2',
    username: 'PokeMaster_N',
    pokemon: 'Victini',
    pokemonId: '#006',
    location: 'Liberty Garden',
    timestamp: '5h ago',
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/494.png',
  },
  {
    id: '3',
    username: 'ChampionIris',
    pokemon: 'Serperior',
    pokemonId: '#003',
    location: 'Dragonspiral Tower',
    timestamp: '1d ago',
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/497.png',
  },
];

const SocialScreen = () => {
  // Mock XP - in real app this would come from AsyncStorage/Firebase
  const currentXP = 650; // Example: Level 3 with progress
  const xpProgress = getXPProgress(currentXP);

  return (
    <View style={styles.container}>
      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLevel}>Level {xpProgress.level}</Text>
          <Text style={styles.xpText}>
            {xpProgress.currentLevelXP} / {xpProgress.nextLevelXP} XP
          </Text>
        </View>
        <View style={styles.xpBar}>
          <View
            style={[styles.xpFill, { width: `${xpProgress.progressPercent}%` }]}
          />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressCard}>
          <ConsoleIcon variant="owned" size={20} color={colors.consoleAccent} />
          <View style={styles.progressText}>
            <Text style={styles.progressValue}>7</Text>
            <Text style={styles.progressLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <ConsoleIcon variant="terminal" size={20} color={colors.consoleAccent} />
          <View style={styles.progressText}>
            <Text style={styles.progressValue}>2/3</Text>
            <Text style={styles.progressLabel}>Daily Goal</Text>
          </View>
        </View>
      </View>

      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>Today's Challenge</Text>
          <Text style={styles.challengeReward}>+100 XP</Text>
        </View>
        <Text style={styles.challengeText}>Capture a Water-type Pokémon</Text>
        <View style={styles.challengeProgress}>
          <View style={styles.challengeBar}>
            <View style={[styles.challengeFill, { width: '50%' }]} />
          </View>
          <Text style={styles.challengeStatus}>1/2</Text>
        </View>
      </View>

      <Text style={styles.feedLabel}>Global Feed</Text>

      <FlatList
        data={mockPosts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postMeta}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>

            <View style={styles.postContent}>
              <Image source={{ uri: item.sprite }} style={styles.sprite} />
              <View style={styles.captureInfo}>
                <Text style={styles.captureText}>
                  <Text style={styles.pokemonName}>{item.pokemon}</Text>{' '}
                  <Text style={styles.pokemonId}>{item.pokemonId}</Text>
                </Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 28,
  },
  xpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLevel: {
    color: colors.consoleAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  xpText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  xpBar: {
    height: 8,
    backgroundColor: colors.blackPanel,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.consoleAccent,
  },
  progressSection: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
  },
  progressText: {
    flex: 1,
  },
  progressValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  challengeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    gap: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    color: colors.consoleAccent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  challengeReward: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  challengeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.blackPanel,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeFill: {
    height: '100%',
    backgroundColor: colors.consoleAccent,
  },
  challengeStatus: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  feedLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  postCard: {
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 10,
    gap: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 10,
  },
  postContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sprite: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  captureInfo: {
    flex: 1,
    gap: 3,
  },
  captureText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pokemonName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  pokemonId: {
    color: colors.textMuted,
    fontSize: 10,
  },
  location: {
    color: colors.textMuted,
    fontSize: 10,
  },
});

export default memo(SocialScreen);

