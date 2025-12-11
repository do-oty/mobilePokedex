import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type ToastProps = {
  message: string;
  visible: boolean;
  duration?: number;
  type?: 'success' | 'error' | 'info';
};

const Toast = ({ message, visible, duration = 1200, type = 'info' }: ToastProps) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, opacity]);

  if (!visible && translateY.__getValue() === 100) {
    return null;
  }

  const backgroundColor =
    type === 'success'
      ? colors.highlight
      : type === 'error'
      ? colors.warning
      : colors.consoleAccent;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY }], opacity },
      ]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 72,
    left: 20,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  message: {
    color: colors.blackPanel,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default memo(Toast);

