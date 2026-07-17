# Mobile App Build Guide (APK / IPA)

Build instructions for SmartFood mobile apps — Admin, Customer, Restaurant.

## Prerequisites

| Tool | Purpose |
|------|---------|
| Node.js >= 20 | Runtime |
| npm >= 10 | Package manager |
| EAS CLI | Expo build service |
| Expo account | Build management |
| Android keystore | APK signing (auto-managed by EAS) |
| Apple Developer account | IPA signing ($99/year) |

## 1. EAS Setup (One Time)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify
eas whoami
```

## 2. Build Profiles (eas.json)

Each app has 3 build profiles:

| Profile | Use Case | Output |
|---------|----------|--------|
| `development` | Local dev with Expo Go | Dev client |
| `preview` | Internal testing (APK) | Signed APK |
| `production` | Store submission (APK/IPA) | APK + IPA |

## 3. Building APK (Android)

### Development Build
```bash
cd admin   # or customer, restaurant
eas build --platform android --profile development
```

### Preview APK (Internal Testing)
```bash
eas build --platform android --profile preview
```
Downloads as `.apk` — install directly on any Android device.

### Production APK (Play Store)
```bash
eas build --platform android --profile production
```
Output: `.aab` (Android App Bundle) for Play Store, or `.apk` (configurable).

### Local Build (No EAS)
```bash
# Requires Android SDK installed
npx expo run:android
```

## 4. Building IPA (iOS)

IPA build requires **Apple Developer Program** membership.

```bash
# Production IPA
eas build --platform ios --profile production

# Internal testing (TestFlight)
eas build --platform ios --profile preview
```

### Local Build (No EAS, macOS only)
```bash
# Requires Xcode installed
npx expo run:ios
```

## 5. Submitting to Stores

### Google Play Store
```bash
eas submit --platform android --profile production
```

### Apple App Store
```bash
eas submit --platform ios --profile production
```

## 6. App Identifiers

| App | Android Package | iOS Bundle ID | Expo Slug |
|-----|----------------|---------------|-----------|
| **Admin** | `com.smartfood.admin` | `com.smartfood.admin` | `smartfood-admin` |
| **Customer** | `com.smartfood.customer` | `com.smartfood.customer` | `smartfood-customer` |
| **Restaurant** | `com.smartfood.restaurant` | `com.smartfood.restaurant` | `smartfood-restaurant` |

## 7. Credential Management

EAS manages signing credentials automatically. To check status:

```bash
eas credentials --platform android
eas credentials --platform ios
```

For custom keystores, use:

```bash
eas build:resign
```

## 8. Full CI/CD Pipeline

Each app repo has `.github/workflows/ci.yml` for lint + typecheck.

To add automated EAS builds in CI, extend the workflow:

```yaml
- name: Build with EAS
  run: eas build --platform android --profile preview --non-interactive
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

Generate `EXPO_TOKEN` from [Expo Settings](https://expo.dev/settings/access-tokens).

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| `EAS token not found` | Run `eas login` or set `EXPO_TOKEN` env |
| `Android SDK not found` | Install Android Studio, set `ANDROID_HOME` |
| `Bundle identifier mismatch` | Check `app.json` ios.bundleIdentifier |
| `Code signing error` | Run `eas build:resign` or check Apple Developer |
| `Build timeout` | EAS free tier: 60min limit. Upgrade if needed |
