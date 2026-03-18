import { Radio, Play, Globe, Shield, ChevronRight, Activity, Calendar, Users, CheckCircle2, Zap, Upload, BarChart3, Mic, Brain, ArrowRight } from "lucide-react";

function PartnerCard({ name, icon: Icon, color, description, stats, href, badge }: {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  stats: { label: string; value: string }[];
  href: string;
  badge?: string;
}) {
  const colors: Record<string, { bg: string; border: string; text: string; iconBg: string; badgeBg: string }> = {
    cyan: { bg: "bg-cyan-500/5", border: "border-cyan-500/20", text: "text-cyan-400", iconBg: "bg-cyan-500/10", badgeBg: "bg-cyan-500/20" },
    amber: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-400", iconBg: "bg-amber-500/10", badgeBg: "bg-amber-500/20" },
  };
  const c = colors[color] || colors.cyan;

  return (
    <a href={href} className={`group block ${c.bg} border ${c.border} rounded-2xl p-5 hover:bg-opacity-80 transition-all hover:scale-[1.01] cursor-pointer`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{name}</div>
            {badge && (
              <span className={`text-[10px] ${c.text} ${c.badgeBg} px-2 py-0.5 rounded-full font-medium`}>{badge}</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
      <div className="flex gap-4">
        {stats.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`text-lg font-bold ${c.text}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>
    </a>
  );
}

export function WithPartnerCards() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                <h1 className="text-lg font-bold text-white tracking-tight">Shadow Mode</h1>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400/80">
                  Background Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                CuraLive runs silently — clients see nothing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-sm font-semibold px-5 py-2 rounded-lg flex items-center">
                <Play className="w-4 h-4" />
                New Live Event
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-emerald-400 text-emerald-300">
              <Radio className="w-4 h-4" />
              Live Intelligence
            </button>
            <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500">
              <Upload className="w-4 h-4" />
              Archive Upload
            </button>
            <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500">
              <BarChart3 className="w-4 h-4" />
              Archives & Reports
            </button>
            <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500">
              <Mic className="w-4 h-4" />
              Event Recording
            </button>
            <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500">
              <Brain className="w-4 h-4" />
              AI Learning
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Partner Integrations section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-300">Partner Integrations</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PartnerCard
              name="Lumi Global"
              icon={Globe}
              color="cyan"
              description="AGM governance intelligence layer for Lumi-hosted shareholder meetings. Sentiment, compliance, Q&A triage."
              badge="STRATEGIC PARTNER"
              stats={[
                { label: "Active Bookings", value: "3" },
                { label: "Sessions Run", value: "12" },
                { label: "Next AGM", value: "Mar 24" },
              ]}
              href="/lumi"
            />
            <PartnerCard
              name="Bastion"
              icon={Shield}
              color="amber"
              description="Security and compliance testing framework. Penetration testing, vulnerability scanning, audit readiness."
              badge="TESTING"
              stats={[
                { label: "Tests Run", value: "8" },
                { label: "Pass Rate", value: "94%" },
                { label: "Last Scan", value: "2d ago" },
              ]}
              href="/bastion"
            />
          </div>
        </div>

        {/* Active sessions area (placeholder) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-300">Active Sessions</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">2 live</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Session card 1 */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">LIVE</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Sasol Limited — Q4 Results</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Zoom • Started 14 min ago</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">72</div>
                  <div className="text-[10px] text-slate-500">SENTIMENT</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" /> 186 attendees
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 3 resolutions tracked
                </div>
              </div>
            </div>
            {/* Session card 2 */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">LIVE</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">FirstRand Group — AGM 2026</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Teams • Started 42 min ago</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">58</div>
                  <div className="text-[10px] text-slate-500">SENTIMENT</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" /> 312 attendees
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" /> 7 resolutions tracked
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
