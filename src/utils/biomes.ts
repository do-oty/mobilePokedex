/**
 * Biome detection and mapping utilities
 * Maps real-world locations to Pokémon habitats
 */

export type Biome = 'urban' | 'water' | 'forest' | 'grassland' | 'mountain' | 'cave' | 'rare';

// Re-export for compatibility
export { detectBiomeFromRealWorld, detectBiomeBatch } from './realWorldBiomes';

// Export fallback as detectBiome for backward compatibility
export const detectBiome = detectBiomeFallback;

/**
 * Fallback biome detection based on coordinates
 * Used when real-world API data is unavailable
 */
export const detectBiomeFallback = (
  latitude: number,
  longitude: number,
): Biome => {
  // Use more complex patterns based on coordinate values
  // This creates a more varied and realistic biome distribution
  // Reduced urban dominance for better variety
  
  // Normalize coordinates to 0-1 range for pattern matching
  const latNorm = ((latitude % 1) + 1) % 1; // Ensure positive
  const lonNorm = ((longitude % 1) + 1) % 1;
  
  // Combine lat and lon for more varied patterns
  const combined = (latNorm + lonNorm) % 1;
  const product = latNorm * lonNorm;
  const sum = latNorm + lonNorm;
  const diff = Math.abs(latNorm - lonNorm);
  
  // Use multiple patterns to create more variety
  const pattern1 = (latNorm * 100) % 7;
  const pattern2 = (lonNorm * 100) % 7;
  const pattern3 = ((latNorm + lonNorm) * 50) % 7;
  
  // Water: ~18% chance (coastal areas, rivers) - increased
  if (latNorm < 0.12 || lonNorm < 0.12 || combined < 0.08 || pattern1 === 0 || pattern2 === 0) {
    return 'water';
  }
  
  // Forest: ~22% chance (wooded areas) - increased
  if (sum > 0.65 && sum < 1.35 || (latNorm > 0.25 && latNorm < 0.55 && lonNorm > 0.25 && lonNorm < 0.55) || pattern1 === 1 || pattern2 === 1) {
    return 'forest';
  }
  
  // Mountain: ~18% chance (elevated areas) - increased
  if (product > 0.55 || (latNorm > 0.55 && latNorm < 0.8) || pattern1 === 2 || pattern2 === 2) {
    return 'mountain';
  }
  
  // Grassland: ~18% chance (open fields, plains) - increased
  if (diff > 0.4 && diff < 0.7 || (latNorm > 0.4 && latNorm < 0.6 && lonNorm > 0.4 && lonNorm < 0.6) || pattern1 === 3 || pattern2 === 3) {
    return 'grassland';
  }
  
  // Cave: ~12% chance (underground areas) - increased
  if (combined > 0.8 || product < 0.15 || pattern1 === 4 || pattern2 === 4) {
    return 'cave';
  }
  
  // Rare: ~5% chance (special locations)
  if (combined > 0.95 || product > 0.9 || pattern1 === 5 || pattern2 === 5) {
    return 'rare';
  }
  
  // Urban: ~20% chance (cities, towns) - increased for better urban detection
  if (
    (latNorm > 0.75 && latNorm < 0.95) || 
    (lonNorm > 0.75 && lonNorm < 0.95) ||
    (sum > 1.2 && sum < 1.8) ||
    pattern1 === 6 || 
    pattern2 === 6 ||
    pattern3 === 6
  ) {
    return 'urban';
  }
  
  // Default to grassland if nothing matches
  return 'grassland';
};

/**
 * Map PokeAPI habitat names to our biome types
 */
export const mapHabitatToBiome = (habitat: string | null | undefined): Biome => {
  if (!habitat) return 'grassland';
  
  const habitatLower = habitat.toLowerCase();
  
  if (habitatLower.includes('urban') || habitatLower.includes('city')) {
    return 'urban';
  }
  if (habitatLower.includes('water') || habitatLower.includes('sea') || habitatLower.includes('ocean')) {
    return 'water';
  }
  if (habitatLower.includes('forest') || habitatLower.includes('woods')) {
    return 'forest';
  }
  if (habitatLower.includes('mountain') || habitatLower.includes('hill')) {
    return 'mountain';
  }
  if (habitatLower.includes('cave') || habitatLower.includes('underground')) {
    return 'cave';
  }
  if (habitatLower.includes('rare') || habitatLower.includes('legendary')) {
    return 'rare';
  }
  
  return 'grassland';
};

/**
 * Get all possible biomes a Pokémon can spawn in based on its habitat and types
 * Some Pokémon can spawn in multiple biomes
 */
export const getPokemonPossibleBiomes = (
  habitat: string | null | undefined,
  types?: string[]
): Biome[] => {
  const biomes = new Set<Biome>();
  
  // Handle actual PokeAPI habitat names
  if (habitat && habitat !== 'None' && habitat !== 'unknown') {
    const habitatLower = habitat.toLowerCase();
    
    // Direct PokeAPI habitat matches
    if (habitatLower === 'urban') {
      biomes.add('urban');
    }
    if (habitatLower === 'cave') {
      biomes.add('cave');
    }
    if (habitatLower === 'forest') {
      biomes.add('forest');
    }
    if (habitatLower === 'grassland') {
      biomes.add('grassland');
    }
    if (habitatLower === 'mountain') {
      biomes.add('mountain');
    }
    if (habitatLower === 'rare') {
      biomes.add('rare');
    }
    if (habitatLower === 'rough-terrain' || habitatLower === 'roughterrain') {
      biomes.add('mountain');
      biomes.add('cave');
    }
    if (habitatLower === 'sea') {
      biomes.add('water');
    }
    if (habitatLower === 'waters-edge' || habitatLower === 'watersedge') {
      biomes.add('water');
      biomes.add('grassland');
    }
    
    // Also check for substring matches (for flexibility)
    if (habitatLower.includes('urban') || habitatLower.includes('city') || habitatLower.includes('town')) {
      biomes.add('urban');
    }
    if (habitatLower.includes('water') || habitatLower.includes('sea') || habitatLower.includes('ocean') || habitatLower.includes('lake') || habitatLower.includes('river')) {
      biomes.add('water');
    }
    if (habitatLower.includes('forest') || habitatLower.includes('woods') || habitatLower.includes('jungle')) {
      biomes.add('forest');
    }
    if (habitatLower.includes('mountain') || habitatLower.includes('hill') || habitatLower.includes('peak')) {
      biomes.add('mountain');
    }
    if (habitatLower.includes('cave') || habitatLower.includes('underground') || habitatLower.includes('cavern')) {
      biomes.add('cave');
    }
    if (habitatLower.includes('rare') || habitatLower.includes('legendary')) {
      biomes.add('rare');
    }
    if (habitatLower.includes('grassland') || habitatLower.includes('meadow') || habitatLower.includes('field') || habitatLower.includes('plain')) {
      biomes.add('grassland');
    }
  }
  
  // Use types to infer additional biomes
  if (types && types.length > 0) {
    types.forEach(type => {
      const typeLower = type.toLowerCase();
      
      // Water types can spawn in water biomes
      if (typeLower === 'water' || typeLower === 'ice') {
        biomes.add('water');
      }
      
      // Grass types can spawn in forest and grassland
      if (typeLower === 'grass') {
        biomes.add('forest');
        biomes.add('grassland');
      }
      
      // Rock/Ground types can spawn in mountain and cave
      if (typeLower === 'rock' || typeLower === 'ground') {
        biomes.add('mountain');
        biomes.add('cave');
      }
      
      // Bug types can spawn in forest and grassland
      if (typeLower === 'bug') {
        biomes.add('forest');
        biomes.add('grassland');
      }
      
      // Normal/Electric/Poison/Steel types can spawn in urban
      if (typeLower === 'normal' || typeLower === 'electric' || typeLower === 'poison' || typeLower === 'steel') {
        biomes.add('urban');
      }
      
      // Flying types can spawn in multiple biomes
      if (typeLower === 'flying') {
        biomes.add('mountain');
        biomes.add('forest');
        biomes.add('grassland');
      }
      
      // Dark/Ghost types can spawn in cave
      if (typeLower === 'dark' || typeLower === 'ghost') {
        biomes.add('cave');
      }
    });
  }
  
  // If still no biomes, default to grassland (most common)
  if (biomes.size === 0) {
    biomes.add('grassland');
  }
  
  return Array.from(biomes);
};

/**
 * Get biome-friendly Pokémon types
 * Returns types that are more likely to spawn in a given biome
 */
export const getBiomeFriendlyTypes = (biome: Biome): string[] => {
  switch (biome) {
    case 'urban':
      return ['normal', 'electric', 'poison', 'steel'];
    case 'water':
      return ['water', 'ice'];
    case 'forest':
      return ['grass', 'bug', 'flying', 'normal'];
    case 'grassland':
      return ['grass', 'normal', 'ground'];
    case 'mountain':
      return ['rock', 'ground', 'flying', 'ice'];
    case 'cave':
      return ['rock', 'ground', 'dark', 'ghost'];
    case 'rare':
      return []; // All types possible for rare spawns
    default:
      return ['normal'];
  }
};

/**
 * Biome zone with location and radius
 */
export type BiomeZone = {
  biome: Biome;
  center: { latitude: number; longitude: number };
  radius: number; // in meters
  strength: number; // 0-1, how dominant this biome is in this zone
};

/**
 * Detect biome zones around a location using gradient-based detection
 * Scans the area to find zones where specific biomes dominate
 */
export const detectBiomeZones = (
  latitude: number,
  longitude: number,
  scanRadius: number = 3000, // Scan within 3km (increased for more zones)
  zoneRadius: number = 400, // Each zone has 400m radius (smaller for more zones)
): BiomeZone[] => {
  const zones: BiomeZone[] = [];
  
  // ALWAYS create a zone at user's location first
  // Use fallback for initial zone (real-world detection will update it)
  const userBiome = detectBiomeFallback(latitude, longitude);
  zones.push({
    biome: userBiome,
    center: { latitude, longitude },
    radius: zoneRadius,
    strength: 1.0, // Full strength at user location
  });
  
  const biomeCounts = new Map<Biome, Array<{ lat: number; lon: number; count: number }>>();
  
  // Convert scan radius to degrees
  const scanRadiusDegrees = scanRadius / 111000;
  const zoneRadiusDegrees = zoneRadius / 111000;
  
  // Sample points in a larger grid pattern around the location
  // Focus more on closer areas (concentric sampling)
  const gridSize = 20; // 20x20 grid = 400 sample points (increased for better detection)
  const stepSize = (scanRadiusDegrees * 2) / gridSize;
  
  // Count biome occurrences at each sample point
  // Prioritize closer zones by sampling more densely near user
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const latOffset = -scanRadiusDegrees + (i * stepSize);
      const lonOffset = -scanRadiusDegrees + (j * stepSize);
      
      const sampleLat = latitude + latOffset;
      const sampleLon = longitude + lonOffset;
      const biome = detectBiomeFallback(sampleLat, sampleLon);
      
      // Calculate distance from user
      const distFromUser = Math.sqrt(
        Math.pow((sampleLat - latitude) * 111000, 2) +
        Math.pow((sampleLon - longitude) * 111000, 2)
      );
      
      // Skip if too close to user location (already have user zone)
      if (distFromUser < zoneRadius * 1.5) continue;
      
      // Prefer zones within 1.5km (closer zones get priority)
      // But still sample further zones for variety
      
      if (!biomeCounts.has(biome)) {
        biomeCounts.set(biome, []);
      }
      
      biomeCounts.get(biome)!.push({
        lat: sampleLat,
        lon: sampleLon,
        count: 1,
      });
    }
  }
  
  // Find multiple cluster centers for each biome (not just one)
  // Prioritize non-urban biomes and closer zones
  biomeCounts.forEach((points, biome) => {
    if (points.length < 2) return; // Even lower threshold for more zones
    
    // Calculate distance from user for each point (for prioritization)
    const pointsWithDistance = points.map(p => ({
      ...p,
      distFromUser: Math.sqrt(
        Math.pow((p.lat - latitude) * 111000, 2) +
        Math.pow((p.lon - longitude) * 111000, 2)
      ),
    }));
    
    // Sort by distance (closer first) - prioritize nearby zones
    pointsWithDistance.sort((a, b) => a.distFromUser - b.distFromUser);
    
    // Find multiple clusters for this biome
    const usedPoints = new Set<string>();
    const clusters: Array<{ center: { lat: number; lon: number }; density: number; distance: number }> = [];
    
    // Find up to 4 clusters per biome (increased for more variety)
    // But prioritize closer ones and non-urban biomes
    const maxClusters = biome === 'urban' ? 2 : 4; // Limit urban to 2, others can have 4
    
    for (let clusterIdx = 0; clusterIdx < maxClusters; clusterIdx++) {
      let maxDensity = 0;
      let bestCenter: { lat: number; lon: number } | null = null;
      let bestDistance = Infinity;
      let bestCenterKey = '';
      
      // Check each unused point as a potential center (prioritize closer ones)
      for (const centerPoint of pointsWithDistance) {
        const centerKey = `${centerPoint.lat.toFixed(6)},${centerPoint.lon.toFixed(6)}`;
        if (usedPoints.has(centerKey)) continue;
        
        // Prefer zones within 1.5km for non-urban biomes
        if (biome !== 'urban' && centerPoint.distFromUser > 1500) {
          // Still consider but with lower priority
          if (clusters.length >= 2) continue; // Only allow far zones if we don't have enough close ones
        }
        
        // Count how many points of this biome are within zone radius
        let nearbyCount = 0;
        for (const point of pointsWithDistance) {
          const pointKey = `${point.lat.toFixed(6)},${point.lon.toFixed(6)}`;
          if (usedPoints.has(pointKey)) continue; // Don't count already used points
          
          const dist = Math.sqrt(
            Math.pow((point.lat - centerPoint.lat) * 111000, 2) +
            Math.pow((point.lon - centerPoint.lon) * 111000, 2)
          );
          if (dist <= zoneRadius) {
            nearbyCount++;
          }
        }
        
        // Prefer closer zones with good density
        const densityScore = nearbyCount;
        const distanceScore = 1 / (1 + centerPoint.distFromUser / 1000); // Closer = higher score
        const combinedScore = densityScore * (1 + distanceScore * 0.5); // Boost for closer zones
        
        if (combinedScore > maxDensity || (combinedScore === maxDensity && centerPoint.distFromUser < bestDistance)) {
          maxDensity = combinedScore;
          bestCenter = centerPoint;
          bestDistance = centerPoint.distFromUser;
          bestCenterKey = centerKey;
        }
      }
      
      // If we found a good cluster, add it
      if (bestCenter && maxDensity >= 2) {
        const strength = Math.min(maxDensity / 12, 1); // Normalize to 0-1
        
        clusters.push({
          center: bestCenter,
          density: strength,
          distance: bestDistance,
        });
        
        // Mark points near this cluster as used (within 2x zone radius)
        for (const point of pointsWithDistance) {
          const dist = Math.sqrt(
            Math.pow((point.lat - bestCenter.lat) * 111000, 2) +
            Math.pow((point.lon - bestCenter.lon) * 111000, 2)
          );
          if (dist <= zoneRadius * 2) {
            const pointKey = `${point.lat.toFixed(6)},${point.lon.toFixed(6)}`;
            usedPoints.add(pointKey);
          }
        }
      } else {
        break; // No more clusters found
      }
    }
    
    // Add all clusters for this biome, sorted by distance (closer first)
    clusters.sort((a, b) => a.distance - b.distance);
    clusters.forEach(cluster => {
      zones.push({
        biome,
        center: {
          latitude: cluster.center.lat,
          longitude: cluster.center.lon,
        },
        radius: zoneRadius,
        strength: cluster.density,
      });
    });
  });
  
  // Sort by strength (strongest first)
  zones.sort((a, b) => b.strength - a.strength);
  
  // Return more zones (up to 15-20 zones for a full map)
  return zones.slice(0, 20);
};

/**
 * Detect nearby biomes around a location (simplified version for compatibility)
 * Checks multiple points in a radius to find what biomes are nearby
 */
export const detectNearbyBiomes = (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000, // Check within 1km
  samplePoints: number = 8, // Check 8 points around the location
): Biome[] => {
  const zones = detectBiomeZones(latitude, longitude, radiusMeters * 2, radiusMeters / 2);
  return zones.map(z => z.biome);
};

/**
 * Check if a coordinate is within a biome zone
 */
export const isInBiomeZone = (
  latitude: number,
  longitude: number,
  zone: BiomeZone,
): boolean => {
  const distance = Math.sqrt(
    Math.pow((latitude - zone.center.latitude) * 111000, 2) +
    Math.pow((longitude - zone.center.longitude) * 111000, 2)
  );
  return distance <= zone.radius;
};

/**
 * Find the biome zone that contains a coordinate
 */
export const findBiomeZoneForLocation = (
  latitude: number,
  longitude: number,
  zones: BiomeZone[],
): BiomeZone | null => {
  for (const zone of zones) {
    if (isInBiomeZone(latitude, longitude, zone)) {
      return zone;
    }
  }
  return null;
};

