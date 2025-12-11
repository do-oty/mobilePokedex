# Firebase Setup Instructions

This app uses Firebase for authentication and cloud storage. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Add Android App to Firebase

1. In Firebase Console, click the Android icon (or "Add app")
2. Register your app:
   - **Package name**: `com.pokeexplorer` (must match `android/app/build.gradle`)
   - **App nickname**: PokeExplorer (optional)
   - **Debug signing certificate SHA-1**: (optional for now)
3. Download `google-services.json`
4. Place `google-services.json` in `android/app/`

## 3. Add iOS App to Firebase (if developing for iOS)

1. In Firebase Console, click the iOS icon
2. Register your app:
   - **Bundle ID**: `com.pokeexplorer` (must match your iOS bundle ID)
   - **App nickname**: PokeExplorer (optional)
3. Download `GoogleService-Info.plist`
4. Place `GoogleService-Info.plist` in `ios/PokeExplorer/`

## 4. Enable Firebase Services

### Authentication
1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method

### Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location (closest to your users)

## 5. Firestore Security Rules (Development)

For development, use these rules. **Update for production!**

Copy the rules from `firestore-rules.txt` or use these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Social feed collections - anyone authenticated can read, but only write their own
    match /captures/{captureId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /seen/{seenId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Important:** After updating rules in Firebase Console, click **"Publish"** to apply them!

## 6. Rebuild the App

After adding the configuration files:

```bash
# Android
cd android
./gradlew clean
cd ..
npm run android

# iOS (macOS only)
cd ios
pod install
cd ..
npm run ios
```

## 7. Test Authentication

1. Run the app
2. You should see the login screen
3. Create an account or sign in
4. Your user data will be stored in Firestore under `users/{userId}`

## Data Structure

### User Document (`users/{userId}`)
```typescript
{
  xp: number;
  caughtPokemon: string[];      // Array of Pokemon IDs
  seenPokemon: string[];         // Array of Pokemon IDs
  currentStreak: number;
  lastActiveDate: string;        // ISO date string
  selectedRegion: number;        // Region ID (1-8)
  achievements: string[];        // Array of achievement IDs
}
```

## Troubleshooting

### "Firebase not initialized" error
- Make sure `google-services.json` is in `android/app/`
- Rebuild the app after adding the file

### Authentication not working
- Check that Email/Password is enabled in Firebase Console
- Verify your `google-services.json` is correct

### Firestore permission denied
- Check your Firestore security rules
- Make sure the user is authenticated

## Production Checklist

Before releasing:
- [ ] Update Firestore security rules for production
- [ ] Enable Firebase App Check
- [ ] Set up proper error monitoring
- [ ] Configure Firebase Analytics (optional)
- [ ] Set up backup and recovery procedures

