# Firebase Storage Setup Guide

This guide will help you set up Firebase Storage for hosting game files in your Moody's Games platform.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `moodysgames-storage`
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firebase Storage

1. In your Firebase project, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in production mode" for security
4. Select a storage location (choose closest to your users)

## Step 3: Create a Service Account

1. Go to Project Settings (gear icon) → "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file - this contains your credentials

## Step 4: Configure Environment Variables

From the downloaded JSON file, extract these values and add them to your Render environment variables:

```
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key (keep the \n characters)
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_CERT_URL=your_client_x509_cert_url
```

## Step 5: Update Storage Rules (Optional)

For public file access, you can update your Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /games/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

## Step 6: Deploy

1. Commit and push your changes to GitHub
2. Render will automatically deploy with the new Firebase integration
3. Add the environment variables in your Render dashboard

## Benefits

- ✅ No more 502 errors from large file uploads
- ✅ Faster file serving through Google's CDN
- ✅ Unlimited storage (within Firebase limits)
- ✅ Better performance and reliability
- ✅ Files are served directly from Firebase, reducing server load

## File Structure

Files will be organized in Firebase Storage as:
```
games/
  ├── game-id-1/
  │   ├── pc/
  │   │   └── game-file.zip
  │   └── android/
  │       └── game-file.apk
  └── game-id-2/
      ├── pc/
      │   └── another-game.exe
      └── android/
          └── another-game.apk
```

## Troubleshooting

- If you get Firebase initialization errors, check that all environment variables are set correctly
- Make sure the private key includes the `\n` characters properly
- Verify your Firebase project ID matches `moodysgames-storage`
- Check that Storage is enabled in your Firebase project