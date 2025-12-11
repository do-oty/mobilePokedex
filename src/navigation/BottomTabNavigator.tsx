import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { memo } from 'react';

import CustomTabBar from '../components/CustomTabBar';
import MapStack from './MapStack';
import ProfileStack from './ProfileStack';
import SocialStack from './SocialStack';
import TerminalStack from './TerminalStack';
import HabitatStack from './HabitatStack';

export type RootTabParamList = {
  Terminal: undefined;
  Habitat: undefined;
  Map: undefined;
  Social: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Terminal" component={TerminalStack} />
      <Tab.Screen name="Habitat" component={HabitatStack} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Social" component={SocialStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default memo(BottomTabNavigator);

