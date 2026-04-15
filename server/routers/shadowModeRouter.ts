import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { shadowSessions } from "../../drizzle/schema";

const startSessionInput = z.object({
  eventName: z.string().min(1),
  eventType: z.string().min(1),
  platform: z.string().min(1),
  meetingUrl: z.string().url(),
  notes: z.string().optional().nullable(),
});

type ShadowSessionMetadata = {
  eventName: string;
  eventType: string;
  platform: string;
  meetingUrl: string;
  notes: string | null;
  startedAt: string;
};

export const shadowModeRouter = createTRPCRouter({

  startSession: operatorProcedure
    .input(startSessionInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const operatorId = ctx.user?.id;
      if (!operatorId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Operator identity missing",
        });
      }

      const sessionId = randomUUID();
      const now = new Date();
      const metadata: ShadowSessionMetadata = {
        eventName: input.eventName,
        eventType: input.eventType,
        platform: input.platform,
        meetingUrl: input.meetingUrl,
        notes: input.notes ?? null,
        startedAt: now.toISOString(),
      };

      const [created] = await db
        .insert(shadowSessions)
        .values({
          sessionId,
          operatorId,
          status: "active",
          metadata,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          sessionId: shadowSessions.sessionId,
          status: shadowSessions.status,
          createdAt: shadowSessions.createdAt,
        });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create shadow session",
        });
      }

      return {
        sessionId: created.sessionId,
        status: created.status,
        createdAt: created.createdAt,
      };
    }),

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { all: [], active: [], completed: [], failed: [] };

    const operatorId = ctx.user?.id;
    if (!operatorId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User identity missing",
      });
    }

    const rows = await db
      .select({
        id: shadowSessions.id,
        sessionId: shadowSessions.sessionId,
        operatorId: shadowSessions.operatorId,
        status: shadowSessions.status,
        metadata: shadowSessions.metadata,
        createdAt: shadowSessions.createdAt,
        updatedAt: shadowSessions.updatedAt,
      })
      .from(shadowSessions)
      .where(eq(shadowSessions.operatorId, operatorId))
      .orderBy(desc(shadowSessions.createdAt));

    const normalized = rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      operatorId: row.operatorId,
      status: row.status as "active" | "completed" | "failed" | string,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      all: normalized,
      active: normalized.filter((s) => s.status === "active"),
      completed: normalized.filter((s) => s.status === "completed"),
      failed: normalized.filter((s) => s.status === "failed"),
    };
  }),

  getSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid().or(z.string().min(1)),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const operatorId = ctx.user?.id;
      if (!operatorId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User identity missing",
        });
      }

      const [session] = await db
        .select({
          id: shadowSessions.id,
          sessionId: shadowSessions.sessionId,
          operatorId: shadowSessions.operatorId,
          status: shadowSessions.status,
          metadata: shadowSessions.metadata,
          createdAt: shadowSessions.createdAt,
          updatedAt: shadowSessions.updatedAt,
        })
        .from(shadowSessions)
        .where(
          and(
            eq(shadowSessions.sessionId, input.sessionId),
            eq(shadowSessions.operatorId, operatorId),
          ),
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      return {
        id: session.id,
        sessionId: session.sessionId,
        operatorId: session.operatorId,
        status: session.status,
        metadata: session.metadata ?? {},
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    }),
});