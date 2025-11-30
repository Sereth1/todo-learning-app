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
  Platform,
} from 'react-native';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { Todo, TodoCreateData, TodoCategory, TodoPriority, TodoStatus } from '../types';

const TodosScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'overdue' | 'today'>('active');
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [formData, setFormData] = useState<Partial<TodoCreateData>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'not_started',
    due_date: '',
  });

  useEffect(() => {
    if (currentWedding) {
      loadData();
    }
  }, [currentWedding, selectedFilter, selectedPriority, selectedCategory]);

  const loadData = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      
      if (selectedFilter === 'active') {
        params.status = 'active';
      } else if (selectedFilter === 'completed') {
        params.status = 'completed';
      } else if (selectedFilter === 'overdue') {
        // Will fetch and filter on client side
      } else if (selectedFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.due_date = today;
      }
      
      if (selectedPriority !== 'all') {
        params.priority = selectedPriority;
      }
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const [todosData, categoriesData] = await Promise.all([
        weddingApi.getTodos(currentWedding.id, params),
        weddingApi.getTodoCategories(currentWedding.id),
      ]);
      
      let filteredTodos = todosData;
      if (selectedFilter === 'overdue') {
        filteredTodos = todosData.filter(t => t.is_overdue);
      }
      
      setTodos(filteredTodos);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Load todos error:', error);
      Alert.alert('Error', 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!formData.title || !currentWedding) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    try {
      await weddingApi.createTodo({
        ...formData,
        wedding: currentWedding.id,
      } as TodoCreateData);
      
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'not_started',
        due_date: '',
      });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create todo');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTodo = async (todo: Todo) => {
    try {
      if (todo.status === 'completed') {
        await weddingApi.reopenTodo(todo.id);
      } else {
        await weddingApi.completeTodo(todo.id);
      }
      loadData();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todo: Todo) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${todo.title}"?`);
      if (!confirmed) return;
      
      try {
        await weddingApi.deleteTodo(todo.id);
        loadData();
      } catch (error: any) {
        alert('Error: Failed to delete todo');
      }
      return;
    }

    Alert.alert(
      'Delete Todo',
      `Delete "${todo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await weddingApi.deleteTodo(todo.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete todo');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: TodoPriority) => {
    const colors = {
      low: '#94A3B8',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444',
    };
    return colors[priority];
  };

  const getStatusColor = (status: TodoStatus) => {
    const colors = {
      not_started: '#94A3B8',
      in_progress: '#3B82F6',
      waiting: '#F59E0B',
      completed: '#10B981',
      cancelled: '#6B7280',
    };
    return colors[status];
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      style={[
        styles.todoCard,
        item.is_pinned && styles.pinnedCard,
        item.is_overdue && item.status !== 'completed' && styles.overdueCard,
      ]}
      onLongPress={() => handleDeleteTodo(item)}
    >
      <View style={styles.todoHeader}>
        <View style={styles.todoHeaderLeft}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              item.status === 'completed' && styles.checkboxCompleted,
            ]}
            onPress={() => handleCompleteTodo(item)}
          >
            {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <View style={styles.todoHeaderText}>
            <Text
              style={[
                styles.todoTitle,
                item.status === 'completed' && styles.todoTitleCompleted,
              ]}
            >
              {item.is_pinned && '📌 '}
              {item.title}
            </Text>
            
            {item.description && (
              <Text style={styles.todoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
      </View>

      <View style={styles.todoMeta}>
        {item.category_name && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: item.category_color || '#3B82F6' },
            ]}
          >
            <Text style={styles.categoryText}>{item.category_name}</Text>
          </View>
        )}

        {item.due_date && (
          <View style={styles.dueDateBadge}>
            <Text
              style={[
                styles.dueDateText,
                item.is_overdue && item.status !== 'completed' && styles.overdueText,
              ]}
            >
              📅 {item.due_date}
            </Text>
          </View>
        )}

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status_display}</Text>
        </View>
      </View>

      {(item.subtask_count.total > 0 || item.checklist_progress.total > 0) && (
        <View style={styles.progressSection}>
          {item.subtask_count.total > 0 && (
            <Text style={styles.progressText}>
              📋 {item.subtask_count.completed}/{item.subtask_count.total} subtasks
            </Text>
          )}
          {item.checklist_progress.total > 0 && (
            <Text style={styles.progressText}>
              ✓ {item.checklist_progress.percent}% checklist
            </Text>
          )}
        </View>
      )}

      {item.estimated_cost && (
        <Text style={styles.costText}>💰 ${item.estimated_cost.toFixed(2)}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading && todos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'completed', 'overdue', 'today'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No todos yet</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addButtonText}>Add First Todo</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {todos.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Todo Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Todo</Text>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Book venue, Send invitations"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Additional details..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'medium', 'high', 'urgent'] as TodoPriority[]).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority && styles.priorityButtonActive,
                      { borderColor: getPriorityColor(priority) },
                    ]}
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        formData.priority === priority && { color: getPriorityColor(priority) },
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Due Date</Text>
              <View style={styles.quickDateButtons}>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const today = new Date();
                    setFormData({ ...formData, due_date: today.toISOString().split('T')[0] });
                  }}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setFormData({ ...formData, due_date: tomorrow.toISOString().split('T')[0] });
                  }}
                >
                  <Text style={styles.quickDateText}>Tomorrow</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setFormData({ ...formData, due_date: nextWeek.toISOString().split('T')[0] });
                  }}
                >
                  <Text style={styles.quickDateText}>Next Week</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setFormData({ ...formData, due_date: nextMonth.toISOString().split('T')[0] });
                  }}
                >
                  <Text style={styles.quickDateText}>Next Month</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                value={formData.due_date}
                onChangeText={(text) => setFormData({ ...formData, due_date: text })}
                placeholder="YYYY-MM-DD or use quick buttons above"
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal style={styles.categoryPicker}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: cat.color },
                      formData.category === cat.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.id })}
                  >
                    <Text style={styles.categoryChipText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleAddTodo}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Adding...' : 'Add Todo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedPriority === 'all' && styles.filterOptionActive,
                ]}
                onPress={() => setSelectedPriority('all')}
              >
                <Text style={styles.filterOptionText}>All</Text>
              </TouchableOpacity>
              {(['low', 'medium', 'high', 'urgent'] as TodoPriority[]).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterOption,
                    selectedPriority === priority && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text style={styles.filterOptionText}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedCategory === 'all' && styles.filterOptionActive,
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={styles.filterOptionText}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterOption,
                    selectedCategory === cat.id && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.filterOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.submitButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filtersBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 20,
  },
  listContainer: {
    padding: 15,
  },
  todoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pinnedCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  overdueCard: {
    borderColor: '#EF4444',
    borderLeftWidth: 4,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  todoHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoHeaderText: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
  },
  priorityIndicator: {
    width: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  todoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dueDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  costText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
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
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  quickDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    backgroundColor: '#f0f8ff',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryPicker: {
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default TodosScreen;
