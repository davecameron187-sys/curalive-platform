/**
 * OCC — Operator Call Centre (TAB-BASED REDESIGN)
 * Clean, organized tab interface for easy event management
 * All backend logic preserved from original OCC.tsx
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Headphones, Phone, PhoneOff, Mic, MicOff, Lock, Unlock, Users, MessageSquare,
  Settings, LogOut, AlertCircle, CheckCircle2, ChevronDown, X, RefreshCw,
  Search, Filter, Bell, Send, MoreVertical, LogIn, Activity, FileText,
  Pause, Play, Radio, Zap, User, Volume2, VolumeX, Clock, Users2
} from "lucide-react";
import { toast } from "sonner";

type OCCTab = "running_calls" | "post_event" | "simulate_call" | "settings" | "operator_settings";
type OperatorState = "absent" | "present" | "in_call" | "break";
type ParticipantState = "free" | "incoming" | "connected" | "muted" | "parked" | "speaking" | "waiting_operator" | "web_participant" | "dropped";

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

// ─── Demo data ───────────────────────────────────────────────────────────────

const DEMO_CONFERENCE = {
  id: "1",
  subject: "Q4 2025 Earnings Call",
  start: new Date(Date.now() - 600000),
  participants: 247,
  status: "live" as const,
  duration: "42:18",
  recording: true,
};

const DEMO_PARTICIPANTS = [
  { id: "1", name: "John Smith", state: "connected" as ParticipantState, phone: "+1-555-0101" },
  { id: "2", name: "Sarah Johnson", state: "muted" as ParticipantState, phone: "+1-555-0102" },
  { id: "3", name: "Michael Brown", state: "speaking" as ParticipantState, phone: "+1-555-0103" },
  { id: "4", name: "Emily Davis", state: "waiting_operator" as ParticipantState, phone: "+1-555-0104" },
  { id: "5", name: "Robert Wilson", state: "parked" as ParticipantState, phone: "+1-555-0105" },
];

// ─── Tab Navigation Component ─────────────────────────────────────────────────

interface TabNavProps {
  activeTab: OCCTab;
  setActiveTab: (tab: OCCTab) => void;
}

function TabNavigation({ activeTab, setActiveTab }: TabNavProps) {
  const tabs: Array<{ id: OCCTab; label: string; icon: React.ReactNode }> = [
    { id: "running_calls", label: "Running Calls", icon: <Phone className="w-4 h-4" /> },
    { id: "post_event", label: "Post Event", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "simulate_call", label: "Simulate Call", icon: <Activity className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "operator_settings", label: "Operator Settings", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-[#111827] border-b border-slate-700 shrink-0 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          {tab.icon}
          <span className="text-sm font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Running Calls Tab ─────────────────────────────────────────────────────────

function RunningCallsTab() {
  const [muteAll, setMuteAll] = useState(false);
  const [recording, setRecording] = useState(DEMO_CONFERENCE.recording);

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Header Section */}
      <div className="bg-[#111827] border-b border-slate-700 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{DEMO_CONFERENCE.subject}</h2>
            <p className="text-sm text-slate-400 mt-1">Status: <span className="text-emerald-400 font-semibold">LIVE</span></p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{DEMO_CONFERENCE.duration}</div>
            <p className="text-xs text-slate-500 mt-1">Duration</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500">Participants</div>
            <div className="text-lg font-bold text-blue-400">{DEMO_CONFERENCE.participants}</div>
          </div>
          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500">Connected</div>
            <div className="text-lg font-bold text-emerald-400">247</div>
          </div>
          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500">Muted</div>
            <div className="text-lg font-bold text-amber-400">12</div>
          </div>
          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500">Recording</div>
            <div className={`text-lg font-bold ${recording ? "text-red-400" : "text-slate-500"}`}>
              {recording ? "ON" : "OFF"}
            </div>
          </div>
        </div>
      </div>

      {/* Control Sections */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Call Management Section */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Call Management
          </h3>
          <div className="grid grid-cols-5 gap-2">
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Answer
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors">
              <Users className="w-3.5 h-3.5" /> Join Mon
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors">
              <Zap className="w-3.5 h-3.5" /> Join T/L
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors">
              <Pause className="w-3.5 h-3.5" /> Hold
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors">
              <PhoneOff className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
        </div>

        {/* Audio Controls Section */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Audio Controls
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setRecording(!recording)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                recording
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Record
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors">
              <Mic className="w-3.5 h-3.5" /> Mute
            </button>
            <button
              onClick={() => setMuteAll(!muteAll)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                muteAll
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" /> Mute All
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors">
              <X className="w-3.5 h-3.5" /> Stop Ringing
            </button>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Advanced
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Dial Out
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors">
              <Users2 className="w-3.5 h-3.5" /> Green Room
            </button>
          </div>
        </div>

        {/* Participant List */}
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Participants ({DEMO_PARTICIPANTS.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {DEMO_PARTICIPANTS.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-slate-800/40 hover:bg-slate-800/60 rounded transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.phone}</div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`text-[10px] px-2 py-1 rounded font-semibold ${stateColor(p.state)}`}>
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
      </div>
    </div>
  );
}

// ─── Post Event Tab ───────────────────────────────────────────────────────────

function PostEventTab() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Event Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Attendees:</span>
              <span className="text-white font-semibold">247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="text-white font-semibold">1h 42m 18s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Recording Status:</span>
              <span className="text-emerald-400 font-semibold">Available</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors">
              <FileText className="w-4 h-4" /> View Transcript
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors">
              <MessageSquare className="w-4 h-4" /> View Q&A
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-semibold transition-colors">
              <RefreshCw className="w-4 h-4" /> Export Report
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-semibold transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simulate Call Tab ────────────────────────────────────────────────────────

function SimulateCallTab() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test Scenario Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Select Event</label>
              <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm">
                <option>Q4 2025 Earnings Call</option>
                <option>Annual Investor Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Number of Test Participants</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className="px-3 py-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded text-sm transition-colors">
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-semibold transition-colors">
                Start Simulation
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition-colors">
                End Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Audio Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Microphone</label>
              <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm">
                <option>Built-in Microphone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Speaker</label>
              <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm">
                <option>Built-in Speaker</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Notifications</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Sound alerts on incoming calls</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Desktop notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Operator Settings Tab ────────────────────────────────────────────────────

function OperatorSettingsTab() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input type="text" defaultValue="David Chen" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Role</label>
              <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm">
                <option>Senior Operator</option>
                <option>Operator</option>
                <option>Junior Operator</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Display Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Show participant phone numbers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Show call duration</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-slate-300">Compact participant list</span>
            </label>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Dashboard Metrics</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Live Calls</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Pending Events</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-slate-300">Total Participants</span>
            </label>
          </div>
        </div>

        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OCCTabs() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<OCCTab>("running_calls");
  const [operatorState, setOperatorState] = useState<OperatorState>("present");

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

      {/* ── Top Menu Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Headphones className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">CuraLive<span className="text-blue-400">.OCC</span></span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a2236] border border-slate-700 rounded px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${operatorStateColor(operatorState)}`} />
            <span className="text-xs font-medium text-slate-300">
              {operatorState === "present" ? "Present & Ready" : operatorState === "in_call" ? "In Call" : operatorState === "break" ? "On Break" : "Absent"}
            </span>
          </div>

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

          <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "running_calls" && <RunningCallsTab />}
        {activeTab === "post_event" && <PostEventTab />}
        {activeTab === "simulate_call" && <SimulateCallTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "operator_settings" && <OperatorSettingsTab />}
      </div>
    </div>
  );
}
