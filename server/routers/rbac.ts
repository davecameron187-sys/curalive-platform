// @ts-nocheck
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

export type UserRole = "admin" | "operator" | "user";

export const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  operator: 2,
  user: 1,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasRole(ctx.user.role as UserRole, "operator")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Operator access required" });
  }
  return next({ ctx });
});

export const rbacRouter = router({
  getCurrentRole: protectedProcedure.query(({ ctx }) => ({
    role: ctx.user.role,
    userId: ctx.user.id,
    email: ctx.user.email,
  })),

  hasRole: protectedProcedure
    .input(z.object({ requiredRole: z.enum(["admin", "operator", "user"]) }))
    .query(({ ctx, input }) => ({
      hasRole: hasRole(ctx.user.role as UserRole, input.requiredRole),
      userRole: ctx.user.role,
    })),

  getPermissions: protectedProcedure.query(({ ctx }) => {
    const role = ctx.user.role as UserRole;
    return {
      canViewAdminDashboard: hasRole(role, "admin"),
      canManageUsers: hasRole(role, "admin"),
      canViewComplianceReports: hasRole(role, "admin"),
      canOperateConsole: hasRole(role, "operator"),
      canViewParticipants: hasRole(role, "operator"),
      canModerateQA: hasRole(role, "operator"),
      canApproveQuestions: hasRole(role, "operator"),
      canViewAnalytics: hasRole(role, "operator"),
      canDownloadTranscripts: hasRole(role, "operator"),
      canExportReports: hasRole(role, "admin"),
    };
  }),

  getAllUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        organisation: users.organisation,
        jobTitle: users.jobTitle,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(users.createdAt);
  }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      newRole: z.enum(["admin", "operator", "user"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(users).set({ role: input.newRole }).where(eq(users.id, input.userId));
      return { success: true, userId: input.userId, newRole: input.newRole };
    }),

  getRoleStatistics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalUsers: 0, admins: 0, operators: 0, users: 0 };
    const rows = await db
      .select({ role: users.role, cnt: count() })
      .from(users)
      .groupBy(users.role);
    const stats = { totalUsers: 0, admins: 0, operators: 0, users: 0 };
    for (const row of rows) {
      stats.totalUsers += Number(row.cnt);
      if (row.role === "admin") stats.admins = Number(row.cnt);
      else if (row.role === "operator") stats.operators = Number(row.cnt);
      else stats.users = Number(row.cnt);
    }
    return stats;
  }),
});
