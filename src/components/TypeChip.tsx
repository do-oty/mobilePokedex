import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, typeColors } from '../theme/colors';

type TypeChipProps = {
  type: string;
};

const TypeChip = ({ type }: TypeChipProps) => {
  const normalized = type.toLowerCase();
  const backgroundColor = typeColors[normalized] ?? colors.highlight;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{type.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  text: {
    color: colors.blackPanel,
    fontWeight: '700',
    fontSize: 9,
  },
});

export default memo(TypeChip);


