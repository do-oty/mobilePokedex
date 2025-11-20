export type DexEntry = {
  id: string;
  name: string;
  seen: boolean;
  owned: boolean;
  types: string[];
  sprite: string;
  animatedSprite: string;
  artwork: string;
  descriptor: string;
  description: string;
  height: string;
  weight: string;
  habitat: string;
  evolutions: Array<{ name: string; trigger?: string }>;
  abilities: string[];
  moves: string[];
  encounters: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  generation: number;
  captureRate: number;
  baseExperience: number;
  eggGroups: string[];
};

export const sampleDexEntries: DexEntry[] = [
  {
    id: '001',
    name: 'Snivy',
    seen: true,
    owned: true,
    types: ['grass'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/495.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/495.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/495.png',
    descriptor: 'Grass Snake Pokémon',
    description:
      'They photosynthesize by bathing their tails in sunlight. The tail is a measure of their vitality.',
    height: '0.6 m',
    weight: '8.1 kg',
    habitat: 'Forests near Nuvema Town',
    evolutions: [
      { name: 'Snivy' },
      { name: 'Servine', trigger: 'Lv. 17' },
      { name: 'Serperior', trigger: 'Lv. 36' },
    ],
    abilities: ['Overgrow', 'Contrary (Hidden)'],
    moves: ['Vine Whip', 'Leaf Tornado', 'Leaf Storm'],
    encounters: ['Pinwheel Forest Interior', 'Route 1 Tall Grass'],
    stats: { hp: 45, attack: 45, defense: 55, spAtk: 45, spDef: 55, speed: 63 },
    generation: 5,
    captureRate: 45,
    baseExperience: 62,
    eggGroups: ['Field', 'Grass'],
  },
  {
    id: '002',
    name: 'Servine',
    seen: true,
    owned: false,
    types: ['grass'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/496.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/496.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/496.png',
    descriptor: 'Grass Snake Pokémon',
    description:
      'It moves along the ground as if sliding. Its swift movements befuddle its foes, and it then attacks with a vine whip.',
    height: '0.8 m',
    weight: '16.0 kg',
    habitat: 'Shaded riverbanks',
    evolutions: [
      { name: 'Snivy' },
      { name: 'Servine', trigger: 'Lv. 17' },
      { name: 'Serperior', trigger: 'Lv. 36' },
    ],
    abilities: ['Overgrow', 'Contrary (Hidden)'],
    moves: ['Leaf Blade', 'Coil', 'Giga Drain'],
    encounters: ['Pinwheel Forest Exterior'],
    stats: { hp: 60, attack: 60, defense: 75, spAtk: 60, spDef: 75, speed: 83 },
    generation: 5,
    captureRate: 45,
    baseExperience: 145,
    eggGroups: ['Field', 'Grass'],
  },
  {
    id: '003',
    name: 'Serperior',
    seen: true,
    owned: false,
    types: ['grass'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/497.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/497.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/497.png',
    descriptor: 'Regal Pokémon',
    description:
      "It can stop its opponents' movements with just a glare. It takes in solar energy and boosts it internally.",
    height: '3.3 m',
    weight: '63.0 kg',
    habitat: 'Ancient ruins',
    evolutions: [
      { name: 'Snivy' },
      { name: 'Servine', trigger: 'Lv. 17' },
      { name: 'Serperior', trigger: 'Lv. 36' },
    ],
    abilities: ['Overgrow', 'Contrary (Hidden)'],
    moves: ['Leaf Storm', 'Dragon Tail', 'Glare'],
    encounters: ['Dragonspiral Tower Summit'],
    stats: { hp: 75, attack: 75, defense: 95, spAtk: 75, spDef: 95, speed: 113 },
    generation: 5,
    captureRate: 45,
    baseExperience: 238,
    eggGroups: ['Field', 'Grass'],
  },
  {
    id: '004',
    name: 'Tepig',
    seen: true,
    owned: true,
    types: ['fire'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/498.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/498.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/498.png',
    descriptor: 'Fire Pig Pokémon',
    description:
      'It blows fire through its nose. When it catches a cold, the fire becomes pitch-black smoke instead.',
    height: '0.5 m',
    weight: '9.9 kg',
    habitat: 'Grasslands by Accumula Town',
    evolutions: [
      { name: 'Tepig' },
      { name: 'Pignite', trigger: 'Lv. 17' },
      { name: 'Emboar', trigger: 'Lv. 36' },
    ],
    abilities: ['Blaze', 'Thick Fat (Hidden)'],
    moves: ['Flame Charge', 'Rollout', 'Heat Crash'],
    encounters: ['Lostlorn Forest Clearing'],
    stats: { hp: 65, attack: 63, defense: 45, spAtk: 45, spDef: 45, speed: 45 },
    generation: 5,
    captureRate: 45,
    baseExperience: 62,
    eggGroups: ['Field'],
  },
  {
    id: '005',
    name: 'Oshawott',
    seen: true,
    owned: false,
    types: ['water'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/501.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/501.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/501.png',
    descriptor: 'Sea Otter Pokémon',
    description:
      "The scalchop on its stomach isn't just used for battle—it can also be used to break open hard berries.",
    height: '0.5 m',
    weight: '5.9 kg',
    habitat: 'Clear-water ponds',
    evolutions: [
      { name: 'Oshawott' },
      { name: 'Dewott', trigger: 'Lv. 17' },
      { name: 'Samurott', trigger: 'Lv. 36' },
    ],
    abilities: ['Torrent', 'Shell Armor (Hidden)'],
    moves: ['Razor Shell', 'Aqua Jet', 'Hydro Pump'],
    encounters: ['Route 3 Puddles', 'Wellspring Cave Entrance'],
    stats: { hp: 55, attack: 55, defense: 45, spAtk: 63, spDef: 45, speed: 45 },
    generation: 5,
    captureRate: 45,
    baseExperience: 62,
    eggGroups: ['Field'],
  },
  {
    id: '006',
    name: 'Victini',
    seen: true,
    owned: false,
    types: ['psychic', 'fire'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/494.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/494.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/494.png',
    descriptor: 'Victory Pokémon',
    description:
      'This Pokémon brings victory. It is said that Trainers with Victini always win, regardless of the type of encounter.',
    height: '0.4 m',
    weight: '4.0 kg',
    habitat: 'Liberty Garden basement',
    evolutions: [{ name: 'Victini' }],
    abilities: ['Victory Star'],
    moves: ['V-create', 'Zen Headbutt', 'Searing Shot'],
    encounters: ['Liberty Garden Vault'],
    stats: { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
    generation: 5,
    captureRate: 3,
    baseExperience: 270,
    eggGroups: ['Undiscovered'],
  },
  {
    id: '007',
    name: 'Patrat',
    seen: true,
    owned: false,
    types: ['normal'],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/504.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/504.gif',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/504.png',
    descriptor: 'Scout Pokémon',
    description:
      'Using food stored in cheek pouches, they can keep watch for days. They use luminescent matter to communicate.',
    height: '0.5 m',
    weight: '11.6 kg',
    habitat: 'Roadside burrows',
    evolutions: [
      { name: 'Patrat' },
      { name: 'Watchog', trigger: 'Lv. 20' },
    ],
    abilities: ['Run Away', 'Keen Eye', 'Analytic (Hidden)'],
    moves: ['Bite', 'Hypnosis', 'After You'],
    encounters: ['Route 1 Roadside Grass', 'Route 2 Edge'],
    stats: { hp: 45, attack: 55, defense: 39, spAtk: 35, spDef: 39, speed: 42 },
    generation: 5,
    captureRate: 255,
    baseExperience: 51,
    eggGroups: ['Field'],
  },
  {
    id: '008',
    name: '???',
    seen: false,
    owned: false,
    types: [],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png',
    descriptor: 'Unknown Pokémon',
    description: 'No data available.',
    height: '—',
    weight: '—',
    habitat: 'Unknown',
    evolutions: [],
    abilities: [],
    moves: [],
    encounters: [],
    stats: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    generation: 0,
    captureRate: 0,
    baseExperience: 0,
    eggGroups: [],
  },
  {
    id: '009',
    name: '???',
    seen: false,
    owned: false,
    types: [],
    sprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
    animatedSprite:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png',
    descriptor: 'Unknown Pokémon',
    description: 'No data available.',
    height: '—',
    weight: '—',
    habitat: 'Unknown',
    evolutions: [],
    abilities: [],
    moves: [],
    encounters: [],
    stats: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    generation: 0,
    captureRate: 0,
    baseExperience: 0,
    eggGroups: [],
  },
];


