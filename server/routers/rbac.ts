import { protectedProcedure, publicProcedure } from "@/server/_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Role-Based Access Control (RBAC) Router
 * 
 * Provides procedures for managing user roles and permissions.
 * Supports roles: admin, operator, moderator, user
 */

// Define role hierarchy
export type UserRole = "admin" | "operator" | "moderator" | "user";

export const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  operator: 3,
  moderator: 2,
  user: 1,
};

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Admin-only procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

/**
 * Operator-only procedure (admin + operator)
 */
export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasRole(ctx.user.role, "operator")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Operator access required",
    });
  }
  return next({ ctx });
});

/**
 * Moderator-only procedure (admin + operator + moderator)
 */
export const moderatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasRole(ctx.user.role, "moderator")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Moderator access required",
    });
  }
  return next({ ctx });
});

/**
 * RBAC Router
 */
export const rbacRouter = {
  /**
   * Get current user role
   */
  getCurrentRole: protectedProcedure.query(({ ctx }) => ({
    role: ctx.user.role,
    userId: ctx.user.id,
    email: ctx.user.email,
  })),

  /**
   * Check if user has specific role
   */
  hasRole: protectedProcedure
    .input(z.object({ requiredRole: z.enum(["admin", "operator", "moderator", "user"]) }))
    .query(({ ctx, input }) => ({
      hasRole: hasRole(ctx.user.role, input.requiredRole),
      userRole: ctx.user.role,
    })),

  /**
   * Get role permissions
   */
  getPermissions: protectedProcedure.query(({ ctx }) => {
    const role = ctx.user.role;
    const permissions = {
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
    return permissions;
  }),

  /**
   * Admin: Get all users with roles
   */
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    // This would fetch from database
    // For now, return mock data
    return [
      {
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin" as UserRole,
      },
      {
        id: 2,
        email: "operator@example.com",
        name: "Operator User",
        role: "operator" as UserRole,
      },
      {
        id: 3,
        email: "moderator@example.com",
        name: "Moderator User",
        role: "moderator" as UserRole,
      },
    ];
  }),

  /**
   * Admin: Update user role
   */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        newRole: z.enum(["admin", "operator", "moderator", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would update the database
      // For now, return success
      return {
        success: true,
        userId: input.userId,
        newRole: input.newRole,
        message: `User role updated to ${input.newRole}`,
      };
    }),

  /**
   * Admin: Get role statistics
   */
  getRoleStatistics: adminProcedure.query(async ({ ctx }) => {
    // This would aggregate from database
    return {
      totalUsers: 42,
      admins: 2,
      operators: 8,
      moderators: 12,
      users: 20,
    };
  }),
};
