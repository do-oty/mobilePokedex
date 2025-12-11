import { memo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import { useAuth } from '../context/AuthContext';
import { usePokemon } from '../context/PokemonContext';
import { useRegion } from '../context/RegionContext';
import { useUser } from '../context/UserContext';
import { colors } from '../theme/colors';
import { getXPProgress } from '../utils/xpSystem';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { userData, loading } = useUser();
  const { totalCount } = usePokemon();
  const { selectedRegion } = useRegion();

  if (loading || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.consoleAccent} />
      </View>
    );
  }

  const seenCount = userData.seenPokemon.length;
  const ownedCount = userData.caughtPokemon.length;
  // Get total count from pokedex (all Pokemon in region, not just loaded ones)
  const completionPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const xpProgress = getXPProgress(userData.xp);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trainer';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Simple badges that check real conditions
  const badges = [
    {
      id: '1',
      name: 'First Capture',
      earned: ownedCount >= 1,
      icon: 'capture' as const,
    },
    {
      id: '2',
      name: '5 Captures',
      earned: ownedCount >= 5,
      icon: 'owned' as const,
    },
    {
      id: '3',
      name: '10 Seen',
      earned: seenCount >= 10,
      icon: 'eye' as const,
    },
    {
      id: '4',
      name: 'Explorer',
      earned: seenCount >= 100,
      icon: 'map' as const,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
        <Text style={styles.trainerName}>{displayName}</Text>
        <Text style={styles.trainerLevel}>Level {xpProgress.level}</Text>
      </View>

      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>Experience Points</Text>
          <Text style={styles.xpText}>
            {xpProgress.currentLevelXP} / {xpProgress.nextLevelXP} XP
          </Text>
        </View>
        <View style={styles.xpBar}>
          <View
            style={[styles.xpFill, { width: `${xpProgress.progressPercent}%` }]}
          />
        </View>
        <Text style={styles.xpPercent}>{xpProgress.progressPercent}% to next level</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pokedex Progress</Text>
          <Text style={styles.regionLabel}>{selectedRegion.name}</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>{completionPercent}% Complete</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <ConsoleIcon variant="eye" size={20} color={colors.consoleAccent} />
            <Text style={styles.statValue}>{seenCount}</Text>
            <Text style={styles.statLabel}>Seen</Text>
          </View>
          <View style={styles.statBox}>
            <ConsoleIcon variant="owned" size={20} color={colors.consoleAccent} />
            <Text style={styles.statValue}>{ownedCount}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          <View style={styles.statBox}>
            <ConsoleIcon variant="region" size={20} color={colors.consoleAccent} />
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.badgesCard}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.badgesGrid}>
          {badges.map(badge => (
            <View
              key={badge.id}
              style={[styles.badgeBox, !badge.earned && styles.badgeBoxLocked]}>
              <ConsoleIcon
                variant={badge.icon}
                size={24}
                color={badge.earned ? colors.consoleAccent : colors.textMuted}
              />
              <Text
                style={[
                  styles.badgeName,
                  !badge.earned && styles.badgeNameLocked,
                ]}>
                {badge.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 16,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.consoleAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.consolePanel,
    fontSize: 32,
    fontWeight: '700',
  },
  trainerName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  trainerLevel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  xpCard: {
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    gap: 8,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  xpText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  xpBar: {
    height: 12,
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.consoleAccent,
  },
  xpPercent: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  regionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.consoleAccent,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  badgesCard: {
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    gap: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  badgeBoxLocked: {
    borderColor: colors.divider,
    opacity: 0.5,
  },
  badgeName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: colors.textMuted,
  },
  logoutButton: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(ProfileScreen);

