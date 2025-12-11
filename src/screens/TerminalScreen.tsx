import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';

import AdvancedFilters, { FilterOptions } from '../components/AdvancedFilters';
import DexDetailCard from '../components/DexDetailCard';
import DexEntryRow from '../components/DexEntryRow';
import QuickFilters, { StatusFilter } from '../components/QuickFilters';
import SearchBar from '../components/SearchBar';
import ConsoleIcon from '../components/icons/ConsoleIcon';
import { usePokemon } from '../context/PokemonContext';
import { useRegion } from '../context/RegionContext';
import { useUser } from '../context/UserContext';
import { colors } from '../theme/colors';
import { getDifficultyStars } from '../utils/captureDifficulty';

const TerminalScreen = () => {
  const { selectedRegion } = useRegion();
  const { pokemon, loading: pokemonLoading, regionLoading, loadingMore, error: pokemonError, hasMore, refresh, loadMore } = usePokemon();
  const { userData } = useUser();
  const listRef = useRef<FlatList>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    difficulty: 'all',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Set first Pokemon as selected when data loads
  useEffect(() => {
    if (pokemon.length > 0 && !selectedId) {
      setSelectedId(pokemon[0].name); // Use name as unique identifier
    }
  }, [pokemon, selectedId]);

  // Don't mark as seen just by viewing - only mark when actually capturing

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const selected = useMemo(() => {
    // selectedId can be either ID or name now - try both for backward compatibility
    const entry = pokemon.find(entry => entry.id === selectedId || entry.name === selectedId) ?? pokemon[0];
    if (!entry || !userData) return { ...entry, seen: true, owned: false };
    
    // Add seen/owned status to selected Pokemon
    return {
      ...entry,
      seen: userData.seenPokemon.includes(entry.id),
      owned: userData.caughtPokemon.includes(entry.id),
    };
  }, [selectedId, pokemon, userData]);

  // Map Pokemon entries with Firebase status
  const entriesWithStatus = useMemo(() => {
    if (!userData) return pokemon;
    
    return pokemon.map(entry => ({
      ...entry,
      seen: userData.seenPokemon.includes(entry.id),
      owned: userData.caughtPokemon.includes(entry.id),
    }));
  }, [userData, pokemon]);

  const filteredEntries = useMemo(() => {
    let filtered = entriesWithStatus;

    // Search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        entry =>
          entry.name.toLowerCase().includes(lowerCaseQuery) ||
          entry.id.includes(lowerCaseQuery) ||
          entry.types.some(type => type.toLowerCase().includes(lowerCaseQuery)),
      );
    }

    // Status filter
    if (statusFilter === 'seen') {
      filtered = filtered.filter(entry => entry.seen);
    } else if (statusFilter === 'unseen') {
      filtered = filtered.filter(entry => !entry.seen && !entry.owned);
    } else if (statusFilter === 'owned') {
      filtered = filtered.filter(entry => entry.owned);
    }

    // Type filter (multi-select)
    if (filters.types.length > 0) {
      filtered = filtered.filter(entry =>
        entry.types.some(type => 
          filters.types.some(filterType => type.toLowerCase() === filterType.toLowerCase())
        )
      );
    }

    // Difficulty filter (based on capture rate)
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(entry => {
        const stars = getDifficultyStars(entry.captureRate);
        if (filters.difficulty === 'easy') return stars === 1 || stars === 2;
        if (filters.difficulty === 'hard') return stars === 3 || stars === 4;
        if (filters.difficulty === 'legendary') return stars === 5;
        return true;
      });
    }


    return filtered;
  }, [entriesWithStatus, searchQuery, statusFilter, filters]);

  const seenCount = userData?.seenPokemon.length || 0;
  const ownedCount = userData?.caughtPokemon.length || 0;

  const handleShare = useCallback(async () => {
    if (!selected) return;
    
    const shareMessage = `I caught ${selected.name}! ${selected.descriptor}\n\n` +
      `Type: ${selected.types.join(', ')}\n` +
      `Height: ${selected.height}\n` +
      `Weight: ${selected.weight}\n` +
      `Capture Rate: ${selected.captureRate}/255\n\n` +
      `#Pokemon #Pokedex`;
    
    try {
      await Share.open({
        message: shareMessage,
        title: `Caught ${selected.name}!`,
        url: selected.artwork || selected.animatedSprite || selected.sprite,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Error sharing:', error);
      }
    }
  }, [selected]);

  if (pokemonLoading && pokemon.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.consoleAccent} />
        <Text style={styles.loadingText}>Loading Pokémon...</Text>
      </View>
    );
  }

  if (pokemonError) {
    return (
      <View style={styles.loadingContainer}>
        <ConsoleIcon variant="terminal" size={64} color={colors.textMuted} />
        <Text style={styles.errorText}>Error loading Pokémon</Text>
        <Text style={styles.errorSubtext}>{pokemonError}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!selected || pokemon.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No Pokémon available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.shellCounters}>
        <StatusCard label="Seen" value={seenCount} icon="eye" />
        <StatusCard label="Owned" value={ownedCount} icon="owned" />
        <StatusCard label="Region" value={selectedRegion.name} icon="region" />
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredEntries}
          // Use composite key to avoid duplicates even if a species appears in multiple lists
          keyExtractor={item => `${item.name}-${item.id}`}
          ref={listRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            // Load more when user scrolls near the end
            if (hasMore && !loadingMore && !pokemonLoading) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          onScroll={event => {
            const offsetY = event.nativeEvent.contentOffset.y;
            setShowScrollTop(offsetY > 600); // show button after scrolling down a bit
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.consoleAccent]}
              tintColor={colors.consoleAccent}
              progressBackgroundColor={colors.blackPanel}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={colors.consoleAccent} />
                <Text style={styles.loadMoreText}>Loading more Pokémon...</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <>
              <DexDetailCard
                id={selected.id}
                name={selected.name}
                descriptor={selected.descriptor}
                description={selected.description}
                height={selected.height}
                weight={selected.weight}
                types={selected.types}
                artwork={selected.artwork}
                animatedSprite={selected.animatedSprite}
                habitat={selected.habitat}
                evolutions={selected.evolutions}
                abilities={selected.abilities}
                moves={selected.moves}
                encounters={selected.encounters}
                stats={selected.stats}
                captureRate={selected.captureRate}
                baseExperience={selected.baseExperience}
                eggGroups={selected.eggGroups}
                seen={selected.seen}
                owned={selected.owned}
                onShare={selected.owned ? handleShare : undefined}
              />

              <View style={styles.listHeader}>
                <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
                <QuickFilters 
                  activeFilter={statusFilter} 
                  onFilterChange={setStatusFilter} 
                />
                <AdvancedFilters filters={filters} onFilterChange={setFilters} />
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ConsoleIcon variant="terminal" size={64} color={colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No Pokémon Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'No Pokémon match the selected filters'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DexEntryRow
              id={item.id}
              name={item.name}
              owned={item.owned}
              seen={item.seen}
              types={item.types}
              sprite={item.sprite}
              animatedSprite={item.animatedSprite}
              captureRate={item.captureRate}
              active={item.name === selected.name}
              onPress={() => setSelectedId(item.name)}
            />
          )}
        />
        {showScrollTop && (
          <Pressable
            onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
            style={styles.scrollTopButton}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}>
            <Ionicons name="chevron-up" size={18} color={colors.consoleAccent} />
          </Pressable>
        )}
        {regionLoading && (
          <View style={styles.regionOverlay}>
            <ActivityIndicator size="large" color={colors.consoleAccent} />
            <Text style={styles.regionOverlayText}>Loading region...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

type StatusCardProps = {
  label: string;
  value: string | number;
  icon: 'eye' | 'owned' | 'region';
};

const StatusCard = ({ label, value, icon }: StatusCardProps) => (
  <View style={styles.counterCard}>
    <View style={styles.counterHeader}>
      <ConsoleIcon variant={icon} size={14} color={colors.consoleAccent} />
      <Text style={styles.counterLabel}>{label.toUpperCase()}</Text>
    </View>
    <Text style={styles.counterValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
  },
  shellCounters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  counterValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  content: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.consolePanel,
    borderWidth: 1,
    borderColor: colors.consoleGlass,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listContent: {
    paddingBottom: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  listHeader: {
    marginTop: 12,
    marginBottom: 12,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: colors.consoleAccent,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 12,
    bottom: 18,
    backgroundColor: colors.blackPanel,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.consoleAccent,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  scrollTopText: {
    color: colors.consoleAccent,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.25,
  },
  regionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionOverlayText: {
    color: colors.textPrimary,
    marginTop: 8,
  },
});

export default memo(TerminalScreen);

