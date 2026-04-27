import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function CustomerRoute({ children }: Props) {
  const { user, loading } = useAuth();

  console.log("[CustomerRoute]", { loading, user });

  if (loading) return null;
  if (!user) return <Redirect to="/sign-in" />;
  if (user.role !== "customer") return <Redirect to="/" />;
  return <>{children}</>;
}
