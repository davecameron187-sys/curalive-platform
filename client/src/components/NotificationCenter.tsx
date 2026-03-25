// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  AlertTriangle,
  MessageSquare,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Archive,
  Search,
  Filter,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "compliance" | "qa" | "sentiment" | "engagement" | "system";
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

/**
 * NotificationCenter Component
 * 
 * Real-time notification dashboard with filtering, search,
 * and bulk actions for operators.
 */
export function NotificationCenter({ conferenceId }: { conferenceId: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(
    new Set()
  );

  // Subscribe to notifications
  useAblyChannel(
    `occ:notifications:${conferenceId}`,
    "notification.new",
    useCallback(
      (message: Types.Message) => {
        const notification = message.data;

        setNotifications((prev) => [
          {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            severity: notification.severity,
            timestamp: notification.timestamp,
            read: false,
            actionUrl: notification.actionUrl,
          },
          ...prev,
        ]);

        // Show toast for unread notifications
        toast.info(`${notification.title}: ${notification.message}`);
      },
      [conferenceId]
    )
  );

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      searchQuery === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === null || n.type === selectedType;
    const matchesSeverity =
      selectedSeverity === null || n.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleBulkDelete = () => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedNotifications.has(n.id))
    );
    setSelectedNotifications(new Set());
    toast.success("Notifications deleted");
  };

  const handleBulkMarkAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        selectedNotifications.has(n.id) ? { ...n, read: true } : n
      )
    );
    setSelectedNotifications(new Set());
    toast.success("Notifications marked as read");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "compliance":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "qa":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "sentiment":
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case "engagement":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (severity: string, read: boolean) => {
    if (read) return "bg-secondary/50 opacity-60";

    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500/20";
      case "high":
        return "bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>

        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedType || ""}
            onChange={(e) =>
              setSelectedType(e.target.value === "" ? null : e.target.value)
            }
            className="px-3 py-2 border border-border rounded bg-background text-sm"
          >
            <option value="">All Types</option>
            <option value="compliance">Compliance</option>
            <option value="qa">Q&A</option>
            <option value="sentiment">Sentiment</option>
            <option value="engagement">Engagement</option>
            <option value="system">System</option>
          </select>

          <select
            value={selectedSeverity || ""}
            onChange={(e) =>
              setSelectedSeverity(e.target.value === "" ? null : e.target.value)
            }
            className="px-3 py-2 border border-border rounded bg-background text-sm"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {selectedNotifications.size > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkAsRead}
              >
                Mark {selectedNotifications.size} as read
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
              >
                Delete {selectedNotifications.size}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {notifications.length === 0
                ? "No notifications yet"
                : "No matching notifications"}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 border-l-4 transition-all cursor-pointer hover:shadow-md ${getNotificationColor(notification.severity, notification.read)}`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.has(notification.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newSelected = new Set(selectedNotifications);
                    if (e.target.checked) {
                      newSelected.add(notification.id);
                    } else {
                      newSelected.delete(notification.id);
                    }
                    setSelectedNotifications(newSelected);
                  }}
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <h4 className="font-semibold text-sm">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-foreground mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold capitalize ${
                        notification.severity === "critical"
                          ? "bg-red-500/20 text-red-600"
                          : notification.severity === "high"
                            ? "bg-orange-500/20 text-orange-600"
                            : notification.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {notification.severity}
                    </span>

                    <div className="flex gap-1">
                      {notification.actionUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.actionUrl!;
                          }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-secondary rounded text-center">
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold">{notifications.length}</p>
          </div>
          <div className="p-2 bg-secondary rounded text-center">
            <p className="text-muted-foreground">Unread</p>
            <p className="font-semibold">{unreadCount}</p>
          </div>
          <div className="p-2 bg-secondary rounded text-center">
            <p className="text-muted-foreground">Critical</p>
            <p className="font-semibold">
              {notifications.filter((n) => n.severity === "critical").length}
            </p>
          </div>
          <div className="p-2 bg-secondary rounded text-center">
            <p className="text-muted-foreground">Read</p>
            <p className="font-semibold">
              {notifications.filter((n) => n.read).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
