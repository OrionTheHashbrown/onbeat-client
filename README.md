# OnBeat Client

OnBeat iOS app, built with Expo and React Native.

## Requirements

- Node.js (LTS)
- macOS with Xcode installed (the app runs on iOS only)
- The Spotify app with Spotify Premium installed on the device

## 1. Install

```bash
npm install
```

## 2. Set up environment variables

Create a `.env.local` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com
```

## 3. Run the app

Build and install the app on it:

```bash
npx expo run:ios 
```

## Other commands

```bash
npm test           # run unit tests
```
