import { Platform } from 'react-native';

export const shadow = ({
  color = '#000',
  opacity = 0.35,
  radius = 12,
  offset = { width: 0, height: 8 },
} = {}) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: offset,
    },
    android: {
      elevation: radius,
    },
    default: {},
  });


