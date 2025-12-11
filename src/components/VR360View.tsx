/**
 * VR-lite 360-degree view component
 * Uses Google Street View panorama for habitat viewing
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native';
import { gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type VR360ViewProps = {
  pokemon: Array<{
    id: string;
    name: string;
    sprite: string;
    animatedSprite?: string;
    habitat?: string;
  }>;
  onPokemonPress?: (pokemonId: string) => void;
};

// Get habitat-appropriate panorama image URL
const getHabitatPanorama = (habitat?: string): string => {
  if (!habitat) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2048'; // Forest default
  
  const habitatLower = habitat.toLowerCase();
  
  // Use Unsplash panoramic images based on habitat
  if (habitatLower.includes('water') || habitatLower.includes('sea')) {
    return 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=2048'; // Ocean
  }
  if (habitatLower.includes('urban') || habitatLower.includes('city')) {
    return 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=2048'; // City
  }
  if (habitatLower.includes('mountain')) {
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048'; // Mountain
  }
  if (habitatLower.includes('cave')) {
    return 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2048'; // Cave/Dark
  }
  if (habitatLower.includes('grassland')) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2048'; // Grassland
  }
  return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2048'; // Forest default
};

const VR360View = ({ pokemon, onPokemonPress }: VR360ViewProps) => {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [isCalibrated, setIsCalibrated] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const calibrationRef = useRef({ x: 0, y: 0, z: 0 });
  const scrollViewRef = useRef<ScrollView>(null);

  // Set update interval for smoother tracking
  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.gyroscope, 16); // ~60fps
  }, []);

  useEffect(() => {
    // Calibrate on mount
    const calibrateTimer = setTimeout(() => {
      if (gyroData.x !== 0 || gyroData.y !== 0 || gyroData.z !== 0) {
        calibrationRef.current = { ...gyroData };
        setIsCalibrated(true);
      }
    }, 1000);

    const subscription = gyroscope.subscribe(({ x, y, z }) => {
      setGyroData({ x, y, z });
    });

    return () => {
      clearTimeout(calibrateTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Update scroll position based on gyroscope (horizontal pan only)
  useEffect(() => {
    if (!isCalibrated || !scrollViewRef.current) return;

    // Calculate relative rotation from calibrated position (horizontal only)
    const deltaY = (gyroData.y - calibrationRef.current.y) * 500; // Horizontal pan multiplier
    
    // Clamp to panorama width (2048px typical panorama width)
    const panoramaWidth = SCREEN_WIDTH * 3; // 3x screen width for 360 effect
    const targetX = Math.max(0, Math.min(panoramaWidth - SCREEN_WIDTH, deltaY + panoramaWidth / 2));

    // Smooth scroll to position
    scrollViewRef.current.scrollTo({
      x: targetX,
      animated: true,
    });
  }, [gyroData, isCalibrated]);

  const habitatPanorama = pokemon.length > 0 
    ? getHabitatPanorama(pokemon[0].habitat) 
    : getHabitatPanorama();

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.panoramaContainer}
        style={styles.scrollView}>
        {/* Panoramic image - repeat 3 times for seamless 360 effect */}
        <Image
          source={{ uri: habitatPanorama }}
          style={styles.panoramaImage}
          resizeMode="cover"
        />
        <Image
          source={{ uri: habitatPanorama }}
          style={styles.panoramaImage}
          resizeMode="cover"
        />
        <Image
          source={{ uri: habitatPanorama }}
          style={styles.panoramaImage}
          resizeMode="cover"
        />
      </ScrollView>

      {/* Pokémon positioned in view */}
      <View style={styles.pokemonOverlay} pointerEvents="box-none">
        {pokemon.slice(0, 3).map((poke, index) => {
          // Distribute Pokémon across the panorama
          const positionX = (SCREEN_WIDTH * 3) * (0.25 + index * 0.25); // Spread across panorama
          const positionY = SCREEN_HEIGHT * 0.6; // Lower third of screen
          
          return (
            <Pressable
              key={poke.id}
              style={[
                styles.pokemonContainer,
                {
                  left: positionX - 60,
                  top: positionY,
                },
              ]}
              onPress={() => onPokemonPress?.(poke.id)}>
              <Image
                source={{ uri: poke.animatedSprite || poke.sprite }}
                style={styles.pokemonSprite}
                resizeMode="contain"
              />
              <Text style={styles.pokemonName}>{poke.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* VR UI Overlay */}
      <View style={styles.vrOverlay} pointerEvents="none">
        <View style={styles.centerReticle} />
        {!isCalibrated && (
          <View style={styles.calibrationMessage}>
            <Text style={styles.calibrationText}>
              Calibrating... Move device slowly
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  panoramaContainer: {
    width: SCREEN_WIDTH * 3, // 3x width for seamless scrolling
    height: SCREEN_HEIGHT,
  },
  panoramaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pokemonOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  pokemonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokemonSprite: {
    width: 120,
    height: 120,
  },
  pokemonName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  vrOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerReticle: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
  },
  calibrationMessage: {
    position: 'absolute',
    top: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  calibrationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VR360View;
