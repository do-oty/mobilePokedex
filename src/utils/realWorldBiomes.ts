/**
 * Real-world biome detection using OpenStreetMap data
 * Uses Overpass API to get actual land use and geographic features
 */

export type Biome = 'urban' | 'water' | 'forest' | 'grassland' | 'mountain' | 'cave' | 'rare';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

/**
 * Query OpenStreetMap for land use and features near a location
 */
const queryOSM = async (
  latitude: number,
  longitude: number,
  radius: number = 800, // Increased to 800m for better detection
): Promise<any[]> => {
  try {
    // Overpass QL query to get land use, natural features, water bodies, buildings, and roads
    const query = `
      [out:json][timeout:15];
      (
        way["landuse"~"^(forest|residential|commercial|industrial|retail|farmland|meadow|grass|park|recreation_ground|cemetery|allotments|brownfield|construction)$"](around:${radius},${latitude},${longitude});
        way["natural"~"^(water|bay|coastline|lake|pond|river|stream|wetland|wood|tree_row|scrub|heath|grassland|moor|bare_rock|scree|shingle|sand|beach|cliff|cave_entrance|peak|ridge)$"](around:${radius},${latitude},${longitude});
        way["leisure"~"^(park|nature_reserve|golf_course|playground|sports_centre|stadium)$"](around:${radius},${latitude},${longitude});
        way["amenity"](around:${radius},${latitude},${longitude});
        way["building"](around:${radius},${latitude},${longitude});
        way["highway"](around:${radius},${latitude},${longitude});
        way["shop"](around:${radius},${latitude},${longitude});
        way["office"](around:${radius},${latitude},${longitude});
        way["public_transport"](around:${radius},${latitude},${longitude});
        way["railway"~"^(station|subway|tram|platform)$"](around:${radius},${latitude},${longitude});
        node["place"~"^(city|town|village|suburb|hamlet)$"](around:${radius},${latitude},${longitude});
        relation["landuse"~"^(forest|residential|commercial|industrial|retail|farmland|meadow|grass|park|recreation_ground|cemetery|allotments)$"](around:${radius},${latitude},${longitude});
        relation["natural"~"^(water|bay|coastline|lake|pond|river|stream|wetland|wood|tree_row|scrub|heath|grassland|moor|bare_rock|scree|shingle|sand|beach|cliff|cave_entrance)$"](around:${radius},${latitude},${longitude});
      );
      out body;
      >;
      out skel qt;
    `;

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Don't throw for 504/timeout errors - just return empty and use fallback
      if (response.status === 504 || response.status === 408) {
        // Silently use fallback - no need to log every timeout
        return [];
      }
      throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    // Silently use fallback on error - no need to log every failure
    return [];
  }
};

/**
 * Detect biome from OpenStreetMap data
 * Returns array of possible biomes if multiple are detected (for random selection)
 */
const detectBiomeFromOSM = (elements: any[]): Biome[] => {
  if (elements.length === 0) return [];

  // Count features by type
  const features = {
    water: 0,
    forest: 0,
    urban: 0,
    grassland: 0,
    mountain: 0,
    cave: 0,
  };

  elements.forEach(element => {
    const tags = element.tags || {};
    
    // Water features
    if (
      tags.natural === 'water' ||
      tags.natural === 'bay' ||
      tags.natural === 'coastline' ||
      tags.natural === 'lake' ||
      tags.natural === 'pond' ||
      tags.natural === 'river' ||
      tags.natural === 'stream' ||
      tags.natural === 'wetland' ||
      tags.waterway ||
      tags.leisure === 'swimming_pool'
    ) {
      features.water++;
    }
    
    // Forest features
    if (
      tags.landuse === 'forest' ||
      tags.natural === 'wood' ||
      tags.natural === 'tree_row' ||
      tags.natural === 'scrub'
    ) {
      features.forest++;
    }
    
    // Urban features (expanded detection with weighted scoring)
    // Buildings are strong indicators of urban areas
    if (tags.building) {
      features.urban += 3; // Buildings are strong urban indicators
    }
    
    // Roads are also strong indicators (ANY highway type suggests urban)
    if (tags.highway) {
      // Major roads are stronger indicators
      if (
        tags.highway === 'primary' ||
        tags.highway === 'secondary' ||
        tags.highway === 'tertiary' ||
        tags.highway === 'trunk' ||
        tags.highway === 'motorway'
      ) {
        features.urban += 3; // Major roads are very strong urban indicators
      } else if (
        tags.highway === 'residential' ||
        tags.highway === 'service' ||
        tags.highway === 'unclassified' ||
        tags.highway === 'living_street' ||
        tags.highway === 'pedestrian'
      ) {
        features.urban += 2; // Residential roads are strong indicators
      } else {
        features.urban += 1; // Any other road type suggests urban
      }
    }
    
    // Land use types
    if (
      tags.landuse === 'residential' ||
      tags.landuse === 'commercial' ||
      tags.landuse === 'industrial' ||
      tags.landuse === 'retail' ||
      tags.landuse === 'brownfield' ||
      tags.landuse === 'construction'
    ) {
      features.urban += 2;
    }
    
    // Amenities (urban services) - expanded list
    if (
      tags.amenity === 'parking' ||
      tags.amenity === 'parking_space' ||
      tags.amenity === 'university' ||
      tags.amenity === 'school' ||
      tags.amenity === 'hospital' ||
      tags.amenity === 'place_of_worship' ||
      tags.amenity === 'restaurant' ||
      tags.amenity === 'cafe' ||
      tags.amenity === 'fast_food' ||
      tags.amenity === 'bank' ||
      tags.amenity === 'pharmacy' ||
      tags.amenity === 'fuel' ||
      tags.amenity === 'supermarket' ||
      tags.amenity === 'shop' ||
      tags.amenity === 'post_office' ||
      tags.amenity === 'library' ||
      tags.amenity === 'cinema' ||
      tags.amenity === 'theatre' ||
      tags.amenity === 'bar' ||
      tags.amenity === 'pub' ||
      tags.amenity === 'nightclub' ||
      tags.amenity === 'clinic' ||
      tags.amenity === 'dentist' ||
      tags.amenity === 'veterinary' ||
      tags.amenity === 'police' ||
      tags.amenity === 'fire_station' ||
      tags.amenity === 'townhall' ||
      tags.amenity === 'community_centre' ||
      tags.amenity === 'marketplace' ||
      tags.amenity === 'car_wash' ||
      tags.amenity === 'car_rental' ||
      tags.amenity === 'taxi' ||
      tags.amenity === 'bus_station' ||
      tags.amenity === 'subway_entrance' ||
      tags.amenity === 'atm' ||
      tags.amenity === 'bureau_de_change'
    ) {
      features.urban += 1;
    }
    
    // Public transport (strong urban indicator)
    if (
      tags.public_transport ||
      tags.railway === 'station' ||
      tags.railway === 'subway' ||
      tags.railway === 'tram' ||
      tags.railway === 'platform'
    ) {
      features.urban += 2;
    }
    
    // Shops and commercial areas
    if (tags.shop || tags.office) {
      features.urban += 1;
    }
    
    // Place names (cities, towns, etc.)
    if (
      tags.place === 'city' ||
      tags.place === 'town' ||
      tags.place === 'village' ||
      tags.place === 'suburb' ||
      tags.place === 'hamlet'
    ) {
      features.urban += 2;
    }
    
    // Grassland features
    if (
      tags.landuse === 'farmland' ||
      tags.landuse === 'meadow' ||
      tags.landuse === 'grass' ||
      tags.landuse === 'park' ||
      tags.landuse === 'recreation_ground' ||
      tags.landuse === 'cemetery' ||
      tags.landuse === 'allotments' ||
      tags.leisure === 'park' ||
      tags.leisure === 'nature_reserve' ||
      tags.leisure === 'golf_course' ||
      tags.natural === 'grassland' ||
      tags.natural === 'heath' ||
      tags.natural === 'moor'
    ) {
      features.grassland++;
    }
    
    // Mountain/rock features
    if (
      tags.natural === 'bare_rock' ||
      tags.natural === 'scree' ||
      tags.natural === 'shingle' ||
      tags.natural === 'cliff' ||
      tags.natural === 'peak' ||
      tags.natural === 'ridge'
    ) {
      features.mountain++;
    }
    
    // Cave features
    if (tags.natural === 'cave_entrance') {
      features.cave++;
    }
  });

  // Find all biomes that have significant presence
  // Use weighted thresholds - urban needs lower threshold since buildings/roads count more
  const detectedBiomes: Biome[] = [];
  
  // Urban has weighted scoring - always include if detected
  if (features.urban > 0) {
    detectedBiomes.push('urban');
  }
  
  // Other biomes - include if they have significant presence
  // Lower thresholds to make them more common
  if (features.water >= 2) detectedBiomes.push('water'); // Need at least 2 water features
  if (features.forest >= 3) detectedBiomes.push('forest'); // Need at least 3 forest features
  if (features.grassland >= 3) detectedBiomes.push('grassland'); // Need at least 3 grassland features
  if (features.mountain >= 2) detectedBiomes.push('mountain'); // Need at least 2 mountain features
  if (features.cave >= 1) detectedBiomes.push('cave'); // Need at least 1 cave feature

  // If no biomes detected, return empty (will use fallback)
  if (detectedBiomes.length === 0) {
    // If we have ANY urban features, default to urban
    if (features.urban > 0) {
      return ['urban'];
    }
    // Default to grassland if truly nothing detected
    return ['grassland'];
  }

  // If multiple biomes detected, return all of them (caller will randomly pick)
  // If only one, return it
  return detectedBiomes;
};

/**
 * Detect biome using real-world OpenStreetMap data
 * If multiple biomes detected, uses weighted random selection (favors less common biomes)
 * Returns null if no data available (caller should handle)
 */
export const detectBiomeFromRealWorld = async (
  latitude: number,
  longitude: number,
  radius: number = 800,
): Promise<Biome | null> => {
  try {
    // Query OSM for nearby features
    const elements = await queryOSM(latitude, longitude, radius);
    
    // If we got data, use it
    if (elements.length > 0) {
      const detectedBiomes = detectBiomeFromOSM(elements);
      
      if (detectedBiomes.length > 0) {
        // If multiple biomes detected, use weighted random selection
        if (detectedBiomes.length > 1) {
          // Re-query to get feature counts for better weighting
          const features = {
            water: 0,
            forest: 0,
            urban: 0,
            grassland: 0,
            mountain: 0,
            cave: 0,
          };
          
          elements.forEach(element => {
            const tags = element.tags || {};
            if (tags.building || tags.highway || tags.amenity || tags.shop || tags.office || tags.public_transport || tags.railway) features.urban++;
            if (tags.natural === 'water' || tags.waterway) features.water++;
            if (tags.landuse === 'forest' || tags.natural === 'wood') features.forest++;
            if (tags.landuse === 'park' || tags.leisure === 'park' || tags.landuse === 'grassland') features.grassland++;
            if (tags.natural === 'bare_rock' || tags.natural === 'cliff') features.mountain++;
            if (tags.natural === 'cave_entrance') features.cave++;
          });
          
          // Weight biomes: urban gets higher weight, but not 100% - still allow variety
          const weights: Record<Biome, number> = {
            urban: 50,      // High weight - prominent in cities but not 100%
            water: 25,      // Medium weight
            mountain: 20,   // Medium weight
            cave: 20,       // Medium weight
            rare: 30,       // Medium-high weight
            forest: 15,     // Lower weight but still possible
            grassland: 15,  // Lower weight but still possible
          };
          
          // Calculate total weight
          let totalWeight = 0;
          const weightedBiomes: Array<{ biome: Biome; weight: number; cumulative: number }> = [];
          
          detectedBiomes.forEach(biome => {
            const weight = weights[biome] || 5;
            totalWeight += weight;
            weightedBiomes.push({
              biome,
              weight,
              cumulative: totalWeight,
            });
          });
          
          // Random selection based on weights
          const random = Math.random() * totalWeight;
          for (const item of weightedBiomes) {
            if (random <= item.cumulative) {
              return item.biome;
            }
          }
          
          // Fallback to last biome (shouldn't happen)
          return weightedBiomes[weightedBiomes.length - 1].biome;
        }
        // Single biome detected
        return detectedBiomes[0];
      }
    }
    
    // No data available
    return null;
  } catch (error) {
    console.warn('Real-world biome detection failed:', error);
    return null;
  }
};

/**
 * Batch detect biomes for multiple locations (for zone detection)
 * Uses caching to avoid duplicate API calls
 */
const biomeCache = new Map<string, { biome: Biome; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const detectBiomeBatch = async (
  locations: Array<{ latitude: number; longitude: number }>,
): Promise<Map<string, Biome | null>> => {
  const results = new Map<string, Biome | null>();
  const uncachedLocations: Array<{ key: string; lat: number; lon: number }> = [];
  
  // Check cache first
  locations.forEach(loc => {
    const key = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
    const cached = biomeCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.set(key, cached.biome);
    } else {
      uncachedLocations.push({ key, lat: loc.latitude, lon: loc.longitude });
    }
  });
  
  // Fetch uncached locations (batch in groups of 3 to avoid rate limits)
  for (let i = 0; i < uncachedLocations.length; i += 3) {
    const batch = uncachedLocations.slice(i, i + 3);
    
    await Promise.all(
      batch.map(async ({ key, lat, lon }) => {
        try {
          const biome = await detectBiomeFromRealWorld(lat, lon, 400);
          if (biome) {
            results.set(key, biome);
            biomeCache.set(key, { biome, timestamp: Date.now() });
          } else {
            results.set(key, null);
          }
        } catch (error) {
          results.set(key, null);
        }
      })
    );
    
    // Small delay between batches to respect rate limits
    if (i + 3 < uncachedLocations.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
};

