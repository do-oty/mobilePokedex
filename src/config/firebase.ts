import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase is initialized automatically if google-services.json is present
// Make sure to add your google-services.json file to android/app/
// and GoogleService-Info.plist to ios/

// Note: Deprecation warnings are expected with React Native Firebase v23
// They will be resolved in future versions. The app works correctly.
export { auth, firestore };

