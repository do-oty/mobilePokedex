import { memo, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import AdvancedFilters, { FilterOptions } from '../components/AdvancedFilters';
import DexDetailCard from '../components/DexDetailCard';
import DexEntryRow from '../components/DexEntryRow';
import QuickFilters, { StatusFilter } from '../components/QuickFilters';
import SearchBar from '../components/SearchBar';
import ConsoleIcon from '../components/icons/ConsoleIcon';
import { useRegion } from '../context/RegionContext';
import { sampleDexEntries } from '../data/sampleDexEntries';
import { colors } from '../theme/colors';
import { getDifficultyStars } from '../utils/captureDifficulty';

const TerminalScreen = () => {
  const { selectedRegion } = useRegion();
  const [selectedId, setSelectedId] = useState(sampleDexEntries[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    difficulty: 'all',
    generation: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call - in real app, fetch new Pokemon data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const selected = useMemo(
    () =>
      sampleDexEntries.find(entry => entry.id === selectedId) ??
      sampleDexEntries[0],
    [selectedId],
  );

  const filteredEntries = useMemo(() => {
    let filtered = sampleDexEntries;

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

    // Generation filter
    if (filters.generation) {
      filtered = filtered.filter(entry => entry.generation === filters.generation);
    }

    return filtered;
  }, [searchQuery, statusFilter, filters]);

  const seenCount = sampleDexEntries.filter(entry => entry.seen).length;
  const ownedCount = sampleDexEntries.filter(entry => entry.owned).length;

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
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.consoleAccent]}
              tintColor={colors.consoleAccent}
              progressBackgroundColor={colors.blackPanel}
            />
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
                generation={selected.generation}
                captureRate={selected.captureRate}
                baseExperience={selected.baseExperience}
                eggGroups={selected.eggGroups}
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
              active={item.id === selected.id}
              onPress={() => setSelectedId(item.id)}
            />
          )}
        />
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
});

export default memo(TerminalScreen);

