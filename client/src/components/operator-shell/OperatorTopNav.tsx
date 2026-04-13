/**
 * OperatorTopNav.tsx
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 *
 * Shared top navigation bar for the CuraLive operator shell.
 * Approved tabs (fixed — do not rename):
 *   Overview | Shadow Mode | Reports | Billing | Settings
 *
 * Structural shell only — no backend logic.
 */

import React from "react";
import {
  LayoutDashboard,
  Radio,
  FileText,
  Receipt,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react";

// ─── Approved tab IDs and labels (do not rename) ─────────────────────────────
export type OperatorTab =
  | "overview"
  | "shadow-mode"
  | "reports"
  | "billing"
  | "settings";

export const OPERATOR_TAB_CONFIG: {
  id: OperatorTab;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  inactiveColor: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    activeColor: "border-violet-400 text-violet-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "shadow-mode",
    label: "Shadow Mode",
    icon: Radio,
    activeColor: "border-emerald-400 text-emerald-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    activeColor: "border-cyan-400 text-cyan-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "billing",
    label: "Billing",
    icon: Receipt,
    activeColor: "border-green-400 text-green-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    activeColor: "border-slate-400 text-slate-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
];

// ─── OperatorShellHeader ─────────────────────────────────────────────────────
/**
 * OperatorShellHeader
 * The top-level brand/identity bar shared across all operator pages.
 */
export function OperatorShellHeader({
  userName,
  isAuthenticated,
  onLogout,
  onLogin,
}: {
  userName?: string;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onLogin?: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              Cura<span className="text-emerald-400">Live</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
              Operator Console
            </span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
            Real-time investor event intelligence
          </p>
        </div>
      </div>

      {/* Auth actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {userName && (
              <span className="text-xs text-slate-500 hidden lg:block">
                {userName}
              </span>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </button>
        )}
      </div>
    </div>
  );
}

// ─── OperatorTabBar ──────────────────────────────────────────────────────────
/**
 * OperatorTabBar
 * The approved tab navigation row.
 * Renders exactly: Overview | Shadow Mode | Reports | Billing | Settings
 */
export function OperatorTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: OperatorTab;
  onTabChange: (tab: OperatorTab) => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex gap-1 overflow-x-auto">
        {OPERATOR_TAB_CONFIG.map(({ id, label, icon: Icon, activeColor, inactiveColor }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id ? activeColor : inactiveColor
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── OperatorTopNav (combined) ───────────────────────────────────────────────
/**
 * OperatorTopNav
 * Full top navigation block: brand header + tab bar.
 * Used as the single import for the operator shell nav.
 */
export function OperatorTopNav({
  activeTab,
  onTabChange,
  userName,
  isAuthenticated,
  onLogout,
  onLogin,
}: {
  activeTab: OperatorTab;
  onTabChange: (tab: OperatorTab) => void;
  userName?: string;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onLogin?: () => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[#0d0d14]">
      <OperatorShellHeader
        userName={userName}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        onLogin={onLogin}
      />
      <OperatorTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
