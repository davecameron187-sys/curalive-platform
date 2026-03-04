/**
 * OCC Operator Training Guide
 * Interactive phase-based learning with deep links, Q&A answer boxes, and progress tracking.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ExternalLink, BookOpen, Zap, Settings, FileText, Phone,
  Users, Activity, Radio, MessageSquare, Clock, ArrowRight,
  Trophy, RotateCcw, AlertTriangle, Headphones, Mic, MicOff,
  PauseCircle, PlayCircle, List, LayoutGrid, Bell
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "multiple_choice" | "free_text";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctIndex?: number;
  hint?: string;
}

interface Module {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
  deepLinks?: { label: string; path: string; description: string }[];
}

interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  color: string;
  bgColor: string;
  borderColor: string;
  modules: Module[];
  questions: Question[];
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "chorus_training_progress";

interface Progress {
  completedPhases: string[];
  phaseAnswers: Record<string, Record<string, string | number>>;
  phaseScores: Record<string, number>;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completedPhases: [], phaseAnswers: {}, phaseScores: {} };
}

function saveProgress(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ─── App base URL ─────────────────────────────────────────────────────────────

const APP_BASE = window.location.origin;

// ─── Phase data ───────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: "phase1",
    number: 1,
    title: "Getting Started",
    subtitle: "Platform overview, login, and OCC layout",
    duration: "15 min",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    modules: [
      {
        id: "m01",
        number: "01",
        title: "Welcome & Platform Overview",
        icon: GraduationCap,
        color: "text-blue-400",
        deepLinks: [
          { label: "Open OCC Dashboard", path: "/occ", description: "Your main workspace" },
        ],
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">Chorus.AI</strong> is an AI-powered conference management platform built for IR teams, earnings calls, investor days, and board briefings. It sits on top of Zoom, Microsoft Teams, Webex, and any RTMP source — delivering real-time transcription, sentiment analysis, smart Q&A, and AI summaries to every participant.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: "Operator", desc: "You — manages live conferences from the OCC", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                { role: "Moderator", desc: "Hosts the call — chairs Q&A and introductions", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
                { role: "Presenter", desc: "Speaker — uses the teleprompter view", color: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
                { role: "Attendee", desc: "Participant — joins via phone or web room", color: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
              ].map(({ role, desc, color }) => (
                <div key={role} className={`border rounded-lg p-3 ${color.split(" ").slice(0, 2).join(" ")}`}>
                  <div className={`text-sm font-semibold mb-1 ${color.split(" ")[2]}`}>{role}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Supported Platforms</div>
              <div className="flex flex-wrap gap-2">
                {["Zoom RTMS", "Microsoft Teams Bot", "Recall.ai", "RTMP Ingest", "PSTN Dial-In"].map(p => (
                  <span key={p} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{p}</span>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "m02",
        number: "02",
        title: "Logging In & Setting Your Status",
        icon: Activity,
        color: "text-emerald-400",
        deepLinks: [
          { label: "Go to OCC Login", path: "/occ", description: "Sign in with Manus OAuth" },
        ],
        content: (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                <strong>Critical:</strong> Always set your status to <strong>Present &amp; Ready</strong> before your shift. If you show <strong>Absent</strong>, you won't receive conference transfers or appear as a transfer target to other operators.
              </p>
            </div>
            <ol className="space-y-3">
              {[
                { step: "1", text: "Navigate to the OCC URL", detail: `${APP_BASE}/occ` },
                { step: "2", text: "Click \"Sign in with Manus\" and complete OAuth", detail: "Your session persists across page reloads" },
                { step: "3", text: "Locate the status indicator in the top-right of the OCC bar", detail: "Shows your current presence state" },
                { step: "4", text: "Click the status dropdown and select Present & Ready", detail: "Status broadcasts via Ably to all other operators" },
              ].map(({ step, text, detail }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">{step}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{text}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
                  </div>
                </div>
              ))}
            </ol>
            <div className="grid grid-cols-2 gap-2">
              {[
                { state: "Absent", color: "bg-slate-500/20 border-slate-500/40 text-slate-400", desc: "Default — not available for transfers" },
                { state: "Present & Ready", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", desc: "Available — appears as transfer target" },
                { state: "In Call", color: "bg-amber-500/20 border-amber-500/40 text-amber-400", desc: "Busy — managing a live conference" },
                { state: "On Break", color: "bg-orange-500/20 border-orange-500/40 text-orange-400", desc: "Temporarily unavailable" },
              ].map(({ state, color, desc }) => (
                <div key={state} className={`border rounded-lg p-2.5 ${color.split(" ").slice(0, 2).join(" ")}`}>
                  <div className={`text-xs font-semibold ${color.split(" ")[2]}`}>{state}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m03",
        number: "03",
        title: "OCC Layout Overview",
        icon: LayoutGrid,
        color: "text-violet-400",
        deepLinks: [
          { label: "Open OCC", path: "/occ", description: "Explore the full OCC layout" },
        ],
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">The OCC is divided into four main zones. Understanding the layout before your first call is essential for fast navigation under pressure.</p>
            <div className="space-y-2">
              {[
                { zone: "Top Bar", icon: "⬆", desc: "Operator status, window launcher icons (Requests, Lounge, Overview, CCP, Access Codes, Webphone, Training), and your profile." },
                { zone: "Conference Overview Panel", icon: "📋", desc: "Left panel — lists all conferences by lifecycle tab: Running, Pending, Planned, Completed, Alarms. Click the headset icon to load a conference into the CCP." },
                { zone: "Conference Control Panel (CCP)", icon: "🎛", desc: "Right panel — your main workspace for a live conference. Participant list, filter bar, action buttons, and 7 feature tabs." },
                { zone: "Conference Bar", icon: "⬇", desc: "Bottom of the CCP — live timer, Unmute All, Mute All, +15 Min, Post-Event, and Terminate buttons." },
              ].map(({ zone, icon, desc }) => (
                <div key={zone} className="flex gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xl shrink-0">{icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{zone}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-400 mb-1">💡 Pro Tip — Split View</div>
              <div className="text-xs text-slate-300">You can have two conferences open simultaneously using Split View — click the split-screen icon in the CCP header after loading the first conference, then load a second from the Overview panel.</div>
            </div>
          </div>
        ),
      },
    ],
    questions: [
      {
        id: "p1q1",
        text: "What must you do immediately before starting your shift as an operator?",
        type: "multiple_choice",
        options: [
          "Open the Conference Overview panel",
          "Set your status to Present & Ready",
          "Load a conference into the CCP",
          "Check the Lounge panel for waiting callers",
        ],
        correctIndex: 1,
        hint: "Think about what makes you visible to other operators and eligible for conference transfers.",
      },
      {
        id: "p1q2",
        text: "Which status means you will NOT appear as a transfer target to other operators?",
        type: "multiple_choice",
        options: ["Present & Ready", "In Call", "On Break", "Absent"],
        correctIndex: 3,
        hint: "The default state when you first log in.",
      },
      {
        id: "p1q3",
        text: "What is Split View used for in the OCC?",
        type: "multiple_choice",
        options: [
          "Viewing two participant lists side by side",
          "Managing two live conferences simultaneously",
          "Splitting the screen between Overview and CCP",
          "Comparing two post-event reports",
        ],
        correctIndex: 1,
        hint: "It's accessed via the split-screen icon in the CCP header.",
      },
    ],
  },

  {
    id: "phase2",
    number: 2,
    title: "Conference Management",
    subtitle: "Overview panel, CCP basics, participant actions, and dial-out",
    duration: "20 min",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    modules: [
      {
        id: "m04",
        number: "04",
        title: "Pre-Call Checklist",
        icon: CheckCircle2,
        color: "text-emerald-400",
        deepLinks: [
          { label: "Open OCC", path: "/occ", description: "Run through the pre-call checklist" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">Complete this checklist before every shift. A 2-minute pre-call check prevents 90% of on-call issues.</p>
            {[
              { item: "Headset connected and audio tested", detail: "Use the Monitoring tab to do a quick listen test on a parked participant" },
              { item: "Status set to Present & Ready", detail: "Visible in the top-right operator state indicator" },
              { item: "Conference schedule reviewed", detail: "Check the Planned and Pending tabs in the Overview panel" },
              { item: "Dial-in numbers confirmed", detail: "Verify the correct numbers are in the conference settings" },
              { item: "Webphone registered", detail: "Green indicator in the top bar — click the phone icon to verify" },
              { item: "Notes tab open for the first conference", detail: "Start a notes entry with the conference name and your name" },
            ].map(({ item, detail }) => (
              <div key={item} className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-200">{item}</div>
                  <div className="text-xs text-slate-500">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "m05",
        number: "05",
        title: "Conference Overview Panel",
        icon: LayoutGrid,
        color: "text-blue-400",
        deepLinks: [
          { label: "Open Overview Panel", path: "/occ", description: "Click the Overview icon in the top bar" },
        ],
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">Your at-a-glance dashboard of every conference on the platform. Use the tabs to filter by lifecycle stage, then click the headset icon to load a conference into the CCP.</p>
            <div className="space-y-2">
              {[
                { tab: "RUNNING", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", desc: "Conferences currently in progress. Shows live participant count and elapsed timer." },
                { tab: "PENDING", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", desc: "Scheduled calls within the next 2 hours — ready to be opened by an operator." },
                { tab: "PLANNED", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", desc: "Future conferences booked in the system. Not yet active." },
                { tab: "COMPLETED", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", desc: "Ended calls. Click to open the Post-Event Report for any completed conference." },
                { tab: "ALARMS", color: "bg-red-500/20 text-red-400 border-red-500/30", desc: "Conferences with active alerts — timer exceeded, lounge overflow, or operator requests." },
              ].map(({ tab, color, desc }) => (
                <div key={tab} className="flex gap-3 items-start">
                  <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 shrink-0 mt-0.5 ${color}`}>{tab}</span>
                  <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m06a",
        number: "06A",
        title: "CCP Basics & Participant List",
        icon: Activity,
        color: "text-violet-400",
        deepLinks: [
          { label: "Open CCP", path: "/occ", description: "Click the headset icon on any conference card" },
        ],
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">The CCP is your main workspace for a live conference. Load any conference from the Overview panel by clicking the headset icon — the full participant list appears instantly.</p>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Table Columns Explained</div>
              <div className="space-y-1.5">
                {[
                  { col: "#", desc: "Line number on the voice bridge" },
                  { col: "★ / @ / •", desc: "Role: Moderator / Web / Participant" },
                  { col: "Name", desc: "Caller's registered display name" },
                  { col: "Company", desc: "Organisation (if provided)" },
                  { col: "State", desc: "Connected / Muted / Parked / Waiting" },
                  { col: "Phone", desc: "Caller's originating number" },
                ].map(({ col, desc }) => (
                  <div key={col} className="flex gap-3 text-xs">
                    <span className="font-mono text-blue-400 w-16 shrink-0">{col}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { state: "Connected", color: "text-blue-400 bg-blue-400/10" },
                { state: "Muted", color: "text-amber-400 bg-amber-400/10" },
                { state: "Parked", color: "text-purple-400 bg-purple-400/10" },
                { state: "Waiting", color: "text-red-400 bg-red-400/10" },
              ].map(({ state, color }) => (
                <div key={state} className={`rounded px-2 py-1.5 text-xs font-semibold ${color}`}>{state}</div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m06b",
        number: "06B",
        title: "Participant Actions",
        icon: Users,
        color: "text-amber-400",
        deepLinks: [
          { label: "Open CCP", path: "/occ", description: "Practice participant actions on a live or demo conference" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">Each participant row has inline action buttons. Click once to apply — changes are broadcast to all operators via Ably in real-time.</p>
            {[
              { action: "Unmute", icon: "🎙", result: "→ CONNECTED", desc: "Restores the caller's audio. Use to bring a moderator or speaker live." },
              { action: "Mute", icon: "🔇", result: "→ MUTED", desc: "Silences the caller. They remain in the conference and can hear everything." },
              { action: "Park", icon: "⏸", result: "→ PARKED", desc: "Places the caller on hold with music. Use for audio issues or brief holds." },
              { action: "Unpark", icon: "▶", result: "→ CONNECTED", desc: "Returns a parked caller to the live conference in connected state." },
              { action: "Disconnect", icon: "✖", result: "→ DROPPED", desc: "Drops the caller from the conference entirely. PERMANENT — use with caution." },
            ].map(({ action, icon, result, desc }) => (
              <div key={action} className="flex gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="text-lg shrink-0">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{action}</span>
                    <span className="text-xs text-slate-500 font-mono">{result}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-400 mb-1">💡 Bulk Selection</div>
              <div className="text-xs text-slate-300">Tick the checkbox on any participant row to select them. Tick the header checkbox to select all visible participants. The bulk action bar appears automatically above the participant list.</div>
            </div>
          </div>
        ),
      },
      {
        id: "m06c",
        number: "06C",
        title: "Dial-Out & Caller Lounge",
        icon: Phone,
        color: "text-emerald-400",
        deepLinks: [
          { label: "Open CCP → Connection Tab", path: "/occ", description: "Use the Connection tab to dial out to participants" },
        ],
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <div className="text-sm font-semibold text-slate-200">Dial-Out</div>
                  <span className="text-xs text-slate-500">Operator calls a participant directly</span>
                </div>
                <ol className="space-y-1.5 text-xs text-slate-400">
                  <li>1. Open the CCP for the target conference</li>
                  <li>2. Click the <strong className="text-slate-300">Connection</strong> tab in the Feature Bar</li>
                  <li>3. Enter Caller Name (optional) and Phone Number (E.164 format)</li>
                  <li>4. Select Role: Moderator or Participant</li>
                  <li>5. Click <strong className="text-slate-300">Dial Now</strong></li>
                </ol>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-amber-400" />
                  <div className="text-sm font-semibold text-slate-200">Caller Lounge</div>
                  <span className="text-xs text-slate-500">Callers waiting to be admitted</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">The Lounge shows callers who self-dialled and are waiting. The Lounge badge pulses amber when callers are waiting.</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>• Click <strong className="text-slate-300">Pick</strong> to admit a caller to the live conference</div>
                  <div>• Check the Lounge every 60 seconds — VIPs and late joiners sit here</div>
                  <div>• Enable <strong className="text-slate-300">Auto-Accept Lounge</strong> in Settings for open-access events</div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    questions: [
      {
        id: "p2q1",
        text: "A moderator's audio has a loud echo. What is the correct action?",
        type: "multiple_choice",
        options: [
          "Disconnect the moderator immediately",
          "Park the moderator to hold music while they fix their audio",
          "Mute the moderator so others can't hear the echo",
          "Ask them to redial from a different number",
        ],
        correctIndex: 1,
        hint: "Park holds with music and lets them reconnect. Disconnect is permanent.",
      },
      {
        id: "p2q2",
        text: "Which Overview tab shows conferences scheduled within the next 2 hours?",
        type: "multiple_choice",
        options: ["Running", "Planned", "Pending", "Alarms"],
        correctIndex: 2,
        hint: "These conferences are ready to be opened by an operator.",
      },
      {
        id: "p2q3",
        text: "What happens when you click Disconnect on a participant?",
        type: "multiple_choice",
        options: [
          "They are placed on hold with music",
          "They are muted but remain in the conference",
          "They are dropped from the conference permanently",
          "They are moved to the Caller Lounge",
        ],
        correctIndex: 2,
        hint: "This action is irreversible — they must redial to rejoin.",
      },
      {
        id: "p2q4",
        text: "How do you start a Q&A session with 500+ participants on the line?",
        type: "multiple_choice",
        options: [
          "Unmute all participants and let them speak freely",
          "Disconnect all participants except the moderator",
          "Use Bulk Select → Mute All, then unmute speakers one at a time from the queue",
          "Park all participants and dial them back one by one",
        ],
        correctIndex: 2,
        hint: "This prevents background noise from hundreds of callers.",
      },
    ],
  },

  {
    id: "phase3",
    number: 3,
    title: "Advanced Controls",
    subtitle: "Feature tabs, conference bar, transfer, and settings",
    duration: "25 min",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    modules: [
      {
        id: "m07",
        number: "07",
        title: "CCP Feature Tabs",
        icon: List,
        color: "text-amber-400",
        deepLinks: [
          { label: "Open CCP Feature Tabs", path: "/occ", description: "Load a conference and explore the 7 feature tabs" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">Seven specialist tabs sit below the participant list — each unlocks a different operational capability for the active conference.</p>
            {[
              { tab: "Monitoring", icon: Headphones, color: "text-blue-400", desc: "Listen, whisper, or barge into any participant's audio line.", modes: ["LISTEN — Silent monitoring. You hear them; they don't know.", "WHISPER — Coach mode. You speak to them privately; rest of conference unaffected.", "BARGE — Full intervention. All attendees can hear you. Use only for urgent emergencies."] },
              { tab: "Connection", icon: Phone, color: "text-emerald-400", desc: "Dial-out form to add new callers to the live conference.", modes: [] },
              { tab: "History", icon: Activity, color: "text-violet-400", desc: "Per-participant event log: joins, mutes, parks, disconnects with timestamps.", modes: [] },
              { tab: "Audio Files", icon: Radio, color: "text-orange-400", desc: "Play, pause, or queue hold music and pre-recorded announcements.", modes: [] },
              { tab: "Chat", icon: MessageSquare, color: "text-cyan-400", desc: "Broadcast text messages to all participants or a specific caller via Ably.", modes: [] },
              { tab: "Notes", icon: FileText, color: "text-green-400", desc: "Operator notepad — auto-saved per conference, exported with Post-Event report.", modes: [] },
              { tab: "Q&A Queue", icon: Bell, color: "text-red-400", desc: "Review, approve, or reject attendee questions submitted via the web interface.", modes: [] },
            ].map(({ tab, icon: Icon, color, desc, modes }) => (
              <div key={tab} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-semibold text-slate-200">{tab}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1.5">{desc}</p>
                {modes.length > 0 && (
                  <div className="space-y-1">
                    {modes.map(m => (
                      <div key={m} className="text-xs text-slate-500 pl-2 border-l border-slate-700">{m}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "m08",
        number: "08",
        title: "Conference Bar — Timer, Actions & Export",
        icon: Clock,
        color: "text-orange-400",
        deepLinks: [
          { label: "Open CCP", path: "/occ", description: "The Conference Bar is at the bottom of every active CCP session" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">The Conference Bar sits at the bottom of every active CCP session. It gives you one-click access to the most critical conference-wide controls.</p>
            {[
              { btn: "Live Timer", color: "text-emerald-400", desc: "Shows elapsed conference time. Colour changes based on your Settings thresholds: Green = normal, Amber = approaching limit, Red = exceeded limit." },
              { btn: "Unmute All", color: "text-emerald-400", desc: "Restores audio for every participant simultaneously. Use to open the floor after a presentation segment." },
              { btn: "Mute All", color: "text-amber-400", desc: "Silences every participant at once. Essential at the start of Q&A or when background noise becomes disruptive." },
              { btn: "+15 Min", color: "text-blue-400", desc: "Extends the conference duration by 15 minutes. Resets the critical timer threshold accordingly. Click multiple times if needed." },
              { btn: "Post-Event", color: "text-violet-400", desc: "Saves participant data and operator notes to session storage, then navigates to the Post-Event Report page with the Operator Report tab pre-selected." },
              { btn: "Terminate", color: "text-red-400", desc: "Ends the conference and disconnects ALL participants. This action is IRREVERSIBLE. A confirmation prompt appears before execution." },
            ].map(({ btn, color, desc }) => (
              <div key={btn} className="flex gap-3">
                <span className={`text-xs font-bold font-mono w-24 shrink-0 mt-0.5 ${color}`}>{btn}</span>
                <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "m09",
        number: "09",
        title: "Transfer & Settings",
        icon: Settings,
        color: "text-slate-400",
        deepLinks: [
          { label: "Open CCP → Transfer", path: "/occ", description: "Transfer button is in the CCP header" },
          { label: "Open CCP → Settings", path: "/occ", description: "Settings button is in the CCP header" },
        ],
        content: (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="text-sm font-semibold text-slate-200">Transfer Conference</div>
              </div>
              <p className="text-xs text-slate-400 mb-3">Hand off a live conference to another operator. The target receives a real-time Ably notification with your handover note and the conference details.</p>
              <ol className="space-y-1.5 text-xs text-slate-400">
                <li>1. Click <strong className="text-slate-300">Transfer</strong> in the CCP header</li>
                <li>2. Select the target operator (shows online operators with their status)</li>
                <li>3. Add a handover note (e.g., "Q4 Earnings — 1,247 participants. Q&A starts at 45 min mark.")</li>
                <li>4. Click <strong className="text-slate-300">Send Transfer</strong></li>
              </ol>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-slate-400" />
                <div className="text-sm font-semibold text-slate-200">Operator Settings</div>
              </div>
              <div className="space-y-2">
                {[
                  { setting: "Audio Alert Volume", desc: "Volume for lounge and alarm sounds" },
                  { setting: "Timer Warning Threshold", desc: "Minutes before amber warning (default: 50 min)" },
                  { setting: "Timer Critical Threshold", desc: "Minutes before red critical (default: 60 min)" },
                  { setting: "Default Participant Filter", desc: "Filter applied when opening a conference" },
                  { setting: "Preferred Dial-In Country", desc: "Pre-fills the dial-out country code (default: South Africa)" },
                  { setting: "Auto-Accept Lounge", desc: "Automatically admit all lounge callers — for open-access events only" },
                ].map(({ setting, desc }) => (
                  <div key={setting} className="flex gap-2 text-xs">
                    <span className="text-slate-300 font-medium w-44 shrink-0">{setting}</span>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
    ],
    questions: [
      {
        id: "p3q1",
        text: "Which monitoring mode allows you to speak to a participant privately without the rest of the conference hearing?",
        type: "multiple_choice",
        options: ["Listen", "Whisper", "Barge", "Monitor"],
        correctIndex: 1,
        hint: "Think of it as coaching a moderator mid-call without disrupting the conference.",
      },
      {
        id: "p3q2",
        text: "The conference timer has turned red. What does this indicate?",
        type: "multiple_choice",
        options: [
          "The conference is about to be automatically terminated",
          "The elapsed time has exceeded the critical threshold set in Settings",
          "There are more than 1,000 participants connected",
          "The recording has failed",
        ],
        correctIndex: 1,
        hint: "The critical threshold is configurable in Operator Settings (default: 60 min).",
      },
      {
        id: "p3q3",
        text: "What is the correct way to hand off a live conference to another operator at the end of your shift?",
        type: "multiple_choice",
        options: [
          "Simply close the CCP and the next operator will pick it up",
          "Use the Transfer button in the CCP header, add a handover note, and send",
          "Terminate the conference and ask the next operator to start a new one",
          "Park all participants and message the next operator",
        ],
        correctIndex: 1,
        hint: "The target operator receives a real-time Ably notification with your note.",
      },
      {
        id: "p3q4",
        text: "Which Conference Bar button should you use when the Q&A moderator is about to open the floor?",
        type: "multiple_choice",
        options: ["+15 Min", "Unmute All", "Mute All", "Post-Event"],
        correctIndex: 2,
        hint: "You want to silence all participants first, then unmute speakers one at a time from the Q&A queue.",
      },
    ],
  },

  {
    id: "phase4",
    number: 4,
    title: "Post-Event & Best Practices",
    subtitle: "Reports, Webphone, alarms, and the 6 habits of great operators",
    duration: "15 min",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    modules: [
      {
        id: "m10",
        number: "10",
        title: "Post-Event Report & Operator Report Tab",
        icon: FileText,
        color: "text-green-400",
        deepLinks: [
          { label: "View Post-Event Reports", path: "/post-event", description: "Browse completed conference reports" },
        ],
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">When a conference ends, the full session data is captured and available as a structured report — accessible directly from the OCC.</p>
            <ol className="space-y-3">
              {[
                { step: "1", title: "Click Post-Event in the Conference Bar", detail: "Writes the full participant list and your operator notes to session storage." },
                { step: "2", title: "Auto-navigates to Post-Event page", detail: "You are taken directly to /post-event/{conferenceId} — no manual navigation needed." },
                { step: "3", title: "Operator Report tab auto-activates", detail: "The tab opens automatically showing your full session data." },
              ].map(({ step, title, detail }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">{step}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
                  </div>
                </div>
              ))}
            </ol>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Operator Report Includes</div>
              {["Conference metadata (ID, date, duration, dial-in)", "Participant count stats (total, connected, muted, parked)", "Full participant table with join times and roles", "Operator notes written during the call", "Download TXT — plain-text export for filing"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-400 py-0.5">
                  <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m11",
        number: "11",
        title: "Webphone",
        icon: Phone,
        color: "text-emerald-400",
        deepLinks: [
          { label: "Open Webphone", path: "/occ", description: "Click the phone icon in the OCC top bar" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">The built-in softphone in the OCC top bar. Use it for direct calls to participants, conference dial-in testing, and operator-to-operator communication.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { feature: "Outbound Calls", desc: "Call any number via Twilio or Telnyx with automatic failover" },
                { feature: "Caller ID Selection", desc: "Choose from verified numbers for each outbound call" },
                { feature: "Call Recording", desc: "All calls recorded — playback and transcription in history" },
                { feature: "Voicemail", desc: "Auto-transcribed voicemails when no operators are available" },
                { feature: "Call Transfer", desc: "Blind or warm transfer to another number or operator" },
                { feature: "Transcription", desc: "Searchable transcripts for all recorded calls" },
              ].map(({ feature, desc }) => (
                <div key={feature} className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700">
                  <div className="text-xs font-semibold text-slate-200 mb-0.5">{feature}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m12",
        number: "12",
        title: "Alarms & Escalation",
        icon: AlertTriangle,
        color: "text-red-400",
        deepLinks: [
          { label: "Open OCC → Alarms Tab", path: "/occ", description: "Alarms tab in the Conference Overview panel" },
        ],
        content: (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-xs font-semibold text-red-400 mb-1">⚠ Never leave an alarm unacknowledged for more than 2 minutes</div>
              <div className="text-xs text-slate-300">The Alarms tab badge pulses red in the top navigation. Check it immediately when it appears.</div>
            </div>
            <div className="space-y-2">
              {[
                { type: "Timer Exceeded", color: "text-amber-400", desc: "Conference has run past the scheduled end time. Click +15 Min or coordinate with the client." },
                { type: "Lounge Overflow", color: "text-orange-400", desc: "More than 5 callers waiting in the Lounge. Pick them immediately or enable Auto-Accept." },
                { type: "Operator Request", color: "text-red-400", desc: "A moderator or participant pressed *0 on their keypad requesting operator assistance." },
              ].map(({ type, color, desc }) => (
                <div key={type} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className={`text-xs font-semibold mb-1 ${color}`}>{type}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-400 mb-1">Escalation Protocol</div>
              <div className="text-xs text-slate-300">If you cannot handle an alarm, use the Transfer button to hand off the conference to another available operator. Never leave a live conference unattended.</div>
            </div>
          </div>
        ),
      },
      {
        id: "m13",
        number: "13",
        title: "Operator Best Practices",
        icon: Trophy,
        color: "text-amber-400",
        deepLinks: [
          { label: "Open OCC", path: "/occ", description: "Apply these practices on your next live call" },
        ],
        content: (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">Six habits that separate a good operator from a great one. Apply these on every call.</p>
            {[
              { num: 1, habit: "Set Present & Ready before your shift", detail: "Your status is broadcast via Ably presence. If you're showing Absent, you won't appear as an available transfer target for other operators.", color: "border-l-blue-400" },
              { num: 2, habit: "Use the Notes tab throughout every call", detail: "Notes are saved per-conference and exported automatically to the Post-Event Operator Report. Write timestamps for key moments — Q&A start, technical issues, VIP callers.", color: "border-l-emerald-400" },
              { num: 3, habit: "Park, don't Disconnect, for audio issues", detail: "Park holds the caller with music and lets them reconnect. Disconnect is permanent — they must redial. Always Park first when troubleshooting.", color: "border-l-amber-400" },
              { num: 4, habit: "Bulk Select → Mute All at Q&A start", detail: "Tick the header checkbox to select all participants, then click Mute All. This silences 500+ callers in one click before the Q&A moderator opens the floor.", color: "border-l-orange-400" },
              { num: 5, habit: "Check the Lounge every 60 seconds", detail: "The Lounge badge pulses amber when callers are waiting. Late-joining VIPs and dial-in participants sit here — don't leave them waiting more than 2 minutes.", color: "border-l-violet-400" },
              { num: 6, habit: "Use Transfer for shift handoffs — never just leave", detail: "Click Transfer in the CCP header, select the incoming operator, add a handover note, and send. They receive an Ably alert and can pick up the conference seamlessly.", color: "border-l-red-400" },
            ].map(({ num, habit, detail, color }) => (
              <div key={num} className={`bg-slate-800/50 rounded-lg p-3 border border-slate-700 border-l-4 ${color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">{num}</span>
                  <span className="text-sm font-semibold text-slate-200">{habit}</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed pl-7">{detail}</div>
              </div>
            ))}
          </div>
        ),
      },
    ],
    questions: [
      {
        id: "p4q1",
        text: "What is the correct sequence to end a conference and generate the Operator Report?",
        type: "multiple_choice",
        options: [
          "Terminate → navigate to /post-event manually",
          "Post-Event button in Conference Bar → auto-navigates to Post-Event Report",
          "Export button in the Notes tab → download TXT",
          "Close the CCP → the report generates automatically",
        ],
        correctIndex: 1,
        hint: "The Post-Event button saves data AND navigates you to the report automatically.",
      },
      {
        id: "p4q2",
        text: "A moderator presses *0 on their keypad during a live call. What does this trigger?",
        type: "multiple_choice",
        options: [
          "The moderator is automatically muted",
          "An Operator Request alarm appears in the Alarms tab",
          "The conference is placed on hold",
          "The moderator is transferred to the Caller Lounge",
        ],
        correctIndex: 1,
        hint: "The *0 keypad shortcut is the moderator's way of requesting operator assistance.",
      },
      {
        id: "p4q3",
        text: "You need to leave your shift but have a live conference running. What should you do?",
        type: "multiple_choice",
        options: [
          "Close the browser — the conference will continue without an operator",
          "Terminate the conference and ask the client to reschedule",
          "Use Transfer in the CCP header to hand off to another available operator",
          "Park all participants and message the next operator",
        ],
        correctIndex: 2,
        hint: "Never leave a live conference unattended — always use Transfer for shift handoffs.",
      },
      {
        id: "p4q4",
        text: "Which Webphone feature automatically creates a text version of a missed call message?",
        type: "multiple_choice",
        options: [
          "Call Recording",
          "Caller ID Selection",
          "Voicemail with auto-transcription",
          "Blind Transfer",
        ],
        correctIndex: 2,
        hint: "When no operators are available, callers leave a message that is automatically converted to text.",
      },
    ],
  },
];

// ─── Quick Reference Table ────────────────────────────────────────────────────

const QUICK_REFERENCE = [
  { action: "Open a conference", howTo: "Overview panel → click headset icon" },
  { action: "Mute one caller", howTo: "Participant row → amber mic-off button" },
  { action: "Mute all participants", howTo: "Select all → Bulk bar → Mute All" },
  { action: "Admit lounge caller", howTo: "Lounge panel → Pick → Caller Control → Admit" },
  { action: "Dial out to a participant", howTo: "CCP → Connection tab → fill form → Dial" },
  { action: "Extend conference +15 min", howTo: "Conference Bar → +15 min button" },
  { action: "Transfer to another operator", howTo: "CCP header → Transfer → select operator → Send" },
  { action: "End the conference", howTo: "Conference Bar → red Terminate button" },
  { action: "Export to Post-Event Report", howTo: "Conference Bar → Post-Event → Operator Report tab" },
  { action: "Listen to a participant silently", howTo: "Feature Bar → Monitoring tab → select participant → Listen" },
  { action: "Whisper to a moderator", howTo: "Feature Bar → Monitoring tab → select participant → Whisper" },
  { action: "Broadcast a chat message", howTo: "Feature Bar → Chat tab → type message → All Participants → Send" },
  { action: "Add operator notes", howTo: "Feature Bar → Notes tab → type notes (auto-saved)" },
  { action: "Approve a Q&A question", howTo: "Feature Bar → Q&A Queue tab → Approve button" },
  { action: "Open Webphone", howTo: "OCC top bar → phone icon" },
];

// ─── Phase Card Component ─────────────────────────────────────────────────────

function PhaseCard({
  phase,
  progress,
  onComplete,
}: {
  phase: Phase;
  progress: Progress;
  onComplete: (phaseId: string, score: number) => void;
}) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>(
    progress.phaseAnswers[phase.id] ?? {}
  );
  const [submitted, setSubmitted] = useState(phase.id in (progress.phaseScores ?? {}));
  const [score, setScore] = useState(progress.phaseScores[phase.id] ?? 0);

  const isCompleted = progress.completedPhases.includes(phase.id);

  function handleAnswer(qId: string, value: string | number) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function handleSubmit() {
    let correct = 0;
    for (const q of phase.questions) {
      if (q.type === "multiple_choice" && answers[q.id] === q.correctIndex) {
        correct++;
      } else if (q.type === "free_text" && typeof answers[q.id] === "string" && (answers[q.id] as string).trim().length > 10) {
        correct++;
      }
    }
    const pct = Math.round((correct / phase.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    onComplete(phase.id, pct);
    if (pct >= 75) {
      toast.success(`Phase ${phase.number} complete! Score: ${pct}%`);
    } else {
      toast.error(`Score: ${pct}% — review the modules and try again`);
    }
  }

  function handleReset() {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }

  const allAnswered = phase.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== "");

  return (
    <div className={`border rounded-xl overflow-hidden ${phase.borderColor} ${isCompleted ? "opacity-90" : ""}`}>
      {/* Phase header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between p-4 ${phase.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full border-2 ${phase.borderColor} flex items-center justify-center text-sm font-bold ${phase.color}`}>
            {isCompleted && score >= 75 ? <CheckCircle2 className="w-5 h-5" /> : phase.number}
          </div>
          <div className="text-left">
            <div className={`text-base font-bold ${phase.color}`}>Phase {phase.number} — {phase.title}</div>
            <div className="text-xs text-slate-400">{phase.subtitle} · {phase.duration}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${score >= 75 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {score}%
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="bg-[#0d1117] border-t border-slate-800">
          {/* Module tabs */}
          <div className="flex overflow-x-auto border-b border-slate-800 px-4 pt-3 gap-1">
            {phase.modules.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModule(activeModule === m.id ? null : m.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors ${
                  activeModule === m.id
                    ? "bg-slate-800 text-slate-200 border border-slate-700 border-b-transparent"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                <span>Module {m.number}</span>
              </button>
            ))}
          </div>

          {/* Active module content */}
          {activeModule && (() => {
            const mod = phase.modules.find(m => m.id === activeModule);
            if (!mod) return null;
            return (
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  <div>
                    <div className="text-sm font-bold text-slate-200">Module {mod.number} — {mod.title}</div>
                    {mod.subtitle && <div className="text-xs text-slate-500">{mod.subtitle}</div>}
                  </div>
                </div>
                <div className="mb-4">{mod.content}</div>
                {mod.deepLinks && mod.deepLinks.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Links</div>
                    <div className="flex flex-wrap gap-2">
                      {mod.deepLinks.map(link => (
                        <button
                          key={link.path + link.label}
                          onClick={() => navigate(link.path)}
                          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 rounded px-2.5 py-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Q&A section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <div className="text-sm font-semibold text-slate-200">Phase {phase.number} Assessment</div>
              <span className="text-xs text-slate-500">— {phase.questions.length} questions · Pass mark: 75%</span>
              {submitted && (
                <button onClick={handleReset} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>

            <div className="space-y-5">
              {phase.questions.map((q, qi) => (
                <div key={q.id} className={`rounded-lg p-4 border ${
                  submitted
                    ? q.type === "multiple_choice" && answers[q.id] === q.correctIndex
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : q.type === "free_text"
                        ? "bg-blue-500/5 border-blue-500/30"
                        : "bg-red-500/5 border-red-500/30"
                    : "bg-slate-800/50 border-slate-700"
                }`}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-500 shrink-0 mt-0.5">Q{qi + 1}</span>
                    <div className="text-sm text-slate-200 leading-relaxed">{q.text}</div>
                  </div>

                  {q.type === "multiple_choice" && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = answers[q.id] === oi;
                        const isCorrect = submitted && oi === q.correctIndex;
                        const isWrong = submitted && isSelected && oi !== q.correctIndex;
                        return (
                          <button
                            key={oi}
                            disabled={submitted}
                            onClick={() => handleAnswer(q.id, oi)}
                            className="w-full text-left text-xs px-3 py-2 rounded border transition-all"
                            style={{
                              backgroundColor: isCorrect
                                ? 'rgba(16,185,129,0.15)'
                                : isWrong
                                  ? 'rgba(239,68,68,0.15)'
                                  : isSelected
                                    ? 'rgba(59,130,246,0.2)'
                                    : 'rgba(15,23,42,0.8)',
                              borderColor: isCorrect
                                ? 'rgba(16,185,129,0.6)'
                                : isWrong
                                  ? 'rgba(239,68,68,0.6)'
                                  : isSelected
                                    ? 'rgba(59,130,246,0.7)'
                                    : 'rgba(51,65,85,0.8)',
                              color: isCorrect
                                ? '#6ee7b7'
                                : isWrong
                                  ? '#fca5a5'
                                  : isSelected
                                    ? '#93c5fd'
                                    : '#94a3b8',
                            }}
                          >
                            <span className="font-mono mr-2 text-slate-500">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                            {isCorrect && <CheckCircle2 className="w-3 h-3 inline ml-2 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "free_text" && (
                    <textarea
                      disabled={submitted}
                      value={(answers[q.id] as string) ?? ""}
                      onChange={e => handleAnswer(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500"
                      rows={3}
                    />
                  )}

                  {submitted && q.hint && (
                    <div className="mt-2 text-xs text-slate-500 italic">💡 {q.hint}</div>
                  )}
                </div>
              ))}
            </div>

            {!submitted && (
              <button
                disabled={!allAnswered}
                onClick={handleSubmit}
                className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  allAnswered
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                Submit Answers
              </button>
            )}

            {submitted && (
              <div className={`mt-4 rounded-lg p-4 border text-center ${
                score >= 75
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
              }`}>
                <div className={`text-2xl font-bold mb-1 ${score >= 75 ? "text-emerald-400" : "text-amber-400"}`}>{score}%</div>
                <div className="text-sm text-slate-300">
                  {score >= 75
                    ? "✓ Phase complete — you're ready to move on"
                    : "Review the modules above and try again to reach 75%"}
                </div>
                {score >= 75 && (
                  <div className="mt-2 text-xs text-slate-500">Progress saved automatically</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Training() {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [showQuickRef, setShowQuickRef] = useState(false);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  function handlePhaseComplete(phaseId: string, score: number) {
    setProgress(prev => {
      const completedPhases = score >= 75 && !prev.completedPhases.includes(phaseId)
        ? [...prev.completedPhases, phaseId]
        : prev.completedPhases;
      return {
        completedPhases,
        phaseAnswers: { ...prev.phaseAnswers, [phaseId]: {} },
        phaseScores: { ...prev.phaseScores, [phaseId]: score },
      };
    });
  }

  function handleReset() {
    const fresh: Progress = { completedPhases: [], phaseAnswers: {}, phaseScores: {} };
    setProgress(fresh);
    saveProgress(fresh);
    toast.success("Progress reset");
  }

  const completedCount = PHASES.filter(p => progress.completedPhases.includes(p.id)).length;
  const overallPct = Math.round((completedCount / PHASES.length) * 100);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/occ")} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-sm font-bold text-slate-200">OCC Operator Training Guide</div>
                <div className="text-xs text-slate-500">Chorus.AI · 4 Phases · 13 Modules</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{completedCount}/{PHASES.length}</span>
            </div>
            <button
              onClick={() => setShowQuickRef(v => !v)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2.5 py-1.5 text-slate-300 transition-colors"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Quick Ref
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-200 mb-1">Welcome to the OCC Operator Training Guide</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                This guide covers everything you need to operate the Chorus.AI OCC confidently. Work through the four phases in order — each phase builds on the last. Complete the assessment at the end of each phase (75% to pass) to track your progress. All progress is saved automatically in your browser.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => navigate("/occ")}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open OCC
                </button>
                <span className="text-xs text-slate-500">Total time: ~75 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        {showQuickRef && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-slate-200">Quick Reference — Common Actions</span>
              </div>
              <button onClick={() => setShowQuickRef(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <div className="divide-y divide-slate-800">
              {QUICK_REFERENCE.map(({ action, howTo }) => (
                <div key={action} className="flex items-center gap-4 px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-300 w-52 shrink-0">{action}</span>
                  <span className="text-xs text-slate-500 font-mono">{howTo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase cards */}
        {PHASES.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            progress={progress}
            onComplete={handlePhaseComplete}
          />
        ))}

        {/* Completion banner */}
        {completedCount === PHASES.length && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <div className="text-lg font-bold text-slate-200 mb-1">Training Complete!</div>
            <p className="text-sm text-slate-400 mb-4">You've completed all 4 phases of the OCC Operator Training Guide. You're ready to operate.</p>
            <button
              onClick={() => navigate("/occ")}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <Activity className="w-4 h-4" />
              Open OCC — Start Operating
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 py-4">
          Chorus.AI OCC Operator Training Guide · v2.0 · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
