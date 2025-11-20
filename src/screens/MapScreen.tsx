import { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import Toast from '../components/Toast';
import { regions, useRegion } from '../context/RegionContext';
import { colors } from '../theme/colors';

const MapScreen = () => {
  const { selectedRegion, setSelectedRegion } = useRegion();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleRegionSelect = (regionId: number) => {
    const region = regions.find(r => r.id === regionId);
    if (region) {
      setSelectedRegion(region);
      setIsExpanded(false); // Collapse after selection
      
      // Show toast notification
      setToastMessage(`Region changed to ${region.name}`);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
      
      // TODO: Store in AsyncStorage for persistence
      // await AsyncStorage.setItem('selectedRegion', regionId.toString());
      
      // TODO: Fetch Pokemon for this region from PokeAPI
      // fetch(`https://pokeapi.co/api/v2/pokedex/${region.pokedex}`)
      //   .then(res => res.json())
      //   .then(data => {
      //     // data.pokemon_entries contains list of Pokemon in this region
      //     // Update global Pokemon list based on selected region
      //   });
    }
  };

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

      <View style={styles.placeholderCard}>
        <ConsoleIcon variant="map" size={48} color={colors.consoleAccent} />
        <Text style={styles.placeholderTitle}>Map View</Text>
        <Text style={styles.placeholderText}>
          GPS tracking and spawn visualization will appear here.
        </Text>
      </View>

      <Toast message={toastMessage} visible={toastVisible} type="success" />
    </ScrollView>
  );
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
  placeholderCard: {
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flex: 1,
    justifyContent: 'center',
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
});

export default memo(MapScreen);

