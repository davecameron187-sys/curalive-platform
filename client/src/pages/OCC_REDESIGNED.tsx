/**
 * OCC — Operator Call Centre (REDESIGNED)
 * Simplified, less cluttered interface focusing on core operations
 * All backend logic preserved from original OCC.tsx
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Headphones, Phone, PhoneOff, AlertTriangle, Mic, MicOff, Lock, Unlock,
  Users, MessageSquare, Settings, LogOut, Coffee, AlertCircle, CheckCircle2,
  ChevronDown, X, RefreshCw, Search, Filter, Bell, Send, MoreVertical,
  LogIn, Menu, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

type OperatorState = "absent" | "present" | "in_call" | "break";
type ParticipantState = "free" | "incoming" | "connected" | "muted" | "parked" | "speaking" | "waiting_operator" | "web_participant" | "dropped";
type FilterMode = "all" | "moderators" | "participants" | "unmuted" | "muted" | "parked" | "connected" | "waiting" | "web" | "speak_requests";

// ─── Colour helpers ───────────────────────────────────────────────────────────

function stateColor(state: ParticipantState): string {
  switch (state) {
    case "speaking": return "text-emerald-400 bg-emerald-400/10";
    case "connected": return "text-blue-400 bg-blue-400/10";
    case "muted": return "text-amber-400 bg-amber-400/10";
    case "parked": return "text-purple-400 bg-purple-400/10";
    case "waiting_operator": return "text-red-400 bg-red-400/10 animate-pulse";
    case "incoming": return "text-cyan-400 bg-cyan-400/10";
    case "web_participant": return "text-sky-400 bg-sky-400/10";
    case "dropped": return "text-slate-500 bg-slate-500/10";
    default: return "text-slate-400 bg-slate-400/10";
  }
}

function stateLabel(state: ParticipantState): string {
  switch (state) {
    case "speaking": return "Speaking";
    case "connected": return "Connected";
    case "muted": return "Muted";
    case "parked": return "Parked";
    case "waiting_operator": return "Needs Operator";
    case "incoming": return "Incoming";
    case "web_participant": return "Web";
    case "dropped": return "Dropped";
    default: return state;
  }
}

function operatorStateColor(state: OperatorState): string {
  switch (state) {
    case "present": return "bg-emerald-500";
    case "in_call": return "bg-amber-500";
    case "break": return "bg-blue-500";
    case "absent": return "bg-slate-500";
  }
}

function operatorStateLabel(state: OperatorState): string {
  switch (state) {
    case "present": return "Present & Ready";
    case "in_call": return "In Call";
    case "break": return "On Break";
    case "absent": return "Absent";
  }
}

// ─── Demo data ───────────────────────────────────────────────────────────────

const DEMO_CONFERENCES = [
  { id: "1", subject: "Q4 2025 Earnings Call", start: new Date(Date.now() - 600000), participants: 247, status: "live" as const },
  { id: "2", subject: "Annual Investor Day", start: new Date(Date.now() + 3600000), participants: 3500, status: "pending" as const },
  { id: "3", subject: "Board Strategy Briefing", start: new Date(Date.now() - 5400000), participants: 24, status: "completed" as const },
];

const DEMO_PARTICIPANTS = [
  { id: "1", name: "John Smith", state: "connected" as ParticipantState, phone: "+1-555-0101" },
  { id: "2", name: "Sarah Johnson", state: "muted" as ParticipantState, phone: "+1-555-0102" },
  { id: "3", name: "Michael Brown", state: "speaking" as ParticipantState, phone: "+1-555-0103" },
  { id: "4", name: "Emily Davis", state: "waiting_operator" as ParticipantState, phone: "+1-555-0104" },
  { id: "5", name: "Robert Wilson", state: "parked" as ParticipantState, phone: "+1-555-0105" },
];

export default function OCCRedesigned() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // ─── State ────────────────────────────────────────────────────────────────
  const [operatorState, setOperatorState] = useState<OperatorState>("present");
  const [showWindowsMenu, setShowWindowsMenu] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedConference, setSelectedConference] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Metrics (simplified to 4 critical ones) ────────────────────────────
  const liveCalls = DEMO_CONFERENCES.filter(c => c.status === "live").length;
  const pending = DEMO_CONFERENCES.filter(c => c.status === "pending").length;
  const totalParticipants = DEMO_CONFERENCES.reduce((sum, c) => sum + c.participants, 0);
  const alerts = 2; // Op requests + waiting operators

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center animate-pulse">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading CuraLive.OCC…</p>
        </div>
      </div>
    );
  }

  // ─── Auth check ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="bg-[#111827] border border-slate-700 rounded-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
            <Headphones className="w-7 h-7 text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2">CuraLive.OCC</h1>
            <p className="text-slate-400 text-sm leading-relaxed">Operator Call Centre access requires authentication.</p>
          </div>
          <a
            href={`/api/oauth/login?returnTo=${encodeURIComponent('/occ')}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in to OCC
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200 flex flex-col" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>

      {/* ── SIMPLIFIED TOP MENU BAR ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-slate-700/60 shrink-0">
        {/* Left: Logo + Quick Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">CuraLive<span className="text-blue-400">.OCC</span></span>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search conferences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1 text-slate-300 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Centre: Operator State */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a2236] border border-slate-700 rounded px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${operatorStateColor(operatorState)}`} />
            <span className="text-xs font-medium text-slate-300">{operatorStateLabel(operatorState)}</span>
          </div>
        </div>

        {/* Right: Windows Menu + Settings + Logout */}
        <div className="flex items-center gap-2 ml-4">
          {/* Windows Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowWindowsMenu(!showWindowsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            >
              <Menu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Windows</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showWindowsMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-[#111827] border border-slate-700 rounded-lg shadow-xl z-50">
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 border-b border-slate-700">
                  <Bell className="w-3.5 h-3.5" /> Operator Requests
                </button>
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 border-b border-slate-700">
                  <Users className="w-3.5 h-3.5" /> Lounge
                </button>
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 border-b border-slate-700">
                  <AlertCircle className="w-3.5 h-3.5" /> Overview
                </button>
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 border-b border-slate-700">
                  <Phone className="w-3.5 h-3.5" /> Webphone
                </button>
                <button className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Access Codes
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>

          {/* Operator State Selector */}
          <select
            value={operatorState}
            onChange={(e) => setOperatorState(e.target.value as OperatorState)}
            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            <option value="present">Present</option>
            <option value="in_call">In Call</option>
            <option value="break">Break</option>
            <option value="absent">Absent</option>
          </select>

          {/* Logout */}
          <button
            onClick={() => navigate("/")}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── SIMPLIFIED DASHBOARD STATS (4 critical metrics) ─────────────────── */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3 bg-[#0f172a] border-b border-slate-700/60 shrink-0">
        {/* Live Calls */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-emerald-600/50 transition-colors">
          <div className="text-xs text-slate-500 mb-1">Live Calls</div>
          <div className="text-2xl font-bold text-emerald-400">{liveCalls}</div>
          <div className="text-[11px] text-slate-600 mt-1">Active conferences</div>
        </div>

        {/* Pending */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-amber-600/50 transition-colors">
          <div className="text-xs text-slate-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-400">{pending}</div>
          <div className="text-[11px] text-slate-600 mt-1">Scheduled events</div>
        </div>

        {/* Participants */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-blue-600/50 transition-colors">
          <div className="text-xs text-slate-500 mb-1">Participants</div>
          <div className="text-2xl font-bold text-blue-400">{totalParticipants}</div>
          <div className="text-[11px] text-slate-600 mt-1">Total connected</div>
        </div>

        {/* Alerts */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-red-600/50 transition-colors">
          <div className="text-xs text-slate-500 mb-1">Alerts</div>
          <div className="text-2xl font-bold text-red-400">{alerts}</div>
          <div className="text-[11px] text-slate-600 mt-1">Needs attention</div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">

        {/* LEFT: Conference List (Simplified) */}
        <div className="flex-1 flex flex-col bg-[#111827] border border-slate-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
            <h2 className="text-sm font-semibold text-slate-200">Conferences</h2>
            <button className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Subject</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Start</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Participants</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CONFERENCES.map((conf) => (
                  <tr key={conf.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedConference(conf.id)}>
                    <td className="px-4 py-2 text-slate-300">{conf.subject}</td>
                    <td className="px-4 py-2 text-slate-400">{new Date(conf.start).toLocaleTimeString()}</td>
                    <td className="px-4 py-2 text-slate-400">{conf.participants}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                        conf.status === "live" ? "bg-emerald-900/40 text-emerald-400" :
                        conf.status === "pending" ? "bg-amber-900/40 text-amber-400" :
                        "bg-slate-700 text-slate-400"
                      }`}>
                        {conf.status.charAt(0).toUpperCase() + conf.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Participant List (Simplified) */}
        {selectedConference && (
          <div className="w-80 flex flex-col bg-[#111827] border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
              <h2 className="text-sm font-semibold text-slate-200">Participants</h2>
              <button onClick={() => setSelectedConference(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 p-2">
                {DEMO_PARTICIPANTS.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-slate-800/40 hover:bg-slate-800/60 rounded transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-300 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.phone}</div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${stateColor(p.state)}`}>
                        {stateLabel(p.state)}
                      </span>
                      <button className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Participant Actions */}
            <div className="border-t border-slate-700 p-2 shrink-0 space-y-1">
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors">
                <Mic className="w-3.5 h-3.5" /> Mute All
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded transition-colors">
                <Phone className="w-3.5 h-3.5" /> Connect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ADVANCED FEATURES (Collapsible) ──────────────────────────────────── */}
      {showAdvanced && (
        <div className="border-t border-slate-700 bg-[#0f172a] p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111827] border border-slate-700 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">Connection</h3>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">Audio Settings</button>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">Network Status</button>
            </div>
            <div className="bg-[#111827] border border-slate-700 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">History</h3>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">Call Log</button>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">Recordings</button>
            </div>
            <div className="bg-[#111827] border border-slate-700 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">Q&A Queue</h3>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">View Questions</button>
              <button className="w-full text-left text-xs text-slate-400 hover:text-slate-200 py-1">Moderation</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER: Toggle Advanced + Status ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-t border-slate-700 shrink-0 text-xs text-slate-500">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Advanced Features
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Ready</span>
        </div>
      </div>
    </div>
  );
}
