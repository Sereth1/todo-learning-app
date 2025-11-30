import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useWedding } from '../contexts/WeddingContext';
import { weddingApi } from '../api/wedding';
import type { Todo, TodoCreateData, TodoCategory, TodoPriority } from '../types';

const TodosScreen = ({ navigation }: any) => {
  const { currentWedding } = useWedding();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'inbox' | 'today' | 'upcoming'>('inbox');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (currentWedding) {
      loadData();
    }
  }, [currentWedding, selectedFilter]);

  const loadData = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const params: Record<string, any> = { top_level: 'true', status: 'active' };
      const today = new Date().toISOString().split('T')[0];
      
      if (selectedFilter === 'today') {
        params.due_date = today;
      } else if (selectedFilter === 'upcoming') {
        params.due_after = today;
      }
      
      const [todosData, categoriesData] = await Promise.all([
        weddingApi.getTodos(currentWedding.id, params),
        weddingApi.getTodoCategories(currentWedding.id),
      ]);
      
      setTodos(todosData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Load todos error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!newTaskTitle.trim() || !currentWedding) return;

    try {
      await weddingApi.createTodo({
        wedding: currentWedding.id,
        title: newTaskTitle.trim(),
        status: 'not_started',
        priority: 'medium',
        category: selectedCategory,
        due_date: selectedDate || undefined,
      } as TodoCreateData);
      
      setNewTaskTitle('');
      setSelectedCategory(undefined);
      setSelectedDate('');
      loadData();
    } catch (error: any) {
      console.error('Create todo error:', error);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      if (todo.status === 'completed') {
        await weddingApi.reopenTodo(todo.id);
      } else {
        await weddingApi.completeTodo(todo.id);
      }
      loadData();
    } catch (error: any) {
      console.error('Toggle todo error:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await weddingApi.deleteTodo(todoId);
      loadData();
    } catch (error: any) {
      console.error('Delete todo error:', error);
    }
  };

  const getPriorityColor = (priority: TodoPriority) => {
    const colors = { low: '#94A3B8', medium: '#3B82F6', high: '#F97316', urgent: '#EF4444' };
    return colors[priority];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return '🗓️ Today';
    if (date.toDateString() === tomorrow.toDateString()) return '🗓️ Tomorrow';
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `🗓️ ${month} ${day}`;
  };

  const renderSwipeActions = (todoId: number) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => handleDeleteTodo(todoId)}
    >
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderTodo = ({ item }: { item: Todo }) => {
    const todoContent = (
      <View style={styles.todoRow}>
        <TouchableOpacity
          style={styles.todoCheckbox}
          onPress={() => handleToggleTodo(item)}
        >
          <View style={[
            styles.checkbox,
            item.status === 'completed' && styles.checkboxChecked,
            { borderColor: getPriorityColor(item.priority) }
          ]}>
            {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.todoBody}>
          <Text style={[
            styles.todoText,
            item.status === 'completed' && styles.todoTextCompleted
          ]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.todoMeta}>
            {item.due_date && (
              <Text style={[
                styles.metaText,
                item.is_overdue && styles.metaOverdue
              ]}>
                {formatDate(item.due_date)}
              </Text>
            )}
            {item.category_name && (
              <View style={[styles.categoryPill, { backgroundColor: item.category_color || '#3B82F6' }]}>
                <Text style={styles.categoryText}>{item.category_name}</Text>
              </View>
            )}
          </View>
        </View>

        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              if (window.confirm(`Delete "${item.title}"?`)) {
                handleDeleteTodo(item.id);
              }
            }}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    );

    if (Platform.OS === 'web') {
      return <View style={styles.todoContainer}>{todoContent}</View>;
    }

    return (
      <Swipeable
        renderRightActions={() => renderSwipeActions(item.id)}
        overshootRight={false}
      >
        <View style={styles.todoContainer}>{todoContent}</View>
      </Swipeable>
    );
  };

  const counts = {
    inbox: todos.length,
    today: todos.filter(t => t.due_date === new Date().toISOString().split('T')[0]).length,
    upcoming: todos.filter(t => t.due_date && t.due_date > new Date().toISOString().split('T')[0]).length,
  };

  if (loading && todos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[
          { key: 'inbox', icon: '📥', label: 'Inbox', count: counts.inbox },
          { key: 'today', icon: '⭐', label: 'Today', count: counts.today },
          { key: 'upcoming', icon: '📅', label: 'Upcoming', count: counts.upcoming },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterBtn,
              selectedFilter === filter.key && styles.filterBtnActive
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <View>
              <Text style={[
                styles.filterLabel,
                selectedFilter === filter.key && styles.filterLabelActive
              ]}>
                {filter.label}
              </Text>
              <Text style={[
                styles.filterCount,
                selectedFilter === filter.key && styles.filterCountActive
              ]}>
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Todo List */}
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>No tasks here</Text>
            <Text style={styles.emptyHint}>Add a task below to get started</Text>
          </View>
        }
      />

      {/* Quick Add Bar */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.quickAdd}
      >
        <TouchableOpacity
          style={styles.quickAddBtn}
          onPress={() => handleToggleTodo({ status: 'not_started' } as Todo)}
        >
          <View style={styles.quickAddCheckbox}>
            <Text style={styles.quickAddPlus}>+</Text>
          </View>
        </TouchableOpacity>
        
        <TextInput
          style={styles.quickAddInput}
          placeholder="Add a task..."
          placeholderTextColor="#94A3B8"
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          onSubmitEditing={handleQuickAdd}
          returnKeyType="done"
        />

        {newTaskTitle.length > 0 && (
          <TouchableOpacity
            style={styles.quickAddSend}
            onPress={handleQuickAdd}
          >
            <Text style={styles.quickAddSendIcon}>↑</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  filterBtnActive: {
    backgroundColor: '#3B82F6',
  },
  filterIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  todoContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  todoCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoBody: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 6,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  metaOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 28,
    color: '#94A3B8',
    fontWeight: '300',
  },
  swipeDelete: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginBottom: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#94A3B8',
  },
  quickAdd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  quickAddBtn: {
    marginRight: 12,
  },
  quickAddCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddPlus: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  quickAddInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  quickAddSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickAddSendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TodosScreen;
