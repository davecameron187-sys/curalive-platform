/**
 * operator-shell/index.ts
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 * Barrel export for all operator shell primitives.
 */

export { OperatorShell } from "./OperatorShell";
export {
  OperatorTopNav,
  OperatorTabBar,
  OperatorShellHeader,
  OPERATOR_TAB_CONFIG,
} from "./OperatorTopNav";
export type { OperatorTab } from "./OperatorTopNav";
export {
  OperatorPageFrame,
  OperatorPageHeader,
  ShellLoading,
  ShellEmpty,
  ShellError,
  ShellDivider,
  ShellCard,
} from "./OperatorShellPrimitives";
export {
  ShadowModeShell,
  ShadowModePageHeader,
  ShadowModeWorkstreamNav,
  ShadowModeMainContentFrame,
  ShadowModeQueueRail,
  ShadowModeLandingState,
  SHADOW_MODE_WORKSTREAMS,
} from "./ShadowModeShell";
export type { ShadowModeWorkstream, WorkflowState } from "./ShadowModeShell";
