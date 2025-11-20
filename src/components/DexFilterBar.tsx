import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const filters = ['All', 'Seen', 'Owned', 'Type', 'Region'];

const DexFilterBar = () => {
  return (
    <View style={styles.container}>
      {filters.map(label => (
        <View key={label} style={styles.filter}>
          <Text style={styles.filterText}>{label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.shellAlt,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 12,
  },
});

export default memo(DexFilterBar);


