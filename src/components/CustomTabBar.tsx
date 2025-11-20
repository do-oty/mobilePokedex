import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { memo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import ConsoleIcon from './icons/ConsoleIcon';
import { colors } from '../theme/colors';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

type TabConfig = {
  name: string;
  label: string;
  icon: 'terminal' | 'capture' | 'map' | 'social' | 'profile';
};

const tabs: TabConfig[] = [
  { name: 'Terminal', label: 'TERMINAL', icon: 'terminal' },
  { name: 'Capture', label: 'CAPTURE', icon: 'capture' },
  { name: 'Map', label: 'MAP', icon: 'map' },
  { name: 'Social', label: 'SOCIAL', icon: 'social' },
  { name: 'Profile', label: 'PROFILE', icon: 'profile' },
];

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const scaleAnim = new Animated.Value(1);

        const onPress = () => {
          // Haptic feedback
          ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);

          // Scale animation
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.85,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();

          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        const onLongPress = () => {
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          navigation.emit({
            type: 'tabLongPress',
            target: state.routes[index].key,
          });
        };

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={{ color: colors.consoleAccent, borderless: false }}
            style={styles.tabButton}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <ConsoleIcon
                variant={tab.icon}
                size={26}
                color={isFocused ? colors.consoleAccent : colors.textMuted}
              />
            </Animated.View>
            <Text
              style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}
              numberOfLines={1}>
              {tab.label}
            </Text>
            {isFocused && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.consolePanel,
    alignItems: 'stretch',
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexDirection: 'column',
  },
  tabLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 7,
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabLabelFocused: {
    color: colors.consoleAccent,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2,
    backgroundColor: colors.consoleAccent,
    borderRadius: 1,
  },
});

export default memo(CustomTabBar);

