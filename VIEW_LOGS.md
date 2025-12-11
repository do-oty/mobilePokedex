# How to View Console Logs in React Native

## Method 1: Metro Bundler Terminal (Easiest)
The console logs appear in the terminal where you ran `npm start` or `npm run android`.

**Look for:**
- `console.log()` messages
- `console.error()` messages
- Firebase operation logs

## Method 2: React Native Debugger
1. Shake your device/emulator (or press `Ctrl+M` / `Cmd+M`)
2. Select "Open Debugger" or "Debug"
3. This opens Chrome DevTools
4. Go to the "Console" tab

## Method 3: Android Logcat (Terminal)
```bash
# View all logs
adb logcat

# Filter for React Native logs only
adb logcat | grep -i "ReactNativeJS"

# Filter for your app's logs
adb logcat | grep -i "PokeExplorer"
```

## Method 4: VS Code / IDE Console
If you're using VS Code with React Native extensions, logs may appear in the integrated terminal or output panel.

## What to Look For
When testing Firebase:
- ✅ Success messages: "User document created successfully!"
- ❌ Error messages: "Error updating seen Pokemon in Firestore"
- Error codes: `permission-denied`, `not-found`, etc.

## Quick Test
Add this to any component to test logging:
```javascript
console.log('Test log message');
```
You should see it in your Metro terminal immediately.




