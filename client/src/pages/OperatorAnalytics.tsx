/**
 * OperatorAnalytics — Performance dashboard for operators and admins.
 * Route: /operator/analytics
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  BarChart2, TrendingUp, ArrowLeft, Download, Users,
  Star, Clock, Phone, CheckCircle2, Activity
} from "lucide-react";

function MetricCard({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-500/30 text-blue-400",
    green: "border-emerald-500/30 text-emerald-400",
    amber: "border-amber-500/30 text-amber-400",
    red: "border-red-500/30 text-red-400",
    violet: "border-violet-500/30 text-violet-400",
  };
  return (
    <div className={`bg-slate-800/50 border rounded-lg p-4 ${colors[color]}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min((score / 5) * 100, 100);
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{score.toFixed(1)} / 5.0</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function OperatorAnalytics() {
  const [, navigate] = useLocation();
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);

  const { data: activeSessions } = trpc.trainingMode.getActiveSessions.useQuery();
  const { data: sessionData } = trpc.trainingMode.getSessionMetrics.useQuery(
    { sessionId: activeSessions?.sessions?.[0]?.id ?? 0 },
    { enabled: (activeSessions?.sessions?.length ?? 0) > 0 }
  );

  const sessions = activeSessions?.sessions ?? [];
  const metrics = sessionData?.metrics;

  const mockOperators = [
    { id: 1, name: "Sarah Nkosi", calls: 47, avgDuration: "4m 32s", qualityScore: 4.6, satisfaction: 4.8, overallScore: 4.7, status: "Active" },
    { id: 2, name: "James Dlamini", calls: 38, avgDuration: "5m 10s", qualityScore: 4.2, satisfaction: 4.4, overallScore: 4.3, status: "Active" },
    { id: 3, name: "Thabo Molefe", calls: 29, avgDuration: "6m 05s", qualityScore: 3.9, satisfaction: 4.0, overallScore: 3.95, status: "Training" },
    { id: 4, name: "Priya Naidoo", calls: 52, avgDuration: "3m 48s", qualityScore: 4.8, satisfaction: 4.9, overallScore: 4.85, status: "Active" },
  ];

  function exportCSV() {
    const rows = [
      ["Name", "Calls Handled", "Avg Duration", "Quality Score", "Satisfaction", "Overall Score", "Status"],
      ...mockOperators.map(o => [o.name, o.calls, o.avgDuration, o.qualityScore, o.satisfaction, o.overallScore, o.status]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "operator-performance.csv";
    a.click();
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/occ")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Operator Analytics</h1>
            <p className="text-xs text-slate-400">Performance metrics & training outcomes</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Operators" value={mockOperators.filter(o => o.status === "Active").length} sub="+1 this hour" color="green" />
          <MetricCard label="Active Calls" value={12} sub="+3 this hour" color="blue" />
          <MetricCard label="System Health" value="99.8%" sub="Last 30 days" color="green" />
          <MetricCard label="Avg Response Time" value="2.3s" sub="-0.5s vs yesterday" color="amber" />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Operator Performance Table
            </h2>
            <span className="text-xs text-slate-500">{mockOperators.length} operators</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["Operator", "Calls Handled", "Avg Duration", "Quality", "Satisfaction", "Overall", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockOperators.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOperator(op.id === selectedOperator ? null : op.id)}
                    className={`border-b border-slate-700/30 cursor-pointer transition-colors ${
                      selectedOperator === op.id ? "bg-slate-700/40" : "hover:bg-slate-700/20"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-white">{op.name}</td>
                    <td className="px-4 py-3 text-slate-300">{op.calls}</td>
                    <td className="px-4 py-3 text-slate-300">{op.avgDuration}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${op.qualityScore >= 4.5 ? "text-emerald-400" : op.qualityScore >= 4 ? "text-blue-400" : "text-amber-400"}`}>
                        {op.qualityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${op.satisfaction >= 4.5 ? "text-emerald-400" : op.satisfaction >= 4 ? "text-blue-400" : "text-amber-400"}`}>
                        {op.satisfaction.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${op.overallScore >= 4.5 ? "text-emerald-400" : op.overallScore >= 4 ? "text-blue-400" : "text-amber-400"}`}>
                        {op.overallScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        op.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-violet-500/20 text-violet-300"
                      }`}>
                        {op.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedOperator && (() => {
          const op = mockOperators.find(o => o.id === selectedOperator)!;
          return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{op.name} — Performance Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <ScoreBar label="Call Quality Score" score={op.qualityScore} />
                  <ScoreBar label="Participant Satisfaction" score={op.satisfaction} />
                  <ScoreBar label="Overall Score" score={op.overallScore} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/30 rounded p-3 text-center">
                    <Phone className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{op.calls}</p>
                    <p className="text-xs text-slate-500">Total Calls</p>
                  </div>
                  <div className="bg-slate-700/30 rounded p-3 text-center">
                    <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{op.avgDuration}</p>
                    <p className="text-xs text-slate-500">Avg Duration</p>
                  </div>
                  <div className="bg-slate-700/30 rounded p-3 text-center">
                    <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-400">{op.overallScore.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Overall</p>
                  </div>
                  <div className="bg-slate-700/30 rounded p-3 text-center">
                    <CheckCircle2 className={`w-5 h-5 mx-auto mb-1 ${op.status === "Active" ? "text-emerald-400" : "text-violet-400"}`} />
                    <p className={`text-sm font-bold ${op.status === "Active" ? "text-emerald-400" : "text-violet-400"}`}>{op.status}</p>
                    <p className="text-xs text-slate-500">Status</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {sessions.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Live Training Sessions ({sessions.length} active)
            </h3>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/30 last:border-0">
                  <span className="text-white">{s.operatorName}</span>
                  <span className="text-slate-400">{s.sessionName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">active</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
