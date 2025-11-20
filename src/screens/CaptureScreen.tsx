import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ConsoleIcon from '../components/icons/ConsoleIcon';
import { colors } from '../theme/colors';

const CaptureScreen = () => {
  return (
    <View style={styles.container}>
      <ConsoleIcon variant="capture" size={68} color={colors.consoleAccent} />
      <Text style={styles.title}>Capture Interface</Text>
      <Text style={styles.body}>AR capture suite pending implementation.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
});

export default memo(CaptureScreen);

