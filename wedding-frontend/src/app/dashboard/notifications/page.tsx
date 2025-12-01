"use client";

import { useEffect, useState, useCallback } from "react";
import { useWedding } from "@/contexts/wedding-context";
import { 
  getNotificationDashboard,
  markNotificationRead, 
  markAllNotificationsRead,
  type NotificationFilter,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Notification, NotificationType, NotificationStats } from "@/types";

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  todo_due_soon: <Clock className="h-5 w-5 text-yellow-500" />,
  todo_due_now: <Clock className="h-5 w-5 text-orange-500" />,
  todo_overdue: <Clock className="h-5 w-5 text-red-500" />,
  rsvp_accepted: <UserCheck className="h-5 w-5 text-green-500" />,
  rsvp_declined: <UserX className="h-5 w-5 text-red-500" />,
  reminder: <Bell className="h-5 w-5 text-blue-500" />,
  rsvp_update: <UserCheck className="h-5 w-5 text-blue-500" />,
  payment_due: <Calendar className="h-5 w-5 text-orange-500" />,
  vendor_message: <Bell className="h-5 w-5 text-purple-500" />,
  event_update: <Calendar className="h-5 w-5 text-blue-500" />,
  custom: <Bell className="h-5 w-5 text-gray-500" />,
};

const priorityColors: Record<string, string> = {
  urgent: "border-l-red-500 bg-red-50",
  high: "border-l-orange-500 bg-orange-50",
  normal: "border-l-blue-500",
  low: "border-l-gray-300",
};

const priorityBadgeColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  normal: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-800",
};

function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { selectedWedding } = useWedding();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationFilter>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!selectedWedding) return;
    
    setIsLoading(true);
    try {
      // Single API call for notifications + stats
      const result = await getNotificationDashboard({ 
        wedding: selectedWedding.id,
        is_read: activeTab,
      });

      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWedding, activeTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as NotificationFilter);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
    );
    if (stats) {
      setStats({ ...stats, unread: Math.max(0, stats.unread - 1) });
    }

    const result = await markNotificationRead(notification.id);
    if (!result.success) {
      // Revert on failure
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: false } : n)
      );
      if (stats) {
        setStats({ ...stats, unread: stats.unread + 1 });
      }
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!selectedWedding) return;
    
    setIsMarkingAll(true);
    
    // Optimistic update
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (stats) {
      setStats({ ...stats, unread: 0 });
    }

    const result = await markAllNotificationsRead(selectedWedding.id);
    
    if (!result.success) {
      // Revert on failure
      setNotifications(previousNotifications);
      toast.error("Failed to mark all as read");
    } else {
      toast.success("All notifications marked as read");
    }
    
    setIsMarkingAll(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification);
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const unreadCount = stats?.unread || 0;

  if (!selectedWedding) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a wedding first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your wedding planning activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                  {stats.unread}
                </Badge>
                <div>
                  <p className="text-2xl font-bold">{stats.unread}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.by_type?.todo_overdue || 0}</p>
                  <p className="text-xs text-muted-foreground">Overdue Todos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.by_type?.rsvp_accepted || 0}</p>
                  <p className="text-xs text-muted-foreground">RSVPs Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Notifications</CardTitle>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === "unread" 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-muted/50",
                    priorityColors[notification.priority] || "border-l-gray-300",
                    !notification.is_read && "bg-muted/30"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {notificationIcons[notification.notification_type] || (
                      <Bell className="h-5 w-5 text-gray-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm",
                        !notification.is_read && "font-semibold"
                      )}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", priorityBadgeColors[notification.priority])}
                        >
                          {notification.priority}
                        </Badge>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{notification.time_ago}</span>
                      {notification.related_todo_display && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.related_todo_display}
                        </span>
                      )}
                      {notification.related_guest_display && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {notification.related_guest_display}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
