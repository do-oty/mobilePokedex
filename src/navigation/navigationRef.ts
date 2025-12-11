import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const navigateRoot = (name: string, params?: Record<string, any>) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
};






