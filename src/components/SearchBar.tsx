import { memo, useEffect, useRef, useState } from 'react';
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { colors } from '../theme/colors';
import { checkAndRequestPermission, checkPermission } from '../utils/permissions';

// Import Voice module - use require for better error handling
let Voice: any = null;
let isVoiceAvailable = false;

try {
  const VoiceModule = require('@react-native-voice/voice');
  Voice = VoiceModule.default || VoiceModule;
  
  // Check if module loaded
  if (Voice) {
    isVoiceAvailable = true;
    console.log('✅ Voice module loaded');
  }
} catch (err) {
  console.warn('❌ Voice module not available:', err);
  Voice = null;
  isVoiceAvailable = false;
}

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onVoiceSearch?: (text: string) => void;
};

const SearchBar = ({ value, onChangeText, placeholder = 'Search Pokémon...', onVoiceSearch }: Props) => {
  const [isListening, setIsListening] = useState(false);
  const [isHearing, setIsHearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [partialResult, setPartialResult] = useState<string>('');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check microphone permission on mount
    checkPermission('MICROPHONE').then(granted => {
      setHasPermission(granted);
    });

    // Test if Voice module is actually available at runtime
    if (Voice) {
      console.log('✅ Voice module loaded:', typeof Voice.start, typeof Voice.stop);
      // Try to check native module
      const { NativeModules } = require('react-native');
      if (NativeModules?.Voice) {
        console.log('✅ Native Voice module found');
      } else {
        console.warn('⚠️ Native Voice module not found - rebuild may be needed');
      }
    } else {
      console.error('❌ Voice module is null');
    }

    // Set up event handlers
    const onSpeechStart = () => {
      console.log('Speech started');
      setIsListening(true);
      setIsHearing(false);
      setError(null);
      setPartialResult('');
      // Start pulsing animation immediately
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    
    const onSpeechEnd = () => {
      setIsListening(false);
      setIsHearing(false);
      setPartialResult('');
      setError(null); // Clear any errors when speech ends
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    };
    
    const onSpeechError = (e: any) => {
      console.log('Speech error:', e);
      const errorCode = e.error?.code || e.error?.message || '';
      const errorMessage = e.error?.message || '';
      
      // Don't show error for normal cancellation or no speech detected
      const isNormalError = 
        errorCode === 'ERROR_NO_MATCH' || 
        errorCode === 'ERROR_CLIENT' ||
        errorMessage.includes('No match') ||
        errorMessage.includes('no speech') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('timeout');
      
      setIsListening(false);
      setIsHearing(false);
      setPartialResult('');
      
      // Only set error for actual problems, not normal "no speech" cases
      if (!isNormalError) {
        setError(errorMessage || 'Voice recognition error');
      } else {
        setError(null); // Clear error for normal cases
      }
      
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    };
    
    const onSpeechResults = (e: any) => {
      console.log('Speech results:', e);
        if (e.value && e.value.length > 0) {
        const result = e.value[0].trim();
        console.log('🎤 Voice search result:', result);
        onChangeText(result);
        // Cache the search
        const { addRecentSearch } = require('../utils/cache');
        addRecentSearch(result);
        if (onVoiceSearch) {
          onVoiceSearch(result);
        }
      }
      setIsListening(false);
      setIsHearing(false);
      setPartialResult('');
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    };
    
    const onSpeechPartialResults = (e: any) => {
      console.log('Partial results:', e);
      if (e.value && e.value.length > 0) {
        const partial = e.value[0].trim();
        setPartialResult(partial);
        setIsHearing(true);
        console.log('Partial result:', partial);
      }
    };
    
    const onSpeechVolumeChanged = (e: any) => {
      // Visual feedback when hearing sound - pulse faster when hearing
      console.log('Volume changed:', e.value);
      if (e.value && e.value > 0) {
        setIsHearing(true);
        // Speed up animation when hearing - faster pulse
        pulseAnim.stopAnimation();
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      } else {
        // Slow down when not hearing
        setIsHearing(false);
        pulseAnim.stopAnimation();
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }
    };

    // Check if Voice is available
    if (!Voice || !isVoiceAvailable) {
      console.warn('Voice module not available, voice search disabled');
      return;
    }

    // Remove existing listeners first
    try {
      if (Voice && typeof Voice.removeAllListeners === 'function') {
        Voice.removeAllListeners();
      }
    } catch (err) {
      console.warn('Error removing voice listeners:', err);
    }
    
    // Add new listeners
    try {
      if (Voice && typeof Voice === 'object') {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;
      }
    } catch (err) {
      console.error('Error setting up voice handlers:', err);
    }

    return () => {
      try {
        if (Voice && typeof Voice.removeAllListeners === 'function') {
          Voice.removeAllListeners();
        }
        if (Voice && typeof Voice.destroy === 'function') {
          Voice.destroy();
        }
      } catch (err) {
        console.warn('Voice cleanup warning:', err);
      }
    };
  }, [onChangeText, onVoiceSearch]);


  const startListening = async () => {
    try {
      setError(null);
      
      // Check if Voice module is loaded
      if (!Voice) {
        setError('Voice module not loaded. Rebuild required: npm run android');
        console.error('❌ Voice module is null');
        return;
      }
      
      // Check if Voice methods exist
      if (typeof Voice.start !== 'function') {
        setError('Voice native module not linked. Rebuild: npm run android');
        console.error('❌ Voice.start is not a function');
        return;
      }
      
      // Start pulsing animation immediately when button is pressed
      setIsListening(true);
      setIsHearing(false);
      setPartialResult('');
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      
      // Check permission first
      if (hasPermission === false || hasPermission === null) {
        const granted = await checkAndRequestPermission('MICROPHONE');
        setHasPermission(granted);
        if (!granted) {
          setError('Microphone permission required');
          setIsListening(false);
          pulseAnim.stopAnimation();
          pulseAnim.setValue(0);
          return;
        }
      }

      // Stop any existing recognition
      try {
        if (typeof Voice.stop === 'function') {
          await Voice.stop();
        }
        if (typeof Voice.cancel === 'function') {
          await Voice.cancel();
        }
      } catch (e) {
        // Ignore errors from stop/cancel - they might not be running
        console.log('Stop/cancel (expected if not running):', e);
      }

      // Start voice recognition
      console.log('🎤 Attempting to start voice recognition...');
      await Voice.start('en-US');
      console.log('✅ Voice recognition started successfully');
    } catch (err: any) {
      console.error('❌ Voice start error:', err);
      const errorMsg = err?.message || 'Unknown error';
      
      // Provide helpful error messages
      if (errorMsg.includes('null') || errorMsg.includes('undefined') || errorMsg.includes('startSpeech')) {
        setError('Native module not linked. Rebuild: npm run android');
      } else if (errorMsg.includes('permission')) {
        setError('Microphone permission denied');
      } else {
        setError(`Voice error: ${errorMsg}`);
      }
      
      setIsListening(false);
      setIsHearing(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  };

  const stopListening = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
      setIsListening(false);
      setIsHearing(false);
      setPartialResult('');
      setError(null); // Clear error when manually stopping
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    } catch (err) {
      console.error('Error stopping voice:', err);
      setIsListening(false);
      setIsHearing(false);
      setError(null); // Clear error even on stop error
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  };

  const handleVoicePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3], // Toned down opacity
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1], // Toned down scale (was 1.4)
  });

  return (
    <View style={styles.container}>
      <Icon name="search" size={16} color={colors.textMuted} />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={partialResult || value}
          onChangeText={(text) => {
            onChangeText(text);
            // Cache non-empty searches (debounced - only cache when user stops typing)
            if (text && text.trim().length > 0) {
              // Clear previous timeout
              if (cacheTimeoutRef.current) {
                clearTimeout(cacheTimeoutRef.current);
              }
              // Set new timeout to cache after user stops typing
              cacheTimeoutRef.current = setTimeout(() => {
                const { addRecentSearch } = require('../utils/cache');
                addRecentSearch(text.trim());
              }, 1500); // Cache after 1.5 seconds of no typing
            }
          }}
          placeholder={isListening ? 'Listening...' : placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isListening}
        />
        {isListening && (
          <View style={styles.listeningIndicator}>
            <Animated.View
              style={[
                styles.listeningDot,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                  backgroundColor: isHearing ? colors.consoleAccent : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.listeningText}>
              {isHearing ? 'Hearing...' : 'Listening...'}
            </Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={handleVoicePress}
        style={[
          styles.voiceButton,
          isListening && styles.voiceButtonActive,
          isHearing && styles.voiceButtonHearing,
        ]}
        android_ripple={{ color: colors.consoleAccent, borderless: true }}>
        <Animated.View
          style={isListening ? {
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          } : {}}>
          <Icon
            name="mic"
            size={20}
            color={
              isHearing 
                ? colors.consoleAccent 
                : isListening 
                  ? colors.highlight 
                  : hasPermission === false 
                    ? colors.textMuted 
                    : colors.textSecondary
            }
          />
        </Animated.View>
      </Pressable>
      {error && (
        <View style={styles.errorBadge}>
          <Text style={styles.errorText}>!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
    height: 20,
  },
  listeningIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listeningText: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  voiceButton: {
    padding: 4,
    borderRadius: 4,
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(52, 245, 197, 0.1)',
  },
  voiceButtonHearing: {
    backgroundColor: 'rgba(52, 245, 197, 0.2)',
  },
  errorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F85C50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default memo(SearchBar);
