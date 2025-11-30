import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { GuestStats } from '../types';

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const { currentWedding, isLoading: weddingLoading } = useWedding();
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWedding) {
      loadStats();
    }
  }, [currentWedding]);

  const loadStats = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const data = await weddingApi.getGuestStats(currentWedding.id);
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (weddingLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!currentWedding) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWeddingText}>No wedding found. Create one first!</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weddingCard}>
        <Text style={styles.weddingTitle}>{currentWedding.display_name}</Text>
        <Text style={styles.weddingDate}>
          {currentWedding.wedding_date || 'Date not set'}
        </Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Guest Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total_guests}</Text>
              <Text style={styles.statLabel}>Total Guests</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.confirmedText]}>
                {stats.confirmed}
              </Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.pendingText]}>
                {stats.pending}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.declinedText]}>
                {stats.declined}
              </Text>
              <Text style={styles.statLabel}>Declined</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('GuestList')}
        >
          <Text style={styles.actionButtonText}>👥 View Guest List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddGuest')}
        >
          <Text style={styles.actionButtonText}>➕ Add New Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Tables')}
        >
          <Text style={styles.actionButtonText}>🪑 Seating & Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Meals')}
        >
          <Text style={styles.actionButtonText}>🍽️ Menu & Meals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Todos')}
        >
          <Text style={styles.actionButtonText}>✅ Todo List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  weddingCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  weddingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  weddingDate: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  confirmedText: {
    color: '#34C759',
  },
  pendingText: {
    color: '#FF9500',
  },
  declinedText: {
    color: '#FF3B30',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  noWeddingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DashboardScreen;
