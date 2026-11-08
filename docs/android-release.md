# Android build and release

Gloop Pop's Android app wraps the same Vite client in Capacitor. The web build remains configured for GitHub Pages at `/gloop-pop/`; Android uses a separate Vite invocation with `--base=/` so local app assets resolve from the WebView root.

## Requirements

- Node.js 22 or newer and npm.
- Android Studio Otter 2025.2.1 or newer, with Android SDK Platform 36 installed.
- A device or emulator running Android 7.0 (API 24) or newer for runtime testing.

Capacitor core, Android and CLI are pinned to 8.6.0; the App plugin is 8.1.2. Capacitor 8 targets Android API 36 and requires Android Studio 2025.2.1 or newer. The generated project has `minSdkVersion = 24`. Android Studio supplies the required JDK; use its bundled runtime if building Gradle from a terminal. See the [Capacitor environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup) and [Capacitor 8 Android upgrade notes](https://capacitorjs.com/docs/updating/8-0).

## Build and open

```sh
npm ci
npm run build:android
npm run open:android
```

`build:android` runs `vite build --base=/` and then `cap sync android`, copying the web bundle into the native project. Synced web assets and Capacitor-generated files under `android/app/src/main/assets/` are ignored by Git and recreated by this command. `open:android` opens the project in Android Studio. From Android Studio, select a device or emulator and run the `app` configuration.

For command-line builds on macOS or Linux:

```sh
npm run android:debug
npm run android:bundle
```

Both commands rebuild and sync the web assets first. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The release Android App Bundle is written to `android/app/build/outputs/bundle/release/app-release.aab`.

## App configuration

The application ID is `io.github.aieatassam.glooppop`; changing it after publishing creates a different Android app. Phones run in portrait. Android 16 ignores the portrait lock on large screens (≥600 dp) for apps targeting API 36, so tablets and foldables may run in landscape and use the web build's wide layout (SG §15.2). The Android launcher icons and splash screen use the existing generated `public/icon-*.png` assets and the midnight theme background. Immersive mode hides the status and navigation bars; a swipe reveals them temporarily. The window draws behind display cutouts, while the web layout applies CSS safe-area insets to controls.

The manifest declares `INTERNET` (Capacitor template, WebView) and `VIBRATE` (haptics through `navigator.vibrate`); both are normal permissions with no prompt. The game itself makes no network requests. Predictive back is enabled. Auto Backup includes the WebView storage that holds saves (`res/xml/data_extraction_rules.xml`, `backup_rules.xml`), so progress survives a reinstall or a new phone.

Sharing and links use a small local plugin, `GloopSharePlugin.java` (`GloopShare`: `shareImage`, `shareText`, `openUrl`), because Android WebView has no `navigator.share` and ignores `<a download>` and `target=_blank`. Share images go to `cache/share/` and out through the app's `FileProvider`. The web build is unchanged; native paths are chosen by `isNativeRuntime()` in `src/platform/native.ts`. The Android wrapper packages the web version only; it does not add native billing, ads, analytics or cloud saves. Saves stay in this app install's local storage and do not sync with web/PWA saves.

## Manual device regression

Before release, install a debug build on a physical Android device and an emulator. Cover at least API 24 and API 36, plus a device or emulator with a display cutout.

- Confirm the branded splash and launcher icon appear, the game opens in portrait, and rotating the device does not switch to landscape.
- Confirm status and navigation bars hide on launch and return transiently after a swipe. Check that top and bottom controls remain tappable and clear of the cutout and gesture areas.
- Drag and place a piece, clear a line, open and dismiss each main panel, and check the system Back action closes the current panel or returns from nested screens; from Home, it exits the app.
- Reopen the app and confirm the in-progress run and settings persist. Confirm saves remain available offline.
- Build a production bundle and confirm `?debug=1` does not expose developer scenes or overlays. Inspect Android Studio Logcat for startup exceptions.

These checks require Android Studio/device access and are not covered by `npm run check`.

## Play Console submission checklist

- [ ] Set a unique Play listing name, short and full descriptions, category, contact details, privacy policy URL if required, screenshots and feature graphic.
- [ ] Upload a signed release AAB under `android/app/build/outputs/bundle/release/app-release.aab`; keep the upload key and passwords outside the repository. CI builds it signed (see below); a local `android:bundle` without the signing env vars stays unsigned.
- [ ] Set a new `versionCode` for every upload and verify the `versionName` users will see.
- [ ] Confirm the target SDK is API 36. Google Play currently requires API 36 or higher for new apps and updates; check the [current target API policy](https://support.google.com/googleplay/android-developer/answer/11926878) before each submission.
- [ ] Complete the app access, ads, content rating, target audience, data safety and permissions declarations to match the shipped build. The game has no accounts, ads, analytics or remote game service; review Android backup behavior and the privacy policy before completing Data safety.
- [ ] Test the uploaded bundle in an internal testing track, including installation, startup, system Back, saves and portrait/fullscreen behavior.
- [ ] If the developer account is subject to Google's new personal account rules, complete the required closed test before applying for production access. Check the [current testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
- [ ] Review the release in Play Console and submit it only when all device tests and declarations are complete.

## Versioning

Versions are date based: `versionName` = `YYYY.MM.DD.N` (UTC date, `N` from 1 for the first release that day), `versionCode` = `YYYYMMDD × 100 + N` (e.g. `2026.11.08.1` → `2026110801`). Gradle reads them from `-PversionName` and `-PversionCode`; local builds default to `0.0.0-dev` / `1`.

## CI builds (`.github/workflows/android.yml`)

- **Pull requests:** unsigned debug APK as a workflow artifact. No secrets used.
- **Release:** run the workflow manually (Actions → Android → Run workflow). It picks the next `N` for today, builds a signed AAB and APK, verifies the signatures, uploads them as an artifact, pushes tag `v<version>` and creates a GitHub Release with both files. Pushing a tag `vYYYY.MM.DD.N` yourself does the same for that version.
- Upload the `.aab` to Play Console. The `.apk` is for side-loading and testing.

## Release signing

The upload key is a PKCS12 keystore (alias `upload`, store and key password identical). CI reads it from repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`, decodes it to the runner's temp dir and deletes it after the build. Gradle signs `release` only when `ANDROID_KEYSTORE_PATH` points at an existing file. Enroll in Play App Signing on first upload so Google holds the app signing key; the upload key can then be reset through Play support if lost.

To sign locally, export the same four values (`ANDROID_KEYSTORE_PATH` instead of the base64) and run `npm run android:bundle`. Do not commit the keystore, passwords, or `android/local.properties`; the Android ignore file excludes `*.jks`, `*.keystore` and local SDK settings.

## Store listing

Listing copy, content declarations, graphics and screenshots are in `play-store/` (`play-store/listing.md`). The privacy policy page is `public/privacy.html`, published with the web build.
