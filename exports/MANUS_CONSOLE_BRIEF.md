# MANUS BRIEF: SYSTEM DIAGNOSTICS CONSOLE

## Overview

The **Console** tab (internally `SystemDiagnostics`) is a one-click platform health check that tests every critical subsystem — database, AI pipeline, CIP4 modules, Shadow Guardian, and the tRPC router registry. Operators use it before going live on a session to confirm the platform is fully operational.

---

## Architecture

| Layer | File | Purpose |
|-------|------|---------|
| Frontend | `client/src/components/SystemDiagnostics.tsx` | Single-component tab, 152 lines |
| Backend | `server/routers/systemDiagnosticsRouter.ts` | `runFullDiagnostic` mutation, 155 lines |
| Auth | `adminProcedure` | Only admin/operator users can run diagnostics |
| tRPC path | `trpc.systemDiagnostics.runFullDiagnostic` | Mutation (not query — it's intentionally on-demand) |

---

## What Gets Tested (15 Checks)

| # | Diagnostic Name | What It Does |
|---|----------------|--------------|
| 1 | Database Connection | `SELECT 1` — confirms Postgres is alive |
| 2 | Shadow Sessions Table | Counts total / completed / live / failed sessions |
| 3 | Archive Events Table | Counts archives and how many have AI reports |
| 4 | Crisis Prediction Table | Counts stored CIP4 crisis predictions |
| 5 | Valuation Impact Table | Counts stored CIP4 valuation analyses |
| 6 | Disclosure Certificates Table | Counts CIP4 disclosure certificates |
| 7 | Evolution Audit Trail | Counts CIP4 evolution audit entries |
| 8 | Advisory Bot Messages | Counts advisory chat messages |
| 9 | Monthly Reports Table | Counts generated monthly reports |
| 10 | Tagged Metrics | Counts intelligence-tagged records |
| 11 | Shadow Guardian Service | Calls `reconcileShadowSessions()` — reports in-flight, recovered, failed, active |
| 12 | Recall.ai API Key | Checks `RECALL_AI_API_KEY` env var is set |
| 13 | OpenAI Integration | Sends "Reply with exactly: SYSTEM_OK" to GPT-4o-mini, validates response |
| 14 | tRPC Router Registry | Loads `appRouter`, confirms all 6 CIP4 routers are registered |
| 15 | AI Report Pipeline | Verifies `generateFullAiReport` function is importable |

---

## Response Shape

```typescript
{
  timestamp: string;          // ISO date of run
  summary: {
    total: number;            // Always 15
    passed: number;
    failed: number;
    warned: number;
    overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
    totalDurationMs: number;
  };
  results: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    detail: string;           // Human-readable result message
    durationMs: number;
  }>;
}
```

**Status logic:**
- `failed === 0` → HEALTHY
- `failed <= 2` → DEGRADED
- `failed > 2` → CRITICAL

---

## UI Layout

### Initial State (no results)
- Empty state with Activity icon
- "Click Run Full Diagnostic to test all system components"
- Single CTA button: **Run Full Diagnostic** (Zap icon)

### Running State
- Spinner with "Running 15 diagnostic checks..."
- Button disabled

### Results State

**Summary Cards** — 5-column grid:
| Card | Color | Content |
|------|-------|---------|
| Overall Status | emerald/amber/red | HEALTHY / DEGRADED / CRITICAL |
| Passed | emerald | Count |
| Failed | red | Count |
| Warnings | amber | Count |
| Total Time | slate | Duration in seconds |

**Results List** — vertical stack of 15 rows, each showing:
- Status icon (CheckCircle2 green / XCircle red / AlertTriangle amber)
- Test name (bold)
- Detail string (small, slate-500)
- Duration in ms (right-aligned, monospace)
- Row background color matches status

**Footer:** "Completed at {timestamp}"

---

## Design Tokens

| Element | Class |
|---------|-------|
| Card container | `bg-white/[0.02] border border-white/10 rounded-2xl p-6` |
| Header icon | `bg-indigo-500/10` with `text-indigo-400` |
| Run button | `bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/20` |
| Pass row | `bg-emerald-500/[0.03] border-emerald-500/10` |
| Fail row | `bg-red-500/[0.03] border-red-500/10` |
| Warn row | `bg-amber-500/[0.03] border-amber-500/10` |
| Pass icon | `text-emerald-400` (CheckCircle2) |
| Fail icon | `text-red-400` (XCircle) |
| Warn icon | `text-amber-400` (AlertTriangle) |
| HEALTHY badge | `text-emerald-400 bg-emerald-500/10 border-emerald-500/20` |
| DEGRADED badge | `text-amber-400 bg-amber-500/10 border-amber-500/20` |
| CRITICAL badge | `text-red-400 bg-red-500/10 border-red-500/20` |

---

## Tab Registration in ShadowMode.tsx

```typescript
// Tab definition (line 1135)
onClick={() => setActiveTab("diagnostics")}

// Tab render (line 3318)
{activeTab === "diagnostics" && <SystemDiagnostics />}
```

Tab ID: `"diagnostics"` (part of the `validTabs` array)

---

## Dependencies

| Import | Source |
|--------|--------|
| `trpc` | `@/lib/trpc` |
| `Button` | `@/components/ui/button` (shadcn/ui) |
| Icons | `lucide-react`: Activity, CheckCircle2, XCircle, AlertTriangle, Loader2, Database, Shield, Brain, Clock, Zap, Server |

Backend imports (dynamic, inside mutation):
- `reconcileShadowSessions` from `../services/ShadowModeGuardianService`
- `invokeLLM` from `../_core/llm`
- `appRouter` from `../routers.eager`
- `generateFullAiReport` from `./archiveUploadRouter`

---

## Gotchas for Manus

1. **Auth gate:** Uses `adminProcedure`, not `operatorProcedure`. In dev mode, both auto-authenticate, but in production this requires admin role.
2. **Mutation, not query:** This is a `.useMutation()` call because it's expensive (calls OpenAI, runs Guardian reconciliation). Never auto-run on mount.
3. **Dynamic imports:** Backend uses `await import(...)` for Guardian, LLM, router, and pipeline — this is intentional to avoid circular dependencies.
4. **rawSql pattern:** Uses `rawSql()` which returns `[rows]` — always destructure as `const [rows] = await rawSql(...)`.
5. **No polling/refresh:** Results are one-shot. User must click again to re-run. No auto-refresh interval.
6. **Unused icons:** `Database`, `Shield`, `Brain`, `Clock` are imported but not used in the current template — they were part of an earlier version that showed category headers. Safe to drop.

---

## Source Files

### SystemDiagnostics.tsx (Frontend)

```typescript
// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Database, Shield, Brain, Clock, Zap, Server,
} from "lucide-react";

export default function SystemDiagnostics() {
  const [results, setResults] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runDiagnostic = trpc.systemDiagnostics.runFullDiagnostic.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setRunning(false);
    },
    onError: (err) => {
      setResults({ error: err.message });
      setRunning(false);
    },
  });

  const handleRun = () => {
    setRunning(true);
    setResults(null);
    runDiagnostic.mutate();
  };

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  };

  const overallColor = (status: string) => {
    if (status === "HEALTHY") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "DEGRADED") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Server className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">System Diagnostics</h2>
              <p className="text-sm text-slate-500">Full platform health check — database, AI pipeline, CIP4 modules, Guardian</p>
            </div>
          </div>
          <Button
            onClick={handleRun}
            disabled={running}
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run Full Diagnostic
              </>
            )}
          </Button>
        </div>

        {!results && !running && (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Click "Run Full Diagnostic" to test all system components</p>
            <p className="text-xs text-slate-600 mt-1">Tests database, AI pipeline, CIP4 modules, Guardian service, and router registry</p>
          </div>
        )}

        {running && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-slate-400">Running 15 diagnostic checks...</p>
            <p className="text-xs text-slate-600 mt-1">Testing database, OpenAI, Shadow Guardian, CIP4 tables, and router registry</p>
          </div>
        )}

        {results?.error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">Diagnostic failed: {results.error}</span>
            </div>
          </div>
        )}

        {results?.summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className={`rounded-xl p-4 text-center border ${overallColor(results.summary.overallStatus)}`}>
                <div className="text-xl font-bold">{results.summary.overallStatus}</div>
                <div className="text-[10px] opacity-70">Overall Status</div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-emerald-400">{results.summary.passed}</div>
                <div className="text-[10px] text-slate-500">Passed</div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-red-400">{results.summary.failed}</div>
                <div className="text-[10px] text-slate-500">Failed</div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-amber-400">{results.summary.warned}</div>
                <div className="text-[10px] text-slate-500">Warnings</div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-slate-300">{(results.summary.totalDurationMs / 1000).toFixed(1)}s</div>
                <div className="text-[10px] text-slate-500">Total Time</div>
              </div>
            </div>

            <div className="space-y-2">
              {results.results.map((r: any, i: number) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  r.status === "pass" ? "bg-emerald-500/[0.03] border-emerald-500/10" :
                  r.status === "fail" ? "bg-red-500/[0.03] border-red-500/10" :
                  "bg-amber-500/[0.03] border-amber-500/10"
                }`}>
                  <div className="flex items-center gap-3">
                    {statusIcon(r.status)}
                    <div>
                      <div className="text-sm font-medium text-slate-200">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.detail}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-mono">{r.durationMs}ms</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-slate-600 text-right">
              Completed at {new Date(results.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### systemDiagnosticsRouter.ts (Backend)

```typescript
// @ts-nocheck
import { router, adminProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";

interface DiagnosticResult {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  durationMs: number;
}

async function runDiagnostic(name: string, fn: () => Promise<string>): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, status: "pass", detail, durationMs: Date.now() - start };
  } catch (err: any) {
    return { name, status: "fail", detail: err.message ?? String(err), durationMs: Date.now() - start };
  }
}

export const systemDiagnosticsRouter = router({
  runFullDiagnostic: adminProcedure.mutation(async () => {
    const results: DiagnosticResult[] = [];

    results.push(await runDiagnostic("Database Connection", async () => {
      const db = await getDb();
    const [rows] = await rawSql("SELECT 1 AS ok");
      if (!(rows as any[])[0]?.ok) throw new Error("SELECT 1 returned no result");
      return "Connected and responsive";
    }));

    results.push(await runDiagnostic("Shadow Sessions Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM shadow_sessions`
      );
      const r = (rows as any[])[0];
      return `${r.total} sessions (${r.completed} completed, ${r.live} live, ${r.failed} failed)`;
    }));

    results.push(await runDiagnostic("Archive Events Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN ai_report IS NOT NULL THEN 1 ELSE 0 END) as with_report
         FROM archive_events`
      );
      const r = (rows as any[])[0];
      return `${r.total} archives (${r.with_report} with AI reports)`;
    }));

    results.push(await runDiagnostic("Crisis Prediction Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM crisis_predictions`);
      return `${(rows as any[])[0].total} predictions stored`;
    }));

    results.push(await runDiagnostic("Valuation Impact Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM valuation_impacts`);
      return `${(rows as any[])[0].total} analyses stored`;
    }));

    results.push(await runDiagnostic("Disclosure Certificates Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM disclosure_certificates`);
      return `${(rows as any[])[0].total} certificates stored`;
    }));

    results.push(await runDiagnostic("Evolution Audit Trail", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM evolution_audit_log`);
      return `${(rows as any[])[0].total} audit entries`;
    }));

    results.push(await runDiagnostic("Advisory Bot Messages", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM advisory_chat_messages`);
      return `${(rows as any[])[0].total} messages stored`;
    }));

    results.push(await runDiagnostic("Monthly Reports Table", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM monthly_reports`);
      return `${(rows as any[])[0].total} reports generated`;
    }));

    results.push(await runDiagnostic("Tagged Metrics", async () => {
      const db = await getDb();
    const [rows] = await rawSql(`SELECT COUNT(*) as total FROM tagged_metrics`);
      return `${(rows as any[])[0].total} intelligence records`;
    }));

    results.push(await runDiagnostic("Shadow Guardian Service", async () => {
      const { reconcileShadowSessions } = await import("../services/ShadowModeGuardianService");
      const result = await reconcileShadowSessions();
      return `Reconciliation check: ${result.total} in-flight, ${result.recovered} recovered, ${result.failed} failed, ${result.active} active`;
    }));

    results.push(await runDiagnostic("Recall.ai API Key", async () => {
      if (!process.env.RECALL_AI_API_KEY) throw new Error("RECALL_AI_API_KEY not configured");
      return "Configured";
    }));

    results.push(await runDiagnostic("OpenAI Integration", async () => {
      const { invokeLLM } = await import("../_core/llm");
      const resp = await invokeLLM({
        messages: [{ role: "user", content: "Reply with exactly: SYSTEM_OK" }],
        model: "gpt-4o-mini",
        max_tokens: 10,
      });
      const reply = resp.choices?.[0]?.message?.content?.trim() ?? "";
      if (!reply.includes("SYSTEM_OK")) throw new Error(`Unexpected reply: ${reply}`);
      return "GPT-4o-mini responding correctly";
    }));

    results.push(await runDiagnostic("tRPC Router Registry", async () => {
      const { appRouter } = await import("../routers.eager");
      const procedures = Object.keys((appRouter as any)._def.procedures ?? {});
      const cip4Routers = ["crisisPrediction", "valuationImpact", "disclosureCertificate", "monthlyReport", "advisoryBot", "evolutionAudit"];
      const missing = cip4Routers.filter(r => !procedures.some(p => p.startsWith(r + ".")));
      if (missing.length > 0) throw new Error(`Missing CIP4 routers: ${missing.join(", ")}`);
      return `${procedures.length} procedures registered, all 6 CIP4 routers present`;
    }));

    results.push(await runDiagnostic("AI Report Pipeline (dry check)", async () => {
      const { generateFullAiReport } = await import("./archiveUploadRouter");
      if (typeof generateFullAiReport !== "function") throw new Error("generateFullAiReport not exported");
      return "Pipeline function accessible";
    }));

    const passed = results.filter(r => r.status === "pass").length;
    const failed = results.filter(r => r.status === "fail").length;
    const warned = results.filter(r => r.status === "warn").length;
    const totalDuration = results.reduce((s, r) => s + r.durationMs, 0);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed,
        failed,
        warned,
        overallStatus: failed === 0 ? "HEALTHY" : failed <= 2 ? "DEGRADED" : "CRITICAL",
        totalDurationMs: totalDuration,
      },
      results,
    };
  }),
});
```

---

### END OF CONSOLE BRIEF
