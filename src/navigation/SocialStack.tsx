import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import SocialScreen from '../screens/SocialScreen';

export type SocialStackParamList = {
  SocialHome: undefined;
};

const Stack = createStackNavigator<SocialStackParamList>();

const SocialStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome" component={SocialScreen} />
    </Stack.Navigator>
  );
};

export default memo(SocialStack);

