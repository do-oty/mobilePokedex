import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

// Try to import ViroReact - if it fails, show fallback
let ViroARScene: any;
let ViroARSceneNavigator: any;
let ViroARNode: any;
let ViroImage: any;
let ViroText: any;
let ViroAvailable = false;

try {
  const viro = require('@reactvision/react-viro');
  ViroARScene = viro.ViroARScene;
  ViroARSceneNavigator = viro.ViroARSceneNavigator;
  ViroARNode = viro.ViroARNode;
  ViroImage = viro.ViroImage;
  ViroText = viro.ViroText;
  ViroAvailable = true;
} catch (e) {
  console.warn('ViroReact not available:', e);
  ViroAvailable = false;
}

type Pokemon = {
  id: number | string;
  name: string;
  sprite?: string;
  animatedSprite?: string;
};

type Props = {
  pokemon: Pokemon | null;
  onPokemonPress?: (pokemonId: string) => void;
};

const ARScene = ({ pokemon, onPokemonPress }: Props) => {
  if (!pokemon || !ViroAvailable) {
    return null;
  }

  return (
    <ViroARScene>
      {/* ViroReact automatically handles world-space anchoring */}
      <ViroARNode position={[0, 0, -1]}>
        <ViroImage
          source={{ uri: pokemon.animatedSprite || pokemon.sprite }}
          width={0.5}
          height={0.5}
          position={[0, 0, 0]}
          onClick={() => onPokemonPress?.(String(pokemon.id))}
        />
        <ViroText
          text={pokemon.name}
          position={[0, -0.3, 0]}
          style={{
            fontSize: 20,
            color: '#ffffff',
            textAlignVertical: 'center',
            textAlign: 'center',
          }}
        />
      </ViroARNode>
    </ViroARScene>
  );
};

const HabitatARScene = ({ pokemon, onPokemonPress }: Props) => {
  if (!ViroAvailable) {
    return (
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white' }}>AR not available - requires native setup</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: () => <ARScene pokemon={pokemon} onPokemonPress={onPokemonPress} />,
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export default HabitatARScene;

