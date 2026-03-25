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
