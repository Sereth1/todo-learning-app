# Mobile App vs Next.js Frontend Comparison

## Architecture Overview

### Next.js Frontend (wedding-frontend/)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Rendering**: Server-side rendering (SSR) + Client components
- **Data Fetching**: Server Actions
- **State**: React Context + Hooks

### React Native Mobile (mobile-app/)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **UI**: React Native StyleSheet (native components)
- **Rendering**: Client-side only (mobile native)
- **Data Fetching**: Axios HTTP client
- **State**: React Context + AsyncStorage

---

## Key Differences

### 1. Data Fetching Pattern

**Next.js (Server Actions)**
```typescript
// wedding-frontend/src/actions/wedding.ts
"use server";

export async function getGuests(weddingId: number) {
  return apiRequest<Guest[]>(`/wedding_planner/guests/?wedding=${weddingId}`);
}

// Usage in component
const guests = await getGuests(weddingId);
```

**React Native (Direct API Calls)**
```typescript
// mobile-app/src/api/wedding.ts
export const weddingApi = {
  async getGuests(weddingId: number): Promise<Guest[]> {
    const response = await api.get(`/wedding_planner/guests/?wedding=${weddingId}`);
    return response.data.results || response.data || [];
  }
};

// Usage in component
const data = await weddingApi.getGuests(weddingId);
```

### 2. Styling Approach

**Next.js (Tailwind CSS)**
```tsx
<div className="bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">
    {wedding.display_name}
  </h2>
</div>
```

**React Native (StyleSheet)**
```tsx
<View style={styles.card}>
  <Text style={styles.title}>
    {wedding.display_name}
  </Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
```

### 3. Navigation

**Next.js (File-based routing)**
```tsx
// Automatic routing from file structure
app/
  dashboard/
    page.tsx        → /dashboard
    guests/
      page.tsx      → /dashboard/guests
      [id]/
        page.tsx    → /dashboard/guests/[id]

// Navigation
import { useRouter } from 'next/navigation';
router.push('/dashboard/guests');
```

**React Native (Stack Navigator)**
```tsx
// Explicit navigation setup
<Stack.Navigator>
  <Stack.Screen name="Dashboard" component={DashboardScreen} />
  <Stack.Screen name="GuestList" component={GuestListScreen} />
  <Stack.Screen name="GuestDetail" component={GuestDetailScreen} />
</Stack.Navigator>

// Navigation
navigation.navigate('GuestList');
```

### 4. Storage

**Next.js**
- Server-side cookies (httpOnly)
- LocalStorage for client state
- No persistent auth on reload (server validates)

```typescript
cookies().set("current_wedding_id", weddingId.toString());
```

**React Native**
- AsyncStorage (persistent key-value storage)
- Auth tokens stored locally
- Auto-loads on app start

```typescript
await AsyncStorage.setItem('auth_token', access);
const token = await AsyncStorage.getItem('auth_token');
```

### 5. UI Components

**Next.js (shadcn/ui)**
```tsx
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

<Button variant="primary" onClick={handleClick}>
  Add Guest
</Button>
```

**React Native (Native Components)**
```tsx
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

<TouchableOpacity style={styles.button} onPress={handleClick}>
  <Text style={styles.buttonText}>Add Guest</Text>
</TouchableOpacity>
```

---

## API Integration

### Both Use Flat Routes with Query Params

✅ **Correct Pattern** (used by both)
```
GET  /api/wedding_planner/guests/?wedding=<id>
POST /api/wedding_planner/guests/
GET  /api/wedding_planner/guests/<id>/
```

### Authentication

**Next.js**
- Uses `authFetch` wrapper with cookies
- Server-side validation
- Auto-refresh tokens

**Mobile**
- Axios interceptors add Bearer token
- Client-side token management
- Manual token refresh

---

## Shared Code

Both apps share the same **TypeScript types**:

```typescript
// Identical in both apps
export interface Guest {
  id: number;
  uid: string;
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
  guest_type: GuestType;
  family_relationship?: FamilyRelationship;
  relationship_tier?: RelationshipTier;
  attendance_status: "yes" | "no" | "pending";
  // ...
}
```

---

## Running Both Apps

### Next.js Frontend
```bash
cd wedding-frontend
npm run dev          # Runs on http://localhost:3000
```

### React Native Mobile
```bash
cd mobile-app
npm start            # Expo dev server

# Then:
# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Scan QR with Expo Go on physical device
```

### Backend API
```bash
python manage.py runserver  # http://localhost:8000
```

---

## Feature Parity

| Feature | Next.js Web | React Native Mobile |
|---------|-------------|---------------------|
| Authentication | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Guest List | ✅ | ✅ |
| Add Guest | ✅ | ✅ |
| Guest Details | ✅ | 🚧 (placeholder) |
| RSVP Management | ✅ | ❌ (TODO) |
| Seating Arrangement | ✅ | ❌ (TODO) |
| Meal Selection | ✅ | ❌ (TODO) |
| Event Management | ✅ | ❌ (TODO) |

---

## Mobile-Specific Considerations

### API URL Configuration

**Android Emulator**: Uses `10.0.2.2` to reach host's localhost
```typescript
const API_URL = 'http://10.0.2.2:8000/api';
```

**iOS Simulator**: Uses `localhost`
```typescript
const API_URL = 'http://localhost:8000/api';
```

**Physical Device**: Requires local network IP
```typescript
const API_URL = 'http://192.168.1.XXX:8000/api';
```

### Mobile-Friendly Features

1. **Touch interactions** - Large tap targets
2. **Native gestures** - Swipe, pull-to-refresh
3. **Offline support** - AsyncStorage caching
4. **Push notifications** - For RSVP reminders (TODO)
5. **Camera access** - For profile photos (TODO)
6. **Location services** - For venue maps (TODO)

---

## Summary

Both apps:
- Share the same backend API
- Use TypeScript for type safety
- Follow React patterns (Context, Hooks)
- Implement the same core features
- Use flat API routes with query params

Main differences:
- **Web**: SSR, Server Actions, Tailwind CSS, shadcn/ui
- **Mobile**: Native UI, Axios, StyleSheet, React Navigation

The mobile app provides a native experience while maintaining feature parity with the web version!
