import { createContext, memo, ReactNode, useContext, useState } from 'react';

export type Region = {
  id: number;
  name: string;
  pokedex: string;
  color: string;
};

export const regions: Region[] = [
  { id: 1, name: 'Kanto', pokedex: 'kanto', color: '#E63946' },
  { id: 2, name: 'Johto', pokedex: 'original-johto', color: '#FFC300' },
  { id: 3, name: 'Hoenn', pokedex: 'hoenn', color: '#4CAF50' },
  { id: 4, name: 'Sinnoh', pokedex: 'updated-sinnoh', color: '#2196F3' }, // Fixed: was 'sinnoh'
  { id: 5, name: 'Unova', pokedex: 'original-unova', color: '#9C27B0' },
  { id: 6, name: 'Kalos', pokedex: 'kalos-central', color: '#FF5722' }, // Fixed: Kalos has multiple pokedexes
  { id: 7, name: 'Alola', pokedex: 'updated-alola', color: '#00BCD4' }, // Fixed: was 'alola'
  { id: 8, name: 'Galar', pokedex: 'galar', color: '#673AB7' },
];

type RegionContextType = {
  selectedRegion: Region;
  setSelectedRegion: (region: Region) => void;
};

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = memo(({ children }: { children: ReactNode }) => {
  const [selectedRegion, setSelectedRegion] = useState<Region>(regions[4]); // Default to Unova

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion }}>
      {children}
    </RegionContext.Provider>
  );
});

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

