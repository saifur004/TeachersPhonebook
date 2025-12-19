# Upload to Google Play (Android)

This project uses **Capacitor** to package the web app (`mobile/`) into a native Android app bundle (`.aab`) for the Play Store.

## 1) One-time setup

- Create a Google Play Developer account (paid, one-time fee)
- Install **Android Studio**
- Install **Node.js** (already installed on most PCs that can run this repo)

## 2) Build the Android App Bundle (AAB)

From the project folder:

```bash
npm install
npm run sync:android
```

Open Android Studio:

```bash
npm run android
```

Then in Android Studio:

- **Build** -> **Generate Signed Bundle / APK**
- Select **Android App Bundle**
- Create or choose your keystore
- Generate the `.aab`

## 3) Upload to Play Console

In Google Play Console:

- Create a new app
- Upload the generated `.aab` (start with **Internal testing** track)
- Add app name, description, screenshots, app icon, feature graphic
- Complete **Content rating**, **Target audience**, **Data safety**, etc.

## Notes

- The Android package id is `appId` in `capacitor.config.json`. Change it **before** your first upload if needed.
- If you plan to use Admin Mode, set a strong password in `mobile/admin_config.js` before building (note: this is a UI lock only, not real security).
- If you update teacher data (`PhoneBook.xlsx`), run `npm run sync:android` again, rebuild a new `.aab`, and upload a new version.
- Keep your keystore safe. If you lose it, updates can become difficult (Play App Signing helps).

## Build APK (optional)

For testing / installing directly on phones (not for Play Store):

```bash
npm run apk:debug
```

Output file: `android/app/build/outputs/apk/debug/app-debug.apk`
