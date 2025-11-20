import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { BackHandler, StatusBar, ToastAndroid } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { RegionProvider } from './src/context/RegionContext';
import { colors } from './src/theme/colors';

function App(): JSX.Element {
  const backPressCount = useRef(0);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backPressCount.current === 1) {
        // Second press - exit app
        BackHandler.exitApp();
        return true;
      }

      // First press - show toast
      backPressCount.current = 1;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

      // Reset counter after 2 seconds
      setTimeout(() => {
        backPressCount.current = 0;
      }, 2000);

      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <RegionProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <BottomTabNavigator />
        </NavigationContainer>
      </RegionProvider>
    </SafeAreaProvider>
  );
}

export default App;
