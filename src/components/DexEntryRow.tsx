import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, typeColors } from '../theme/colors';
import { getDifficultyStars } from '../utils/captureDifficulty';

export type DexEntryRowProps = {
  id: string;
  name: string;
  owned: boolean;
  seen: boolean;
  types: string[];
  sprite: string;
  animatedSprite: string;
  captureRate: number;
  active: boolean;
  onPress: () => void;
};

const DexEntryRow = ({
  id,
  name,
  owned,
  seen,
  types,
  sprite,
  animatedSprite,
  captureRate,
  active,
  onPress,
}: DexEntryRowProps) => {
  const statusLabel = owned
    ? 'CAPTURED'
    : seen
      ? 'SEEN'
      : 'UNKNOWN';

  const isUnseen = !seen && !owned;
  const stars = getDifficultyStars(captureRate);

  // Determine gradient colors based on Pokemon types
  const primaryType = types[0]?.toLowerCase() || 'normal';
  const secondaryType = types[1]?.toLowerCase();
  const primaryColor = typeColors[primaryType] || colors.consolePanel;
  const secondaryColor = secondaryType
    ? typeColors[secondaryType] || colors.consolePanel
    : primaryColor;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, active && styles.rowActive]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      <LinearGradient
        colors={[
          `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.2)`,
          `rgba(${parseInt(secondaryColor.slice(1, 3), 16)}, ${parseInt(secondaryColor.slice(3, 5), 16)}, ${parseInt(secondaryColor.slice(5, 7), 16)}, 0.2)`,
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientOverlay}
      />
      <View style={styles.contentWrapper}>
        <View style={styles.indexBadge}>
        <Text style={[styles.indexText, active && styles.indexTextActive]}>
          {id}
        </Text>
        {isUnseen ? (
          <View style={styles.emptyPill} />
        ) : (
          <View style={styles.spriteHolder}>
            <Image
              source={{ uri: animatedSprite || sprite }}
              style={styles.sprite}
            />
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, active && styles.nameActive]}>
          {isUnseen ? '???' : name}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              owned && styles.statusDotOwned,
              !owned && seen && styles.statusDotSeen,
            ]}
          />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
        {!isUnseen && (
          <View style={styles.starContainer}>
            {Array.from({ length: stars }, (_, i) => (
              <Text key={i} style={styles.starFilled}>
                ★
              </Text>
            ))}
            {Array.from({ length: 5 - stars }, (_, i) => (
              <Text key={`empty-${i}`} style={styles.starEmpty}>
                ★
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    borderRadius: 6,
    backgroundColor: colors.rowBackground,
    borderWidth: 1,
    borderColor: '#1a1f22',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  rowActive: {
    borderColor: colors.highlight,
    backgroundColor: '#17261C',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  indexBadge: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  indexTextActive: {
    color: colors.highlight,
  },
  meta: {
    flex: 1,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  nameActive: {
    color: colors.textPrimary,
  },
  spriteHolder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  statusDotOwned: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlight,
  },
  statusDotSeen: {
    borderColor: colors.accentAmber,
    backgroundColor: colors.accentAmber,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  starFilled: {
    color: colors.accentAmber,
    fontSize: 14,
    lineHeight: 14,
  },
  starEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 14,
    opacity: 0.3,
  },
  emptyPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blackPanel,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },
});

export default memo(DexEntryRow);


