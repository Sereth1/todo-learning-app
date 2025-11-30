import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { Table, TableCreateData } from '../types';

const TablesScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<TableCreateData>>({
    name: '',
    capacity: 8,
    is_vip: false,
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (currentWedding) {
      loadTables();
    }
  }, [currentWedding]);

  const loadTables = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const data = await weddingApi.getTables(currentWedding.id);
      setTables(data);
    } catch (error) {
      console.error('Load tables error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!formData.name || !formData.capacity) {
      Alert.alert('Error', 'Please fill in table name and capacity');
      return;
    }

    if (!currentWedding) {
      Alert.alert('Error', 'No wedding selected');
      return;
    }

    setLoading(true);
    try {
      await weddingApi.createTable({
        name: formData.name,
        capacity: formData.capacity,
        is_vip: formData.is_vip,
        location: formData.location,
        notes: formData.notes,
        wedding: currentWedding.id,
      });
      
      Alert.alert('Success', `${formData.name} has been added!`);
      setShowAddModal(false);
      setFormData({ name: '', capacity: 8, is_vip: false, location: '', notes: '' });
      loadTables();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = (table: Table) => {
    Alert.alert(
      'Delete Table',
      `Delete "${table.name}"? All seating assignments will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await weddingApi.deleteTable(table.id);
              Alert.alert('Success', 'Table deleted');
              loadTables();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete table');
            }
          },
        },
      ]
    );
  };

  const getOccupancyColor = (table: Table) => {
    const percentage = (table.seats_taken / table.capacity) * 100;
    if (percentage >= 100) return '#FF3B30';
    if (percentage >= 75) return '#FF9500';
    return '#34C759';
  };

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedSeats = tables.reduce((sum, t) => sum + t.seats_taken, 0);

  const renderTable = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={[styles.tableCard, item.is_vip && styles.vipCard]}
      onLongPress={() => handleDeleteTable(item)}
    >
      <View style={styles.tableHeader}>
        <View>
          <Text style={styles.tableName}>{item.name}</Text>
          <Text style={styles.tableNumber}>Table {item.table_number}</Text>
        </View>
        {item.is_vip && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>VIP</Text>
          </View>
        )}
      </View>

      <View style={styles.tableInfo}>
        <View style={styles.occupancy}>
          <View
            style={[
              styles.occupancyDot,
              { backgroundColor: getOccupancyColor(item) },
            ]}
          />
          <Text style={styles.occupancyText}>
            {item.seats_taken} / {item.capacity} seats
          </Text>
        </View>
        
        {item.location && (
          <Text style={styles.locationText}>📍 {item.location}</Text>
        )}
      </View>

      {item.guests && item.guests.length > 0 && (
        <View style={styles.guestsList}>
          <Text style={styles.guestsTitle}>Guests:</Text>
          {item.guests.slice(0, 3).map((guest) => (
            <Text key={guest.id} style={styles.guestName}>
              • {guest.guest_name}
            </Text>
          ))}
          {item.guests.length > 3 && (
            <Text style={styles.moreGuests}>
              +{item.guests.length - 3} more
            </Text>
          )}
        </View>
      )}

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          💬 {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && tables.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tables.length}</Text>
          <Text style={styles.statLabel}>Tables</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalSeats}</Text>
          <Text style={styles.statLabel}>Total Seats</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{assignedSeats}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalSeats - assignedSeats}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      <FlatList
        data={tables}
        renderItem={renderTable}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tables yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>Add First Table</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {tables.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Table</Text>

              <Text style={styles.label}>Table Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Head Table, Table A"
              />

              <Text style={styles.label}>Capacity *</Text>
              <TextInput
                style={styles.input}
                value={formData.capacity?.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, capacity: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholder="8"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Near window, Dance floor, etc."
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>VIP Table</Text>
                <Switch
                  value={formData.is_vip}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_vip: value })
                  }
                />
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Special requirements..."
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleAddTable}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Adding...' : 'Add Table'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 15,
  },
  tableCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  vipCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tableNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableInfo: {
    marginBottom: 10,
  },
  occupancy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  occupancyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  occupancyText: {
    fontSize: 14,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  guestsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  guestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  guestName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  moreGuests: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 3,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyContainer: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TablesScreen;
