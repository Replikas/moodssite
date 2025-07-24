# Google Drive Storage Setup Guide

This guide will help you set up Google Drive API for your game hosting platform. Google Drive offers **completely free 15GB storage** with no credit card required and powerful API access.

## Why Google Drive?

- ✅ **Completely Free**: 15GB storage (shared across Google services)
- ✅ **No Credit Card Required**: Sign up without payment method
- ✅ **Generous API Quotas**: 12,000 requests per minute
- ✅ **Direct Download Links**: Create direct URLs for file access
- ✅ **Reliable**: Google's enterprise infrastructure
- ✅ **No Bandwidth Limits**: Unlike other providers

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (free Gmail account works)
3. Click "Select a project" → "New Project"
4. Enter project name (e.g., "MoodysGames Storage")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API" and click "Enable"
4. Wait for the API to be enabled

## Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "API Key"
3. Copy the generated API key and save it securely
4. (Optional) Click "Restrict Key" to limit usage to Google Drive API only

## Step 4: Create Storage Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for your game files (e.g., "MoodysGames")
3. Right-click the folder → "Share"
4. Set sharing to "Anyone with the link can view"
5. Copy the folder ID from the URL (the long string after `/folders/`)

## Step 5: Configure Environment Variables

Add these environment variables to your deployment platform (Render, Vercel, etc.):

```env
GOOGLE_DRIVE_API_KEY=your_api_key_here
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

**Example**:
```env
GOOGLE_DRIVE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_DRIVE_FOLDER_ID=1BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxB
```

## Step 6: Deploy Your Application

1. Push your code to your Git repository
2. Deploy to your hosting platform (Render, Railway, etc.)
3. Set the environment variables in your hosting platform's dashboard
4. Your game hosting platform is now ready with **free 15GB storage**!

## Benefits of This Setup

- ✅ **Completely Free**: 15GB storage with no bandwidth limits
- ✅ **No Credit Card Required**: True free tier
- ✅ **Generous API Quotas**: 12,000 requests per minute
- ✅ **Direct Download Links**: Fast, direct file access
- ✅ **Reliable**: Google's enterprise infrastructure
- ✅ **Global CDN**: Fast downloads worldwide
- ✅ **Large File Support**: No file size restrictions

## File Organization

Your game files will be organized in Google Drive as:
```
MoodysGames/ (your folder)
├── 1_pc_game.exe
├── 1_android_game.apk
├── 2_pc_another-game.exe
├── 2_android_another-game.apk
└── ...
```

## API Quotas

- **Requests per 60 seconds**: 12,000
- **Requests per user per 60 seconds**: 12,000
- **Daily requests**: Unlimited (within per-minute limits)
- **Storage**: 15GB free
- **Bandwidth**: No limits

## Troubleshooting

### Common Issues:

1. **"API key invalid"**: Verify your API key is correct and has Drive API enabled
2. **"Folder not found"**: Check your folder ID and ensure it's shared publicly
3. **"Permission denied"**: Make sure the folder has "Anyone with the link" access
4. **"Quota exceeded"**: You're hitting the 12,000 requests/minute limit

### Getting Help:

- Check the [Google Drive API Documentation](https://developers.google.com/drive/api)
- Review your API quotas in Google Cloud Console
- Verify folder permissions in Google Drive

---

🎮 **Your game hosting platform now has free, unlimited bandwidth storage!** Upload your games and share them with the world.