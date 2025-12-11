import { DexEntry } from '../data/sampleDexEntries';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

type PokeAPIPokemon = {
  id: number;
  name: string;
  types: Array<{ type: { name: string } }>;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': { front_default: string };
      'dream_world': { front_default: string };
    };
    versions?: {
      'generation-v'?: {
        'black-white'?: {
          animated?: { front_default: string };
        };
      };
    };
  };
  species: { url: string };
  height: number;
  weight: number;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
  abilities: Array<{
    ability: { name: string };
    is_hidden: boolean;
  }>;
  base_experience: number;
  capture_rate?: number;
  egg_groups?: Array<{ name: string }>;
};

type PokeAPISpecies = {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
  evolution_chain: { url: string };
  habitat: { name: string } | null;
  generation: { name: string };
  capture_rate: number;
};

type PokeAPIEvolutionChain = {
  chain: {
    species: { name: string };
    evolution_details: Array<{
      min_level: number | null;
      trigger: { name: string };
      item: { name: string } | null;
      held_item: { name: string } | null;
      time_of_day: string | null;
      known_move_type: { name: string } | null;
      location: { name: string } | null;
      min_happiness: number | null;
      min_beauty: number | null;
      min_affection: number | null;
      needs_overworld_rain: boolean;
      party_species: { name: string } | null;
      party_type: { name: string } | null;
      relative_physical_stats: number | null;
      trade_species: { name: string } | null;
      turn_upside_down: boolean;
    }>;
    evolves_to: Array<PokeAPIEvolutionChain['chain']>;
  };
};

type PokeAPIPokedex = {
  pokemon_entries: Array<{
    entry_number: number;
    pokemon_species: { name: string; url: string };
  }>;
};

// Cache for Pokemon data
const pokemonCache = new Map<string, DexEntry>();
const pokedexCache = new Map<string, string[]>(); // region -> pokemon names

export const fetchPokedexByRegion = async (regionPokedex: string): Promise<string[]> => {
  // Check in-memory cache first
  if (pokedexCache.has(regionPokedex)) {
    return pokedexCache.get(regionPokedex)!;
  }
  
  // Check persistent cache
  const { getCachedPokedexData, cachePokedexData } = await import('../utils/cache');
  const cached = await getCachedPokedexData(regionPokedex);
  if (cached) {
    pokedexCache.set(regionPokedex, cached);
    return cached;
  }

  try {
    console.log(`🔍 Fetching pokedex: ${regionPokedex}`);
    const response = await fetch(`${POKEAPI_BASE}/pokedex/${regionPokedex}`);
    if (!response.ok) {
      console.error(`❌ Pokedex ${regionPokedex} returned ${response.status}`);
      // Try alternative names
      const alternatives: Record<string, string[]> = {
        'sinnoh': ['sinnoh-original', 'updated-sinnoh'],
        'kalos': ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
        'alola': ['alola-original', 'updated-alola'],
        'galar': ['galar-original', 'updated-galar'],
      };
      
      if (alternatives[regionPokedex]) {
        for (const alt of alternatives[regionPokedex]) {
          try {
            const altResponse = await fetch(`${POKEAPI_BASE}/pokedex/${alt}`);
            if (altResponse.ok) {
              console.log(`✅ Found alternative: ${alt}`);
              const text = await altResponse.text();
              const data: PokeAPIPokedex = JSON.parse(text);
              const pokemonNames = data.pokemon_entries.map(entry => entry.pokemon_species.name);
              pokedexCache.set(regionPokedex, pokemonNames);
              return pokemonNames;
            }
          } catch (e) {
            // Try next alternative
          }
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const data: PokeAPIPokedex = JSON.parse(text);
    
    const pokemonNames = data.pokemon_entries.map(entry => entry.pokemon_species.name);
    console.log(`✅ Loaded ${pokemonNames.length} Pokemon names from ${regionPokedex}`);
    pokedexCache.set(regionPokedex, pokemonNames);
    // Also cache persistently
    const { cachePokedexData } = await import('../utils/cache');
    await cachePokedexData(regionPokedex, pokemonNames);
    
    return pokemonNames;
  } catch (error) {
    console.error(`❌ Error fetching pokedex ${regionPokedex}:`, error);
    return [];
  }
};

// Get total count for a region without loading all Pokemon data
export const getPokedexCount = async (regionPokedex: string): Promise<number> => {
  const names = await fetchPokedexByRegion(regionPokedex);
  return names.length;
};

const fetchPokemonSpecies = async (name: string): Promise<PokeAPISpecies | null> => {
  try {
    const response = await fetch(`${POKEAPI_BASE}/pokemon-species/${name}`);
    if (!response.ok) {
      if (response.status === 404) {
        // Some Pokemon have form variants - try base name
        const baseName = name.split('-')[0];
        if (baseName !== name) {
          return fetchPokemonSpecies(baseName);
        }
        // Silently skip if not found (form variants are expected)
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    // Clean up any problematic characters before parsing
    const cleanedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
    return JSON.parse(cleanedText);
  } catch (error: any) {
    // Only log non-404 errors (404s are expected for form variants)
    if (!error.message?.includes('404')) {
      console.error(`Error fetching species for ${name}:`, error);
      if (error.message?.includes('JSON')) {
        console.error(`JSON parse error for ${name}, response might contain invalid characters`);
      }
    }
    return null;
  }
};

const fetchPokemonData = async (name: string): Promise<PokeAPIPokemon | null> => {
  try {
    const response = await fetch(`${POKEAPI_BASE}/pokemon/${name}`);
    if (!response.ok) {
      if (response.status === 404) {
        // Some Pokemon have form variants - try base name
        const baseName = name.split('-')[0];
        if (baseName !== name) {
          return fetchPokemonData(baseName);
        }
        // Silently skip if not found (form variants are expected)
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    // Clean up any problematic characters before parsing
    const cleanedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
    return JSON.parse(cleanedText);
  } catch (error: any) {
    // Only log non-404 errors (404s are expected for form variants)
    if (!error.message?.includes('404')) {
      console.error(`Error fetching Pokemon ${name}:`, error);
      if (error.message?.includes('JSON')) {
        console.error(`JSON parse error for ${name}, response might contain invalid characters`);
      }
    }
    return null;
  }
};

const getGenerationNumber = (generationName: string): number => {
  const match = generationName.match(/generation-(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Fetch evolution chain from PokeAPI
 */
const fetchEvolutionChain = async (url: string): Promise<Array<{ name: string; trigger?: string }>> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Evolution chain fetch failed: ${response.status}`);
      return [];
    }
    const data: PokeAPIEvolutionChain = await response.json();
    
    const evolutions: Array<{ name: string; trigger?: string }> = [];
    
    const processChain = (chain: PokeAPIEvolutionChain['chain'], parentTrigger?: string) => {
      const speciesName = chain.species.name;
      const capitalizedName = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
      
      // Add this evolution with its trigger (from parent)
      evolutions.push({ 
        name: capitalizedName,
        trigger: parentTrigger,
      });
      
      // Process evolves_to recursively with their triggers
      chain.evolves_to.forEach(nextChain => {
        if (nextChain.evolution_details.length > 0) {
          const details = nextChain.evolution_details[0];
          let trigger = '';
          
          if (details.trigger.name === 'level-up') {
            if (details.min_level) {
              trigger = `Level ${details.min_level}`;
            } else if (details.min_happiness) {
              trigger = `Happiness ${details.min_happiness}+`;
            } else if (details.min_affection) {
              trigger = `Affection ${details.min_affection}+`;
            } else if (details.known_move_type) {
              trigger = `Know ${details.known_move_type.name} move`;
            } else if (details.location) {
              trigger = `At ${details.location.name}`;
            } else if (details.time_of_day) {
              trigger = `Level up (${details.time_of_day})`;
            } else {
              trigger = 'Level up';
            }
            
            if (details.item) {
              trigger += ` with ${details.item.name}`;
            }
            if (details.held_item) {
              trigger += ` holding ${details.held_item.name}`;
            }
            if (details.needs_overworld_rain) {
              trigger += ' (rain)';
            }
            if (details.turn_upside_down) {
              trigger += ' (upside down)';
            }
          } else if (details.trigger.name === 'trade') {
            trigger = 'Trade';
            if (details.trade_species) {
              trigger += ` with ${details.trade_species.name}`;
            }
            if (details.item) {
              trigger += ` holding ${details.item.name}`;
            }
          } else if (details.trigger.name === 'use-item') {
            trigger = `Use ${details.item?.name || 'item'}`;
          } else if (details.trigger.name === 'shed') {
            trigger = 'Shed (Ninjask)';
          } else {
            trigger = details.trigger.name.replace(/-/g, ' ');
          }
          
          processChain(nextChain, trigger);
        } else {
          processChain(nextChain);
        }
      });
    };
    
    processChain(data.chain);
    return evolutions;
  } catch (error) {
    console.error('Error fetching evolution chain:', error);
    return [];
  }
};

export const fetchPokemonEntry = async (pokemonName: string): Promise<DexEntry | null> => {
  // Check in-memory cache first
  if (pokemonCache.has(pokemonName)) {
    return pokemonCache.get(pokemonName)!;
  }
  
  // Check persistent cache (AsyncStorage)
  const { getCachedPokemonData, cachePokemonData } = await import('../utils/cache');
  const cached = await getCachedPokemonData(pokemonName);
  if (cached) {
    // Also add to in-memory cache for faster access
    pokemonCache.set(pokemonName, cached);
    return cached;
  }

  try {
    const [pokemonData, speciesData] = await Promise.all([
      fetchPokemonData(pokemonName),
      fetchPokemonSpecies(pokemonName),
    ]);

    if (!pokemonData || !speciesData) {
      return null;
    }

    // Fetch evolution chain
    let evolutions: Array<{ name: string; trigger?: string }> = [];
    if (speciesData.evolution_chain?.url) {
      evolutions = await fetchEvolutionChain(speciesData.evolution_chain.url);
    }

    // Get English flavor text - clean up special characters and fix spacing
    const flavorTextEntry = speciesData.flavor_text_entries.find(
      entry => entry.language.name === 'en'
    );
    let flavorText = flavorTextEntry?.flavor_text || '';
    
    if (flavorText) {
      // Replace form feeds and control characters with spaces
      flavorText = flavorText
        .replace(/\f/g, ' ') // Form feed -> space
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // Control chars -> space (preserve word boundaries)
        .replace(/\n/g, ' ') // Newlines -> space
        .replace(/\r/g, ' '); // Carriage returns -> space
      
      // Fix missing spaces between words (common PokeAPI issue)
      // Add space between word characters that are stuck together
      flavorText = flavorText.replace(/([a-z])([A-Z])/g, '$1 $2'); // lowercaseUppercase -> lowercase Uppercase
      
      // Normalize all whitespace to single spaces
      flavorText = flavorText.replace(/\s+/g, ' ');
      
      // Ensure proper spacing around punctuation
      flavorText = flavorText
        .replace(/([.!?])([A-Za-z])/g, '$1 $2') // PunctuationLetter -> Punctuation Letter
        .replace(/([A-Za-z])([.!?,:;])/g, '$1$2'); // LetterPunctuation -> LetterPunctuation (no space before)
      
      flavorText = flavorText.trim();
    }
    
    flavorText = flavorText || 'No description available.';

    // Get English genus (descriptor)
    const genus = speciesData.genera.find(
      gen => gen.language.name === 'en'
    )?.genus || 'Pokémon';

    // Get types
    const types = pokemonData.types.map(t => t.type.name);

    // Get stats
    const statsMap: Record<string, number> = {};
    pokemonData.stats.forEach(stat => {
      const statName = stat.stat.name.replace('-', '');
      statsMap[statName] = stat.base_stat;
    });

    // Get ALL abilities (both regular and hidden)
    const abilities = pokemonData.abilities.map(ability => {
      const abilityName = ability.ability.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return ability.is_hidden ? `${abilityName} (Hidden)` : abilityName;
    });

    // Get sprite URLs
    const sprite = pokemonData.sprites.front_default || '';
    const artwork = pokemonData.sprites.other['official-artwork']?.front_default || sprite;
    const animatedSprite =
      pokemonData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
      sprite;

    // Get generation
    const generation = getGenerationNumber(speciesData.generation.name);

    // Get capture rate from species
    const captureRate = speciesData.capture_rate || 45; // Default if not available

    // Get egg groups
    const eggGroups = pokemonData.egg_groups?.map(eg => eg.name) || [];

    // Create DexEntry
    const entry: DexEntry = {
      id: String(pokemonData.id).padStart(3, '0'),
      name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
      seen: false, // Will be set by user data
      owned: false, // Will be set by user data
      types,
      sprite,
      animatedSprite,
      artwork,
      descriptor: genus,
      description: flavorText,
      height: `${(pokemonData.height / 10).toFixed(1)} m`,
      weight: `${(pokemonData.weight / 10).toFixed(1)} kg`,
      habitat: speciesData.habitat?.name || 'None', // Some Pokémon legitimately have no habitat (legendaries)
      evolutions,
      abilities,
      moves: [], // Would need to fetch moves separately (too many)
      encounters: [], // Would need location data
      stats: {
        hp: statsMap.hp || 0,
        attack: statsMap.attack || 0,
        defense: statsMap.defense || 0,
        spAtk: statsMap.specialattack || 0,
        spDef: statsMap.specialdefense || 0,
        speed: statsMap.speed || 0,
      },
      generation,
      captureRate,
      baseExperience: pokemonData.base_experience || 0,
      eggGroups,
    };

    // Cache it (both in-memory and persistent)
    pokemonCache.set(pokemonName, entry);
    const { cachePokemonData } = await import('../utils/cache');
    await cachePokemonData(pokemonName, entry);

    return entry;
  } catch (error) {
    console.error(`Error creating entry for ${pokemonName}:`, error);
    return null;
  }
};

// PokeAPI provides data for all Pokemon species across all generations
// As of 2024, this includes over 1,000+ Pokemon species
// Each region's pokedex contains different subsets:
// - Kanto: 151 Pokemon
// - Johto: 100 Pokemon (251 total with Kanto)
// - Hoenn: 135 Pokemon (386 total)
// - Sinnoh: 107 Pokemon (493 total)
// - Unova: 156 Pokemon (649 total)
// - Kalos: 72 Pokemon (721 total)
// - Alola: 88 Pokemon (809 total)
// - Galar: 89 Pokemon (898 total)
// - Paldea: 120+ Pokemon (1000+ total)

export const fetchPokemonByRegion = async (
  regionPokedex: string,
  limit?: number
): Promise<DexEntry[]> => {
  const pokemonNames = await fetchPokedexByRegion(regionPokedex);
  // If limit is provided, use it; otherwise load all
  const limitedNames = limit ? pokemonNames.slice(0, limit) : pokemonNames;

  // Fetch Pokemon data in parallel (but limit concurrency)
  const entries: DexEntry[] = [];
  const batchSize = 10;

  for (let i = 0; i < limitedNames.length; i += batchSize) {
    const batch = limitedNames.slice(i, i + batchSize);
    const batchEntries = await Promise.allSettled(
      batch.map(name => fetchPokemonEntry(name))
    );
    
    // Handle both fulfilled and rejected promises
    batchEntries.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        entries.push(result.value);
      } else if (result.status === 'rejected') {
        const pokemonName = batch[index];
        // Only warn for non-404 errors (404s are expected for form variants)
        const errorMsg = result.reason?.message || String(result.reason);
        if (!errorMsg.includes('404')) {
          console.warn(`⚠️ Failed to fetch ${pokemonName}:`, result.reason);
        }
      }
    });
  }

  console.log(`✅ Successfully loaded ${entries.length} out of ${limitedNames.length} Pokemon`);
  return entries;
};

// Clear cache if needed
export const clearPokemonCache = () => {
  pokemonCache.clear();
  pokedexCache.clear();
};

