# MOQ Automation App Build Instructions

This guide explains how to build the MOQ Automation app for iOS (IPA) and Android (APK).

## Prerequisites

1. Make sure you have the following installed:
   - Node.js (v14 or later)
   - npm or yarn
   - Expo CLI (`npm install -g expo-cli`)
   - EAS CLI (`npm install -g eas-cli`)
   - An Expo account (create one at https://expo.dev/signup)

2. Log in to your Expo account in the terminal:
   ```
   eas login
   ```

## Setting up Your Project for Builds

### Step 1: Configure eas.json

Create a file called `eas.json` in the root of your project with the following content:

```json
{
  "cli": {
    "version": ">= 3.13.3"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    },
    "androidapk": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 2: Configure app.json

Update your `app.json` with proper app information:

```json
{
  "expo": {
    "name": "MOQ Automation",
    "slug": "moq-automation",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.moqautomation"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.yourcompany.moqautomation"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

Replace `com.yourcompany.moqautomation` with your actual bundle ID/package name.

## Building for Android (APK)

### Using EAS Build (Recommended)

1. Configure for Android build:
   ```
   eas build:configure --platform android
   ```

2. Build APK for internal testing:
   ```
   eas build -p android --profile preview
   ```

3. Build production-ready APK:
   ```
   eas build -p android --profile androidapk
   ```

4. After the build completes (it may take 15-30 minutes), you can download the APK:
   ```
   eas build:list
   ```
   
   Click on the URL to download the build.

### Local Build (Alternative)

To build locally (requires Android Studio):

1. Generate native code:
   ```
   npx expo prebuild -p android
   ```

2. Navigate to the Android directory:
   ```
   cd android
   ```

3. Build debug APK:
   ```
   ./gradlew assembleDebug
   ```
   
   Or build release APK:
   ```
   ./gradlew assembleRelease
   ```

4. Find your APK in:
   - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `android/app/build/outputs/apk/release/app-release.apk`

## Building for iOS (IPA)

### Using EAS Build (Recommended)

> **Note**: iOS builds require an Apple Developer account and valid certificates.

1. Configure for iOS build:
   ```
   eas build:configure --platform ios
   ```

2. Build IPA for internal testing:
   ```
   eas build -p ios --profile preview
   ```

3. Build production IPA:
   ```
   eas build -p ios --profile production
   ```

4. After the build completes, you can download the IPA:
   ```
   eas build:list
   ```

### Local Build (Alternative - Mac Only)

To build locally (requires Xcode and a Mac):

1. Generate native code:
   ```
   npx expo prebuild -p ios
   ```

2. Open the Xcode workspace:
   ```
   open ios/MOQAutomation.xcworkspace
   ```

3. In Xcode:
   - Select the appropriate team/signing certificate
   - Choose a device or simulator
   - Build the app (Product > Build)
   - Archive for distribution (Product > Archive)

## Troubleshooting

### Common Issues

1. **Build failures on EAS**:
   - Check the build logs for specific errors
   - Make sure you have the correct configurations in app.json
   - Verify your package.json dependencies are compatible

2. **Timeout Issues**:
   - Some APIs might be timing out - check your API configurations
   - Make sure your backend is accessible from the build servers

3. **Certificate Issues (iOS)**:
   - Make sure you have a valid Apple Developer account
   - Configure signing certificates correctly

### Additional Resources

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Guide](https://docs.expo.dev/build/setup/)
- [Android Publishing Guide](https://docs.expo.dev/distribution/app-stores/)
- [iOS Publishing Guide](https://docs.expo.dev/distribution/app-stores/) 