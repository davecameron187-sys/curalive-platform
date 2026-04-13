/**
 * ShadowModeShell.tsx
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 *
 * Structural shell for the Shadow Mode operator workbench.
 *
 * Provides:
 *   - Shadow Mode page entry
 *   - Shadow Mode page header
 *   - Workstream navigation (Prepare | Capture | Understand | Deliver)
 *   - Main content frame
 *   - Right-side queue/action rail container
 *   - Shell landing state when no active/live context is available
 *
 * This is structural shell work only.
 * Full workstream behaviour wiring is out of scope for this slice.
 * Do not add extra workstreams, tabs, or AI surfaces here.
 */

import React from "react";
import {
  Radio,
  ClipboardList,
  Mic,
  Brain,
  Send,
  EyeOff,
} from "lucide-react";
import { ShellEmpty } from "./OperatorShellPrimitives";

// ─── Approved workstream IDs and labels (do not rename) ──────────────────────
export type ShadowModeWorkstream =
  | "prepare"
  | "capture"
  | "understand"
  | "deliver";

export const SHADOW_MODE_WORKSTREAMS: {
  id: ShadowModeWorkstream;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  inactiveColor: string;
}[] = [
  {
    id: "prepare",
    label: "Prepare",
    icon: ClipboardList,
    activeColor: "border-violet-400 text-violet-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "capture",
    label: "Capture",
    icon: Mic,
    activeColor: "border-emerald-400 text-emerald-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "understand",
    label: "Understand",
    icon: Brain,
    activeColor: "border-cyan-400 text-cyan-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
  {
    id: "deliver",
    label: "Deliver",
    icon: Send,
    activeColor: "border-amber-400 text-amber-300",
    inactiveColor: "border-transparent text-slate-500 hover:text-slate-300",
  },
];

// ─── Approved workflow states (do not rename) ─────────────────────────────────
export type WorkflowState =
  | "upcoming"
  | "live"
  | "processing"
  | "review-action"
  | "completed-carried-forward";

// ─── ShadowModePageHeader ────────────────────────────────────────────────────
/**
 * ShadowModePageHeader
 * The page-level header for the Shadow Mode workbench.
 * Shown when Shadow Mode is not embedded inside the Dashboard shell.
 */
export function ShadowModePageHeader({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">Shadow Mode</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Operator Workbench
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            CuraLive runs silently — clients see nothing
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ─── ShadowModeWorkstreamNav ─────────────────────────────────────────────────
/**
 * ShadowModeWorkstreamNav
 * The approved workstream navigation bar.
 * Renders exactly: Prepare | Capture | Understand | Deliver
 */
export function ShadowModeWorkstreamNav({
  activeWorkstream,
  onWorkstreamChange,
}: {
  activeWorkstream: ShadowModeWorkstream;
  onWorkstreamChange: (ws: ShadowModeWorkstream) => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[#0d0d14]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto">
          {SHADOW_MODE_WORKSTREAMS.map(
            ({ id, label, icon: Icon, activeColor, inactiveColor }) => (
              <button
                key={id}
                onClick={() => onWorkstreamChange(id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeWorkstream === id ? activeColor : inactiveColor
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ShadowModeLandingState ──────────────────────────────────────────────────
/**
 * ShadowModeLandingState
 * Shell landing state shown when no active/live context is available.
 * Structural placeholder only — no workflow wiring.
 */
export function ShadowModeLandingState({
  onStartCapture,
}: {
  onStartCapture?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <EyeOff className="w-8 h-8 text-emerald-400/60" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-200">
          No active event context
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Shadow Mode is ready. Start a live capture session or select an event
          to begin working.
        </p>
      </div>
      {onStartCapture && (
        <button
          onClick={onStartCapture}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          <Mic className="w-4 h-4" />
          Start Capture
        </button>
      )}
    </div>
  );
}

// ─── ShadowModeMainContentFrame ──────────────────────────────────────────────
/**
 * ShadowModeMainContentFrame
 * The main content area of the Shadow Mode workbench.
 * Renders the active workstream content.
 */
export function ShadowModeMainContentFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      {children}
    </div>
  );
}

// ─── ShadowModeQueueRail ─────────────────────────────────────────────────────
/**
 * ShadowModeQueueRail
 * Right-side queue/action rail container.
 * Structural shell only — content is wired in later slices.
 */
export function ShadowModeQueueRail({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="w-80 shrink-0 border-l border-white/10 bg-[#0d0d14] flex flex-col">
      {children ?? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShellEmpty
            title="Queue empty"
            description="Actions and queued items will appear here during an active event."
          />
        </div>
      )}
    </div>
  );
}

// ─── ShadowModeShell ─────────────────────────────────────────────────────────
/**
 * ShadowModeShell
 * Full structural shell for the Shadow Mode workbench.
 *
 * Layout:
 *   [page header — when not embedded]
 *   [workstream nav: Prepare | Capture | Understand | Deliver]
 *   [main content frame] | [right-side queue/action rail]
 *
 * Props:
 *   embedded        — true when rendered inside the Dashboard operator shell
 *   activeWorkstream — currently selected workstream
 *   onWorkstreamChange — workstream switch handler
 *   hasActiveContext — whether a live/active event context exists
 *   onStartCapture  — handler for the landing-state CTA
 *   headerActions   — optional actions for the page header
 *   mainContent     — content for the main frame (workstream body)
 *   railContent     — content for the right-side queue/action rail
 */
export function ShadowModeShell({
  embedded = false,
  activeWorkstream,
  onWorkstreamChange,
  hasActiveContext = false,
  onStartCapture,
  headerActions,
  mainContent,
  railContent,
}: {
  embedded?: boolean;
  activeWorkstream: ShadowModeWorkstream;
  onWorkstreamChange: (ws: ShadowModeWorkstream) => void;
  hasActiveContext?: boolean;
  onStartCapture?: () => void;
  headerActions?: React.ReactNode;
  mainContent?: React.ReactNode;
  railContent?: React.ReactNode;
}) {
  return (
    <div
      className={
        embedded
          ? "bg-[#0a0a0f] text-white flex flex-col"
          : "min-h-screen bg-[#0a0a0f] text-white flex flex-col"
      }
    >
      {/* Page header — only shown when not embedded in the operator shell */}
      {!embedded && (
        <div className="border-b border-white/10 bg-[#0d0d14]">
          <ShadowModePageHeader actions={headerActions} />
        </div>
      )}

      {/* Workstream navigation */}
      <ShadowModeWorkstreamNav
        activeWorkstream={activeWorkstream}
        onWorkstreamChange={onWorkstreamChange}
      />

      {/* Body: main content frame + right-side queue/action rail */}
      <div className="flex flex-1 overflow-hidden">
        <ShadowModeMainContentFrame>
          {hasActiveContext ? (
            mainContent ?? (
              <div className="max-w-7xl mx-auto px-6 py-8">
                <ShellEmpty
                  title={`${
                    SHADOW_MODE_WORKSTREAMS.find(
                      (w) => w.id === activeWorkstream
                    )?.label ?? activeWorkstream
                  } — coming in next slice`}
                  description="This workstream shell is ready. Full behaviour will be wired in a subsequent work package."
                />
              </div>
            )
          ) : (
            <ShadowModeLandingState onStartCapture={onStartCapture} />
          )}
        </ShadowModeMainContentFrame>

        <ShadowModeQueueRail>{railContent}</ShadowModeQueueRail>
      </div>
    </div>
  );
}
