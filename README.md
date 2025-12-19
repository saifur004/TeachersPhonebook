# Lakshmipur Government College - Teacher Phone Book

This repo contains:

- A mobile-first web app (HTML/CSS/JS) in `mobile/`
- A simple desktop viewer (Python/Tkinter) in `main.py`

## Mobile Web App (recommended)

Open the phone book UI:

- Open `mobile/index.html` (works best when served from a local web server).

Start a local server (PC):

```bash
cd mobile
python -m http.server 8000
```

Then open on your phone (same Wi-Fi):

- `http://YOUR_PC_IP:8000`

### Update Teacher Data

The mobile app loads data from `mobile/phonebook_data.js`.

#### Option A: Edit inside the app (Admin Mode)

1. Configure Admin Mode in `mobile/admin_config.js`.
   - Recommended: generate a salted hash with `python tools/hash_admin_password.py` and paste the output into `mobile/admin_config.js`.
2. Run the app and open the Admin Panel:
   - If the **Admin** button is visible: tap **Admin** on the home screen.
   - If it’s hidden: long-press the college logo (or top bar title) for ~2 seconds.
3. Add/edit/delete teachers, upload photos, then press **Save & Apply**.

Notes:
- Admin Mode is a local UI lock only (not real security). Anyone can extract the password from a published app.
- Saved changes are stored in `localStorage` on that device.
- To make changes permanent in the repo / Play Store build, use **Download Data File** and replace `mobile/phonebook_data.js` with it.

#### Option B: Regenerate from Excel

If you update `PhoneBook.xlsx`, regenerate the JS data file:

```bash
python tools/generate_phonebook_data.py
```

### College Logo

Put your logo image at `mobile/logo.png` (square image works best).  
If it's missing, the app uses the fallback `mobile/logo.svg`.

## Android App (Google Play)

This project is already set up to be packaged as an Android app using Capacitor (it wraps the web app into a native Android app).

### Requirements

- Android Studio (includes Android SDK + build tools)
- Java (Android Studio usually handles this)
- Node.js + npm

### Build (AAB) for Play Store

1. Install dependencies:

```bash
npm install
```

2. Update teacher data (optional) and sync it into the Android project:

```bash
npm run sync:android
```

3. Open the Android project in Android Studio:

```bash
npm run android
```

4. In Android Studio:

- **Build** -> **Generate Signed Bundle / APK**
- Choose **Android App Bundle (AAB)**
- Create/choose a keystore, then generate the `.aab`

Upload the generated `.aab` to Google Play Console.

More details: `PLAYSTORE.md`

### Build APK (for testing)

Generate a debug APK (works for installing on phones, not for Play Store):

```bash
npm run apk:debug
```

### Important

- The package id is in `capacitor.config.json`. Change it **before** your first Play Store upload if needed.
- If you change `mobile/` files (UI) or regenerate `mobile/phonebook_data.js`, run `npx cap sync android` before building.

## Desktop App (optional)

Run the desktop viewer:

```bash
python main.py
```
