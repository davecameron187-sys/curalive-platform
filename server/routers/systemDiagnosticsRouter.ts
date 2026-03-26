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
