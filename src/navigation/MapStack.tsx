import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import MapScreen from '../screens/MapScreen';

export type MapStackParamList = {
  MapHome: undefined;
};

const Stack = createStackNavigator<MapStackParamList>();

const MapStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapHome" component={MapScreen} />
    </Stack.Navigator>
  );
};

export default memo(MapStack);

