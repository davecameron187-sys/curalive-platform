/**
 * WebcastStudio.tsx — Chorus.AI Live Webcast Production Console
 * The operator-facing studio for managing any live webcast/webinar/virtual event.
 * Features: stream status, Q&A moderation, polls, live chat, attendee count, AI captions.
 *
 * Real-time powered by Ably via AblyProvider / useAbly context:
 *   - Q&A: submitted questions arrive via "qa.submitted", status changes via "qa.status"
 *   - Polls: pushed via "poll.pushed", votes via "poll.vote", closed via "poll.closed"
 *   - Chat: published as "chat.message" custom type (stored in local state + broadcast)
 *   - Captions: arrive via "transcript.segment"
 *   - Presence: attendee count from presenceCount
 */
import { useState, useEffect, useCallback, useRef } from "react";
import RecallBotPanel from "@/components/RecallBotPanel";
import MuxStreamPanel from "@/components/MuxStreamPanel";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AblyProvider, useAbly, type QAItem, type Poll } from "@/contexts/AblyContext";
import {
  Mic, MicOff, Video, VideoOff, Radio, Users, MessageSquare,
  BarChart3, Settings, Check, X,
  Send, Play, Pause, StopCircle, Globe,
  Activity, Zap, Clock, Eye, ThumbsUp, AlertCircle, Bot as BotIcon,
  Loader2, Plus, ChevronRight, Share2, CheckCircle2, ExternalLink, Upload,
  Bell, RefreshCw, Mail, Sparkles, Phone
} from "lucide-react";
import RollingSummaryPanel from "@/components/RollingSummaryPanel";
import EventBriefPanel from "@/components/EventBriefPanel";
import Webphone from "@/components/Webphone";

// ─── Types ────────────────────────────────────────────────────────────────────
type StudioTab = "qa" | "polls" | "chat" | "captions" | "analytics" | "ai" | "bot" | "stream" | "reminders";
type StreamStatus = "offline" | "connecting" | "live" | "paused";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  time: string;
  isOperator: boolean;
};

// ─── Seed chat messages ───────────────────────────────────────────────────────
const SEED_CHAT: ChatMessage[] = [
  { id: "c1", author: "Moderator", text: "Welcome to the live webcast. Please submit your questions using the Q&A panel.", time: "00:00:05", isOperator: true },
  { id: "c2", author: "James O.", text: "Great results! Looking forward to the Q&A session.", time: "00:02:30", isOperator: false },
  { id: "c3", author: "Amara D.", text: "Impressive margin expansion. Well done to the team.", time: "00:03:15", isOperator: false },
];

// ─── Sentiment badge ──────────────────────────────────────────────────────────
function SentimentDot({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />;
  if (sentiment === "negative") return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />;
}

// ─── Q Status badge ───────────────────────────────────────────────────────────
function QStatusBadge({ status }: { status: string }) {
  if (status === "pending") return <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Pending</span>;
  if (status === "approved") return <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded">Approved</span>;
  if (status === "answered") return <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">Answered</span>;
  if (status === "dismissed") return <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 rounded">Dismissed</span>;
  return null;
}

// ─── New Poll Form ────────────────────────────────────────────────────────────
function NewPollForm({ onSubmit, onCancel }: { onSubmit: (q: string, opts: string[]) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => setOptions(o => [...o, ""]);
  const updateOption = (i: number, val: string) => setOptions(o => o.map((v, idx) => idx === i ? val : v));
  const removeOption = (i: number) => setOptions(o => o.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) return;
    onSubmit(question.trim(), validOpts);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-semibold text-primary">New Poll</h4>
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">Question *</label>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask the audience..."
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground block">Options (min 2)</label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button type="button" onClick={addOption} className="text-[10px] text-primary hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add option
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
          Launch Poll
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-secondary border border-border text-muted-foreground py-1.5 rounded-lg text-xs font-semibold hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Inner studio (uses AblyProvider context) ─────────────────────────────────
function WebcastStudioInner({ slug }: { slug: string }) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<StudioTab>("qa");

  // Operator profile
  const { data: operatorProfile } = trpc.profile.get.useQuery();
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("live");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showWebphone, setShowWebphone] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(2478);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>(SEED_CHAT);
  const [peakAttendees, setPeakAttendees] = useState(487);
  const [showNewPoll, setShowNewPoll] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Publish Recording state ─────────────────────────────────────────────────
  const [recordingUrlInput, setRecordingUrlInput] = useState("");
  const [muxPlaybackIdInput, setMuxPlaybackIdInput] = useState("");
  const [publishMode, setPublishMode] = useState<"url" | "mux">("url");
  const [publishSuccess, setPublishSuccess] = useState(false);

  const setRecordingUrlMutation = trpc.webcast.setRecordingUrl.useMutation({
    onSuccess: () => {
      setPublishSuccess(true);
      toast.success("Recording published — event is now On Demand");
      setTimeout(() => setPublishSuccess(false), 5000);
      // Refresh event data so the status badge updates
      setTimeout(() => refetchEvent(), 500);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to publish recording");
    },
  });

  const handlePublishRecording = () => {
    if (!event?.id) { toast.error("Event not loaded"); return; }
    if (publishMode === "mux") {
      if (!muxPlaybackIdInput.trim()) { toast.error("Enter a Mux playback ID"); return; }
      setRecordingUrlMutation.mutate({
        id: event.id,
        muxAssetPlaybackId: muxPlaybackIdInput.trim(),
        transitionToOnDemand: true,
      });
    } else {
      if (!recordingUrlInput.trim()) { toast.error("Enter a recording URL"); return; }
      setRecordingUrlMutation.mutate({
        id: event.id,
        recordingUrl: recordingUrlInput.trim(),
        transitionToOnDemand: true,
      });
    }
  };

  // ── Ably real-time context ──────────────────────────────────────────────────
  const { transcript, sentiment, qaItems, polls, presenceCount, publish, mode } = useAbly();

  // Fetch event details
  const { data: event, refetch: refetchEvent } = trpc.webcast.getEvent.useQuery(
    { slug: slug || "ceo-town-hall-q1-2026" },
    { enabled: !!slug, retry: false }
  );

  // ── Reminders state ────────────────────────────────────────────────────────
  const [sendingReminder, setSendingReminder] = useState<"24h" | "1h" | null>(null);
  const { data: reminderStatus, refetch: refetchReminderStatus } = trpc.webcast.getReminderStatus.useQuery(
    { eventId: event?.id ?? 0 },
    { enabled: !!event?.id, refetchInterval: 30_000 }
  );
  const sendRemindersNowMutation = trpc.webcast.sendRemindersNow.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.sent} reminder${result.sent !== 1 ? 's' : ''} sent${result.errors > 0 ? ` (${result.errors} failed)` : ''}`);
      setSendingReminder(null);
      refetchReminderStatus();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to send reminders");
      setSendingReminder(null);
    },
  });
  const handleSendReminders = (type: "24h" | "1h", force = false) => {
    if (!event?.id) { toast.error("Event not loaded"); return; }
    setSendingReminder(type);
    sendRemindersNowMutation.mutate({
      eventId: event.id,
      reminderType: type,
      force,
      origin: window.location.origin,
    });
  };

  // ── Elapsed timer + peak attendee tracking ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
      setPeakAttendees(p => Math.max(p, presenceCount));
    }, 1000);
    return () => clearInterval(interval);
  }, [presenceCount]);

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── Q&A moderation via Ably ─────────────────────────────────────────────────
  const handleApproveQ = useCallback((id: string) => {
    publish({ type: "qa.status", data: { id, status: "approved" } });
  }, [publish]);

  const handleAnswerQ = useCallback((id: string) => {
    publish({ type: "qa.status", data: { id, status: "answered" } });
  }, [publish]);

  const handleDismissQ = useCallback((id: string) => {
    publish({ type: "qa.status", data: { id, status: "rejected" } });
  }, [publish]);

  // ── Poll management via Ably ────────────────────────────────────────────────
  const handleLaunchNewPoll = useCallback((question: string, optionLabels: string[]) => {
    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      options: optionLabels.map((label, i) => ({ id: `opt-${i}`, label, votes: 0 })),
      status: "live",
      createdAt: Date.now(),
    };
    publish({ type: "poll.pushed", data: poll });
    setShowNewPoll(false);
  }, [publish]);

  const handleClosePoll = useCallback((pollId: string) => {
    publish({ type: "poll.closed", data: { pollId } });
  }, [publish]);

  // ── Chat via Ably (broadcast as custom message) ─────────────────────────────
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `chat-${Date.now()}`,
      author: "Moderator",
      text: chatInput.trim(),
      time: formatElapsed(elapsedSeconds),
      isOperator: true,
    };
    setChat(c => [...c, msg]);
    setChatInput("");
    // Broadcast to attendees via Ably transcript channel (reuse as operator announcement)
    publish({
      type: "transcript.segment",
      data: {
        id: msg.id,
        speaker: "Moderator",
        text: `[Moderator] ${msg.text}`,
        timestamp: Date.now(),
        timeLabel: msg.time,
      },
    });
  }, [chatInput, elapsedSeconds, publish]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const pendingQs = qaItems.filter(q => q.status === "pending").length;
  const approvedQs = qaItems.filter(q => q.status === "approved").length;
  const livePolls = polls.filter(p => p.status === "live");
  const eventTitle = event?.title || "CEO All-Hands Town Hall — Q1 2026";
  const eventHost = event?.hostName || "David Cameron, CEO";
  const liveAttendees = presenceCount > 0 ? presenceCount : 412;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Top Control Bar ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: event info */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/live-video/webcasting")} className="text-muted-foreground hover:text-foreground transition-colors text-xs shrink-0">
              ← Hub
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2 min-w-0">
              {streamStatus === "live" && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
              <span className="text-sm font-semibold truncate">{eventTitle}</span>
            </div>
            {/* Ably mode indicator */}
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              mode === "ably"
                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                : "text-amber-400 bg-amber-400/10 border-amber-400/20"
            }`}>
              {mode === "ably" ? "⚡ Ably Live" : "Demo Mode"}
            </span>
          </div>

          {/* Center: elapsed + attendees */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-foreground font-semibold">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">{liveAttendees.toLocaleString()}</span>
              <span className="text-xs">live</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Eye className="w-3.5 h-3.5" />
              <span>Peak: {peakAttendees.toLocaleString()}</span>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMicOn(m => !m)}
              className={`p-2 rounded-lg border transition-colors ${micOn ? "bg-secondary border-border text-foreground" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setVideoOn(v => !v)}
              className={`p-2 rounded-lg border transition-colors ${videoOn ? "bg-secondary border-border text-foreground" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
            >
              {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            {streamStatus === "live" ? (
              <button
                onClick={() => setStreamStatus("paused")}
                className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            ) : streamStatus === "paused" ? (
              <button
                onClick={() => setStreamStatus("live")}
                className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
            ) : (
              <button
                onClick={() => setStreamStatus("live")}
                className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                <Radio className="w-3.5 h-3.5" /> Go Live
              </button>
            )}
            <button
              onClick={() => setStreamStatus("offline")}
              className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5" /> End
            </button>
            {/* Webphone button */}
            <button
              onClick={() => setShowWebphone(v => !v)}
              title="Open Webphone"
              className={`p-2 rounded-lg border transition-colors ${
                showWebphone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" />
            </button>
            {/* Operator profile chip */}
            {operatorProfile && (
              <div className="hidden xl:flex items-center gap-2 ml-2 pl-2 border-l border-border">
                {operatorProfile.avatarUrl ? (
                  <img src={operatorProfile.avatarUrl} alt="Operator" className="w-7 h-7 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(operatorProfile.name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-foreground">{operatorProfile.name}</div>
                  {operatorProfile.jobTitle && <div className="text-[10px] text-muted-foreground">{operatorProfile.jobTitle}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Webphone floating panel ── */}
      {showWebphone && (
        <div className="absolute top-16 right-4 z-50">
          <Webphone defaultMinimised={false} />
        </div>
      )}
      {/* ── Main Studio Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Video Preview + Captions ── */}
        <div className="flex flex-col w-[55%] border-r border-border overflow-hidden">
          {/* Video preview area */}
          <div className="relative bg-black flex-1 flex items-center justify-center min-h-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {eventHost.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{eventHost}</p>
                <p className="text-xs text-slate-400 mt-0.5">Main Speaker</p>
              </div>
            </div>

            {/* Stream status overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {streamStatus === "live" && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              )}
              {streamStatus === "paused" && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 px-2 py-1 rounded">
                  PAUSED
                </span>
              )}
            </div>

            {/* Attendee count overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10">
              <Users className="w-3.5 h-3.5" />
              {liveAttendees.toLocaleString()} watching
            </div>

            {/* Sentiment bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2 flex items-center gap-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Sentiment</span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${sentiment?.score ?? 72}%` }} />
              </div>
              <span className="text-xs font-semibold text-emerald-400">{sentiment?.score ?? 72}% Positive</span>
              <div className="w-px h-4 bg-slate-600" />
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">
                {(sentiment?.score ?? 72) > 70 ? "Audience: Engaged" : (sentiment?.score ?? 72) > 50 ? "Audience: Neutral" : "Audience: Concerned"}
              </span>
            </div>
          </div>

          {/* Live Captions panel — real-time from Ably transcript */}
          <div className="h-44 border-t border-border bg-card/50 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Captions — AI Transcription</span>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </div>
            </div>
            <div className="p-3 space-y-2">
              {transcript.slice(-8).map(seg => (
                <div key={seg.id} className="flex items-start gap-2.5">
                  <SentimentDot sentiment="neutral" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-primary font-semibold">{seg.speaker}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{seg.timeLabel}</span>
                    <p className="text-xs text-foreground/80 leading-relaxed mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{seg.text}</p>
                  </div>
                </div>
              ))}
              {transcript.length === 0 && (
                <p className="text-xs text-muted-foreground italic" style={{ fontFamily: "'Inter', sans-serif" }}>Waiting for transcript…</p>
              )}
              {/* Live cursor */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span style={{ fontFamily: "'Inter', sans-serif" }}>Transcribing...</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Control Panels ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-border bg-card/30 shrink-0 overflow-x-auto">
            {([
              { id: "qa" as StudioTab, icon: MessageSquare, label: "Q&A", badge: pendingQs > 0 ? pendingQs : undefined as number | undefined },
              { id: "polls" as StudioTab, icon: BarChart3, label: "Polls", badge: livePolls.length > 0 ? livePolls.length : undefined as number | undefined },
              { id: "chat" as StudioTab, icon: Send, label: "Chat", badge: undefined as number | undefined },
              { id: "captions" as StudioTab, icon: Globe, label: "Translation", badge: undefined as number | undefined },
              { id: "analytics" as StudioTab, icon: Activity, label: "Analytics", badge: undefined as number | undefined },
              { id: "ai" as StudioTab, icon: Sparkles, label: "AI", badge: undefined as number | undefined },
              { id: "bot" as StudioTab, icon: BotIcon, label: "Bot", badge: undefined as number | undefined },
              { id: "stream" as StudioTab, icon: Radio, label: "Stream", badge: undefined as number | undefined },
              { id: "reminders" as StudioTab, icon: Bell, label: "Reminders", badge: undefined as number | undefined },
            ]).map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as StudioTab)}
                className={`flex items-center gap-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors relative whitespace-nowrap ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge !== undefined && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Q&A Panel — Ably real-time ── */}
            {activeTab === "qa" && (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {qaItems.length} questions · {pendingQs} pending · {approvedQs} approved
                    {mode === "ably" && <span className="ml-2 text-emerald-400">⚡ live</span>}
                  </span>
                  <button className="text-[10px] text-primary hover:underline">Sort by votes</button>
                </div>
                {qaItems
                  .slice()
                  .sort((a, b) => (a.status === "rejected" ? 1 : 0) - (b.status === "rejected" ? 1 : 0) || b.votes - a.votes)
                  .map((q: QAItem) => (
                    <div key={q.id} className={`bg-card border rounded-xl p-3 ${q.status === "rejected" ? "opacity-40" : "border-border"}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{q.author}</span>
                            <QStatusBadge status={q.status} />
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <ThumbsUp className="w-3 h-3" />
                          {q.votes}
                        </div>
                      </div>
                      {q.status !== "rejected" && q.status !== "answered" && (
                        <div className="flex gap-1.5 mt-2">
                          {q.status === "pending" && (
                            <button
                              onClick={() => handleApproveQ(q.id)}
                              className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-semibold hover:bg-blue-500/20 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {q.status === "approved" && (
                            <button
                              onClick={() => handleAnswerQ(q.id)}
                              className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Mark Answered
                            </button>
                          )}
                          <button
                            onClick={() => handleDismissQ(q.id)}
                            className="flex items-center gap-1 bg-secondary border border-border text-muted-foreground px-2 py-1 rounded text-[10px] font-semibold hover:text-foreground transition-colors"
                          >
                            <X className="w-3 h-3" /> Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                {qaItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No questions yet. They'll appear here in real-time.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Polls Panel — Ably real-time ── */}
            {activeTab === "polls" && (
              <div className="p-3 space-y-3">
                {!showNewPoll && (
                  <button
                    onClick={() => setShowNewPoll(true)}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 py-2 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Poll
                  </button>
                )}
                {showNewPoll && (
                  <NewPollForm
                    onSubmit={handleLaunchNewPoll}
                    onCancel={() => setShowNewPoll(false)}
                  />
                )}
                {polls.map((poll: Poll) => {
                  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                  return (
                    <div key={poll.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">{poll.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {totalVotes} votes
                            {mode === "ably" && poll.status === "live" && <span className="ml-2 text-emerald-400">⚡ live</span>}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          poll.status === "live"
                            ? "text-red-400 bg-red-400/10 border-red-400/20"
                            : poll.status === "closed"
                            ? "text-slate-400 bg-slate-400/10 border-slate-400/20"
                            : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                        }`}>
                          {poll.status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {poll.options.map((opt) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          return (
                            <div key={opt.id}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>{opt.label}</span>
                                <span className="text-muted-foreground">{pct}% ({opt.votes})</span>
                              </div>
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {poll.status === "live" && (
                        <button
                          onClick={() => handleClosePoll(poll.id)}
                          className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                        >
                          Close Poll
                        </button>
                      )}
                    </div>
                  );
                })}
                {polls.length === 0 && !showNewPoll && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No polls yet. Create one above to engage your audience.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Chat Panel — local + broadcast via Ably ── */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.isOperator ? "flex-row-reverse" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${msg.isOperator ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {msg.author[0]}
                      </div>
                      <div className={`max-w-[75%] ${msg.isOperator ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-semibold ${msg.isOperator ? "text-primary" : "text-foreground"}`}>{msg.author}</span>
                          <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <div className={`text-xs px-3 py-2 rounded-xl leading-relaxed ${msg.isOperator ? "bg-primary/10 text-foreground border border-primary/20" : "bg-card border border-border text-foreground"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t border-border p-3 flex gap-2 shrink-0">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendChat()}
                    placeholder="Send a message as Moderator..."
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={handleSendChat}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Translation Panel ── */}
            {activeTab === "captions" && (
              <div className="p-4 space-y-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3">Live Translation Settings</h3>
                  <div className="space-y-2">
                    {[
                      { lang: "English", code: "EN", active: true, attendees: 287 },
                      { lang: "French", code: "FR", active: true, attendees: 54 },
                      { lang: "Portuguese", code: "PT", active: true, attendees: 38 },
                      { lang: "Swahili", code: "SW", active: true, attendees: 21 },
                      { lang: "Arabic", code: "AR", active: false, attendees: 0 },
                      { lang: "Mandarin", code: "ZH", active: false, attendees: 0 },
                      { lang: "Spanish", code: "ES", active: false, attendees: 0 },
                      { lang: "German", code: "DE", active: false, attendees: 0 },
                    ].map(lang => (
                      <div key={lang.code} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${lang.active ? "bg-emerald-400" : "bg-slate-600"}`} />
                          <span className="text-sm font-medium">{lang.lang}</span>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{lang.code}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {lang.attendees > 0 && (
                            <span className="text-xs text-muted-foreground">{lang.attendees} attendees</span>
                          )}
                          <button className={`text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                            lang.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                          }`}>
                            {lang.active ? "Active" : "Enable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Caption Display</h3>
                  <div className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="flex items-center justify-between">
                      <span>Show captions to attendees</span>
                      <span className="text-emerald-400 font-semibold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Caption delay</span>
                      <span className="text-foreground font-semibold">~0.8s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transcription model</span>
                      <span className="text-foreground font-semibold">Whisper Large v3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Real-time channel</span>
                      <span className={`font-semibold ${mode === "ably" ? "text-emerald-400" : "text-amber-400"}`}>
                        {mode === "ably" ? "Ably Edge" : "Demo Bus"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Analytics Panel ── */}
            {activeTab === "analytics" && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Live Attendees", value: liveAttendees.toLocaleString(), color: "text-red-400", icon: Users },
                    { label: "Peak Attendees", value: peakAttendees.toLocaleString(), color: "text-amber-400", icon: Eye },
                    { label: "Questions", value: qaItems.length.toString(), color: "text-blue-400", icon: MessageSquare },
                    { label: "Poll Votes", value: polls.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0).toString(), color: "text-violet-400", icon: BarChart3 },
                    { label: "Avg Watch Time", value: formatElapsed(Math.floor(elapsedSeconds * 0.78)), color: "text-emerald-400", icon: Clock },
                    { label: "Engagement Score", value: String(Math.min(99, Math.round(((qaItems.length * 3) + (polls.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0) * 2) + 60)))) + "%", color: "text-primary", icon: Zap },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                      </div>
                      <div className={`text-xl font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Sentiment timeline — live from Ably */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Sentiment Timeline
                    {mode === "ably" && <span className="ml-2 text-emerald-400 normal-case font-normal">⚡ live</span>}
                  </h3>
                  <div className="flex items-end gap-1 h-16">
                    {[72, 68, 75, 80, 78, 82, 85, 79, 76, 81, 84, 72, 78, 83, 87, 82, 79, 84, 88, sentiment?.score ?? 85].map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80"
                        style={{ height: `${v}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                    <span>Start</span>
                    <span>Now ({sentiment?.score ?? 85}%)</span>
                  </div>
                </div>

                {/* Top countries */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Locations</h3>
                  <div className="space-y-2">
                    {[
                      { country: "South Africa", count: 187, pct: 45 },
                      { country: "United Kingdom", count: 89, pct: 22 },
                      { country: "United States", count: 54, pct: 13 },
                      { country: "Kenya", count: 38, pct: 9 },
                      { country: "Nigeria", count: 21, pct: 5 },
                    ].map(loc => (
                      <div key={loc.country} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 truncate">{loc.country}</span>
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${loc.pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{loc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Summary Panel ── */}
            {activeTab === "ai" && (
              <div className="p-4 space-y-4">
                <RollingSummaryPanel
                  eventTitle={event?.title ?? "Live Event"}
                  className="w-full"
                />
                {/* Sentiment keywords */}
                {sentiment?.keywords && sentiment.keywords.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sentiment Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {sentiment.keywords.map((kw: string) => (
                        <span key={kw} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Event Brief Generator */}
                <EventBriefPanel eventTitle={event?.title ?? ""} />
              </div>
            )}

            {/* ── Recall.ai Bot Panel ── */}
            {activeTab === "bot" && (
              <div className="p-4">
                <RecallBotPanel eventId={event?.id} />
              </div>
            )}

            {/* ── Mux RTMP Stream Panel + Publish Recording ── */}
            {activeTab === "stream" && (
              <div className="p-4 space-y-4">
                <MuxStreamPanel
                  eventId={event?.id}
                  eventLabel={event?.title ?? slug}
                />

                {/* ── Publish Recording ── */}
                <div className="border border-border rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-card/40 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Publish Recording</span>
                    </div>
                    {(event?.status === "on_demand") && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> On Demand
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Already published notice */}
                    {(event?.status === "on_demand" && event?.recordingUrl) && (
                      <div className="flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-400 mb-0.5">Recording is live</p>
                          <p className="text-[10px] text-muted-foreground break-all font-mono">{event.recordingUrl}</p>
                          <a
                            href={event.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Preview
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Mode toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-border text-xs font-semibold">
                      <button
                        onClick={() => setPublishMode("url")}
                        className={`flex-1 py-2 transition-colors ${
                          publishMode === "url"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Direct URL
                      </button>
                      <button
                        onClick={() => setPublishMode("mux")}
                        className={`flex-1 py-2 transition-colors border-l border-border ${
                          publishMode === "mux"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Mux Playback ID
                      </button>
                    </div>

                    {/* Input */}
                    {publishMode === "url" ? (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                          Recording URL (MP4, HLS .m3u8, or Mux stream URL)
                        </label>
                        <input
                          type="url"
                          value={recordingUrlInput}
                          onChange={e => setRecordingUrlInput(e.target.value)}
                          placeholder="https://stream.mux.com/abc123.m3u8"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                          Paste any publicly accessible video URL. Mux HLS URLs are recommended for best performance.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                          Mux Asset Playback ID
                        </label>
                        <input
                          type="text"
                          value={muxPlaybackIdInput}
                          onChange={e => setMuxPlaybackIdInput(e.target.value)}
                          placeholder="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe4NtNDnBO8c"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                          Find this in the Mux Dashboard under Assets → Playback IDs. The HLS URL will be built automatically.
                        </p>
                      </div>
                    )}

                    {/* Transition notice */}
                    <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Publishing a recording will automatically transition this event to <strong className="text-amber-400">On Demand</strong> status. Registered attendees will be able to watch via their personal link.
                      </p>
                    </div>

                    {/* Publish button */}
                    <button
                      onClick={handlePublishRecording}
                      disabled={setRecordingUrlMutation.isPending || publishSuccess}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {setRecordingUrlMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                      ) : publishSuccess ? (
                        <><CheckCircle2 className="w-4 h-4" /> Published! — Event is On Demand</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Publish Recording</>
                      )}
                    </button>

                    {/* Share watch link after publish */}
                    {publishSuccess && (
                      <button
                        onClick={() => {
                          const watchUrl = `${window.location.origin}/live-video/webcast/${slug}/watch`;
                          navigator.clipboard.writeText(watchUrl).then(() => toast.success("Watch page URL copied to clipboard"));
                        }}
                        className="w-full flex items-center justify-center gap-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Copy Watch Page Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Reminders Tab ─────────────────────────────────────────── */}
            {activeTab === "reminders" && (
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Attendee Reminders</h3>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Automated emails are sent 24 h and 1 h before the event. Use the buttons below to trigger a manual send.
                    </p>
                  </div>
                  <button
                    onClick={() => refetchReminderStatus()}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Refresh counts"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stats row */}
                {reminderStatus ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold">{reminderStatus.total}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Registered</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{reminderStatus.sent24h}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">24 h Sent</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{reminderStatus.sent1h}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">1 h Sent</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[0,1,2].map(i => (
                      <div key={i} className="bg-secondary/30 rounded-lg p-3 h-16 animate-pulse" />
                    ))}
                  </div>
                )}

                {/* 24-hour reminder card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">24-Hour Reminder</span>
                    {reminderStatus && reminderStatus.total > 0 && reminderStatus.sent24h === reminderStatus.total && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded ml-auto">All Sent</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Sends to registrations that have <strong className="text-foreground">not yet received</strong> a 24-hour reminder.
                    {reminderStatus && (
                      <span className="ml-1 text-primary font-medium">{reminderStatus.pending24h} pending.</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendReminders("24h", false)}
                      disabled={sendingReminder !== null || (reminderStatus?.pending24h ?? 0) === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingReminder === "24h" ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                      ) : (
                        <><Bell className="w-3.5 h-3.5" /> Send to Pending</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSendReminders("24h", true)}
                      disabled={sendingReminder !== null || (reminderStatus?.total ?? 0) === 0}
                      title="Force-send to all registrations, including those already sent"
                      className="flex items-center justify-center gap-1.5 border border-border text-muted-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingReminder === "24h" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 1-hour reminder card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold">1-Hour Reminder</span>
                    {reminderStatus && reminderStatus.total > 0 && reminderStatus.sent1h === reminderStatus.total && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded ml-auto">All Sent</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Sends to registrations that have <strong className="text-foreground">not yet received</strong> a 1-hour reminder.
                    {reminderStatus && (
                      <span className="ml-1 text-amber-400 font-medium">{reminderStatus.pending1h} pending.</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendReminders("1h", false)}
                      disabled={sendingReminder !== null || (reminderStatus?.pending1h ?? 0) === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingReminder === "1h" ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                      ) : (
                        <><Bell className="w-3.5 h-3.5" /> Send to Pending</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSendReminders("1h", true)}
                      disabled={sendingReminder !== null || (reminderStatus?.total ?? 0) === 0}
                      title="Force-send to all registrations, including those already sent"
                      className="flex items-center justify-center gap-1.5 border border-border text-muted-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sendingReminder === "1h" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Scheduler notice */}
                <div className="flex items-start gap-2 p-3 bg-secondary/40 border border-border/50 rounded-lg">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    The automatic scheduler checks every 5 minutes and sends reminders within the 24 h and 1 h windows before the event start time. Manual sends above bypass the time window.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page — wraps with AblyProvider ─────────────────────────────────
export default function WebcastStudio() {
  const { slug } = useParams<{ slug: string }>();
  const eventId = slug || "webcast-studio-demo";
  return (
    <AblyProvider eventId={eventId}>
      <WebcastStudioInner slug={eventId} />
    </AblyProvider>
  );
}
