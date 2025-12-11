import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export const PERMISSION_TYPES = {
  LOCATION: Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  CAMERA: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
  MICROPHONE: Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO,
} as const;

export type PermissionType = keyof typeof PERMISSION_TYPES;

const PERMISSION_MESSAGES: Record<PermissionType, { title: string; message: string }> = {
  LOCATION: {
    title: 'Location Permission Required',
    message: 'Please enable location permission in Settings to show nearby Pokémon on the map.',
  },
  CAMERA: {
    title: 'Camera Permission Required',
    message: 'Please enable camera permission in Settings to use AR features and capture minigame.',
  },
  MICROPHONE: {
    title: 'Microphone Permission Required',
    message: 'Please enable microphone permission in Settings to use voice search.',
  },
};

export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    const permission = PERMISSION_TYPES[type];
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return false;
  }
};

export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    const permission = PERMISSION_TYPES[type];
    const result = await request(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
      const { title, message } = PERMISSION_MESSAGES[type];
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
      return false;
    }
    return false;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
};

export const checkAndRequestPermission = async (type: PermissionType): Promise<boolean> => {
  const hasPermission = await checkPermission(type);
  if (hasPermission) {
    return true;
  }
  return await requestPermission(type);
};




