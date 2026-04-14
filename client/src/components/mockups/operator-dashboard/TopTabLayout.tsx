import { useState } from "react";
import {
  Monitor, Phone, Video, Radio, Eye, CreditCard, Shield, Brain,
  Calendar, Users, Clock, ChevronRight, Activity, Mic, Settings,
  Bell, Search, LayoutDashboard, PlayCircle, CheckCircle2, AlertTriangle,
  Headphones, Zap, TrendingUp, FileText, ChevronDown, MoreHorizontal,
  ArrowUpRight, Sparkles
} from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "occ", label: "OCC", icon: Headphones, badge: "1 LIVE" },
  { id: "webcasts", label: "Webcasts", icon: Radio },
  { id: "video", label: "Video Studio", icon: Video },
  { id: "shadow", label: "Shadow Bridge", icon: Eye },
  { id: "ai", label: "AI Intelligence", icon: Brain },
  { id: "guardian", label: "AI Guardian", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

function DashboardView() {
  const events = [
    { time: "09:00", title: "Q1 2026 Earnings Call — Naspers", platform: "OCC Audio", participants: 1247, status: "live" as const, sentiment: 82 },
    { time: "11:30", title: "Annual Investor Day — Sasol", platform: "Webcast", participants: 3500, status: "ready" as const, sentiment: null },
    { time: "14:00", title: "Results Presentation — FirstRand", platform: "Video Webcast", participants: 890, status: "ready" as const, sentiment: null },
    { time: "16:00", title: "Board Strategy Call — Bastion Capital", platform: "Shadow Bridge", participants: 12, status: "idle" as const, sentiment: null },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Events", value: "4", sub: "2 remaining", icon: Calendar, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400", border: "border-blue-500/10" },
          { label: "Active Participants", value: "1,247", sub: "23 joining", icon: Users, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400", border: "border-emerald-500/10" },
          { label: "Platform Health", value: "98%", sub: "All nominal", icon: Activity, gradient: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-400", border: "border-green-500/10" },
          { label: "AI Insights", value: "156", sub: "12 flagged", icon: Sparkles, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-400", border: "border-purple-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 border ${stat.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[11px] text-gray-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#161b28] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Daily Schedule</h3>
            <span className="text-xs text-gray-500 ml-1">March 13, 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Sync from Booking
            </button>
          </div>
        </div>

        {events.map((event, i) => (
          <div key={event.title} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${i < events.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
            <div className="w-14 flex-shrink-0">
              <span className="text-sm font-mono text-gray-500">{event.time}</span>
            </div>

            <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
              event.status === "live" ? "bg-green-500" : event.status === "ready" ? "bg-amber-500/50" : "bg-gray-700"
            }`} />

            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{event.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{event.platform}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {event.participants.toLocaleString()}
                </span>
                {event.sentiment && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {event.sentiment}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {event.status === "live" ? (
                <span className="px-2.5 py-1 bg-green-500/15 text-green-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
                </span>
              ) : event.status === "ready" ? (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium border border-amber-500/10">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />SYNCED
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-gray-500/10 text-gray-500 rounded-lg text-xs font-medium border border-gray-500/10">
                  <Clock className="w-3 h-3 inline mr-1" />PENDING
                </span>
              )}
              <button className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/[0.06]">
                {event.status === "live" ? "Open Console" : "Launch"}
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> AI Alerts
            </h4>
            <span className="text-xs text-purple-400">View all</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-xs border border-emerald-500/10">
              <div className="text-emerald-400 font-medium">Positive Sentiment Spike</div>
              <div className="text-gray-500 mt-0.5">EBITDA beat — audience response +12%</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-xs border border-amber-500/10">
              <div className="text-amber-400 font-medium">Q&A Queue Alert</div>
              <div className="text-gray-500 mt-0.5">7 questions queued, 12 min remaining</div>
            </div>
          </div>
        </div>

        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> System Status
            </h4>
            <span className="text-xs text-cyan-400">98%</span>
          </div>
          <div className="space-y-1.5">
            {[
              { name: "Database", ms: "382ms", ok: true },
              { name: "Twilio", ms: "152ms", ok: true },
              { name: "OpenAI", ms: "507ms", ok: true },
              { name: "Recall.ai", ms: "156ms", ok: false },
              { name: "Ably", ms: "79ms", ok: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-gray-400">{s.name}</span>
                </div>
                <span className={`font-mono ${s.ok ? "text-gray-600" : "text-amber-500"}`}>{s.ms}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Quick Actions
            </h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "New Audio Event", icon: Phone, color: "text-amber-400" },
              { label: "New Webcast", icon: Radio, color: "text-purple-400" },
              { label: "Shadow Mode", icon: Eye, color: "text-indigo-400" },
              { label: "View Reports", icon: TrendingUp, color: "text-emerald-400" },
            ].map((a) => (
              <button key={a.label} className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white transition-all border border-white/[0.04]">
                <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                <span className="flex-1 text-left">{a.label}</span>
                <ArrowUpRight className="w-3 h-3 text-gray-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OCCView() {
  return (
    <div className="space-y-4">
      <div className="bg-[#161b28] rounded-xl border border-green-500/15 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Q1 2026 Earnings Call — Naspers</h3>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3" /> 23m elapsed
                <span className="text-gray-700">·</span>
                <Users className="w-3 h-3" /> 1,247 connected
                <span className="text-gray-700">·</span>
                <Mic className="w-3 h-3" /> 3 speakers
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-green-500/15 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> LIVE
            </span>
            <button className="px-3 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-xs font-medium transition-colors border border-red-500/15">
              End Call
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-white/[0.04]">
          {[
            { label: "Speaking", count: 1, color: "text-green-400", dot: "bg-green-400 animate-pulse" },
            { label: "On Hold", count: 3, color: "text-amber-400", dot: "bg-amber-400" },
            { label: "In Queue", count: 7, color: "text-blue-400", dot: "bg-blue-400" },
            { label: "Listening", count: 1236, color: "text-gray-400", dot: "bg-gray-500" },
          ].map((s) => (
            <div key={s.label} className="py-3 px-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.count.toLocaleString()}</div>
              <div className="text-[11px] text-gray-600 mt-0.5 flex items-center justify-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Live Transcript
          </h4>
          <div className="space-y-2 text-xs max-h-[200px] overflow-auto">
            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400 font-semibold text-[11px]">CEO</span>
                <span className="text-gray-700 text-[10px]">09:23:45</span>
              </div>
              <span className="text-gray-300">Revenue grew 23% year-over-year driven by our e-commerce segment and food delivery operations...</span>
            </div>
            <div className="p-2.5 bg-emerald-500/[0.06] rounded-lg border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 font-semibold text-[11px]">CFO</span>
                <span className="text-gray-700 text-[10px]">09:24:12</span>
                <span className="ml-auto px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">+SENTIMENT</span>
              </div>
              <span className="text-gray-300">EBITDA margin expanded to 34%, exceeding guidance by 200 basis points...</span>
            </div>
          </div>
        </div>

        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> AI Intelligence Feed
          </h4>
          <div className="space-y-2">
            <div className="p-2.5 bg-emerald-500/[0.06] rounded-lg border border-emerald-500/10 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-[11px]">Positive Signal</span>
              </div>
              <div className="text-gray-400">EBITDA margin beat — sentiment spike +12% across audience</div>
            </div>
            <div className="p-2.5 bg-amber-500/[0.06] rounded-lg border border-amber-500/10 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-semibold text-[11px]">Action Needed</span>
              </div>
              <div className="text-gray-400">Q&A queue growing — 7 questions, 12 min left. Suggest analyst priority.</div>
            </div>
            <div className="p-2.5 bg-blue-500/[0.06] rounded-lg border border-blue-500/10 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-semibold text-[11px]">Compliance Clear</span>
              </div>
              <div className="text-gray-400">No forward-looking statement violations detected in this session.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-[#161b28] rounded-xl border border-white/[0.06]">
      <Icon className="w-12 h-12 text-gray-700 mb-3" />
      <h3 className="text-gray-500 text-base font-semibold">{title}</h3>
      <p className="text-gray-600 text-xs mt-1">Select an event or configure settings</p>
    </div>
  );
}

export function TopTabLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="bg-[#141824] border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 h-12">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Monitor className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">CuraLive</span>
            <span className="text-gray-600 text-xs">Operator Console</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 w-48 focus:outline-none focus:border-blue-500/30"
              />
            </div>
            <button className="relative p-1.5 text-gray-500 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">3</span>
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
              DC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0 px-5 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "text-white border-blue-500"
                  : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "occ" && <OCCView />}
        {activeTab === "webcasts" && <PlaceholderView title="Webcasts" icon={Radio} />}
        {activeTab === "video" && <PlaceholderView title="Video Studio" icon={Video} />}
        {activeTab === "shadow" && <PlaceholderView title="Shadow Bridge" icon={Eye} />}
        {activeTab === "ai" && <PlaceholderView title="AI Intelligence" icon={Brain} />}
        {activeTab === "guardian" && <PlaceholderView title="AI Guardian" icon={Shield} />}
        {activeTab === "billing" && <PlaceholderView title="Billing" icon={CreditCard} />}
      </main>
    </div>
  );
}
