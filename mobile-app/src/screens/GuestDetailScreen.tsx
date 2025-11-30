import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GuestDetailScreen = ({ route }: any) => {
  const { guestId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Guest Detail Screen (ID: {guestId})</Text>
      <Text style={styles.subtitle}>Coming soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default GuestDetailScreen;
