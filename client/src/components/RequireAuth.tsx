import { useAuth } from "@/_core/hooks/useAuth";
import type { ReactNode } from "react";

type RequireAuthProps = {
  children: ReactNode;
  requiredRole?: "viewer" | "operator" | "admin";
  fallback?: ReactNode;
};

const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export default function RequireAuth({
  children,
  requiredRole = "viewer",
  fallback,
}: RequireAuthProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground max-w-md">
          Please sign in to access this page.
        </p>
      </div>
    );
  }

  const userLevel = ROLE_LEVEL[user?.role ?? "viewer"] ?? 1;
  const requiredLevel = ROLE_LEVEL[requiredRole] ?? 1;

  if (userLevel < requiredLevel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to view this page. Required role: {requiredRole}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
