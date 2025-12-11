import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native';
import GridPattern from './GridPattern';
import { colors } from '../theme/colors';

type LoadingScreenProps = {
  message?: string;
};

const LoadingScreen = ({ message = 'Loading' }: LoadingScreenProps) => {
  return (
    <View style={styles.container}>
      <GridPattern
        style={styles.grid}
        gap={18}
        opacity={0.16}
        rows={60}
        columns={32}
        lineColor={colors.consoleAccent}
        thickness={0.8}
      />
      <View style={styles.content}>
        <Image
          source={require('../../pokelogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.consoleAccent} style={styles.spinner} />
        <Text style={styles.message}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 1,
  },
  logo: {
    width: 250,
    height: 75,
    maxWidth: '80%',
    marginBottom: 8,
  },
  spinner: {
    marginVertical: 8,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;

