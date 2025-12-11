import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Image, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import Toast from '../components/Toast';
import { regions, useRegion } from '../context/RegionContext';
import { usePokemon } from '../context/PokemonContext';
import { colors } from '../theme/colors';
import { navigateRoot } from '../navigation/navigationRef';
import { detectBiomeFallback, mapHabitatToBiome, detectNearbyBiomes, getPokemonPossibleBiomes, detectBiomeZones, BiomeZone, findBiomeZoneForLocation, detectBiomeFromRealWorld } from '../utils/biomes';
import { calculateDistance, isWithinRadius, formatDistance, doCirclesOverlap } from '../utils/distance';
import { configureNotifications, notifyPokemonSpawn, cancelAllNotifications } from '../utils/notifications';

// Capture radius in meters (increased for easier gameplay)
const CAPTURE_RADIUS = 200;
// User interaction radius (how close you need to be to interact)
const USER_RADIUS = 150;

const MapScreen = () => {
  const { selectedRegion, setSelectedRegion } = useRegion();
  const { pokemon } = usePokemon();
  const navigation = useNavigation();
  const mapRef = useRef<MapView | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionNonce, setPermissionNonce] = useState(0); // rerun permission flow on demand
  const [debugInfo, setDebugInfo] = useState<string>('init');
  type Spawn = {
    id: string;
    name: string;
    sprite: string;
    animatedSprite?: string;
    coord: { latitude: number; longitude: number };
    biome: string; // Current spawn location biome
    possibleBiomes: string[]; // All biomes this Pokémon can spawn in
    habitat: string;
    notified: boolean; // Track if notification was sent
  };
  
  // Track sprite loading errors for fallback
  const [spriteErrors, setSpriteErrors] = useState<Set<string>>(new Set());
  
  // Spawns are stored in React state (in-memory only, not persisted)
  // They are cleared when: region changes, hour resets, or manual reset
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [lastResetHour, setLastResetHour] = useState<number | null>(null);
  const [resetEta, setResetEta] = useState<string>('—');
  const [currentBiome, setCurrentBiome] = useState<string>('grassland');
  const [spawnsLoading, setSpawnsLoading] = useState(false);
  const [showNearbyBiomes, setShowNearbyBiomes] = useState(false);
  const [biomeZones, setBiomeZones] = useState<BiomeZone[]>([]); // Actual biome zones with locations
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null); // For showing biome radius
  const [selectedBiomeLocation, setSelectedBiomeLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // Removed nearbyBiomes state - we use biomeZones instead
  
  // All possible biomes that Pokémon can spawn in
  const allBiomes: string[] = ['urban', 'water', 'forest', 'grassland', 'mountain', 'cave', 'rare'];

  const handleRegionSelect = (regionId: number) => {
    const region = regions.find(r => r.id === regionId);
    if (region) {
      // Clear existing spawns and sprite errors immediately when region changes
      setSpawns([]);
      setSpriteErrors(new Set());
      // Cancel any pending notifications from old region
      cancelAllNotifications();
      setSelectedRegion(region);
      setIsExpanded(false); // Collapse after selection
      setMapKey(prev => prev + 1); // force map reload
      
      // Reset hour key to force immediate spawn regeneration
      setLastResetHour(null);
      
      // Show toast notification
      setToastMessage(`Region changed to ${region.name}. Spawns resetting...`);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    }
  };

  // Debug function to force reset spawns
  const forceResetSpawns = useCallback(() => {
    if (!center) {
      Alert.alert('No Location', 'GPS location needed to generate spawns');
      return;
    }
    
    // Clear existing spawns and sprite errors
    setSpawns([]);
    setSpriteErrors(new Set());
    cancelAllNotifications();
    
    // Reset hour key to force regeneration
    setLastResetHour(null);
    
    // Force regeneration
    setSpawnsLoading(true);
    setTimeout(() => {
      if (biomeZones.length > 0) {
        const newSpawns = generateSpawns(center, biomeZones);
        setSpawns(newSpawns);
        setSpawnsLoading(false);
        
        // Notify about new spawns
        newSpawns.forEach(spawn => {
          const distance = calculateDistance(center, spawn.coord);
          notifyPokemonSpawn(spawn.name, distance, spawn.biome);
        });
        
        setToastMessage('Spawns reset!');
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 1500);
      } else {
        setSpawnsLoading(false);
      }
    }, 100);
  }, [center, biomeZones, generateSpawns]);

  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number | null = null;
    let isMounted = true;

    const seedPosition = (label: string) => {
      setIsRequesting(true);
      setDebugInfo(`${label}: getCurrentPosition (hi acc)`);
      Geolocation.getCurrentPosition(
        pos => {
          if (!isMounted) return;
          setCenter({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationError(null);
          setDebugInfo(
            `${label}: fix lat:${pos.coords.latitude.toFixed(4)} lon:${pos.coords.longitude.toFixed(4)}`,
          );
          setIsRequesting(false);
        },
        err => {
          if (!isMounted) return;
          setDebugInfo(`${label}: hi-acc fail code:${err.code} msg:${err.message}`);
          // fallback to coarse/low accuracy
          Geolocation.getCurrentPosition(
            pos => {
              if (!isMounted) return;
              setCenter({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
              setLocationError(null);
              setDebugInfo(
                `${label}: fallback fix lat:${pos.coords.latitude.toFixed(4)} lon:${pos.coords.longitude.toFixed(4)}`,
              );
              setIsRequesting(false);
            },
            err2 => {
              if (!isMounted) return;
              setLocationError('GPS unavailable. Check location settings or set emulator location.');
              setDebugInfo(`${label}: fallback fail code:${err2.code} msg:${err2.message}`);
              setIsRequesting(false);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 },
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 },
      );
    };

    const requestLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ]);
          const fineGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
          const coarseGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
          if (
            fineGranted !== PermissionsAndroid.RESULTS.GRANTED &&
            coarseGranted !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            setLocationError('Location permission denied. Enable it to center the map.');
            setDebugInfo('permission denied');
            return;
          }
          setDebugInfo('permission granted android');
        } else {
          const auth = Geolocation.requestAuthorization?.('whenInUse');
          setDebugInfo(`ios auth: ${auth ?? 'requested'}`);
        }

        seedPosition('seed');

        watchId = Geolocation.watchPosition(
          pos => {
            setCenter({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setLocationError(null);
            setDebugInfo(
              `watch lat:${pos.coords.latitude.toFixed(4)} lon:${pos.coords.longitude.toFixed(4)}`,
            );
          },
          err => {
            setLocationError(err.message);
            setDebugInfo(`watch error code:${err.code} msg:${err.message}`);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 4000,
            fastestInterval: 2000,
            timeout: 10000,
          },
        );
      } catch (error) {
        setLocationError('Unable to access location');
      }
    };

    requestLocation();
    return () => {
      isMounted = false;
      if (watchId != null) {
        Geolocation.clearWatch(watchId);
      }
      Geolocation.stopObserving();
    };
  }, [permissionNonce]);

  // Initialize notifications on mount
  useEffect(() => {
    configureNotifications().catch(err => {
      console.error('Failed to configure notifications:', err);
    });
  }, []);

  const generateSpawns = useCallback(
    (c: { latitude: number; longitude: number }, zones: BiomeZone[]) => {
      // Fallback: if no zones detected, create a default zone at user location
      if (zones.length === 0) {
        const fallbackBiome = detectBiomeFallback(c.latitude, c.longitude);
        zones = [{
          biome: fallbackBiome,
          center: c,
          radius: 1000, // 1km radius for fallback
          strength: 1.0,
        }];
      }
      
      // Group Pokémon by their possible biomes
      const pokemonByBiome = new Map<Biome, typeof pokemon>();
      
      pokemon.forEach(p => {
        const possibleBiomes = getPokemonPossibleBiomes(p.habitat, p.types);
        possibleBiomes.forEach(biome => {
          if (!pokemonByBiome.has(biome)) {
            pokemonByBiome.set(biome, []);
          }
          pokemonByBiome.get(biome)!.push(p);
        });
      });
      
      // Track spawn positions to prevent stacking
      const existingSpawns: Array<{ latitude: number; longitude: number }> = [];
      const minDistanceBetweenSpawns = 200; // 200m minimum between spawns
      const newSpawns: Spawn[] = [];
      
      // For each biome zone, spawn appropriate Pokémon
      zones.forEach(zone => {
        const zonePokemon = pokemonByBiome.get(zone.biome) || [];
        if (zonePokemon.length === 0) return;
        
        // Spawn 2-4 Pokémon per zone (based on zone strength)
        const spawnCount = Math.min(
          Math.max(2, Math.floor(zone.strength * 4)),
          zonePokemon.length
        );
        
        // Select random Pokémon for this zone
        const shuffled = [...zonePokemon].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, spawnCount);
        
        selected.forEach(p => {
          // Ensure sprite URLs are valid
          const sprite = p.sprite?.trim() || '';
          const animatedSprite = p.animatedSprite?.trim() || '';
          
          if (!sprite && !animatedSprite) {
            console.warn(`⚠️ No sprite URL for ${p.name} (ID: ${p.id})`);
          }
          
          // Spawn within the biome zone
          let spawnCoord;
          let attempts = 0;
          let validPosition = false;
          
          while (!validPosition && attempts < 20) {
            // Random position within zone radius
            const radiusRatio = Math.random(); // 0 to 1
            const angle = Math.random() * 2 * Math.PI;
            
            // Convert zone radius to degrees
            const radiusDegrees = (zone.radius * radiusRatio) / 111000;
            spawnCoord = {
              latitude: zone.center.latitude + radiusDegrees * Math.cos(angle),
              longitude: zone.center.longitude + radiusDegrees * Math.sin(angle),
            };
            
            // Check if too close to existing spawns
            const tooClose = existingSpawns.some(existing => {
              const dist = calculateDistance(existing, spawnCoord);
              return dist < minDistanceBetweenSpawns;
            });
            
            // Verify spawn is still within zone (simplified check - just check distance from center)
            const distFromCenter = calculateDistance(zone.center, spawnCoord);
            const inZone = distFromCenter <= zone.radius;
            
            if (!tooClose && inZone) {
              validPosition = true;
            }
            
            attempts++;
          }
          
          // If we couldn't find a valid position, skip this spawn
          if (!validPosition || !spawnCoord) {
            return;
          }
          
          existingSpawns.push(spawnCoord);
          
          // Get all possible biomes this Pokémon can spawn in
          const possibleBiomes = getPokemonPossibleBiomes(p.habitat, p.types);
          
          // Create unique ID to avoid duplicate key errors
          const uniqueId = `${p.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          newSpawns.push({
            id: uniqueId,
            name: p.name,
            sprite: sprite,
            animatedSprite: animatedSprite,
            coord: spawnCoord,
            biome: zone.biome, // Use the zone's biome
            possibleBiomes: possibleBiomes,
            habitat: p.habitat || 'unknown',
            notified: false,
          });
        });
      });
      
      // If we still have no spawns, create some fallback spawns
      if (newSpawns.length === 0) {
        console.warn('⚠️ No spawns generated, creating fallback spawns');
        const fallbackBiome = detectBiomeFallback(c.latitude, c.longitude);
        const allPokemon = pokemon.filter(p => {
          const possibleBiomes = getPokemonPossibleBiomes(p.habitat, p.types);
          return possibleBiomes.includes(fallbackBiome);
        });
        
        const pool = allPokemon.length > 0 ? allPokemon : pokemon;
        const spawnCount = Math.min(12, pool.length);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, spawnCount);
        
        selected.forEach((p, idx) => {
          const maxRadius = 0.018; // ~2km
          const radius = Math.random() * maxRadius;
          const angle = Math.random() * 2 * Math.PI;
          const spawnCoord = {
            latitude: c.latitude + radius * Math.cos(angle),
            longitude: c.longitude + radius * Math.sin(angle),
          };
          
          const possibleBiomes = getPokemonPossibleBiomes(p.habitat, p.types);
          const uniqueId = `fallback-${p.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          newSpawns.push({
            id: uniqueId,
            name: p.name,
            sprite: p.sprite?.trim() || '',
            animatedSprite: p.animatedSprite?.trim() || '',
            coord: spawnCoord,
            biome: fallbackBiome,
            possibleBiomes: possibleBiomes,
            habitat: p.habitat || 'unknown',
            notified: false,
          });
        });
      }
      
      return newSpawns;
    },
    [pokemon],
  );

  // Detect biome zones when location changes
  useEffect(() => {
    if (center) {
      // Use real-world biome detection for user's location (ONLY real-world, no fallback)
      detectBiomeFromRealWorld(center.latitude, center.longitude, 800)
        .then(biome => {
          if (biome) {
            setCurrentBiome(biome);
            console.log(`📍 Current biome detected: ${biome}`);
          } else {
            // If no real-world data, default to grassland (but this should be rare)
            console.warn('No real-world biome data available, using grassland');
            setCurrentBiome('grassland');
          }
        })
        .catch((error) => {
          // On error, default to grassland
          console.warn('Real-world biome detection error, using grassland:', error);
          setCurrentBiome('grassland');
        });
      
      // Detect biome zones around the user (gradient-based)
      // Scan 3km radius, create 400m zones (will generate many zones including one at user location)
      // Note: Zone detection still uses fallback for performance, but user location uses real-world
      const zones = detectBiomeZones(center.latitude, center.longitude, 3000, 400);
      setBiomeZones(zones);
      
      // Update user's zone biome to match current biome (fix mismatch)
      if (zones.length > 0 && zones[0].center.latitude === center.latitude && zones[0].center.longitude === center.longitude) {
        // User's zone is the first one - update it with real-world biome
        detectBiomeFromRealWorld(center.latitude, center.longitude, 800)
          .then(biome => {
            if (biome) {
              setBiomeZones(prevZones => {
                const updated = [...prevZones];
                if (updated.length > 0) {
                  updated[0] = { ...updated[0], biome };
                }
                return updated;
              });
            }
          })
          .catch(() => {
            // Ignore errors for zone update
          });
      }
      
      // Clear selected biome if user has moved significantly away from it
      if (selectedBiomeLocation) {
        const distance = calculateDistance(selectedBiomeLocation, center);
        if (distance > 1000) { // Clear if moved more than 1km away
          setSelectedBiome(null);
          setSelectedBiomeLocation(null);
        }
      }
    }
  }, [center]);

  // Track previous region to detect changes
  const prevRegionRef = useRef(selectedRegion.id);
  
  // Generate spawns with biome filtering
  useEffect(() => {
    if (!center) return;
    
    const hourKey = Math.floor(Date.now() / (60 * 60 * 1000)); // global hourly bucket
    const regionChanged = prevRegionRef.current !== selectedRegion.id;
    
    // Regenerate spawns if:
    // 1. First time (lastResetHour is null)
    // 2. Hour changed (hourKey !== lastResetHour)
    // 3. No spawns exist (spawns.length === 0)
    // 4. Region changed (regionChanged)
    if (lastResetHour === null || hourKey !== lastResetHour || spawns.length === 0 || regionChanged) {
      prevRegionRef.current = selectedRegion.id;
      setLastResetHour(hourKey);
      setSpawnsLoading(true);
      
      // Small delay to ensure Pokemon context has updated for new region
      // Also wait a bit for biome zones to be detected
      setTimeout(() => {
        // Use current biomeZones, or generate spawns anyway (generateSpawns has fallback)
        const newSpawns = generateSpawns(center, biomeZones);
        setSpawns(newSpawns);
        setSpawnsLoading(false);
        
        // Notify about new spawns (only if not region change to avoid spam)
        if (!regionChanged) {
          newSpawns.forEach(spawn => {
            const distance = calculateDistance(center, spawn.coord);
            notifyPokemonSpawn(spawn.name, distance, spawn.biome);
          });
        }
      }, 200); // Increased delay to allow biome zones to be detected
    }
  }, [center, generateSpawns, lastResetHour, spawns.length, selectedRegion, biomeZones]);

  // Check for nearby spawns and send notifications
  // This runs independently and checks if user gets close to spawns
  useEffect(() => {
    if (!center || spawns.length === 0) return;
    
    const checkNearbySpawns = () => {
      spawns.forEach(spawn => {
        if (spawn.notified) return; // Already notified
        
        const distance = calculateDistance(center, spawn.coord);
        // Notify if within 200m (notification radius)
        if (distance <= 200) {
          notifyPokemonSpawn(spawn.name, distance, spawn.biome);
          setSpawns(prev => prev.map(s => 
            s.id === spawn.id ? { ...s, notified: true } : s
          ));
        }
      });
    };
    
    // Check every 10 seconds
    const interval = setInterval(checkNearbySpawns, 10000);
    checkNearbySpawns(); // Check immediately
    
    return () => clearInterval(interval);
  }, [center, spawns]);

  // Random spawn system - occasionally spawn a Pokémon near the user between resets
  const lastRandomSpawnRef = useRef<number>(0);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastCheckRef = useRef<number>(0);
  
  // Function to create a random spawn (reusable for debug)
  const createRandomSpawn = useCallback((force: boolean = false) => {
    if (!center || pokemon.length === 0) return;
    
    const now = Date.now();
    
    if (!force) {
      const timeSinceLastCheck = now - lastCheckRef.current;
      const checkInterval = 60 * 1000; // Check every minute
      
      // Throttle checks to once per minute
      if (timeSinceLastCheck < checkInterval) return;
      lastCheckRef.current = now;
      
      const timeSinceLastSpawn = now - lastRandomSpawnRef.current;
      const minSpawnInterval = 5 * 60 * 1000; // Minimum 5 minutes between random spawns
      
      // Check if user has moved significantly (at least 50m)
      let hasMovedSignificantly = false;
      if (lastLocationRef.current) {
        const distanceMoved = calculateDistance(lastLocationRef.current, center);
        hasMovedSignificantly = distanceMoved >= 50;
      }
      lastLocationRef.current = center;
      
      // Random spawn chance: 15% chance every 5+ minutes if user has moved
      // Or 5% chance if user hasn't moved (less frequent)
      const spawnChance = hasMovedSignificantly ? 0.15 : 0.05;
      const shouldSpawn = 
        timeSinceLastSpawn >= minSpawnInterval && 
        Math.random() < spawnChance;
      
      if (!shouldSpawn) return;
    }
    
    // Find a random biome zone to spawn in
    if (biomeZones.length === 0) return;
    
    // Prefer non-urban zones (70% chance)
    const nonUrbanZones = biomeZones.filter(z => z.biome !== 'urban');
    const zonePool = nonUrbanZones.length > 0 && Math.random() < 0.7 
      ? nonUrbanZones 
      : biomeZones;
    const randomZone = zonePool[Math.floor(Math.random() * zonePool.length)];
    
    // Get Pokémon that can spawn in this zone's biome
    const zonePokemon = pokemon.filter(p => {
      const possibleBiomes = getPokemonPossibleBiomes(p.habitat, p.types);
      return possibleBiomes.includes(randomZone.biome);
    });
    
    if (zonePokemon.length === 0) return;
    
    // Select a random Pokémon from zone-filtered pool
    const randomPokemon = zonePokemon[Math.floor(Math.random() * zonePokemon.length)];
    
    // Spawn within the zone (closer to center for random spawns)
    const spawnDistance = Math.random() * (randomZone.radius * 0.6); // Within 60% of zone radius
    const angle = Math.random() * 2 * Math.PI;
    const radiusDegrees = spawnDistance / 111000;
    const latOffset = radiusDegrees * Math.cos(angle);
    const lonOffset = radiusDegrees * Math.sin(angle);
    
    const possibleBiomes = getPokemonPossibleBiomes(randomPokemon.habitat, randomPokemon.types);
    
    const newSpawn: Spawn = {
      id: `random-${now}`,
      name: randomPokemon.name,
      sprite: randomPokemon.sprite?.trim() || '',
      animatedSprite: randomPokemon.animatedSprite?.trim() || '',
      coord: {
        latitude: randomZone.center.latitude + latOffset,
        longitude: randomZone.center.longitude + lonOffset,
      },
      biome: randomZone.biome,
      possibleBiomes: possibleBiomes,
      habitat: randomPokemon.habitat || 'unknown',
      notified: false,
    };
    
    // Add to existing spawns (limit to 30 total spawns)
    setSpawns(prev => {
      const updated = [...prev, newSpawn];
      // Keep only the most recent 30 spawns
      return updated.slice(-30);
    });
    lastRandomSpawnRef.current = now;
    
    // Notify about the random spawn
    notifyPokemonSpawn(newSpawn.name, spawnDistance, newSpawn.biome);
    
    console.log(`🎲 Random spawn: ${newSpawn.name} appeared ${Math.round(spawnDistance)}m away!`);
    
    setToastMessage(`🎲 ${newSpawn.name} spawned nearby!`);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, [center, pokemon, biomeZones]);
  
  // Auto random spawn system - check periodically
  useEffect(() => {
    if (!center || pokemon.length === 0) return;
    
    const interval = setInterval(() => {
      createRandomSpawn(false);
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, [center, pokemon, createRandomSpawn]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const tick = () => {
      const hourKey = Math.floor(Date.now() / (60 * 60 * 1000));
      const nextResetTs = (hourKey + 1) * 60 * 60 * 1000;
      const remaining = Math.max(0, nextResetTs - Date.now());
      const mins = Math.ceil(remaining / 60000);
      setResetEta(`${mins}m`);
    };
    tick();
    timer = setInterval(tick, 30000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ConsoleIcon variant="map" size={32} color={colors.consoleAccent} />
        <Text style={styles.title}>Field Map</Text>
      </View>

      <Pressable
        style={styles.regionSelectorButton}
        onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.regionSelectorHeader}>
          <View
            style={[
              styles.regionIndicatorSmall,
              { backgroundColor: selectedRegion.color },
            ]}
          />
          <Text style={styles.regionSelectorLabel}>Region:</Text>
          <Text style={styles.regionSelectorValue}>
            {selectedRegion.name}
          </Text>
        </View>
        <Text style={styles.expandIndicator}>{isExpanded ? '▼' : '▶'}</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.regionGrid}>
          {regions.map(region => {
            const isSelected = selectedRegion.id === region.id;
            return (
              <Pressable
                key={region.id}
                style={[
                  styles.regionCard,
                  isSelected && styles.regionCardActive,
                  { borderColor: isSelected ? region.color : colors.divider },
                ]}
                onPress={() => handleRegionSelect(region.id)}>
                <View
                  style={[
                    styles.regionIndicator,
                    { backgroundColor: region.color },
                  ]}
                />
                <View style={styles.regionInfo}>
                  <Text
                    style={[styles.regionName, isSelected && styles.regionNameActive]}>
                    {region.name}
                  </Text>
                  <Text style={styles.regionPokedex}>
                    Pokedex: {region.pokedex}
                  </Text>
                </View>
                {isSelected && (
                  <ConsoleIcon variant="owned" size={16} color={region.color} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.mapCard}>
        <View style={styles.spawnsHeader}>
          <Text style={styles.placeholderTitle}>Nearby Spawns</Text>
          <Text style={styles.placeholderText}>
            {spawnsLoading 
              ? `Loading ${selectedRegion.name} spawns...` 
              : `Biome: ${currentBiome} • Get within ${CAPTURE_RADIUS}m to capture • Reset in ${resetEta}`}
          </Text>
        </View>
        <View style={styles.mapWrap}>
          {/* Floating Nearby Biomes Panel */}
          <View style={styles.floatingBiomePanel}>
            <Pressable
              onPress={() => {
                const newState = !showNearbyBiomes;
                setShowNearbyBiomes(newState);
                // Biome zones are already detected and stored in biomeZones state
              }}
              style={styles.floatingBiomeHeader}
              android_ripple={{ color: colors.consoleAccent }}>
              <View style={styles.floatingBiomeHeaderContent}>
                <Text style={styles.floatingBiomeHeaderText}>Nearby Biomes</Text>
                <Text style={styles.floatingBiomeHeaderIcon}>
                  {showNearbyBiomes ? '▼' : '▶'}
                </Text>
              </View>
            </Pressable>
            
            {showNearbyBiomes && (
              <View style={styles.floatingBiomeContent}>
                {biomeZones.length > 0 ? (
                  // Show detected biome zones
                  biomeZones.map((zone, index) => {
                    const isCurrent = zone.biome === currentBiome;
                    const isSelected = selectedBiome === zone.biome && 
                      selectedBiomeLocation && 
                      zone.center.latitude === selectedBiomeLocation.latitude &&
                      zone.center.longitude === selectedBiomeLocation.longitude;
                    
                    return (
                      <Pressable
                        key={`zone-${zone.biome}-${index}`}
                        onPress={() => {
                          if (mapRef.current) {
                            // Set selected biome to highlight it
                            setSelectedBiome(zone.biome);
                            setSelectedBiomeLocation(zone.center);
                            
                            // Navigate to biome zone center
                            mapRef.current.animateToRegion({
                              ...zone.center,
                              latitudeDelta: 0.01,
                              longitudeDelta: 0.01,
                            }, 1000);
                            
                            setToastMessage(`Navigating to ${zone.biome.charAt(0).toUpperCase() + zone.biome.slice(1)} zone (${zone.radius}m radius)...`);
                            setToastVisible(true);
                            setTimeout(() => setToastVisible(false), 2000);
                          }
                        }}
                        style={[
                          styles.floatingBiomeItem,
                          isCurrent && styles.floatingBiomeItemCurrent,
                          isSelected && styles.floatingBiomeItemSelected
                        ]}
                        android_ripple={{ color: getBiomeColor(zone.biome) }}>
                        <View style={[styles.floatingBiomeIndicator, { backgroundColor: getBiomeColor(zone.biome) }]} />
                        <Text style={styles.floatingBiomeItemText}>
                          {zone.biome.charAt(0).toUpperCase() + zone.biome.slice(1)}
                        </Text>
                        <Text style={styles.floatingBiomeStrength}>
                          {Math.round(zone.strength * 100)}%
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.floatingBiomeEmpty}>No biome zones detected</Text>
                )}
              </View>
            )}
          </View>
          
          {center ? (
            <MapView
              key={mapKey}
              ref={ref => {
                mapRef.current = ref;
              }}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              mapType="standard"
              customMapStyle={darkMapStyle}
              showsUserLocation
              showsMyLocationButton
              region={{
                ...center,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}>
              {/* Biome zone circles - show actual biome zones with gradient opacity */}
              {biomeZones.map((zone, index) => {
                const opacity = Math.max(0.1, zone.strength * 0.3); // Gradient based on strength
                const isSelected = selectedBiome === zone.biome && 
                  selectedBiomeLocation && 
                  zone.center.latitude === selectedBiomeLocation.latitude &&
                  zone.center.longitude === selectedBiomeLocation.longitude;
                
                return (
                  <Circle
                    key={`zone-${zone.biome}-${index}`}
                    center={zone.center}
                    radius={zone.radius}
                    strokeColor={getBiomeColor(zone.biome)}
                    fillColor={`${getBiomeColor(zone.biome)}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`}
                    strokeWidth={isSelected ? 5 : 3}
                  />
                );
              })}
              
              {/* User interaction radius circle - more visible */}
              {center && (
                <Circle
                  center={center}
                  radius={USER_RADIUS}
                  strokeColor={colors.consoleAccent}
                  fillColor={`${colors.consoleAccent}30`}
                  strokeWidth={5}
                />
              )}
              
              {spawns.map(spawn => {
                const distance = center ? calculateDistance(center, spawn.coord) : Infinity;
                const inRange = center ? isWithinRadius(center, spawn.coord, CAPTURE_RADIUS) : false;
                // Check if user radius overlaps with pokemon radius (allows interaction)
                const canInteract = center ? doCirclesOverlap(center, spawn.coord, USER_RADIUS, CAPTURE_RADIUS) : false;
                
                return (
                  <View key={spawn.id}>
                    {/* Show capture radius circle - more visible and appealing */}
                    <Circle
                      center={spawn.coord}
                      radius={CAPTURE_RADIUS}
                      strokeColor={canInteract ? colors.consoleAccent : getBiomeColor(spawn.biome)}
                      fillColor={canInteract ? `${colors.consoleAccent}25` : `${getBiomeColor(spawn.biome)}20`}
                      strokeWidth={canInteract ? 5 : 4}
                    />
                    <Marker
                      coordinate={spawn.coord}
                      onPress={() => {
                        if (!center) return;
                        
                        const dist = calculateDistance(center, spawn.coord);
                        // Check if radii overlap (user can interact)
                        if (!doCirclesOverlap(center, spawn.coord, USER_RADIUS, CAPTURE_RADIUS)) {
                          Alert.alert(
                            'Too Far Away',
                            `${spawn.name} is ${formatDistance(dist)} away. Get within range (your radius + Pokémon radius) to capture!`,
                            [{ text: 'OK' }]
                          );
                          return;
                        }
                        
                        setSpawns(prev => prev.filter(s => s.id !== spawn.id));
                        navigateRoot('CaptureModal', {
                          screen: 'CaptureHome',
                          params: {
                            pokemonName: spawn.name,
                            pokemonId: spawn.id,
                            coord: spawn.coord,
                            region: selectedRegion.name,
                          },
                        });
                      }}>
                      <View style={[
                        styles.marker,
                        canInteract && styles.markerInRange,
                      ]}>
                        <Image 
                          source={{ 
                            uri: (() => {
                              // Always ensure we have a valid URI - check for empty strings too
                              const numericId = spawn.id.replace(/^0+/, '') || '1';
                              const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numericId}.png`;
                              
                              if (spriteErrors.has(spawn.id)) {
                                return fallback;
                              }
                              
                              // Check if sprite URLs are valid (not empty strings)
                              const animated = spawn.animatedSprite?.trim();
                              const sprite = spawn.sprite?.trim();
                              
                              return (animated && animated.length > 0) 
                                ? animated 
                                : (sprite && sprite.length > 0) 
                                  ? sprite 
                                  : fallback;
                            })()
                          }} 
                          style={styles.markerImg}
                          onError={(e) => {
                            console.warn(`Failed to load sprite for ${spawn.name} (ID: ${spawn.id}):`, {
                              animatedSprite: spawn.animatedSprite,
                              sprite: spawn.sprite,
                              error: e.nativeEvent?.error
                            });
                            setSpriteErrors(prev => new Set(prev).add(spawn.id));
                          }}
                        />
                        <Text style={styles.markerText}>{spawn.name}</Text>
                        <View style={styles.markerBiomesRow}>
                          {spawn.possibleBiomes.map((biome, idx) => (
                            <View 
                              key={`${spawn.id}-${biome}-${idx}`}
                              style={[
                                styles.markerBiomeBadge,
                                { backgroundColor: getBiomeColor(biome) }
                              ]}>
                              <Text style={styles.markerBiomeBadgeText}>
                                {biome.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {!canInteract && center && (
                          <Text style={styles.markerDistance}>
                            {formatDistance(distance)}
                          </Text>
                        )}
                      </View>
                    </Marker>
                  </View>
                );
              })}
            </MapView>
          ) : (
            <View style={styles.loadingMap}>
              <Text style={styles.placeholderTitle}>Location needed</Text>
              <Text style={styles.placeholderText} numberOfLines={2}>
                {locationError || (isRequesting ? 'Requesting GPS lock...' : 'Trying GPS...')}
              </Text>
            </View>
          )}
        </View>
      </View>


      <View style={styles.debugBox}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugLabel}>GPS Debug</Text>
          <View style={styles.debugButtonsRow}>
            <Pressable
              onPress={forceResetSpawns}
              style={styles.debugButton}
              android_ripple={{ color: colors.consoleAccent }}>
              <Text style={styles.debugButtonText}>🔄 Reset</Text>
            </Pressable>
            <Pressable
              onPress={() => createRandomSpawn(true)}
              style={styles.debugButton}
              android_ripple={{ color: colors.consoleAccent }}>
              <Text style={styles.debugButtonText}>🎲 Random</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.debugText} numberOfLines={3}>
          {debugInfo}
        </Text>
        <Text style={styles.debugText}>
          Spawns: {spawns.length} | Region: {selectedRegion.name} | Biome: {currentBiome}
        </Text>
      </View>

      {/* Map Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        
        <View style={styles.legendSection}>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { borderColor: colors.consoleAccent, borderWidth: 5, backgroundColor: `${colors.consoleAccent}30` }]} />
            <Text style={styles.legendText}>Your Range ({USER_RADIUS}m)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { borderColor: colors.consoleAccent, borderWidth: 5, backgroundColor: `${colors.consoleAccent}25` }]} />
            <Text style={styles.legendText}>Capture Range ({CAPTURE_RADIUS}m)</Text>
          </View>
        </View>
        
        <View style={styles.legendSection}>
          <Text style={styles.legendSectionTitle}>Biomes</Text>
          {['urban', 'water', 'forest', 'grassland', 'mountain', 'cave', 'rare'].map(biome => (
            <View key={biome} style={styles.legendItem}>
              <View style={[styles.legendCircle, { borderColor: getBiomeColor(biome), borderWidth: 3 }]} />
              <Text style={styles.legendText}>{biome.charAt(0).toUpperCase() + biome.slice(1)}</Text>
            </View>
          ))}
        </View>
      </View>

      <Toast message={toastMessage} visible={toastVisible} type="success" />
    </ScrollView>
  );
};

// Dark map style for better visibility
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8ec3b9' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a3646' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2b6878' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#98a5be' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c5484' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e6876' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Get biome color for visualization
const getBiomeColor = (biome: string): string => {
  const biomeColors: Record<string, string> = {
    urban: '#9E9E9E',      // Gray
    water: '#2196F3',      // Blue
    forest: '#4CAF50',     // Green
    grassland: '#8BC34A',  // Light Green
    mountain: '#795548',   // Brown
    cave: '#424242',       // Dark Gray
    rare: '#FFD700',       // Gold
  };
  return biomeColors[biome] || colors.textMuted;
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  regionSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
  },
  regionSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionIndicatorSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  regionSelectorLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  regionSelectorValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  expandIndicator: {
    color: colors.textMuted,
    fontSize: 10,
  },
  regionGrid: {
    gap: 8,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.consolePanel,
    borderRadius: 6,
    borderWidth: 2,
    padding: 10,
    gap: 10,
  },
  regionCardActive: {
    backgroundColor: colors.shellAlt,
  },
  regionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  regionNameActive: {
    color: colors.consoleAccent,
  },
  regionPokedex: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  mapCard: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  spawnsHeader: {
    gap: 2,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  mapWrap: {
    height: 620,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    position: 'relative',
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.shellAlt,
    padding: 16,
  },
  map: {
    flex: 1,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    backgroundColor: colors.consolePanel,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  debugBox: {
    marginTop: 8,
    backgroundColor: colors.consolePanel,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    padding: 10,
    gap: 6,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  debugButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  debugLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  debugButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.blackPanel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
  },
  debugButtonText: {
    color: colors.consoleAccent,
    fontSize: 9,
    fontWeight: '600',
  },
  debugText: {
    color: colors.textPrimary,
    fontSize: 10,
    lineHeight: 14,
  },
  marker: {
    alignItems: 'center',
    padding: 4,
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textMuted,
    opacity: 1, // Always fully visible so images are clear
  },
  markerInRange: {
    borderColor: colors.consoleAccent,
    opacity: 1,
    borderWidth: 2,
  },
  markerImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  markerText: {
    color: colors.textPrimary,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  markerBiomesRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  markerBiomeBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBiomeBadgeText: {
    color: colors.blackPanel,
    fontSize: 8,
    fontWeight: '800',
  },
  markerDistance: {
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 1,
  },
  legend: {
    marginTop: 12,
    backgroundColor: colors.consolePanel,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    padding: 12,
    gap: 12,
  },
  legendTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  legendSection: {
    gap: 6,
  },
  legendSectionTitle: {
    color: colors.consoleAccent,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },
  biomeToggleBox: {
    marginTop: 12,
    backgroundColor: colors.consolePanel,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  biomeToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biomeToggleLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.blackPanel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  toggleButtonActive: {
    borderColor: colors.consoleAccent,
    backgroundColor: `${colors.consoleAccent}20`,
  },
  toggleButtonText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  nearbyBiomesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  biomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.blackPanel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  biomeChipColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  biomeChipText: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  floatingBiomePanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    width: 180,
    backgroundColor: colors.consolePanel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  floatingBiomeHeader: {
    backgroundColor: colors.blackPanel,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  floatingBiomeHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  floatingBiomeHeaderText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  floatingBiomeHeaderIcon: {
    color: colors.consoleAccent,
    fontSize: 10,
    fontWeight: '800',
  },
  floatingBiomeContent: {
    padding: 8,
    gap: 4,
  },
  floatingBiomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  floatingBiomeItemSelected: {
    borderColor: colors.consoleAccent,
    borderWidth: 2,
    backgroundColor: colors.consolePanel,
  },
  floatingBiomeStrength: {
    color: colors.textMuted,
    fontSize: 9,
    marginLeft: 'auto',
  },
  floatingBiomeEmpty: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    padding: 12,
  },
  floatingBiomeItemCurrent: {
    borderColor: colors.consoleAccent,
    borderWidth: 1.5,
    backgroundColor: `${colors.consoleAccent}10`,
  },
  floatingBiomeItemNearby: {
    borderColor: colors.textSecondary,
    borderWidth: 1,
    backgroundColor: `${colors.textSecondary}08`,
  },
  floatingBiomeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  floatingBiomeItemText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    textTransform: 'capitalize',
  },
  floatingBiomeCheck: {
    color: colors.consoleAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  floatingBiomeNearby: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },
});

export default memo(MapScreen);

