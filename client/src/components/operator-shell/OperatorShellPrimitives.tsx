/**
 * OperatorShellPrimitives.tsx
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 *
 * Shared shell-level UI primitives for the CuraLive operator surface.
 * These are structural/layout primitives only.
 * No backend logic, no workflow wiring, no protected system changes.
 */

import React from "react";
import { Loader2, AlertTriangle, InboxIcon } from "lucide-react";

// ─── Shell Page Frame ────────────────────────────────────────────────────────
/**
 * OperatorPageFrame
 * Wraps every operator page with consistent max-width, padding, and spacing.
 */
export function OperatorPageFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Shell Page Header ───────────────────────────────────────────────────────
/**
 * OperatorPageHeader
 * Consistent page-level header used inside each operator surface.
 */
export function OperatorPageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-violet-400",
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Shell Loading State ─────────────────────────────────────────────────────
/**
 * ShellLoading
 * Consistent loading placeholder for operator shell surfaces.
 */
export function ShellLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

// ─── Shell Empty State ───────────────────────────────────────────────────────
/**
 * ShellEmpty
 * Consistent empty-state placeholder for operator shell surfaces.
 */
export function ShellEmpty({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
        <InboxIcon className="w-6 h-6 text-slate-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {description && (
          <p className="text-xs text-slate-600 mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Shell Error State ───────────────────────────────────────────────────────
/**
 * ShellError
 * Consistent error placeholder for operator shell surfaces.
 */
export function ShellError({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-slate-400 hover:text-slate-200 bg-white/[0.04] border border-white/10 px-4 py-2 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Shell Section Divider ───────────────────────────────────────────────────
/**
 * ShellDivider
 * Thin horizontal rule for separating shell sections.
 */
export function ShellDivider() {
  return <div className="border-t border-white/[0.06]" />;
}

// ─── Shell Card ──────────────────────────────────────────────────────────────
/**
 * ShellCard
 * Consistent card container used across operator surfaces.
 */
export function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/[0.02] border border-white/10 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}
