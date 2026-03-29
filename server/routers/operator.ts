/**
 * Operator Router — Operator Management
 * 
 * Provides tRPC procedures for operator-related operations:
 * - Get available operators for handoff
 * - Get operator status
 * - Get operator list
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, ne, and } from "drizzle-orm";

export const operatorRouter = router({
  /**
   * Get available operators for handoff
   * Returns list of operators (excluding current operator) sorted by availability
   */
  getAvailableOperators: protectedProcedure
    .input(
      z.object({
        excludeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        // Build query to get all operators except current user
        let query = database.select().from(users).where(eq(users.role, "operator"));

        // Exclude current operator if provided
        if (input.excludeId) {
          query = database
            .select()
            .from(users)
            .where(and(eq(users.role, "operator"), ne(users.id, input.excludeId)));
        }

        const result = await query;

        // Map to response format
        return result.map((user: any) => ({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          status: "available", // TODO: Integrate with real operator availability tracking
          lastActive: user.lastSignedIn,
        }));
      } catch (error) {
        console.error("Failed to get available operators:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch available operators",
        });
      }
    }),

  /**
   * Get operator status
   * Returns current status of an operator (available, busy, offline)
   */
  getOperatorStatus: protectedProcedure
    .input(z.object({ operatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        const result = await database.select().from(users).where(eq(users.id, input.operatorId));

        if (!result.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Operator not found",
          });
        }

        const operator = result[0];
        return {
          id: operator.id,
          name: operator.name || operator.email,
          email: operator.email,
          status: "available", // TODO: Integrate with real operator availability tracking
          lastActive: operator.lastSignedIn,
        };
      } catch (error) {
        console.error("Failed to get operator status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch operator status",
        });
      }
    }),

  /**
   * Get all operators
   * Returns list of all operators in the system
   */
  getAllOperators: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection unavailable",
      });
    }

    try {
      const result = await database.select().from(users).where(eq(users.role, "operator"));

      return result.map((user: any) => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        status: "available", // TODO: Integrate with real operator availability tracking
        lastActive: user.lastSignedIn,
      }));
    } catch (error) {
      console.error("Failed to get all operators:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch operators",
      });
    }
  }),
});
