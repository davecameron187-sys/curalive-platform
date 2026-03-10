import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, Users, Zap, BarChart2, PieChart, Activity, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from "recharts";

const DAYS_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const BUNDLE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function InterconnectionAnalytics() {
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);

  const { data: adoption } = trpc.interconnectionAnalytics.getAdoptionMetrics.useQuery({ days });
  const { data: topInterconnections } = trpc.interconnectionAnalytics.getTopInterconnections.useQuery();
  const { data: roi } = trpc.interconnectionAnalytics.getROIMetrics.useQuery();
  const { data: workflow } = trpc.interconnectionAnalytics.getWorkflowMetrics.useQuery();
  const { data: segments } = trpc.interconnectionAnalytics.getSegmentMetrics.useQuery();

  const bundlePieData = [
    { name: "Investor Relations", value: 28 },
    { name: "Compliance & Risk", value: 22 },
    { name: "Operations", value: 19 },
    { name: "Content Marketing", value: 15 },
    { name: "Premium", value: 10 },
    { name: "Social Amplification", value: 6 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">Interconnection Analytics</h1>
            <p className="text-xs text-slate-400">Adoption, ROI & workflow metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {DAYS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                days === o.value ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Activations", value: adoption?.totalActivations?.toLocaleString() ?? "–", sub: `${adoption?.dailyAverage ?? "–"}/day avg`, icon: Zap, color: "text-indigo-400" },
            { label: "Avg Connections/User", value: "5.1", sub: "+0.4 vs last period", icon: Users, color: "text-blue-400" },
            { label: "Workflow Completion", value: `${((workflow?.completionRate ?? 0) * 100).toFixed(0)}%`, sub: `of recommended sequences`, icon: Activity, color: "text-emerald-400" },
            { label: "ROI Realized", value: `${roi?.realizedROI?.toFixed(1) ?? "–"}×`, sub: `${((roi?.realizationRate ?? 0) * 100).toFixed(0)}% of projected ${roi?.projectedROI?.toFixed(1) ?? "–"}×`, icon: TrendingUp, color: "text-amber-400" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Adoption Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adoption?.trend && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={adoption.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} tickFormatter={v => v.slice(5)} interval={Math.floor(days / 5)} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="activations" stroke="#6366f1" strokeWidth={2} dot={false} name="Activations" />
                    <Line type="monotone" dataKey="uniqueUsers" stroke="#10b981" strokeWidth={1.5} dot={false} name="Unique Users" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-indigo-500 inline-block" />Activations</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-emerald-500 inline-block" />Unique Users</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" /> Top 10 Interconnections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topInterconnections?.topPairs && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topInterconnections.topPairs} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="pair" tick={{ fontSize: 8, fill: "#94a3b8" }} width={130} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Activations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-400" /> Feature Distribution by Bundle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <RPieChart>
                  <Pie data={bundlePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {bundlePieData.map((_, i) => <Cell key={i} fill={BUNDLE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                </RPieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {bundlePieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: BUNDLE_COLORS[i] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-slate-300 font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> ROI Realization by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roi?.byType && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={roi.byType} margin={{ top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="type" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} domain={[0, 5]} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="projected" fill="#334155" radius={[4, 4, 0, 0]} name="Projected" />
                    <Bar dataKey="realized" fill="#10b981" radius={[4, 4, 0, 0]} name="Realized" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-2 bg-slate-700 rounded inline-block" />Projected</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-2 bg-emerald-500 rounded inline-block" />Realized</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Segment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Segment", "Customers", "Avg Connections", "ROI Realized", "Time to Value", "Status"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {segments?.segments?.map(s => (
                    <tr key={s.name} className="border-b border-slate-800/50">
                      <td className="py-2.5 pr-4 font-medium text-white">{s.name}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{s.count}</td>
                      <td className="py-2.5 pr-4 text-indigo-300">{s.avgConnections}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`font-semibold ${s.roiRealized >= 3 ? "text-emerald-400" : s.roiRealized >= 2 ? "text-amber-400" : "text-slate-400"}`}>
                          {s.roiRealized}×
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-300">{s.timeToValue} days</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.roiRealized >= 3 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                          {s.roiRealized >= 3 ? "On Track" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" /> Workflow Completion — Step Dropout Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {workflow?.dropoffPoints?.map((pt, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300">{pt.step}</span>
                      <span className="text-slate-400">{((1 - pt.dropoff) * 100).toFixed(0)}% continue</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(1 - pt.dropoff) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 mb-2">Top Workflows by Completion</div>
                {workflow?.topWorkflows?.map((wf, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-300">{wf.name}</span>
                    <span className={`text-xs font-semibold ${wf.completion >= 0.7 ? "text-emerald-400" : wf.completion >= 0.6 ? "text-amber-400" : "text-slate-400"}`}>
                      {(wf.completion * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
