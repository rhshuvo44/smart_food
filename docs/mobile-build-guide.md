# Mobile Build Guide

Build the SmartFood mobile apps (Customer, Restaurant, Admin) for Android and iOS.

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Expo account](https://expo.dev/signup) | Required for EAS Build |
| EAS CLI (`npm install -g eas-cli`) | EAS Build commands |
| **Android only:** Java 17+, Android Studio | Local builds |
| **iOS only:** macOS, Xcode 15+ | Local builds |

---

## 1. Configure EAS Build

Create `eas.json` in each app directory (`apps/customer/`, `apps/restaurant/`, `apps/admin/`):

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "android": {
      "platform": "android",
      "distribution": "internal"
    },
    "ios": {
      "platform": "ios",
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

Profiles:
- **development** — Expo Go compatible dev client
- **android** — standalone APK/AAB (for sideloading or testing)
- **ios** — standalone IPA (internal distribution via TestFlight or sideload)
- **production** — store-ready signed build

## 2. Authenticate

```bash
eas login
# Opens browser — log in with your Expo account
```

Verify:
```bash
eas whoami
```

## 3. Build Matrix

Each app must be built separately. Set `EXPO_PUBLIC_API_URL` to point to your backend.

### Customer App

```bash
cd apps/customer

# Android
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform android --profile android

# iOS
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform ios --profile ios
```

### Restaurant App

```bash
cd apps/restaurant

# Android
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform android --profile android

# iOS
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform ios --profile ios
```

### Admin App

```bash
cd apps/admin

# Android
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform android --profile android

# iOS
EXPO_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1 \
  eas build --platform ios --profile ios
```

Build output: EAS gives you a download link for the APK/AAB (Android) or IPA (iOS).

## 4. Local Builds (No EAS Cloud)

Alternative to EAS — build directly on your machine.

### Android

```bash
cd apps/customer  # or restaurant, admin

# Development build (installs on device/emulator)
npx expo run:android

# Production APK
npx expo run:android --variant release
```

Requires Android Studio with Android SDK API 34+ and a configured emulator or connected device.

### iOS

```bash
cd apps/customer  # or restaurant, admin

# Development build (opens Xcode)
npx expo run:ios

# Production build
npx expo run:ios --configuration Release
```

Requires macOS with Xcode 15+.

## 5. Install Builds on Device

### Android APK

```bash
# Using adb (Android Debug Bridge)
adb install app-release.apk

# Or: transfer the APK to the device and open it
```

### Android AAB (for testing)

```bash
# Convert AAB to APK for direct install
java -jar bundletool-all.jar build-apks \
  --bundle=app-release.aab \
  --output=app-release.apks \
  --mode=universal

# Extract and install
unzip app-release.apks -d apks
adb install apks/universal.apk
```

### iOS IPA (development)

- Open Xcode → **Window** → **Devices and Simulators**
- Drag the IPA onto the device in the list
- Or use `xcrun`:
  ```bash
  xcrun devicectl install device --path app.ipa
  ```

Development IPAs from EAS with `"distribution": "internal"` can be installed via the **Expo Go** app or by emailing the install link to your Apple ID.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `EXPO_PUBLIC_API_URL` not working | Only available at build time — set before `eas build`, not at runtime |
| EAS Build fails on `@smartfood/shared` | The Dockerfile / build process must resolve workspace dependencies — use the monorepo Dockerfile or ensure `npm run build --workspace=shared` runs first |
| Android `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall existing app first: `adb uninstall com.smartfood.customer` |
| iOS code signing error | Ensure you have an Apple Developer account and the signing certificate is installed in Keychain Access |
| Build too large | Check `app.json` for unnecessary plugins; run `expo optimize` for assets |
| Metro bundler crash | `npx expo start -c` to clear cache |
| `eas build` not found | `npm install -g eas-cli` |
