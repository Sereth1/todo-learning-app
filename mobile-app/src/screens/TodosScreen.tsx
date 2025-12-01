import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'done'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (currentWedding) {
      loadData();
    }
  }, [currentWedding]);

  const loadData = async () => {
    if (!currentWedding) return;
    
    setLoading(true);
    try {
      const [todosData, categoriesData] = await Promise.all([
        weddingApi.getTodos(currentWedding.id, { top_level: 'true' }),
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

  // Filter todos locally
  const filteredTodos = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedFilter) {
      case 'today':
        return todos.filter(t => t.due_date === today && t.status !== 'completed');
      case 'upcoming':
        return todos.filter(t => t.due_date && t.due_date > today && t.status !== 'completed');
      case 'done':
        return todos.filter(t => t.status === 'completed');
      default:
        return todos.filter(t => t.status !== 'completed');
    }
  }, [todos, selectedFilter]);

  // Counts
  const counts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      all: todos.filter(t => t.status !== 'completed').length,
      today: todos.filter(t => t.due_date === today && t.status !== 'completed').length,
      upcoming: todos.filter(t => t.due_date && t.due_date > today && t.status !== 'completed').length,
      done: todos.filter(t => t.status === 'completed').length,
    };
  }, [todos]);

  const handleQuickAdd = async () => {
    if (!newTaskTitle.trim() || !currentWedding) return;

    try {
      await weddingApi.createTodo({
        wedding: currentWedding.id,
        title: newTaskTitle.trim(),
        status: 'not_started',
        priority: 'medium',
      } as TodoCreateData);
      
      setNewTaskTitle('');
      loadData();
    } catch (error: any) {
      console.error('Create todo error:', error);
    }
  };

  const handleCompleteTodo = async (todo: Todo) => {
    try {
      await weddingApi.completeTodo(todo.id);
      loadData();
    } catch (error: any) {
      console.error('Complete todo error:', error);
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
    const colors: Record<string, string> = { 
      low: '#94A3B8', 
      medium: '#3B82F6', 
      high: '#F97316', 
      urgent: '#EF4444' 
    };
    return colors[priority] || '#94A3B8';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderSwipeActions = (todo: Todo) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={styles.swipeDelete} onPress={() => handleDeleteTodo(todo.id)}>
        <Text style={styles.swipeText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.swipeDone} onPress={() => handleCompleteTodo(todo)}>
        <Text style={styles.swipeText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTodo = ({ item }: { item: Todo }) => {
    const isCompleted = item.status === 'completed';
    const dateText = formatDate(item.due_date);
    
    const card = (
      <TouchableOpacity
        style={[styles.card, isCompleted && styles.cardCompleted]}
        activeOpacity={0.7}
        onPress={() => handleCompleteTodo(item)}
        onLongPress={() => {
          if (Platform.OS === 'web' && window.confirm(`Delete "${item.title}"?`)) {
            handleDeleteTodo(item.id);
          }
        }}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isCompleted && styles.cardTitleDone]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.cardMeta}>
            {dateText && (
              <Text style={[styles.metaText, item.is_overdue && styles.metaOverdue]}>
                📅 {dateText}
              </Text>
            )}
            {item.category_name && (
              <View style={[styles.categoryPill, { backgroundColor: item.category_color || '#3B82F6' }]}>
                <Text style={styles.categoryText}>{item.category_name}</Text>
              </View>
            )}
            {item.priority === 'urgent' && <Text style={styles.priorityIcon}>🔥</Text>}
            {item.priority === 'high' && <Text style={styles.priorityIcon}>⚠️</Text>}
          </View>
        </View>

        {/* Priority bar */}
        <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
      </TouchableOpacity>
    );

    if (Platform.OS === 'web') return card;

    return (
      <Swipeable renderRightActions={() => renderSwipeActions(item)} overshootRight={false}>
        {card}
      </Swipeable>
    );
  };

  if (loading && todos.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header - Compact */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerCount}>{counts.all}</Text>
      </View>

      {/* Horizontal Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'today', label: 'Today', count: counts.today },
          { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { key: 'done', label: 'Done', count: counts.done },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, selectedFilter === f.key && styles.filterPillActive]}
            onPress={() => setSelectedFilter(f.key as any)}
          >
            <Text style={[styles.filterLabel, selectedFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
            <Text style={[styles.filterCount, selectedFilter === f.key && styles.filterCountActive]}>
              {f.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredTodos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{selectedFilter === 'done' ? '🎉' : '✨'}</Text>
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'done' ? 'No completed tasks yet' : 'All clear!'}
            </Text>
          </View>
        }
      />

      {/* Quick Add */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.addBar}
      >
        <View style={styles.addInner}>
          <View style={styles.addCircle}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <TextInput
            style={styles.addInput}
            placeholder="Add a task..."
            placeholderTextColor="#94A3B8"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
          {newTaskTitle.length > 0 && (
            <TouchableOpacity style={styles.addSend} onPress={handleQuickAdd}>
              <Text style={styles.addSendIcon}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#3B82F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  // Filters
  filters: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#3B82F6',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginRight: 6,
  },
  filterLabelActive: {
    color: '#FFF',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  filterCountActive: {
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  
  // List
  list: {
    padding: 12,
    paddingBottom: 100,
  },
  
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  priorityIcon: {
    fontSize: 12,
  },
  priorityBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  // Swipe
  swipeActions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  swipeDelete: {
    width: 70,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDone: {
    width: 70,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  
  // Add bar
  addBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  addInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlus: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSendIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TodosScreen;
