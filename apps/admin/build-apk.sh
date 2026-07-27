#!/usr/bin/env bash
set -e

export JAVA_HOME="$HOME/java/jdk-17.0.13+11"
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$HOME/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

cd "$(dirname "$0")"

echo "=== Step 1: Prebuild (if needed) ==="
if [ ! -d "android" ]; then
  npx expo prebuild --platform android
fi

echo "=== Step 2: Build APK ==="
cd android
export EXPO_NO_METRO_WORKSPACE_ROOT=1
./gradlew assembleRelease

echo "=== Done ==="
echo "APK at: $(pwd)/app/build/outputs/apk/release/app-release.apk"
