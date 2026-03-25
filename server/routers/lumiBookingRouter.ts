import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { lumiBookingService } from "../services/LumiBookingService";

function assertUser(ctx: any): number {
  if (!ctx.user) throw new Error("Login required");
  return ctx.user.id;
}

export const lumiBookingRouter = router({
  create: publicProcedure
    .input(z.object({
      clientName: z.string().min(1),
      agmTitle: z.string().min(1),
      agmDate: z.string().optional(),
      agmTime: z.string().optional(),
      jurisdiction: z.enum(["south_africa", "united_kingdom", "united_states", "australia", "other"]).default("south_africa"),
      expectedAttendees: z.number().int().optional(),
      meetingUrl: z.string().optional(),
      platform: z.enum(["zoom", "teams", "meet", "webex", "webphone", "other"]).default("zoom"),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      lumiReference: z.string().optional(),
      lumiRecipients: z.string().optional(),
      notes: z.string().optional(),
      resolutionsJson: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      return lumiBookingService.createBooking({ ...input, userId });
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      const userId = assertUser(ctx);
      return lumiBookingService.listBookings(userId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      return lumiBookingService.getBookingById(input.id, userId);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      agmTitle: z.string().optional(),
      agmDate: z.string().optional(),
      agmTime: z.string().optional(),
      jurisdiction: z.enum(["south_africa", "united_kingdom", "united_states", "australia", "other"]).optional(),
      expectedAttendees: z.number().int().optional(),
      meetingUrl: z.string().optional(),
      platform: z.enum(["zoom", "teams", "meet", "webex", "webphone", "other"]).optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      lumiReference: z.string().optional(),
      lumiRecipients: z.string().optional(),
      notes: z.string().optional(),
      resolutionsJson: z.any().optional(),
      status: z.enum(["booked", "setup", "ready", "live", "completed", "cancelled"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const { id, ...updates } = input;
      return lumiBookingService.updateBooking(id, updates, userId);
    }),

  runChecklist: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await lumiBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      return lumiBookingService.runChecklist(input.id);
    }),

  linkSessions: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      shadowSessionId: z.number(),
      agmSessionId: z.number().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await lumiBookingService.getBookingById(input.bookingId, userId);
      if (!booking) throw new Error("Booking not found");
      return lumiBookingService.linkSessions(input.bookingId, input.shadowSessionId, input.agmSessionId);
    }),

  complete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await lumiBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      return lumiBookingService.completeBooking(input.id);
    }),

  sendConfirmation: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = assertUser(ctx);
      const booking = await lumiBookingService.getBookingById(input.id, userId);
      if (!booking) throw new Error("Booking not found");
      const baseUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return lumiBookingService.sendBookingConfirmation(input.id, baseUrl, userId);
    }),

  clientDashboard: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return lumiBookingService.getClientDashboardData(input.token);
    }),
});
