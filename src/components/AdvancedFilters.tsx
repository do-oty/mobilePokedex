import { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, typeColors } from '../theme/colors';

export type FilterOptions = {
  types: string[];
  difficulty: 'all' | 'easy' | 'hard' | 'legendary';
  generation: number | null;
};

type Props = {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
};

const pokemonTypes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const generations = [1, 2, 3, 4, 5, 6, 7, 8];

const AdvancedFilters = ({ filters, onFilterChange }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      types: [],
      difficulty: 'all',
      generation: null,
    });
  };

  const toggleType = (type: string) => {
    const currentTypes = filters.types || [];
    if (currentTypes.includes(type)) {
      onFilterChange({ ...filters, types: currentTypes.filter(t => t !== type) });
    } else {
      onFilterChange({ ...filters, types: [...currentTypes, type] });
    }
  };

  const activeFiltersCount = 
    (filters.types.length > 0 ? 1 : 0) +
    (filters.difficulty !== 'all' ? 1 : 0) +
    (filters.generation ? 1 : 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#5BE77E';
      case 'hard': return '#FFD75E';
      case 'legendary': return '#F85C50';
      default: return null;
    }
  };

  const getGenerationColor = (gen: number) => {
    const genColors = ['#EE8130', '#F7D02C', '#6390F0', '#A8A77A', '#34F5C5', '#F95587', '#FFD75E', '#B6A136'];
    return genColors[gen - 1] || colors.consoleAccent;
  };

  return (
    <View style={styles.container}>
      {/* Header Button */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.toggleButton}
          onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.toggleText}>
            {isExpanded ? '▼' : '▶'} Advanced Filters
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
        {activeFiltersCount > 0 && (
          <Pressable onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        )}
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Type Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type (Multi-select)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              <Pressable
                style={[
                  styles.chip,
                  filters.types.length === 0 && styles.chipActive,
                ]}
                onPress={() => onFilterChange({ ...filters, types: [] })}>
                <Text
                  style={[
                    styles.chipText,
                    filters.types.length === 0 && styles.chipTextActive,
                  ]}>
                  All
                </Text>
              </Pressable>
              {pokemonTypes.map(type => {
                const isActive = filters.types.includes(type);
                const bgColor = typeColors[type] || colors.textMuted;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: bgColor, borderColor: bgColor },
                    ]}
                    onPress={() => toggleType(type)}>
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Difficulty Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty (Capture Rate)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              {([
                { key: 'all', label: 'All' },
                { key: 'easy', label: 'Easy (★★)' },
                { key: 'hard', label: 'Hard (★★★★)' },
                { key: 'legendary', label: 'Legendary (★★★★★)' },
              ] as const).map(({ key: diff, label }) => {
                const isActive = filters.difficulty === diff;
                const color = getDifficultyColor(diff);
                return (
                  <Pressable
                    key={diff}
                    style={[
                      styles.chip,
                      isActive && color && { backgroundColor: color, borderColor: color },
                      isActive && !color && styles.chipActive,
                    ]}
                    onPress={() => updateFilter('difficulty', diff)}>
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Generation Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generation</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              <Pressable
                style={[
                  styles.chip,
                  !filters.generation && styles.chipActive,
                ]}
                onPress={() => updateFilter('generation', null)}>
                <Text
                  style={[
                    styles.chipText,
                    !filters.generation && styles.chipTextActive,
                  ]}>
                  All
                </Text>
              </Pressable>
              {generations.map(gen => {
                const isActive = filters.generation === gen;
                const color = getGenerationColor(gen);
                return (
                  <Pressable
                    key={gen}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => updateFilter('generation', gen)}>
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}>
                      Gen {gen}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.consoleAccent,
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.consolePanel,
    fontSize: 10,
    fontWeight: '700',
  },
  resetText: {
    color: colors.consoleAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    padding: 12,
    gap: 14,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    gap: 6,
    paddingRight: 12,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.shellAlt,
  },
  chipActive: {
    backgroundColor: colors.consoleAccent,
    borderColor: colors.consoleAccent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.consolePanel,
    fontWeight: '700',
  },
});

export default memo(AdvancedFilters);

