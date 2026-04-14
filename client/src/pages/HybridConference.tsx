import { useState } from "react";
import { useLocation } from "wouter";
import {
  Globe, Calendar, Clock, Users, MapPin, Video, Mic, BarChart3,
  ChevronRight, ArrowRight, Play, Building2, Star, Lock, Mail,
  CheckCircle2, Zap, FileText, Radio, MonitorPlay
} from "lucide-react";

// ─── Demo Conference Data ─────────────────────────────────────────────────────
const CONFERENCE = {
  title: "Africa Capital Markets Summit 2026",
  subtitle: "Connecting Issuers, Analysts & Institutional Investors",
  organiser: "CuraLive · BofA Securities · Barclays",
  dates: "14–16 April 2026",
  location: "Hybrid — Johannesburg & Virtual",
  badge: "By Invitation Only",
  description: "The premier annual gathering for capital markets professionals across Sub-Saharan Africa. Three days of keynote presentations, 1:1 investor meetings, panel discussions, and networking — delivered seamlessly across in-person and virtual channels.",
  stats: [
    { label: "Registered Attendees", value: "340+" },
    { label: "Issuer Companies", value: "28" },
    { label: "Institutional Investors", value: "180+" },
    { label: "Sessions", value: "42" },
  ],
};

const AGENDA: { day: string; date: string; sessions: { time: string; title: string; type: string; speaker: string; track: string }[] }[] = [
  {
    day: "Day 1",
    date: "14 April 2026",
    sessions: [
      { time: "08:30", title: "Registration & Networking Breakfast", type: "networking", speaker: "", track: "All" },
      { time: "09:00", title: "Opening Keynote: African Capital Markets Outlook 2026", type: "keynote", speaker: "Chief Economist, BofA Securities", track: "Plenary" },
      { time: "10:00", title: "Panel: ESG & Sustainable Finance in Emerging Markets", type: "panel", speaker: "4 panellists", track: "Plenary" },
      { time: "11:15", title: "1:1 Investor Meetings — Session A", type: "1x1", speaker: "Operator-managed", track: "Private Rooms" },
      { time: "13:00", title: "Lunch & Networking", type: "networking", speaker: "", track: "All" },
      { time: "14:00", title: "Research Presentation: SA Banking Sector", type: "research", speaker: "Head of Research, Barclays", track: "Track A" },
      { time: "14:00", title: "Research Presentation: Infrastructure & Energy", type: "research", speaker: "Senior Analyst, CuraLive Capital", track: "Track B" },
      { time: "15:30", title: "1:1 Investor Meetings — Session B", type: "1x1", speaker: "Operator-managed", track: "Private Rooms" },
      { time: "17:30", title: "Evening Cocktail Reception", type: "networking", speaker: "", track: "All" },
    ],
  },
  {
    day: "Day 2",
    date: "15 April 2026",
    sessions: [
      { time: "09:00", title: "Keynote: Private Equity in Africa — Deal Flow & Exits", type: "keynote", speaker: "Managing Partner, Actis", track: "Plenary" },
      { time: "10:00", title: "Fireside Chat: Currency Risk & Hedging Strategies", type: "panel", speaker: "CFO, MTN Group + FX Strategist", track: "Plenary" },
      { time: "11:00", title: "1:1 Investor Meetings — Session C", type: "1x1", speaker: "Operator-managed", track: "Private Rooms" },
      { time: "13:00", title: "Lunch & Networking", type: "networking", speaker: "", track: "All" },
      { time: "14:00", title: "Issuer Presentations: Consumer & Retail Sector", type: "research", speaker: "5 issuers × 15 min", track: "Track A" },
      { time: "14:00", title: "Issuer Presentations: Technology & Telecoms", type: "research", speaker: "4 issuers × 15 min", track: "Track B" },
      { time: "16:00", title: "1:1 Investor Meetings — Session D", type: "1x1", speaker: "Operator-managed", track: "Private Rooms" },
    ],
  },
  {
    day: "Day 3",
    date: "16 April 2026",
    sessions: [
      { time: "09:00", title: "Morning Briefing: Market Update & Overnight News", type: "keynote", speaker: "CuraLive Live Transcript", track: "Plenary" },
      { time: "09:30", title: "1:1 Investor Meetings — Final Sessions", type: "1x1", speaker: "Operator-managed", track: "Private Rooms" },
      { time: "12:00", title: "Closing Lunch & Wrap-Up", type: "networking", speaker: "", track: "All" },
      { time: "13:30", title: "Virtual Wrap: AI-Generated Conference Summary", type: "keynote", speaker: "CuraLive Post-Event Report", track: "Virtual" },
    ],
  },
];

const SESSION_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  keynote: { label: "Keynote", color: "text-amber-400", bg: "bg-amber-900/20 border-amber-700/30", icon: Mic },
  panel: { label: "Panel", color: "text-blue-400", bg: "bg-blue-900/20 border-blue-700/30", icon: Users },
  research: { label: "Research", color: "text-violet-400", bg: "bg-violet-900/20 border-violet-700/30", icon: BarChart3 },
  "1x1": { label: "1:1 Meetings", color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-700/30", icon: Video },
  networking: { label: "Networking", color: "text-slate-400", bg: "bg-slate-800/50 border-slate-700/30", icon: Star },
};

const SPEAKERS = [
  { name: "Dr. Amara Diallo", role: "Chief Economist", org: "BofA Securities", region: "London" },
  { name: "Sarah Okonkwo", role: "Managing Partner", org: "Actis Capital", region: "Lagos" },
  { name: "James Whitfield", role: "Head of Research", org: "Barclays Africa", region: "Johannesburg" },
  { name: "Priya Naidoo", role: "CFO", org: "MTN Group", region: "Johannesburg" },
  { name: "Marcus Chen", role: "Portfolio Manager", org: "BlackRock EM", region: "New York" },
  { name: "Fatima Al-Hassan", role: "Senior Analyst", org: "Schroders", region: "London" },
];

const SPONSORS = [
  { tier: "Platinum", names: ["BofA Securities", "Barclays"] },
  { tier: "Gold", names: ["Standard Bank", "Rand Merchant Bank", "Absa Capital"] },
  { tier: "Silver", names: ["Investec", "Nedbank CIB", "FirstRand"] },
];

// ─── Registration Modal ───────────────────────────────────────────────────────
function RegistrationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "pending">("form");
  const [form, setForm] = useState({ name: "", institution: "", email: "", role: "", region: "", attendanceType: "virtual" });

  const handleSubmit = () => {
    if (!form.name || !form.institution || !form.email) return;
    setStep("pending");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Request Invitation</h2>
          <p className="text-xs text-slate-400 mt-1">Africa Capital Markets Summit 2026 · 14–16 April</p>
        </div>

        {step === "form" ? (
          <>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Sarah Chen" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Institution *</label>
                <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. BlackRock" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Work Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="you@institution.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select...</option>
                    <option value="portfolio_manager">Portfolio Manager</option>
                    <option value="analyst">Analyst</option>
                    <option value="cfo">CFO / Finance</option>
                    <option value="ir">Investor Relations</option>
                    <option value="banker">Investment Banker</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Attendance</label>
                  <select value={form.attendanceType} onChange={e => setForm(f => ({ ...f, attendanceType: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="virtual">Virtual</option>
                    <option value="in_person">In-Person (JHB)</option>
                    <option value="hybrid">Both</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.institution || !form.email}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" /> Submit Request
              </button>
              <button onClick={onClose} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Request Submitted</h3>
            <p className="text-sm text-slate-400 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              Your invitation request has been received. The event team will review and send your personalised access link within 2 business days.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HybridConference() {
  const [, navigate] = useLocation();
  const [showRegModal, setShowRegModal] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [trackFilter, setTrackFilter] = useState<string>("All");

  const tracks = ["All", "Plenary", "Track A", "Track B", "Private Rooms", "Virtual"];

  const dayAgenda = AGENDA[activeDay];
  const filteredSessions = trackFilter === "All"
    ? dayAgenda.sessions
    : dayAgenda.sessions.filter(s => s.track === trackFilter);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/live-video")} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
              ← Live Video
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-white">Hybrid Conference Demo</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/live-video")}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 border border-slate-700 rounded-lg"
            >
              All Services
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> Request Invitation
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* Hero */}
        <div className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)" }} />
          <div className="container relative py-14">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <Lock className="w-3 h-3" /> {CONFERENCE.badge}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <Globe className="w-3 h-3" /> Hybrid Event
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">{CONFERENCE.title}</h1>
              <p className="text-slate-400 text-base mb-2">{CONFERENCE.subtitle}</p>
              <p className="text-slate-500 text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>{CONFERENCE.description}</p>
              <div className="flex flex-wrap gap-5 text-sm text-slate-400 mb-8">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />{CONFERENCE.dates}</span>
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" />{CONFERENCE.location}</span>
                <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-violet-400" />{CONFERENCE.organiser}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Request Invitation <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  View Agenda
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-border bg-slate-900/50">
          <div className="container py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CONFERENCE.stats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CuraLive Integration Banner */}
        <div className="border-b border-border bg-gradient-to-r from-violet-950/20 to-slate-900">
          <div className="container py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">Powered by CuraLive Intelligence Layer</h3>
                <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Every session is transcribed in real-time, sentiment-analysed, and summarised by AI. Post-event reports, Q&A transcripts, and replay links are delivered automatically to all registered attendees.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {[
                  { icon: Mic, label: "Live Transcription" },
                  { icon: BarChart3, label: "Sentiment" },
                  { icon: FileText, label: "AI Summary" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <Icon className="w-4 h-4 text-violet-400" />
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div id="agenda" className="container py-10">
          <h2 className="text-xl font-bold text-white mb-6">Conference Agenda</h2>

          {/* Day Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {AGENDA.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeDay === i ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {day.day} · {day.date}
              </button>
            ))}
          </div>

          {/* Track Filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {tracks.map(track => (
              <button
                key={track}
                onClick={() => setTrackFilter(track)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  trackFilter === track ? "bg-slate-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-500 hover:text-white"
                }`}
              >
                {track}
              </button>
            ))}
          </div>

          {/* Session List */}
          <div className="space-y-2">
            {filteredSessions.map((session, i) => {
              const cfg = SESSION_TYPE_CONFIG[session.type] || SESSION_TYPE_CONFIG.networking;
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${cfg.bg}`}>
                  <div className="flex-shrink-0 w-14 text-right">
                    <span className="text-sm font-mono font-bold text-white">{session.time}</span>
                  </div>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-900/50`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{session.title}</p>
                    {session.speaker && (
                      <p className="text-[11px] text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{session.speaker}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">{session.track}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Speakers */}
        <div className="border-t border-border">
          <div className="container py-10">
            <h2 className="text-xl font-bold text-white mb-6">Featured Speakers</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SPEAKERS.map(speaker => (
                <div key={speaker.name} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{speaker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{speaker.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{speaker.role}</p>
                    <p className="text-[11px] text-blue-400 truncate">{speaker.org} · {speaker.region}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sponsors */}
        <div className="border-t border-border bg-slate-900/30">
          <div className="container py-10">
            <h2 className="text-xl font-bold text-white mb-6">Event Partners</h2>
            {SPONSORS.map(tier => (
              <div key={tier.tier} className="mb-5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{tier.tier} Sponsors</p>
                <div className="flex flex-wrap gap-3">
                  {tier.names.map(name => (
                    <div key={name} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                      tier.tier === "Platinum" ? "bg-amber-900/20 border-amber-700/30 text-amber-300" :
                      tier.tier === "Gold" ? "bg-yellow-900/20 border-yellow-700/30 text-yellow-400" :
                      "bg-slate-800 border-slate-700 text-slate-300"
                    }`}>
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Footer */}
        <div className="border-t border-border bg-gradient-to-r from-blue-950/30 to-slate-900">
          <div className="container py-12 text-center">
            <Lock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-3">Attendance by Invitation Only</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              This event is restricted to qualified institutional investors, issuers, and capital markets professionals. Submit your details and the event team will review your request.
            </p>
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Request Invitation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showRegModal && <RegistrationModal onClose={() => setShowRegModal(false)} />}
    </div>
  );
}
