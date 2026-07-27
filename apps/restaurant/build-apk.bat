@echo off
setlocal enabledelayedexpansion

set JAVA_HOME=%USERPROFILE%\java\jdk-17.0.13+11
set ANDROID_HOME=%USERPROFILE%\android-sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%
set EXPO_NO_METRO_WORKSPACE_ROOT=1

cd android
call gradlew --no-daemon assembleRelease
