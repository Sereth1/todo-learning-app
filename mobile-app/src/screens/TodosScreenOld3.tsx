import React, { useEffect, useState } from 'react';
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
  Animated,
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
  const [selectedFilter, setSelectedFilter] = useState<'inbox' | 'today' | 'upcoming'>('inbox');
  const [newTaskTitle, setNewTaskTitle] = useState('');

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
    const colors = { low: '#94A3B8', medium: '#3B82F6', high: '#F97316', urgent: '#EF4444' };
    return colors[priority];
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateText = '';
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = 'Tomorrow';
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      dateText = date.toLocaleDateString('en-US', options);
    }
    
    if (timeString) {
      // Parse time string (HH:MM:SS)
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      dateText += ` at ${displayHour}:${minutes} ${ampm}`;
    }
    
    return dateText;
  };

  const renderSwipeActions = (todo: Todo, dragX: Animated.AnimatedInterpolation<number>) => {
    return (
      <View style={styles.swipeActions}>
        {/* Delete Button on LEFT */}
        <TouchableOpacity
          style={styles.swipeDelete}
          onPress={() => handleDeleteTodo(todo.id)}
        >
          <Text style={styles.swipeIcon}>🗑️</Text>
          <Text style={styles.swipeText}>Delete</Text>
        </TouchableOpacity>
        
        {/* Done Button on RIGHT */}
        <TouchableOpacity
          style={styles.swipeDone}
          onPress={() => handleCompleteTodo(todo)}
        >
          <Text style={styles.swipeIcon}>✓</Text>
          <Text style={styles.swipeText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const dateTime = formatDateTime(item.due_date, item.due_time);
    
    const todoContent = (
      <View style={styles.todoContainer}>
        <TouchableOpacity 
          style={styles.todoRow}
          onLongPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm(`Delete "${item.title}"?`)) {
                handleDeleteTodo(item.id);
              }
            }
          }}
          onPress={() => {
            if (Platform.OS === 'web') {
              handleCompleteTodo(item);
            }
          }}
          activeOpacity={Platform.OS === 'web' ? 0.7 : 1}
        >
          {/* Priority Indicator */}
          <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
          
          <View style={styles.todoContent}>
            {/* Title */}
            <Text style={styles.todoTitle} numberOfLines={2}>
              {item.title}
            </Text>
            
            {/* Description */}
            {item.description && (
              <Text style={styles.todoDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            
            {/* Meta Info */}
            <View style={styles.todoMeta}>
              {/* Date & Time */}
              {dateTime && (
                <View style={[styles.metaChip, item.is_overdue && styles.metaChipOverdue]}>
                  <Text style={[styles.metaChipText, item.is_overdue && styles.metaChipTextOverdue]}>
                    📅 {dateTime}
                  </Text>
                </View>
              )}
              
              {/* Category */}
              {item.category_name && (
                <View style={[styles.metaChip, { backgroundColor: item.category_color || '#3B82F6' }]}>
                  <Text style={styles.metaChipTextWhite}>
                    {item.category_name}
                  </Text>
                </View>
              )}
              
              {/* Priority Badge */}
              {(item.priority === 'high' || item.priority === 'urgent') && (
                <View style={[styles.metaChip, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.metaChipTextWhite}>
                    {item.priority === 'urgent' ? '🔥 Urgent' : '⚠️ High'}
                  </Text>
                </View>
              )}
              
              {/* Subtasks */}
              {item.subtask_count.total > 0 && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    ✓ {item.subtask_count.completed}/{item.subtask_count.total}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );

    // Web: Just show the card (click to complete, long press to delete)
    if (Platform.OS === 'web') {
      return todoContent;
    }

    // Mobile: Use swipeable
    return (
      <Swipeable
        renderRightActions={(_, dragX) => renderSwipeActions(item, dragX)}
        overshootRight={false}
        friction={2}
      >
        {todoContent}
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
        <Text style={styles.headerSubtitle}>
          {counts.inbox} tasks • {counts.today} today
        </Text>
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
            <View style={styles.filterTextContainer}>
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
        <View style={styles.quickAddCheckbox}>
          <Text style={styles.quickAddPlus}>+</Text>
        </View>
        
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  filterBtnActive: {
    backgroundColor: '#3B82F6',
  },
  filterIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  filterTextContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 1,
  },
  filterCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  todoWrapper: {
    marginBottom: 12,
  },
  todoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  todoRow: {
    flexDirection: 'row',
  },
  priorityBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  todoContent: {
    flex: 1,
    padding: 16,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 6,
  },
  todoDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  todoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  metaChipOverdue: {
    backgroundColor: '#FEE2E2',
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  metaChipTextOverdue: {
    color: '#DC2626',
  },
  metaChipTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  swipeActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  swipeDelete: {
    width: 90,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDone: {
    width: 90,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    color: '#0F172A',
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
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  quickAddCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickAddPlus: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -2,
  },
  quickAddInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
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
    marginTop: -2,
  },
});

export default TodosScreen;
