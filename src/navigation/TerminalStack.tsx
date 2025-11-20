import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import TerminalScreen from '../screens/TerminalScreen';

export type TerminalStackParamList = {
  TerminalHome: undefined;
};

const Stack = createStackNavigator<TerminalStackParamList>();

const TerminalStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TerminalHome" component={TerminalScreen} />
    </Stack.Navigator>
  );
};

export default memo(TerminalStack);

