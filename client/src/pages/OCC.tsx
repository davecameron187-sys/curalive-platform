/**
 * OCC — Operator Call Centre
 * VIER-style production operator console for Chorus.AI
 * Covers: Operator State Machine, Conference Overview, Conference Control Panel,
 * Feature Bar (Monitoring/Connection/History/Audio/Chat), Lounge, Operator Requests, Caller Control
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Headphones, Phone, PhoneOff, PhoneIncoming, AlertTriangle, Mic, MicOff, PauseCircle, PlayCircle,
  Lock, Unlock, Radio, Users, MessageSquare, History, Music, Wifi,
  WifiOff, Settings, LogOut, Coffee, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, X, Plus, RefreshCw, Volume2, VolumeX,
  ArrowRight, UserCheck, UserX, Activity, Clock,
  List, LayoutGrid, Bell, BellOff, Send, Search, Filter,
  Maximize2, Minimize2, PhoneMissed, UserPlus, Zap, MoreVertical, FileText,
  PhoneForwarded, Trash2, Upload, GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import Webphone from "@/components/Webphone";
import WebphoneActivityCard from "@/components/WebphoneActivityCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type OperatorState = "absent" | "present" | "in_call" | "break";
type ParticipantState = "free" | "incoming" | "connected" | "muted" | "parked" | "speaking" | "waiting_operator" | "web_participant" | "dropped";
type FilterMode = "all" | "moderators" | "participants" | "unmuted" | "muted" | "parked" | "connected" | "waiting" | "web" | "speak_requests";
type FeatureTab = "monitoring" | "connection" | "history" | "audio" | "chat" | "notes" | "qa_queue";
type OverviewTab = "running" | "pending" | "planned" | "completed" | "alarms";

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

function formatDuration(start: Date | string | null): string {
  if (!start) return "—";
  const ms = Date.now() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTime(dt: Date | string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Demo data fallback ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_CONFERENCES: any[] = [
  {
    id: 1, eventId: "q4-earnings-2026", callId: "CC-9921", subject: "Q4 2025 Earnings Call",
    reseller: "Chorus Call Inc.", product: "Event Conference",
    moderatorCode: "4872", participantCode: "9341", securityCode: "7723" as string | null,   dialInNumber: "+27 11 535 0000", status: "running" as const,
    isLocked: false, isRecording: true, waitingMusicEnabled: true, requestsToSpeakEnabled: true,
    scheduledStart: new Date(Date.now() - 3600000), actualStart: new Date(Date.now() - 42 * 60000),
    endedAt: null, participantLimit: 500, participantLimitEnabled: false, webAccessCode: "WEB-4872",
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 2, eventId: "investor-day-2026", callId: "CC-9922", subject: "Annual Investor Day",
    reseller: "Chorus Call Inc.", product: "Event Conference",
    moderatorCode: "5511", participantCode: "8823", securityCode: null,
    dialInNumber: "+27 11 535 0001", status: "pending" as const,
    isLocked: false, isRecording: false, waitingMusicEnabled: true, requestsToSpeakEnabled: true,
    scheduledStart: new Date(Date.now() + 7200000), actualStart: null,
    endedAt: null, participantLimit: 500, participantLimitEnabled: false, webAccessCode: null,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 3, eventId: "board-briefing", callId: "CC-9919", subject: "Board Strategy Briefing",
    reseller: "Chorus Call Inc.", product: "Event Conference",
    moderatorCode: "3301", participantCode: "6612", securityCode: null,
    dialInNumber: "+27 11 535 0002", status: "completed" as const,
    isLocked: false, isRecording: false, waitingMusicEnabled: false, requestsToSpeakEnabled: false,
    scheduledStart: new Date(Date.now() - 10800000), actualStart: new Date(Date.now() - 10800000),
    endedAt: new Date(Date.now() - 5400000), participantLimit: 500, participantLimitEnabled: false, webAccessCode: null,
    createdAt: new Date(), updatedAt: new Date(),
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_PARTICIPANTS: any[] = [
  { id: 1, conferenceId: 1, lineNumber: 1, role: "moderator" as const, name: "Sarah Nkosi", company: "Chorus Call Inc.", location: "Johannesburg", phoneNumber: "+27 82 555 0100", dialInNumber: "+27 11 535 0000", voiceServer: "VS-01", state: "connected" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 42 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, conferenceId: 1, lineNumber: 2, role: "host" as const, name: "James Dlamini", company: "Chorus Call Inc.", location: "Cape Town", phoneNumber: "+27 82 555 0101", dialInNumber: "+27 11 535 0000", voiceServer: "VS-01", state: "speaking" as const, isSpeaking: true, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 40 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, conferenceId: 1, lineNumber: 3, role: "participant" as const, name: "Thabo Molefe", company: "Investec Asset Management", location: "Sandton", phoneNumber: "+27 83 555 0200", dialInNumber: "+27 11 535 0000", voiceServer: "VS-02", state: "connected" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 37 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, conferenceId: 1, lineNumber: 4, role: "participant" as const, name: "Priya Naidoo", company: "Old Mutual Investments", location: "Durban", phoneNumber: "+27 84 555 0300", dialInNumber: "+27 11 535 0000", voiceServer: "VS-02", state: "muted" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 35 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, conferenceId: 1, lineNumber: 5, role: "participant" as const, name: "Mark van der Berg", company: "Coronation Fund Managers", location: "Cape Town", phoneNumber: "+27 21 555 0400", dialInNumber: "+27 11 535 0000", voiceServer: "VS-03", state: "connected" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: true, requestToSpeakPosition: 1, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 32 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 6, conferenceId: 1, lineNumber: 6, role: "participant" as const, name: "Fatima Ismail", company: "Sanlam Investment Management", location: "Bellville", phoneNumber: "+27 21 555 0500", dialInNumber: "+27 11 535 0000", voiceServer: "VS-03", state: "parked" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 30 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 7, conferenceId: 1, lineNumber: 7, role: "participant" as const, name: "David Osei", company: "Allan Gray", location: "Cape Town", phoneNumber: "+27 21 555 0600", dialInNumber: "+27 11 535 0000", voiceServer: "VS-04", state: "connected" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 27 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 8, conferenceId: 1, lineNumber: 8, role: "participant" as const, name: null, company: null, location: "Unknown", phoneNumber: "+27 11 555 0700", dialInNumber: "+27 11 535 0000", voiceServer: "VS-04", state: "waiting_operator" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 4 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 9, conferenceId: 1, lineNumber: 9, role: "participant" as const, name: "Sipho Khumalo", company: "Nedbank Capital", location: "Sandton", phoneNumber: "+27 11 555 0800", dialInNumber: "+27 11 535 0000", voiceServer: "VS-05", state: "connected" as const, isSpeaking: false, isWebParticipant: true, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 22 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 10, conferenceId: 1, lineNumber: 10, role: "participant" as const, name: "Lerato Sithole", company: "Public Investment Corporation", location: "Pretoria", phoneNumber: "+27 12 555 0900", dialInNumber: "+27 11 535 0000", voiceServer: "VS-05", state: "muted" as const, isSpeaking: false, isWebParticipant: false, requestToSpeak: false, requestToSpeakPosition: null, subconferenceId: null, isMonitored: false, monitoringOperatorId: null, connectedAt: new Date(Date.now() - 20 * 60000), disconnectedAt: null, createdAt: new Date(), updatedAt: new Date() },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_LOUNGE: any[] = [
  { id: 1, conferenceId: 1, callId: "CL-001", phoneNumber: "+44 20 7946 0301", name: "Andrew Smith", company: "London Capital Group", dialInNumber: "+27 11 535 0000", description: "International investor — London", language: "en", arrivedAt: new Date(Date.now() - 3 * 60000), pickedAt: null, pickedByOperatorId: null, status: "waiting" as const, createdAt: new Date() },
  { id: 2, conferenceId: 1, callId: "CL-002", phoneNumber: "+1 212 555 0199", name: "Jennifer Walsh", company: "Goldman Sachs Asset Management", dialInNumber: "+27 11 535 0000", description: "International investor — New York", language: "en", arrivedAt: new Date(Date.now() - 1 * 60000), pickedAt: null, pickedByOperatorId: null, status: "waiting" as const, createdAt: new Date() },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_OP_REQUESTS: any[] = [
  { id: 1, conferenceId: 1, participantId: 8, callId: "OR-001", subject: "Q4 2025 Earnings Call", phoneNumber: "+27 11 555 0700", dialInNumber: "+27 11 535 0000", requestedAt: new Date(Date.now() - 2 * 60000), pickedAt: null, pickedByOperatorId: null, status: "pending" as const, createdAt: new Date() },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_CHAT: any[] = [
  { id: 1, conferenceId: 1, senderType: "system" as const, senderName: "System", senderId: null, recipientType: "all" as const, recipientId: null, message: "Conference started. 10 participants connected.", sentAt: new Date(Date.now() - 42 * 60000), createdAt: new Date() },
  { id: 2, conferenceId: 1, senderType: "participant" as const, senderName: "Thabo Molefe", senderId: 3, recipientType: "hosts" as const, recipientId: null, message: "Can you please clarify the guidance for H1 2026?", sentAt: new Date(Date.now() - 15 * 60000), createdAt: new Date() },
  { id: 3, conferenceId: 1, senderType: "operator" as const, senderName: "Sarah Nkosi", senderId: null, recipientType: "all" as const, recipientId: null, message: "Q&A will begin in 5 minutes. Please submit questions via the Q&A panel.", sentAt: new Date(Date.now() - 10 * 60000), createdAt: new Date() },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMO_HISTORY: any[] = [
  { id: 1, conferenceId: 1, participantId: 5, event: "connected" as const, triggeredBy: "system" as const, operatorId: null, note: null, occurredAt: new Date(Date.now() - 32 * 60000), createdAt: new Date() },
  { id: 2, conferenceId: 1, participantId: 5, event: "muted" as const, triggeredBy: "operator" as const, operatorId: null, note: null, occurredAt: new Date(Date.now() - 25 * 60000), createdAt: new Date() },
  { id: 3, conferenceId: 1, participantId: 5, event: "unmuted" as const, triggeredBy: "operator" as const, operatorId: null, note: null, occurredAt: new Date(Date.now() - 20 * 60000), createdAt: new Date() },
  { id: 4, conferenceId: 1, participantId: 5, event: "request_to_speak" as const, triggeredBy: "participant" as const, operatorId: null, note: null, occurredAt: new Date(Date.now() - 5 * 60000), createdAt: new Date() },
];

// ─── Main OCC Component ───────────────────────────────────────────────────────

export default function OCC() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Operator state
  const [operatorState, setOperatorState] = useState<OperatorState>("present");
  const [talkPath, setTalkPath] = useState<string | null>(null);

  // Window visibility
  const [showOverview, setShowOverview] = useState(true);
  const [showCCP, setShowCCP] = useState(false);
  const [showLounge, setShowLounge] = useState(false);
  const [showOpRequests, setShowOpRequests] = useState(false);
  const [showWebphone, setShowWebphone] = useState(false);
  const [webphonePrefill, setWebphonePrefill] = useState("");
  const [showCallerControl, setShowCallerControl] = useState(false);
  const [showAccessCodes, setShowAccessCodes] = useState(false);

  // Active conference in CCP
  const [activeCCPConferenceId, setActiveCCPConferenceId] = useState<number | null>(null);
  // Split-view: second CCP slot
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [secondaryCCPConferenceId, setSecondaryCCPConferenceId] = useState<number | null>(null);

  // Conference overview tab
  const [overviewTab, setOverviewTab] = useState<OverviewTab>("running");

  // CCP state
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [participantSearch, setParticipantSearch] = useState("");
  const [featureTab, setFeatureTab] = useState<FeatureTab>("monitoring");
  const [historyParticipantId, setHistoryParticipantId] = useState<number | null>(null);

  // Operator notes (per-conference)
  const [operatorNotes, setOperatorNotes] = useState<Record<number, string>>({});
  const notesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);

  // Schedule new conference modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedSubject, setSchedSubject] = useState("");
  const [schedReseller, setSchedReseller] = useState("Chorus Call Inc.");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedModCode, setSchedModCode] = useState("");
  const [schedPartCode, setSchedPartCode] = useState("");
  const [schedLimit, setSchedLimit] = useState("500");
  const [schedDialIn, setSchedDialIn] = useState("+27 11 535 0000");
  // Dial-Out Conference type
  const [schedConferenceType, setSchedConferenceType] = useState<"dial-in" | "dial-out">("dial-in");
  type DialOutParticipant = { id: string; name: string; phone: string; company: string; role: "moderator" | "participant" | "host" };
  const [schedDialOutParticipants, setSchedDialOutParticipants] = useState<DialOutParticipant[]>([]);
  const [schedDialOutForm, setSchedDialOutForm] = useState({ name: "", phone: "", company: "", role: "participant" as "moderator" | "participant" | "host" });
  const [schedDialOutCsvError, setSchedDialOutCsvError] = useState<string[]>([]);
  const [schedAutoDial, setSchedAutoDial] = useState(false);
  const [schedSmsEnabled, setSchedSmsEnabled] = useState(false);
  const [schedSmsMessage, setSchedSmsMessage] = useState("You are invited to join a conference call. Our operator will call you shortly.");
  const [schedVoiceEnabled, setSchedVoiceEnabled] = useState(false);
  const [schedVoiceMode, setSchedVoiceMode] = useState<"tts" | "upload">("tts");
  const [schedVoiceTtsText, setSchedVoiceTtsText] = useState("Hello, you are being connected to a conference call. Please hold while we connect you.");
  const [schedVoiceFile, setSchedVoiceFile] = useState<File | null>(null);

  // Dial-out form
  const [dialName, setDialName] = useState("");
  const [dialPhone, setDialPhone] = useState("");
  const [dialRole, setDialRole] = useState<"moderator" | "participant">("participant");

  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [chatRecipient, setChatRecipient] = useState<"all" | "hosts">("all");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Lounge alert
  const [loungeAlert, setLoungeAlert] = useState(true);

  // Dial-out quick-launch modal
  const [showDialOutModal, setShowDialOutModal] = useState(false);
  const [quickDialName, setQuickDialName] = useState("");
  const [quickDialPhone, setQuickDialPhone] = useState("");
  const [quickDialRole, setQuickDialRole] = useState<"moderator" | "participant">("participant");

  // Access Codes modal
  const [showAccessCodesModal, setShowAccessCodesModal] = useState(false);

  // Transfer Conference modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetOperator, setTransferTargetOperator] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferSent, setTransferSent] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingAlertVolume, setSettingAlertVolume] = useState(70);
  const [settingTimerWarning, setSettingTimerWarning] = useState(15);
  const [settingTimerCritical, setSettingTimerCritical] = useState(5);
  const [settingDefaultFilter, setSettingDefaultFilter] = useState<FilterMode>("all");
  const [settingAutoAcceptLounge, setSettingAutoAcceptLounge] = useState(false);
  const [settingShowCompany, setSettingShowCompany] = useState(true);
  const [settingDialInCountry, setSettingDialInCountry] = useState("ZA");

  // Multi-Party Dial-Out modal
  const [showMultiDialModal, setShowMultiDialModal] = useState(false);
  type DialEntry = { id: string; name: string; company: string; phone: string; role: "moderator" | "participant"; status: "pending" | "dialling" | "connected" | "failed" };
  const [dialEntries, setDialEntries] = useState<DialEntry[]>([]);
  const [dialForm, setDialForm] = useState({ name: "", company: "", phone: "", role: "participant" as "moderator" | "participant" });
  const [dialAllStatus, setDialAllStatus] = useState<"idle" | "dialling" | "done">("idle");
  const [csvImportMsg, setCsvImportMsg] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
   const csvFileRef = useRef<HTMLInputElement>(null);
  // Green Room (Speaker Sub-Conference)
  const [showGreenRoomPanel, setShowGreenRoomPanel] = useState(false);
  const [greenRoomDialForm, setGreenRoomDialForm] = useState({ name: "", phone: "", company: "", role: "participant" as "moderator" | "participant" | "host" });
  // Audio beep helper
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* AudioContext not available */ }
  }, []);

  // Track previous Needs Operator count to detect new arrivals
  const prevNeedsOperatorCount = useRef(0);

  // Caller control popup state
  const [callerControlData, setCallerControlData] = useState<{
    participantId: number;
    phone: string;
    name: string;
    company: string;
    dialIn: string;
    waitingSeconds: number;
    conferenceId: number;
    conferenceName: string;
    loungeId?: number; // set when opened from Lounge panel
  } | null>(null);
  const [callerName, setCallerName] = useState("");
  const [callerCompany, setCallerCompany] = useState("");
  const [callerRole, setCallerRole] = useState<"moderator" | "participant">("participant");

  // Ably real-time for Lounge, Operator Requests, and OCC Overview counter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ablyClientRef = useRef<any>(null);
  const ablyLoungeChanRef = useRef<any>(null);
  const ablyRequestsChanRef = useRef<any>(null);
  const ablyConferenceChanRef = useRef<any>(null);
  const ablyOverviewChanRef = useRef<any>(null);
  const [otherOperators, setOtherOperators] = useState<{ clientId: string; name: string; conferenceId: number }[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<"OK" | "DEGRADED" | "DOWN">("OK");
  const [totalActiveCalls, setTotalActiveCalls] = useState<number | null>(null);

  // Subscribe to occ:overview channel for live counter auto-refresh
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const Ably = await import("ably");
        if (!ablyClientRef.current) {
          ablyClientRef.current = new (Ably.default as any).Realtime({ key: undefined, authUrl: "/api/trpc/ably.tokenRequest" });
        }
        const client = ablyClientRef.current;
        const overviewChan = client.channels.get("occ:overview");
        ablyOverviewChanRef.current = overviewChan;
        overviewChan.subscribe((msg: any) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(msg.data);
            if (msg.name === "overview.update") {
              // Bridge pushes { runningCount, pendingCount, bridgeStatus } on any state change
              if (typeof payload.runningCount === "number") setTotalActiveCalls(payload.runningCount);
              if (payload.bridgeStatus) setBridgeStatus(payload.bridgeStatus);
              // Trigger a background refetch of conferences so the list stays in sync
              conferencesQuery.refetch().catch(() => {});
            } else if (msg.name === "conference.status") {
              // Individual conference status change pushed by bridge
              setLocalConferences(prev => prev.map(c =>
                c.id === payload.conferenceId ? { ...c, status: payload.status } : c
              ));
              conferencesQuery.refetch().catch(() => {});
            }
          } catch {}
        });
      } catch {
        // Ably not configured — counters stay reactive to local state
      }
    })();
    return () => {
      cancelled = true;
      ablyOverviewChanRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeCCPConferenceId) return;
    let cancelled = false;
    (async () => {
      try {
        const Ably = await import("ably");
        // Re-use existing client or create a new one
        if (!ablyClientRef.current) {
          ablyClientRef.current = new (Ably.default as any).Realtime({ key: undefined, authUrl: "/api/trpc/ably.tokenRequest" });
        }
        const client = ablyClientRef.current;

        // Lounge channel
        const loungeChan = client.channels.get(`occ:lounge:${activeCCPConferenceId}`);
        ablyLoungeChanRef.current = loungeChan;
        loungeChan.subscribe((msg: any) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(msg.data);
            if (msg.name === "lounge.enter") {
              setLocalLounge(prev => [...prev.filter(l => l.id !== payload.id), payload]);
            } else if (msg.name === "lounge.pick" || msg.name === "lounge.leave") {
              setLocalLounge(prev => prev.filter(l => l.id !== payload.id));
            }
          } catch {}
        });

        // Operator Requests channel
        const reqChan = client.channels.get(`occ:requests:${activeCCPConferenceId}`);
        ablyRequestsChanRef.current = reqChan;
        reqChan.subscribe((msg: any) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(msg.data);
            if (msg.name === "request.new") {
              setLocalOpRequests(prev => [...prev.filter(r => r.id !== payload.id), payload]);
            } else if (msg.name === "request.pick" || msg.name === "request.clear") {
              setLocalOpRequests(prev => prev.filter(r => r.id !== payload.id));
            }
          } catch {}
        });

        // Conference participant state sync channel
        const confChan = client.channels.get(`occ:conference:${activeCCPConferenceId}`);
        ablyConferenceChanRef.current = confChan;
        confChan.subscribe((msg: any) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(msg.data);
            if (msg.name === "participant.state") {
              // Another operator changed a participant state — sync it locally
              setLocalParticipants(prev => prev.map(p =>
                p.id === payload.participantId
                  ? { ...p, state: payload.state, isSpeaking: payload.state === 'speaking', requestToSpeak: payload.requestToSpeak ?? p.requestToSpeak }
                  : p
              ));
            } else if (msg.name === "participant.join") {
              // New participant joined from another operator's dial-out
              setLocalParticipants(prev => {
                if (prev.find(p => p.id === payload.id)) return prev;
                return [...prev, payload];
              });
            } else if (msg.name === "participant.drop") {
              setLocalParticipants(prev => prev.map(p =>
                p.id === payload.participantId ? { ...p, state: 'dropped' as const } : p
              ));
            } else if (msg.name === "conference.mute_all") {
              setLocalParticipants(prev => prev.map(p =>
                p.role === 'participant' ? { ...p, state: 'muted' as const } : p
              ));
            } else if (msg.name === "conference.extend") {
              // Conference duration extended — update local conference end time
              setLocalConferences(prev => prev.map(c =>
                c.id === activeCCPConferenceId
                  ? { ...c, scheduledEnd: payload.newEndTime ? new Date(payload.newEndTime) : c.scheduledEnd }
                  : c
              ));
            }
          } catch {}
        });

        // Presence — track which operators have this conference open
        try {
          await confChan.presence.enter(JSON.stringify({ name: 'Operator', conferenceId: activeCCPConferenceId }));
          const members = await confChan.presence.get();
          if (!cancelled) {
            setOtherOperators(members
              .filter((m: any) => m.clientId !== client.auth?.clientId)
              .map((m: any) => {
                try { return { clientId: m.clientId, ...JSON.parse(m.data) }; }
                catch { return { clientId: m.clientId, name: 'Operator', conferenceId: activeCCPConferenceId }; }
              })
            );
          }
          confChan.presence.subscribe((member: any) => {
            if (cancelled) return;
            confChan.presence.get().then((all: any[]) => {
              setOtherOperators(all
                .filter((m: any) => m.clientId !== client.auth?.clientId)
                .map((m: any) => {
                  try { return { clientId: m.clientId, ...JSON.parse(m.data) }; }
                  catch { return { clientId: m.clientId, name: 'Operator', conferenceId: activeCCPConferenceId }; }
                })
              );
            }).catch(() => {});
          });
        } catch { /* presence not available in demo mode */ }

      } catch {
        // Ably not configured — demo mode already has data, no action needed
      }
    })();
    return () => {
      cancelled = true;
      ablyLoungeChanRef.current?.unsubscribe();
      ablyRequestsChanRef.current?.unsubscribe();
      try { ablyConferenceChanRef.current?.presence.leave(); } catch {}
      ablyConferenceChanRef.current?.unsubscribe();
    };
  }, [activeCCPConferenceId]);

  // Local state (demo mode — mirrors DB state locally for instant feedback)
  const [localConferences, setLocalConferences] = useState(DEMO_CONFERENCES);
  const [localParticipants, setLocalParticipants] = useState(DEMO_PARTICIPANTS);
  const [localLounge, setLocalLounge] = useState(DEMO_LOUNGE);
  const [localOpRequests, setLocalOpRequests] = useState(DEMO_OP_REQUESTS);
  const [localChat, setLocalChat] = useState(DEMO_CHAT);
  const [localHistory] = useState(DEMO_HISTORY);

  // Duration ticker
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Operator profile
  const { data: operatorProfile } = trpc.profile.get.useQuery();

  // tRPC queries (with demo fallback)
  const conferencesQuery = trpc.occ.getConferences.useQuery(undefined, { retry: false });
  const conferences = (conferencesQuery.data && conferencesQuery.data.length > 0)
    ? conferencesQuery.data
    : localConferences;

  const activeConf = activeCCPConferenceId
    ? conferences.find(c => c.id === activeCCPConferenceId) ?? null
    : null;

  const participantsQuery = trpc.occ.getParticipants.useQuery(
    { conferenceId: activeCCPConferenceId ?? 0 },
    { enabled: !!activeCCPConferenceId, retry: false }
  );
  const participants = (participantsQuery.data && participantsQuery.data.length > 0)
    ? participantsQuery.data
    : (activeCCPConferenceId === 1 ? localParticipants : []);

  const loungeQuery = trpc.occ.getLounge.useQuery(
    { conferenceId: activeCCPConferenceId ?? 0 },
    { enabled: !!activeCCPConferenceId, retry: false }
  );
  const loungeEntries = (loungeQuery.data && loungeQuery.data.length > 0)
    ? loungeQuery.data
    : (activeCCPConferenceId === 1 ? localLounge : []);

  const opRequestsQuery = trpc.occ.getOperatorRequests.useQuery(
    { conferenceId: activeCCPConferenceId ?? 0 },
    { enabled: !!activeCCPConferenceId, retry: false }
  );
  const opRequests = (opRequestsQuery.data && opRequestsQuery.data.length > 0)
    ? opRequestsQuery.data
    : (activeCCPConferenceId === 1 ? localOpRequests : []);

  const chatQuery = trpc.occ.getChatMessages.useQuery(
    { conferenceId: activeCCPConferenceId ?? 0 },
    { enabled: !!activeCCPConferenceId, retry: false }
  );
  const chatMessages = (chatQuery.data && chatQuery.data.length > 0)
    ? chatQuery.data
    : (activeCCPConferenceId === 1 ? localChat : []);

  const historyQuery = trpc.occ.getParticipantHistory.useQuery(
    { participantId: historyParticipantId ?? 0 },
    { enabled: !!historyParticipantId, retry: false }
  );
  const historyItems = (historyQuery.data && historyQuery.data.length > 0)
    ? historyQuery.data
    : (historyParticipantId ? localHistory : []);

  // tRPC mutations
  const updateStateMut = trpc.occ.updateParticipantState.useMutation();
  const toggleRecordMut = trpc.occ.toggleRecording.useMutation();
  const toggleLockMut = trpc.occ.toggleLock.useMutation();
  const muteAllMut = trpc.occ.muteAll.useMutation();
  const terminateMut = trpc.occ.terminateConference.useMutation();
  const dialOutMut = trpc.occ.dialOut.useMutation();
  const pickLoungeMut = trpc.occ.pickFromLounge.useMutation();
  const pickOpReqMut = trpc.occ.pickOperatorRequest.useMutation();
  const sendChatMut = trpc.occ.sendChatMessage.useMutation();
  // Green Room
  const greenRoomQuery = trpc.occ.getGreenRoom.useQuery(
    { conferenceId: activeCCPConferenceId ?? 0 },
    { enabled: !!activeCCPConferenceId && showGreenRoomPanel, refetchInterval: showGreenRoomPanel ? 5000 : false }
  );
  const createGreenRoomMut = trpc.occ.createGreenRoom.useMutation({ onSuccess: () => greenRoomQuery.refetch() });
  const closeGreenRoomMut = trpc.occ.closeGreenRoom.useMutation({ onSuccess: () => greenRoomQuery.refetch() });
  const addToGreenRoomMut = trpc.occ.addToGreenRoom.useMutation({ onSuccess: () => { participantsQuery.refetch(); greenRoomQuery.refetch(); } });
  const transferGreenRoomMut = trpc.occ.transferGreenRoomToMain.useMutation({ onSuccess: () => { participantsQuery.refetch(); greenRoomQuery.refetch(); } });

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  // ── Computed filter counts ──────────────────────────────────────────────────
  const counts = {
    all: participants.length,
    moderators: participants.filter(p => p.role === "moderator" || p.role === "host").length,
    participants: participants.filter(p => p.role === "participant").length,
    unmuted: participants.filter(p => p.state === "connected" || p.state === "speaking").length,
    muted: participants.filter(p => p.state === "muted").length,
    parked: participants.filter(p => p.state === "parked").length,
    connected: participants.filter(p => p.state !== "dropped" && p.state !== "free").length,
    waiting: participants.filter(p => p.state === "waiting_operator").length,
    web: participants.filter(p => p.isWebParticipant).length,
    speak_requests: participants.filter(p => p.requestToSpeak).length,
  };

  const filteredParticipants = participants.filter(p => {
    // Search filter
    if (participantSearch.trim()) {
      const q = participantSearch.toLowerCase();
      const matchesSearch = (
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.company ?? "").toLowerCase().includes(q) ||
        (p.phoneNumber ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }
    // Mode filter
    switch (filterMode) {
      case "moderators": return p.role === "moderator" || p.role === "host";
      case "participants": return p.role === "participant";
      case "unmuted": return p.state === "connected" || p.state === "speaking";
      case "muted": return p.state === "muted";
      case "parked": return p.state === "parked";
      case "connected": return p.state !== "dropped" && p.state !== "free";
      case "waiting": return p.state === "waiting_operator";
      case "web": return p.isWebParticipant;
      case "speak_requests": return p.requestToSpeak;
      default: return true;
    }
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openCCP = useCallback((confId: number) => {
    setActiveCCPConferenceId(confId);
    setShowCCP(true);
    setSelectedParticipantIds([]);
    setFilterMode("all");
    setFeatureTab("monitoring");
  }, []);

  const toggleParticipantSelect = (id: number) => {
    setSelectedParticipantIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const doParticipantAction = async (
    action: "muted" | "connected" | "parked" | "dropped",
    ids: number[]
  ) => {
    if (!activeCCPConferenceId) return;
    for (const id of ids) {
      // Optimistic local update
      setLocalParticipants(prev =>
        prev.map(p => p.id === id ? { ...p, state: action, isSpeaking: false } : p)
      );
      try {
        await updateStateMut.mutateAsync({
          participantId: id,
          conferenceId: activeCCPConferenceId,
          state: action,
        });
      } catch { /* demo mode — local update already applied */ }
    }
    setSelectedParticipantIds([]);
  };

  const doMuteAll = async () => {
    if (!activeCCPConferenceId) return;
    setLocalParticipants(prev =>
      prev.map(p =>
        (p.state === "connected" || p.state === "speaking") && p.conferenceId === activeCCPConferenceId
          ? { ...p, state: "muted" as const, isSpeaking: false }
          : p
      )
    );
    try { await muteAllMut.mutateAsync({ conferenceId: activeCCPConferenceId }); } catch { }
  };

  // Notes auto-save with debounce
  const handleNotesChange = (confId: number, value: string) => {
    setOperatorNotes(prev => ({ ...prev, [confId]: value }));
    setNotesSaved(false);
    if (notesSaveTimerRef.current) clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }, 1200);
  };

  // Schedule new conference
  const doScheduleConference = () => {
    if (!schedSubject.trim() || !schedDate || !schedTime) return;
    const scheduledStart = new Date(`${schedDate}T${schedTime}`);
    const newConf = {
      id: Date.now(),
      callId: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: schedSubject,
      reseller: schedReseller,
      dialInNumber: schedDialIn,
      moderatorCode: schedModCode || String(Math.floor(1000 + Math.random() * 9000)),
      participantCode: schedPartCode || String(Math.floor(1000 + Math.random() * 9000)),
      securityCode: null,
      status: "pending" as const,
      isRecording: false,
      isLocked: false,
      scheduledStart,
      actualStart: null,
      endedAt: null,
      participantLimit: parseInt(schedLimit) || 500,
      participantLimitEnabled: false,
      webAccessCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      conferenceType: schedConferenceType,
      dialOutParticipants: schedConferenceType === "dial-out" ? [...schedDialOutParticipants] : [],
    };
    setLocalConferences(prev => [...prev, newConf]);
    if (schedConferenceType === "dial-out" && schedDialOutParticipants.length > 0) {
      toast.success(`Dial-Out Conference scheduled with ${schedDialOutParticipants.length} participant${schedDialOutParticipants.length !== 1 ? "s" : ""}`);
    } else {
      toast.success("Conference scheduled");
    }
    setShowScheduleModal(false);
    setSchedSubject(""); setSchedDate(""); setSchedTime(""); setSchedModCode(""); setSchedPartCode("");
    setSchedConferenceType("dial-in"); setSchedDialOutParticipants([]); setSchedDialOutCsvError([]);
    setSchedDialOutForm({ name: "", phone: "", company: "", role: "participant" });
    setSchedAutoDial(false); setSchedSmsEnabled(false); setSchedVoiceEnabled(false);
    setSchedVoiceFile(null); setSchedVoiceMode("tts");
  };

  const doMuteParticipantsOnly = async () => {
    if (!activeCCPConferenceId) return;
    setLocalParticipants(prev =>
      prev.map(p =>
        (p.state === "connected" || p.state === "speaking") &&
        p.conferenceId === activeCCPConferenceId &&
        p.role === "participant"
          ? { ...p, state: "muted" as const, isSpeaking: false }
          : p
      )
    );
    try { await muteAllMut.mutateAsync({ conferenceId: activeCCPConferenceId }); } catch { }
  };

  // Speak Next: unmute participant, set Speaking, lower hand, auto-mute previous speaker
  const doSpeakNext = (participantId: number) => {
    setLocalParticipants(prev => {
      // First, mute any current speaker (who is not a moderator/host)
      const withPrevMuted = prev.map(p =>
        p.state === "speaking" && p.role === "participant"
          ? { ...p, state: "muted" as const, isSpeaking: false }
          : p
      );
      // Then unmute the target participant and lower their hand
      return withPrevMuted.map(p =>
        p.id === participantId
          ? { ...p, state: "speaking" as const, isSpeaking: true, requestToSpeak: false, requestToSpeakPosition: null }
          : p
      );
    });
  };

  const doToggleRecord = async () => {
    if (!activeConf) return;
    const next = !activeConf.isRecording;
    setLocalConferences(prev => prev.map(c => c.id === activeConf.id ? { ...c, isRecording: next } : c));
    try { await toggleRecordMut.mutateAsync({ conferenceId: activeConf.id, isRecording: next }); } catch { }
  };

  const doToggleLock = async () => {
    if (!activeConf) return;
    const next = !activeConf.isLocked;
    setLocalConferences(prev => prev.map(c => c.id === activeConf.id ? { ...c, isLocked: next } : c));
    try { await toggleLockMut.mutateAsync({ conferenceId: activeConf.id, isLocked: next }); } catch { }
  };

  const doDialOut = async () => {
    if (!activeCCPConferenceId || !dialPhone) return;
    const newP = {
      id: Date.now(),
      conferenceId: activeCCPConferenceId,
      lineNumber: participants.length + 1,
      role: dialRole,
      name: dialName || null,
      company: null,
      location: "Dial-out",
      phoneNumber: dialPhone,
      dialInNumber: null,
      voiceServer: "VS-01",
      state: "incoming" as const,
      isSpeaking: false,
      isWebParticipant: false,
      requestToSpeak: false,
      requestToSpeakPosition: null,
      subconferenceId: null,
      isMonitored: false,
      monitoringOperatorId: null,
      connectedAt: new Date(),
      disconnectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalParticipants(prev => [...prev, newP]);
    setDialName(""); setDialPhone("");
    try {
      await dialOutMut.mutateAsync({ conferenceId: activeCCPConferenceId, name: dialName, phoneNumber: dialPhone, role: dialRole });
    } catch { }
  };

  // Open Caller Control from a Lounge entry instead of routing directly
  const doPickLoungeViaCallerControl = (entry: typeof DEMO_LOUNGE[0]) => {
    setCallerControlData({
      participantId: entry.id * -1, // negative ID signals lounge origin
      phone: entry.phoneNumber,
      name: entry.name ?? "",
      company: entry.company ?? "",
      dialIn: entry.dialInNumber ?? "",
      waitingSeconds: Math.floor((Date.now() - new Date(entry.arrivedAt).getTime()) / 1000),
      conferenceId: entry.conferenceId,
      conferenceName: activeConf?.subject ?? "Conference",
      loungeId: entry.id,
    });
    setCallerName(entry.name ?? "");
    setCallerCompany(entry.company ?? "");
    setCallerRole("participant");
  };

  const doPickLounge = async (loungeId: number) => {
    setLocalLounge(prev => prev.filter(l => l.id !== loungeId));
    try { await pickLoungeMut.mutateAsync({ loungeId, conferenceId: activeCCPConferenceId ?? 0 }); } catch { }
  };

  const doPickOpRequest = async (reqId: number) => {
    setLocalOpRequests(prev => prev.filter(r => r.id !== reqId));
    try { await pickOpReqMut.mutateAsync({ requestId: reqId, conferenceId: activeCCPConferenceId ?? 0 }); } catch { }
  };

  // Watch for new Needs Operator participants and play beep
  useEffect(() => {
    const count = localParticipants.filter(p => p.state === "waiting_operator").length;
    if (count > prevNeedsOperatorCount.current) {
      playBeep();
    }
    prevNeedsOperatorCount.current = count;
  }, [localParticipants, playBeep]);

  // Simulate an incoming caller (demo feature for Board presentation)
  const doSimulateIncomingCall = () => {
    if (!activeCCPConferenceId || !activeConf) return;
    const demoCallers = [
      { phone: "+44 20 7946 0801", name: "Oliver Thompson", company: "Barclays Investment Bank", location: "London" },
      { phone: "+1 646 555 0234", name: "Sarah Mitchell", company: "JPMorgan Asset Management", location: "New York" },
      { phone: "+27 11 555 0999", name: null, company: null, location: "Unknown" },
      { phone: "+49 30 555 0177", name: "Klaus Weber", company: "Deutsche Bank", location: "Frankfurt" },
      { phone: "+852 2555 0144", name: "Li Wei", company: "HSBC Asset Management", location: "Hong Kong" },
    ];
    const caller = demoCallers[Math.floor(Math.random() * demoCallers.length)];
    const newP = {
      id: Date.now(),
      conferenceId: activeCCPConferenceId,
      lineNumber: localParticipants.filter(p => p.conferenceId === activeCCPConferenceId).length + 1,
      role: "participant" as const,
      name: caller.name,
      company: caller.company,
      location: caller.location,
      phoneNumber: caller.phone,
      dialInNumber: "+27 11 535 0000",
      voiceServer: "VS-0" + (Math.floor(Math.random() * 5) + 1),
      state: "waiting_operator" as const,
      isSpeaking: false,
      isWebParticipant: false,
      requestToSpeak: false,
      requestToSpeakPosition: null,
      subconferenceId: null,
      isMonitored: false,
      monitoringOperatorId: null,
      connectedAt: new Date(),
      disconnectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalParticipants(prev => [...prev, newP]);
  };

  // Quick dial-out from modal
  const doQuickDialOut = async () => {
    if (!quickDialPhone.trim() || !activeCCPConferenceId) return;
    const newP = {
      id: Date.now(),
      conferenceId: activeCCPConferenceId,
      lineNumber: localParticipants.filter(p => p.conferenceId === activeCCPConferenceId).length + 1,
      role: quickDialRole,
      name: quickDialName || null,
      company: null,
      location: "Dial-Out",
      phoneNumber: quickDialPhone,
      dialInNumber: null,
      voiceServer: "VS-01",
      state: "connected" as const,
      isSpeaking: false,
      isWebParticipant: false,
      requestToSpeak: false,
      requestToSpeakPosition: null,
      subconferenceId: null,
      isMonitored: false,
      monitoringOperatorId: null,
      connectedAt: new Date(),
      disconnectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalParticipants(prev => [...prev, newP]);
    setShowDialOutModal(false);
    setQuickDialName("");
    setQuickDialPhone("");
    setQuickDialRole("participant");
    try { await dialOutMut.mutateAsync({ conferenceId: activeCCPConferenceId, name: quickDialName || undefined, phoneNumber: quickDialPhone, role: quickDialRole }); } catch { }
  };

  const doSendChat = async () => {
    if (!chatMessage.trim() || !activeCCPConferenceId) return;
    const msg = {
      id: Date.now(),
      conferenceId: activeCCPConferenceId,
      senderType: "operator" as const,
      senderName: user?.name ?? "Operator",
      senderId: null,
      recipientType: chatRecipient,
      recipientId: null,
      message: chatMessage.trim(),
      sentAt: new Date(),
      createdAt: new Date(),
    };
    setLocalChat(prev => [...prev, msg]);
    setChatMessage("");
    try {
      await sendChatMut.mutateAsync({
        conferenceId: activeCCPConferenceId,
        senderName: user?.name ?? "Operator",
        senderType: "operator",
        message: msg.message,
        recipientType: chatRecipient,
      });
    } catch { }
  };

  // ── Caller Control helpers ──────────────────────────────────────────────────

  const openCallerControl = (p: typeof DEMO_PARTICIPANTS[0]) => {
    setCallerControlData({
      participantId: p.id,
      phone: p.phoneNumber ?? "Unknown",
      name: p.name ?? "",
      company: p.company ?? "",
      dialIn: p.dialInNumber ?? "",
      waitingSeconds: Math.floor((Date.now() - new Date(p.connectedAt).getTime()) / 1000),
      conferenceId: p.conferenceId,
      conferenceName: activeConf?.subject ?? "Conference",
    });
    setCallerName(p.name ?? "");
    setCallerCompany(p.company ?? "");
    setCallerRole("participant");
  };

  const doCallerRoute = async (action: "moderator" | "participant" | "hold" | "drop") => {
    if (!callerControlData) return;
    const { participantId, conferenceId } = callerControlData;
    const isLoungeEntry = participantId < 0;
    const loungeId = isLoungeEntry ? (callerControlData as any).loungeId as number : null;

    if (action === "drop") {
      if (isLoungeEntry && loungeId) {
        // Drop from lounge — just remove
        doPickLounge(loungeId);
      } else {
        setLocalParticipants(prev => prev.map(p => p.id === participantId ? { ...p, state: "dropped" as const } : p));
        try { await updateStateMut.mutateAsync({ participantId, conferenceId, state: "dropped" }); } catch {}
      }
    } else if (action === "hold") {
      if (isLoungeEntry) {
        // Keep in lounge — just close popup
      } else {
        setLocalParticipants(prev => prev.map(p => p.id === participantId ? { ...p, state: "parked" as const } : p));
        try { await updateStateMut.mutateAsync({ participantId, conferenceId, state: "parked" }); } catch {}
      }
    } else {
      if (isLoungeEntry && loungeId) {
        // Route from lounge: remove from lounge, add as participant
        doPickLounge(loungeId);
        const newP = {
          id: Date.now(),
          conferenceId,
          lineNumber: localParticipants.filter(p => p.conferenceId === conferenceId).length + 1,
          role: action,
          name: callerName || callerControlData.name || null,
          company: callerCompany || callerControlData.company || null,
          location: "Lounge",
          phoneNumber: callerControlData.phone,
          dialInNumber: callerControlData.dialIn || null,
          voiceServer: "VS-01",
          state: "connected" as const,
          isSpeaking: false,
          isWebParticipant: false,
          requestToSpeak: false,
          requestToSpeakPosition: null,
          subconferenceId: null,
          isMonitored: false,
          monitoringOperatorId: null,
          connectedAt: new Date(),
          disconnectedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setLocalParticipants(prev => [...prev, newP]);
      } else {
        // Route existing participant
        setLocalParticipants(prev => prev.map(p =>
          p.id === participantId
            ? { ...p, name: callerName || p.name, company: callerCompany || p.company, role: action, state: "connected" as const }
            : p
        ));
        try { await updateStateMut.mutateAsync({ participantId, conferenceId, state: "connected" }); } catch {}
      }
    }
    setCallerControlData(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const runningConfs = conferences.filter(c => c.status === "running");
  const pendingConfs = conferences.filter(c => c.status === "pending");
  const completedConfs = conferences.filter(c => c.status === "completed");

  const overviewConfs = overviewTab === "running" ? runningConfs
    : overviewTab === "pending" ? pendingConfs
    : overviewTab === "completed" ? completedConfs
    : conferences;

  // ── Auth guard ────────────────────────────────────────────────────────────
  const { loading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center animate-pulse">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading Chorus.OCC…</p>
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
            <h1 className="text-xl font-bold text-white mb-2">Chorus.OCC</h1>
            <p className="text-slate-400 text-sm leading-relaxed">Operator Call Centre access requires authentication. Please sign in with your Chorus Call operator account.</p>
          </div>
          <a
            href={`/api/oauth/login?returnTo=${encodeURIComponent('/occ')}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            Sign in to access OCC
          </a>
          <a href="/" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">← Back to Chorus.AI</a>
        </div>
      </div>
    );
  }

  // Operator role check — admin and operator roles can access OCC
  const userRole = (user as any)?.role;
  if (userRole && userRole !== 'admin' && userRole !== 'operator') {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="bg-[#111827] border border-red-800/40 rounded-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-slate-400 text-sm leading-relaxed">Your account does not have operator access to Chorus.OCC. Contact your Chorus Call administrator to request access.</p>
          </div>
          <a href="/" className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">← Back to Chorus.AI</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200 flex flex-col" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>

      {/* ── Top Menu Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111827] border-b border-slate-700/60 shrink-0">
        {/* Left: Logo + menus */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Chorus<span className="text-blue-400">.OCC</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
            {["File", "Conference", "Participants", "Utility", "Setup", "Help"].map(m => (
              <button key={m} className="px-2 py-1 rounded hover:bg-slate-700 hover:text-slate-200 transition-colors">{m}</button>
            ))}
          </div>
        </div>

        {/* Centre: Window launcher icons */}
        <div className="flex items-center gap-1">
          {[
            { icon: Bell, label: "Requests", count: opRequests.length, color: opRequests.length > 0 ? "text-red-400" : "text-slate-400", onClick: () => setShowOpRequests(v => !v) },
            { icon: Users, label: "Lounge", count: loungeEntries.length, color: loungeEntries.length > 0 ? "text-amber-400" : "text-slate-400", onClick: () => setShowLounge(v => !v) },
            { icon: LayoutGrid, label: "Overview", count: runningConfs.length, color: "text-blue-400", onClick: () => setShowOverview(v => !v) },
            { icon: Activity, label: "CCP", count: null, color: showCCP ? "text-emerald-400" : "text-slate-400", onClick: () => setShowCCP(v => !v) },
            { icon: List, label: "Access Codes", count: null, color: showAccessCodesModal ? "text-blue-400" : "text-slate-400", onClick: () => setShowAccessCodesModal(v => !v) },
            { icon: Phone, label: "Webphone", count: null, color: showWebphone ? "text-emerald-400" : "text-slate-400", onClick: () => setShowWebphone(v => !v) },
            { icon: GraduationCap, label: "Training", count: null, color: "text-violet-400", onClick: () => navigate("/training") },
          ].map(({ icon: Icon, label, count, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              title={label}
              className="relative flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="hidden lg:block text-xs text-slate-400">{label}</span>
              {count !== null && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Operator state */}
        <div className="flex items-center gap-3">
          {talkPath && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
              <Headphones className="w-3.5 h-3.5" />
              <span>Talk path: {talkPath}</span>
              <button onClick={() => setTalkPath(null)} className="ml-1 hover:text-amber-300"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#1a2236] border border-slate-700 rounded px-3 py-1.5">
            {operatorProfile?.avatarUrl ? (
              <img src={operatorProfile.avatarUrl} alt="Operator" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
            ) : (
              <div className={`w-2.5 h-2.5 rounded-full ${operatorStateColor(operatorState)}`} />
            )}
            <div className="leading-tight">
              <span className="text-xs font-medium text-slate-200">{operatorProfile?.name ?? user?.name ?? "Operator"}</span>
              {operatorProfile?.jobTitle && <span className="hidden xl:inline text-[10px] text-slate-400 ml-1">· {operatorProfile.jobTitle}</span>}
            </div>
            <span className="text-xs text-slate-400">({operatorStateLabel(operatorState)})</span>
          </div>
          <button
            onClick={() => setOperatorState(s => s === "present" ? "break" : "present")}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-slate-600 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            {operatorState === "break" ? "Resume" : "Break"}
          </button>
          <button
            onClick={() => setOperatorState("absent")}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-slate-600 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* ── Main workspace ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-auto">

        {/* ── Live Call Counter Dashboard ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 shrink-0">
          {[
            { label: "Live Calls", value: totalActiveCalls !== null ? totalActiveCalls : runningConfs.length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Activity },
            { label: "Pending", value: pendingConfs.length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
            { label: "Completed", value: completedConfs.length, color: "text-slate-300", bg: "bg-slate-700/30 border-slate-700", icon: CheckCircle2 },
            { label: "Lounge", value: loungeEntries.length, color: loungeEntries.length > 0 ? "text-amber-400" : "text-slate-400", bg: loungeEntries.length > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-700/30 border-slate-700", icon: Users },
            { label: "Op Requests", value: opRequests.length, color: opRequests.length > 0 ? "text-red-400" : "text-slate-400", bg: opRequests.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-slate-700/30 border-slate-700", icon: Bell },
            { label: "Participants", value: participants.length, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Headphones },
            { label: "Active CCP", value: activeCCPConferenceId ? 1 : 0, color: activeCCPConferenceId ? "text-emerald-400" : "text-slate-500", bg: activeCCPConferenceId ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-700/30 border-slate-700", icon: Radio },
            { label: "Bridge", value: bridgeStatus, color: bridgeStatus === "OK" ? "text-emerald-400" : bridgeStatus === "DEGRADED" ? "text-amber-400" : "text-red-400", bg: bridgeStatus === "OK" ? "bg-emerald-500/10 border-emerald-500/20" : bridgeStatus === "DEGRADED" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20", icon: bridgeStatus === "OK" ? Wifi : WifiOff },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={`flex items-center gap-2.5 border rounded-lg px-3 py-2 ${bg}`}>
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div className="min-w-0">
                <div className={`text-sm font-bold leading-none ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Operator Requests Panel ─────────────────────────────────────────── */}
        {showOpRequests && (
          <div className="bg-[#111827] border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                <span className="font-semibold text-sm">Operator Requests</span>
                {opRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{opRequests.length}</span>
                )}
              </div>
              <button onClick={() => setShowOpRequests(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            {opRequests.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-xs">No pending operator requests</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-3 py-2">Call-ID</th>
                    <th className="text-left px-3 py-2">Subject</th>
                    <th className="text-left px-3 py-2">Phone</th>
                    <th className="text-left px-3 py-2">Dial-In</th>
                    <th className="text-left px-3 py-2">Time</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opRequests.map(req => (
                    <tr key={req.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-mono text-blue-400">{req.callId}</td>
                      <td className="px-3 py-2">{req.subject}</td>
                      <td className="px-3 py-2 font-mono">{req.phoneNumber}</td>
                      <td className="px-3 py-2 font-mono text-slate-400">{req.dialInNumber}</td>
                      <td className="px-3 py-2 text-slate-400">{formatTime(req.requestedAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => doPickOpRequest(req.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
                          >
                            <UserCheck className="w-3 h-3" /> Pick
                          </button>
                          <button
                            onClick={() => { setActiveCCPConferenceId(req.conferenceId); setShowCCP(true); }}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors"
                          >
                            <Activity className="w-3 h-3" /> CCP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Lounge Panel ────────────────────────────────────────────────────── */}
        {showLounge && (
          <div className="bg-[#111827] border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-sm">Lounge</span>
                {loungeEntries.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{loungeEntries.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoungeAlert(v => !v)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${loungeAlert ? "border-amber-500 text-amber-400" : "border-slate-600 text-slate-400"}`}
                >
                  {loungeAlert ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  Alert {loungeAlert ? "ON" : "OFF"}
                </button>
                <button onClick={() => setShowLounge(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {loungeEntries.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-xs">Lounge is empty</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left px-3 py-2">Call-ID</th>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Company</th>
                    <th className="text-left px-3 py-2">Phone</th>
                    <th className="text-left px-3 py-2">Waiting</th>
                    <th className="text-left px-3 py-2">Language</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loungeEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-mono text-blue-400">{entry.callId}</td>
                      <td className="px-3 py-2 font-medium">{entry.name ?? <span className="text-slate-500 italic">Unknown</span>}</td>
                      <td className="px-3 py-2 text-slate-400">{entry.company ?? "—"}</td>
                      <td className="px-3 py-2 font-mono">{entry.phoneNumber}</td>
                      <td className="px-3 py-2 text-amber-400">{formatDuration(entry.arrivedAt)}</td>
                      <td className="px-3 py-2 uppercase text-slate-400">{entry.language ?? "en"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => doPickLoungeViaCallerControl(entry)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs transition-colors"
                          >
                            <UserCheck className="w-3 h-3" /> Pick
                          </button>
                          <button
                            onClick={() => { setActiveCCPConferenceId(entry.conferenceId); setShowCCP(true); }}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors"
                          >
                            <Activity className="w-3 h-3" /> CCP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Webphone Panel ───────────────────────────────────────────────────── */}
        {showWebphone && (
          <div className="flex justify-end gap-4">
            <div className="w-80">
              <WebphoneActivityCard />
            </div>
            <Webphone
              prefillNumber={webphonePrefill}
              defaultMinimised={false}
              onCallStart={() => setWebphonePrefill("")}
            />
          </div>
        )}
        {/* ── Conference Overview ──────────────────────────────────────────────── */}
        {showOverview && (
          <div className="bg-[#111827] border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm">Conference Overview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-700/30 hover:bg-blue-700/50 text-blue-400 border border-blue-700/30 rounded text-xs font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" /> Schedule
                </button>
                <button className="text-slate-400 hover:text-slate-200"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setShowOverview(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Tab bar */}
            <div className="flex border-b border-slate-700">
              {([
                { key: "running", label: "Running", count: runningConfs.length },
                { key: "pending", label: "Pending", count: pendingConfs.length },
                { key: "completed", label: "Completed", count: completedConfs.length },
                { key: "alarms", label: "Alarms", count: 0 },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOverviewTab(tab.key)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    overviewTab === tab.key
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 bg-[#0d1526]">
                    <th className="text-left px-3 py-2 w-6"></th>
                    <th className="text-left px-3 py-2">Call-ID</th>
                    <th className="text-left px-3 py-2">Subject</th>
                    <th className="text-left px-3 py-2">Reseller</th>
                    <th className="text-left px-3 py-2">Start</th>
                    <th className="text-left px-3 py-2">Duration</th>
                    <th className="text-right px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Mod Code</th>
                    <th className="text-left px-3 py-2">Part Code</th>
                    <th className="text-left px-3 py-2">Dial-In</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewConfs.length === 0 ? (
                    <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-500">No conferences in this view</td></tr>
                  ) : overviewConfs.map(conf => {
                    const pCount = conf.id === 1 ? localParticipants.filter(p => p.conferenceId === 1).length : 0;
                    return (
                      <tr
                        key={conf.id}
                        className={`border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer ${activeCCPConferenceId === conf.id ? "bg-blue-900/20" : ""}`}
                        onClick={() => openCCP(conf.id)}
                      >
                        <td className="px-3 py-2">
                          {conf.isRecording && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Recording" />}
                        </td>
                        <td className="px-3 py-2 font-mono text-blue-400 font-medium">{conf.callId}</td>
                        <td className="px-3 py-2 font-medium text-slate-200">{conf.subject}</td>
                        <td className="px-3 py-2 text-slate-400">{conf.reseller}</td>
                        <td className="px-3 py-2 text-slate-400">{formatTime(conf.actualStart ?? conf.scheduledStart)}</td>
                        <td className="px-3 py-2 text-slate-300 font-mono">
                          {conf.status === "running" ? formatDuration(conf.actualStart) : conf.status === "completed" ? "Ended" : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-300">{pCount || "—"}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{conf.moderatorCode ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{conf.participantCode ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">{conf.dialInNumber ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            conf.status === "running" ? "bg-emerald-500/20 text-emerald-400" :
                            conf.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                            conf.status === "completed" ? "bg-slate-500/20 text-slate-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{conf.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); openCCP(conf.id); }}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-[10px] transition-colors"
                            >
                              <Activity className="w-3 h-3" /> Open CCP
                            </button>
                            {activeCCPConferenceId && activeCCPConferenceId !== conf.id && (
                              <button
                                onClick={e => { e.stopPropagation(); setSecondaryCCPConferenceId(conf.id); setSplitViewEnabled(true); setShowCCP(true); }}
                                title="Open this conference in split view alongside the current CCP"
                                className="flex items-center gap-1 px-2 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded text-[10px] transition-colors"
                              >
                                <LayoutGrid className="w-3 h-3" /> Split
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Conference Control Panel ─────────────────────────────────────────── */}
        {showCCP && (
          <div className={`flex gap-3 ${splitViewEnabled && secondaryCCPConferenceId ? 'flex-row' : 'flex-col'}`}>
          {/* Primary CCP */}
          <div className={`bg-[#111827] border border-slate-700 rounded-lg overflow-hidden flex flex-col ${splitViewEnabled && secondaryCCPConferenceId ? 'flex-1 min-w-0' : ''}`}>
            {/* CCP Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm">Conference Control Panel</span>
                {activeConf && (
                  <span className="text-slate-400 text-xs">— {activeConf.subject} ({activeConf.callId})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!activeCCPConferenceId && (
                  <span className="text-xs text-slate-500 italic">Select a conference from the Overview</span>
                )}
                {activeCCPConferenceId && (
                  <>
                    <button
                      onClick={() => { setDialEntries([]); setDialAllStatus("idle"); setDialForm({ name: "", company: "", phone: "", role: "participant" }); setShowMultiDialModal(true); }}
                      title="Dial multiple participants into this conference"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-800/40 hover:bg-blue-700/60 text-blue-300 rounded text-[10px] transition-colors"
                    >
                      <PhoneForwarded className="w-3 h-3" /> Multi-Dial
                    </button>
                    <button
                      onClick={() => setShowGreenRoomPanel(true)}
                      title="Open Speaker Green Room — pre-event sub-conference for speakers"
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 rounded text-[10px] transition-colors"
                    >
                      <Users className="w-3 h-3" /> Green Room
                    </button>
                    <button
                      onClick={() => { setTransferSent(false); setTransferTargetOperator(''); setTransferNote(''); setShowTransferModal(true); }}
                      title="Transfer this conference to another operator"
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-800/40 hover:bg-indigo-700/60 text-indigo-300 rounded text-[10px] transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" /> Transfer
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  title="Operator preferences"
                  className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 rounded text-[10px] transition-colors"
                >
                  <Settings className="w-3 h-3" /> Settings
                </button>
                {splitViewEnabled && secondaryCCPConferenceId && (
                  <button
                    onClick={() => { setSplitViewEnabled(false); setSecondaryCCPConferenceId(null); }}
                    title="Exit split view"
                    className="flex items-center gap-1 px-2 py-1 bg-violet-800/40 hover:bg-violet-700/60 text-violet-300 rounded text-[10px] transition-colors"
                  >
                    <Minimize2 className="w-3 h-3" /> Exit Split
                  </button>
                )}
                <button onClick={() => setShowCCP(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {!activeConf ? (
              <div className="px-4 py-12 text-center text-slate-500 text-sm">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No conference selected.</p>
                <p className="text-xs mt-1">Click "Open CCP" on any conference in the Overview above.</p>
              </div>
            ) : (
              <>
                {/* Conference Bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1526] border-b border-slate-700 flex-wrap shrink-0">
                  {/* Record */}
                  <button
                    onClick={doToggleRecord}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      activeConf.isRecording
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {activeConf.isRecording ? <><div className="w-2 h-2 rounded-full bg-white animate-pulse" /> Recording</> : <><Radio className="w-3.5 h-3.5" /> Record</>}
                  </button>
                  {/* Lock */}
                  <button
                    onClick={doToggleLock}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      activeConf.isLocked
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                  >
                    {activeConf.isLocked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : <><Unlock className="w-3.5 h-3.5" /> Unlocked</>}
                  </button>
                  {/* Mute Participants Only */}
                  <button
                    onClick={doMuteParticipantsOnly}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-amber-900/30 hover:bg-amber-800/50 text-amber-400 border border-amber-800/30 transition-colors"
                    title="Mute all participants (moderators stay unmuted)"
                  >
                    <MicOff className="w-3.5 h-3.5" /> Mute Parts
                  </button>
                  {/* Mute All */}
                  <button
                    onClick={doMuteAll}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    <MicOff className="w-3.5 h-3.5" /> Mute All
                  </button>
                  {/* Terminate */}
                  <button
                    onClick={async () => {
                      if (!confirm("Terminate this conference?")) return;
                      setLocalConferences(prev => prev.map(c => c.id === activeConf.id ? { ...c, status: "completed" as const } : c));
                      try { await terminateMut.mutateAsync({ conferenceId: activeConf.id }); } catch { }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-800/40 transition-colors"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Terminate
                  </button>
                  {/* Export → Post-Event Report */}
                  <button
                    onClick={() => {
                      const conf = activeConf;
                      if (!conf) return;
                      const parts = participants;
                      const notes = operatorNotes[activeCCPConferenceId!] ?? '';
                      // Persist OCC data to sessionStorage so PostEvent page can read it
                      const exportPayload = {
                        conferenceId: conf.id,
                        subject: conf.subject,
                        callId: conf.callId,
                        exportedAt: new Date().toISOString(),
                        participants: parts.map(p => ({
                          name: p.name ?? null,
                          company: p.company ?? null,
                          role: p.role,
                          state: p.state,
                          phone: p.phoneNumber ?? null,
                          connectTime: p.connectTime ? new Date(p.connectTime).toLocaleTimeString() : null,
                        })),
                        notes,
                      };
                      try { sessionStorage.setItem('occ_export_data', JSON.stringify(exportPayload)); } catch {}
                      navigate(`/post-event/${conf.id}`);
                    }}
                    title="Open post-event report with participant list and operator notes"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-800/30 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Post-Event
                  </button>
                  {/* Simulate Incoming Call */}
                  <button
                    onClick={doSimulateIncomingCall}
                    title="Simulate an incoming caller for demo purposes"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800/40 transition-colors"
                  >
                    <PhoneIncoming className="w-3.5 h-3.5" /> Simulate Call
                  </button>
                  {/* Dial-Out quick-launch */}
                  <button
                    onClick={() => setShowDialOutModal(true)}
                    title="Dial out to a participant"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800/40 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Dial Out
                  </button>
                  {/* Capacity warning */}
                  {(() => {
                    const limit = activeConf.participantLimitEnabled ? (activeConf.participantLimit ?? 500) : 500;
                    const pct = (counts.connected / limit) * 100;
                    if (pct < 80) return null;
                    return (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border ${
                        pct >= 95
                          ? "bg-red-900/40 text-red-400 border-red-800/40"
                          : "bg-amber-900/40 text-amber-400 border-amber-800/40"
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {counts.connected}/{limit} ({Math.round(pct)}%)
                      </div>
                    );
                  })()}
                  {/* +15 min extension button */}
                  <button
                    onClick={() => {
                      setLocalConferences(prev => prev.map(c =>
                        c.id === activeCCPConferenceId
                          ? { ...c, scheduledEnd: c.scheduledEnd ? new Date(c.scheduledEnd.getTime() + 15 * 60000) : new Date(Date.now() + 15 * 60000) }
                          : c
                      ));
                      // Broadcast extension via Ably
                      try {
                        const newEnd = localConferences.find(c => c.id === activeCCPConferenceId)?.scheduledEnd;
                        ablyConferenceChanRef.current?.publish('conference.extend', JSON.stringify({ newEndTime: newEnd ? new Date(newEnd.getTime() + 15 * 60000).toISOString() : null }));
                      } catch {}
                    }}
                    title="Extend conference by 15 minutes"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 border border-slate-600/40 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" /> +15 min
                  </button>
                  {/* Q&A Raised Hands Badge */}
                  {counts.speak_requests > 0 && (
                    <button
                      onClick={() => setFilterMode("speak_requests")}
                      title={`${counts.speak_requests} participant${counts.speak_requests > 1 ? 's' : ''} with hand raised — click to filter`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-violet-900/50 hover:bg-violet-800/60 text-violet-300 border border-violet-700/50 transition-colors"
                    >
                      ✋ {counts.speak_requests} Q&A
                    </button>
                  )}
                  {/* Info */}
                  <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
                    <span className="font-mono">{activeConf.dialInNumber}</span>
                    <span>Mod: <span className="text-slate-200 font-mono">{activeConf.moderatorCode}</span></span>
                    <span>Part: <span className="text-slate-200 font-mono">{activeConf.participantCode}</span></span>
                    {/* Timer with alert colouring */}
                    {(() => {
                      const ms = activeConf.actualStart ? Date.now() - new Date(activeConf.actualStart).getTime() : 0;
                      const totalMs = 90 * 60 * 1000; // 90-min default booking
                      const remainingMs = totalMs - ms;
                      const remainingMin = Math.floor(remainingMs / 60000);
                      const timerColor = remainingMin <= 5 ? "text-red-400 animate-pulse" : remainingMin <= 15 ? "text-amber-400" : "text-emerald-400";
                      const timerTitle = remainingMin <= 0 ? "Over time!" : remainingMin <= 5 ? `${remainingMin}m remaining — ending soon!` : remainingMin <= 15 ? `${remainingMin}m remaining` : "";
                      return (
                        <span className={`font-mono font-medium ${timerColor}`} title={timerTitle}>
                          {formatDuration(activeConf.actualStart)}
                          {remainingMin <= 15 && remainingMin > 0 && (
                            <span className="ml-1 text-[10px]">({remainingMin}m left)</span>
                          )}
                          {remainingMin <= 0 && <span className="ml-1 text-[10px]">OVER</span>}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0d14] border-b border-slate-800 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={participantSearch}
                    onChange={e => setParticipantSearch(e.target.value)}
                    placeholder="Search by name, company, phone, location…"
                    className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                  />
                  {participantSearch && (
                    <button onClick={() => setParticipantSearch("")} className="text-slate-500 hover:text-slate-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {participantSearch && (
                    <span className="text-[10px] text-slate-500">{filteredParticipants.length} result{filteredParticipants.length !== 1 ? "s" : ""}</span>
                  )}
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0f1e] border-b border-slate-700 flex-wrap shrink-0">
                  {([
                    { key: "all", label: "All", count: counts.all },
                    { key: "moderators", label: "Mod", count: counts.moderators },
                    { key: "participants", label: "Part", count: counts.participants },
                    { key: "unmuted", label: "Unmuted", count: counts.unmuted },
                    { key: "muted", label: "Muted", count: counts.muted },
                    { key: "parked", label: "Parked", count: counts.parked },
                    { key: "connected", label: "Connected", count: counts.connected },
                    { key: "waiting", label: "Waiting", count: counts.waiting },
                    { key: "web", label: "Web", count: counts.web },
                    { key: "speak_requests", label: "Speak Req", count: counts.speak_requests },
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilterMode(f.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        filterMode === f.key
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                      }`}
                    >
                      {f.label}
                      <span className={`px-1 rounded text-[10px] ${filterMode === f.key ? "bg-blue-500" : "bg-slate-700"}`}>{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Action Bar */}
                {selectedParticipantIds.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border-b border-blue-800/40 shrink-0">
                    <span className="text-xs text-blue-400 font-medium">{selectedParticipantIds.length} selected:</span>
                    {[
                      { label: "Unmute", icon: Mic, action: () => doParticipantAction("connected", selectedParticipantIds), color: "bg-emerald-700 hover:bg-emerald-600" },
                      { label: "Mute", icon: MicOff, action: () => doParticipantAction("muted", selectedParticipantIds), color: "bg-amber-700 hover:bg-amber-600" },
                      { label: "Park", icon: PauseCircle, action: () => doParticipantAction("parked", selectedParticipantIds), color: "bg-purple-700 hover:bg-purple-600" },
                      { label: "Disconnect", icon: PhoneOff, action: () => doParticipantAction("dropped", selectedParticipantIds), color: "bg-red-800 hover:bg-red-700" },
                    ].map(({ label, icon: Icon, action, color }) => (
                      <button
                        key={label}
                        onClick={action}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white transition-colors ${color}`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedParticipantIds([])}
                      className="ml-auto text-xs text-slate-400 hover:text-slate-200"
                    >
                      Clear selection
                    </button>
                  </div>
                )}

                {/* Participant Table */}
                <div className="overflow-x-auto shrink-0" style={{ maxHeight: "320px", overflowY: "auto" }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0d1526] z-10">
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="px-2 py-2 w-6"></th>
                        <th className="text-left px-2 py-2 w-6">#</th>
                        <th className="text-left px-2 py-2 w-6">Role</th>
                        <th className="text-left px-2 py-2">Name</th>
                        <th className="text-left px-2 py-2">Company</th>
                        <th className="text-left px-2 py-2">Phone</th>
                        <th className="text-left px-2 py-2">Location</th>
                        <th className="text-left px-2 py-2">VS</th>
                        <th className="text-left px-2 py-2">Connected</th>
                        <th className="text-left px-2 py-2">State</th>
                        <th className="px-2 py-2 w-6" title="Raise Hand">✋</th>
                        <th className="text-left px-2 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.length === 0 ? (
                        <tr><td colSpan={11} className="px-4 py-6 text-center text-slate-500">No participants match this filter</td></tr>
                      ) : filteredParticipants.map(p => {
                        const isSelected = selectedParticipantIds.includes(p.id);
                        const isSpeakingRow = p.state === "speaking";
                        return (
                          <tr
                            key={p.id}
                            className={`border-b border-slate-800/60 transition-colors ${
                              isSpeakingRow ? "bg-emerald-900/20 border-l-2 border-l-emerald-500" :
                              isSelected ? "bg-blue-900/20" :
                              p.state === "waiting_operator" ? "bg-red-900/10" :
                              "hover:bg-slate-800/30"
                            }`}
                          >
                            <td className="px-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleParticipantSelect(p.id)}
                                className="w-3 h-3 accent-blue-500"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-slate-400 font-mono">{p.lineNumber}</td>
                            <td className="px-2 py-1.5">
                              {p.role === "moderator" ? <span title="Moderator" className="text-amber-400">★</span> :
                               p.role === "host" ? <span title="Host" className="text-blue-400">●</span> :
                               p.isWebParticipant ? <span title="Web" className="text-sky-400">@</span> :
                               <span className="text-slate-500">·</span>}
                            </td>
                            <td className="px-2 py-1.5 font-medium text-slate-200">
                              {p.name ?? <span className="text-slate-500 italic">Unknown</span>}
                              {p.requestToSpeak && <span className="ml-1 text-amber-400 text-[10px]">▲{p.requestToSpeakPosition}</span>}
                            </td>
                            <td className="px-2 py-1.5 text-slate-400">{p.company ?? "—"}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-300">{p.phoneNumber ?? "—"}</td>
                            <td className="px-2 py-1.5 text-slate-400">{p.location ?? "—"}</td>
                            <td className="px-2 py-1.5 text-slate-500 font-mono text-[10px]">{p.voiceServer ?? "—"}</td>
                            <td className="px-2 py-1.5 text-slate-400 font-mono text-[10px]">{formatTime(p.connectedAt)}</td>
                            <td className="px-2 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${stateColor(p.state)}`}>
                                {stateLabel(p.state)}
                              </span>
                            </td>
                            {/* Raise Hand */}
                            <td className="px-2 py-1.5 text-center">
                              {p.requestToSpeak ? (
                                <button
                                  title={`Lower hand (position ${p.requestToSpeakPosition})`}
                                  onClick={() => setLocalParticipants(prev => prev.map(x => x.id === p.id ? { ...x, requestToSpeak: false, requestToSpeakPosition: null } : x))}
                                  className="text-amber-400 hover:text-amber-300 text-sm leading-none"
                                >✋<span className="ml-0.5 text-[9px] font-bold">{p.requestToSpeakPosition}</span></button>
                              ) : (
                                <span className="text-slate-700 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1">
                                {p.state === "muted" && (
                                  <button onClick={() => doParticipantAction("connected", [p.id])} title="Unmute" className="p-1 rounded bg-emerald-700/40 hover:bg-emerald-700 text-emerald-400 transition-colors"><Mic className="w-3 h-3" /></button>
                                )}
                                {(p.state === "connected" || p.state === "speaking") && (
                                  <button onClick={() => doParticipantAction("muted", [p.id])} title="Mute" className="p-1 rounded bg-amber-700/40 hover:bg-amber-700 text-amber-400 transition-colors"><MicOff className="w-3 h-3" /></button>
                                )}
                                {p.state !== "parked" && p.state !== "dropped" && (
                                  <button onClick={() => doParticipantAction("parked", [p.id])} title="Park" className="p-1 rounded bg-purple-700/40 hover:bg-purple-700 text-purple-400 transition-colors"><PauseCircle className="w-3 h-3" /></button>
                                )}
                                {p.state === "parked" && (
                                  <button onClick={() => doParticipantAction("connected", [p.id])} title="Unpark" className="p-1 rounded bg-blue-700/40 hover:bg-blue-700 text-blue-400 transition-colors"><PlayCircle className="w-3 h-3" /></button>
                                )}
                                <button
                                  onClick={() => { setHistoryParticipantId(p.id); setFeatureTab("history"); }}
                                  title="History"
                                  className="p-1 rounded bg-slate-700/40 hover:bg-slate-700 text-slate-400 transition-colors"
                                ><History className="w-3 h-3" /></button>
                                {p.state === "waiting_operator" && (
                                  <button
                                    onClick={() => openCallerControl(p)}
                                    title="Handle caller"
                                    className="p-1 rounded bg-blue-700/40 hover:bg-blue-700 text-blue-400 transition-colors"
                                  ><PhoneIncoming className="w-3 h-3" /></button>
                                )}
                                {/* Speak Next — appears when hand is raised */}
                                {p.requestToSpeak && (
                                  <button
                                    onClick={() => doSpeakNext(p.id)}
                                    title={`Speak Next: unmute ${p.name ?? 'participant'}, set Speaking, lower hand`}
                                    className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-violet-700/50 hover:bg-violet-600 text-violet-200 text-[10px] font-semibold transition-colors border border-violet-600/50"
                                  >
                                    ▶ Speak
                                  </button>
                                )}
                                <button onClick={() => doParticipantAction("dropped", [p.id])} title="Disconnect" className="p-1 rounded bg-red-900/40 hover:bg-red-800 text-red-400 transition-colors"><PhoneOff className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Feature Bar */}
                <div className="border-t border-slate-700 shrink-0">
                  {/* Feature tabs */}
                  <div className="flex border-b border-slate-700 bg-[#0a0f1e]">
                    {([
                      { key: "monitoring", label: "Monitoring", icon: Headphones },
                      { key: "connection", label: "Connection", icon: UserPlus },
                      { key: "history", label: "History", icon: History },
                      { key: "audio", label: "Audio Files", icon: Music },
                      { key: "chat", label: "Chat", icon: MessageSquare },
                      { key: "notes", label: "Notes", icon: List },
                      { key: "qa_queue", label: "Q&A Queue", icon: MessageSquare },
                    ] as const).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setFeatureTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                          featureTab === key
                            ? "border-blue-500 text-blue-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Feature tab content */}
                  <div className="p-3 bg-[#0d1526]" style={{ minHeight: "120px" }}>
                    {/* Monitoring */}
                    {featureTab === "monitoring" && (
                      <div className="flex items-start gap-6">
                        <div>
                          <div className="text-xs text-slate-400 mb-2 font-medium">Conference</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setTalkPath("Conference")}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors"
                            >
                              <Headphones className="w-3.5 h-3.5" /> Start Monitor
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors">
                              <Volume2 className="w-3.5 h-3.5" /> Unmute
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors">
                              <Zap className="w-3.5 h-3.5" /> Unmute + Announce
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-2 font-medium">Individual Line</div>
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors">
                              <Headphones className="w-3.5 h-3.5" /> Start Line Monitor
                            </button>
                          </div>
                        </div>
                        <div className="ml-auto text-xs text-slate-500 italic">
                          Note: Audio monitoring requires WebRTC bridge integration (Phase 2)
                        </div>
                      </div>
                    )}

                    {/* Connection (Dial-out) */}
                    {featureTab === "connection" && (
                      <div className="flex items-end gap-3 flex-wrap">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Name</label>
                          <input
                            value={dialName}
                            onChange={e => setDialName(e.target.value)}
                            placeholder="Participant name"
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 w-44 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Phone number *</label>
                          <input
                            value={dialPhone}
                            onChange={e => setDialPhone(e.target.value)}
                            placeholder="+27 11 555 0000"
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 w-44 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Role</label>
                          <select
                            value={dialRole}
                            onChange={e => setDialRole(e.target.value as "moderator" | "participant")}
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="participant">Participant</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        </div>
                        <button
                          onClick={doDialOut}
                          disabled={!dialPhone}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" /> Connect
                        </button>
                      </div>
                    )}

                    {/* History */}
                    {featureTab === "history" && (
                      <div>
                        {historyParticipantId ? (
                          <>
                            <div className="text-xs text-slate-400 mb-2">
                              History for participant #{historyParticipantId}
                              <button onClick={() => setHistoryParticipantId(null)} className="ml-2 text-slate-500 hover:text-slate-300"><X className="w-3 h-3 inline" /></button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {historyItems.map(h => (
                                <div key={h.id} className="flex items-center gap-3 text-xs">
                                  <span className="text-slate-500 font-mono w-20 shrink-0">{formatTime(h.occurredAt)}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    h.event === "connected" || h.event === "unmuted" ? "bg-emerald-500/20 text-emerald-400" :
                                    h.event === "muted" ? "bg-amber-500/20 text-amber-400" :
                                    h.event === "disconnected" ? "bg-red-500/20 text-red-400" :
                                    "bg-slate-500/20 text-slate-400"
                                  }`}>{h.event.replace(/_/g, " ")}</span>
                                  <span className="text-slate-500 capitalize">{h.triggeredBy}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500 italic">Click the history icon on a participant row to view their event log.</div>
                        )}
                      </div>
                    )}

                    {/* Audio Files */}
                    {featureTab === "audio" && (
                      <div>
                        <div className="text-xs text-slate-400 mb-2">Pre-recorded audio files available for playback</div>
                        {[
                          { name: "Host Welcome Message", created: "2025-01-15" },
                          { name: "Participant Hold Music", created: "2025-01-15" },
                          { name: "Q&A Instructions", created: "2025-03-01" },
                        ].map(f => (
                          <div key={f.name} className="flex items-center justify-between py-1.5 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <Music className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-300">{f.name}</span>
                              <span className="text-[10px] text-slate-500">{f.created}</span>
                            </div>
                            <div className="flex gap-1">
                              <button className="p-1 rounded bg-emerald-700/40 hover:bg-emerald-700 text-emerald-400 transition-colors"><PlayCircle className="w-3.5 h-3.5" /></button>
                              <button className="p-1 rounded bg-amber-700/40 hover:bg-amber-700 text-amber-400 transition-colors"><PauseCircle className="w-3.5 h-3.5" /></button>
                              <button className="p-1 rounded bg-red-900/40 hover:bg-red-800 text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat */}
                    {featureTab === "notes" && activeCCPConferenceId && (
                      <div className="flex flex-col gap-2" style={{ height: "160px" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 font-medium">Operator notes — {activeConf?.subject ?? "Conference"}</span>
                          {notesSaved && <span className="text-[10px] text-emerald-400">✓ Saved</span>}
                        </div>
                        <textarea
                          value={operatorNotes[activeCCPConferenceId] ?? ""}
                          onChange={e => handleNotesChange(activeCCPConferenceId, e.target.value)}
                          placeholder="Type running notes here… e.g. 'CEO confirmed guidance at 14:32', 'Analyst from Barclays asked about capex'"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <div className="text-[10px] text-slate-600">Notes are saved locally and will appear in the Post-Event Report.</div>
                      </div>
                    )}
                    {featureTab === "qa_queue" && (
                      <div className="flex flex-col gap-2" style={{ height: "160px" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 font-medium">Q&A Queue — {participants.filter(p => p.requestToSpeak).length} raised hand{participants.filter(p => p.requestToSpeak).length !== 1 ? 's' : ''}</span>
                          {participants.filter(p => p.requestToSpeak).length > 0 && (
                            <button
                              onClick={() => setLocalParticipants(prev => prev.map(p => ({ ...p, requestToSpeak: false, requestToSpeakPosition: null })))}
                              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                            >Lower All Hands</button>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                          {participants
                            .filter(p => p.requestToSpeak)
                            .sort((a, b) => (a.requestToSpeakPosition ?? 99) - (b.requestToSpeakPosition ?? 99))
                            .map((p, idx) => (
                              <div key={p.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1.5">
                                <span className="text-amber-400 font-bold text-xs w-4">{idx + 1}</span>
                                <span className="text-amber-300 text-xs">✋</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 truncate">{p.name ?? 'Unknown'}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{p.company ?? ''} {p.location ? `· ${p.location}` : ''}</div>
                                </div>
                                <div className="text-[10px] text-slate-500 shrink-0">{p.phoneNumber ?? ''}</div>
                                <button
                                  onClick={() => doSpeakNext(p.id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-semibold transition-colors shrink-0"
                                >
                                  ▶ Speak
                                </button>
                                <button
                                  onClick={() => setLocalParticipants(prev => prev.map(lp => lp.id === p.id ? { ...lp, requestToSpeak: false, requestToSpeakPosition: null } : lp))}
                                  className="text-slate-600 hover:text-red-400 transition-colors"
                                  title="Lower hand"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          }
                          {participants.filter(p => p.requestToSpeak).length === 0 && (
                            <div className="flex items-center justify-center h-16 text-xs text-slate-600">No raised hands — queue is empty</div>
                          )}
                        </div>
                      </div>
                    )}
                    {featureTab === "chat" && (
                      <div className="flex flex-col gap-2" style={{ height: "160px" }}>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                          {chatMessages.map(msg => (
                            <div key={msg.id} className={`text-xs ${msg.senderType === "system" ? "text-slate-500 italic" : ""}`}>
                              <span className="text-slate-500 font-mono mr-1">{formatTime(msg.sentAt)}</span>
                              <span className={`font-semibold mr-1 ${
                                msg.senderType === "operator" ? "text-blue-400" :
                                msg.senderType === "moderator" ? "text-amber-400" :
                                msg.senderType === "system" ? "text-slate-500" :
                                "text-slate-300"
                              }`}>[{msg.senderName}]</span>
                              {msg.recipientType !== "all" && <span className="text-slate-500 mr-1">→ {msg.recipientType}</span>}
                              <span className="text-slate-200">{msg.message}</span>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <input
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && doSendChat()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                          <select
                            value={chatRecipient}
                            onChange={e => setChatRecipient(e.target.value as "all" | "hosts")}
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                          >
                            <option value="all">To all</option>
                            <option value="hosts">To hosts</option>
                          </select>
                          <button
                            onClick={doSendChat}
                            disabled={!chatMessage.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Secondary CCP — split view */}
          {splitViewEnabled && secondaryCCPConferenceId && (() => {
            const secConf = conferences.find(c => c.id === secondaryCCPConferenceId) ?? null;
            const secParts = secondaryCCPConferenceId === 2
              ? (localParticipants.length > 0 ? localParticipants.slice(0, 5) : [])
              : [];
            return (
              <div className="bg-[#111827] border border-violet-700/50 rounded-lg overflow-hidden flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-violet-700/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-violet-400" />
                    <span className="font-semibold text-sm text-violet-300">Split CCP</span>
                    {secConf && (
                      <span className="text-slate-400 text-xs">— {secConf.subject} ({secConf.callId})</span>
                    )}
                  </div>
                  <button onClick={() => { setSplitViewEnabled(false); setSecondaryCCPConferenceId(null); }} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
                </div>
                {!secConf ? (
                  <div className="px-4 py-12 text-center text-slate-500 text-sm">
                    <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>No secondary conference found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 overflow-auto">
                    {/* Conference Bar */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1526] border-b border-slate-700 flex-wrap shrink-0">
                      <span className="text-xs text-slate-400 font-medium">{secConf.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        secConf.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                        secConf.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{secConf.status}</span>
                      <span className="text-xs text-slate-500 ml-auto">Mod: {secConf.moderatorCode} | Part: {secConf.participantCode}</span>
                    </div>
                    {/* Participant table */}
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#0d1526] border-b border-slate-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-slate-400 font-medium">Role</th>
                            <th className="px-3 py-2 text-left text-slate-400 font-medium">Name</th>
                            <th className="px-3 py-2 text-left text-slate-400 font-medium">Company</th>
                            <th className="px-3 py-2 text-left text-slate-400 font-medium">State</th>
                            <th className="px-3 py-2 text-left text-slate-400 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {secParts.length === 0 ? (
                            <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-600">No participants yet</td></tr>
                          ) : secParts.map(p => (
                            <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="px-3 py-2">
                                {p.role === 'moderator' ? <span className="text-amber-400">&#9733;</span> : <span className="text-slate-500">&#9679;</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-200">{p.name ?? 'Unknown'}</td>
                              <td className="px-3 py-2 text-slate-400">{p.company ?? '—'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  p.state === 'speaking' ? 'bg-emerald-500/20 text-emerald-400' :
                                  p.state === 'muted' ? 'bg-slate-600/40 text-slate-400' :
                                  p.state === 'connected' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-slate-700 text-slate-400'
                                }`}>{p.state}</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setLocalParticipants(prev => prev.map(x => x.id === p.id ? { ...x, state: x.state === 'muted' ? 'connected' as const : 'muted' as const } : x))}
                                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                    title={p.state === 'muted' ? 'Unmute' : 'Mute'}
                                  >
                                    {p.state === 'muted' ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          </div>
        )}

        {/* Empty state */}
        {!showOverview && !showCCP && !showLounge && !showOpRequests && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 py-24">
            <Headphones className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">Operator Call Centre</p>
            <p className="text-xs mt-1">Use the toolbar above to open the Conference Overview or Control Panel.</p>
          </div>
        )}
      </div>

      {/* ── Caller Control Popup ──────────────────────────────────────────────── */}
      {callerControlData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-600 rounded-xl shadow-2xl w-[480px] max-w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-semibold text-sm text-slate-100">Caller Control</span>
                <span className="text-xs text-slate-400">— Incoming caller requires routing</span>
              </div>
              <button onClick={() => setCallerControlData(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caller info */}
            <div className="px-4 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-3 bg-[#0d1526] rounded-lg p-3 mb-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-0.5">Phone Number</div>
                  <div className="font-mono text-slate-100 font-medium">{callerControlData.phone}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">Dial-In Used</div>
                  <div className="font-mono text-slate-400">{callerControlData.dialIn || "—"}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">Conference</div>
                  <div className="text-slate-200">{callerControlData.conferenceName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">Waiting</div>
                  <div className="text-amber-400 font-medium">
                    {Math.floor(callerControlData.waitingSeconds / 60)}m {callerControlData.waitingSeconds % 60}s
                  </div>
                </div>
              </div>

              {/* Label fields */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name</label>
                  <input
                    value={callerName}
                    onChange={e => setCallerName(e.target.value)}
                    placeholder="Enter caller name"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company</label>
                  <input
                    value={callerCompany}
                    onChange={e => setCallerCompany(e.target.value)}
                    placeholder="Enter company"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1.5">Route as</label>
                <div className="flex gap-2">
                  {(["participant", "moderator"] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setCallerRole(role)}
                      className={`flex-1 py-2 rounded text-xs font-semibold capitalize border transition-colors ${
                        callerRole === role
                          ? role === "moderator"
                            ? "bg-amber-600 border-amber-500 text-white"
                            : "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {role === "moderator" ? "★ Moderator" : "Participant"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => doCallerRoute(callerRole)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-sm font-semibold transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Route to Conference
                </button>
                <button
                  onClick={() => doCallerRoute("hold")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700/60 hover:bg-purple-700 text-purple-300 rounded text-sm font-semibold border border-purple-700/40 transition-colors"
                >
                  <PauseCircle className="w-4 h-4" /> Hold
                </button>
                <button
                  onClick={() => doCallerRoute("drop")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded text-sm font-semibold border border-red-800/40 transition-colors"
                >
                  <PhoneOff className="w-4 h-4" /> Drop
                </button>
                <button
                  onClick={() => setCallerControlData(null)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
            <div className="px-4 py-2 text-[10px] text-slate-600 border-t border-slate-800 rounded-b-xl">
              Caller is on hold while this dialog is open. Routing will connect them immediately.
            </div>
          </div>
        </div>
      )}

      {/* ── Dial-Out Quick-Launch Modal ──────────────────────────────────────── */}
      {showDialOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-600 rounded-xl shadow-2xl w-[380px] max-w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">Dial Out</span>
                {activeConf && <span className="text-xs text-slate-500">— {activeConf.subject}</span>}
              </div>
              <button onClick={() => setShowDialOutModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Name (optional)</label>
                <input
                  value={quickDialName}
                  onChange={e => setQuickDialName(e.target.value)}
                  placeholder="Enter participant name"
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Phone Number *</label>
                <input
                  value={quickDialPhone}
                  onChange={e => setQuickDialPhone(e.target.value)}
                  placeholder="+27 11 555 0100"
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  onKeyDown={e => e.key === "Enter" && doQuickDialOut()}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Route as</label>
                <div className="flex gap-2">
                  {(["participant", "moderator"] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setQuickDialRole(role)}
                      className={`flex-1 py-2 rounded text-xs font-semibold border transition-colors ${
                        quickDialRole === role
                          ? role === "moderator" ? "bg-amber-700/60 text-amber-300 border-amber-600" : "bg-blue-700/60 text-blue-300 border-blue-600"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {role === "moderator" ? "★ Moderator" : "Participant"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={doQuickDialOut}
                  disabled={!quickDialPhone.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4" /> Dial Now
                </button>
                <button
                  onClick={() => setShowDialOutModal(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Access Codes Modal ────────────────────────────────────────────────── */}
      {showAccessCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-600 rounded-xl shadow-2xl w-[420px] max-w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700 rounded-t-xl">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Access Codes</span>
                {activeConf && <span className="text-xs text-slate-500">— {activeConf.subject}</span>}
              </div>
              <button onClick={() => setShowAccessCodesModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            {activeConf ? (
              <div className="p-4 space-y-3">
                {[
                  { label: "Moderator Code", value: activeConf.moderatorCode, color: "text-amber-400", icon: "★" },
                  { label: "Participant Code", value: activeConf.participantCode, color: "text-blue-400", icon: "·" },
                  { label: "Security Code", value: activeConf.securityCode ?? "Not set", color: activeConf.securityCode ? "text-emerald-400" : "text-slate-500", icon: "🔒" },
                  { label: "Dial-In Number", value: activeConf.dialInNumber ?? "Not set", color: "text-slate-200", icon: "📞" },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="flex items-center justify-between bg-[#0a0d14] border border-slate-800 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
                      <div className={`font-mono text-lg font-bold tracking-widest ${color}`}>
                        {icon} {value}
                      </div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(value ?? ""); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                ))}
                <div className="pt-1 text-[10px] text-slate-600 text-center">
                  Call-ID: {activeConf.callId} · {activeConf.reseller}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Open a Conference Control Panel first to view access codes.</p>
              </div>
            )}
            <div className="px-4 py-2 border-t border-slate-800 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowAccessCodesModal(false)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule New Conference Modal ─────────────────────────────────── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-600 rounded-xl shadow-2xl w-[520px] max-w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Schedule New Conference</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
              {/* Conference Type Toggle */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Conference Type</label>
                <div className="flex rounded overflow-hidden border border-slate-600">
                  <button
                    onClick={() => setSchedConferenceType("dial-in")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      schedConferenceType === "dial-in"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    📞 Dial-In
                  </button>
                  <button
                    onClick={() => setSchedConferenceType("dial-out")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      schedConferenceType === "dial-out"
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    📲 Dial-Out
                  </button>
                </div>
                {schedConferenceType === "dial-out" && (
                  <p className="text-[10px] text-emerald-400 mt-1">The system will dial out to all participants when the conference starts.</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Subject <span className="text-red-400">*</span></label>
                <input
                  value={schedSubject}
                  onChange={e => setSchedSubject(e.target.value)}
                  placeholder="e.g. Q1 2026 Earnings Call"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Time <span className="text-red-400">*</span></label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={e => setSchedTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Moderator Code</label>
                  <input
                    value={schedModCode}
                    onChange={e => setSchedModCode(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Participant Code</label>
                  <input
                    value={schedPartCode}
                    onChange={e => setSchedPartCode(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Dial-In Number</label>
                  <input
                    value={schedDialIn}
                    onChange={e => setSchedDialIn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Participant Limit</label>
                  <input
                    type="number"
                    value={schedLimit}
                    onChange={e => setSchedLimit(e.target.value)}
                    min="1" max="5000"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Reseller / Client</label>
                <input
                  value={schedReseller}
                  onChange={e => setSchedReseller(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ── Dial-Out Participant Panel ──────────────────────────────── */}
              {schedConferenceType === "dial-out" && (
                <div className="border border-emerald-800/50 rounded-lg bg-emerald-950/20 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Dial-Out Participants ({schedDialOutParticipants.length})</span>
                    {/* CSV Import */}
                    <label className="flex items-center gap-1 cursor-pointer bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-300 text-[10px] font-semibold px-2 py-1 rounded transition-colors">
                      <Upload className="w-3 h-3" />
                      Import CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const text = ev.target?.result as string;
                            const lines = text.split(/\r?\n/).filter(l => l.trim());
                            if (!lines.length) return;
                            // detect header
                            const firstLower = lines[0].toLowerCase();
                            const hasHeader = firstLower.includes("name") || firstLower.includes("phone");
                            const dataLines = hasHeader ? lines.slice(1) : lines;
                            const headers = hasHeader
                              ? lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""))
                              : ["name", "phone", "company", "role"];
                            const nameIdx = headers.indexOf("name");
                            const phoneIdx = headers.indexOf("phone");
                            const companyIdx = headers.indexOf("company");
                            const roleIdx = headers.indexOf("role");
                            const errors: string[] = [];
                            const imported: typeof schedDialOutParticipants = [];
                            dataLines.forEach((line, i) => {
                              const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                              const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
                              const phone = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];
                              const company = companyIdx >= 0 ? cols[companyIdx] : (cols[2] || "");
                              const roleRaw = roleIdx >= 0 ? cols[roleIdx] : (cols[3] || "participant");
                              const role = (["moderator", "participant", "host"].includes(roleRaw?.toLowerCase()) ? roleRaw.toLowerCase() : "participant") as "moderator" | "participant" | "host";
                              if (!phone?.trim()) { errors.push(`Row ${i + 1}: phone required`); return; }
                              const isDup = schedDialOutParticipants.some(p => p.phone === phone.trim()) || imported.some(p => p.phone === phone.trim());
                              if (isDup) { errors.push(`Row ${i + 1}: duplicate phone ${phone}`); return; }
                              imported.push({ id: `csv-${Date.now()}-${i}`, name: name?.trim() || "Unknown", phone: phone.trim(), company: company?.trim() || "", role });
                            });
                            setSchedDialOutParticipants(prev => [...prev, ...imported]);
                            setSchedDialOutCsvError(errors);
                          };
                          reader.readAsText(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {/* CSV errors */}
                  {schedDialOutCsvError.length > 0 && (
                    <div className="bg-red-950/40 border border-red-800/40 rounded p-2">
                      <p className="text-[10px] text-red-400 font-semibold mb-1">Import issues ({schedDialOutCsvError.length}):</p>
                      {schedDialOutCsvError.slice(0, 4).map((e, i) => <p key={i} className="text-[10px] text-red-300">{e}</p>)}
                      {schedDialOutCsvError.length > 4 && <p className="text-[10px] text-red-400">…and {schedDialOutCsvError.length - 4} more</p>}
                    </div>
                  )}

                  {/* Manual add form */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={schedDialOutForm.name}
                      onChange={e => setSchedDialOutForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Name"
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      value={schedDialOutForm.phone}
                      onChange={e => setSchedDialOutForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone *"
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      value={schedDialOutForm.company}
                      onChange={e => setSchedDialOutForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Company"
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={schedDialOutForm.role}
                      onChange={e => setSchedDialOutForm(f => ({ ...f, role: e.target.value as "moderator" | "participant" | "host" }))}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="participant">Participant</option>
                      <option value="moderator">Moderator</option>
                      <option value="host">Host</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (!schedDialOutForm.phone.trim()) return;
                      const isDup = schedDialOutParticipants.some(p => p.phone === schedDialOutForm.phone.trim());
                      if (isDup) { toast.error("Duplicate phone number"); return; }
                      setSchedDialOutParticipants(prev => [...prev, { id: `manual-${Date.now()}`, name: schedDialOutForm.name.trim() || "Unknown", phone: schedDialOutForm.phone.trim(), company: schedDialOutForm.company.trim(), role: schedDialOutForm.role }]);
                      setSchedDialOutForm({ name: "", phone: "", company: "", role: "participant" });
                    }}
                    disabled={!schedDialOutForm.phone.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-800/60 hover:bg-emerald-700/70 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-200 rounded text-xs font-semibold transition-colors"
                  >
                    <UserPlus className="w-3 h-3" /> Add Participant
                  </button>

                  {/* Staged participant list */}
                  {schedDialOutParticipants.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {schedDialOutParticipants.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-slate-800/60 rounded px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-slate-200 font-medium truncate block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.phone}{p.company ? ` · ${p.company}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              p.role === "moderator" ? "bg-amber-900/50 text-amber-300" :
                              p.role === "host" ? "bg-blue-900/50 text-blue-300" :
                              "bg-slate-700 text-slate-400"
                            }`}>{p.role}</span>
                            <button onClick={() => setSchedDialOutParticipants(prev => prev.filter(x => x.id !== p.id))} className="text-slate-500 hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Template download */}
                  <button
                    onClick={() => {
                      const csv = "name,phone,company,role\nJohn Smith,+27115550001,Acme Corp,participant\nJane Doe,+27115550002,Acme Corp,moderator";
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = "dial-out-participants-template.csv"; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
                  >
                    Download CSV template
                  </button>

                  {/* ── Auto-Dial Toggle ─────────────────────────────── */}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/30">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-200">Auto-Dial on Start</p>
                      <p className="text-[10px] text-slate-500">Automatically dial all participants when the conference starts</p>
                    </div>
                    <button
                      onClick={() => setSchedAutoDial(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3 ${
                        schedAutoDial ? "bg-emerald-600" : "bg-slate-600"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        schedAutoDial ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  {/* ── SMS Notification ─────────────────────────────── */}
                  {(() => {
                    const SMS_TEMPLATES = [
                      { label: "Standard Invite", text: "Dear {{name}}, you are invited to join the {{conference}} conference call on {{date}} at {{time}}. Our operator will call you on {{phone}}." },
                      { label: "Earnings Call", text: "Dear {{name}}, please be advised that Chorus Call will connect you to the {{conference}} earnings call at {{time}} on {{date}}. Ensure your line is available." },
                      { label: "Reminder", text: "Reminder: {{name}}, the {{conference}} conference call starts in 15 minutes. Our operator will dial {{phone}} shortly." },
                      { label: "Board Briefing", text: "Dear {{name}} ({{company}}), you are scheduled to join the {{conference}} board briefing at {{time}}. An operator will call you directly." },
                    ];
                    const SMS_TAGS = [
                      { tag: "{{name}}", label: "Name" },
                      { tag: "{{company}}", label: "Company" },
                      { tag: "{{phone}}", label: "Phone" },
                      { tag: "{{conference}}", label: "Conference" },
                      { tag: "{{date}}", label: "Date" },
                      { tag: "{{time}}", label: "Time" },
                      { tag: "{{operator}}", label: "Operator" },
                    ];
                    const smsSegments = Math.ceil(schedSmsMessage.length / 160) || 1;
                    const smsPreviewParticipant = schedDialOutParticipants[0];
                    const smsPreview = schedSmsMessage
                      .replace(/\{\{name\}\}/g, smsPreviewParticipant?.name || "John Smith")
                      .replace(/\{\{company\}\}/g, smsPreviewParticipant?.company || "Acme Corp")
                      .replace(/\{\{phone\}\}/g, smsPreviewParticipant?.phone || "+27 11 000 0000")
                      .replace(/\{\{conference\}\}/g, schedSubject || "Q4 Earnings Call")
                      .replace(/\{\{date\}\}/g, schedDate || "2026-03-15")
                      .replace(/\{\{time\}\}/g, schedTime || "10:00")
                      .replace(/\{\{operator\}\}/g, "Operator");
                    const insertSmsTag = (tag: string) => {
                      const ta = document.getElementById("sms-template-textarea") as HTMLTextAreaElement | null;
                      if (!ta) { setSchedSmsMessage(prev => prev + tag); return; }
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const newVal = schedSmsMessage.slice(0, start) + tag + schedSmsMessage.slice(end);
                      setSchedSmsMessage(newVal);
                      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + tag.length, start + tag.length); }, 0);
                    };
                    return (
                      <div className="pt-2 border-t border-emerald-800/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-200">SMS Notification</p>
                            <p className="text-[10px] text-slate-500">Send a personalised text to participants before the call</p>
                          </div>
                          <button
                            onClick={() => setSchedSmsEnabled(v => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3 ${
                              schedSmsEnabled ? "bg-blue-600" : "bg-slate-600"
                            }`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              schedSmsEnabled ? "translate-x-5" : "translate-x-0.5"
                            }`} />
                          </button>
                        </div>
                        {schedSmsEnabled && (
                          <div className="space-y-2">
                            {/* Template selector */}
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Load Template</label>
                              <select
                                onChange={e => { if (e.target.value) setSchedSmsMessage(e.target.value); e.target.value = ""; }}
                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">— Select a template —</option>
                                {SMS_TEMPLATES.map(t => (
                                  <option key={t.label} value={t.text}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            {/* Merge tags toolbar */}
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Insert Merge Tag</label>
                              <div className="flex flex-wrap gap-1">
                                {SMS_TAGS.map(({ tag, label }) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => insertSmsTag(tag)}
                                    className="px-1.5 py-0.5 bg-blue-900/50 border border-blue-700/50 text-blue-300 rounded text-[10px] hover:bg-blue-800/60 transition-colors"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Message editor */}
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Message</label>
                              <textarea
                                id="sms-template-textarea"
                                value={schedSmsMessage}
                                onChange={e => setSchedSmsMessage(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none font-mono"
                                placeholder="Type your message or load a template above…"
                              />
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-slate-500">
                                  {smsSegments > 1 ? <span className="text-amber-400">{smsSegments} segments</span> : "1 segment"} · sent to {schedDialOutParticipants.filter(p => p.phone).length} participant{schedDialOutParticipants.filter(p => p.phone).length !== 1 ? "s" : ""}
                                </span>
                                <span className={`text-[10px] font-mono ${
                                  schedSmsMessage.length > 320 ? "text-red-400" : schedSmsMessage.length > 160 ? "text-amber-400" : "text-slate-500"
                                }`}>{schedSmsMessage.length} chars</span>
                              </div>
                            </div>
                            {/* Live preview */}
                            <div className="bg-slate-900 border border-slate-700 rounded p-2">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Preview — {smsPreviewParticipant?.name || "First Participant"}</p>
                              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{smsPreview}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── Voice Message ─────────────────────────────────── */}
                  {(() => {
                    const VOICE_TEMPLATES = [
                      { label: "Standard Greeting", text: "Good day, {{name}}. You are about to be connected to the {{conference}} conference call hosted by Chorus Call. Please hold while we connect you." },
                      { label: "Earnings Call", text: "Hello {{name}} from {{company}}. Welcome to the {{conference}} earnings call. This call is being recorded. Please hold while we connect you to the conference." },
                      { label: "Board Briefing", text: "Good day, {{name}}. You are being connected to the {{conference}} board briefing. This is a confidential call. Please hold." },
                      { label: "Reminder Prompt", text: "Hello {{name}}, this is a reminder that the {{conference}} conference call is starting now. Please hold while we connect you." },
                    ];
                    const VOICE_TAGS = [
                      { tag: "{{name}}", label: "Name" },
                      { tag: "{{company}}", label: "Company" },
                      { tag: "{{conference}}", label: "Conference" },
                      { tag: "{{date}}", label: "Date" },
                      { tag: "{{time}}", label: "Time" },
                    ];
                    const voiceWords = schedVoiceTtsText.trim().split(/\s+/).filter(Boolean).length;
                    const voiceEstSecs = Math.round(voiceWords / 2.5);
                    const voicePreviewParticipant = schedDialOutParticipants[0];
                    const voicePreview = schedVoiceTtsText
                      .replace(/\{\{name\}\}/g, voicePreviewParticipant?.name || "John Smith")
                      .replace(/\{\{company\}\}/g, voicePreviewParticipant?.company || "Acme Corp")
                      .replace(/\{\{conference\}\}/g, schedSubject || "Q4 Earnings Call")
                      .replace(/\{\{date\}\}/g, schedDate || "2026-03-15")
                      .replace(/\{\{time\}\}/g, schedTime || "10:00");
                    const insertVoiceTag = (tag: string) => {
                      const ta = document.getElementById("voice-tts-textarea") as HTMLTextAreaElement | null;
                      if (!ta) { setSchedVoiceTtsText(prev => prev + tag); return; }
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const newVal = schedVoiceTtsText.slice(0, start) + tag + schedVoiceTtsText.slice(end);
                      setSchedVoiceTtsText(newVal);
                      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + tag.length, start + tag.length); }, 0);
                    };
                    return (
                      <div className="pt-2 border-t border-emerald-800/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-200">Voice Message</p>
                            <p className="text-[10px] text-slate-500">Play a personalised message when participants answer</p>
                          </div>
                          <button
                            onClick={() => setSchedVoiceEnabled(v => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3 ${
                              schedVoiceEnabled ? "bg-violet-600" : "bg-slate-600"
                            }`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              schedVoiceEnabled ? "translate-x-5" : "translate-x-0.5"
                            }`} />
                          </button>
                        </div>
                        {schedVoiceEnabled && (
                          <div className="space-y-2">
                            <div className="flex rounded overflow-hidden border border-slate-600">
                              <button
                                onClick={() => setSchedVoiceMode("tts")}
                                className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
                                  schedVoiceMode === "tts" ? "bg-violet-700 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                }`}
                              >
                                Text-to-Speech
                              </button>
                              <button
                                onClick={() => setSchedVoiceMode("upload")}
                                className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
                                  schedVoiceMode === "upload" ? "bg-violet-700 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                }`}
                              >
                                Upload Audio
                              </button>
                            </div>
                            {schedVoiceMode === "tts" ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Load Script Template</label>
                                  <select
                                    onChange={e => { if (e.target.value) setSchedVoiceTtsText(e.target.value); e.target.value = ""; }}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                                  >
                                    <option value="">Select a script template</option>
                                    {VOICE_TEMPLATES.map(t => (
                                      <option key={t.label} value={t.text}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Insert Merge Tag</label>
                                  <div className="flex flex-wrap gap-1">
                                    {VOICE_TAGS.map(({ tag, label }) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => insertVoiceTag(tag)}
                                        className="px-1.5 py-0.5 bg-violet-900/50 border border-violet-700/50 text-violet-300 rounded text-[10px] hover:bg-violet-800/60 transition-colors"
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Script</label>
                                  <textarea
                                    id="voice-tts-textarea"
                                    value={schedVoiceTtsText}
                                    onChange={e => setSchedVoiceTtsText(e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 resize-none font-mono"
                                    placeholder="Type your script or load a template above..."
                                  />
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-slate-500">{voiceWords} words</span>
                                    <span className="text-[10px] text-slate-500">approx {voiceEstSecs}s at normal pace</span>
                                  </div>
                                </div>
                                {schedVoiceTtsText.trim() && (
                                  <div className="bg-slate-900 border border-slate-700 rounded p-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Preview - {voicePreviewParticipant?.name || "First Participant"}</p>
                                    <p className="text-[11px] text-slate-300 leading-relaxed italic">&ldquo;{voicePreview}&rdquo;</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider">Audio File (MP3 / WAV, max 5MB)</label>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-800 border border-slate-600 hover:border-violet-500 rounded px-3 py-2 transition-colors">
                                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs text-slate-400">
                                    {schedVoiceFile ? schedVoiceFile.name : "Choose audio file..."}
                                  </span>
                                  <input
                                    type="file"
                                    accept="audio/mp3,audio/mpeg,audio/wav"
                                    className="hidden"
                                    onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      if (f.size > 5 * 1024 * 1024) { toast.error("Audio file must be under 5MB"); return; }
                                      setSchedVoiceFile(f);
                                    }}
                                  />
                                </label>
                                {schedVoiceFile && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <audio controls src={URL.createObjectURL(schedVoiceFile)} className="h-7 w-full" />
                                      <button onClick={() => setSchedVoiceFile(null)} className="text-slate-500 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <p className="text-[10px] text-slate-500">{(schedVoiceFile.size / 1024).toFixed(0)} KB - {schedVoiceFile.type}</p>
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-500">Note: merge tags are not available for uploaded audio files.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-slate-800 rounded-b-xl">
              <button
                onClick={doScheduleConference}
                disabled={!schedSubject.trim() || !schedDate || !schedTime}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Schedule Conference
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Party Dial-Out Modal ─────────────────────────────────────── */}
      {showMultiDialModal && (() => {
        const multiDialOutMutation = trpc.occ.multiDialOut.useMutation({
          onSuccess: (data) => {
            if (data.success) {
              setDialEntries(prev => prev.map(e => ({ ...e, status: "connected" as const })));
              setDialAllStatus("done");
              if (activeCCPConferenceId) participantsQuery.refetch();
            }
          },
        });
        const addEntry = () => {
          if (!dialForm.phone.trim()) return;
          setDialEntries(prev => [...prev, {
            id: Math.random().toString(36).slice(2),
            name: dialForm.name,
            company: dialForm.company,
            phone: dialForm.phone,
            role: dialForm.role,
            status: "pending",
          }]);
          setDialForm({ name: "", company: "", phone: "", role: "participant" });
        };
        const removeEntry = (id: string) => setDialEntries(prev => prev.filter(e => e.id !== id));
        const dialAll = () => {
          if (!activeCCPConferenceId || dialEntries.length === 0) return;
          setDialAllStatus("dialling");
          setDialEntries(prev => prev.map(e => ({ ...e, status: "dialling" as const })));
          multiDialOutMutation.mutate({
            conferenceId: activeCCPConferenceId,
            entries: dialEntries.map(e => ({ name: e.name || undefined, company: e.company || undefined, phoneNumber: e.phone, role: e.role })),
          });
        };

        // Load IR Contacts
        const irContactsQuery = trpc.irContacts.getForDial.useQuery(undefined, { enabled: showMultiDialModal });
        const loadIRContacts = () => {
          const contacts = irContactsQuery.data ?? [];
          if (contacts.length === 0) {
            setCsvImportMsg({ imported: 0, skipped: 0, errors: ["No IR contacts with phone numbers found. Add phone numbers in the IR Contacts page."] });
            return;
          }
          const existingPhones = new Set(dialEntries.map(e => e.phone.replace(/\s/g, "")));
          let loaded = 0; let skipped = 0;
          const newEntries: DialEntry[] = [];
          contacts.forEach(c => {
            const phone = (c.phoneNumber ?? "").trim();
            if (!phone || existingPhones.has(phone.replace(/\s/g, ""))) { skipped++; return; }
            newEntries.push({
              id: Math.random().toString(36).slice(2),
              name: c.name,
              company: c.company ?? "",
              phone,
              role: "participant",
              status: "pending",
            });
            existingPhones.add(phone.replace(/\s/g, ""));
            loaded++;
          });
          setDialEntries(prev => [...prev, ...newEntries]);
          setCsvImportMsg({ imported: loaded, skipped, errors: skipped > 0 ? [`${skipped} contact(s) already in queue — skipped`] : [] });
        };

        // CSV import
        const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) {
              setCsvImportMsg({ imported: 0, skipped: 0, errors: ["CSV must have a header row and at least one data row."] });
              return;
            }
            // Parse header: name, company, phone, role (case-insensitive, any order)
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""));
            const nameIdx = headers.findIndex(h => h === "name");
            const companyIdx = headers.findIndex(h => h === "company");
            const phoneIdx = headers.findIndex(h => ["phone", "phone number", "phonenumber", "telephone", "number"].includes(h));
            const roleIdx = headers.findIndex(h => h === "role");
            if (phoneIdx === -1) {
              setCsvImportMsg({ imported: 0, skipped: 0, errors: ["CSV must have a 'phone' column."] });
              if (csvFileRef.current) csvFileRef.current.value = "";
              return;
            }
            const existingPhones = new Set(dialEntries.map(e => e.phone.replace(/\s/g, "")));
            let imported = 0; let skipped = 0; const errors: string[] = [];
            const newEntries: DialEntry[] = [];
            lines.slice(1).forEach((line, idx) => {
              const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
              const phone = phoneIdx >= 0 ? (cols[phoneIdx] ?? "").trim() : "";
              if (!phone) { skipped++; errors.push(`Row ${idx + 2}: missing phone number`); return; }
              if (existingPhones.has(phone.replace(/\s/g, ""))) { skipped++; errors.push(`Row ${idx + 2}: duplicate phone ${phone}`); return; }
              const rawRole = roleIdx >= 0 ? (cols[roleIdx] ?? "").toLowerCase().trim() : "";
              const role: "moderator" | "participant" = rawRole === "moderator" ? "moderator" : "participant";
              newEntries.push({
                id: Math.random().toString(36).slice(2),
                name: nameIdx >= 0 ? (cols[nameIdx] ?? "") : "",
                company: companyIdx >= 0 ? (cols[companyIdx] ?? "") : "",
                phone,
                role,
                status: "pending",
              });
              existingPhones.add(phone.replace(/\s/g, ""));
              imported++;
            });
            setDialEntries(prev => [...prev, ...newEntries]);
            setCsvImportMsg({ imported, skipped, errors });
            if (csvFileRef.current) csvFileRef.current.value = "";
          };
          reader.readAsText(file);
        };

        const downloadTemplate = () => {
          const csv = "name,company,phone,role\nJohn Smith,Acme Corp,+27 11 555 0100,participant\nJane Doe,Beta Ltd,+27 11 555 0200,moderator";
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "dial_out_template.csv"; a.click();
          URL.revokeObjectURL(url);
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-[#0f172a] border border-slate-700 rounded-lg w-[560px] shadow-2xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm text-slate-200">Multi-Party Dial-Out</span>
                  {activeCCPConferenceId && <span className="text-xs text-slate-500 ml-1">Conference #{activeCCPConferenceId}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input ref={csvFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
                  {/* Load IR Contacts */}
                  <button
                    onClick={loadIRContacts}
                    disabled={irContactsQuery.isLoading}
                    title="Load IR contacts with phone numbers into the dial queue"
                    className="flex items-center gap-1 px-2 py-1 bg-violet-800/40 hover:bg-violet-700/60 disabled:opacity-40 text-violet-300 rounded text-[10px] transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    {irContactsQuery.isLoading ? "Loading…" : `IR Contacts${irContactsQuery.data && irContactsQuery.data.length > 0 ? ` (${irContactsQuery.data.length})` : ""}`}
                  </button>
                  <button
                    onClick={() => csvFileRef.current?.click()}
                    title="Import participants from a CSV file"
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 rounded text-[10px] transition-colors"
                  >
                    <FileText className="w-3 h-3" /> Import CSV
                  </button>
                  <button
                    onClick={downloadTemplate}
                    title="Download CSV template"
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/70 text-slate-400 rounded text-[10px] transition-colors"
                  >
                    Template
                  </button>
                  <button onClick={() => { setShowMultiDialModal(false); setDialEntries([]); setDialAllStatus("idle"); setCsvImportMsg(null); }} className="text-slate-400 hover:text-slate-200 ml-1"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Add entry form */}
              <div className="px-4 pt-3 pb-2 border-b border-slate-800 flex-shrink-0">
                <p className="text-xs text-slate-500 mb-2">Add participants one at a time, then click <span className="text-blue-400 font-semibold">Dial All</span> to connect them simultaneously.</p>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    className="col-span-3 bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Name (optional)"
                    value={dialForm.name}
                    onChange={e => setDialForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addEntry()}
                  />
                  <input
                    className="col-span-3 bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Company (optional)"
                    value={dialForm.company}
                    onChange={e => setDialForm(f => ({ ...f, company: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addEntry()}
                  />
                  <input
                    className="col-span-3 bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Phone number *"
                    value={dialForm.phone}
                    onChange={e => setDialForm(f => ({ ...f, phone: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addEntry()}
                  />
                  <select
                    className="col-span-2 bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                    value={dialForm.role}
                    onChange={e => setDialForm(f => ({ ...f, role: e.target.value as "moderator" | "participant" }))}
                  >
                    <option value="participant">Participant</option>
                    <option value="moderator">Moderator</option>
                  </select>
                  <button
                    onClick={addEntry}
                    disabled={!dialForm.phone.trim()}
                    className="col-span-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CSV import result message */}
              {csvImportMsg && (
                <div className={`mx-4 mt-2 mb-1 px-3 py-2 rounded text-xs flex-shrink-0 ${
                  csvImportMsg.errors.length > 0 ? "bg-amber-900/30 border border-amber-700/40 text-amber-300" : "bg-emerald-900/30 border border-emerald-700/40 text-emerald-300"
                }`}>
                  <div className="flex items-center justify-between">
                    <span>
                      {csvImportMsg.imported > 0 && <span className="font-semibold">{csvImportMsg.imported} imported</span>}
                      {csvImportMsg.skipped > 0 && <span className="ml-2 text-amber-400">{csvImportMsg.skipped} skipped</span>}
                    </span>
                    <button onClick={() => setCsvImportMsg(null)} className="text-slate-500 hover:text-slate-300"><X className="w-3 h-3" /></button>
                  </div>
                  {csvImportMsg.errors.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[10px] text-amber-400/80 list-disc list-inside">
                      {csvImportMsg.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                      {csvImportMsg.errors.length > 5 && <li>…and {csvImportMsg.errors.length - 5} more</li>}
                    </ul>
                  )}
                </div>
              )}

              {/* Staged list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 min-h-[80px]">
                {dialEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-xs text-slate-600">No participants added yet — fill in the form above and click +</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left py-1 font-medium">Name</th>
                        <th className="text-left py-1 font-medium">Company</th>
                        <th className="text-left py-1 font-medium">Phone</th>
                        <th className="text-left py-1 font-medium">Role</th>
                        <th className="text-left py-1 font-medium">Status</th>
                        <th className="py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dialEntries.map(entry => (
                        <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-1.5 text-slate-300">{entry.name || <span className="text-slate-600">—</span>}</td>
                          <td className="py-1.5 text-slate-400">{entry.company || <span className="text-slate-600">—</span>}</td>
                          <td className="py-1.5 text-slate-300 font-mono">{entry.phone}</td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              entry.role === "moderator" ? "bg-amber-900/40 text-amber-400" : "bg-slate-700 text-slate-400"
                            }`}>{entry.role}</span>
                          </td>
                          <td className="py-1.5">
                            {entry.status === "pending" && <span className="text-slate-500">Pending</span>}
                            {entry.status === "dialling" && <span className="text-blue-400 animate-pulse">Dialling…</span>}
                            {entry.status === "connected" && <span className="text-emerald-400">✓ Connected</span>}
                            {entry.status === "failed" && <span className="text-red-400">✗ Failed</span>}
                          </td>
                          <td className="py-1.5">
                            {entry.status === "pending" && (
                              <button onClick={() => removeEntry(entry.id)} className="text-slate-600 hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 flex-shrink-0">
                <span className="text-xs text-slate-500">{dialEntries.length} participant{dialEntries.length !== 1 ? "s" : ""} queued</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDialEntries([]); setDialAllStatus("idle"); }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={dialAll}
                    disabled={dialEntries.length === 0 || !activeCCPConferenceId || dialAllStatus === "dialling"}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded"
                  >
                    <Phone className="w-3 h-3" />
                    {dialAllStatus === "dialling" ? "Dialling…" : dialAllStatus === "done" ? "Done" : `Dial All (${dialEntries.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Speaker Green Room Panel ─────────────────────────────────────────── */}
      {showGreenRoomPanel && activeCCPConferenceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#0f172a] border border-emerald-700/50 rounded-lg w-[520px] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-sm text-emerald-300">Speaker Green Room</span>
                <span className="text-xs text-slate-500">Pre-event sub-conference</span>
              </div>
              <button onClick={() => setShowGreenRoomPanel(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Green Room Status */}
              {!greenRoomQuery.data ? (
                <div className="text-center py-6">
                  <div className="text-slate-400 text-sm mb-4">No Green Room active for this conference.</div>
                  <button
                    onClick={() => createGreenRoomMut.mutate({ conferenceId: activeCCPConferenceId })}
                    disabled={createGreenRoomMut.isPending}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-sm font-semibold disabled:opacity-50"
                  >
                    {createGreenRoomMut.isPending ? "Opening..." : "Open Green Room"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Room Info */}
                  <div className="bg-slate-800/60 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">{greenRoomQuery.data.name}</div>
                      {greenRoomQuery.data.dialInNumber && (
                        <div className="text-xs text-slate-400 mt-0.5">Dial-in: {greenRoomQuery.data.dialInNumber}</div>
                      )}
                      {greenRoomQuery.data.accessCode && (
                        <div className="text-xs text-slate-400">Code: {greenRoomQuery.data.accessCode}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${greenRoomQuery.data.isOpen ? 'bg-emerald-900/60 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {greenRoomQuery.data.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                      {greenRoomQuery.data.isOpen && (
                        <button
                          onClick={() => closeGreenRoomMut.mutate({ conferenceId: activeCCPConferenceId })}
                          disabled={closeGreenRoomMut.isPending}
                          className="text-xs px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded disabled:opacity-50"
                        >
                          Close Room
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Speaker List */}
                  {(() => {
                    const greenRoomParticipants = (participantsQuery.data ?? []).filter(p => p.subconferenceId === -1);
                    return (
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Speakers in Green Room ({greenRoomParticipants.length})</div>
                        {greenRoomParticipants.length === 0 ? (
                          <div className="text-xs text-slate-500 italic py-2">No speakers added yet. Use the form below to dial in speakers.</div>
                        ) : (
                          <div className="space-y-1">
                            {greenRoomParticipants.map(p => (
                              <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-2">
                                <div>
                                  <span className="text-sm text-slate-200">{p.name ?? p.phoneNumber}</span>
                                  {p.company && <span className="text-xs text-slate-500 ml-2">{p.company}</span>}
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                  p.state === 'connected' || p.state === 'speaking' ? 'bg-emerald-900/60 text-emerald-400' :
                                  p.state === 'muted' ? 'bg-amber-900/60 text-amber-400' :
                                  'bg-slate-700 text-slate-400'
                                }`}>{p.state}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Add Speaker Form */}
                  {greenRoomQuery.data.isOpen && (
                    <div className="border border-slate-700 rounded-lg p-3">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Add Speaker to Green Room</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={greenRoomDialForm.name}
                          onChange={e => setGreenRoomDialForm(f => ({ ...f, name: e.target.value }))}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={greenRoomDialForm.company}
                          onChange={e => setGreenRoomDialForm(f => ({ ...f, company: e.target.value }))}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="tel"
                          placeholder="Phone number *"
                          value={greenRoomDialForm.phone}
                          onChange={e => setGreenRoomDialForm(f => ({ ...f, phone: e.target.value }))}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <select
                          value={greenRoomDialForm.role}
                          onChange={e => setGreenRoomDialForm(f => ({ ...f, role: e.target.value as any }))}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="participant">Speaker</option>
                          <option value="moderator">Moderator</option>
                          <option value="host">Host</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!greenRoomDialForm.phone.trim()) return;
                          addToGreenRoomMut.mutate({
                            conferenceId: activeCCPConferenceId,
                            name: greenRoomDialForm.name,
                            phoneNumber: greenRoomDialForm.phone,
                            company: greenRoomDialForm.company || undefined,
                            role: greenRoomDialForm.role as any,
                          }, { onSuccess: () => setGreenRoomDialForm({ name: "", phone: "", company: "", role: "participant" }) });
                        }}
                        disabled={!greenRoomDialForm.phone.trim() || addToGreenRoomMut.isPending}
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold disabled:opacity-50"
                      >
                        {addToGreenRoomMut.isPending ? "Dialling..." : "Dial into Green Room"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer — Transfer All to Main */}
            {greenRoomQuery.data?.isOpen && (
              <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
                <div className="text-xs text-slate-400 mb-2">When speakers are ready, transfer them all to the main conference.</div>
                <button
                  onClick={() => {
                    if (window.confirm("Transfer all Green Room speakers to the main conference?")) {
                      transferGreenRoomMut.mutate({ conferenceId: activeCCPConferenceId }, {
                        onSuccess: (data) => {
                          alert(`${data.transferredCount} speaker(s) transferred to the main conference.`);
                          setShowGreenRoomPanel(false);
                        }
                      });
                    }
                  }}
                  disabled={transferGreenRoomMut.isPending}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  {transferGreenRoomMut.isPending ? "Transferring..." : "Transfer All to Main Conference"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Transfer Conference Modal ────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg w-[420px] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-slate-200">Transfer Conference</span>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              {transferSent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-200 font-semibold">Transfer request sent!</p>
                  <p className="text-slate-400 text-sm mt-1">The target operator has been notified via Ably.</p>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
                  >Close</button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-slate-400 text-xs mb-3">
                      Transferring: <span className="text-slate-200 font-semibold">{activeConf?.subject ?? "Selected Conference"}</span> ({activeConf?.callId})
                    </p>
                    {otherOperators.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        <p className="text-slate-400 text-xs mb-2">Online operators (from Ably presence):</p>
                        {otherOperators.map(op => (
                          <button
                            key={op.clientId}
                            onClick={() => setTransferTargetOperator(op.name)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              transferTargetOperator === op.name
                                ? "bg-indigo-600/40 border border-indigo-500/60 text-indigo-200"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            }`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                            {op.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-800/50 border border-slate-700 rounded p-3 mb-3">
                        <p className="text-slate-400 text-xs">No other operators online via Ably presence. Enter a name manually:</p>
                      </div>
                    )}
                    <label className="block text-slate-400 text-xs mb-1">Target Operator Name</label>
                    <input
                      type="text"
                      value={transferTargetOperator}
                      onChange={e => setTransferTargetOperator(e.target.value)}
                      placeholder="e.g. Operator 2"
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Handover Note (optional)</label>
                    <textarea
                      value={transferNote}
                      onChange={e => setTransferNote(e.target.value)}
                      placeholder="e.g. Moderator has requested Q&A mode. 3 callers in queue."
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={!transferTargetOperator.trim()}
                      onClick={async () => {
                        // Publish transfer notification via Ably conference channel
                        try {
                          if (ablyConferenceChanRef.current) {
                            await ablyConferenceChanRef.current.publish("conference:transfer", {
                              fromOperator: user?.name ?? "Operator",
                              toOperator: transferTargetOperator.trim(),
                              conferenceId: activeCCPConferenceId,
                              conferenceName: activeConf?.subject,
                              callId: activeConf?.callId,
                              note: transferNote.trim() || null,
                              timestamp: Date.now(),
                            });
                          }
                        } catch { /* Ably not configured — demo mode */ }
                        setTransferSent(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-colors"
                    >
                      Send Transfer Request
                    </button>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ───────────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg w-[480px] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-sm text-slate-200">Operator Preferences</span>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-5">
              {/* Audio Alert Volume */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Audio Alert Volume</label>
                  <span className="text-indigo-400 text-sm font-semibold">{settingAlertVolume}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={settingAlertVolume}
                  onChange={e => setSettingAlertVolume(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-slate-500 text-xs mt-1">Controls the volume of incoming call beeps and lounge alerts.</p>
              </div>

              {/* Timer Thresholds */}
              <div>
                <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5" /> Conference Timer Alerts</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Warning threshold (min)</label>
                    <input
                      type="number" min={1} max={60}
                      value={settingTimerWarning}
                      onChange={e => setSettingTimerWarning(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-slate-500 text-[10px] mt-0.5">Amber timer alert</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Critical threshold (min)</label>
                    <input
                      type="number" min={1} max={30}
                      value={settingTimerCritical}
                      onChange={e => setSettingTimerCritical(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-slate-500 text-[10px] mt-0.5">Red timer alert</p>
                  </div>
                </div>
              </div>

              {/* Default Filter */}
              <div>
                <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5 mb-2"><Filter className="w-3.5 h-3.5" /> Default Participant Filter</label>
                <select
                  value={settingDefaultFilter}
                  onChange={e => setSettingDefaultFilter(e.target.value as FilterMode)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Participants</option>
                  <option value="moderators">Moderators Only</option>
                  <option value="participants">Participants Only</option>
                  <option value="unmuted">Unmuted</option>
                  <option value="muted">Muted</option>
                  <option value="parked">Parked</option>
                  <option value="connected">Connected</option>
                  <option value="waiting">Waiting / Needs Operator</option>
                  <option value="speak_requests">Raised Hands</option>
                </select>
              </div>

              {/* Preferred Dial-In Country */}
              <div>
                <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5 mb-2"><Phone className="w-3.5 h-3.5" /> Preferred Dial-In Country</label>
                <select
                  value={settingDialInCountry}
                  onChange={e => setSettingDialInCountry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ZA">South Africa (+27)</option>
                  <option value="NG">Nigeria (+234)</option>
                  <option value="KE">Kenya (+254)</option>
                  <option value="GH">Ghana (+233)</option>
                  <option value="ZW">Zimbabwe (+263)</option>
                  <option value="MU">Mauritius (+230)</option>
                  <option value="AE">UAE (+971)</option>
                  <option value="GB">United Kingdom (+44)</option>
                  <option value="US">United States (+1)</option>
                </select>
                <p className="text-slate-500 text-xs mt-1">Used to pre-fill the dial-out number prefix.</p>
              </div>

              {/* Toggle Preferences */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium block">Display Options</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setSettingAutoAcceptLounge(v => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      settingAutoAcceptLounge ? "bg-indigo-600" : "bg-slate-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      settingAutoAcceptLounge ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                  <span className="text-slate-300 text-sm">Auto-accept lounge callers</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setSettingShowCompany(v => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      settingShowCompany ? "bg-indigo-600" : "bg-slate-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      settingShowCompany ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                  <span className="text-slate-300 text-sm">Show company column in participant table</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-700">
                <button
                  onClick={() => {
                    // Apply default filter immediately
                    setFilterMode(settingDefaultFilter);
                    setShowSettingsModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold transition-colors"
                >
                  Save & Apply
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0a0d14] border-t border-slate-800 text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>Chorus.OCC v1.0</span>
          <span>Bridge: <span className="text-emerald-400">Connected</span></span>
          <span>Running: <span className="text-slate-300">{runningConfs.length}</span></span>
          <span>Lounge: <span className={loungeEntries.length > 0 ? "text-amber-400" : "text-slate-300"}>{loungeEntries.length}</span></span>
          <span>Requests: <span className={opRequests.length > 0 ? "text-red-400" : "text-slate-300"}>{opRequests.length}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>{new Date().toLocaleTimeString()}</span>
          <span>{new Date().toLocaleDateString()}</span>
          <span className="text-slate-400">{user?.name ?? "Operator"}</span>
        </div>
      </div>
    </div>
  );
}
