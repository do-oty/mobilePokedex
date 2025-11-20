import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const tabs = [
  { label: 'Terminal', status: 'ONLINE' },
  { label: 'Capture', status: 'STANDBY' },
  { label: 'Map', status: 'SYNCING' },
];

const TerminalTabBar = () => {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <View
          key={tab.label}
          style={[styles.tab, index === 0 && styles.tabActive]}>
          <Text
            style={[
              styles.tabLabel,
              index === 0 && styles.tabLabelActive,
            ]}>
            {tab.label.toUpperCase()}
          </Text>
          <Text style={styles.tabStatus}>{tab.status}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#0b0f11',
    borderRightWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#132222',
  },
  tabLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: colors.highlight,
  },
  tabStatus: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1.2,
  },
});

export default memo(TerminalTabBar);


