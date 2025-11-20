import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConsoleIcon, { ConsoleIconVariant } from './icons/ConsoleIcon';
import { colors } from '../theme/colors';

export type DexTabKey = 'terminal' | 'capture' | 'map' | 'social' | 'profile';

type Props = {
  activeTab: DexTabKey;
  onTabChange: (tab: DexTabKey) => void;
};

const tabs: Array<{ key: DexTabKey; label: string; icon: ConsoleIconVariant }> =
  [
    { key: 'terminal', label: 'Pokedex', icon: 'terminal' },
    { key: 'capture', label: 'Capture', icon: 'capture' },
    { key: 'map', label: 'Map', icon: 'map' },
    { key: 'social', label: 'Social', icon: 'social' },
    { key: 'profile', label: 'Profile', icon: 'profile' },
  ];

const DexTabBar = ({ activeTab, onTabChange }: Props) => {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}>
            <View style={styles.iconWrapper}>
              <ConsoleIcon
                variant={tab.icon}
                size={16}
                color={active ? colors.consolePanel : colors.textMuted}
              />
            </View>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    backgroundColor: colors.consolePanel,
    alignItems: 'stretch',
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'column',
  },
  tabActive: {
    backgroundColor: colors.consoleAccent,
  },
  iconWrapper: {
    padding: 4,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 9,
  },
  tabTextActive: {
    color: colors.consolePanel,
  },
});

export default memo(DexTabBar);


