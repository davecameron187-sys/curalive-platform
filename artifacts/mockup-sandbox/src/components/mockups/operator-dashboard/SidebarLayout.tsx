import { useState } from "react";
import {
  Monitor, Phone, Video, Radio, Eye, CreditCard, Shield, Brain,
  Calendar, Users, Clock, ChevronRight, Activity, Mic, Settings,
  Bell, Search, LayoutDashboard, PlayCircle, CheckCircle2, AlertTriangle,
  Headphones, Zap, TrendingUp, FileText
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
  { id: "occ", label: "OCC", icon: Headphones, color: "from-amber-500 to-orange-500", badge: "LIVE" },
  { id: "webcasts", label: "Webcasts", icon: Radio, color: "from-purple-500 to-pink-500" },
  { id: "video", label: "Video Studio", icon: Video, color: "from-emerald-500 to-teal-500" },
  { id: "shadow", label: "Shadow Bridge", icon: Eye, color: "from-indigo-500 to-violet-500" },
  { id: "ai", label: "AI Intelligence", icon: Brain, color: "from-rose-500 to-pink-500" },
  { id: "guardian", label: "AI Guardian", icon: Shield, color: "from-cyan-500 to-blue-500" },
  { id: "billing", label: "Billing", icon: CreditCard, color: "from-slate-500 to-gray-500" },
];

function StatusDot({ status }: { status: "live" | "ready" | "idle" }) {
  const colors = { live: "bg-green-400 animate-pulse", ready: "bg-amber-400", idle: "bg-gray-500" };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
}

function DashboardView() {
  const events = [
    { time: "09:00", title: "Q1 2026 Earnings Call — Naspers", platform: "OCC", participants: 1247, status: "live" as const },
    { time: "11:30", title: "Annual Investor Day — Sasol", platform: "Webcast", participants: 3500, status: "ready" as const },
    { time: "14:00", title: "Results Presentation — FirstRand", platform: "Video", participants: 890, status: "ready" as const },
    { time: "16:00", title: "Board Strategy Call — Bastion Capital", platform: "Shadow", participants: 12, status: "idle" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Events Today", value: "4", sub: "2 remaining", icon: Calendar, color: "text-blue-400" },
          { label: "Active Participants", value: "1,247", sub: "+23 joining", icon: Users, color: "text-emerald-400" },
          { label: "Platform Health", value: "98%", sub: "All systems nominal", icon: Activity, color: "text-green-400" },
          { label: "AI Insights Today", value: "156", sub: "12 critical", icon: Zap, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.sub}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1f2e] rounded-xl border border-white/5">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Today's Schedule — March 13, 2026
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors">
              Sync All Events
            </button>
            <button className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
              Refresh
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {events.map((event) => (
            <div key={event.title} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-16 text-center">
                <div className="text-sm font-mono text-gray-400">{event.time}</div>
              </div>
              <StatusDot status={event.status} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{event.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{event.platform} · {event.participants.toLocaleString()} participants</div>
              </div>
              <div className="flex items-center gap-2">
                {event.status === "live" ? (
                  <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
                  </span>
                ) : event.status === "ready" ? (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">READY</span>
                ) : (
                  <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">SCHEDULED</span>
                )}
                <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors">
                  {event.status === "live" ? "Open" : "Launch"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Live Sentiment
          </h3>
          <div className="space-y-3">
            {[
              { label: "Naspers Q1 Call", score: 78, trend: "+3" },
              { label: "Overall Platform", score: 85, trend: "+1" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-emerald-400">{s.score}% <span className="text-emerald-500">↑{s.trend}</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: `${s.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            System Health
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Database", ok: true },
              { name: "Twilio", ok: true },
              { name: "OpenAI", ok: true },
              { name: "Ably", ok: true },
              { name: "Recall.ai", ok: false },
              { name: "Mux", ok: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-green-400" : "bg-amber-400"}`} />
                <span className={s.ok ? "text-gray-400" : "text-amber-400"}>{s.name}</span>
              </div>
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
      <div className="bg-[#1a1f2e] rounded-xl border border-green-500/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Q1 2026 Earnings Call — Naspers</h3>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Started 23m ago</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 1,247 connected</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> 3 speakers</span>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> LIVE
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Speaking", count: 1, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "On Hold", count: 3, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "In Queue", count: 7, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Listening", count: 1236, color: "text-gray-400", bg: "bg-gray-500/10" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.count.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Live Transcript
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-white/5 rounded-lg">
              <span className="text-blue-400 font-medium">CEO:</span>
              <span className="text-gray-300 ml-1">Revenue grew 23% year-over-year driven by our e-commerce segment...</span>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <span className="text-blue-400 font-medium">CEO:</span>
              <span className="text-gray-300 ml-1">We're confident in our ability to maintain this trajectory through Q2...</span>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-400 font-medium">CFO:</span>
              <span className="text-gray-300 ml-1">EBITDA margin expanded to 34%, exceeding guidance by 200 basis points...</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            AI Insights
          </h4>
          <div className="space-y-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs">
              <div className="text-emerald-400 font-medium mb-0.5">Positive Signal Detected</div>
              <div className="text-gray-400">EBITDA margin beat expectations — sentiment spike +12%</div>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs">
              <div className="text-amber-400 font-medium mb-0.5">Q&A Queue Growing</div>
              <div className="text-gray-400">7 questions pending · 12 min remaining · AI suggests prioritising analysts</div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs">
              <div className="text-blue-400 font-medium mb-0.5">Compliance: Clear</div>
              <div className="text-gray-400">No forward-looking statement violations detected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-[#1a1f2e] rounded-xl border border-white/5">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 opacity-30`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-gray-500 text-lg font-semibold">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">Select an event to begin</p>
    </div>
  );
}

export function SidebarLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#0f1219] flex">
      <aside className={`${collapsed ? "w-[72px]" : "w-[220px]"} bg-[#141824] border-r border-white/5 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <span className="text-white font-bold text-sm">CuraLive</span>}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${activeTab === item.id ? "text-white" : ""}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <Settings className="w-4 h-4" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-[#141824] border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-semibold">{activeItem.label}</h1>
            {activeTab === "occ" && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">1 Live Event</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, participants..."
                className="bg-white/5 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-300 placeholder:text-gray-600 w-64 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              DC
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "occ" && <OCCView />}
          {activeTab === "webcasts" && <PlaceholderView title="Webcasts" icon={Radio} color="from-purple-500 to-pink-500" />}
          {activeTab === "video" && <PlaceholderView title="Video Studio" icon={Video} color="from-emerald-500 to-teal-500" />}
          {activeTab === "shadow" && <PlaceholderView title="Shadow Bridge" icon={Eye} color="from-indigo-500 to-violet-500" />}
          {activeTab === "ai" && <PlaceholderView title="AI Intelligence" icon={Brain} color="from-rose-500 to-pink-500" />}
          {activeTab === "guardian" && <PlaceholderView title="AI Guardian" icon={Shield} color="from-cyan-500 to-blue-500" />}
          {activeTab === "billing" && <PlaceholderView title="Billing" icon={CreditCard} color="from-slate-500 to-gray-500" />}
        </main>
      </div>
    </div>
  );
}
