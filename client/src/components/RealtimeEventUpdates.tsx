// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAblyChannel, useAblyPublish } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { toast } from "sonner";

/**
 * RealtimeEventUpdates Component
 * 
 * Demonstrates real-time event updates using Ably channels.
 * Subscribes to event creation, registration, and post-event data updates.
 */
export function RealtimeEventUpdates({ eventId }: { eventId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [postEventData, setPostEventData] = useState<any>(null);

  // Subscribe to event updates
  useAblyChannel(
    "events:updates",
    "event.created",
    useCallback((message: Types.Message) => {
      const eventData = message.data;
      setEvents((prev) => [...prev, eventData]);
      toast.success(`New event created: ${eventData.title}`);
    }, [])
  );

  // Subscribe to registration updates
  useAblyChannel(
    "registrations:updates",
    "registration.created",
    useCallback((message: Types.Message) => {
      const regData = message.data;
      setRegistrations((prev) => [...prev, regData]);
      toast.info(`New registration: ${regData.name}`);
    }, [])
  );

  // Subscribe to post-event data updates
  useAblyChannel(
    "post_event:updates",
    "post_event.generated",
    useCallback((message: Types.Message) => {
      const postEventInfo = message.data;
      setPostEventData(postEventInfo);
      toast.success(`Post-event data generated for ${postEventInfo.eventId}`);
    }, [])
  );

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Real-Time Event Updates</h3>
        <div className="text-sm text-muted-foreground">
          <p>Events: {events.length}</p>
          <p>Registrations: {registrations.length}</p>
          <p>Post-Event Data: {postEventData ? "Generated" : "Pending"}</p>
        </div>
      </div>

      {events.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Recent Events</h4>
          <div className="space-y-2">
            {events.slice(-3).map((event, idx) => (
              <div key={idx} className="text-sm p-2 bg-background rounded">
                <p className="font-medium">{event.title}</p>
                <p className="text-muted-foreground">{event.company}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {registrations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Recent Registrations</h4>
          <div className="space-y-2">
            {registrations.slice(-3).map((reg, idx) => (
              <div key={idx} className="text-sm p-2 bg-background rounded">
                <p className="font-medium">{reg.name}</p>
                <p className="text-muted-foreground">{reg.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {postEventData && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Post-Event Summary</h4>
          <div className="space-y-2 text-sm">
            {postEventData.aiSummary && (
              <p className="text-muted-foreground">{postEventData.aiSummary}</p>
            )}
            {postEventData.complianceScore && (
              <p>Compliance Score: {postEventData.complianceScore}%</p>
            )}
            {postEventData.engagementScore && (
              <p>Engagement Score: {postEventData.engagementScore}%</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
