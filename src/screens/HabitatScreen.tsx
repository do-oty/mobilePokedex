import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraDevice, useCameraPermission } from 'react-native-vision-camera';
import CompassHeading from 'react-native-compass-heading';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import AdvancedFilters, { FilterOptions } from '../components/AdvancedFilters';
import SearchBar from '../components/SearchBar';
import ConsoleIcon from '../components/icons/ConsoleIcon';
import VR360View from '../components/VR360View';
import { useUser } from '../context/UserContext';
import { usePokemon } from '../context/PokemonContext';
import { colors, typeColors } from '../theme/colors';
import { getDifficultyStars } from '../utils/captureDifficulty';
import { calculateAnchoredPosition, calculate3DEffects } from '../utils/arAnchoring';

const HabitatScreen = () => {
  const insets = useSafeAreaInsets();
  const { userData } = useUser();
  const { pokemon } = usePokemon();
  const { hasPermission, requestPermission } = useCameraPermission();

  const [camDevice, setCamDevice] = useState<CameraDevice | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [camRequesting, setCamRequesting] = useState(false);

  // AR Placement system: Store placed Pokémon with their world positions
  type PlacedPokemon = {
    id: string;
    pokemonId: string;
    screenX: number; // Where user tapped on screen
    screenY: number;
    worldHeading: number; // Heading when placed (for anchoring)
    pokemon: typeof caught[0];
  };
  
  const [placedPokemon, setPlacedPokemon] = useState<PlacedPokemon[]>([]);
  const [placingMode, setPlacingMode] = useState(false);
  const [pokemonToPlace, setPokemonToPlace] = useState<string | null>(null);
  
  const jumpAnims = useRef<Record<string, Animated.Value>>({}).current;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    difficulty: 'all',
  });
  const [isCollectionExpanded, setIsCollectionExpanded] = useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'ar' | 'vr'>('ar'); // AR or VR mode

  useEffect(() => {
    const initCamera = async () => {
      setCamRequesting(true);
      try {
        const granted = await requestPermission();
        if (granted) {
          try {
            const devices = Camera.getAvailableCameraDevices();
            const deviceList = Array.isArray(devices) ? devices : await devices;
            const back = deviceList.find(d => d.position === 'back') || deviceList[0] || null;
            setCamDevice(back);
            setCamReady(true);
          } catch (err) {
            console.error('Camera device error:', err);
            setCamReady(false);
          }
        } else {
          setCamReady(false);
        }
      } catch (err) {
        console.error('Permission error:', err);
        setCamReady(false);
      } finally {
        setCamRequesting(false);
      }
    };
    initCamera();
  }, [requestPermission]);

  const caught = useMemo(() => {
    const ids = userData?.caughtPokemon || [];
    return ids
      .map(id => pokemon.find(p => String(p.id) === String(id)))
      .filter(Boolean);
  }, [userData?.caughtPokemon, pokemon]);

  const entriesWithStatus = useMemo(() => {
    return caught.map(entry => ({
      ...entry,
      seen: true,
      owned: true,
    }));
  }, [caught]);

  const filteredCaught = useMemo(() => {
    let filtered = entriesWithStatus;

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          String(p.id).includes(lowerQuery) ||
          p.types.some(t => t.toLowerCase().includes(lowerQuery)),
      );
    }

    // All caught Pokémon are owned, so no status filter needed

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(entry =>
        entry.types.some(type =>
          filters.types.some(filterType => type.toLowerCase() === filterType.toLowerCase()),
        ),
      );
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(entry => {
        const stars = getDifficultyStars(entry.captureRate);
        if (filters.difficulty === 'easy') return stars === 1 || stars === 2;
        if (filters.difficulty === 'hard') return stars === 3 || stars === 4;
        if (filters.difficulty === 'legendary') return stars === 5;
        return true;
      });
    }


    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [entriesWithStatus, searchQuery, filters]);


  const [heading, setHeading] = useState(0);
  const headingStartRef = useRef(0);

  // Initialize compass heading
  useEffect(() => {
    CompassHeading.start(2, ({ heading: deg }) => {
      setHeading(deg);
    });
    return () => {
      CompassHeading.stop();
    };
  }, []);

  // Handle tap to place Pokémon
  const handleScreenTap = useCallback((event: any) => {
    if (!placingMode || !pokemonToPlace) return;
    
    const { pageX, pageY } = event.nativeEvent;
    const pokemon = filteredCaught.find(p => String(p.id) === String(pokemonToPlace));
    
    if (pokemon) {
      // Place Pokémon at tap location with current heading as anchor
      const placed: PlacedPokemon = {
        id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pokemonId: pokemonToPlace,
        screenX: pageX,
        screenY: pageY,
        worldHeading: heading, // Anchor to current heading
        pokemon,
      };
      
      setPlacedPokemon(prev => [...prev, placed]);
      setPlacingMode(false);
      setPokemonToPlace(null);
    }
  }, [placingMode, pokemonToPlace, filteredCaught, heading]);


  const overlaySlots = useMemo(() => {
    // If a Pokémon is selected, only show that one
    if (selectedPokemonId) {
      const selected = filteredCaught.find(p => String(p.id) === String(selectedPokemonId));
      if (selected) {
        return [{ poke: selected }];
      }
    }
    // Default: show first caught Pokémon centered
    if (filteredCaught.length > 0 && !selectedPokemonId) {
      return [{ poke: filteredCaught[0] }];
    }
    return [];
  }, [filteredCaught, selectedPokemonId]);

  const handlePokemonPress = useCallback(
    (pokemonId: string, event: any) => {
      // Jump animation (JS-driven to avoid conflicts with parallax)
      if (!jumpAnims[pokemonId]) {
        jumpAnims[pokemonId] = new Animated.Value(0);
      }
      const anim = jumpAnims[pokemonId];
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -25,
          duration: 150,
          useNativeDriver: false, // Changed to false to avoid conflicts
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Changed to false to avoid conflicts
        }),
      ]).start();
    },
    [],
  );

  const handleResetAllPlaced = useCallback(() => {
    if (placedPokemon.length === 0) {
      return;
    }

    Alert.alert(
      'Return All Pokémon',
      `Are you sure you want to return all ${placedPokemon.length} placed Pokémon to your collection?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Return All',
          style: 'destructive',
          onPress: () => {
            setPlacedPokemon([]);
            setPlacingMode(false);
            setPokemonToPlace(null);
          },
        },
      ],
    );
  }, [placedPokemon.length]);


  const showCamera = camReady && camDevice && hasPermission && viewMode === 'ar';

  // VR Mode: 360-degree view
  if (viewMode === 'vr' && caught.length > 0) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
        ]}>
        <VR360View
          pokemon={filteredCaught.map(p => ({
            id: String(p.id),
            name: p.name,
            sprite: p.sprite,
            animatedSprite: p.animatedSprite,
            habitat: p.habitat,
          }))}
          onPokemonPress={(id) => setSelectedPokemonId(id)}
        />
        
        {/* VR Mode Controls */}
        <View style={styles.modeToggleContainer}>
          <Pressable
            onPress={() => setViewMode('ar')}
            style={styles.modeButton}
            android_ripple={{ color: colors.consoleAccent }}>
            <Ionicons name="camera" size={20} color={colors.textPrimary} />
            <Text style={styles.modeButtonText}>AR</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('vr')}
            style={[styles.modeButton, styles.modeButtonActive]}
            android_ripple={{ color: colors.consoleAccent }}>
            <Ionicons name="cube" size={20} color={colors.consoleAccent} />
            <Text style={[styles.modeButtonText, styles.modeButtonTextActive]}>VR</Text>
          </Pressable>
          {placedPokemon.length > 0 && (
            <Pressable
              onPress={handleResetAllPlaced}
              style={styles.resetButton}
              android_ripple={{ color: colors.warning }}>
              <Ionicons name="refresh" size={18} color={colors.warning} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // AR Mode: Camera overlay
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
      ]}>
      {showCamera && (
        <Camera style={StyleSheet.absoluteFill} device={camDevice} isActive={true} />
      )}
      <View style={styles.overlayShade} pointerEvents="none" />

      {/* AR Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <Pressable
          onPress={() => setViewMode('ar')}
          style={[styles.modeButton, styles.modeButtonActive]}
          android_ripple={{ color: colors.consoleAccent }}>
          <Ionicons name="camera" size={20} color={colors.consoleAccent} />
          <Text style={[styles.modeButtonText, styles.modeButtonTextActive]}>AR</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('vr')}
          style={styles.modeButton}
          android_ripple={{ color: colors.consoleAccent }}>
          <Ionicons name="cube" size={20} color={colors.textPrimary} />
          <Text style={styles.modeButtonText}>VR</Text>
        </Pressable>
        {placedPokemon.length > 0 && (
          <Pressable
            onPress={handleResetAllPlaced}
            style={styles.resetButton}
            android_ripple={{ color: colors.warning }}>
            <Ionicons name="refresh" size={18} color={colors.warning} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        )}
      </View>

      {/* AR Pokémon Overlay - Tap to place mode */}
      {viewMode === 'ar' && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleScreenTap}
          disabled={!placingMode}>
          <View style={styles.habitatArea} pointerEvents="box-none">
            {placedPokemon.map(placed => {
              // Calculate anchored position based on heading change
              const deltaHeading = heading - placed.worldHeading;
              // Normalize to -180 to 180
              let normalizedDelta = deltaHeading;
              while (normalizedDelta > 180) normalizedDelta -= 360;
              while (normalizedDelta < -180) normalizedDelta += 360;
              
              const theta = (normalizedDelta * Math.PI) / 180;
              
              // Object moves opposite to camera rotation to stay anchored
              const offsetX = -Math.sin(theta) * 200;
              const offsetY = (1 - Math.cos(theta)) * 100;
              
              // Calculate final screen position
              const finalX = placed.screenX + offsetX;
              const finalY = placed.screenY + offsetY;
              
              // Get jump animation for this Pokémon
              const jumpAnim = jumpAnims[placed.pokemonId] || new Animated.Value(0);
              if (!jumpAnims[placed.pokemonId]) {
                jumpAnims[placed.pokemonId] = jumpAnim;
              }
              
              return (
                <Animated.View
                  key={placed.id}
                  style={[
                    styles.placedPokemon,
                    {
                      left: finalX - 60, // Center sprite on tap point
                      top: finalY - 80,
                      transform: [
                        { translateY: jumpAnim },
                      ],
                    },
                  ]}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePokemonPress(placed.pokemonId, e);
                    }}>
                    <Image
                      source={{ uri: placed.pokemon.animatedSprite || placed.pokemon.sprite }}
                      style={styles.sprite}
                      resizeMode="contain"
                    />
                    <Text style={styles.spriteName}>{placed.pokemon.name}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
            
            {placingMode && (
              <View style={styles.placementHint}>
                <Text style={styles.placementHintText}>
                  Tap anywhere to place {filteredCaught.find(p => String(p.id) === String(pokemonToPlace))?.name}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      )}

      <View style={styles.content}>
        <Pressable
          style={styles.collectionHeader}
          onPress={() => setIsCollectionExpanded(!isCollectionExpanded)}>
          <Ionicons
            name={isCollectionExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.consoleAccent}
          />
        </Pressable>

        {isCollectionExpanded && (
          <View style={styles.collectionContent}>
            <View style={styles.listHeader}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your collection..."
              />
              <AdvancedFilters filters={filters} onFilterChange={setFilters} />
            </View>

            {caught.length === 0 ? (
              <View style={styles.emptyState}>
                <ConsoleIcon variant="terminal" size={64} color={colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Pokémon Captured</Text>
                <Text style={styles.emptyStateText}>
                  Go to the Map tab to discover and capture Pokémon!
                </Text>
              </View>
            ) : filteredCaught.length === 0 ? (
              <View style={styles.emptyState}>
                <ConsoleIcon variant="search" size={64} color={colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Pokémon Found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'No Pokémon match the selected filters'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredCaught}
                keyExtractor={item => String(item?.id)}
                numColumns={3}
                scrollEnabled={true}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) =>
                  item ? (
                    <Pressable
                      style={[
                        styles.card,
                        selectedPokemonId === String(item.id) && styles.cardSelected,
                      ]}
                      onPress={() => {
                        // Enter placement mode
                        setPlacingMode(true);
                        setPokemonToPlace(String(item.id));
                        setSelectedPokemonId(String(item.id));
                      }}
                      onLongPress={() => {
                        // Long press to remove placed Pokémon
                        setPlacedPokemon(prev => prev.filter(p => p.pokemonId !== String(item.id)));
                      }}>
                      {/* Gradient overlay based on Pokemon types */}
                      {(() => {
                        const primaryType = item.types[0]?.toLowerCase() || 'normal';
                        const secondaryType = item.types[1]?.toLowerCase();
                        const primaryColor = typeColors[primaryType] || colors.consolePanel;
                        const secondaryColor = secondaryType
                          ? typeColors[secondaryType] || colors.consolePanel
                          : primaryColor;
                        
                        return (
                          <LinearGradient
                            colors={[
                              `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.25)`,
                              `rgba(${parseInt(secondaryColor.slice(1, 3), 16)}, ${parseInt(secondaryColor.slice(3, 5), 16)}, ${parseInt(secondaryColor.slice(5, 7), 16)}, 0.25)`,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                          />
                        );
                      })()}
                      <View style={styles.cardContent}>
                        <Image
                          source={{
                            uri:
                              item.sprite ||
                              item.animatedSprite ||
                              `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id.replace(/^0+/, '') || '1'}.png`,
                          }}
                          style={styles.cardImg}
                          onError={() => {
                            // Fallback handled by source prop
                          }}
                        />
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.cardTypes}>
                          {item.types.slice(0, 2).map(type => (
                            <View key={type} style={styles.typeBadge}>
                              <Text style={styles.typeBadgeText}>{type}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </Pressable>
                  ) : null
                }
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  habitatArea: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  spriteWrap: {
    position: 'absolute',
    top: '50%', // Perfectly centered vertically
    left: '50%', // Perfectly centered horizontally
    width: 90, // Match sprite width
    height: 120, // Match sprite + text height
    marginLeft: -45, // Half of width to center
    marginTop: -60, // Half of height to center
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  sprite: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  spriteName: {
    color: colors.textPrimary,
    fontWeight: '800',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
    fontSize: 13,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  content: {
    borderRadius: 8,
    backgroundColor: colors.consolePanel,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  collectionContent: {
    maxHeight: 500,
  },
  listHeader: {
    marginTop: 12,
    marginBottom: 12,
    gap: 10,
    paddingHorizontal: 12,
  },
  gridContent: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '30%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.consoleGlass,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.consoleAccent,
    borderWidth: 2,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    zIndex: 1,
  },
  cardImg: {
    width: 64,
    height: 64,
  },
  cardName: {
    color: colors.textPrimary,
    fontWeight: '700',
    textTransform: 'capitalize',
    textAlign: 'center',
    fontSize: 11,
  },
  cardTypes: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.blackPanel,
  },
  typeBadgeText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    paddingHorizontal: 12,
  },
  emptyStateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 200,
  },
  modeToggleContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1000,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  modeButtonActive: {
    borderColor: colors.consoleAccent,
    backgroundColor: colors.blackPanel,
  },
  modeButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.consoleAccent,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.consolePanel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  resetButtonText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  placedPokemon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placementHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.consoleAccent,
  },
  placementHintText: {
    color: colors.consoleAccent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default memo(HabitatScreen);
