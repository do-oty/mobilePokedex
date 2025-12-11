/**
 * Utility to test and debug the search cache
 * Call these functions from the React Native debugger or add to a screen temporarily
 */

import { getRecentSearches, getCacheInfo, clearRecentSearches } from './cache';

/**
 * Test function to check if search cache is working
 * Call this from React Native debugger: testSearchCache()
 */
export const testSearchCache = async () => {
  console.log('🔍 Testing Search Cache...\n');
  
  try {
    // Get cache info
    const cacheInfo = await getCacheInfo();
    console.log('📊 Cache Info:');
    console.log(`  - Recent Searches: ${cacheInfo.recentSearchesCount}`);
    console.log(`  - Cache Age: ${cacheInfo.cacheAge ? Math.round(cacheInfo.cacheAge / 1000 / 60) + ' minutes' : 'N/A'}`);
    console.log(`  - Pokémon Cached: ${cacheInfo.pokemonCount}`);
    console.log(`  - Pokedex Regions: ${cacheInfo.pokedexCount}\n`);
    
    // Get recent searches
    const recentSearches = await getRecentSearches(20);
    console.log('📝 Recent Searches (last 20):');
    if (recentSearches.length === 0) {
      console.log('  (No searches cached yet)');
      console.log('  💡 Try searching for a Pokémon to test the cache!');
    } else {
      recentSearches.forEach((search, index) => {
        console.log(`  ${index + 1}. "${search}"`);
      });
    }
    
    console.log('\n✅ Cache test complete!');
    return {
      success: true,
      cacheInfo,
      recentSearches,
    };
  } catch (error) {
    console.error('❌ Error testing cache:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Clear search cache (for testing)
 */
export const clearSearchCache = async () => {
  try {
    await clearRecentSearches();
    console.log('✅ Search cache cleared!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

// Make functions available globally for React Native debugger
if (typeof global !== 'undefined') {
  (global as any).testSearchCache = testSearchCache;
  (global as any).clearSearchCache = clearSearchCache;
  console.log('💡 Cache test functions available!');
  console.log('   Call testSearchCache() or clearSearchCache() from the debugger');
}



