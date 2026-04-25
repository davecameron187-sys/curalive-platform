import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function CustomerRoute({ children }: Props) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Redirect to="/" />;
  if (user?.role !== "customer") return <Redirect to="/" />;

  return <>{children}</>;
}
