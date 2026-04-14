/**
 * WebcastAnalytics.tsx — CuraLive Webcasting Analytics Dashboard
 * Cross-event analytics: attendance, engagement, Q&A, polls, watch time, geography, lead scoring.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, Users, Eye, Clock, MessageSquare,
  Globe, Download, ArrowRight, Calendar, Activity, Zap,
  ChevronUp, ChevronDown, Award, Play, Radio, Video
} from "lucide-react";

// ─── Demo analytics data ──────────────────────────────────────────────────────
const ATTENDANCE_TREND = [
  { month: "Sep 25", events: 3, registrations: 2847, attendees: 1923, avgEngagement: 72 },
  { month: "Oct 25", events: 5, registrations: 4102, attendees: 2841, avgEngagement: 74 },
  { month: "Nov 25", events: 4, registrations: 3654, attendees: 2398, avgEngagement: 78 },
  { month: "Dec 25", events: 2, registrations: 1892, attendees: 1341, avgEngagement: 81 },
  { month: "Jan 26", events: 6, registrations: 5287, attendees: 3812, avgEngagement: 79 },
  { month: "Feb 26", events: 7, registrations: 6841, attendees: 4923, avgEngagement: 83 },
];

const TOP_EVENTS = [
  { title: "National Budget Speech 2026", type: "webcast", vertical: "government", registrations: 24182, attendees: 18432, engagement: 87, questions: 342 },
  { title: "Africa FinTech Summit 2025 — Keynote", type: "virtual_event", vertical: "technology", registrations: 8943, attendees: 5621, engagement: 84, questions: 187 },
  { title: "University of Cape Town — Graduation", type: "virtual_event", vertical: "education", registrations: 13241, attendees: 9872, engagement: 91, questions: 54 },
  { title: "Q4 2025 Earnings Webcast", type: "webcast", vertical: "financial_services", registrations: 3841, attendees: 2847, engagement: 79, questions: 218 },
  { title: "CEO All-Hands Town Hall Q3 2025", type: "webcast", vertical: "corporate_communications", registrations: 1892, attendees: 1243, engagement: 82, questions: 156 },
];

const TOP_COUNTRIES = [
  { country: "South Africa", attendees: 18432, pct: 42 },
  { country: "United Kingdom", attendees: 8921, pct: 20 },
  { country: "United States", attendees: 5432, pct: 12 },
  { country: "Kenya", attendees: 3241, pct: 7 },
  { country: "Nigeria", attendees: 2891, pct: 7 },
  { country: "Ghana", attendees: 1432, pct: 3 },
  { country: "Other", attendees: 3987, pct: 9 },
];

const ENGAGEMENT_BREAKDOWN = [
  { label: "Q&A Participation", value: 34, color: "bg-blue-400", textColor: "text-blue-400" },
  { label: "Poll Voting", value: 28, color: "bg-violet-400", textColor: "text-violet-400" },
  { label: "Chat Messages", value: 19, color: "bg-amber-400", textColor: "text-amber-400" },
  { label: "Resource Downloads", value: 12, color: "bg-emerald-400", textColor: "text-emerald-400" },
  { label: "Replay Views", value: 7, color: "bg-cyan-400", textColor: "text-cyan-400" },
];

const VERTICAL_PERFORMANCE = [
  { vertical: "Financial Services", events: 8, avgAttendance: 2847, avgEngagement: 79, certifications: 0 },
  { vertical: "Corporate Comms", events: 6, avgAttendance: 1243, avgEngagement: 82, certifications: 0 },
  { vertical: "Healthcare", events: 4, avgAttendance: 892, avgEngagement: 76, certifications: 124 },
  { vertical: "Technology", events: 5, avgAttendance: 5621, avgEngagement: 84, certifications: 0 },
  { vertical: "Government", events: 3, avgAttendance: 18432, avgEngagement: 87, certifications: 0 },
  { vertical: "Professional Services", events: 4, avgAttendance: 1105, avgEngagement: 74, certifications: 87 },
  { vertical: "Education", events: 3, avgAttendance: 9872, avgEngagement: 91, certifications: 0 },
];

const DEVICE_BREAKDOWN = [
  { device: "Desktop", pct: 58, color: "bg-primary" },
  { device: "Mobile", pct: 31, color: "bg-amber-400" },
  { device: "Tablet", pct: 8, color: "bg-emerald-400" },
  { device: "Smart TV", pct: 3, color: "bg-violet-400" },
];

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, subValue, color, trend }: {
  icon: any; label: string; value: string; subValue?: string; color: string; trend?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subValue && <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WebcastAnalytics() {
  const [, navigate] = useLocation();
  const [dateRange, setDateRange] = useState("6m");

  const { data: events = [] } = trpc.webcast.listEvents.useQuery({ limit: 50 });

  const totalRegistrations = 24763;
  const totalAttendees = 17832;
  const avgAttendanceRate = Math.round((totalAttendees / totalRegistrations) * 100);
  const totalQuestions = 957;
  const avgEngagement = 83;
  const totalCertifications = 211;

  const maxAttendees = Math.max(...ATTENDANCE_TREND.map(d => d.attendees));

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/live-video/webcasting")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              ← Webcasting Hub
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Analytics Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-1">
              {(["1m", "3m", "6m", "1y"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    dateRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-2 rounded-lg text-xs font-medium hover:text-foreground transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard icon={Users} label="Registrations" value={totalRegistrations.toLocaleString()} subValue="Last 6 months" color="text-blue-400" trend={18} />
          <MetricCard icon={Eye} label="Attendees" value={totalAttendees.toLocaleString()} subValue={`${avgAttendanceRate}% show rate`} color="text-emerald-400" trend={12} />
          <MetricCard icon={Activity} label="Avg Engagement" value={`${avgEngagement}%`} subValue="Industry avg: 64%" color="text-primary" trend={5} />
          <MetricCard icon={MessageSquare} label="Questions" value={totalQuestions.toLocaleString()} subValue="Across all events" color="text-amber-400" trend={23} />
          <MetricCard icon={Award} label="Certifications" value={totalCertifications.toLocaleString()} subValue="CPD/CME issued" color="text-violet-400" trend={31} />
          <MetricCard icon={Clock} label="Avg Watch Time" value="52:14" subValue="vs 41:08 prior period" color="text-cyan-400" trend={27} />
        </div>

        {/* ── Attendance Trend Chart ── */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold">Attendance Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Monthly registrations vs. live attendees</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary/40 inline-block rounded" />Registrations</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Attendees</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48">
            {ATTENDANCE_TREND.map((d, i) => {
              const maxReg = Math.max(...ATTENDANCE_TREND.map(x => x.registrations));
              const regPct = (d.registrations / maxReg) * 100;
              const attPct = (d.attendees / maxReg) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-40">
                    <div
                      className="flex-1 bg-primary/20 border border-primary/30 rounded-t-sm transition-all"
                      style={{ height: `${regPct}%` }}
                    />
                    <div
                      className="flex-1 bg-emerald-400/60 border border-emerald-400/40 rounded-t-sm transition-all"
                      style={{ height: `${attPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{d.month}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-border/50">
            {ATTENDANCE_TREND.map((d, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-semibold">{d.events}</div>
                <div className="text-[9px] text-muted-foreground">events</div>
                <div className="text-xs font-semibold text-emerald-400 mt-0.5">{d.avgEngagement}%</div>
                <div className="text-[9px] text-muted-foreground">engagement</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Events + Engagement Breakdown ── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Top Events */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-bold mb-4">Top Events by Attendance</h2>
            <div className="space-y-3">
              {TOP_EVENTS.map((ev, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{ev.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="capitalize">{ev.type.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span className="capitalize">{ev.vertical.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold">{ev.attendees.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{ev.engagement}% eng.</div>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${(ev.attendees / TOP_EVENTS[0].attendees) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-bold mb-4">Engagement Breakdown</h2>
            <div className="space-y-3">
              {ENGAGEMENT_BREAKDOWN.map(({ label, value, color, textColor }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span className={`font-semibold ${textColor}`}>{value}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Device Breakdown</h3>
              <div className="space-y-2">
                {DEVICE_BREAKDOWN.map(({ device, pct, color }) => (
                  <div key={device} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">{device}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Geography + Vertical Performance ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Geography */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Audience Geography</h2>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {TOP_COUNTRIES.map(({ country, attendees, pct }) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 truncate">{country}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">{attendees.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Performance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-bold mb-4">Performance by Industry</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium pb-2 border-b border-border/50">
                <span>Vertical</span>
                <span className="text-right">Events</span>
                <span className="text-right">Avg Att.</span>
                <span className="text-right">Engagement</span>
              </div>
              {VERTICAL_PERFORMANCE.map(v => (
                <div key={v.vertical} className="grid grid-cols-4 text-xs py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground truncate">{v.vertical}</span>
                  <span className="text-right font-semibold">{v.events}</span>
                  <span className="text-right">{v.avgAttendance.toLocaleString()}</span>
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${v.avgEngagement >= 85 ? "bg-emerald-400" : v.avgEngagement >= 78 ? "bg-primary" : "bg-amber-400"}`}
                        style={{ width: `${v.avgEngagement}%` }}
                      />
                    </div>
                    <span className={`font-semibold ${v.avgEngagement >= 85 ? "text-emerald-400" : v.avgEngagement >= 78 ? "text-primary" : "text-amber-400"}`}>
                      {v.avgEngagement}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Lead Scoring ── */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Lead Intelligence</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                AI-scored attendees based on engagement signals. Export to CRM for follow-up.
              </p>
            </div>
            <button className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export to CRM
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                tier: "Hot Leads",
                count: 127,
                color: "text-red-400",
                bg: "bg-red-400/5 border-red-400/20",
                desc: "Watched >80% · Asked questions · Downloaded resources",
                signals: ["Q&A participation", "Resource download", "Watch time >80%"],
              },
              {
                tier: "Warm Leads",
                count: 384,
                color: "text-amber-400",
                bg: "bg-amber-400/5 border-amber-400/20",
                desc: "Watched >50% · Voted in polls · Engaged in chat",
                signals: ["Poll voting", "Chat engagement", "Watch time >50%"],
              },
              {
                tier: "Cold Leads",
                count: 892,
                color: "text-blue-400",
                bg: "bg-blue-400/5 border-blue-400/20",
                desc: "Registered but watched <20% or did not attend",
                signals: ["Registered", "Low watch time", "No interaction"],
              },
            ].map(({ tier, count, color, bg, desc, signals }) => (
              <div key={tier} className={`border rounded-xl p-4 ${bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{tier}</span>
                  <span className={`text-2xl font-bold ${color}`}>{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
                <div className="space-y-1">
                  {signals.map(s => (
                    <div key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${color.replace("text-", "bg-")}`} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
