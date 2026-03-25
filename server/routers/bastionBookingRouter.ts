// @ts-nocheck
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { bastionBookingService } from "../services/BastionBookingService";

function assertUser(ctx: any): number {
  if (!ctx.user) throw new Error("Login required");
  return ctx.user.id;
}

export const bastionBookingRouter = router({
  create: publicProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventTitle: z.string().min(1),
      eventType: z.enum(["earnings_call", "agm", "investor_day", "roadshow", "capital_markets_day", "special_call", "other"]).default("earnings_call"),
      eventDate: z.string().optional(),
      eventTime: z.string().optional(),
      sector: z.string().optional(),
      ticker: z.string().optional(),
      expectedAttendees: z.number().int().optional(),
      meetingUrl: z.string().optional(),
      platform: z.enum(["zoom", "teams", "meet", "webex", "webphone", "other"]).default("zoom"),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      bastionReference: z.string().optional(),
      confirmationRecipients: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      return bastionBookingService.createBooking({ ...input, userId });
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      const userId = assertUser(ctx);
      return bastionBookingService.listBookings(userId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      return bastionBookingService.getBookingById(input.id, userId);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      eventTitle: z.string().optional(),
      eventType: z.enum(["earnings_call", "agm", "investor_day", "roadshow", "capital_markets_day", "special_call", "other"]).optional(),
      eventDate: z.string().optional(),
      eventTime: z.string().optional(),
      sector: z.string().optional(),
      ticker: z.string().optional(),
      expectedAttendees: z.number().int().optional(),
      meetingUrl: z.string().optional(),
      platform: z.enum(["zoom", "teams", "meet", "webex", "webphone", "other"]).optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      bastionReference: z.string().optional(),
      confirmationRecipients: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["booked", "setup", "ready", "live", "completed", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const { id, ...updates } = input;
      return bastionBookingService.updateBooking(id, updates, userId);
    }),

  runChecklist: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await bastionBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      return bastionBookingService.runChecklist(input.id);
    }),

  linkSessions: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      shadowSessionId: z.number(),
      bastionSessionId: z.number().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await bastionBookingService.getBookingById(input.bookingId, userId);
      if (!booking) throw new Error("Booking not found");
      return bastionBookingService.linkSessions(input.bookingId, input.shadowSessionId, input.bastionSessionId);
    }),

  complete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await bastionBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      return bastionBookingService.updateBooking(input.id, { status: "completed" }, userId);
    }),

  sendConfirmation: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await bastionBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      const baseUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return bastionBookingService.sendBookingConfirmation(input.id, baseUrl, userId);
    }),

  clientDashboard: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return bastionBookingService.getClientDashboardData(input.token);
    }),
});
