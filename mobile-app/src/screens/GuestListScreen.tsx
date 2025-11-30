import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { Guest } from '../types';

const GuestListScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWedding) {
      loadGuests();
    }
  }, [currentWedding]);

  const loadGuests = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const data = await weddingApi.getGuests(currentWedding.id);
      setGuests(data);
    } catch (error) {
      console.error('Load guests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yes': return '#34C759';
      case 'no': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const renderGuest = ({ item }: { item: Guest }) => (
    <TouchableOpacity
      style={styles.guestCard}
      onPress={() => navigation.navigate('GuestDetail', { guestId: item.id })}
    >
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.guestEmail}>{item.email}</Text>
        <Text style={styles.guestType}>{item.guest_type_display}</Text>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.attendance_status) }]}>
        <Text style={styles.statusText}>
          {item.attendance_status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={guests}
        renderItem={renderGuest}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No guests yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddGuest')}
            >
              <Text style={styles.addButtonText}>Add First Guest</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {guests.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddGuest')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  guestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  guestEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  guestType: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default GuestListScreen;
