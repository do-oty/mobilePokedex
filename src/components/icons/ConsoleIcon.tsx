import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

export type ConsoleIconVariant =
  | 'terminal'
  | 'capture'
  | 'map'
  | 'eye'
  | 'owned'
  | 'region'
  | 'location'
  | 'abilities'
  | 'evolution'
  | 'social'
  | 'profile'
  | 'search';

type Props = {
  variant: ConsoleIconVariant;
  size?: number;
  color?: string;
};

const ConsoleIcon = ({ variant, size = 20, color = colors.highlight }: Props) => {
  const sharedStyle = { width: size, height: size };

  switch (variant) {
    case 'terminal':
      return (
        <View style={[styles.terminal, sharedStyle, { borderColor: color }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
      );
    case 'capture':
      return (
        <View style={[styles.capture, sharedStyle, { borderColor: color }]}>
          <View
            style={[
              styles.captureLens,
              { borderColor: color, width: size * 0.4, height: size * 0.4 },
            ]}
          />
          <View
            style={[
              styles.captureFlash,
              {
                backgroundColor: color,
                width: size * 0.2,
                height: size * 0.05,
              },
            ]}
          />
        </View>
      );
    case 'map':
      return (
        <View style={[sharedStyle, styles.mapWrapper]}>
          <View style={[styles.mapDiamond, { borderColor: color }]} />
          <View style={[styles.mapDot, { backgroundColor: color }]} />
        </View>
      );
    case 'eye':
      return (
        <View style={[sharedStyle, styles.eyeWrapper]}>
          <View style={[styles.eyeShape, { borderColor: color }]} />
          <View style={[styles.eyePupil, { backgroundColor: color }]} />
        </View>
      );
    case 'owned':
      return (
        <View style={[sharedStyle, styles.ownedWrapper]}>
          <View style={[styles.checkStem, { backgroundColor: color }]} />
          <View style={[styles.checkArm, { backgroundColor: color }]} />
        </View>
      );
    case 'region':
      return (
        <View style={[sharedStyle, styles.regionWrapper]}>
          <View style={[styles.regionRing, { borderColor: color }]} />
          <View style={[styles.regionNorth, { backgroundColor: color }]} />
          <View style={[styles.regionEast, { backgroundColor: color }]} />
        </View>
      );
    case 'location':
      return (
        <View style={[sharedStyle, styles.locationWrapper]}>
          <View style={[styles.locationPin, { backgroundColor: color }]} />
          <View style={[styles.locationBase, { borderColor: color }]} />
        </View>
      );
    case 'abilities':
      return (
        <View style={[sharedStyle, styles.abilitiesWrapper]}>
          <View style={[styles.abilitiesStar, { borderColor: color }]} />
        </View>
      );
    case 'evolution':
      return (
        <View style={[sharedStyle, styles.evolutionWrapper]}>
          <View style={[styles.evolutionArrowLeft, { backgroundColor: color }]} />
          <View style={[styles.evolutionArrowRight, { backgroundColor: color }]} />
        </View>
      );
    case 'social':
      return (
        <View style={[sharedStyle, styles.socialWrapper]}>
          <View style={[styles.socialCircle1, { borderColor: color }]} />
          <View style={[styles.socialCircle2, { borderColor: color }]} />
          <View style={[styles.socialCircle3, { borderColor: color }]} />
        </View>
      );
    case 'profile':
      return (
        <View style={[sharedStyle, styles.profileWrapper]}>
          <View style={[styles.profileHead, { borderColor: color }]} />
          <View style={[styles.profileBody, { borderColor: color }]} />
        </View>
      );
    case 'search':
      return (
        <View style={[sharedStyle, styles.searchWrapper]}>
          <View 
            style={[
              styles.searchCircle, 
              { 
                borderColor: color,
                width: size * 0.65,
                height: size * 0.65,
              }
            ]} 
          />
          <View 
            style={[
              styles.searchHandle, 
              { 
                backgroundColor: color,
                width: size * 0.2,
                height: size * 0.4,
              }
            ]} 
          />
        </View>
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  terminal: {
    borderWidth: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  capture: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  captureLens: {
    borderWidth: 2,
    borderRadius: 999,
  },
  captureFlash: {
    position: 'absolute',
    top: 2,
    right: 4,
    borderRadius: 999,
  },
  mapWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDiamond: {
    width: '70%',
    height: '70%',
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  mapDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eyeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeShape: {
    width: '90%',
    height: '50%',
    borderWidth: 2,
    borderRadius: 999,
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
  },
  ownedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkStem: {
    width: 3,
    height: '60%',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    bottom: 4,
  },
  checkArm: {
    width: 3,
    height: '40%',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    bottom: 2,
    right: 6,
  },
  regionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionRing: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderRadius: 999,
  },
  regionNorth: {
    position: 'absolute',
    width: 2,
    height: '70%',
    borderRadius: 1,
  },
  regionEast: {
    position: 'absolute',
    height: 2,
    width: '70%',
    borderRadius: 1,
  },
  locationWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  locationPin: {
    width: '40%',
    height: '50%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  locationBase: {
    width: 4,
    height: 4,
    borderWidth: 2,
    borderRadius: 2,
    marginTop: -2,
  },
  abilitiesWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilitiesStar: {
    width: '70%',
    height: '70%',
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  evolutionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  evolutionArrowLeft: {
    width: '30%',
    height: 2,
    borderRadius: 1,
  },
  evolutionArrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  socialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialCircle1: {
    position: 'absolute',
    width: '40%',
    height: '40%',
    borderWidth: 2,
    borderRadius: 999,
    top: 2,
  },
  socialCircle2: {
    position: 'absolute',
    width: '40%',
    height: '40%',
    borderWidth: 2,
    borderRadius: 999,
    bottom: 2,
    left: 2,
  },
  socialCircle3: {
    position: 'absolute',
    width: '40%',
    height: '40%',
    borderWidth: 2,
    borderRadius: 999,
    bottom: 2,
    right: 2,
  },
  profileWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHead: {
    width: '35%',
    height: '35%',
    borderWidth: 2,
    borderRadius: 999,
    position: 'absolute',
    top: 3,
  },
  profileBody: {
    width: '70%',
    height: '40%',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    position: 'absolute',
    bottom: 2,
  },
  searchWrapper: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  searchCircle: {
    borderWidth: 2,
    borderRadius: 999,
  },
  searchHandle: {
    borderRadius: 1,
    position: 'absolute',
    bottom: 1,
    right: 1,
    transform: [{ rotate: '45deg' }],
  },
});

export default memo(ConsoleIcon);


