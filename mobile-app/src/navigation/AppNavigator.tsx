import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GuestListScreen from '../screens/GuestListScreen';
import GuestDetailScreen from '../screens/GuestDetailScreen';
import AddGuestScreen from '../screens/AddGuestScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator>
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ title: 'Wedding Planner' }}
          />
          <Stack.Screen 
            name="GuestList" 
            component={GuestListScreen}
            options={{ title: 'Guest List' }}
          />
          <Stack.Screen 
            name="GuestDetail" 
            component={GuestDetailScreen}
            options={{ title: 'Guest Details' }}
          />
          <Stack.Screen 
            name="AddGuest" 
            component={AddGuestScreen}
            options={{ title: 'Add Guest' }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
