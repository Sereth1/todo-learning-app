"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Notification } from "@/types";

interface NotificationStreamState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  error: string | null;
}

interface UseNotificationStreamOptions {
  /**
   * Wedding ID to filter notifications (optional)
   */
  weddingId?: number;
  /**
   * Whether to auto-connect on mount
   * @default true
   */
  autoConnect?: boolean;
  /**
   * Callback when a new notification is received
   */
  onNotification?: (notification: Notification) => void;
  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (isConnected: boolean) => void;
  /**
   * Maximum number of notifications to keep in state
   * @default 50
   */
  maxNotifications?: number;
}

/**
 * Hook for streaming real-time notifications via SSE
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, isConnected } = useNotificationStream({
 *   onNotification: (n) => toast.info(n.title),
 * });
 * ```
 */
export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const {
    weddingId,
    autoConnect = true,
    onNotification,
    onConnectionChange,
    maxNotifications = 50,
  } = options;

  const [state, setState] = useState<NotificationStreamState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    error: null,
  });

  // Use refs for callbacks to avoid recreating connect/disconnect on every render
  const onNotificationRef = useRef(onNotification);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const maxNotificationsRef = useRef(maxNotifications);

  // Keep refs updated
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onConnectionChangeRef.current = onConnectionChange;
    maxNotificationsRef.current = maxNotifications;
  }, [onNotification, onConnectionChange, maxNotifications]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    // Don't connect if already connected
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Use the local Next.js API route (which proxies to backend with httpOnly cookie auth)
    let url = "/api/notifications/stream";
    if (weddingId) {
      url += `?wedding=${weddingId}`;
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[SSE] Connected to notification stream");
        reconnectAttempts.current = 0;
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
        }));
        onConnectionChangeRef.current?.(true);
      };

      // Handle 'connected' event
      eventSource.addEventListener("connected", (event) => {
        console.log("[SSE] Connection confirmed:", event.data);
      });

      // Handle 'notification' event - new notification received
      eventSource.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          console.log("[SSE] New notification:", notification);
          
          setState(prev => ({
            ...prev,
            notifications: [notification, ...prev.notifications].slice(0, maxNotificationsRef.current),
            unreadCount: prev.unreadCount + 1,
          }));
          
          onNotificationRef.current?.(notification);
        } catch (err) {
          console.error("[SSE] Failed to parse notification:", err);
        }
      });

      // Handle 'unread_count' event - periodic count update
      eventSource.addEventListener("unread_count", (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            unreadCount: data.count,
          }));
        } catch (err) {
          console.error("[SSE] Failed to parse unread count:", err);
        }
      });

      // Handle 'heartbeat' event - keep-alive
      eventSource.addEventListener("heartbeat", () => {
        console.log("[SSE] Heartbeat received");
      });

      // Handle 'error' event from server
      eventSource.addEventListener("error", (event) => {
        // Check if it's a MessageEvent with data (server error)
        if (event instanceof MessageEvent && event.data) {
          try {
            const data = JSON.parse(event.data);
            console.error("[SSE] Server error:", data.message);
            setState(prev => ({
              ...prev,
              error: data.message,
            }));
          } catch {
            // Not a JSON message event
          }
        }
      });

      // Handle connection errors
      eventSource.onerror = (err) => {
        console.error("[SSE] Connection error:", err);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
        onConnectionChangeRef.current?.(false);

        // Close and attempt reconnect with exponential backoff
        eventSource.close();
        eventSourceRef.current = null;

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

    } catch (err) {
      console.error("[SSE] Failed to create EventSource:", err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to connect",
        isConnected: false,
      }));
    }
  }, [weddingId]); // Only depend on weddingId, not callbacks

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
    }));
    onConnectionChangeRef.current?.(false);
  }, []); // No dependencies - uses refs

  /**
   * Mark a notification as read (locally)
   * Note: Also call the API to persist this
   */
  const markAsRead = useCallback((notificationId: number) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  /**
   * Mark all notifications as read (locally)
   * Note: Also call the API to persist this
   */
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  }, []);

  /**
   * Clear all notifications from state
   */
  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
    }));
  }, []);

  /**
   * Add notifications to state (e.g., from initial fetch)
   */
  const setNotifications = useCallback((notifications: Notification[]) => {
    setState(prev => ({
      ...prev,
      notifications: notifications.slice(0, maxNotificationsRef.current),
    }));
  }, []);

  /**
   * Set unread count (e.g., from initial fetch)
   */
  const setUnreadCount = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      unreadCount: count,
    }));
  }, []);

  // Auto-connect on mount, reconnect when weddingId changes
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, weddingId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: connect/disconnect are stable now, so we only need weddingId

  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    error: state.error,
    
    // Actions
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount,
  };
}

export default useNotificationStream;
