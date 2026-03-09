import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { polls, pollOptions, pollVotes } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const pollsRouter = router({
  create: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      question: z.string().min(1),
      pollType: z.enum(["multiple_choice", "rating_scale", "word_cloud", "yes_no"]),
      options: z.array(z.string()).optional(),
      allowMultiple: z.boolean().default(false),
      isAnonymous: z.boolean().default(true),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(polls).values({
        eventId: input.eventId,
        createdBy: ctx.user.id,
        question: input.question,
        pollType: input.pollType,
        allowMultiple: input.allowMultiple,
        isAnonymous: input.isAnonymous,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: "draft",
      });
      const pollId = (result as any).insertId;
      if (input.options && input.options.length > 0) {
        for (let i = 0; i < input.options.length; i++) {
          await db.insert(pollOptions).values({ pollId, optionText: input.options[i], optionOrder: i });
        }
      } else if (input.pollType === "yes_no") {
        await db.insert(pollOptions).values([
          { pollId, optionText: "Yes", optionOrder: 0 },
          { pollId, optionText: "No", optionOrder: 1 },
        ]);
      }
      return { pollId, status: "draft" };
    }),

  update: protectedProcedure
    .input(z.object({
      pollId: z.number(),
      question: z.string().optional(),
      options: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.question) {
        await db.update(polls).set({ question: input.question }).where(eq(polls.id, input.pollId));
      }
      return { updated: true };
    }),

  launch: protectedProcedure
    .input(z.object({ pollId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(polls).set({ status: "active", openedAt: new Date() }).where(eq(polls.id, input.pollId));
      return { launched: true, openedAt: new Date() };
    }),

  close: protectedProcedure
    .input(z.object({ pollId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(polls).set({ status: "closed", closedAt: new Date() }).where(eq(polls.id, input.pollId));
      return { closed: true, closedAt: new Date() };
    }),

  vote: publicProcedure
    .input(z.object({
      pollId: z.number(),
      optionId: z.number().optional(),
      textResponse: z.string().optional(),
      ratingValue: z.number().optional(),
      voterSession: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(pollVotes)
        .where(and(eq(pollVotes.pollId, input.pollId), eq(pollVotes.voterSession, input.voterSession)))
        .limit(1);
      if (existing.length > 0) return { voted: false, reason: "already_voted" };
      await db.insert(pollVotes).values({
        pollId: input.pollId,
        optionId: input.optionId ?? null,
        voterSession: input.voterSession,
        textResponse: input.textResponse ?? null,
        ratingValue: input.ratingValue ?? null,
      });
      return { voted: true };
    }),

  getActive: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(polls)
        .where(and(eq(polls.eventId, input.eventId), eq(polls.status, "active")))
        .orderBy(desc(polls.openedAt))
        .limit(1);
      if (!rows[0]) return null;
      const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, rows[0].id));
      return { poll: rows[0], options };
    }),

  getResults: publicProcedure
    .input(z.object({ pollId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { options: [], totalVotes: 0 };
      const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, input.pollId));
      const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, input.pollId));
      const tallies = options.map(opt => ({
        ...opt,
        votes: votes.filter(v => v.optionId === opt.id).length,
      }));
      return { options: tallies, totalVotes: votes.length };
    }),

  listForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(polls)
        .where(eq(polls.eventId, input.eventId))
        .orderBy(polls.displayOrder);
    }),

  delete: protectedProcedure
    .input(z.object({ pollId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(polls).set({ status: "archived" }).where(eq(polls.id, input.pollId));
      return { deleted: true };
    }),
});
