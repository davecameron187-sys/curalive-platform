import { useState, useMemo } from "react";
import {
  Monitor, Phone, Video, Radio, Eye, CreditCard, Shield, Brain,
  Calendar, Users, Clock, ChevronRight, Activity, Mic, Settings,
  Bell, Search, LayoutDashboard, PlayCircle, CheckCircle2, AlertTriangle,
  Headphones, Zap, TrendingUp, FileText, ExternalLink, ArrowUpRight,
  Sparkles, MoreHorizontal, ChevronLeft, Mail, BarChart3, Globe,
  GraduationCap, Package
} from "lucide-react";

type NavItem = { id: string; label: string; icon: any; color: string; route: string | null; badge?: string };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Events",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500", route: null },
      { id: "operator", label: "Operator Console", icon: Settings, color: "from-gray-500 to-slate-500", route: "/operator-links" },
      { id: "webcasts", label: "Webcasting", icon: Video, color: "from-purple-500 to-pink-500", route: "/live-video/webcasting" },
      { id: "occ", label: "Video Conferences", icon: Radio, color: "from-amber-500 to-orange-500", badge: "LIVE", route: "/occ" },
      { id: "bookings", label: "Bookings", icon: Calendar, color: "from-blue-500 to-cyan-500", route: "/events/calendar" },
      { id: "registrations", label: "Registrations", icon: Mail, color: "from-emerald-500 to-teal-500", route: "/mailing-lists" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "ai", label: "Agentic Brain", icon: Brain, color: "from-rose-500 to-pink-500", route: "/agentic-brain" },
      { id: "metrics", label: "Tagged Metrics", icon: BarChart3, color: "from-violet-500 to-purple-500", route: "/tagged-metrics" },
      { id: "terminal", label: "Terminal", icon: Globe, color: "from-cyan-500 to-blue-500", route: "/intelligence-terminal" },
      { id: "shadow", label: "Shadow Mode", icon: Eye, color: "from-indigo-500 to-violet-500", route: "/shadow-mode" },
      { id: "guardian", label: "Health Guardian", icon: Shield, color: "from-cyan-500 to-blue-500", route: "/health-guardian" },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "integrations", label: "Integrations", icon: Zap, color: "from-blue-500 to-indigo-500", route: "/integrations" },
      { id: "billing", label: "Billing", icon: CreditCard, color: "from-slate-500 to-gray-500", route: "/billing" },
      { id: "admin", label: "Admin", icon: Users, color: "from-gray-500 to-slate-500", route: "/admin/users" },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

function StatusDot({ status }: { status: "live" | "ready" | "idle" }) {
  const colors = { live: "bg-green-400 animate-pulse", ready: "bg-amber-400", idle: "bg-gray-500" };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENT_DATES: Record<string, { count: number; hasLive: boolean }> = {
  "2026-03-10": { count: 2, hasLive: false },
  "2026-03-11": { count: 1, hasLive: false },
  "2026-03-13": { count: 4, hasLive: true },
  "2026-03-14": { count: 3, hasLive: false },
  "2026-03-17": { count: 1, hasLive: false },
  "2026-03-18": { count: 5, hasLive: false },
  "2026-03-19": { count: 2, hasLive: false },
  "2026-03-20": { count: 1, hasLive: false },
  "2026-03-24": { count: 3, hasLive: false },
  "2026-03-25": { count: 2, hasLive: false },
  "2026-03-27": { count: 1, hasLive: false },
};

function MiniCalendar({ selectedDate, onSelectDate }: { selectedDate: Date; onSelectDate: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { date: number; month: "prev" | "current" | "next"; fullDate: string }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({ date: d, month: "prev", fullDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, month: "current", fullDate: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}` });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({ date: i, month: "next", fullDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}` });
    }

    return days;
  }, [viewMonth, viewYear]);

  const todayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-[#161b28] rounded-xl border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          {MONTHS[viewMonth]} {viewYear}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
            className="p-1 text-gray-500 hover:text-white rounded transition-colors hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setViewMonth(selectedDate.getMonth()); setViewYear(selectedDate.getFullYear()); }}
            className="px-2 py-0.5 text-[10px] text-gray-500 hover:text-blue-400 rounded transition-colors hover:bg-white/5"
          >
            Today
          </button>
          <button
            onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
            className="p-1 text-gray-500 hover:text-white rounded transition-colors hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const eventData = EVENT_DATES[day.fullDate];
          const isToday = day.fullDate === todayStr;
          const isSelected = day.fullDate === todayStr;
          const isOtherMonth = day.month !== "current";

          return (
            <button
              key={i}
              onClick={() => {
                if (day.month === "current") {
                  onSelectDate(new Date(viewYear, viewMonth, day.date));
                }
              }}
              className={`relative h-8 flex items-center justify-center text-xs rounded-lg transition-all
                ${isOtherMonth ? "text-gray-700" : "text-gray-400 hover:bg-white/5 hover:text-white"}
                ${isToday ? "bg-blue-500/20 text-blue-400 font-bold ring-1 ring-blue-500/30" : ""}
                ${isSelected && !isToday ? "bg-white/10 text-white" : ""}
              `}
            >
              {day.date}
              {eventData && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {eventData.hasLive ? (
                    <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                  )}
                  {eventData.count > 1 && <span className="w-1 h-1 rounded-full bg-blue-400/50" />}
                  {eventData.count > 3 && <span className="w-1 h-1 rounded-full bg-blue-400/30" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors mb-2">
          <Zap className="w-3.5 h-3.5" />
          Upload Today's Calls to OCC
        </button>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-white/[0.06]">
          <Calendar className="w-3.5 h-3.5" />
          Sync Week to OCC
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Live events</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span>Synced</span>
          </div>
        </div>
        <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            4 of 4 events synced to OCC
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Last sync: 08:15 AM</div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="text-white font-medium">This week:</span> 11 events across 6 days
        </div>
      </div>
    </div>
  );
}

function DashboardView({ onNavigate }: { onNavigate: (tabId: string) => void }) {
  const [selectedDate] = useState(new Date(2026, 2, 13));

  const events = [
    { time: "09:00", title: "Q1 2026 Earnings Call — Naspers", platform: "OCC Audio", platformTab: "occ", participants: 1247, status: "live" as const, sentiment: 82 },
    { time: "11:30", title: "Annual Investor Day — Sasol", platform: "Webcast", platformTab: "webcasts", participants: 3500, status: "ready" as const, sentiment: null },
    { time: "14:00", title: "Results Presentation — FirstRand", platform: "Video Webcast", platformTab: "video", participants: 890, status: "ready" as const, sentiment: null },
    { time: "16:00", title: "Board Strategy Call — Bastion Capital", platform: "Shadow Bridge", platformTab: "shadow", participants: 12, status: "idle" as const, sentiment: null },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Events", value: "4", sub: "2 remaining", icon: Calendar, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400", border: "border-blue-500/10" },
          { label: "Active Participants", value: "1,247", sub: "23 joining", icon: Users, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400", border: "border-emerald-500/10" },
          { label: "Platform Health", value: "98%", sub: "All nominal", icon: Activity, gradient: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-400", border: "border-green-500/10", clickTab: "guardian" },
          { label: "AI Insights", value: "156", sub: "12 flagged", icon: Sparkles, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-400", border: "border-purple-500/10", clickTab: "ai" },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.clickTab && onNavigate(stat.clickTab)}
            className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 border ${stat.border} ${stat.clickTab ? "cursor-pointer hover:brightness-110 transition-all" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[11px] text-gray-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-4">
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
                  <button
                    onClick={() => onNavigate(event.platformTab)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                  >
                    {event.platform} <ExternalLink className="w-2.5 h-2.5" />
                  </button>
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
                <button
                  onClick={() => onNavigate(event.platformTab)}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/[0.06]"
                >
                  {event.status === "live" ? "Open Console" : "Launch"}
                </button>
                <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <MiniCalendar selectedDate={selectedDate} onSelectDate={() => {}} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#161b28] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> AI Alerts
            </h4>
            <button onClick={() => onNavigate("ai")} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
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
            <button onClick={() => onNavigate("guardian")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
              Details <ArrowUpRight className="w-3 h-3" />
            </button>
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
              <Zap className="w-4 h-4 text-blue-400" /> Quick Launch
            </h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "New Audio Event", icon: Phone, color: "text-amber-400", tab: "occ" },
              { label: "New Webcast", icon: Radio, color: "text-purple-400", tab: "webcasts" },
              { label: "Shadow Mode", icon: Eye, color: "text-indigo-400", tab: "shadow" },
              { label: "View Reports", icon: TrendingUp, color: "text-emerald-400", tab: "ai" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.tab)}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white transition-all border border-white/[0.04]"
              >
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

function PlatformEmbed({ item }: { item: NavItem }) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-[#161b28] rounded-xl border border-white/[0.06] p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">{item.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Navigates to <span className="text-blue-400 font-mono">{item.route}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="px-2.5 py-1 bg-green-500/15 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> {item.badge}
              </span>
            )}
            <a
              href={item.route!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              Open Full Page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#161b28] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 opacity-20`}>
              <item.icon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-gray-400 text-lg font-semibold mb-2">{item.label}</h3>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              {item.id === "bookings" && "Event calendar — manage investor event bookings, schedule earnings calls and presentations"}
              {item.id === "registrations" && "Mailing lists — import contacts, send registration emails, CRM API management, zero-click registration"}
              {item.id === "occ" && "Live call management — participants, transcript, AI insights, Q&A triage"}
              {item.id === "webcasts" && "Audio & video webcast management — schedule, configure, and launch webcasts"}
              {item.id === "shadow" && "Shadow mode — silently connect to external conference calls for AI intelligence capture"}
              {item.id === "ai" && "Agentic brain — AI intelligence dashboard, sentiment analysis, compliance, insights"}
              {item.id === "metrics" && "Tagged metrics — real-time metric tagging, audience engagement tracking"}
              {item.id === "terminal" && "Intelligence terminal — deep search across event transcripts and AI-generated insights"}
              {item.id === "guardian" && "Health guardian — infrastructure monitoring, real-time health checks, incident tracking"}
              {item.id === "operator" && "Operator console — manage operator links, event controls, and quick access tools"}
              {item.id === "training" && "Training hub — operator onboarding, certifications, and documentation"}
              {item.id === "shop" && "AI shop — browse and activate AI modules for enhanced event intelligence"}
              {item.id === "integrations" && "Integrations — connect CRM, calendar, and third-party services"}
              {item.id === "billing" && "Client billing — invoices, usage tracking, payment management"}
              {item.id === "admin" && "Admin panel — user management, roles, permissions, and system settings"}
            </p>
            <div className="text-xs text-gray-700 flex items-center justify-center gap-1">
              <span>In the live app, this loads the full</span>
              <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{item.route}</span>
              <span>page inside this frame</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const activeItem = ALL_NAV_ITEMS.find((n) => n.id === activeTab)!;

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      <aside className={`${collapsed ? "w-[72px]" : "w-[220px]"} bg-[#141824] border-r border-white/[0.06] flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-white font-bold text-sm block leading-tight">CuraLive</span>
                <span className="text-gray-600 text-[10px]">Operator Console</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeTab === item.id
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${activeTab === item.id ? "text-white" : ""}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-[13px]">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-white/[0.06] space-y-0.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span className="text-[13px]">Collapse</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <Settings className="w-4 h-4" />
            {!collapsed && <span className="text-[13px]">Settings</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#141824] border-b border-white/[0.06] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-semibold text-[15px]">{activeItem.label}</h1>
            {activeItem.route && (
              <span className="text-xs text-gray-600 font-mono bg-white/[0.03] px-2 py-0.5 rounded">{activeItem.route}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, participants..."
                className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 w-56 focus:outline-none focus:border-blue-500/30"
              />
            </div>
            <button className="relative p-1.5 text-gray-500 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
              DC
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-auto">
          {activeTab === "dashboard" ? (
            <DashboardView onNavigate={handleNavigate} />
          ) : (
            <PlatformEmbed item={activeItem} />
          )}
        </main>
      </div>
    </div>
  );
}
