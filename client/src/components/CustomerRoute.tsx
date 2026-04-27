import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function CustomerRoute({ children }: Props) {
  const { user, loading } = useAuth();

  console.log("[CustomerRoute]", {
    path: window.location.pathname,
    loading,
    hasUser: Boolean(user),
    role: user?.role,
  });

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!user) return <Redirect to="/sign-in" />;
  if (user.role !== "customer") return <Redirect to="/" />;
  return <>{children}</>;
}
