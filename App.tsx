import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StatusBar, ToastAndroid, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import cache test utilities (makes functions available globally for debugging)
import './src/utils/testCache';

import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import CaptureStack from './src/navigation/CaptureStack';
import { navigationRef } from './src/navigation/navigationRef';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/components/LoadingScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { RegionProvider } from './src/context/RegionContext';
import { PokemonProvider, usePokemon } from './src/context/PokemonContext';
import { colors } from './src/theme/colors';

type RootStackParamList = {
  MainTabs: undefined;
  CaptureModal: {
    screen: 'CaptureHome';
    params: Record<string, any>;
  };
};

const RootStack = createStackNavigator<RootStackParamList>();

function AppContentInner(): JSX.Element {
  const { userData, loading: userLoading } = useUser();
  const { initialLoading: pokemonInitialLoading } = usePokemon();
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

  // Show loading screen while initial data is loading
  // Wait for both user data AND Pokemon initial loading to complete
  const isInitialLoading = userLoading || pokemonInitialLoading;

  if (isInitialLoading) {
    return <LoadingScreen message="Loading" />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={BottomTabNavigator} />
        <RootStack.Screen
          name="CaptureModal"
          component={CaptureStack}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function AppContent(): JSX.Element {
  const { user, loading } = useAuth();
  const backPressCount = useRef(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const prevUserRef = useRef(user);

  useEffect(() => {
    // Track logout transition
    if (prevUserRef.current && !user) {
      // User was logged in, now logged out - show loading during transition
      setIsLoggingOut(true);
      // Hide loading after a brief delay to allow cleanup
      const timer = setTimeout(() => {
        setIsLoggingOut(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    prevUserRef.current = user;
  }, [user]);

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

  if (loading || isLoggingOut) {
    return <LoadingScreen message="Loading" />;
  }

  return (
    <SafeAreaProvider>
      {user ? (
        <UserProvider>
          <RegionProvider>
            <PokemonProvider>
              <AppContentInner />
            </PokemonProvider>
          </RegionProvider>
        </UserProvider>
      ) : (
        <LoginScreen />
      )}
    </SafeAreaProvider>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
