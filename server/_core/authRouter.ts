/**
 * Auth Router
 * Handles user authentication and logout
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { getUserByOpenId } from "../db";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.user;
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear session cookie
    ctx.res.clearCookie("session");
    return { success: true };
  }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      // Profile update logic would go here
      return { success: true };
    }),
});
