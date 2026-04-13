// @ts-nocheck
/**
 * ReportsShell.tsx
 *
 * Work Package 1 — Operator Shell + Shadow Mode Shell
 *
 * Structural shell for the Reports operator surface.
 * This is a layout/shell placeholder only.
 * Deep report logic, report-send logic, and report-preview logic
 * are out of scope for this slice and must remain untouched.
 *
 * Acceptance criteria:
 *   - Reports surface is structurally aligned at shell level only
 *   - No protected systems are changed
 *   - No report-send, report-preview, or billing logic is altered
 */
import React from "react";
import { FileText } from "lucide-react";
import {
  OperatorPageFrame,
  OperatorPageHeader,
  ShellEmpty,
} from "@/components/operator-shell";

/**
 * ReportsShell
 * Shell-level Reports surface.
 * Rendered inside the OperatorShell when the "reports" tab is active.
 * Full report content will be wired in a subsequent work package.
 */
export default function ReportsShell() {
  return (
    <OperatorPageFrame>
      <OperatorPageHeader
        title="Reports"
        subtitle="Session reports, intelligence summaries, and delivery records"
        icon={FileText}
        iconColor="text-cyan-400"
      />
      <ShellEmpty
        title="Reports — coming in next slice"
        description="The Reports shell is in place. Full report content, session summaries, and delivery records will be wired in a subsequent work package. No report-send or report-preview logic has been changed."
      />
    </OperatorPageFrame>
  );
}
