import React, { memo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import TypeChip from './TypeChip';
import { colors, typeColors } from '../theme/colors';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type Props = {
  id: string;
  name: string;
  descriptor: string;
  description: string;
  height: string;
  weight: string;
  types: string[];
  artwork: string;
  animatedSprite: string;
  habitat: string;
  evolutions: Array<{ name: string; trigger?: string }>;
  abilities: string[];
  moves: string[];
  encounters: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  generation: number;
  captureRate: number;
  baseExperience: number;
  eggGroups: string[];
};

const DexDetailCard = ({
  id,
  name,
  descriptor,
  description,
  height,
  weight,
  types,
  artwork,
  animatedSprite,
  habitat,
  evolutions,
  abilities,
  moves,
  encounters,
  stats,
  generation,
  captureRate,
  baseExperience,
  eggGroups,
}: Props) => {
  const [expanded, setExpanded] = useState<'habitat' | 'abilities' | 'evolutions' | 'stats' | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const toggle = (key: 'habitat' | 'abilities' | 'evolutions' | 'stats') =>
    setExpanded(prev => (prev === key ? null : key));
  const heroSource = { uri: artwork || animatedSprite };
  
  // Get gradient colors based on Pokemon type
  const primaryType = types[0]?.toLowerCase() || 'normal';
  const secondaryType = types[1]?.toLowerCase();
  const primaryColor = typeColors[primaryType] || colors.textMuted;
  const secondaryColor = secondaryType 
    ? typeColors[secondaryType] || colors.textMuted
    : primaryColor;
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.subLabel}>ENTRY</Text>
        <Text style={styles.entryId}>#{id}</Text>
        <View style={styles.headerDivider} />
        <Text style={styles.entryName}>{name}</Text>
      </View>

      <View style={styles.display}>
        <GridPattern />
        {imageLoading && (
          <ActivityIndicator
            size="large"
            color={colors.consoleAccent}
            style={styles.imageLoader}
          />
        )}
        <Image
          source={heroSource}
          style={styles.sprite}
          onLoadEnd={() => setImageLoading(false)}
        />
      </View>

      <View style={styles.descriptorRow}>
        <Text style={styles.descriptorLabel}>Descriptor</Text>
        <Text style={styles.descriptorValue}>{descriptor}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statBoxLabel}>HEIGHT</Text>
          <Text style={styles.statBoxValue}>{height}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statBoxLabel}>WEIGHT</Text>
          <Text style={styles.statBoxValue}>{weight}</Text>
        </View>
        <View style={styles.typeRow}>
          {types.map(type => (
            <TypeChip key={type} type={type} />
          ))}
        </View>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>

      <View style={styles.pillRow}>
        <PillButton
          label="Stats"
          active={expanded === 'stats'}
          onPress={() => toggle('stats')}
        />
        <PillButton
          label="Abilities"
          active={expanded === 'abilities'}
          onPress={() => toggle('abilities')}
        />
        <PillButton
          label="Evolution"
          active={expanded === 'evolutions'}
          onPress={() => toggle('evolutions')}
        />
        <PillButton
          label="Habitat"
          active={expanded === 'habitat'}
          onPress={() => toggle('habitat')}
        />
      </View>

      {expanded === 'stats' && (
        <View style={styles.sectionBody}>
          <StatBar label="HP" value={stats.hp} max={255} color="#FF5959" />
          <StatBar label="ATK" value={stats.attack} max={190} color="#F5AC78" />
          <StatBar label="DEF" value={stats.defense} max={230} color="#FAE078" />
          <StatBar label="SP.ATK" value={stats.spAtk} max={194} color="#9DB7F5" />
          <StatBar label="SP.DEF" value={stats.spDef} max={230} color="#A7DB8D" />
          <StatBar label="SPD" value={stats.speed} max={180} color="#FA92B2" />
          <View style={styles.metaGrid}>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Generation</Text>
              <Text style={styles.metaValue}>Gen {generation}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Capture Rate</Text>
              <Text style={styles.metaValue}>{captureRate}/255</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Base EXP</Text>
              <Text style={styles.metaValue}>{baseExperience}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Egg Groups</Text>
              <Text style={styles.metaValue}>{eggGroups.join(', ') || '—'}</Text>
            </View>
          </View>
        </View>
      )}

      {expanded === 'abilities' && (
        <View style={styles.sectionBody}>
          <InfoPanel title="Abilities" items={abilities} />
          <InfoPanel title="Signature Moves" items={moves} />
        </View>
      )}

      {expanded === 'evolutions' && (
        <View style={styles.sectionBody}>
          <View style={styles.evolutionChain}>
            {evolutions.map((evo, idx) => (
              <React.Fragment key={evo.name}>
                <View style={styles.evolutionStage}>
                  <Text style={styles.evolutionName}>{evo.name}</Text>
                  {evo.trigger && <Text style={styles.evolutionTrigger}>({evo.trigger})</Text>}
                </View>
                {idx < evolutions.length - 1 && <Text style={styles.evolutionArrow}>→</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {expanded === 'habitat' && (
        <View style={styles.sectionBody}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Habitat</Text>
            <Text style={styles.metaValue}>{habitat}</Text>
          </View>
          <View style={styles.encounterCard}>
            {encounters.map(location => (
              <Text key={location} style={styles.encounterItem}>
                • {location}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const PillButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.pillButton, active && styles.pillButtonActive]}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const StatBar = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.statBar}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};

const InfoPanel = ({ title, items }: { title: string; items: string[] }) => (
  <View style={styles.infoPanel}>
    <Text style={styles.infoTitle}>{title}</Text>
    {items.map(entry => (
      <Text key={entry} style={styles.infoItem}>
        • {entry}
      </Text>
    ))}
  </View>
);

const GridPattern = () => (
  <View style={styles.gridOverlay}>
    {[...Array(12)].map((_, row) => (
      <View
        key={`h-${row}`}
        style={[styles.gridLine, { top: `${(row * 100) / 11}%` }]}
      />
    ))}
    {[...Array(10)].map((_, col) => (
      <View
        key={`v-${col}`}
        style={[styles.gridLineVertical, { left: `${(col * 100) / 9}%` }]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.shellAlt,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  entryId: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  headerDivider: {
    height: 1,
    flex: 1,
    backgroundColor: colors.divider,
  },
  entryName: {
    color: colors.highlight,
    fontWeight: '700',
    fontSize: 14,
  },
  display: {
    height: 220,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gridLight,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(52,245,197,0.15)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(52,245,197,0.15)',
  },
  sprite: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  imageLoader: {
    position: 'absolute',
  },
  typeColorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  descriptorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptorLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  descriptorValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  stat: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.blackPanel,
    borderWidth: 1,
    borderColor: '#06090B',
    minWidth: 90,
  },
  statBoxLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statBoxValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
    fontSize: 13,
  },
  typeRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  description: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#050607',
    padding: 10,
  },
  descriptionText: {
    color: colors.textSecondary,
    lineHeight: 18,
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  pillButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    alignItems: 'center',
    backgroundColor: colors.blackPanel,
  },
  pillButtonActive: {
    backgroundColor: colors.consoleAccent,
    borderColor: colors.consoleAccent,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.consolePanel,
    fontWeight: '700',
  },
  metaColumn: {
    flex: 1,
    minWidth: '45%',
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 3,
    fontSize: 12,
  },
  sectionBody: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  encounterCard: {
    marginTop: 6,
    borderRadius: 6,
    padding: 10,
    backgroundColor: colors.shellAlt,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  encounterTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 11,
  },
  encounterItem: {
    color: colors.textSecondary,
    lineHeight: 18,
    fontSize: 11,
  },
  infoPanel: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06090B',
    padding: 10,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 5,
    fontSize: 11,
  },
  infoItem: {
    color: colors.textSecondary,
    lineHeight: 18,
    fontSize: 11,
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    width: 50,
  },
  statTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.blackPanel,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  evolutionChain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  evolutionStage: {
    alignItems: 'center',
    gap: 4,
  },
  evolutionName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  evolutionTrigger: {
    color: colors.textMuted,
    fontSize: 10,
  },
  evolutionArrow: {
    color: colors.consoleAccent,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 8,
  },
});

export default memo(DexDetailCard);


