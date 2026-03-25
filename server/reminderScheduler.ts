/**
 * reminderScheduler.ts — CuraLive pre-event reminder email scheduler.
 *
 * Runs every 5 minutes and sends reminder emails to registered attendees:
 *   - 24-hour reminder: sent when the event is 23h–25h away
 *   - 1-hour reminder:  sent when the event is 50min–70min away
 *
 * Each reminder is sent at most once per registration (tracked via
 * reminder_24_sent_at / reminder_1_sent_at columns on webcast_registrations).
 *
 * The scheduler is started from server/_core/index.ts after the HTTP server
 * is ready and runs for the lifetime of the process.
 */

import { eq, isNull, and, gte, lte, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { webcastRegistrations, webcastEvents } from "../drizzle/schema";
import { sendEmail, buildReminderEmail } from "./_core/email";

const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Windows around the event start time in which we send each reminder
const WINDOW_24H = { minMs: 23 * 60 * 60 * 1000, maxMs: 25 * 60 * 60 * 1000 };
const WINDOW_1H  = { minMs: 50 * 60 * 1000,       maxMs: 70 * 60 * 1000 };

/**
 * Format a Unix ms timestamp as a human-readable date string (UTC).
 * e.g. "Tuesday, 4 March 2026"
 */
function formatEventDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a Unix ms timestamp as a human-readable time string (UTC).
 * e.g. "14:00 UTC"
 */
function formatEventTime(ms: number): string {
  return (
    new Date(ms).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

/**
 * Build the personal attendee URL for a registration.
 * Falls back to the event's base URL if no token is set.
 */
function buildAttendUrl(origin: string, slug: string, token: string | null): string {
  if (token) {
    return `${origin}/live-video/webcast/${slug}/attend?token=${token}`;
  }
  return `${origin}/live-video/webcast/${slug}/attend`;
}

/**
 * Run one reminder pass: check all upcoming events and send any due reminders.
 * @param origin - The public origin of the app (e.g. "https://curalive.manus.space")
 */
export async function runReminderPass(origin: string): Promise<{
  sent24h: number;
  sent1h: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[ReminderScheduler] Database unavailable — skipping pass");
    return { sent24h: 0, sent1h: 0, errors: 0 };
  }

  const now = Date.now();
  let sent24h = 0;
  let sent1h = 0;
  let errors = 0;

  // Fetch all upcoming/live events that have a startTime set
  const upcomingEvents = await db
    .select()
    .from(webcastEvents)
    .where(
      and(
        isNotNull(webcastEvents.startTime),
        // Only consider events that are scheduled or live (not ended/cancelled)
        // We use a broad filter here; the window check below narrows it further
      )
    );

  for (const event of upcomingEvents) {
    if (!event.startTime) continue;
    // Only process scheduled/live events
    if (!["scheduled", "live", "draft"].includes(event.status ?? "")) continue;

    const msUntilStart = event.startTime - now;

    // ── 24-hour reminder ──────────────────────────────────────────────────────
    if (msUntilStart >= WINDOW_24H.minMs && msUntilStart <= WINDOW_24H.maxMs) {
      // Find registrations that haven't received the 24h reminder yet
      const pending = await db
        .select()
        .from(webcastRegistrations)
        .where(
          and(
            eq(webcastRegistrations.eventId, event.id),
            isNull(webcastRegistrations.reminder24SentAt)
          )
        );

      for (const reg of pending) {
        try {
          const attendUrl = buildAttendUrl(origin, event.slug, reg.attendeeToken ?? null);
          const html = buildReminderEmail({
            firstName: reg.firstName,
            lastName: reg.lastName,
            eventTitle: event.title,
            eventDate: formatEventDate(event.startTime),
            eventTime: formatEventTime(event.startTime),
            attendUrl,
            reminderType: "24h",
          });

          const result = await sendEmail({
            to: reg.email,
            subject: `Reminder: "${event.title}" starts tomorrow`,
            html,
          });

          if (result.success) {
            await db
              .update(webcastRegistrations)
              .set({ reminder24SentAt: Date.now() })
              .where(eq(webcastRegistrations.id, reg.id));
            sent24h++;
            console.log(`[ReminderScheduler] 24h reminder sent → ${reg.email} (event: ${event.slug})`);
          } else {
            console.error(`[ReminderScheduler] 24h reminder failed → ${reg.email}: ${result.error}`);
            errors++;
          }
        } catch (err) {
          console.error(`[ReminderScheduler] Unexpected error for reg ${reg.id}:`, err);
          errors++;
        }
      }
    }

    // ── 1-hour reminder ───────────────────────────────────────────────────────
    if (msUntilStart >= WINDOW_1H.minMs && msUntilStart <= WINDOW_1H.maxMs) {
      const pending = await db
        .select()
        .from(webcastRegistrations)
        .where(
          and(
            eq(webcastRegistrations.eventId, event.id),
            isNull(webcastRegistrations.reminder1SentAt)
          )
        );

      for (const reg of pending) {
        try {
          const attendUrl = buildAttendUrl(origin, event.slug, reg.attendeeToken ?? null);
          const html = buildReminderEmail({
            firstName: reg.firstName,
            lastName: reg.lastName,
            eventTitle: event.title,
            eventDate: formatEventDate(event.startTime),
            eventTime: formatEventTime(event.startTime),
            attendUrl,
            reminderType: "1h",
          });

          const result = await sendEmail({
            to: reg.email,
            subject: `Starting soon: "${event.title}" in 1 hour`,
            html,
          });

          if (result.success) {
            await db
              .update(webcastRegistrations)
              .set({ reminder1SentAt: Date.now() })
              .where(eq(webcastRegistrations.id, reg.id));
            sent1h++;
            console.log(`[ReminderScheduler] 1h reminder sent → ${reg.email} (event: ${event.slug})`);
          } else {
            console.error(`[ReminderScheduler] 1h reminder failed → ${reg.email}: ${result.error}`);
            errors++;
          }
        } catch (err) {
          console.error(`[ReminderScheduler] Unexpected error for reg ${reg.id}:`, err);
          errors++;
        }
      }
    }
  }

  if (sent24h + sent1h + errors > 0) {
    console.log(`[ReminderScheduler] Pass complete — 24h: ${sent24h}, 1h: ${sent1h}, errors: ${errors}`);
  }

  return { sent24h, sent1h, errors };
}

/**
 * Start the reminder scheduler.
 * Runs an initial pass immediately, then repeats every SCHEDULER_INTERVAL_MS.
 * @param origin - The public origin of the app (e.g. "https://curalive.manus.space")
 */
export function startReminderScheduler(origin: string): NodeJS.Timeout {
  console.log(`[ReminderScheduler] Started — interval: ${SCHEDULER_INTERVAL_MS / 1000}s, origin: ${origin}`);

  // Run immediately on startup
  runReminderPass(origin).catch(err =>
    console.error("[ReminderScheduler] Initial pass error:", err)
  );

  // Then repeat on interval
  return setInterval(() => {
    runReminderPass(origin).catch(err =>
      console.error("[ReminderScheduler] Interval pass error:", err)
    );
  }, SCHEDULER_INTERVAL_MS);
}
