"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Clock, UserCheck, UserX, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getNotificationDashboard,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";
import type { Notification, NotificationType } from "@/types";
import { toast } from "sonner";

interface NotificationBellProps {
  weddingId?: number;
  className?: string;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  todo_due_soon: <Clock className="h-4 w-4 text-yellow-500" />,
  todo_due_now: <Clock className="h-4 w-4 text-orange-500" />,
  todo_overdue: <Clock className="h-4 w-4 text-red-500" />,
  rsvp_accepted: <UserCheck className="h-4 w-4 text-green-500" />,
  rsvp_declined: <UserX className="h-4 w-4 text-red-500" />,
  reminder: <Bell className="h-4 w-4 text-blue-500" />,
  rsvp_update: <UserCheck className="h-4 w-4 text-blue-500" />,
  payment_due: <Calendar className="h-4 w-4 text-orange-500" />,
  vendor_message: <Bell className="h-4 w-4 text-purple-500" />,
  event_update: <Calendar className="h-4 w-4 text-blue-500" />,
  custom: <Bell className="h-4 w-4 text-gray-500" />,
};

const priorityColors: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  normal: "border-l-blue-500",
  low: "border-l-gray-300",
};

export function NotificationBell({ weddingId, className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const lastNotificationIdRef = useRef(0);

  // Load notifications - single API call
  const loadNotifications = useCallback(async () => {
    if (!weddingId) return;

    try {
      // Single API call for notifications + stats
      const result = await getNotificationDashboard({ 
        wedding: weddingId, 
        limit: 10 
      });

      if (result.success && result.data) {
        const { notifications: newNotifs, stats } = result.data;
        
        // Check for new notifications to show toast
        const newUnreadNotifications = newNotifs.filter(
          (n) => n.id > lastNotificationIdRef.current && !n.is_read
        );
        
        if (lastNotificationIdRef.current > 0) {
          // Show toast for new notifications (not on initial load)
          for (const notification of newUnreadNotifications) {
            toast.info(notification.title, {
              description: notification.message,
            });
          }
        }

        // Update last notification ID
        if (newNotifs.length > 0) {
          lastNotificationIdRef.current = Math.max(
            lastNotificationIdRef.current,
            ...newNotifs.map((n) => n.id)
          );
        }

        setNotifications(newNotifs);
        setUnreadCount(stats.unread);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [weddingId]);

  // Initial load and polling
  useEffect(() => {
    loadNotifications();

    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle marking a notification as read
  const handleMarkAsRead = useCallback(
    async (notification: Notification) => {
      if (notification.is_read) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const result = await markNotificationRead(notification.id);
      if (!result.success) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    []
  );

  // Handle marking all as read
  const handleMarkAllAsRead = useCallback(async () => {
    setIsLoading(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    const result = await markAllNotificationsRead(weddingId);
    if (!result.success) {
      // Revert on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      toast.error("Failed to mark all as read");
    } else {
      toast.success("All notifications marked as read");
    }

    setIsLoading(false);
  }, [notifications, unreadCount, weddingId]);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      handleMarkAsRead(notification);

      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
    },
    [handleMarkAsRead]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border-l-4 p-3",
                    priorityColors[notification.priority] || "border-l-gray-300",
                    !notification.is_read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {notificationIcons[notification.notification_type] || (
                      <Bell className="h-4 w-4 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          !notification.is_read && "font-medium"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>

                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {notification.time_ago}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/notifications"
            className="justify-center text-center text-sm text-muted-foreground w-full"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
