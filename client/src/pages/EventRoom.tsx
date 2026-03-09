import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Users, Clock, Settings,
  ChevronUp, Send, Globe, BarChart3, MessageSquare,
  FileText, Radio, Mic, Hand, MicOff, Share2, Check,
  Subtitles, TrendingUp, Tag, Sparkles, AlertTriangle,
  ChevronDown
} from "lucide-react";
import { AblyProvider, useAbly, type QAItem, type RaisedHand } from "@/contexts/AblyContext";
import { trpc } from "@/lib/trpc";
import MuxPlayer from "@mux/mux-player-react";

// ─── Event Metadata ───────────────────────────────────────────────────────────

const EVENT_META: Record<string, { title: string; company: string; platform: string }> = {
  "q4-earnings-2026": { title: "Q4 2025 Earnings Call", company: "CuraLive Inc.", platform: "Zoom" },
  "investor-day-2026": { title: "Annual Investor Day", company: "CuraLive Inc.", platform: "Microsoft Teams" },
  "board-briefing": { title: "Board Strategy Briefing", company: "CuraLive Inc.", platform: "Webex" },
};

// ─── Language configuration (Africa · Mauritius · UAE — 12 languages) ──────────

const LANGUAGES = [
  { code: "en",  label: "English",     nativeLabel: "English",         flag: "🌍", region: "Pan-Africa · UAE" },
  { code: "fr",  label: "French",      nativeLabel: "Français",         flag: "🌍", region: "West & Central Africa · Mauritius" },
  { code: "ar",  label: "Arabic",      nativeLabel: "العربية",          flag: "🇦🇪", region: "North Africa · UAE", rtl: true },
  { code: "pt",  label: "Portuguese",  nativeLabel: "Português",        flag: "🌍", region: "Angola · Mozambique" },
  { code: "sw",  label: "Swahili",     nativeLabel: "Kiswahili",        flag: "🌍", region: "East Africa" },
  { code: "zu",  label: "Zulu",        nativeLabel: "isiZulu",          flag: "🇿🇦", region: "South Africa" },
  { code: "af",  label: "Afrikaans",   nativeLabel: "Afrikaans",        flag: "🇿🇦", region: "South Africa · Namibia" },
  { code: "ha",  label: "Hausa",       nativeLabel: "Hausa",            flag: "🌍", region: "Nigeria · West Africa" },
  { code: "am",  label: "Amharic",     nativeLabel: "አማርኛ",            flag: "🇪🇹", region: "Ethiopia" },
  { code: "zh",  label: "Mandarin",    nativeLabel: "中文",             flag: "🇨🇳", region: "China · Pan-Africa" },
  { code: "hi",  label: "Hindi",       nativeLabel: "हिन्दी",          flag: "🇮🇳", region: "Mauritius · South Africa · UAE" },
  { code: "mfe", label: "Creole",      nativeLabel: "Kreol Morisyen",   flag: "🇲🇺", region: "Mauritius" },
];

const POLL_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

// ─── Q&A category tags ────────────────────────────────────────────────────────

type QACategory = "Financial" | "Strategy" | "Technology" | "Regulatory" | "Guidance" | "Other";

const QA_CATEGORY_COLORS: Record<QACategory, string> = {
  Financial: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Strategy: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  Technology: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  Regulatory: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Guidance: "text-primary bg-primary/10 border-primary/30",
  Other: "text-muted-foreground bg-secondary border-border",
};

function categoriseQuestion(question: string): QACategory {
  const q = question.toLowerCase();
  if (/revenue|margin|ebitda|cash|capex|cost|profit|earnings|financial|dividend/.test(q)) return "Financial";
  if (/guidance|forecast|outlook|2026|target|expect/.test(q)) return "Guidance";
  if (/regulat|compliance|jse|sec|audit|governance/.test(q)) return "Regulatory";
  if (/ai|tech|platform|integrat|recall|zoom|teams|ably|software/.test(q)) return "Technology";
  if (/strateg|partner|acqui|expand|market|competi/.test(q)) return "Strategy";
  return "Other";
}

function aiPriorityScore(q: QAItem): number {
  // Weighted score: votes (50%) + recency (20%) + category weight (30%)
  const voteScore = Math.min(q.votes / 50, 1) * 50;
  const ageMs = Date.now() - q.submittedAt;
  const recencyScore = Math.max(0, 1 - ageMs / 300000) * 20; // 5 min window
  const cat = categoriseQuestion(q.question);
  const catWeight: Record<QACategory, number> = { Financial: 30, Guidance: 28, Regulatory: 25, Strategy: 20, Technology: 15, Other: 10 };
  return voteScore + recencyScore + catWeight[cat];
}

// ─── Static demo translations (fallback while AI translation loads) ────────────

const TRANSLATIONS: Record<string, Record<string, string>> = {
  "seg-0": {
    fr:  "Bonjour et bienvenue à l'appel de résultats du T4 2025 de CuraLive. Tous les participants seront en mode écoute.",
    ar:  "صباح الخير ومرحباً بكم في مكالمة نتائج الربع الرابع 2025 لـ CuraLive. سيكون جميع المشاركين في وضع الاستماع.",
    pt:  "Bom dia e bem-vindos à chamada de resultados do Q4 2025 da CuraLive. Todos os participantes estarão no modo de escuta.",
    sw:  "Habari za asubuhi na karibu kwenye simu ya matokeo ya Q4 2025 ya CuraLive. Washiriki wote watakuwa katika hali ya kusikiliza.",
    zu:  "Sawubona futhi wamukelekile ku-CuraLive Q4 2025 Earnings Call. Bonke abahlanganyeli bazoba ngezindlebe kuphela.",
    af:  "Goeie môre en welkom by die CuraLive K4 2025 Verdiensteoproep. Alle deelnemers sal in luister-modus wees.",
    ha:  "Barka da safiya kuma maraba da ku zuwa kiran sakamakon Q4 2025 na CuraLive. Dukkan mahalarta za su kasance a yanayin sauraro.",
    am:  "እንኳን ደህና መጡ ወደ CuraLive Q4 2025 የገቢ ጥሪ። ሁሉም ተሳታፊዎች በማዳመጥ ሁነታ ይሆናሉ።",
    zh:  "早上好，欢迎参加CuraLive 2025年第四季度业绩电话会议。所有参与者将处于收听模式。",
    hi:  "सुप्रभात और CuraLive Q4 2025 अर्निंग्स कॉल में आपका स्वागत है। सभी प्रतिभागी सुनने के मोड में होंगे।",
    mfe: "Bonzour ek byenveni dan CuraLive Q4 2025 Earnings Call. Tou bann partisipan pou dan mod lekout.",
  },
  "seg-1": {
    fr:  "Merci, Opérateur. Bonjour à tous. Je suis ravi de partager que le T4 a été un trimestre exceptionnel pour CuraLive.",
    ar:  "شكراً، المشغل. صباح الخير للجميع. يسعدني مشاركة أن الربع الرابع كان ربعاً استثنائياً لـ CuraLive.",
    pt:  "Obrigado, Operador. Bom dia a todos. Estou satisfeito em compartilhar que o Q4 foi um trimestre excepcional para a CuraLive.",
    sw:  "Asante, Opereta. Habari za asubuhi wote. Ninafurahi kushiriki kwamba Q4 ilikuwa robo nzuri sana kwa CuraLive.",
    zu:  "Ngiyabonga, Operator. Sawubona nonke. Ngijabule ukwabelana ukuthi uQ4 ubuyikukhulu isikhathi ku-CuraLive.",
    af:  "Dankie, Operateur. Goeie môre almal. Ek is verheug om te deel dat K4 'n uitsonderlike kwartaal vir CuraLive was.",
    ha:  "Na gode, Mai aiki. Barka da safiya ga kowa. Ina farin ciki don raba cewa Q4 ya kasance kwata mai ban mamaki ga CuraLive.",
    am:  "አመሰግናለሁ፣ ኦፕሬተር። ሁሉም ሰው ሰው እንደምን አደሩ። Q4 ለ CuraLive ልዩ ሩብ ዓመት እንደነበር ለማካፈል ደስ ብሎኛል።",
    zh:  "谢谢，运营商。大家早上好。我很高兴分享第四季度对CuraLive来说是一个出色的季度。",
    hi:  "धन्यवाद, ऑपरेटर। सभी को सुप्रभात। मुझे यह साझा करते हुए खुशी है कि Q4 CuraLive के लिए एक असाधारण तिमाही रही।",
    mfe: "Mersi, Operater. Bonzour tou dimoun. Mo kontan partaze ki Q4 ti enn trimes exepsyonel pou CuraLive.",
  },
};

function getStaticTranslation(seg: { id: string; text: string }, langCode: string): string {
  if (langCode === "en") return seg.text;
  return TRANSLATIONS[seg.id]?.[langCode] ?? seg.text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

import LivePoll from "@/components/LivePoll";
import PollResults from "@/components/PollResults";

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = { "Zoom": "bg-blue-600", "Microsoft Teams": "bg-purple-600", "Webex": "bg-slate-600" };
  return <span className={`text-[10px] font-bold text-white px-2 py-1 rounded ${colors[platform] ?? "bg-slate-600"}`}>{platform}</span>;
}

// Enhanced Sentiment Panel with breakdown bars and trend sparkline
function EnhancedSentimentPanel({ score, history }: { score: number; history: number[] }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Positive" : score >= 50 ? "Neutral" : "Negative";

  // Derive breakdown from score
  const positiveShare = Math.round(score * 0.9);
  const negativeShare = Math.round((100 - score) * 0.7);
  const neutralShare = 100 - positiveShare - negativeShare;

  // Sparkline path
  const sparkW = 160;
  const sparkH = 36;
  const pts = history.slice(-12);
  const min = Math.min(...pts, 0);
  const max = Math.max(...pts, 100);
  const range = max - min || 1;
  const sparkPath = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * sparkW;
    const y = sparkH - ((v - min) / range) * sparkH;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Score ring */}
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>

      {/* Breakdown bars */}
      <div className="w-full space-y-1.5">
        {[
          { label: "Positive", pct: positiveShare, color: "#10b981" },
          { label: "Neutral", pct: Math.max(0, neutralShare), color: "#f59e0b" },
          { label: "Negative", pct: negativeShare, color: "#ef4444" },
        ].map(({ label: l, pct, color: c }) => (
          <div key={l}>
            <div className="flex justify-between text-[9px] mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="text-muted-foreground">{l}</span>
              <span style={{ color: c }} className="font-semibold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c, transition: "width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Trend sparkline */}
      {pts.length > 1 && (
        <div className="w-full">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Trend</span>
          </div>
          <svg width={sparkW} height={sparkH} className="w-full" viewBox={`0 0 ${sparkW} ${sparkH}`}>
            <path d={sparkPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Mux HLS Video Player ────────────────────────────────────────────────

function MuxVideoPlayer({ eventId, platform }: { eventId: string; platform: string }) {
  const { data: streams } = trpc.mux.listStreams.useQuery(
    { eventId: undefined, meetingId: undefined },
    { refetchInterval: 10000 }
  );

  // Find the first active or idle stream
  const activeStream = streams?.find((s) => s.status === "active" || s.status === "idle");

  if (activeStream?.muxPlaybackId) {
    return (
      <div className="absolute inset-0 bg-black">
        <MuxPlayer
          playbackId={activeStream.muxPlaybackId}
          streamType="live"
          autoPlay
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  // Fallback placeholder when no stream is configured
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Live stream via {platform}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Waiting for encoder connection…</p>
      </div>
    </div>
  );
}

// ─── Inner Component (uses AblyContext) ────────────────────────────────────────────────

function EventRoomInner({ eventId }: { eventId: string }) {
  const [, navigate] = useLocation();
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];
  const { transcript, sentiment, qaItems, polls, raisedHands, presenceCount, publish } = useAbly();

  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "polls" | "analytics" | "chat">("transcript");
  const [newQuestion, setNewQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [myHandId] = useState(() => `hand-${Date.now()}`);
  const [unmutedNotice, setUnmutedNotice] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // ── Feature 1: Closed Captions ──────────────────────────────────────────────
  const [ccEnabled, setCcEnabled] = useState(false);
  const [ccFontSize, setCcFontSize] = useState<"sm" | "md" | "lg">("md");
  const [ccPosition, setCcPosition] = useState<"bottom" | "top">("bottom");
  const [ccSettingsOpen, setCcSettingsOpen] = useState(false);
  const latestSegment = transcript[transcript.length - 1];

  // ── Feature 1b: Live Rolling Summary ─────────────────────────────────────────
  const [rollingSummary, setRollingSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryUpdatedAt, setSummaryUpdatedAt] = useState<number | null>(null);
  const lastSummaryTranscriptLen = useRef(0);

  // Regenerate summary every 60s when ≥3 new transcript lines have arrived
  useEffect(() => {
    if (transcript.length < 3) return;
    const newLines = transcript.length - lastSummaryTranscriptLen.current;
    if (newLines < 3 && rollingSummary !== null) return; // not enough new content
    const timer = setTimeout(async () => {
      if (summaryLoading) return;
      setSummaryLoading(true);
      try {
        const recent = transcript.slice(-8);
        const text = recent.map(s => `${s.speaker}: ${s.text}`).join(" ");
        // Client-side rolling summary using a simple heuristic extraction
        // (server-side LLM call would be trpc.events.rollingSummary.mutate)
        const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
        const key = sentences.slice(0, 3).join(" ").trim();
        setRollingSummary(key || text.slice(0, 220) + "…");
        setSummaryUpdatedAt(Date.now());
        lastSummaryTranscriptLen.current = transcript.length;
      } finally {
        setSummaryLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [transcript, summaryLoading, rollingSummary]);

  // ── AI Translation cache: segId → langCode → translated text ────────────────────────
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const translateMutation = trpc.ai.translateSegment.useMutation({
    onSuccess: (data, variables) => {
      const { text, targetLanguage } = variables;
      // Find the segment id by matching text
      const seg = transcript.find((s) => s.text === text);
      if (!seg) return;
      const segId = seg.id;
      if (!targetLanguage) return;
      const lang = targetLanguage as string;
      setTranslationCache((prev) => {
        const updated = { ...prev };
        const existing = prev[segId] ?? {};
        const newEntry: Record<string, string> = {};
        Object.assign(newEntry, existing);
        newEntry[lang] = data.translated;
        updated[segId] = newEntry;
        return updated;
      });
      setTranslatingIds((prev) => { const next = new Set(prev); next.delete(`${seg.id}:${lang}`); return next; });
    },
  });

  // Translate new transcript segments when language changes or new segments arrive
  useEffect(() => {
    if (language === "en") return;
    const untranslated = transcript.filter((seg) => {
      const key = `${seg.id}:${language}`;
      return !translationCache[seg.id]?.[language] && !translatingIds.has(key);
    });
    if (untranslated.length === 0) return;
    // Translate up to 3 segments at a time to avoid flooding
    untranslated.slice(0, 3).forEach((seg) => {
      const key = `${seg.id}:${language}`;
      setTranslatingIds((prev) => { const next = new Set(Array.from(prev)); next.add(key); return next; });
      translateMutation.mutate({ text: seg.text, targetLanguage: language });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, language]);

  const getTranslatedText = (seg: { id: string; text: string }, langCode: string): string => {
    if (langCode === "en") return seg.text;
    // AI cache first, then static demo fallback
    if (translationCache[seg.id]?.[langCode]) return translationCache[seg.id][langCode];
    return getStaticTranslation(seg, langCode);
  };

  // ── Feature 2: Sentiment history for sparkline ──────────────────────────────
  const [sentimentHistory, setSentimentHistory] = useState<number[]>([72]);
  useEffect(() => {
    setSentimentHistory((prev) => [...prev.slice(-24), sentiment.score]);
  }, [sentiment.score]);

  // ── Feature 3: Q&A sort mode ────────────────────────────────────────────────
  const [qaSortMode, setQaSortMode] = useState<"ai" | "votes" | "recent">("ai");
  const [qaFilter, setQaFilter] = useState<QACategory | "All">("All");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<string | null>(null);

  // Detect potential duplicates when user types
  useEffect(() => {
    if (newQuestion.trim().length < 20) { setShowDuplicateWarning(null); return; }
    const words = newQuestion.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const similar = qaItems.find((q) => {
      if (q.status === "rejected") return false;
      const qWords = q.question.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const overlap = words.filter((w) => qWords.includes(w)).length;
      return overlap >= 3;
    });
    setShowDuplicateWarning(similar ? similar.question : null);
  }, [newQuestion, qaItems]);

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleVote = useCallback((id: string, currentVotes: number) => {
    publish({ type: "qa.vote", data: { id, votes: currentVotes + 1 } });
  }, [publish]);

  const handleSubmitQuestion = useCallback(() => {
    if (!newQuestion.trim()) return;
    const newItem: QAItem = {
      id: `qa-${Date.now()}`,
      question: newQuestion.trim(),
      author: "You",
      votes: 1,
      status: "pending",
      submittedAt: Date.now(),
    };
    publish({ type: "qa.submitted", data: newItem });
    setNewQuestion("");
    setShowDuplicateWarning(null);
  }, [newQuestion, publish]);

  const handlePollVote = useCallback((pollId: string, optionId: string) => {
    publish({ type: "poll.vote", data: { pollId, optionId } });
  }, [publish]);

  const handleRaiseHand = useCallback(() => {
    if (handRaised) {
      publish({ type: "hand.lower", data: { id: myHandId } });
      setHandRaised(false);
      setUnmutedNotice(false);
    } else {
      const hand: RaisedHand = { id: myHandId, name: "You (Attendee)", raisedAt: Date.now(), status: "waiting" };
      publish({ type: "hand.raise", data: hand });
      setHandRaised(true);
    }
  }, [handRaised, myHandId, publish]);

  const handleShareLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/register/${eventId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [eventId]);

  // Watch for unmute signal from moderator
  useEffect(() => {
    const myHand = raisedHands.find((h) => h.id === myHandId);
    if (myHand?.status === "unmuted") setUnmutedNotice(true);
  }, [raisedHands, myHandId]);

  // Elapsed time
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const speakerColor: Record<string, string> = {
    "Operator": "text-muted-foreground",
    "James Mitchell (CEO)": "text-blue-400",
    "Sarah Chen (CFO)": "text-emerald-400",
    "Dr. Priya Nair (CTO)": "text-violet-400",
    "Board Chair": "text-amber-400",
  };

  // Sorted/filtered Q&A
  const visibleQA = qaItems
    .filter((q) => q.status !== "rejected")
    .filter((q) => qaFilter === "All" || categoriseQuestion(q.question) === qaFilter)
    .sort((a, b) => {
      if (qaSortMode === "ai") return aiPriorityScore(b) - aiPriorityScore(a);
      if (qaSortMode === "votes") return b.votes - a.votes;
      return b.submittedAt - a.submittedAt;
    });

  const livePolls = polls.filter((p) => p.status === "live");

  // Poll overlay state — shows full-screen when a new poll is pushed
  const [activePollOverlay, setActivePollOverlay] = useState<typeof livePolls[0] | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activePollResultsId, setActivePollResultsId] = useState<string | null>(null);
  const prevPollCount = useRef(0);

  // Auto-show overlay when a new live poll arrives
  useEffect(() => {
    if (livePolls.length > prevPollCount.current) {
      const newest = livePolls[livePolls.length - 1];
      if (newest && !votedPolls.has(newest.id)) {
        setActivePollOverlay(newest);
        setSelectedOption(null);
      }
    }
    prevPollCount.current = livePolls.length;
  }, [livePolls, votedPolls]);

  const handlePollOverlayVote = useCallback(() => {
    if (!activePollOverlay || !selectedOption) return;
    publish({ type: "poll.vote", data: { pollId: activePollOverlay.id, optionId: selectedOption } });
    setVotedPolls((prev) => new Set(Array.from(prev).concat(activePollOverlay.id)));
    setActivePollOverlay(null);
  }, [activePollOverlay, selectedOption, publish]);

  const ccFontSizeClass = { sm: "text-sm", md: "text-base", lg: "text-xl" }[ccFontSize];
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  // RTL layout support for Arabic
  const isRTL = language === "ar";

  // ── Chat Translation feature ────────────────────────────────────────────────────────────────────────────────

  // Chat language selector — persisted to localStorage
  const [chatLanguage, setChatLanguageRaw] = useState<string>(() => {
    try { return localStorage.getItem("curalive_chat_lang") ?? "en"; } catch { return "en"; }
  });
  const [chatTranslationEnabled, setChatTranslationEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("curalive_chat_lang") !== null && localStorage.getItem("curalive_chat_lang") !== "en"; } catch { return false; }
  });
  const setChatLanguage = (lang: string) => {
    try { localStorage.setItem("curalive_chat_lang", lang); } catch { /* ignore */ }
    setChatLanguageRaw(lang);
  };
  // messageId → { translatedMessage, detectedLanguage, translationLanguage }
  const [chatTranslations, setChatTranslations] = useState<Record<number, { translatedMessage: string; detectedLanguage: string; translationLanguage: string }>>({});
  const [translatingMsgIds, setTranslatingMsgIds] = useState<Set<number>>(new Set());
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  // Fetch event chat messages (public, no auth required)
  const chatQuery = trpc.occ.getEventChatMessages.useQuery(
    { eventId },
    { refetchInterval: 10000, staleTime: 5000 }
  );
  const chatMessages = chatQuery.data ?? [];

  // Seed translations from DB data on load
  useEffect(() => {
    if (!chatQuery.data) return;
    const seed: Record<number, { translatedMessage: string; detectedLanguage: string; translationLanguage: string }> = {};
    for (const msg of chatQuery.data) {
      if (msg.translatedMessage && msg.detectedLanguage && msg.translationLanguage) {
        seed[msg.id] = {
          translatedMessage: msg.translatedMessage,
          detectedLanguage: msg.detectedLanguage,
          translationLanguage: msg.translationLanguage,
        };
      }
    }
    setChatTranslations(seed);
  }, [chatQuery.data]);

  // On-demand translate mutation
  const translateChatMut = trpc.occ.translateEventChatMessage.useMutation({
    onSuccess: (data, variables) => {
      setChatTranslations((prev) => ({
        ...prev,
        [variables.messageId]: {
          translatedMessage: data.translatedMessage,
          detectedLanguage: data.detectedLanguage,
          translationLanguage: data.translationLanguage,
        },
      }));
      setTranslatingMsgIds((prev) => { const s = new Set(prev); s.delete(variables.messageId); return s; });
    },
    onError: (_err, variables) => {
      setTranslatingMsgIds((prev) => { const s = new Set(prev); s.delete(variables.messageId); return s; });
    },
  });

  const doTranslateChatMsg = useCallback((msgId: number, msgText: string) => {
    if (translatingMsgIds.has(msgId)) return;
    setTranslatingMsgIds((prev) => new Set(prev).add(msgId));
    translateChatMut.mutate({ messageId: msgId, message: msgText, targetLanguage: chatLanguage, eventId });
  }, [translatingMsgIds, translateChatMut, chatLanguage, eventId]);

  // Translate ALL untranslated messages in one batch (sequential, rate-limited)
  const doTranslateAll = useCallback(async () => {
    if (isTranslatingAll || chatLanguage === "en") return;
    const untranslated = chatMessages.filter(
      (m) => !chatTranslations[m.id] || chatTranslations[m.id].translationLanguage !== chatLanguage
    );
    if (untranslated.length === 0) return;
    setIsTranslatingAll(true);
    for (const m of untranslated) {
      if (!translatingMsgIds.has(m.id)) {
        setTranslatingMsgIds((prev) => new Set(prev).add(m.id));
        await new Promise<void>((resolve) => {
          translateChatMut.mutate(
            { messageId: m.id, message: m.message, targetLanguage: chatLanguage, eventId },
            { onSettled: () => resolve() }
          );
        });
      }
    }
    setIsTranslatingAll(false);
  }, [isTranslatingAll, chatLanguage, chatMessages, chatTranslations, translatingMsgIds, translateChatMut, eventId]);

  // Auto-translate all visible messages when language changes and translation is enabled
  useEffect(() => {
    if (!chatTranslationEnabled || chatLanguage === "en") return;
    const untranslated = chatMessages.filter(
      (m) => !chatTranslations[m.id] || chatTranslations[m.id].translationLanguage !== chatLanguage
    );
    untranslated.slice(0, 5).forEach((m) => doTranslateChatMsg(m.id, m.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTranslationEnabled, chatLanguage, chatMessages.length]);

  // ── Browser language auto-detect banner ────────────────────────────────────
  const LANG_BANNER_DISMISSED_KEY = "curalive_chat_lang_banner_dismissed";
  const [showLangBanner, setShowLangBanner] = useState<boolean>(false);
  const [detectedLangCode, setDetectedLangCode] = useState<string | null>(null);

  // Detect browser language once on mount, show banner if:
  //   (a) a supported non-English language is detected
  //   (b) the user hasn't already set a non-English preference
  //   (c) the banner hasn't been permanently dismissed
  useEffect(() => {
    try {
      const alreadyDismissed = localStorage.getItem(LANG_BANNER_DISMISSED_KEY) === "1";
      const alreadySet = localStorage.getItem("curalive_chat_lang");
      if (alreadyDismissed || (alreadySet && alreadySet !== "en")) return;

      const browserLang = (navigator.language ?? "").toLowerCase();
      // Map browser locale to our supported language codes
      const browserToCode: Record<string, string> = {
        fr: "fr", "fr-fr": "fr", "fr-be": "fr", "fr-ca": "fr", "fr-ch": "fr",
        ar: "ar", "ar-ae": "ar", "ar-sa": "ar", "ar-eg": "ar", "ar-ma": "ar",
        pt: "pt", "pt-br": "pt", "pt-pt": "pt", "pt-ao": "pt", "pt-mz": "pt",
        sw: "sw", "sw-ke": "sw", "sw-tz": "sw",
        zu: "zu", "zu-za": "zu",
        af: "af", "af-za": "af",
        ha: "ha", "ha-ng": "ha",
        am: "am", "am-et": "am",
        zh: "zh", "zh-cn": "zh", "zh-tw": "zh", "zh-hk": "zh",
        hi: "hi", "hi-in": "hi",
        mfe: "mfe",
      };
      const matched = browserToCode[browserLang] ?? browserToCode[browserLang.split("-")[0]];
      if (matched && matched !== "en") {
        setDetectedLangCode(matched);
        setShowLangBanner(true);
      }
    } catch { /* localStorage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLangBannerAccept = () => {
    if (!detectedLangCode) return;
    setChatLanguage(detectedLangCode);
    setChatTranslationEnabled(true);
    setShowLangBanner(false);
    try { localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1"); } catch { /* ignore */ }
  };

  const handleLangBannerDismiss = () => {
    setShowLangBanner(false);
    try { localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1"); } catch { /* ignore */ }
  };

  // Listen for Ably chat:translation events from the event channel (real-time push)
  const { chatTranslationEvents } = useAbly();
  useEffect(() => {
    if (!chatTranslationEvents || chatTranslationEvents.length === 0) return;
    const latest = chatTranslationEvents[chatTranslationEvents.length - 1];
    if (!latest) return;
    setChatTranslations((prev) => ({
      ...prev,
      [latest.messageId]: {
        translatedMessage: latest.translatedMessage,
        detectedLanguage: latest.detectedLanguage,
        translationLanguage: latest.translationLanguage,
      },
    }));
    setTranslatingMsgIds((prev) => { const s = new Set(prev); s.delete(latest.messageId); return s; });
  }, [chatTranslationEvents]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Full-Screen Poll Overlay ── */}
      {activePollOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">Live Poll</div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>From the Moderator</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                <span className="live-badge-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Live
              </div>
            </div>
            <p className="text-lg font-semibold mb-6 leading-snug">{activePollOverlay.question}</p>
            <div className="space-y-3 mb-6">
              {activePollOverlay.options.map((opt, i) => (
                <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedOption === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:bg-primary/5"}`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedOption === opt.id ? "border-primary" : "border-muted-foreground"}`}>
                    {selectedOption === opt.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{opt.label}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: POLL_COLORS[i % POLL_COLORS.length] }}>{String.fromCharCode(65 + i)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActivePollOverlay(null)} className="flex-1 border border-border text-muted-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors">Skip</button>
              <button onClick={handlePollOverlayVote} disabled={!selectedOption} className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">Submit Vote</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur-md px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Events</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <span className="font-bold text-white text-sm tracking-tight hidden sm:block">Cura<span className="text-primary">Live</span></span>
        <div className="w-px h-5 bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{meta.title}</h1>
          <p className="text-[10px] text-muted-foreground truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{meta.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            <span className="live-badge-dot inline-block w-1.5 h-1.5 rounded-full bg-red-400" /> Live
          </div>
          <PlatformBadge platform={meta.platform} />
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{presenceCount.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-2">
          <button onClick={() => navigate(`/moderator/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Radio className="w-3 h-3" /> Mod
          </button>
          <button onClick={() => navigate(`/presenter/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Mic className="w-3 h-3" /> Presenter
          </button>
          <button onClick={() => navigate(`/operator/${eventId}`)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-3 h-3" /> Operator
          </button>
          <button onClick={handleShareLink}
            className={`flex items-center gap-1 text-xs font-semibold border px-2.5 py-1.5 rounded-lg transition-all ${shareCopied ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"}`}>
            {shareCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {shareCopied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player + Tabs (left) */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Video Player ── */}
          <div className="shrink-0 bg-black/80 relative" style={{ aspectRatio: "16/9", maxHeight: "45vh" }}>
            <MuxVideoPlayer eventId={eventId} platform={meta.platform} />

            {/* ── Feature 1: Closed Captions Overlay ── */}
            {ccEnabled && latestSegment && (
              <div className={`absolute left-0 right-0 px-4 py-2 flex justify-center ${ccPosition === "bottom" ? "bottom-10" : "top-10"}`}>
                <div className={`bg-black/85 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-[90%] text-center leading-snug font-medium ${ccFontSizeClass}`}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={{ fontFamily: isRTL ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                  <span className="text-primary/80 text-[10px] font-bold uppercase tracking-widest block mb-0.5">
                    {latestSegment.speaker}
                  </span>
                  {getTranslatedText(latestSegment, language)}
                  {translatingIds.has(`${latestSegment.id}:${language}`) && (
                    <span className="ml-1 text-[9px] text-primary/60 animate-pulse">translating…</span>
                  )}
                </div>
              </div>
            )}

            {/* CC toggle button */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <button
                onClick={() => setCcEnabled((v) => !v)}
                title="Toggle Closed Captions"
                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border transition-all ${ccEnabled ? "bg-primary/20 border-primary/50 text-primary" : "bg-black/50 border-white/20 text-white/70 hover:bg-white/10"}`}>
                <Subtitles className="w-3.5 h-3.5" />
                CC
              </button>
              {ccEnabled && (
                <button
                  onClick={() => setCcSettingsOpen((v) => !v)}
                  className="flex items-center gap-1 text-[10px] font-semibold bg-black/60 border border-white/20 text-white/70 px-2 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* CC Settings dropdown */}
            {ccEnabled && ccSettingsOpen && (
              <div className="absolute top-12 left-3 bg-card border border-border rounded-xl p-3 shadow-xl z-20 min-w-[180px]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">CC Settings</div>
                <div className="mb-2">
                  <div className="text-[10px] text-muted-foreground mb-1">Font Size</div>
                  <div className="flex gap-1">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <button key={s} onClick={() => setCcFontSize(s)}
                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${ccFontSize === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Position</div>
                  <div className="flex gap-1">
                    {(["bottom", "top"] as const).map((p) => (
                      <button key={p} onClick={() => setCcPosition(p)}
                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors capitalize ${ccPosition === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/30">
                <span className="live-badge-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Live
              </div>
              <PlatformBadge platform={meta.platform} />
            </div>
            <div className="absolute bottom-3 right-3 text-xs font-mono text-white/60 bg-black/50 px-2 py-1 rounded">
              {formatTime(elapsedSeconds)}
            </div>
            <button onClick={handleRaiseHand}
              className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${handRaised ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-black/50 border-white/20 text-white/70 hover:bg-white/10"}`}>
              <Hand className="w-3.5 h-3.5" />
              {handRaised ? "Hand Raised" : "Raise Hand"}
            </button>
          </div>

          {/* Unmuted by moderator banner */}
          {unmutedNotice && (
            <div className="shrink-0 bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">You have been unmuted by the moderator</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>You may now speak verbally on the call.</span>
              </div>
              <button onClick={() => { setUnmutedNotice(false); handleRaiseHand(); }} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-secondary transition-colors">
                <MicOff className="w-3 h-3" /> Lower Hand
              </button>
            </div>
          )}

          {/* Live Poll Banner */}
          {livePolls.length > 0 && (
            <div className="shrink-0 border-b border-border bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Live Poll</span>
                <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Active</span>
              </div>
              {livePolls.slice(0, 1).map((poll) => {
                const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                return (
                  <div key={poll.id}>
                    <p className="text-sm mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{poll.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {poll.options.map((opt, i) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        return (
                          <button key={opt.id} onClick={() => handlePollVote(poll.id, opt.id)}
                            className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span style={{ color: POLL_COLORS[i % POLL_COLORS.length] }}>●</span>
                            {opt.label}
                            {totalVotes > 0 && <span className="text-muted-foreground">({pct}%)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-border overflow-x-auto">
            {[
              { key: "transcript", label: "Transcript", icon: FileText },
              { key: "qa", label: `Q&A (${visibleQA.length})`, icon: MessageSquare },
              { key: "chat", label: `Chat${chatMessages.length > 0 ? ` (${chatMessages.length})` : ""}`, icon: Globe },
              { key: "polls", label: `Polls${livePolls.length > 0 ? ` (${livePolls.length})` : ""}`, icon: BarChart3 },
              { key: "analytics", label: "Analytics", icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* ── Transcript Tab ── */}
            {activeTab === "transcript" && (
              <>
                {/* Feature 5: Language selector toolbar */}
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer pr-4 appearance-none"
                        data-testid="language-selector">
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                        ))}
                      </select>
                    </div>
                    {language !== "en" && (
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        AI Translated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* CC quick-toggle in transcript toolbar */}
                    <button
                      onClick={() => setCcEnabled((v) => !v)}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${ccEnabled ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                      <Subtitles className="w-3 h-3" /> CC {ccEnabled ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => setAutoScroll((v) => !v)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${autoScroll ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                      {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                    </button>
                  </div>
                </div>

                {/* Language info bar */}
                {language !== "en" && (
                  <div className="shrink-0 bg-primary/5 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Transcript translated to {currentLang.label} in real-time by CuraLive · Powered by OpenAI
                    </span>
                  </div>
                )}

                {/* ── Feature #1: Live Rolling Summary banner ── */}
                {(rollingSummary || summaryLoading) && (
                  <div className="shrink-0 mx-4 mt-3 mb-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Rolling Summary</span>
                      {summaryLoading && <span className="ml-auto text-[9px] text-muted-foreground animate-pulse">Updating…</span>}
                      {summaryUpdatedAt && !summaryLoading && (
                        <span className="ml-auto text-[9px] text-muted-foreground">
                          Updated {Math.round((Date.now() - summaryUpdatedAt) / 1000)}s ago
                        </span>
                      )}
                    </div>
                    {summaryLoading && !rollingSummary ? (
                      <div className="h-4 bg-primary/10 rounded animate-pulse w-3/4" />
                    ) : (
                      <p className="text-xs text-foreground/80 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {rollingSummary}
                      </p>
                    )}
                  </div>
                )}
                <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                      <FileText className="w-8 h-8 mb-2 opacity-30" />
                      Transcription starting…
                    </div>
                  )}
                  {transcript.map((seg, i) => (
                    <div key={seg.id} className="transcript-line-enter" dir={isRTL ? "rtl" : "ltr"}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${speakerColor[seg.speaker] ?? "text-muted-foreground"}`}>
                        {isRTL ? `${seg.timeLabel} · ${seg.speaker}` : `${seg.speaker} · ${seg.timeLabel}`}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ fontFamily: isRTL ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif", opacity: i === transcript.length - 1 ? 1 : 0.75 }}>
                        {getTranslatedText(seg, language)}
                        {translatingIds.has(`${seg.id}:${language}`) && (
                          <span className="ml-1 text-[9px] text-primary/60 animate-pulse">…</span>
                        )}
                      </p>
                    </div>
                  ))}
                  {transcript.length > 0 && (
                    <div className="flex items-center gap-2">
                      {[0, 150, 300].map((d) => (
                        <span key={d} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgb(239 68 68)", display: "inline-block", animation: `bounce 1s ${d}ms infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Q&A Tab ── */}
            {activeTab === "qa" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Feature 3: Q&A toolbar with AI sort + category filter */}
                <div className="shrink-0 border-b border-border px-3 py-2 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort:</span>
                    {(["ai", "votes", "recent"] as const).map((mode) => (
                      <button key={mode} onClick={() => setQaSortMode(mode)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${qaSortMode === mode ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                        {mode === "ai" ? "AI Priority" : mode === "votes" ? "Votes" : "Recent"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <select value={qaFilter} onChange={(e) => setQaFilter(e.target.value as QACategory | "All")}
                      className="bg-transparent text-[10px] text-muted-foreground outline-none cursor-pointer">
                      <option value="All">All Topics</option>
                      {(Object.keys(QA_CATEGORY_COLORS) as QACategory[]).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {visibleQA.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                      No questions yet. Be the first!
                    </div>
                  )}
                  {visibleQA.map((q, idx) => {
                    const cat = categoriseQuestion(q.question);
                    const priority = aiPriorityScore(q);
                    const isTopPick = qaSortMode === "ai" && idx === 0 && priority > 40;
                    return (
                      <div key={q.id} className={`flex gap-3 bg-card border rounded-xl p-3 transition-all ${isTopPick ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                        <button onClick={() => handleVote(q.id, q.votes)} className="flex flex-col items-center gap-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                          <ChevronUp className="w-4 h-4" />
                          <span className="text-xs font-bold">{q.votes}</span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {isTopPick && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                <Sparkles className="w-2.5 h-2.5" /> AI Top Pick
                              </span>
                            )}
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${QA_CATEGORY_COLORS[cat]}`}>
                              {cat}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{q.author}</span>
                            {q.status === "approved" && <span className="text-emerald-400 font-semibold">● Approved</span>}
                            {q.status === "answered" && <span className="text-muted-foreground font-semibold">✓ Answered</span>}
                            {q.status === "pending" && <span className="text-amber-400 font-semibold">○ Pending</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question input with duplicate detection */}
                <div className="shrink-0 border-t border-border p-3 space-y-2">
                  {showDuplicateWarning && (
                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-amber-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span className="font-bold">Similar question exists:</span> "{showDuplicateWarning.slice(0, 60)}…" — consider upvoting it instead.
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
                      placeholder="Ask a question…"
                      data-testid="qa-input"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                      style={{ fontFamily: "'Inter', sans-serif" }} />
                    <button onClick={handleSubmitQuestion} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Chat Tab ── */}
            {activeTab === "chat" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Translation toolbar */}
                <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <select
                    value={chatLanguage}
                    onChange={(e) => { setChatLanguage(e.target.value); if (e.target.value !== "en") setChatTranslationEnabled(true); }}
                    className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer appearance-none pr-4"
                    data-testid="chat-language-selector">
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                  {chatLanguage !== "en" && (
                    <button
                      onClick={() => setChatTranslationEnabled((v) => !v)}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                        chatTranslationEnabled
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}>
                      <Sparkles className="w-3 h-3" />
                      {chatTranslationEnabled ? "Translation ON" : "Translation OFF"}
                    </button>
                  )}
                  {chatLanguage !== "en" && chatTranslationEnabled && (
                    <>
                      {/* Translate-all button */}
                      <button
                        onClick={doTranslateAll}
                        disabled={isTranslatingAll || chatMessages.every((m) => chatTranslations[m.id]?.translationLanguage === chatLanguage)}
                        data-testid="translate-all-btn"
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                          isTranslatingAll
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 opacity-70 cursor-wait"
                            : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5"
                        }`}>
                        {isTranslatingAll ? (
                          <><span className="animate-spin inline-block w-2.5 h-2.5 border border-emerald-400 border-t-transparent rounded-full" /> Translating…</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Translate all</>
                        )}
                      </button>
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ml-auto">
                        AI Translated
                      </span>
                    </>
                  )}
                </div>

                {/* Language info bar */}
                {chatLanguage !== "en" && chatTranslationEnabled && (
                  <div className="shrink-0 bg-emerald-500/5 border-b border-emerald-500/20 px-4 py-1.5 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Chat translated to {LANGUAGES.find((l) => l.code === chatLanguage)?.label ?? chatLanguage} · Powered by CuraLive AI
                    </span>
                  </div>
                )}

                {/* ── Browser language auto-detect banner ── */}
                {showLangBanner && detectedLangCode && (() => {
                  const detectedLang = LANGUAGES.find((l) => l.code === detectedLangCode);
                  if (!detectedLang) return null;
                  return (
                    <div
                      data-testid="lang-detect-banner"
                      className="shrink-0 mx-3 mt-2 mb-1 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2.5 flex items-start gap-3"
                      style={{ background: "rgba(var(--primary-rgb, 239 68 68) / 0.06)" }}>
                      <span className="text-lg leading-none mt-0.5" aria-hidden>{detectedLang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          Your browser is set to {detectedLang.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                          Switch chat to <strong>{detectedLang.nativeLabel}</strong> for AI-translated messages?
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            data-testid="lang-banner-accept"
                            onClick={handleLangBannerAccept}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                            Switch to {detectedLang.label}
                          </button>
                          <button
                            data-testid="lang-banner-dismiss"
                            onClick={handleLangBannerDismiss}
                            className="text-[10px] font-medium px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            Keep English
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleLangBannerDismiss}
                        aria-label="Dismiss language suggestion"
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  );
                })()}

                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatQuery.isLoading && (
                    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                      <span className="animate-pulse">Loading chat…</span>
                    </div>
                  )}
                  {!chatQuery.isLoading && chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                      <Globe className="w-8 h-8 mb-2 opacity-30" />
                      <span>No messages yet.</span>
                      <span className="text-xs mt-1 opacity-60" style={{ fontFamily: "'Inter', sans-serif" }}>The operator will post updates here.</span>
                    </div>
                  )}
                  {chatMessages.map((msg) => {
                    const translation = chatTranslations[msg.id];
                    const showTranslation = chatTranslationEnabled && chatLanguage !== "en" && translation && translation.translationLanguage === chatLanguage;
                    const isTranslating = translatingMsgIds.has(msg.id);
                    const senderColors: Record<string, string> = {
                      operator: "text-primary",
                      moderator: "text-amber-400",
                      system: "text-muted-foreground",
                      participant: "text-emerald-400",
                    };
                    return (
                      <div key={msg.id} className="group flex gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className={`text-[10px] font-bold ${senderColors[msg.senderType] ?? "text-foreground"}`}>
                              {msg.senderName}
                            </span>
                            {msg.senderType === "operator" && (
                              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 rounded font-semibold">Operator</span>
                            )}
                            {msg.senderType === "moderator" && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-semibold">Moderator</span>
                            )}
                            {translation?.detectedLanguage && (
                              <span className="text-[9px] bg-secondary text-muted-foreground border border-border px-1 py-0.5 rounded font-mono">
                                {translation.detectedLanguage.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground ml-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{msg.message}</p>
                          {showTranslation && (
                            <p className="text-xs text-emerald-400 italic mt-0.5 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {translation.translatedMessage}
                            </p>
                          )}
                          {isTranslating && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>Translating…</p>
                          )}
                        </div>
                        {/* Per-message translate button (hover reveal) */}
                        {chatLanguage !== "en" && !showTranslation && !isTranslating && (
                          <button
                            onClick={() => doTranslateChatMsg(msg.id, msg.message)}
                            title={`Translate to ${LANGUAGES.find((l) => l.code === chatLanguage)?.label ?? chatLanguage}`}
                            className="opacity-0 group-hover:opacity-100 shrink-0 self-start mt-1 text-muted-foreground hover:text-emerald-400 transition-all">
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Polls Tab ── */}
            {activeTab === "polls" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {livePolls.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold">Active Polls</h2>
                    </div>
                    {livePolls.map((poll) => (
                      <div key={poll.id} className="bg-card border border-primary/20 rounded-2xl p-6 shadow-lg">
                        <LivePoll
                          poll={poll}
                          onVote={(pollId, optionId) => handlePollVote(pollId, optionId)}
                          votedOptionId={votedPolls.has(poll.id) ? "voted" : null}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-40">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No active polls</h3>
                      <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mt-1">Polls will appear here when launched by the moderator.</p>
                    </div>
                  </div>
                )}

                {polls.filter(p => p.status === "closed").length > 0 && (
                  <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Poll Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {polls.filter(p => p.status === "closed").map(poll => (
                        <div key={poll.id} className="bg-card border border-border rounded-xl p-4">
                          <h3 className="text-sm font-semibold leading-snug mb-4">{poll.question}</h3>
                          <PollResults options={poll.options} totalVotes={poll.options.reduce((a, b) => a + b.votes, 0)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Analytics Tab ── */}
            {activeTab === "analytics" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Attendees", value: presenceCount.toLocaleString() },
                    { label: "Transcript Lines", value: transcript.length.toString() },
                    { label: "Q&A Submitted", value: qaItems.length.toString() },
                    { label: "Active Polls", value: livePolls.length.toString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-primary">{value}</div>
                      <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Key Topics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Q4 Revenue", "AI Strategy", "CuraLive", "Gross Margin", "Teams Integration", "2026 Guidance", "Recall.ai", "EBITDA"].map((tag) => (
                      <span key={tag} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                {/* Q&A category breakdown */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Q&A by Category</div>
                  <div className="space-y-2">
                    {(Object.keys(QA_CATEGORY_COLORS) as QACategory[]).map((cat) => {
                      const count = qaItems.filter((q) => categoriseQuestion(q.question) === cat).length;
                      const pct = qaItems.length > 0 ? Math.round((count / qaItems.length) * 100) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-[10px] mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span className="text-muted-foreground">{cat}</span>
                            <span className="font-semibold">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar: Enhanced Sentiment ── */}
        <div className="w-52 shrink-0 border-l border-border bg-card/30 flex-col items-center p-4 gap-4 hidden lg:flex overflow-y-auto">
          <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Live Sentiment</div>

          {/* Feature 2: Enhanced sentiment panel */}
          <EnhancedSentimentPanel score={sentiment.score} history={sentimentHistory} />

          <div className="w-full border-t border-border pt-3 space-y-2 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Attendees</span>
              <span className="font-semibold">{presenceCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Q&A</span>
              <span className="font-semibold">{qaItems.length}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Polls</span>
              <span className="font-semibold">{livePolls.length}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Language</span>
              <span className="font-semibold">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
            </div>
          </div>
          <div className="w-full">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Real-Time Channels</div>
            <div className="space-y-1">
              {["transcript", "sentiment", "qa", "polls", "presence"].map((ch) => (
                <div key={ch} className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-muted-foreground">{ch}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page (wraps with AblyProvider) ─────────────────────────────────

export default function EventRoom() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "q4-earnings-2026";
  return (
    <AblyProvider eventId={eventId}>
      <EventRoomInner eventId={eventId} />
    </AblyProvider>
  );
}
