import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import CaptureScreen from '../screens/CaptureScreen';

export type CaptureStackParamList = {
  CaptureHome: undefined;
};

const Stack = createStackNavigator<CaptureStackParamList>();

const CaptureStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CaptureHome" component={CaptureScreen} />
    </Stack.Navigator>
  );
};

export default memo(CaptureStack);

