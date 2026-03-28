import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Settings, Users, BarChart3 } from "lucide-react";

/**
 * Admin Dashboard
 * Event management, operator management, analytics, and system settings
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "events" | "operators" | "analytics" | "settings"
  >("events");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage events, operators, and system settings
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <div className="container flex gap-8">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "events"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Events
          </button>
          <button
            onClick={() => setActiveTab("operators")}
            className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "operators"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Operators
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {activeTab === "events" && <EventsTab />}
        {activeTab === "operators" && <OperatorsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

/**
 * Events Management Tab
 */
function EventsTab() {
  const mockEvents = [
    { id: "1", name: "Q4 Earnings Call", status: "live" as const },
    { id: "2", name: "Investor Day", status: "upcoming" as const },
    { id: "3", name: "Board Briefing", status: "completed" as const },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Events</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      <div className="grid gap-4">
        {mockEvents.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">Sample Event</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === "live"
                    ? "bg-red-500/20 text-red-600"
                    : event.status === "upcoming"
                      ? "bg-yellow-500/20 text-yellow-600"
                      : "bg-gray-500/20 text-gray-600"
                }`}
              >
                {event.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Operators Management Tab
 */
function OperatorsTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Operators</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Invite Operator
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">
          Operator management coming soon
        </p>
      </Card>
    </div>
  );
}

/**
 * Analytics Tab
 */
function AnalyticsTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Analytics</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Events</p>
          <p className="text-3xl font-bold text-foreground">24</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Attendees</p>
          <p className="text-3xl font-bold text-foreground">12,547</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Avg Sentiment</p>
          <p className="text-3xl font-bold text-foreground">72%</p>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">
          Detailed analytics dashboard coming soon
        </p>
      </Card>
    </div>
  );
}

/**
 * Settings Tab
 */
function SettingsTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">System Settings</h2>

      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Compliance Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                High Risk Threshold
              </label>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue="75"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Auto-Reject High Risk
              </label>
              <input
                type="checkbox"
                defaultChecked
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Notification Settings
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm text-foreground">
                Email notifications for new events
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm text-foreground">
                Push notifications for high-risk questions
              </span>
            </label>
          </div>
        </Card>

        <Button className="w-full">Save Settings</Button>
      </div>
    </div>
  );
}
