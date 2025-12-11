import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  style?: ViewStyle;
  columns?: number;
  rows?: number;
  gap?: number;
  opacity?: number;
  lineColor?: string;
  thickness?: number;
};

/**
 * Lightweight grid overlay for console vibes.
 * Renders a handful of vertical/horizontal lines with low opacity.
 */
const GridPattern = ({
  style,
  columns = 12,
  rows = 20,
  gap = 24,
  opacity = 0.08,
  lineColor = colors.divider,
  thickness = 1,
}: Props) => {
  const cols = Array.from({ length: columns }, (_, i) => i);
  const rws = Array.from({ length: rows }, (_, i) => i);

  return (
    <View pointerEvents="none" style={[styles.container, style, { opacity }]}>
      {cols.map(col => (
        <View
          key={`v-${col}`}
          style={[
            styles.vertical,
            { left: col * gap, backgroundColor: lineColor, width: thickness },
          ]}
        />
      ))}
      {rws.map(row => (
        <View
          key={`h-${row}`}
          style={[
            styles.horizontal,
            { top: row * gap, backgroundColor: lineColor, height: thickness },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});

export default GridPattern;

