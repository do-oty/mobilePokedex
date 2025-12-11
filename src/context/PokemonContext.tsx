import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { DexEntry } from '../data/sampleDexEntries';
import { useRegion } from './RegionContext';
import { fetchPokemonByRegion, getPokedexCount, fetchPokedexByRegion, fetchPokemonEntry } from '../services/pokeapi';

type PokemonContextType = {
  pokemon: DexEntry[];
  totalCount: number; // Total Pokemon in region (from pokedex)
  loading: boolean;
  initialLoading: boolean; // True until first load completes (including background fetch)
  regionLoading: boolean; // Loading due to region switch
  loadingMore: boolean; // Loading additional Pokemon
  error: string | null;
  hasMore: boolean; // Whether there are more Pokemon to load
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>; // Load next batch
};

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemon must be used within PokemonProvider');
  }
  return context;
};

type PokemonProviderProps = {
  children: ReactNode;
};

const INITIAL_LOAD_LIMIT = 20; // Very small initial load for instant UI
const LOAD_MORE_BATCH = 50;

export const PokemonProvider = ({ children }: PokemonProviderProps) => {
  const { selectedRegion } = useRegion();
  const [pokemon, setPokemon] = useState<DexEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [regionLoading, setRegionLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const isFirstLoadRef = useRef(true);

  const loadPokemon = async () => {
    const isFirstLoad = isFirstLoadRef.current;
    if (isFirstLoad) {
      isFirstLoadRef.current = false;
    }
    
    setRegionLoading(true);
    setLoading(true);
    if (isFirstLoad) {
      setInitialLoading(true);
    }
    setError(null);
    setLoadedCount(0);

    try {
      console.log(`🔄 Fetching Pokemon for region: ${selectedRegion.name} (${selectedRegion.pokedex})`);
      
      // Try to load from cache first
      const { getAllCachedPokemon, cachePokemonBatch } = await import('../utils/cache');
      const cachedPokemon = await getAllCachedPokemon();
      
      if (cachedPokemon.length > 0) {
        console.log(`📦 Loaded ${cachedPokemon.length} Pokemon from cache`);
        setPokemon(cachedPokemon);
        setLoadedCount(cachedPokemon.length);
        setTotalCount(cachedPokemon.length);
        setLoading(false);
        setRegionLoading(false);
        
        // Mark initial loading as complete immediately - don't wait for background fetch
        if (isFirstLoad) {
          setInitialLoading(false);
        }
        
        // Fetch fresh data in background without blocking UI
        (async () => {
          try {
            const count = await getPokedexCount(selectedRegion.pokedex);
            setTotalCount(count);
            
            const entries = await fetchPokemonByRegion(selectedRegion.pokedex, INITIAL_LOAD_LIMIT);
            const uniqueEntries = Array.from(
              new Map(entries.map(entry => [entry.name, entry])).values()
            );
            
            // Update cache with fresh data
            await cachePokemonBatch(uniqueEntries);
            
            setPokemon(uniqueEntries);
            setLoadedCount(uniqueEntries.length);
          } catch (backgroundErr) {
            console.warn('⚠️ Background fetch failed, using cached data:', backgroundErr);
          }
        })();
        return;
      }
      
      // No cache, fetch from API
      // Load minimal batch first (just 5 Pokemon) for instant UI
      const quickEntries = await fetchPokemonByRegion(selectedRegion.pokedex, 5);
      const quickUniqueEntries = Array.from(
        new Map(quickEntries.map(entry => [entry.name, entry])).values()
      );
      
      // Show UI immediately with minimal data
      setPokemon(quickUniqueEntries);
      setLoadedCount(quickUniqueEntries.length);
      
      // Mark initial loading as complete so UI can render
      if (isFirstLoad) {
        setInitialLoading(false);
      }
      
      // Now load count and more data in background
      (async () => {
        try {
          const count = await getPokedexCount(selectedRegion.pokedex);
          setTotalCount(count);
          console.log(`📊 Total Pokemon in ${selectedRegion.name}: ${count}`);
          
          // Load full initial batch
          const entries = await fetchPokemonByRegion(selectedRegion.pokedex, INITIAL_LOAD_LIMIT);
          const uniqueEntries = Array.from(
            new Map(entries.map(entry => [entry.name, entry])).values()
          );
          console.log(`✅ Loaded ${uniqueEntries.length} Pokemon details (initial batch)`);
          
          // Cache the fetched data
          await cachePokemonBatch(uniqueEntries);
          
          setPokemon(uniqueEntries);
          setLoadedCount(uniqueEntries.length);
        } catch (err) {
          console.warn('⚠️ Background load failed:', err);
        }
      })();
    } catch (err: any) {
      console.error('❌ Error loading Pokemon:', err);
      
      // Try to load from cache as fallback
      try {
        const { getAllCachedPokemon } = await import('../utils/cache');
        const cachedPokemon = await getAllCachedPokemon();
        if (cachedPokemon.length > 0) {
          console.log(`📦 Using ${cachedPokemon.length} cached Pokemon as fallback`);
          setPokemon(cachedPokemon);
          setLoadedCount(cachedPokemon.length);
          setTotalCount(cachedPokemon.length);
          setError('Using cached data (offline mode)');
        } else {
          setError(err.message || 'Failed to load Pokemon');
          setPokemon([]);
          setTotalCount(0);
        }
      } catch (cacheErr) {
        setError(err.message || 'Failed to load Pokemon');
        setPokemon([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setRegionLoading(false);
      setInitialLoading(false);
    }
  };

  const loadMore = async () => {
    if (regionLoading || loadingMore || loadedCount >= totalCount) return;

    setLoadingMore(true);
    try {
      // Fetch next batch starting from where we left off
      const startIndex = loadedCount;
      const endIndex = Math.min(startIndex + LOAD_MORE_BATCH, totalCount);
      
      // Get all Pokemon names first
      const pokemonNames = await fetchPokedexByRegion(selectedRegion.pokedex);
      const batchNames = pokemonNames.slice(startIndex, endIndex);
      
      // Fetch Pokemon data for this batch
      const batchSize = 10;
      const newEntries: DexEntry[] = [];
      
      for (let i = 0; i < batchNames.length; i += batchSize) {
        const batch = batchNames.slice(i, i + batchSize);
        const batchEntries = await Promise.allSettled(
          batch.map(name => fetchPokemonEntry(name))
        );
        
        batchEntries.forEach((result) => {
          if (result.status === 'fulfilled' && result.value !== null) {
            newEntries.push(result.value);
          }
        });
      }
      
      // Filter out duplicates by name (in case same Pokemon appears multiple times)
      setPokemon(prev => {
        const existingNames = new Set(prev.map(p => p.name));
        const uniqueNewEntries = newEntries.filter(entry => !existingNames.has(entry.name));
        return [...prev, ...uniqueNewEntries];
      });
      setLoadedCount(startIndex + newEntries.length);
      console.log(`✅ Loaded ${newEntries.length} more Pokemon (${startIndex + newEntries.length}/${totalCount} total)`);
    } catch (err: any) {
      console.error('❌ Error loading more Pokemon:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPokemon();
  }, [selectedRegion.pokedex]);

  return (
    <PokemonContext.Provider
      value={{
        pokemon,
        totalCount,
        loading,
        initialLoading,
        regionLoading,
        loadingMore,
        error,
        hasMore: loadedCount < totalCount,
        refresh: loadPokemon,
        loadMore,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
};

