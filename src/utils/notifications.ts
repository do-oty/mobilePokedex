/**
 * Push notification utilities for Pokémon spawn alerts
 */
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';

// Request notification permissions (Android 13+)
const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'PokeExplorer needs notification permission to alert you about nearby Pokémon spawns.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Notification permission granted');
      } else {
        console.warn('⚠️ Notification permission denied');
      }
    } catch (err) {
      console.warn('⚠️ Error requesting notification permission:', err);
    }
  }
};

// Configure push notifications
export const configureNotifications = async () => {
  // Request permissions first
  await requestNotificationPermissions();
  
  PushNotification.configure({
    onRegister: function (token) {
      console.log('📱 Push notification token:', token);
    },
    onNotification: function (notification) {
      console.log('📬 Notification received:', notification);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Create default channel for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'pokemon-spawns',
        channelName: 'Pokémon Spawns',
        channelDescription: 'Notifications for nearby Pokémon spawns',
        playSound: true,
        soundName: 'default',
        importance: 4, // High importance
        vibrate: true,
      },
      (created) => console.log(`📱 Notification channel created: ${created}`),
    );
  }
};

// Batch notifications to avoid spam
let notificationQueue: Array<{ name: string; distance: number; biome?: string }> = [];
let notificationTimeout: NodeJS.Timeout | null = null;

/**
 * Show notification for a new Pokémon spawn (batched to avoid spam)
 */
export const notifyPokemonSpawn = (
  pokemonName: string,
  distance: number,
  biome?: string,
) => {
  // Only notify if within reasonable distance (500m)
  if (distance > 500) {
    return;
  }

  // Add to queue
  notificationQueue.push({ name: pokemonName, distance, biome });

  // Clear existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  // Batch notifications - send after 2 seconds or when queue reaches 5
  notificationTimeout = setTimeout(() => {
    if (notificationQueue.length === 0) return;

    if (notificationQueue.length === 1) {
      // Single spawn - normal notification
      const spawn = notificationQueue[0];
      const distanceText = spawn.distance < 1000 ? `${Math.round(spawn.distance)}m` : `${(spawn.distance / 1000).toFixed(1)}km`;
      const biomeText = spawn.biome ? ` (${spawn.biome})` : '';
      
      PushNotification.localNotification({
        channelId: 'pokemon-spawns',
        title: 'Pokemon Spawned',
        message: `${spawn.name} appeared ${distanceText} away${biomeText}`,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        priority: 'high',
        importance: 'high',
        userInfo: {
          type: 'pokemon_spawn',
          pokemon: spawn.name,
        },
      });
    } else {
      // Multiple spawns - batched notification
      const nearbyCount = notificationQueue.filter(s => s.distance <= 200).length;
      const totalCount = notificationQueue.length;
      
      PushNotification.localNotification({
        channelId: 'pokemon-spawns',
        title: 'Multiple Pokemon Spawned',
        message: `${totalCount} Pokemon appeared nearby${nearbyCount > 0 ? ` (${nearbyCount} within 200m)` : ''}`,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        priority: 'high',
        importance: 'high',
        userInfo: {
          type: 'pokemon_spawn_batch',
          count: totalCount,
        },
      });
    }

    // Clear queue
    notificationQueue = [];
    notificationTimeout = null;
  }, notificationQueue.length >= 5 ? 0 : 2000); // Send immediately if 5+ spawns, otherwise wait 2s
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

