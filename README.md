# File Uploader (Expo + Firebase)

A cross-platform mobile app (iOS & Android) that allows users to:
- 📧 Register & login with email/password
- 📁 Upload files from device storage
- 📋 View upload history with timestamps
- 🔒 Secure per-user data isolation

**Built with:** React Native (Expo), Firebase Auth, Firestore, Storage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ & npm
- Firebase project (free tier OK)
- Android emulator or device / iOS simulator (Xcode on macOS)

### 1. Clone & Install
```bash
git clone https://github.com/mandarkinalekar/AI-XRAY.git
cd AI-XRAY
npm install
```

### 2. Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or select an existing one
3. Go to **Project Settings** → **Your Apps** → **Web** (or create a web app)
4. Copy the config object
5. Paste into `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

### 3. Enable Firebase Services
In Firebase Console:
- **Authentication** → Sign-in method → Enable "Email/Password"
- **Firestore Database** → Create database (Test mode for development)
- **Storage** → Create bucket (defaults to test mode)

### 4. Deploy Security Rules
1. Copy rules from [firestore.rules](firestore.rules) and [storage.rules](storage.rules)
2. In Firebase Console:
   - **Firestore** → Rules tab → paste `firestore.rules` content → Publish
   - **Storage** → Rules tab → paste `storage.rules` content → Publish

### 5. Start App
```bash
# Option A: Start dev server (Expo tunnel mode)
npm start

# Option B: Build & install on emulator/device
npx expo run:android    # Android
npx expo run:ios        # iOS (macOS only)
```

---

## 🧪 Testing the App

### Register & Login Flow
1. Open the app
2. Tap "Register" → enter email & password (≥6 chars)
3. Submit → auto-logged in, Dashboard opens
4. Tap "Logout" → back to Login screen
5. Tap "Register" link → verify fields are validated

### Upload Flow
1. From Dashboard, tap "Upload"
2. Tap "Pick & Upload File" → select a file
3. Watch progress bar reach 100%
4. Auto-redirected to Dashboard

### Dashboard Flow
1. Confirm uploaded file appears with correct date/time
2. Tap file → opens/downloads in browser
3. Upload more files → all appear in reverse chronological order

---

## 🔐 Security Rules

**Firestore (`firestore.rules`):**
- Users can only create & read their own upload documents
- `userId` field must match authenticated user ID
- No updates or deletes allowed

**Storage (`storage.rules`):**
- Users can read/write only to `uploads/{uid}/*` paths
- Prevents cross-user access

See [firestore.rules](firestore.rules) and [storage.rules](storage.rules) for full rules.

---

## 📦 Project Structure
```
.
├── App.js                    # Entry point (auth state manager)
├── app.json                  # Expo config
├── package.json              # Dependencies
├── src/
│   ├── firebase.js           # Firebase init & exports
│   ├── styles.js             # Shared styles & colors
│   ├── navigation/
│   │   └── AppNavigator.js   # Navigation stack (Auth vs App)
│   ├── screens/
│   │   ├── LoginScreen.js    # Login form
│   │   ├── RegisterScreen.js # Register form
│   │   ├── UploadScreen.js   # File picker & upload
│   │   └── DashboardScreen.js # List uploads
│   └── utils/
│       └── validators.js     # Email & password validation
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
└── firebase.json             # Firebase emulator config
```

---

## 🛠️ Development Commands

```bash
npm start              # Start Expo dev server
npm run android        # Build & install on Android emulator
npm run ios            # Build & install on iOS simulator (macOS)
npm run emulators      # Start Firebase emulator suite (local testing)
npm run test:rules     # Run security rules unit tests
```

---

## 🐛 Troubleshooting

**App won't connect to Firebase?**
- Verify Firebase config in `src/firebase.js` is correct
- Check that Authentication/Firestore/Storage are enabled in Firebase Console
- Ensure internet connectivity

**File upload fails?**
- Check Storage bucket exists and is readable/writable in Firebase Console
- Verify Firestore document has `userId`, `fileName`, `storagePath`, `uploadedAt` fields
- Check Security rules are deployed correctly

**Emulator won't start?**
- Install Firebase CLI: `npm install -g firebase-tools`
- Run `firebase login` and authenticate
- Ensure Java is installed (for Firestore emulator)

**Build errors?**
- Clear cache: `npm cache clean --force` and `expo prebuild --clean`
- Reinstall: `rm -rf node_modules && npm install`

---

## 📱 Building for Platforms

### Android (APK/AAB)
1. Install Expo CLI: `npm install -g expo-cli`
2. Run: `eas build --platform android` (requires EAS account)
3. Or local: `npx react-native-cli run-android` (requires Android SDK & emulator)

### iOS (IPA)
1. macOS + Xcode required
2. Run: `eas build --platform ios` (requires EAS account & Apple Developer Team)
3. Or local: `npx react-native-cli run-ios` (XCode CLI)

See [EAS Documentation](https://docs.expo.dev/build/) for full setup.

---

## 📄 License
MIT

---

## 🤝 Contributing
Contributions welcome! Submit a PR or open an issue.

---

## 📞 Support
For issues, open a [GitHub Issue](https://github.com/mandarkinalekar/AI-XRAY/issues).
