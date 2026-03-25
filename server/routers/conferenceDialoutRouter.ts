import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createConferenceDialout,
  startDialling,
  getDialoutStatus,
  cancelDialout,
  listDialouts,
} from "../services/ConferenceDialoutService";

const participantSchema = z.object({
  phoneNumber: z.string().min(5, "Phone number too short").max(20, "Phone number too long"),
  label: z.string().max(255).optional(),
});

export const conferenceDialoutRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Conference name is required").max(255),
      callerId: z.string().max(32).optional(),
      participants: z.array(participantSchema).min(1, "At least one participant required").max(200, "Maximum 200 participants"),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createConferenceDialout({
        userId: ctx.user.id,
        name: input.name,
        callerId: input.callerId,
        participants: input.participants,
      });
    }),

  start: protectedProcedure
    .input(z.object({ dialoutId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return await startDialling(input.dialoutId, ctx.user.id);
    }),

  status: protectedProcedure
    .input(z.object({ dialoutId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return await getDialoutStatus(input.dialoutId, ctx.user.id);
    }),

  cancel: protectedProcedure
    .input(z.object({ dialoutId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return await cancelDialout(input.dialoutId, ctx.user.id);
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return await listDialouts(ctx.user.id, input.limit);
    }),
});
