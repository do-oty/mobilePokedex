import { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import { useUser } from '../context/UserContext';
import { colors } from '../theme/colors';
import { getXPProgress } from '../utils/xpSystem';
import { firestore } from '../config/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';

type CapturePost = {
  id: string;
  username: string;
  pokemon: string;
  pokemonId: string;
  location: string;
  timestamp: number;
  sprite: string;
  coords?: { latitude: number; longitude: number } | null;
  type: 'capture' | 'seen';
};

const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

const SocialScreen = () => {
  const { userData, loading } = useUser();
  const [feed, setFeed] = useState<CapturePost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    setFeedLoading(true);
    setFeedError(null);

    let capturesUnsub: (() => void) | null = null;
    let seenUnsub: (() => void) | null = null;
    let capturesData: CapturePost[] = [];
    let seenData: CapturePost[] = [];

    const parseTimestamp = (ts: any) => {
      if (ts?.toMillis) return ts.toMillis() as number;
      if (typeof ts === 'number') return ts;
      if (typeof ts === 'string') {
        const n = Number(ts);
        if (!Number.isNaN(n)) return n;
      }
      return Date.now();
    };

    const updateFeed = () => {
      const merged = [...capturesData, ...seenData]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      console.log('📰 Merged feed:', merged.length, 'items', merged.map(m => `${m.type}:${m.pokemon}`));
      setFeed(merged);
      setFeedLoading(false);
    };

    capturesUnsub = firestore()
      .collection('captures')
      .orderBy('timestampMs', 'desc')
      .limit(20)
      .onSnapshot(
        snap => {
          console.log('📸 Captures snapshot:', snap.docs.length, 'docs');
          capturesData = snap.docs.map(doc => {
            const d = doc.data() as any;
            console.log('📸 Capture doc:', d.pokemon, d.username, d.timestampMs);
            return {
              id: `capture-${doc.id}`,
              username: d.username || 'Trainer',
              pokemon: d.pokemon || 'Unknown',
              pokemonId: d.pokemonId || '#000',
              location: d.location || 'Unknown',
              timestamp: parseTimestamp(d.timestampMs ?? d.timestamp),
              coords: d.coords || null,
              sprite:
                d.sprite ||
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
              type: 'capture' as const,
            };
          });
          updateFeed();
        },
        (err) => {
          console.error('❌ Error loading captures:', err);
          capturesData = [];
          updateFeed();
        },
      );

    seenUnsub = firestore()
      .collection('seen')
      .orderBy('timestampMs', 'desc')
      .limit(20)
      .onSnapshot(
        snap => {
          console.log('👁️ Seen snapshot:', snap.docs.length, 'docs');
          seenData = snap.docs.map(doc => {
            const d = doc.data() as any;
            console.log('👁️ Seen doc:', d.pokemon, d.username, d.timestampMs);
            return {
              id: `seen-${doc.id}`,
              username: d.username || 'Trainer',
              pokemon: d.pokemon || 'Unknown',
              pokemonId: d.pokemonId || '#000',
              location: d.location || 'Unknown',
              timestamp: parseTimestamp(d.timestampMs ?? d.timestamp),
              coords: d.coords || null,
              sprite:
                d.sprite ||
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
              type: 'seen' as const,
            };
          });
          updateFeed();
        },
        (err) => {
          console.error('❌ Error loading seen:', err);
          seenData = [];
          updateFeed();
        },
      );

    return () => {
      if (capturesUnsub) capturesUnsub();
      if (seenUnsub) seenUnsub();
    };
  }, []);

  const dailyGoal = useMemo(() => {
    return {
      progress: userData?.dailyGoalProgress ?? 0,
      target: userData?.dailyGoalTarget ?? 3,
      xpReward: 50,
    };
  }, [userData]);

  if (loading || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.consoleAccent} />
      </View>
    );
  }

  const xpProgress = getXPProgress(userData.xp);
  const streak = userData.currentStreak;

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
            <Text style={styles.progressValue}>{streak}</Text>
            <Text style={styles.progressLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <ConsoleIcon variant="terminal" size={20} color={colors.consoleAccent} />
          <View style={styles.progressText}>
            <Text style={styles.progressValue}>
              {dailyGoal.progress}/{dailyGoal.target}
            </Text>
            <Text style={styles.progressLabel}>Daily Goal (+{dailyGoal.xpReward} XP)</Text>
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
        data={feed}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postMeta}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
              </View>
            </View>

            <View style={styles.postContent}>
              <Image source={{ uri: item.sprite }} style={styles.sprite} />
              <View style={styles.captureInfo}>
                <Text style={styles.captureText}>
                  <Text style={styles.pokemonName}>{item.pokemon}</Text>{' '}
                  <Text style={styles.pokemonId}>{item.pokemonId}</Text>
                </Text>
                <Text style={styles.location}>
                  {item.type === 'capture' ? 'Captured' : 'Seen'} in {item.location}
                  {item.coords
                    ? ` · (${item.coords.latitude.toFixed(3)}, ${item.coords.longitude.toFixed(3)})`
                    : ''}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListHeaderComponent={null}
        ListEmptyComponent={
          feedLoading ? (
            <ActivityIndicator color={colors.consoleAccent} style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.placeholderText}>No captures yet.</Text>
          )
        }
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
  errorText: {
    color: colors.warning,
    fontSize: 11,
    paddingHorizontal: 16,
    marginBottom: 6,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default memo(SocialScreen);

