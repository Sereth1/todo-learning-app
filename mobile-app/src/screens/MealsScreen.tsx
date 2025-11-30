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
import type { MealChoice, MealType, MealCreateData } from '../types';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'meat', label: 'Meat', icon: '🥩' },
  { value: 'poultry', label: 'Poultry', icon: '🍗' },
  { value: 'fish', label: 'Fish', icon: '🐟' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'kids', label: 'Kids', icon: '👶' },
];

const MealsScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [meals, setMeals] = useState<MealChoice[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<MealChoice[]>([]);
  const [selectedType, setSelectedType] = useState<MealType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<MealCreateData>>({
    name: '',
    description: '',
    meal_type: 'meat',
    is_available: true,
    max_quantity: undefined,
  });

  useEffect(() => {
    if (currentWedding) {
      loadMeals();
    }
  }, [currentWedding]);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredMeals(meals);
    } else {
      setFilteredMeals(meals.filter((m) => m.meal_type === selectedType));
    }
  }, [selectedType, meals]);

  const loadMeals = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const data = await weddingApi.getMeals(currentWedding.id);
      setMeals(data);
    } catch (error) {
      console.error('Load meals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!formData.name || !formData.description) {
      Alert.alert('Error', 'Please fill in name and description');
      return;
    }

    if (!currentWedding) {
      Alert.alert('Error', 'No wedding selected');
      return;
    }

    setLoading(true);
    try {
      await weddingApi.createMeal({
        name: formData.name,
        description: formData.description,
        meal_type: formData.meal_type!,
        is_available: formData.is_available,
        max_quantity: formData.max_quantity,
        wedding: currentWedding.id,
      });
      
      Alert.alert('Success', `${formData.name} has been added to the menu!`);
      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        meal_type: 'meat',
        is_available: true,
        max_quantity: undefined,
      });
      loadMeals();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = (meal: MealChoice) => {
    Alert.alert(
      'Delete Meal',
      `Delete "${meal.name}" from the menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await weddingApi.deleteMeal(meal.id);
              Alert.alert('Success', 'Meal deleted');
              loadMeals();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const getMealIcon = (type: MealType) => {
    return MEAL_TYPES.find((t) => t.value === type)?.icon || '🍽️';
  };

  const getMealTypeLabel = (type: MealType) => {
    return MEAL_TYPES.find((t) => t.value === type)?.label || type;
  };

  const renderMeal = ({ item }: { item: MealChoice }) => (
    <TouchableOpacity
      style={[styles.mealCard, !item.is_available && styles.unavailableCard]}
      onLongPress={() => handleDeleteMeal(item)}
    >
      <View style={styles.mealHeader}>
        <Text style={styles.mealIcon}>{getMealIcon(item.meal_type)}</Text>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealType}>{getMealTypeLabel(item.meal_type)}</Text>
        </View>
        {!item.is_available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      <Text style={styles.mealDescription}>{item.description}</Text>

      {item.max_quantity && (
        <Text style={styles.maxQuantity}>Max: {item.max_quantity} servings</Text>
      )}
    </TouchableOpacity>
  );

  if (loading && meals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
            All ({meals.length})
          </Text>
        </TouchableOpacity>
        {MEAL_TYPES.map((type) => {
          const count = meals.filter((m) => m.meal_type === type.value).length;
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterChip,
                selectedType === type.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === type.value && styles.filterTextActive,
                ]}
              >
                {type.icon} {type.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredMeals}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No menu items yet</Text>
            <Text style={styles.emptySubtext}>Start building your wedding menu</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>Add Your First Dish</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {meals.length > 0 && (
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
              <Text style={styles.modalTitle}>Add Meal Option</Text>

              <Text style={styles.label}>Meal Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Grilled Salmon, Chicken Parmesan"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the dish..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Meal Type *</Text>
              <View style={styles.typeButtons}>
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.meal_type === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, meal_type: type.value })}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.meal_type === type.value && styles.typeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Max Quantity (optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.max_quantity?.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, max_quantity: parseInt(text) || undefined })
                }
                keyboardType="number-pad"
                placeholder="Leave empty for unlimited"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Available</Text>
                <Switch
                  value={formData.is_available}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_available: value })
                  }
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleAddMeal}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Adding...' : 'Add Meal'}
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
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  mealCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unavailableCard: {
    opacity: 0.6,
    borderColor: '#ccc',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mealType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unavailableBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  maxQuantity: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
  },
  typeLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
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

export default MealsScreen;
