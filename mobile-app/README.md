# Wedding Planner Mobile App

React Native mobile application for the Wedding Planner platform, built with Expo.

## Features

- 🔐 User authentication (login/register)
- 💑 Wedding management
- 👥 Guest list management
- 📊 Dashboard with guest statistics
- 📱 Cross-platform (iOS & Android)

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **Axios** for API calls
- **AsyncStorage** for local data persistence

## Setup

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Configure API URL:
   - For Android emulator: Edit `src/api/client.ts`, API_URL is set to `http://10.0.2.2:8000/api`
   - For iOS simulator: Change to `http://localhost:8000/api`
   - For physical device: Use your computer's IP address

3. Start the app:
```bash
npm start
```

4. Run on device:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on physical device

## Project Structure

```
mobile-app/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios configuration
│   │   ├── auth.ts       # Auth API calls
│   │   └── wedding.ts    # Wedding/Guest API calls
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── WeddingContext.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── GuestListScreen.tsx
│   │   ├── GuestDetailScreen.tsx
│   │   └── AddGuestScreen.tsx
│   ├── components/       # Reusable components
│   └── types/            # TypeScript types
│       └── index.ts
├── App.tsx               # Main app component
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## API Configuration

The app connects to the Django backend at `http://10.0.2.2:8000/api` (Android emulator).

Update the API URL in `src/api/client.ts` based on your setup:
- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://localhost:8000/api`
- Physical device: `http://<YOUR_IP>:8000/api`

## Key Features Implemented

### Authentication
- Login with email/password
- User registration
- Persistent auth with AsyncStorage
- Auto-logout on token expiration

### Dashboard
- Welcome screen with user info
- Guest statistics (total, confirmed, pending, declined)
- Quick actions to view guests or add new ones

### Guest Management
- View all guests for current wedding
- Guest list with status badges
- Add new guests
- Guest detail view (placeholder)

## Notes

- Make sure the Django backend is running at `http://localhost:8000`
- The app automatically stores auth tokens in AsyncStorage
- Uses flat API routes with query params (e.g., `?wedding=<id>`)
- All API calls use Bearer token authentication

## Next Steps

To extend the app:
1. Implement GuestDetailScreen with full guest info and RSVP management
2. Add wedding creation/selection
3. Implement seating arrangements
4. Add meal selection
5. Push notifications for RSVP reminders
6. Offline support with local caching

## Troubleshooting

**Cannot connect to backend:**
- Ensure Django server is running
- Check API_URL in `src/api/client.ts`
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's IP and ensure same network

**Dependencies issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Expo cache issues:**
```bash
expo start -c
```
