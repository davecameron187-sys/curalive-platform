// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

/**
 * BookingsEnhanced Component
 * 
 * Event creation and management page with database persistence and Ably real-time updates
 */
export default function BookingsEnhanced() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    platform: "zoom",
    eventType: "audio_conference",
  });

  // tRPC mutations
  const createEventMutation = trpc.persistence.postEvent.save.useMutation();

  // Subscribe to real-time event updates
  useAblyChannel(
    "events:updates",
    "event.created",
    useCallback((message: Types.Message) => {
      const eventData = message.data;
      setEvents((prev) => [...prev, eventData]);
      toast.success(`New event created: ${eventData.title}`);
    }, [])
  );

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from database via tRPC
      // For now, use mock data
      const mockEvents = [
        {
          eventId: "q4-earnings-2026",
          title: "Q4 2025 Earnings Call",
          company: "CuraLive",
          platform: "Zoom",
          status: "live",
          attendees: 1247,
          duration: "42:18",
          createdAt: new Date().toISOString(),
        },
        {
          eventId: "investor-day-2026",
          title: "Annual Investor Day",
          company: "CuraLive",
          platform: "Microsoft Teams",
          status: "upcoming",
          attendees: 3500,
          duration: "—",
          createdAt: new Date().toISOString(),
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.company) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Save to database via tRPC
      await createEventMutation.mutateAsync({
        eventId: `event-${Date.now()}`,
        aiSummary: undefined,
        keyTopics: undefined,
        sentimentTrends: undefined,
        keyQuotes: undefined,
        fullTranscript: undefined,
        transcriptFormat: undefined,
        recordingUrl: undefined,
        recordingKey: undefined,
        recordingDurationSeconds: undefined,
        complianceScore: undefined,
        flaggedItems: undefined,
        totalParticipants: undefined,
        totalDuration: undefined,
        engagementScore: undefined,
        analyticsData: JSON.stringify({
          title: formData.title,
          company: formData.company,
          platform: formData.platform,
          eventType: formData.eventType,
        }),
      });

      // Add to local state
      const newEvent = {
        eventId: `event-${Date.now()}`,
        title: formData.title,
        company: formData.company,
        platform: formData.platform,
        status: "upcoming",
        attendees: 0,
        duration: "—",
        createdAt: new Date().toISOString(),
      };

      setEvents((prev) => [newEvent, ...prev]);
      toast.success("Event created successfully!");

      // Reset form
      setFormData({
        title: "",
        company: "",
        platform: "zoom",
        eventType: "audio_conference",
      });
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
    toast.success("Event deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Bookings</h1>
          <p className="text-muted-foreground mt-1">Create and manage your events</p>
        </div>
      </div>

      {/* Create Event Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Event Title *</label>
              <Input
                placeholder="e.g., Q4 2025 Earnings Call"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Company *</label>
              <Input
                placeholder="e.g., CuraLive"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Platform</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                disabled={loading}
              >
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="webex">Webex</option>
                <option value="rtmp">RTMP</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Event Type</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                disabled={loading}
              >
                <option value="audio_conference">Audio Conference</option>
                <option value="video_conference">Video Conference</option>
                <option value="webcast">Webcast</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Events ({events.length})</h2>

        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No events yet. Create your first event above.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.eventId} className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.company}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Platform: {event.platform}</span>
                      <span>Status: {event.status}</span>
                      {event.attendees > 0 && <span>Attendees: {event.attendees}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === "live"
                          ? "bg-red-500/20 text-red-500"
                          : event.status === "upcoming"
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-green-500/20 text-green-500"
                      }`}
                    >
                      {event.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.eventId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
