import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Share from 'react-native-share';
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CompassHeading from 'react-native-compass-heading';
import { firestore } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import { usePokemon } from '../context/PokemonContext';
import { useUser } from '../context/UserContext';
import { colors } from '../theme/colors';
import { getDifficultyStars } from '../utils/captureDifficulty';

type CaptureParams = {
  pokemonName?: string;
  pokemonId?: number | string;
  coord?: { latitude: number; longitude: number };
  region?: string;
};

const LIVES = 3;
const MIN_SECONDS = 25; // Minimum hunt duration
const MAX_SECONDS = 60; // Maximum hunt duration
const COUNTDOWN_SECONDS = 3;
const XP_SUCCESS = 50;
const XP_FAIL = 20;
const DIRECTIONS = ['Up', 'Down', 'Left', 'Right'];
const DIR_VECTORS: Record<string, { x: number; y: number }> = {
  Up: { x: 0, y: -1 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
};
const PAN_THRESHOLD_METERS = 1.2; // distance to move in required direction

const CaptureScreen = () => {
  const route = useRoute<RouteProp<Record<string, CaptureParams>, string>>();
  const navigation = useNavigation();
  const hasTargetParam = !!(route.params?.pokemonId || route.params?.pokemonName);
  const { pokemon } = usePokemon();
  const { addCaughtPokemon, addSeenPokemon, updateXP, updateDailyGoalProgress, userData } = useUser();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();

  const { width, height } = Dimensions.get('window');
  const padding = 40;

  const targetPokemon = useMemo(() => {
    if (!hasTargetParam) return undefined;
    const idParam = route.params?.pokemonId;
    const name = route.params?.pokemonName;
    if (idParam !== undefined && idParam !== null) {
      const found = pokemon.find(p => p.id === idParam || String(p.id) === String(idParam));
      if (found) return found;
    }
    if (name) {
      const found = pokemon.find(p => p.name === name);
      if (found) return found;
    }
    return pokemon[0];
  }, [pokemon, route.params?.pokemonId, route.params?.pokemonName, hasTargetParam]);
  const targetCoord = route.params?.coord;
  const targetRegion = route.params?.region;

  const [misses, setMisses] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: height / 2 - 60, left: width / 2 - 60 });
  const [status, setStatus] = useState<'countdown' | 'running' | 'success' | 'fail'>('countdown');
  const [timeLeft, setTimeLeft] = useState(MIN_SECONDS);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [camAuthorized, setCamAuthorized] = useState(false);
  const [camRequesting, setCamRequesting] = useState(false);
  const [requiredDir, setRequiredDir] = useState<string>('Center');
  const [showDirOverlay, setShowDirOverlay] = useState(false);
  const [heading, setHeading] = useState(0);
  const headingStartRef = useRef(0);
  const headingCheckRef = useRef<NodeJS.Timeout | null>(null);
  const rewardProgress = useRef(new Animated.Value(0)).current;
  const [rewardPrevXp, setRewardPrevXp] = useState(0);
  const [rewardNewXp, setRewardNewXp] = useState(0);
  const rewardGrantedRef = useRef(false);
  const arrowPulse = useRef(new Animated.Value(0)).current;
  const parallaxHeading = useRef(new Animated.Value(0)).current;

  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const popupRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const preCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const [camDevice, setCamDevice] = useState<CameraDevice | null>(null);

  const { popupInterval, popupDuration, targetSize, roundSeconds } = useMemo(() => {
    if (!targetPokemon) {
      return { popupInterval: 1200, popupDuration: 900, targetSize: 100, roundSeconds: MIN_SECONDS };
    }
    const stars = getDifficultyStars(targetPokemon.captureRate);
    const interval = stars >= 5 ? 700 : stars === 4 ? 850 : stars === 3 ? 1000 : 1180;
    const duration = stars >= 5 ? 560 : stars === 4 ? 700 : stars === 3 ? 860 : 980;
    const size = stars >= 5 ? 55 : stars === 4 ? 65 : stars === 3 ? 80 : 95;
    // Round duration: 25-60 seconds based on difficulty (harder = longer, but capped at 60)
    const round = stars >= 5 ? 60 : stars === 4 ? 50 : stars === 3 ? 35 : 25;
    return { popupInterval: interval, popupDuration: duration, targetSize: size, roundSeconds: round };
  }, [targetPokemon]);

  const normalizeDeg = (deg: number) => {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  };

  const dirMet = (dir: string, base: number, current: number) => {
    const delta = normalizeDeg(current - base);
    if (dir === 'Up') return delta <= 12 || delta >= 348;
    if (dir === 'Right') return delta >= 78 && delta <= 102;
    if (dir === 'Down') return delta >= 168 && delta <= 192;
    if (dir === 'Left') return delta >= 258 && delta <= 282;
    return true;
  };

  const clearAllTimers = () => {
    if (loopRef.current) clearTimeout(loopRef.current);
    if (popupRef.current) clearTimeout(popupRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (preCountdownRef.current) clearInterval(preCountdownRef.current);
    if (headingCheckRef.current) clearInterval(headingCheckRef.current);
  };

  const requestCamera = async () => {
    if (!hasTargetParam) return;
    setCamRequesting(true);
    const granted = hasPermission ? true : await requestPermission();
    setCamAuthorized(granted);
    if (granted) {
      try {
        const devices = Camera.getAvailableCameraDevices();
        const deviceList = Array.isArray(devices) ? devices : await devices;
        const back = deviceList.find(d => d.position === 'back') || deviceList[0] || null;
        setCamDevice(back);
      } catch (err) {
        console.error('Camera device error:', err);
        setCamDevice(null);
      }
    } else {
      setCamDevice(null);
    }
    setCamRequesting(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (hasTargetParam) {
        requestCamera();
      }
      headingStartRef.current = 0;
      rewardGrantedRef.current = false;
      return undefined;
    }, [hasTargetParam]),
  );

  useEffect(() => {
    if (!hasTargetParam) return undefined;
    CompassHeading.start(3, ({ heading: deg }) => {
      setHeading(deg);
    });
    return () => {
      CompassHeading.stop();
    };
  }, [hasTargetParam]);

  useEffect(() => {
    if (showDirOverlay) {
      arrowPulse.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowPulse, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(arrowPulse, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      arrowPulse.stopAnimation();
      arrowPulse.setValue(0);
    }
  }, [showDirOverlay, arrowPulse]);

  useEffect(() => {
    // Use relative heading from initial position for world-space positioning
    if (headingStartRef.current === 0 && heading !== 0) {
      headingStartRef.current = heading;
    }
    
    const normalizeDeg = (deg: number) => {
      let d = deg % 360;
      if (d < 0) d += 360;
      return d;
    };
    
    const relativeHeading = headingStartRef.current > 0 
      ? normalizeDeg(heading - headingStartRef.current)
      : heading;
    
    Animated.timing(parallaxHeading, {
      toValue: relativeHeading,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [heading, parallaxHeading]);
  
  // World-space positioning: Pokémon move opposite to camera rotation
  const worldParallaxX = parallaxHeading.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [0, -40, 0, 40, 0], // Right rotation = left movement
  });
  const worldParallaxY = parallaxHeading.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [0, 0, -25, 0, 0], // Up/down rotation = vertical movement
  });

  const startRound = useCallback(() => {
    clearAllTimers();
    setStatus('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    setTimeLeft(roundSeconds);
    setMisses(0);
    setVisible(false);
    rewardGrantedRef.current = false;
    preCountdownRef.current = setInterval(() => {
      setCountdown(c => {
        const next = c - 1;
        if (next <= 0) {
          clearAllTimers();
          setStatus('running');
        }
        return next;
      });
    }, 1000);
  }, [roundSeconds]);

  useEffect(() => {
    if (!targetPokemon || !hasTargetParam) return;
    startRound();
  }, [targetPokemon, startRound, hasTargetParam]);

  useEffect(() => {
    if (status !== 'running' || !hasTargetParam) return;
    clearAllTimers();

    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) {
          clearAllTimers();
          setStatus('success');
          return 0;
        }
        return next;
      });
    }, 1000);

    const loop = () => {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const stars = targetPokemon ? getDifficultyStars(targetPokemon.captureRate) : 3;
      // Increased panning frequency - make it happen more often
      const basePan = stars >= 5 ? 0.55 : stars === 4 ? 0.50 : stars === 3 ? 0.45 : 0.40;
      const dirFactor = dir === 'Up' || dir === 'Down' ? 0.35 : 0.5;
      const panChance = basePan * dirFactor;
      const panRequired = Math.random() < panChance;

      const offset = targetSize + padding;
      const jitter = 30;

      const safeTop = insets.top + 140;
      const safeBottom = insets.bottom + 180;
      const minTop = safeTop;
      const maxTop = height - safeBottom - targetSize;
      const minLeft = padding;
      const maxLeft = width - padding - targetSize;

      let nextTop = height / 2;
      let nextLeft = width / 2;

      if (dir === 'Up') nextTop = minTop;
      else if (dir === 'Down') nextTop = maxTop;
      else if (dir === 'Left') nextLeft = minLeft;
      else if (dir === 'Right') nextLeft = maxLeft;

      setPos({
        top: Math.max(minTop, Math.min(maxTop, nextTop + (Math.random() - 0.5) * jitter)),
        left: Math.max(minLeft, Math.min(maxLeft, nextLeft + (Math.random() - 0.5) * jitter)),
      });

      const grace = panRequired ? 500 : 0;
      const durationExtra = panRequired ? 400 : 0;

      const startSpawn = () => {
        setVisible(true);
        if (popupRef.current) clearTimeout(popupRef.current);
        popupRef.current = setTimeout(() => {
          setVisible(false);
          setShowDirOverlay(false);
          // Lose a life when Pokémon disappears without being caught
          setMisses(m => {
            const newMisses = m + 1;
            // Vibrate when losing a life
            Vibration.vibrate(200);
            return newMisses;
          });
        }, popupDuration + durationExtra);
      };

      if (panRequired) {
        setRequiredDir(dir);
        setShowDirOverlay(true);
        headingStartRef.current = heading;
        let waited = 0;
        if (headingCheckRef.current) clearInterval(headingCheckRef.current);
        headingCheckRef.current = setInterval(() => {
          waited += 200;
          if (dirMet(dir, headingStartRef.current, heading)) {
            // Successfully panned - spawn normally
            if (headingCheckRef.current) clearInterval(headingCheckRef.current);
            startSpawn();
          } else if (waited >= 2500) {
            // Failed to pan in time - just spawn the Pokémon anyway (no punishment)
            if (headingCheckRef.current) clearInterval(headingCheckRef.current);
            setShowDirOverlay(false);
            // Spawn the Pokémon normally without losing a life
            setTimeout(() => {
              startSpawn();
            }, 100);
          }
        }, 200);
      } else {
        setShowDirOverlay(false);
        setTimeout(startSpawn, grace);
      }

      loopRef.current = setTimeout(loop, popupInterval + grace);
    };
    loop();

    return () => clearAllTimers();
  }, [height, width, padding, popupInterval, popupDuration, targetSize, targetPokemon, status, hasTargetParam]);

  useEffect(() => {
    if (status === 'success' && targetPokemon && hasTargetParam) {
      if (rewardGrantedRef.current) return;
      rewardGrantedRef.current = true;
      addCaughtPokemon(targetPokemon.id);
      const currentXp = userData?.xp ?? 0;
      setRewardPrevXp(currentXp);
      setRewardNewXp(currentXp + XP_SUCCESS);
      Animated.timing(rewardProgress, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start(() => {
        rewardProgress.setValue(0);
      });
      updateXP(XP_SUCCESS);
      const captureData = {
        userId: user?.uid || 'anon',
        username: userData?.username || (user?.email ? user.email.split('@')[0] : 'Trainer'),
        pokemon: targetPokemon.name,
        pokemonId: targetPokemon.id,
        sprite: targetPokemon.sprite,
        location: targetRegion || 'Unknown',
        coords: targetCoord || null,
        timestamp: firestore.FieldValue.serverTimestamp(),
        timestampMs: Date.now(),
      };
      console.log('💾 Writing capture:', captureData);
      firestore()
        .collection('captures')
        .add(captureData)
        .then((docRef) => {
          console.log('✅ Capture written:', docRef.id);
        })
        .catch((err) => {
          console.error('❌ Error writing capture:', err);
        });
      updateDailyGoalProgress(1);
    }
  }, [
    status,
    targetPokemon,
    addCaughtPokemon,
    updateXP,
    rewardProgress,
    userData?.xp,
    user,
    targetCoord,
    targetRegion,
    updateDailyGoalProgress,
    hasTargetParam,
  ]);

  useEffect(() => {
    if (misses >= LIVES && targetPokemon && status === 'running' && hasTargetParam) {
      clearAllTimers();
      setStatus('fail');
      addSeenPokemon(targetPokemon.id);
      if (rewardGrantedRef.current) return;
      rewardGrantedRef.current = true;
      const currentXp = userData?.xp ?? 0;
      setRewardPrevXp(currentXp);
      setRewardNewXp(currentXp + XP_FAIL);
      Animated.timing(rewardProgress, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start(() => {
        rewardProgress.setValue(0);
      });
      updateXP(XP_FAIL);
      const seenData = {
        userId: user?.uid || 'anon',
        username: userData?.username || (user?.email ? user.email.split('@')[0] : 'Trainer'),
        pokemon: targetPokemon.name,
        pokemonId: targetPokemon.id,
        sprite: targetPokemon.sprite,
        location: targetRegion || 'Unknown',
        coords: targetCoord || null,
        timestamp: firestore.FieldValue.serverTimestamp(),
        timestampMs: Date.now(),
      };
      console.log('💾 Writing seen:', seenData);
      firestore()
        .collection('seen')
        .add(seenData)
        .then((docRef) => {
          console.log('✅ Seen written:', docRef.id);
        })
        .catch((err) => {
          console.error('❌ Error writing seen:', err);
        });
    }
  }, [
    misses,
    status,
    targetPokemon,
    addSeenPokemon,
    updateXP,
    rewardProgress,
    userData?.xp,
    user,
    targetCoord,
    targetRegion,
    hasTargetParam,
  ]);

  const cameraUnavailable = camAuthorized && !camDevice;

  const handleShare = useCallback(async () => {
    if (!targetPokemon || status !== 'success') return;
    
    const shareMessage = `I just caught ${targetPokemon.name}! ${targetPokemon.descriptor || ''}\n\n` +
      `Type: ${targetPokemon.types.join(', ')}\n` +
      `Location: ${targetRegion || 'Unknown'}\n\n` +
      `#Pokemon #Pokedex`;
    
    try {
      await Share.open({
        message: shareMessage,
        title: `Caught ${targetPokemon.name}!`,
        url: targetPokemon.artwork || targetPokemon.animatedSprite || targetPokemon.sprite,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Error sharing:', error);
      }
    }
  }, [targetPokemon, status, targetRegion]);

  if (!hasTargetParam) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Select a Pokémon on the map to start capture.</Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Map' as never)}>
            <Text style={styles.emptyButtonText}>Go to Map</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!targetPokemon) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.consoleAccent} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}>
      {camDevice && camAuthorized && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={camDevice}
          isActive={status === 'running'}
        />
      )}
      {!camAuthorized && (
        <View style={styles.camOverlay}>
          <Text style={styles.helper}>Camera permission needed for AR capture.</Text>
          {camRequesting ? (
            <ActivityIndicator color={colors.consoleAccent} />
          ) : (
            <Text style={styles.helper}>Reopen to grant, or allow in Settings.</Text>
          )}
        </View>
      )}
      {cameraUnavailable && (
        <View style={styles.camOverlay}>
          <ActivityIndicator color={colors.consoleAccent} />
          <Text style={styles.helper}>Initializing camera…</Text>
        </View>
      )}
      <View style={styles.hud}>
        <View style={{ gap: 4 }}>
          <Text style={styles.hudLabel}>Target</Text>
          <Text style={styles.hudText}>{targetPokemon.name}</Text>
        </View>
        <View style={styles.livesRow}>
          {[0, 1, 2].map(i => (
            <Ionicons
              key={i}
              name="heart"
              size={18}
              color={i < LIVES - misses ? colors.consoleAccent : colors.textMuted}
            />
          ))}
        </View>
        <View style={{ gap: 6, flex: 1, marginHorizontal: 8 }}>
          <View style={styles.timerRow}>
            <Text style={styles.hudLabel}>Time</Text>
            <Text style={styles.hudText}>{timeLeft}s</Text>
          </View>
          <View style={styles.timerTrack}>
            <View
              style={[
                styles.timerFill,
                { width: `${Math.max(0, (timeLeft / roundSeconds) * 100)}%` },
              ]}
            />
          </View>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {(status === 'success' || status === 'fail') && (
        <View style={styles.rewardModal}>
          <View style={styles.rewardContent}>
            <ConsoleIcon
              variant={status === 'success' ? 'capture' : 'eye'}
              size={42}
              color={status === 'success' ? colors.consoleAccent : colors.textMuted}
            />
            <Text style={styles.rewardTitle}>
              {status === 'success' ? 'Captured!' : 'It fled'}
            </Text>
            <Text style={styles.rewardXP}>
              +{status === 'success' ? XP_SUCCESS : XP_FAIL} XP
            </Text>
            <View style={styles.rewardBarTrack}>
              <Animated.View
                style={[
                  styles.rewardBarFill,
                  {
                    width: rewardProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        `${Math.min(100, ((rewardPrevXp % 100) / 100) * 100)}%`,
                        `${Math.min(100, ((rewardNewXp % 100) / 100) * 100)}%`,
                      ],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.rewardSub}>
              Level {Math.floor((rewardNewXp || 0) / 100) + 1} • {rewardNewXp % 100}/100 XP
            </Text>
            <View style={styles.rewardActions}>
              <Pressable style={styles.closeReward} onPress={() => navigation.goBack()}>
                <Text style={styles.closeRewardText}>Close</Text>
              </Pressable>
              {status === 'success' && (
                <Pressable style={styles.shareRewardButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={16} color={colors.consoleAccent} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}

      {status === 'countdown' && (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.helper}>Get ready!</Text>
        </View>
      )}

      {visible && status === 'running' && (
        <Pressable
          onPress={() => {
            setVisible(false);
            if (popupRef.current) clearTimeout(popupRef.current);
          }}
          style={[
            styles.target,
            {
              top: pos.top,
              left: pos.left,
              width: targetSize,
              height: targetSize,
            },
          ]}>
          <Animated.Image
            source={{ uri: targetPokemon.artwork || targetPokemon.sprite }}
            style={{
              width: targetSize * 0.7,
              height: targetSize * 0.7,
              resizeMode: 'contain',
              transform: [
                {
                  translateX: worldParallaxX,
                },
                {
                  translateY: worldParallaxY,
                },
              ],
            }}
          />
        </Pressable>
      )}

      {showDirOverlay && status === 'running' && (
        <View style={styles.dirOverlayCenter} pointerEvents="none">
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: arrowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }),
                transform: [
                  { scale: arrowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
                ],
              },
            ]}
          />
          <View
            style={[
              styles.arrow,
              requiredDir === 'Up' && styles.arrowUp,
              requiredDir === 'Down' && styles.arrowDown,
              requiredDir === 'Left' && styles.arrowLeft,
              requiredDir === 'Right' && styles.arrowRight,
              dirMet(requiredDir, headingStartRef.current, heading) && styles.arrowNear,
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.consoleGlass,
    gap: 10,
  },
  hudLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hudText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  livesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.consoleGlass,
    overflow: 'hidden',
  },
  timerFill: {
    height: 8,
    backgroundColor: colors.consoleAccent,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: colors.blackPanel,
  },
  helper: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  camOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  camButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.consoleAccent,
  },
  camButtonText: {
    color: colors.blackPanel,
    fontWeight: '800',
    fontSize: 12,
  },
  target: {
    position: 'absolute',
    backgroundColor: 'rgba(52,245,197,0.12)',
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBanner: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: colors.blackPanel,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rewardText: {
    color: colors.consoleAccent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rewardModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  rewardContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.blackPanel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  rewardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  rewardXP: {
    color: colors.consoleAccent,
    fontSize: 22,
    fontWeight: '800',
  },
  rewardSub: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  rewardBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.consoleGlass,
    overflow: 'hidden',
    marginTop: 8,
  },
  rewardBarFill: {
    height: 10,
    backgroundColor: colors.consoleAccent,
    borderRadius: 6,
  },
  rewardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  shareRewardButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.blackPanel,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
  },
  closeReward: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.consoleAccent,
  },
  closeRewardText: {
    color: colors.blackPanel,
    fontWeight: '800',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.consoleAccent,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.blackPanel,
    fontWeight: '800',
    fontSize: 14,
  },
  dirOverlayCenter: {
    position: 'absolute',
    width: 110,
    height: 110,
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'red',
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'red',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'red',
  },
  arrowUp: {
    transform: [{ rotate: '0deg' }],
  },
  arrowDown: {
    transform: [{ rotate: '180deg' }],
  },
  arrowLeft: {
    transform: [{ rotate: '-90deg' }],
  },
  arrowRight: {
    transform: [{ rotate: '90deg' }],
  },
  arrowNear: {
    borderBottomColor: '#ff5a5a',
  },
  countdownBox: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.blackPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    alignItems: 'center',
    gap: 4,
  },
  countdownText: {
    color: colors.consoleAccent,
    fontSize: 48,
    fontWeight: '800',
  },
});

export default memo(CaptureScreen);

