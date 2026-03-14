import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Download, Play, FileText, BarChart3,
  MessageSquare, Clock, Users, Globe, CheckCircle,
  TrendingUp, Minus, ChevronDown, ChevronUp,
  Sparkles, Loader2, AlertCircle, RefreshCw, Send, UserPlus, Trash2, X,
  AlertTriangle, Shield, TrendingDown, Pencil, Check, Phone, Share2,
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Wifi, WifiOff, Copy
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect as _useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

type PaceHistoryRow = { id: number; eventId: string; eventTitle: string; speaker: string; wpm: number; paceLabel: string; pauseScore: number; fillerWordCount: number; overallScore: number; analysedAt: number };

function PaceTrendChart({ data, speaker }: { data: PaceHistoryRow[]; speaker: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  _useEffect(() => {
    if (!canvasRef.current) return;
    const sorted = [...data].sort((a, b) => a.analysedAt - b.analysedAt);
    const labels = sorted.map((r) => r.eventTitle.length > 18 ? r.eventTitle.slice(0, 16) + "…" : r.eventTitle);
    const wpmData = sorted.map((r) => r.wpm);
    const scoreData = sorted.map((r) => r.overallScore);
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "WPM",
            data: wpmData,
            borderColor: "hsl(var(--primary))",
            backgroundColor: "hsla(var(--primary), 0.15)",
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: "y",
          },
          {
            label: "Score /100",
            data: scoreData,
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            borderDash: [4, 4],
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "hsl(var(--muted-foreground))", font: { size: 11 } } },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { ticks: { color: "hsl(var(--muted-foreground))", font: { size: 10 } }, grid: { color: "hsl(var(--border))" } },
          y: { position: "left", title: { display: true, text: "WPM", color: "hsl(var(--muted-foreground))" }, ticks: { color: "hsl(var(--muted-foreground))" }, grid: { color: "hsl(var(--border))" } },
          y1: { position: "right", min: 0, max: 100, title: { display: true, text: "Score", color: "hsl(var(--muted-foreground))" }, ticks: { color: "hsl(var(--muted-foreground))" }, grid: { drawOnChartArea: false } },
        },
      },
    });
    return () => chart.destroy();
  }, [data, speaker]);
  return <canvas ref={canvasRef} />;
}

const SUMMARY = `CuraLive delivered a strong Q4 2025, with revenue of $47.2 million representing 28% year-over-year growth. CEO James Mitchell highlighted the accelerating adoption of the CuraLive intelligence platform, which drove a 40% improvement in engagement metrics across the enterprise client base.

CFO Sarah Chen reported gross margin expansion to 72%, driven by AI infrastructure efficiencies. The company ended the quarter with $124 million in cash and equivalents. Full-year 2026 guidance was set at $195–$210 million in revenue with adjusted EBITDA margins of 18–22%.

Key strategic themes: native Zoom RTMS and Microsoft Teams integrations, the Recall.ai partnership enabling rapid multi-platform deployment, and the CuraLive proprietary real-time infrastructure underpinning the live intelligence layer.`;

const TRANSCRIPT = [
  { speaker: "Operator", time: "00:00:05", text: "Good morning and welcome to the CuraLive Q4 2025 Earnings Call. All participants will be in listen-only mode." },
  { speaker: "James Mitchell (CEO)", time: "00:01:12", text: "Thank you, Operator. Good morning everyone. I'm delighted to share that Q4 has been an exceptional quarter for CuraLive." },
  { speaker: "James Mitchell (CEO)", time: "00:02:30", text: "Our AI-powered platform, CuraLive, has seen remarkable adoption across our enterprise client base, with a 40% increase in engagement metrics." },
  { speaker: "Sarah Chen (CFO)", time: "00:04:15", text: "Thank you James. From a financial perspective, Q4 revenue came in at $47.2 million, representing 28% year-over-year growth." },
  { speaker: "Sarah Chen (CFO)", time: "00:05:40", text: "Our gross margins expanded to 72%, driven primarily by the efficiency gains from our new CuraLive intelligence layer." },
  { speaker: "James Mitchell (CEO)", time: "00:07:22", text: "Looking ahead to 2026, we're particularly excited about our Teams and Zoom native integrations, which will open significant new enterprise opportunities." },
  { speaker: "Sarah Chen (CFO)", time: "00:09:05", text: "We're guiding to full-year 2026 revenue of $195 to $210 million, with adjusted EBITDA margins of 18 to 22 percent." },
  { speaker: "Operator", time: "00:10:30", text: "We will now open the line for questions. Please press star one to join the queue." },
  { speaker: "James Mitchell (CEO)", time: "00:12:15", text: "The CuraLive platform represents a fundamental shift in how we deliver value to our clients. We're not just a conferencing provider anymore." },
  { speaker: "Sarah Chen (CFO)", time: "00:14:00", text: "Capital expenditure for the year was $8.3 million, primarily invested in our AI infrastructure and the CuraLive real-time messaging platform." },
  { speaker: "James Mitchell (CEO)", time: "00:16:45", text: "Our partnership with Recall.ai has been transformative. It allows us to deploy the CuraLive intelligence layer on any platform within days, not months." },
  { speaker: "Sarah Chen (CFO)", time: "00:18:20", text: "We ended the quarter with $124 million in cash and equivalents, providing significant runway to execute on our strategic roadmap." },
];

const SENTIMENT_TIMELINE = [
  { time: "0:00", score: 72, label: "Neutral" },
  { time: "2:30", score: 78, label: "Positive" },
  { time: "5:00", score: 82, label: "Positive" },
  { time: "7:30", score: 79, label: "Positive" },
  { time: "10:00", score: 85, label: "Positive" },
  { time: "12:30", score: 81, label: "Positive" },
  { time: "15:00", score: 88, label: "Positive" },
  { time: "17:30", score: 87, label: "Positive" },
];

const speakerColor: Record<string, string> = {
  "Operator": "text-muted-foreground",
  "James Mitchell (CEO)": "text-blue-400",
  "Sarah Chen (CFO)": "text-emerald-400",
};

type AISummary = {
  headline: string;
  keyPoints: string[];
  financialHighlights: string[];
  sentiment: string;
  actionItems: string[];
  executiveSummary: string;
  // IR/Bastion-specific sections
  forwardLookingStatements?: string[];
  regulatoryHighlights?: string[];
  riskFactors?: string[];
};

export default function PostEvent() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "analytics" | "operator" | "webphone" | "pace">("summary");

  // Speaking-Pace Coach state
  const [paceReport, setPaceReport] = useState<null | { speakers: Array<{ speaker: string; wordCount: number; durationSeconds: number; wpm: number; paceLabel: string; pauseScore: number; fillerWordCount: number; fillerWords: string[]; coachingTips: string[]; overallScore: number }>; overallEventPace: string; summary: string }>(null);
  const [paceGenerated, setPaceGenerated] = useState(false);
  const [trendSpeaker, setTrendSpeaker] = useState<string | null>(null);
  const eventSlug = params.id ?? "q4-earnings-2026";

  const savePaceMutation = trpc.ai.savePaceResults.useMutation();

  const { data: paceHistory } = trpc.ai.getPaceHistory.useQuery(
    { speaker: trendSpeaker ?? "", limit: 10 },
    { enabled: !!trendSpeaker }
  );

  const { data: existingEventPace } = trpc.ai.getEventPaceResults.useQuery(
    { eventId: eventSlug },
    { enabled: activeTab === "pace" }
  );

  const analyzePaceMutation = trpc.ai.analyzeSpeakingPace.useMutation({
    onSuccess: (data) => {
      const report = data as typeof paceReport;
      setPaceReport(report);
      setPaceGenerated(true);
      toast.success("Speaking-Pace Coach analysis complete!");
      // Auto-save results to DB for trend tracking
      if (report?.speakers) {
        savePaceMutation.mutate({
          eventId: eventSlug,
          eventTitle: "Q4 2025 Earnings Call",
          speakers: report.speakers.map((sp) => ({
            speaker: sp.speaker,
            wpm: sp.wpm,
            paceLabel: sp.paceLabel,
            pauseScore: sp.pauseScore,
            fillerWordCount: sp.fillerWordCount,
            overallScore: sp.overallScore,
          })),
        });
      }
    },
    onError: () => toast.error("Failed to run pace analysis. Please try again."),
  });

  // Webphone session data for this event
  const eventId = params.id ? parseInt(params.id, 10) : undefined;
  const { data: webphoneData, isLoading: webphoneLoading } = trpc.webphone.getEventSessions.useQuery(
    { conferenceId: isNaN(eventId ?? NaN) ? undefined : eventId, limit: 100 },
    { retry: false }
  );

  // Read OCC export data from sessionStorage (set by OCC Export button)
  const [occData, setOccData] = useState<{ conferenceId: number; subject: string; callId: string; participants: Array<{ name: string | null; company: string | null; role: string; state: string; phone: string | null; connectTime: string | null }>; notes: string; exportedAt: string } | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('occ_export_data');
      if (raw) {
        setOccData(JSON.parse(raw));
        setActiveTab('operator');
      }
    } catch {}
  }, []);
  const [expandedTranscript, setExpandedTranscript] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [showIRPanel, setShowIRPanel] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", company: "", role: "", phoneNumber: "" });
  const [additionalEmails, setAdditionalEmails] = useState("");
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [editContact, setEditContact] = useState({ name: "", email: "", company: "", role: "", phoneNumber: "" });

  // IR Contacts queries
  const { data: irContactsList, refetch: refetchContacts } = trpc.irContacts.list.useQuery();
  const addContactMutation = trpc.irContacts.add.useMutation({
    onSuccess: () => { toast.success("Contact added!"); setNewContact({ name: "", email: "", company: "", role: "", phoneNumber: "" }); refetchContacts(); },
    onError: () => toast.error("Failed to add contact"),
  });
  const updateContactMutation = trpc.irContacts.update.useMutation({
    onSuccess: () => { toast.success("Contact updated!"); setEditingContactId(null); refetchContacts(); },
    onError: () => toast.error("Failed to update contact"),
  });
  const removeContactMutation = trpc.irContacts.remove.useMutation({
    onSuccess: () => { toast.success("Contact removed"); refetchContacts(); },
    onError: () => toast.error("Failed to remove contact"),
  });
  const sendSummaryMutation = trpc.irContacts.sendSummary.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Summary sent to ${data.sentCount} recipient${data.sentCount === 1 ? "" : "s"}!`);
        setShowIRPanel(false);
      } else {
        toast.error(data.error ?? "Failed to send summary");
      }
    },
    onError: () => toast.error("Failed to send summary"),
  });

  const handleSendToIR = () => {
    if (!aiSummary) return;
    const extras = additionalEmails.split(",").map(e => e.trim()).filter(e => e.includes("@"));
    sendSummaryMutation.mutate({
      eventTitle: "Q4 2025 Earnings Call — CuraLive Inc.",
      summary: aiSummary,
      additionalEmails: extras,
    });
  };

  const generateSummary = trpc.events.generateSummary.useMutation({
    onSuccess: (data) => {
      setAiSummary(data.summary as AISummary);
      setSummaryGenerated(true);
      if (!data.success) {
        toast.warning("Using fallback summary — LLM temporarily unavailable");
      } else {
        toast.success("AI Summary generated successfully!");
      }
    },
    onError: () => {
      toast.error("Failed to generate AI summary. Please try again.");
    },
  });

  // Press Release Draft state & mutation
  const [pressReleaseText, setPressReleaseText] = useState<string | null>(null);
  const [showPressRelease, setShowPressRelease] = useState(false);
  const generatePressRelease = trpc.pressRelease.generate.useMutation({
    onSuccess: (data) => {
      setPressReleaseText(data.pressRelease);
      setShowPressRelease(true);
      if (!data.success) {
        toast.warning("Using fallback press release — LLM temporarily unavailable");
      } else {
        toast.success("Press release draft generated!");
      }
    },
    onError: () => toast.error("Failed to generate press release. Please try again."),
  });

  const handleGeneratePressRelease = () => {
    generatePressRelease.mutate({
      eventTitle: "Q4 2025 Earnings Call — CuraLive Inc.",
      companyName: "CuraLive Inc.",
      transcript: TRANSCRIPT.map(t => ({ speaker: t.speaker, text: t.text, timeLabel: t.time })),
      aiSummary: aiSummary ? {
        headline: aiSummary.headline,
        keyPoints: aiSummary.keyPoints,
        financialHighlights: aiSummary.financialHighlights,
        executiveSummary: aiSummary.executiveSummary,
        forwardLookingStatements: aiSummary.forwardLookingStatements,
      } : undefined,
    });
  };

  const handleGenerateSummary = () => {
    generateSummary.mutate({
      eventTitle: "Q4 2025 Earnings Call — CuraLive Inc.",
      transcript: TRANSCRIPT.map(t => ({ speaker: t.speaker, text: t.text, timeLabel: t.time })),
      qaItems: [
        { question: "Can you provide more detail on the CuraLive revenue contribution in Q4?", author: "Goldman Sachs", status: "answered" },
        { question: "What is the timeline for the native Microsoft Teams integration?", author: "JP Morgan", status: "answered" },
        { question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Morgan Stanley", status: "approved" },
      ],
    });
  };

  const handleDownloadPDF = () => {
    const summary = aiSummary;
    if (!summary) return;

    const content = [
      "CuraLive — POST-EVENT EXECUTIVE SUMMARY",
      "=========================================",
      "",
      "Q4 2025 Earnings Call — CuraLive Inc.",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "HEADLINE",
      "--------",
      summary.headline,
      "",
      "KEY POINTS",
      "----------",
      ...summary.keyPoints.map(p => `• ${p}`),
      "",
      "FINANCIAL HIGHLIGHTS",
      "--------------------",
      ...summary.financialHighlights.map(h => `• ${h}`),
      "",
      `OVERALL SENTIMENT: ${summary.sentiment}`,
      "",
      "ACTION ITEMS",
      "------------",
      ...summary.actionItems.map(a => `• ${a}`),
      "",
      "EXECUTIVE SUMMARY",
      "-----------------",
      summary.executiveSummary,
      "",
      "---",
      "Produced by CuraLive — CuraLive Inc.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curalive-summary-q4-2025.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded!");
  };

  const handleDownloadTranscript = () => {
    const lines = TRANSCRIPT.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join("\n\n");
    const content = `CuraLive — FULL TRANSCRIPT\nQ4 2025 Earnings Call — CuraLive Inc.\nGenerated: ${new Date().toLocaleString()}\n\n${'='.repeat(60)}\n\n${lines}\n\n${'='.repeat(60)}\nTranscribed by Whisper AI · Speaker-diarized by Recall.ai\nProduced by CuraLive — CuraLive Inc.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curalive-transcript-q4-2025.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded!");
  };

  const maxSentiment = Math.max(...SENTIMENT_TIMELINE.map((s) => s.score));
  const avgSentiment = Math.round(SENTIMENT_TIMELINE.reduce((a, b) => a + b.score, 0) / SENTIMENT_TIMELINE.length);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Events
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm tracking-tight">Cura<span className="text-primary">Live</span></span>
          <span className="text-muted-foreground text-sm">/ Post-Event Report</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">Q4 2025 Earnings Call</span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Clock, label: "Duration", value: "18:32", sub: "minutes" },
            { icon: Users, label: "Attendees", value: "1,247", sub: "registered" },
            { icon: MessageSquare, label: "Questions", value: "24", sub: "submitted" },
            { icon: Globe, label: "Languages", value: "12", sub: "active" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{label} · {sub}</div>
            </div>
          ))}
        </div>

        {/* Replay Player */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          {/* On-demand video player */}
          <div className="bg-black aspect-video">
            <video
              src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe4NtNDnBO8c.m3u8"
              controls
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>On-demand — available for 90 days</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const watchUrl = `${window.location.origin}/live-video/webcast/q4-2025-earnings-webcast/watch?token=demo`;
                  navigator.clipboard.writeText(watchUrl).then(() => toast.success("Recording link copied to clipboard"));
                }}
                className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors font-semibold"
              >
                <Share2 className="w-3 h-3" /> Share Recording Link
              </button>
              <button onClick={() => toast.info("Video download coming soon")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Download className="w-3 h-3" /> Video (MP4)
              </button>
              <button onClick={() => toast.info("Audio download coming soon")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Download className="w-3 h-3" /> Audio (MP3)
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {[
            { key: "summary", label: "AI Summary", icon: FileText },
            { key: "transcript", label: "Full Transcript", icon: MessageSquare },
            { key: "analytics", label: "Analytics", icon: BarChart3 },
            ...(occData ? [{ key: "operator", label: "Operator Report", icon: Users }] : []),
            { key: "webphone", label: "Webphone Activity", icon: PhoneCall },
            { key: "pace", label: "Speaking-Pace Coach", icon: TrendingUp },
  ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" /> {label}
              {key === 'operator' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">OCC</span>}
            </button>
          ))}
        </div>

        {/* ── AI Summary ── */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* AI Generate Button */}
            {!summaryGenerated && (
              <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Generate AI Executive Summary</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                  CuraLive will analyse the full transcript and Q&A to produce a structured executive summary, financial highlights, and action items — ready for your IR contacts.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generateSummary.isPending}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mx-auto"
                >
                  {generateSummary.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analysing transcript...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate AI Summary</>
                  )}
                </button>
                {generateSummary.isError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-4 justify-center">
                    <AlertCircle className="w-4 h-4" /> Failed to generate. <button onClick={handleGenerateSummary} className="underline">Try again</button>
                  </div>
                )}
              </div>
            )}

            {/* Generated Summary */}
            {summaryGenerated && aiSummary && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold">CuraLive Executive Summary</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">AI Generated</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGenerateSummary} disabled={generateSummary.isPending} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                    <button
                      onClick={() => setShowIRPanel(true)}
                      className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <Send className="w-3 h-3" /> Send to IR Contacts
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Download className="w-3 h-3" /> Download
                    </button>
                    <button
                      onClick={handleGeneratePressRelease}
                      disabled={generatePressRelease.isPending}
                      className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      {generatePressRelease.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Drafting...</> : <><FileText className="w-3 h-3" /> Draft Press Release</>}
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
                  <p className="font-semibold text-sm text-primary">{aiSummary.headline}</p>
                </div>

                {/* Key Points + Financial Highlights */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Points</div>
                    <ul className="space-y-1.5">
                      {aiSummary.keyPoints.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <span className="text-primary mt-0.5">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Financial Highlights</div>
                    <ul className="space-y-1.5">
                      {aiSummary.financialHighlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="mb-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif" }}>{aiSummary.executiveSummary}</p>
                </div>

                {/* Sentiment + Action Items */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-background/60 border border-border rounded-xl p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Overall Sentiment</div>
                    <div className="text-lg font-bold text-emerald-400">{aiSummary.sentiment}</div>
                  </div>
                  <div className="bg-background/60 border border-border rounded-xl p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Action Items</div>
                    <ul className="space-y-1">
                      {aiSummary.actionItems.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* ── IR/Bastion Sections ── */}
                {(aiSummary.forwardLookingStatements?.length || aiSummary.regulatoryHighlights?.length || aiSummary.riskFactors?.length) && (
                  <div className="border-t border-border pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IR Compliance Sections</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">JSE / IFRS</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Forward-Looking Statements */}
                      {aiSummary.forwardLookingStatements && aiSummary.forwardLookingStatements.length > 0 && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Forward-Looking Statements</div>
                          </div>
                          <ul className="space-y-2">
                            {aiSummary.forwardLookingStatements.map((s, i) => (
                              <li key={i} className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <span className="text-blue-400 mr-1">›</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Regulatory Highlights */}
                      {aiSummary.regulatoryHighlights && aiSummary.regulatoryHighlights.length > 0 && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Regulatory Highlights</div>
                          </div>
                          <ul className="space-y-2">
                            {aiSummary.regulatoryHighlights.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <span className="text-emerald-400 mr-1">✓</span>{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {aiSummary.riskFactors && aiSummary.riskFactors.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Risk Factors</div>
                          </div>
                          <ul className="space-y-2">
                            {aiSummary.riskFactors.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <span className="text-amber-400 mr-1">⚠</span>{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-3 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                      AI-generated compliance sections are for reference only. Please review with your legal and IR team before distribution.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Press Release Panel */}
            {showPressRelease && pressReleaseText && (
              <div className="bg-card border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="font-semibold">SENS/RNS Press Release Draft</span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">AI Draft</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(pressReleaseText); toast.success("Copied to clipboard!"); }}
                      className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([pressReleaseText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'press-release-draft.txt'; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                    <button onClick={() => setShowPressRelease(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/90 bg-background/60 border border-border rounded-xl p-5 leading-relaxed max-h-[500px] overflow-y-auto" style={{ fontFamily: "'Courier New', monospace" }}>{pressReleaseText}</pre>
                <p className="text-[10px] text-muted-foreground mt-3 italic" style={{ fontFamily: "'Inter', sans-serif" }}>AI-generated draft for reference only. Review with your legal and IR team before submission to SENS/RNS.</p>
              </div>
            )}

            {/* IR Contacts Panel */}
            {showIRPanel && aiSummary && (
              <div className="bg-card border border-primary/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Send Summary to IR Contacts</span>
                  </div>
                  <button onClick={() => setShowIRPanel(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>

                {/* Contact list */}
                <div className="mb-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Saved IR Contacts ({irContactsList?.length ?? 0})</div>
                  {(!irContactsList || irContactsList.length === 0) ? (
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>No contacts yet. Add contacts below or use the additional emails field.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {irContactsList.map((c) => (
                        <div key={c.id} className="bg-background/60 border border-border rounded-lg px-3 py-2">
                          {editingContactId === c.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-1.5">
                                <input value={editContact.name} onChange={e => setEditContact({...editContact, name: e.target.value})}
                                  placeholder="Full Name *" className="bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary/50" />
                                <input value={editContact.email} onChange={e => setEditContact({...editContact, email: e.target.value})}
                                  placeholder="Email *" type="email" className="bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary/50" />
                                <input value={editContact.company} onChange={e => setEditContact({...editContact, company: e.target.value})}
                                  placeholder="Company" className="bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary/50" />
                                <input value={editContact.role} onChange={e => setEditContact({...editContact, role: e.target.value})}
                                  placeholder="Role" className="bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary/50" />
                                <input value={editContact.phoneNumber} onChange={e => setEditContact({...editContact, phoneNumber: e.target.value})}
                                  placeholder="Phone (for dial-out)" className="col-span-2 bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary/50" />
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => updateContactMutation.mutate({ id: c.id, name: editContact.name, email: editContact.email, company: editContact.company || undefined, role: editContact.role || undefined, phoneNumber: editContact.phoneNumber || undefined })}
                                  disabled={!editContact.name || !editContact.email || updateContactMutation.isPending}
                                  className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded hover:bg-primary/30 transition-colors disabled:opacity-50">
                                  {updateContactMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                                </button>
                                <button onClick={() => setEditingContactId(null)}
                                  className="flex items-center gap-1 text-[10px] bg-secondary border border-border px-2 py-1 rounded hover:bg-card transition-colors">
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  {c.email}{c.company ? ` · ${c.company}` : ""}
                                  {c.phoneNumber && <span className="ml-1 text-emerald-400"><Phone className="w-2.5 h-2.5 inline mr-0.5" />{c.phoneNumber}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setEditingContactId(c.id); setEditContact({ name: c.name, email: c.email, company: c.company ?? "", role: c.role ?? "", phoneNumber: c.phoneNumber ?? "" }); }}
                                  className="text-muted-foreground hover:text-primary transition-colors" title="Edit contact">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => removeContactMutation.mutate({ id: c.id })} className="text-muted-foreground hover:text-red-400 transition-colors" title="Remove contact">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add new contact */}
                <div className="mb-5 bg-background/40 border border-border rounded-xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><UserPlus className="w-3 h-3" /> Add Contact</div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})}
                      placeholder="Full Name *" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                    <input value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}
                      placeholder="Email Address *" type="email" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                    <input value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})}
                      placeholder="Company" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                    <input value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})}
                      placeholder="Role (e.g. Portfolio Manager)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                    <input value={newContact.phoneNumber} onChange={e => setNewContact({...newContact, phoneNumber: e.target.value})}
                      placeholder="Phone (for dial-out, e.g. +27 11 555 0100)" className="col-span-2 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                  </div>
                  <button
                    onClick={() => addContactMutation.mutate({ name: newContact.name, email: newContact.email, company: newContact.company || undefined, role: newContact.role || undefined, phoneNumber: newContact.phoneNumber || undefined })}
                    disabled={!newContact.name || !newContact.email || addContactMutation.isPending}
                    className="flex items-center gap-1.5 text-xs bg-secondary border border-border px-3 py-1.5 rounded-lg hover:bg-card transition-colors disabled:opacity-50"
                  >
                    {addContactMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Add Contact
                  </button>
                </div>

                {/* Additional one-off emails */}
                <div className="mb-5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Additional Recipients (comma-separated)</label>
                  <input value={additionalEmails} onChange={e => setAdditionalEmails(e.target.value)}
                    placeholder="ceo@example.com, ir@example.com"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50" style={{ fontFamily: "'Inter', sans-serif" }} />
                </div>

                <button
                  onClick={handleSendToIR}
                  disabled={sendSummaryMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sendSummaryMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Summary Now</>}
                </button>
              </div>
            )}

            {/* Static fallback cards always shown */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-3">Key Topics Detected</div>
                <div className="flex flex-wrap gap-2">
                  {["Q4 Revenue", "AI Strategy", "CuraLive", "Gross Margin", "Teams Integration", "2026 Guidance", "Recall.ai", "EBITDA", "Cash Position", "Investor Day"].map((tag) => (
                    <span key={tag} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-3">Key Metrics Mentioned</div>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[
                    ["Q4 Revenue", "$47.2M", <TrendingUp className="w-3 h-3 text-emerald-400" />],
                    ["YoY Growth", "28%", <TrendingUp className="w-3 h-3 text-emerald-400" />],
                    ["Gross Margin", "72%", <TrendingUp className="w-3 h-3 text-emerald-400" />],
                    ["2026 Revenue Guide", "$195–210M", <Minus className="w-3 h-3 text-amber-400" />],
                    ["Cash & Equivalents", "$124M", <TrendingUp className="w-3 h-3 text-emerald-400" />],
                  ].map(([label, value, icon]) => (
                    <div key={label as string} className="flex items-center justify-between border-b border-border pb-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="font-semibold">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Transcript ── */}
        {activeTab === "transcript" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Auto-transcribed by Whisper AI · Speaker-diarized by Recall.ai</p>
              <button onClick={handleDownloadTranscript} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Download className="w-3 h-3" /> Download TXT
              </button>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              {(expandedTranscript ? TRANSCRIPT : TRANSCRIPT.slice(0, 6)).map((line, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5 w-14">{line.time}</span>
                  <div>
                    <div className={`text-xs font-bold mb-1 ${speakerColor[line.speaker] ?? "text-muted-foreground"}`}>{line.speaker}</div>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{line.text}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => setExpandedTranscript((e) => !e)} className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border">
                {expandedTranscript ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show full transcript ({TRANSCRIPT.length} segments)</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Sentiment Timeline */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="font-semibold mb-4">Sentiment Timeline</div>
              <div className="flex items-end gap-2 h-32">
                {SENTIMENT_TIMELINE.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${(s.score / 100) * 120}px`,
                        backgroundColor: s.score >= 80 ? "rgb(16 185 129 / 0.7)" : s.score >= 70 ? "rgb(245 158 11 / 0.7)" : "rgb(239 68 68 / 0.7)",
                      }}
                    />
                    <span className="text-[9px] text-muted-foreground">{s.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div><span className="text-muted-foreground">Average: </span><span className="font-bold text-emerald-400">{avgSentiment}</span></div>
                <div><span className="text-muted-foreground">Peak: </span><span className="font-bold text-emerald-400">{maxSentiment}</span></div>
                <div><span className="text-muted-foreground">Overall: </span><span className="font-bold text-emerald-400">Positive</span></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Speaker Time */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-4">Speaker Time Distribution</div>
                {[
                  { name: "James Mitchell (CEO)", pct: 52, color: "bg-blue-400" },
                  { name: "Sarah Chen (CFO)", pct: 35, color: "bg-emerald-400" },
                  { name: "Operator", pct: 13, color: "bg-muted-foreground" },
                ].map((s) => (
                  <div key={s.name} className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{s.pct}%</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Audience Stats */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-4">Audience Engagement</div>
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[
                    ["Peak Concurrent", "1,247"],
                    ["Avg. Watch Time", "14m 22s"],
                    ["Q&A Submitted", "24"],
                    ["Q&A Answered", "8"],
                    ["Dial-In Callers", "43"],
                    ["Languages Used", "12"],
                    ["Avg. Sentiment", `${avgSentiment} / 100`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border pb-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="font-semibold text-sm mb-3">Partner Webhook Events Delivered</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {[
                  { event: "transcript.segment", count: "372" },
                  { event: "sentiment.update", count: "36" },
                  { event: "qa.question_submitted", count: "24" },
                  { event: "event.started", count: "1" },
                  { event: "event.ended", count: "1" },
                  { event: "event.summary_ready", count: "1" },
                ].map(({ event, count }) => (
                  <div key={event} className="bg-background/60 border border-border rounded-lg p-3">
                    <div className="font-mono text-xs text-muted-foreground mb-1">{event}</div>
                    <div className="text-xl font-bold text-primary">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Operator Report (from OCC Export) ── */}
        {activeTab === "operator" && occData && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-card border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold">{occData.subject}</div>
                    <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Call ID: {occData.callId} · Exported: {new Date(occData.exportedAt).toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const lines = [
                      `CuraLive — OPERATOR REPORT`,
                      `Conference: ${occData.subject} (${occData.callId})`,
                      `Exported: ${new Date(occData.exportedAt).toLocaleString()}`,
                      ``,
                      `PARTICIPANTS (${occData.participants.length})`,
                      `${'='.repeat(60)}`,
                      ...occData.participants.map((p, i) => `${i + 1}. ${p.name ?? 'Unknown'} | ${p.company ?? '—'} | ${p.role.toUpperCase()} | ${p.state} | ${p.phone ?? '—'} | Joined: ${p.connectTime ?? '—'}`),
                      ``,
                      `OPERATOR NOTES`,
                      `${'='.repeat(60)}`,
                      occData.notes || '(no notes)',
                    ].join('\n');
                    const blob = new Blob([lines], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `occ-report-${occData.callId}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Operator report downloaded!');
                  }}
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Download className="w-3 h-3" /> Download TXT
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{occData.participants.length}</div>
                  <div className="text-xs text-muted-foreground">Total Participants</div>
                </div>
                <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{occData.participants.filter(p => p.role === 'moderator').length}</div>
                  <div className="text-xs text-muted-foreground">Moderators</div>
                </div>
                <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{occData.participants.filter(p => p.role === 'participant').length}</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
              </div>
            </div>

            {/* Participant table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Full Participant List
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background/60 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">#</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Company</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Role</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">State</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Phone</th>
                      <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occData.participants.map((p, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium">{p.name ?? <span className="text-muted-foreground italic">Unknown</span>}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.company ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            p.role === 'moderator' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{p.role}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            p.state === 'speaking' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.state === 'muted' ? 'bg-slate-600/40 text-slate-400' :
                            p.state === 'connected' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{p.state}</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{p.phone ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.connectTime ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operator Notes */}
            {occData.notes && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Operator Notes
                </div>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{occData.notes}</pre>
              </div>
            )}
          </div>
        )}

        {/* ── Speaking-Pace Coach ── */}
        {activeTab === "pace" && (
          <div className="space-y-6">
            {!paceGenerated ? (
              <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Speaking-Pace Coach</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                  CuraLive analyses each speaker’s words-per-minute, filler word usage, and pause patterns — then provides personalised coaching tips for investor communications.
                </p>
                <button
                  onClick={() => analyzePaceMutation.mutate({ transcript: TRANSCRIPT.map(t => ({ speaker: t.speaker, text: t.text, timeLabel: t.time })) })}
                  disabled={analyzePaceMutation.isPending}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mx-auto"
                >
                  {analyzePaceMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</> : <><TrendingUp className="w-4 h-4" /> Run Pace Analysis</>}
                </button>
              </div>
            ) : paceReport ? (
              <>
                {/* Summary banner */}
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{paceReport.overallEventPace}</div>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{paceReport.summary}</p>
                  </div>
                  <button
                    onClick={() => { setPaceGenerated(false); setPaceReport(null); }}
                    className="ml-auto flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-run
                  </button>
                </div>

                {/* Trend Chart — WPM over past events */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-sm">WPM Trend — Across Events</div>
                      <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Select a speaker to view their pace history</div>
                    </div>
                    <div className="flex gap-2">
                      {paceReport.speakers.map((sp) => (
                        <button
                          key={sp.speaker}
                          onClick={() => setTrendSpeaker(trendSpeaker === sp.speaker ? null : sp.speaker)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                            trendSpeaker === sp.speaker
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {sp.speaker.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {trendSpeaker && paceHistory && paceHistory.length > 0 ? (
                    <div style={{ height: 200 }}>
                      <PaceTrendChart data={paceHistory} speaker={trendSpeaker} />
                    </div>
                  ) : trendSpeaker && paceHistory && paceHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No historical data yet for {trendSpeaker}. Run analysis on more events to build the trend.
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Select a speaker above to view their WPM trend across past events.
                    </div>
                  )}
                </div>

                {/* Per-speaker cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {paceReport.speakers.map((sp) => {
                    const paceColor = sp.paceLabel === "Optimal" ? "text-emerald-400" : sp.paceLabel === "Too Fast" ? "text-amber-400" : "text-blue-400";
                    const paceBg = sp.paceLabel === "Optimal" ? "bg-emerald-500/10 border-emerald-500/20" : sp.paceLabel === "Too Fast" ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20";
                    const scoreColor = sp.overallScore >= 75 ? "text-emerald-400" : sp.overallScore >= 50 ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={sp.speaker} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        {/* Speaker header */}
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-sm">{sp.speaker}</div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${paceBg} ${paceColor}`}>{sp.paceLabel}</span>
                            <span className={`text-lg font-bold ${scoreColor}`}>{sp.overallScore}<span className="text-xs text-muted-foreground">/100</span></span>
                          </div>
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "WPM", value: sp.wpm, color: paceColor },
                            { label: "Pause Score", value: `${sp.pauseScore}/100`, color: "text-foreground" },
                            { label: "Filler Words", value: sp.fillerWordCount, color: sp.fillerWordCount > 3 ? "text-amber-400" : "text-emerald-400" },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-background/60 border border-border rounded-lg p-2.5 text-center">
                              <div className={`text-lg font-bold ${color}`}>{value}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Filler words detected */}
                        {sp.fillerWords.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1.5">Detected filler words:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {sp.fillerWords.map((fw) => (
                                <span key={fw} className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{fw}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Coaching tips */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coaching Tips</div>
                          <ul className="space-y-1.5">
                            {sp.coachingTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-muted-foreground leading-relaxed">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Webphone Activity ── */}
        {activeTab === "webphone" && (
          <div className="space-y-6">
            {webphoneLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading call activity...</span>
              </div>
            ) : !webphoneData || (typeof webphoneData === 'object' && 'sessions' in webphoneData && webphoneData.sessions.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <PhoneCall className="w-10 h-10 opacity-30" />
                <p className="text-sm">No webphone calls recorded for this event.</p>
                <p className="text-xs opacity-60">Calls made via the Webphone panel during the event will appear here.</p>
              </div>
            ) : (() => {
              const data = webphoneData as { sessions: Array<{ id: number; carrier: string; direction: string; status: string; remoteNumber: string | null; startedAt: number | null; durationSecs: number | null }>; stats: { totalCalls: number; completedCalls: number; failedCalls: number; totalMinutes: number; twilioCount: number; telnyxCount: number; failoverEvents: number } };
              const { sessions, stats } = data;
              return (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Calls", value: stats.totalCalls, icon: PhoneCall, color: "text-primary" },
                      { label: "Total Minutes", value: `${stats.totalMinutes}m`, icon: Clock, color: "text-blue-400" },
                      { label: "Completed", value: stats.completedCalls, icon: CheckCircle, color: "text-emerald-400" },
                      { label: "Failed / No Answer", value: stats.failedCalls, icon: PhoneMissed, color: "text-red-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Carrier breakdown */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-primary" /> Carrier Breakdown
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Twilio (Primary)</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.twilioCount}</div>
                        <div className="text-xs text-muted-foreground mt-1">calls via Twilio WebRTC</div>
                      </div>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                        <div className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Telnyx (Fallback)</div>
                        <div className="text-2xl font-bold text-violet-400">{stats.telnyxCount}</div>
                        <div className="text-xs text-muted-foreground mt-1">calls via Telnyx PSTN</div>
                      </div>
                      <div className={`${stats.failoverEvents > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl p-4`}>
                        <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${stats.failoverEvents > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>Failover Events</div>
                        <div className={`text-2xl font-bold ${stats.failoverEvents > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{stats.failoverEvents}</div>
                        <div className="text-xs text-muted-foreground mt-1">{stats.failoverEvents === 0 ? 'No failovers — primary carrier stable' : 'Telnyx activated as backup'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Per-call log */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Call Log
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Time</th>
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Direction</th>
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Number</th>
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Carrier</th>
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Duration</th>
                            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((s) => {
                            const startTime = s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                            const duration = s.durationSecs != null ? `${Math.floor(s.durationSecs / 60)}m ${s.durationSecs % 60}s` : '—';
                            const DirIcon = s.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing;
                            const statusColor = s.status === 'completed' ? 'text-emerald-400' : s.status === 'initiated' ? 'text-blue-400' : 'text-red-400';
                            const carrierColor = s.carrier === 'twilio' ? 'text-blue-400' : 'text-violet-400';
                            return (
                              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{startTime}</td>
                                <td className="py-2.5 px-3">
                                  <span className="flex items-center gap-1.5 text-xs">
                                    <DirIcon className={`w-3.5 h-3.5 ${s.direction === 'inbound' ? 'text-emerald-400' : 'text-blue-400'}`} />
                                    {s.direction}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-xs">{s.remoteNumber ?? '—'}</td>
                                <td className={`py-2.5 px-3 text-xs font-semibold ${carrierColor}`}>{s.carrier}</td>
                                <td className="py-2.5 px-3 text-xs text-muted-foreground">{duration}</td>
                                <td className={`py-2.5 px-3 text-xs font-semibold ${statusColor}`}>{s.status}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
