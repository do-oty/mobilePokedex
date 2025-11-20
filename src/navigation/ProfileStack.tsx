import { createStackNavigator } from '@react-navigation/stack';
import { memo } from 'react';

import ProfileScreen from '../screens/ProfileScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default memo(ProfileStack);

