import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import HabitatScreen from '../screens/HabitatScreen';

export type HabitatStackParamList = {
  HabitatHome: undefined;
};

const Stack = createStackNavigator<HabitatStackParamList>();

const HabitatStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HabitatHome" component={HabitatScreen} />
    </Stack.Navigator>
  );
};

export default memo(HabitatStack);





