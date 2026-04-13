/**
 * OperatorShell.tsx
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 *
 * Top-level operator shell wrapper.
 * Provides: stable top nav, stable shared header, shared page frame,
 * consistent shell spacing/layout treatment.
 *
 * Supports: Overview | Shadow Mode | Reports | Billing | Settings
 *
 * Structural shell only — no backend logic, no workflow wiring.
 */

import React from "react";
import { OperatorTopNav, OperatorTab } from "./OperatorTopNav";

interface OperatorShellProps {
  activeTab: OperatorTab;
  onTabChange: (tab: OperatorTab) => void;
  userName?: string;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onLogin?: () => void;
  children: React.ReactNode;
}

/**
 * OperatorShell
 * The root shell frame for all operator surfaces.
 * Renders the approved top nav and wraps the active page content.
 */
export function OperatorShell({
  activeTab,
  onTabChange,
  userName,
  isAuthenticated,
  onLogout,
  onLogin,
  children,
}: OperatorShellProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <OperatorTopNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        userName={userName}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        onLogin={onLogin}
      />
      <div>{children}</div>
    </div>
  );
}
