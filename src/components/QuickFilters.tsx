import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type StatusFilter = 'all' | 'seen' | 'unseen' | 'owned';

type Props = {
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
};

const filters: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'seen', label: 'Seen' },
  { key: 'unseen', label: 'Unseen' },
  { key: 'owned', label: 'Owned' },
];

const QuickFilters = ({ activeFilter, onFilterChange }: Props) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {filters.map(filter => (
        <Pressable
          key={filter.key}
          style={[
            styles.chip,
            activeFilter === filter.key && styles.chipActive,
          ]}
          onPress={() => onFilterChange(filter.key)}>
          <Text
            style={[
              styles.chipText,
              activeFilter === filter.key && styles.chipTextActive,
            ]}>
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.blackPanel,
  },
  chipActive: {
    backgroundColor: colors.consoleAccent,
    borderColor: colors.consoleAccent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.consolePanel,
    fontWeight: '700',
  },
});

export default memo(QuickFilters);
export type { StatusFilter };

