// @ts-nocheck
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, roleChangeAuditLog } from "../../drizzle/schema";
import { eq, count, sql } from "drizzle-orm";
import { publishRoleChangeNotification } from "../_core/ably";

export type UserRole = "admin" | "operator" | "moderator" | "user";

export const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  operator: 3,
  moderator: 2,
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

export const moderatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasRole(ctx.user.role as UserRole, "moderator")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Moderator access required" });
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
    .input(z.object({ requiredRole: z.enum(["admin", "operator", "moderator", "user"]) }))
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
      canModerateQA: hasRole(role, "moderator"),
      canApproveQuestions: hasRole(role, "moderator"),
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
      newRole: z.enum(["admin", "operator", "moderator", "user"]),
      reason: z.string().max(512).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [target] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, input.userId));

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const oldRole = target.role as UserRole;

      await db.update(users).set({ role: input.newRole }).where(eq(users.id, input.userId));

      await db.insert(roleChangeAuditLog).values({
        userId: input.userId,
        changedByUserId: ctx.user.id,
        oldRole,
        newRole: input.newRole,
        reason: input.reason ?? null,
      });

      // Fetch target user details for notification
      const [targetUser] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId));

      // Broadcast role change via Ably for real-time toast notification
      if (targetUser?.email) {
        await publishRoleChangeNotification({
          userId: input.userId,
          oldRole,
          newRole: input.newRole,
          changedByName: ctx.user.name || ctx.user.email || "Admin",
          reason: input.reason,
        });
        console.log(`[Role Change] User ${targetUser.name || targetUser.email} promoted from ${oldRole} to ${input.newRole}`);
      }

      return { success: true, userId: input.userId, oldRole, newRole: input.newRole };
    }),

  getRoleStatistics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalUsers: 0, admins: 0, operators: 0, moderators: 0, users: 0 };
    const rows = await db
      .select({ role: users.role, cnt: count() })
      .from(users)
      .groupBy(users.role);
    const stats = { totalUsers: 0, admins: 0, operators: 0, moderators: 0, users: 0 };
    for (const row of rows) {
      stats.totalUsers += Number(row.cnt);
      if (row.role === "admin") stats.admins = Number(row.cnt);
      else if (row.role === "operator") stats.operators = Number(row.cnt);
      else if (row.role === "moderator") stats.moderators = Number(row.cnt);
      else stats.users = Number(row.cnt);
    }
    return stats;
  }),

  getRoleAuditLog: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit ?? 100;

      const rows = await db.execute(sql`
        SELECT
          a.id,
          a.userId,
          a.changedByUserId,
          a.oldRole,
          a.newRole,
          a.reason,
          a.createdAt,
          u1.name  AS userName,
          u1.email AS userEmail,
          u2.name  AS changedByName,
          u2.email AS changedByEmail
        FROM role_change_audit_log a
        LEFT JOIN users u1 ON u1.id = a.userId
        LEFT JOIN users u2 ON u2.id = a.changedByUserId
        ORDER BY a.createdAt DESC
        LIMIT ${limit}
      `);

      return (rows[0] as any[]).map((r: any) => ({
        id: r.id,
        userId: r.userId,
        changedByUserId: r.changedByUserId,
        oldRole: r.oldRole,
        newRole: r.newRole,
        reason: r.reason ?? null,
        createdAt: r.createdAt,
        userName: r.userName ?? "Unknown",
        userEmail: r.userEmail ?? "",
        changedByName: r.changedByName ?? "Unknown",
        changedByEmail: r.changedByEmail ?? "",
      }));
    }),

  bulkImportRoles: adminProcedure
    .input(z.object({
      records: z.array(z.object({
        email: z.string().email(),
        role: z.enum(["user", "moderator", "operator", "admin"]),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const record of input.records) {
        try {
          const [targetUser] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, record.email));

          if (!targetUser) {
            failed++;
            errors.push(`User ${record.email} not found`);
            continue;
          }

          const oldRole = targetUser.role as UserRole;
          if (oldRole === record.role) {
            successful++; // Already has this role, count as success
            continue;
          }

          await db.update(users).set({ role: record.role }).where(eq(users.id, targetUser.id));

          await db.insert(roleChangeAuditLog).values({
            userId: targetUser.id,
            changedByUserId: ctx.user.id,
            oldRole,
            newRole: record.role,
            reason: "Bulk import",
          });

          successful++;
        } catch (err) {
          failed++;
          errors.push(`Error updating ${record.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      if (errors.length > 0 && errors.length <= 5) {
        console.log("[Bulk Import Errors]", errors);
      }

      return { successful, failed, total: input.records.length };
    }),
});
