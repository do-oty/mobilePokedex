# Pokémon Explorer - Mobile Pokédex App

A React Native mobile application for exploring and tracking Pokémon across different regions with AR capture features.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **React Native CLI**: `npm install -g react-native-cli`
- **Git**

### For Android Development:
- **Android Studio** with Android SDK
- **Java Development Kit (JDK 17)**
- Set up `ANDROID_HOME` environment variable
- Add Android SDK platform-tools to PATH

### For iOS Development (macOS only):
- **Xcode** (latest version)
- **CocoaPods**: `sudo gem install cocoapods`

## Setting Up Android Emulator

If you don't have a physical Android device, you'll need to set up an Android emulator:

### 1. Install Android Studio
Download and install from [developer.android.com](https://developer.android.com/studio)

### 2. Install SDK and Tools
Open Android Studio → **More Actions** → **SDK Manager**:
- **SDK Platforms**: Install Android 13.0 (API 33) or higher
- **SDK Tools**: Check these are installed:
  - Android SDK Build-Tools
  - Android Emulator
  - Android SDK Platform-Tools

### 3. Create a Virtual Device (AVD)
1. Open Android Studio → **More Actions** → **Virtual Device Manager**
2. Click **Create Device**
3. Choose a phone (e.g., "Pixel 5" or "Medium Phone")
4. Select a system image (API 33+ recommended)
5. Click **Finish**

### 4. Start the Emulator

**From Android Studio:**
- Open Virtual Device Manager → Click ▶️ Play button

**From Command Line:**
```bash
# List available emulators
emulator -list-avds

# Start emulator (replace with your AVD name)
emulator -avd Pixel_5_API_33
```

### System Requirements for Emulator:
- **CPU**: x86_64 with virtualization support (Intel VT-x or AMD-V)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **GPU**: Hardware acceleration enabled (automatically uses your system GPU)
  - AMD/NVIDIA GPUs work great
  - Intel integrated graphics also supported

**Note**: The emulator uses hardware acceleration, so it runs smoothly even on laptops with integrated graphics.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/do-oty/mobilePokedex.git
cd mobilePokedex
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Run the App

#### Android:

Make sure you have either:
- An Android emulator running, OR
- A physical Android device connected via USB with USB debugging enabled

Then run:

```bash
# Start Metro bundler (in one terminal)
npm start

# Run on Android (in another terminal)
npm run android
# or
npx react-native run-android
```

#### iOS (macOS only):

```bash
# Start Metro bundler (in one terminal)
npm start

# Run on iOS (in another terminal)
npm run ios
# or
npx react-native run-ios
```

## Development Mode

When running in development mode:
- The app connects to Metro bundler on your computer (port 8081)
- You can shake the device (or press Cmd+D/Ctrl+M) to open the developer menu
- Hot reloading is enabled for faster development
- **Physical device**: Must be connected via USB OR on the same WiFi network as your computer

### For Physical Android Device (USB):

1. Enable USB debugging on your device
2. Connect via USB
3. Run: `adb devices` to verify connection
4. Run: `adb reverse tcp:8081 tcp:8081` (to forward Metro port)
5. Then run: `npm run android`

### For Physical Android Device (WiFi):

1. Connect your phone and computer to the same WiFi
2. Shake the device to open dev menu
3. Go to "Settings" → "Debug server host & port for device"
4. Enter: `YOUR_COMPUTER_IP:8081` (e.g., `192.168.1.100:8081`)
5. Go back and tap "Reload"

## Project Structure

```
pokedexMobdev/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Main screen components
│   ├── navigation/       # React Navigation setup
│   ├── context/          # React Context providers
│   ├── styles/           # Theme and styling
│   └── utils/            # Helper functions
├── android/              # Android native code
├── ios/                  # iOS native code
├── App.tsx               # Root component
└── package.json          # Dependencies
```

## Key Features

- **Five-Screen Navigation**: Terminal (Pokédex), Capture, Map, Social, Profile
- **Region Selection**: Choose from different Pokémon regions
- **Advanced Filtering**: Filter by status, type, difficulty, generation
- **Real-time Search**: Search Pokémon by name or number
- **Type-based UI**: Dynamic gradients based on Pokémon types
- **Modern UX**: Haptic feedback, animations, pull-to-refresh

## Troubleshooting

### Metro bundler not connecting
```bash
# Kill any existing Metro processes
pkill -f "react-native"
# Clear cache and restart
npm start -- --reset-cache
```

### "Unable to load script" error
```bash
# For USB connected device
adb reverse tcp:8081 tcp:8081
# Then reload the app
```

### Build errors after pulling latest code
```bash
# Clean and reinstall everything
rm -rf node_modules
npm install

# Android
cd android && ./gradlew clean && cd ..

# iOS (macOS only)
cd ios && pod install && cd ..
```

### Module not found errors
```bash
# Reset Metro cache
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Emulator not detected
```bash
# Check if emulator is running
adb devices

# If no devices show up:
# 1. Make sure emulator is fully booted (wait for home screen)
# 2. Restart adb server
adb kill-server
adb start-server
adb devices
```

### Emulator runs but app won't install
```bash
# Clean the Android build
cd android
./gradlew clean
cd ..

# Then try running again
npm run android
```

## Building for Production

### Android Release APK (standalone, no computer needed):

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

You can install this APK on any Android device and it will work without needing a computer connection.

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **React Navigation** - Navigation and routing
- **TypeScript** - Type safety
- **PokeAPI** - Pokémon data source
- **React Native Vector Icons** - Icon library
- **React Native Linear Gradient** - Gradient backgrounds
- **React Native Gesture Handler** - Gesture support
- **React Native Haptic Feedback** - Tactile feedback

## Contributing

1. Create a feature branch: `git checkout -b feature-name`
2. Make your changes
3. Test thoroughly on both Android and iOS (if possible)
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature-name`
6. Create a Pull Request

## License

This project is for educational purposes.

## Need Help?

Check [PROGRESS.md](./PROGRESS.md) for current development status and known issues.
