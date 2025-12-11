import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import Toast from '../components/Toast';
import GridPattern from '../components/GridPattern';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Removed image loading states - screen shows immediately

  const { signIn, signUp } = useAuth();

  // Carousel of pixel sprites (PNG; wide grid to fill background)
  const spriteIds = useMemo(
    // Reduced to 50 for faster loading
    () => Array.from({ length: 50 }, (_, i) => i + 1),
    [],
  );
  const rows = 20; // Keep 20 rows
  const cols = 8; // 8 columns for a more crowded look
  const visiblePerRow = cols + 2; // slight buffer to avoid gaps
  // Randomized start per row for variety; no updates to avoid jitter
  const startIndices = useMemo(
    () => Array.from({ length: rows }, (_, r) => ((r * 3 + Math.floor(Math.random() * 5)) % spriteIds.length)),
    [rows, spriteIds.length],
  );
  const screenWidth = Dimensions.get('window').width;
  const cellWidth = screenWidth / cols;
  const cellHeight = 46;
  const sharedShift = useRef(new Animated.Value(0)).current;
  const totalWidth = visiblePerRow * cellWidth;

  // Build data for current frame
  const collageRows = useMemo(() => {
    // A simple staggered layout; keep sprites sparse to reduce visual overlap
    const stride = Math.max(5, Math.floor(spriteIds.length / rows));
    return Array.from({ length: rows }).map((_, row) => {
      const baseStart = startIndices[row] ?? 0;
      const rowStart = (baseStart + row * stride) % spriteIds.length;
      const tiles = Array.from({ length: visiblePerRow }).map((__, col) => {
        const id = spriteIds[(rowStart + col) % spriteIds.length];
        return {
          key: `row-${row}-col-${col}`,
          uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
          top: 4 + row * cellHeight,
          left: col * cellWidth,
        };
      });
      return { row, tiles };
    });
  }, [cellHeight, cellWidth, rows, spriteIds, startIndices, visiblePerRow]);

  // Screen shows immediately - no preloading needed

  // Continuous marquee with single direction and shared shift (wrap via duplicate copy)
  useEffect(() => {
    // Start animation immediately - don't wait
    let mounted = true;
    
    // Use requestAnimationFrame to start animation on next frame (non-blocking)
    const startAnimation = () => {
      if (!mounted) return;
      
      const tick = () => {
        if (!mounted) return;
        sharedShift.setValue(0);
        Animated.timing(sharedShift, {
          toValue: -totalWidth,
          duration: 32000, // slow, smooth marquee
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished || !mounted) return;
          tick();
        });
      };
      tick();
    };
    
    // Start on next frame to avoid blocking initial render
    requestAnimationFrame(startAnimation);

    return () => {
      mounted = false;
      sharedShift.stopAnimation();
    };
  }, [sharedShift, totalWidth]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !displayName) {
      setError('Please enter a display name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        setToastMessage('Account created successfully!');
      } else {
        await signIn(email, password);
        setToastMessage('Signed in successfully!');
      }
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GridPattern
        style={styles.grid}
        gap={18}
        opacity={0.16}
        rows={60}
        columns={32}
        lineColor={colors.consoleAccent}
        thickness={0.8}
      />
      <View style={styles.collage}>
        {collageRows.map(({ tiles }) =>
          tiles.flatMap((tile, index) => {
            const baseStyle = {
              position: 'absolute' as const,
              top: tile.top,
              left: tile.left,
            };
            return [
              <Animated.View
                key={`${tile.key}-a`}
                style={{
                  ...baseStyle,
                  transform: [{ translateX: sharedShift }],
                }}>
                <Image
                  source={{ uri: tile.uri }}
                  style={[
                    styles.collageImage,
                    { transform: [{ rotate: `${(index % 5) * 2 - 4}deg` }] },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>,
              <Animated.View
                key={`${tile.key}-b`}
                style={{
                  ...baseStyle,
                  left: tile.left + totalWidth,
                  transform: [{ translateX: sharedShift }],
                }}>
                <Image
                  source={{ uri: tile.uri }}
                  style={[
                    styles.collageImage,
                    { transform: [{ rotate: `${(index % 5) * 2 - 4}deg` }] },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>,
            ];
          }),
        )}
      </View>
      <View style={styles.overlay} />

      <View style={styles.card}>
        <View style={styles.titleStrip}>
          <Image
            source={require('../../pokelogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRow} />

        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
            onPress={() => {
              setIsSignUp(false);
              setError('');
            }}>
            <Text style={[styles.modeText, !isSignUp && styles.modeTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
            onPress={() => {
              setIsSignUp(true);
              setError('');
            }}>
            <Text style={[styles.modeText, isSignUp && styles.modeTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        {isSignUp && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Trainer Name"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <Pressable onPress={() => setShowPassword(prev => !prev)}>
              <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>
            {isSignUp ? 'Create account' : 'Sign in'}
          </Text>
        )}
        </Pressable>

        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Have an account? Sign in' : 'Need an account? Create one'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setError('')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>
      </View>

      <Toast visible={toastVisible} message={toastMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.14,
  },
  collage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 1,
  },
  collageImage: {
    position: 'absolute',
    width: 56,
    height: 56,
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,12,0.1)',
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.consoleBackground,
    borderRadius: 12,
    padding: 30,
    borderWidth: 1.5,
    borderColor: colors.consoleGlass,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    shadowOpacity: 0,
    elevation: 0,
    gap: 20,
    zIndex: 3,
    minHeight: 600,
  },
  brand: {
    textAlign: 'center',
    color: colors.accentAmber || '#FFD75E',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    // Try the generated PostScript name from the asset; add fallbacks if needed
    fontFamily: 'pokemon_black_and_white_version_font_by_mauriziovit_d4t992c',
  },
  headerRow: {
    paddingBottom: 12,
  },
  titleStrip: {
    position: 'relative',
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginHorizontal: -8,
    marginBottom: 8,
    backgroundColor: colors.blackPanel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '95%',
    height: 100,
    maxWidth: 400,
    maxHeight: 100,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.blackPanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    overflow: 'hidden',
    marginTop: 6,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.consoleAccent,
  },
  modeText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  modeTextActive: {
    color: colors.consolePanel,
  },
  inputContainer: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.blackPanel,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    color: colors.consoleAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    color: colors.textPrimary,
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.consoleAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.1,
  },
  bottomRow: {
    marginTop: 12,
    gap: 6,
  },
  switchText: {
    color: colors.consoleAccent,
    fontSize: 13,
  },
  forgotText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;

