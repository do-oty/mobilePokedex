/**
 * Offline caching utility using AsyncStorage
 * Caches Pokémon data, recent searches, and user data for offline access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DexEntry } from '../data/sampleDexEntries';

// Cache keys
const CACHE_KEYS = {
  POKEMON_DATA: '@cache:pokemon_data',
  POKEDEX_DATA: '@cache:pokedex_data',
  RECENT_SEARCHES: '@cache:recent_searches',
  USER_DATA: '@cache:user_data',
  CACHE_TIMESTAMP: '@cache:timestamp',
  LAST_REGION: '@cache:last_region',
} as const;

// Cache expiration time (7 days)
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

type CachedPokemonData = {
  [pokemonName: string]: DexEntry;
};

type CachedPokedexData = {
  [region: string]: string[]; // region -> pokemon names
};

type RecentSearch = {
  query: string;
  timestamp: number;
};

/**
 * Check if cache is still valid
 */
const isCacheValid = async (): Promise<boolean> => {
  try {
    const timestampStr = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    return (now - timestamp) < CACHE_EXPIRY_MS;
  } catch {
    return false;
  }
};

/**
 * Update cache timestamp
 */
const updateCacheTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update cache timestamp:', error);
  }
};

/**
 * Cache Pokémon data
 */
export const cachePokemonData = async (pokemonName: string, data: DexEntry): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEMON_DATA);
    const pokemonData: CachedPokemonData = cached ? JSON.parse(cached) : {};
    pokemonData[pokemonName.toLowerCase()] = data;
    
    await AsyncStorage.setItem(CACHE_KEYS.POKEMON_DATA, JSON.stringify(pokemonData));
    await updateCacheTimestamp();
  } catch (error) {
    console.warn(`Failed to cache Pokemon data for ${pokemonName}:`, error);
  }
};

/**
 * Cache multiple Pokémon at once
 */
export const cachePokemonBatch = async (pokemonList: DexEntry[]): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEMON_DATA);
    const pokemonData: CachedPokemonData = cached ? JSON.parse(cached) : {};
    
    pokemonList.forEach(pokemon => {
      pokemonData[pokemon.name.toLowerCase()] = pokemon;
    });
    
    await AsyncStorage.setItem(CACHE_KEYS.POKEMON_DATA, JSON.stringify(pokemonData));
    await updateCacheTimestamp();
  } catch (error) {
    console.warn('Failed to cache Pokemon batch:', error);
  }
};

/**
 * Get cached Pokémon data
 */
export const getCachedPokemonData = async (pokemonName: string): Promise<DexEntry | null> => {
  try {
    if (!(await isCacheValid())) {
      return null;
    }
    
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEMON_DATA);
    if (!cached) return null;
    
    const pokemonData: CachedPokemonData = JSON.parse(cached);
    return pokemonData[pokemonName.toLowerCase()] || null;
  } catch (error) {
    console.warn(`Failed to get cached Pokemon data for ${pokemonName}:`, error);
    return null;
  }
};

/**
 * Get all cached Pokémon data
 */
export const getAllCachedPokemon = async (): Promise<DexEntry[]> => {
  try {
    if (!(await isCacheValid())) {
      return [];
    }
    
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEMON_DATA);
    if (!cached) return [];
    
    const pokemonData: CachedPokemonData = JSON.parse(cached);
    return Object.values(pokemonData);
  } catch (error) {
    console.warn('Failed to get all cached Pokemon:', error);
    return [];
  }
};

/**
 * Cache Pokedex data (list of Pokémon names for a region)
 */
export const cachePokedexData = async (region: string, pokemonNames: string[]): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEDEX_DATA);
    const pokedexData: CachedPokedexData = cached ? JSON.parse(cached) : {};
    pokedexData[region] = pokemonNames;
    
    await AsyncStorage.setItem(CACHE_KEYS.POKEDEX_DATA, JSON.stringify(pokedexData));
    await updateCacheTimestamp();
  } catch (error) {
    console.warn(`Failed to cache Pokedex data for ${region}:`, error);
  }
};

/**
 * Get cached Pokedex data
 */
export const getCachedPokedexData = async (region: string): Promise<string[] | null> => {
  try {
    if (!(await isCacheValid())) {
      return null;
    }
    
    const cached = await AsyncStorage.getItem(CACHE_KEYS.POKEDEX_DATA);
    if (!cached) return null;
    
    const pokedexData: CachedPokedexData = JSON.parse(cached);
    return pokedexData[region] || null;
  } catch (error) {
    console.warn(`Failed to get cached Pokedex data for ${region}:`, error);
    return null;
  }
};

/**
 * Add a recent search
 */
export const addRecentSearch = async (query: string): Promise<void> => {
  try {
    if (!query || query.trim().length === 0) return;
    
    const cached = await AsyncStorage.getItem(CACHE_KEYS.RECENT_SEARCHES);
    const searches: RecentSearch[] = cached ? JSON.parse(cached) : [];
    
    // Remove duplicates and add to front
    const filtered = searches.filter(s => s.query.toLowerCase() !== query.toLowerCase());
    const newSearches: RecentSearch[] = [
      { query: query.trim(), timestamp: Date.now() },
      ...filtered,
    ].slice(0, 20); // Keep only last 20 searches
    
    await AsyncStorage.setItem(CACHE_KEYS.RECENT_SEARCHES, JSON.stringify(newSearches));
    console.log(`✅ Search cached: "${query.trim()}" (${newSearches.length} total searches)`);
  } catch (error) {
    console.warn('❌ Failed to add recent search:', error);
  }
};

/**
 * Get recent searches
 */
export const getRecentSearches = async (limit: number = 10): Promise<string[]> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.RECENT_SEARCHES);
    if (!cached) {
      console.log('📝 No cached searches found');
      return [];
    }
    
    const searches: RecentSearch[] = JSON.parse(cached);
    // Sort by timestamp (newest first) and return queries
    const results = searches
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(s => s.query);
    
    console.log(`📝 Retrieved ${results.length} recent searches`);
    return results;
  } catch (error) {
    console.warn('❌ Failed to get recent searches:', error);
    return [];
  }
};

/**
 * Clear recent searches
 */
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.RECENT_SEARCHES);
  } catch (error) {
    console.warn('Failed to clear recent searches:', error);
  }
};

/**
 * Cache last selected region
 */
export const cacheLastRegion = async (region: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_REGION, region);
  } catch (error) {
    console.warn('Failed to cache last region:', error);
  }
};

/**
 * Get last selected region
 */
export const getLastRegion = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CACHE_KEYS.LAST_REGION);
  } catch (error) {
    console.warn('Failed to get last region:', error);
    return null;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.POKEMON_DATA,
      CACHE_KEYS.POKEDEX_DATA,
      CACHE_KEYS.RECENT_SEARCHES,
      CACHE_KEYS.CACHE_TIMESTAMP,
      CACHE_KEYS.LAST_REGION,
    ]);
    console.log('✅ All cache cleared');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Get cache size info (for debugging)
 */
export const getCacheInfo = async (): Promise<{
  pokemonCount: number;
  pokedexCount: number;
  recentSearchesCount: number;
  cacheAge: number | null;
}> => {
  try {
    const [pokemonData, pokedexData, searches, timestamp] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.POKEMON_DATA),
      AsyncStorage.getItem(CACHE_KEYS.POKEDEX_DATA),
      AsyncStorage.getItem(CACHE_KEYS.RECENT_SEARCHES),
      AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP),
    ]);
    
    const pokemonCount = pokemonData ? Object.keys(JSON.parse(pokemonData)).length : 0;
    const pokedexCount = pokedexData ? Object.keys(JSON.parse(pokedexData)).length : 0;
    const recentSearchesCount = searches ? JSON.parse(searches).length : 0;
    const cacheAge = timestamp ? Date.now() - parseInt(timestamp, 10) : null;
    
    return {
      pokemonCount,
      pokedexCount,
      recentSearchesCount,
      cacheAge,
    };
  } catch (error) {
    console.warn('Failed to get cache info:', error);
    return {
      pokemonCount: 0,
      pokedexCount: 0,
      recentSearchesCount: 0,
      cacheAge: null,
    };
  }
};


