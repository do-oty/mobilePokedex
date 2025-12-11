# ViroReact Setup Instructions

ViroReact has been installed, but it requires native setup to work properly. Here are two options:

## Option 1: Use ViroReact (Requires Native Setup)

ViroReact requires extensive native configuration. The component `HabitatARScene.tsx` has been created, but you need to:

1. **Link Native Modules** (if not auto-linked):
   ```bash
   cd android && ./gradlew clean
   cd ios && pod install
   ```

2. **Android Setup**:
   - Add ARCore dependency to `android/app/build.gradle`
   - Configure ARCore in `AndroidManifest.xml`
   - See: https://docs.viro.com/docs/viro-react-android-setup

3. **iOS Setup**:
   - Configure ARKit in `Info.plist`
   - See: https://docs.viro.com/docs/viro-react-ios-setup

**Note**: ViroReact is deprecated. Consider using `@reactvision/react-viro` instead (requires Expo).

## Option 2: Use Enhanced Sensor-Based AR (Current Implementation)

The current implementation uses `react-native-sensors` for better orientation tracking:
- **Magnetometer**: For accurate heading/compass
- **Gyroscope**: For pitch/roll (3D effects)

This provides proper 360° AR anchoring without requiring native AR setup.

The anchoring logic has been improved to:
- Use magnetometer for more accurate heading
- Use gyroscope for pitch/roll effects
- Properly anchor Pokémon in world space

## Testing

1. Test the current sensor-based implementation first
2. If anchoring still doesn't work, we can debug the sensor data
3. If you want true AR (plane detection, etc.), proceed with ViroReact native setup


