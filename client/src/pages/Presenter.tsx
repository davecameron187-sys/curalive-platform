import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  Zap, ArrowLeft, Mic, Clock, Users, ChevronUp,
  ChevronDown, Settings, Radio, BarChart3
} from "lucide-react";
import { AblyProvider, useAbly } from "@/contexts/AblyContext";

// ─── Inner component (needs AblyProvider) ────────────────────────────────────

function PresenterInner({ eventId }: { eventId: string }) {
  const [, navigate] = useLocation();
  const { transcript, sentiment, qaItems, presenceCount, rollingSummary } = useAbly();
  const [fontSize, setFontSize] = useState(32);
  const [showQA, setShowQA] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const speakerColor: Record<string, string> = {
    "Operator": isDark ? "#64748b" : "#94a3b8",
    "James Mitchell (CEO)": "#60a5fa",
    "Sarah Chen (CFO)": "#34d399",
    "Dr. Priya Nair (CTO)": "#a78bfa",
    "Board Chair": "#fbbf24",
  };

  const sentimentColor = sentiment.score >= 75 ? "#10b981" : sentiment.score >= 50 ? "#f59e0b" : "#ef4444";
  const approvedQA = qaItems.filter((q) => q.status === "approved").sort((a, b) => b.votes - a.votes);
  const latestSegment = transcript[transcript.length - 1];

  // ── Feature #10: Speaking-Pace Coach ────────────────────────────────────────────
  // Compute WPM from the last 3 transcript segments
  const wpm = (() => {
    const recent = transcript.slice(-3);
    if (recent.length < 2) return null;
    const totalWords = recent.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
    const first = recent[0].timestamp;
    const last = recent[recent.length - 1].timestamp;
    const durationMin = Math.max((last - first) / 60, 0.1);
    return Math.round(totalWords / durationMin);
  })();
  const paceLabel = wpm === null ? null : wpm < 100 ? "Too Slow" : wpm > 160 ? "Too Fast" : "Optimal";
  const paceColor = paceLabel === "Optimal" ? "#10b981" : paceLabel === "Too Fast" ? "#ef4444" : "#f59e0b";

  // ── Feature #13: Sentiment history for presenter ───────────────────────────────
  const [sentimentHistory, setSentimentHistory] = useState<number[]>([72]);
  const [showSummary, setShowSummary] = useState(false);
  useEffect(() => {
    setSentimentHistory((prev) => [...prev.slice(-12), sentiment.score]);
  }, [sentiment.score]);

  const bg = isDark ? "#080b12" : "#f8fafc";
  const fg = isDark ? "#f1f5f9" : "#0f172a";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const mutedFg = isDark ? "#64748b" : "#94a3b8";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: "'Space Grotesk', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", padding: "0 16px", height: "56px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "6px", color: mutedFg, background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
        </button>
        <div style={{ width: "1px", height: "20px", background: borderColor }} />
        <span className="font-bold text-white text-sm tracking-tight">Cura<span className="text-primary">Live</span></span>
        <div style={{ width: "1px", height: "20px", background: borderColor }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "999px" }}>
          <Radio style={{ width: "12px", height: "12px" }} /> Presenter
        </div>
        <span style={{ fontSize: "13px", color: mutedFg }}>Q4 2025 Earnings Call</span>
        <div style={{ flex: 1 }} />

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Font size */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "4px 8px" }}>
            <button onClick={() => setFontSize((s) => Math.max(18, s - 4))} style={{ background: "none", border: "none", cursor: "pointer", color: mutedFg, display: "flex", alignItems: "center" }}>
              <ChevronDown style={{ width: "14px", height: "14px" }} />
            </button>
            <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "24px", textAlign: "center" }}>{fontSize}px</span>
            <button onClick={() => setFontSize((s) => Math.min(72, s + 4))} style={{ background: "none", border: "none", cursor: "pointer", color: mutedFg, display: "flex", alignItems: "center" }}>
              <ChevronUp style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
          {/* Theme toggle */}
          <button onClick={() => setIsDark((d) => !d)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", color: mutedFg }}>
            <Settings style={{ width: "12px", height: "12px" }} /> {isDark ? "Light" : "Dark"}
          </button>
          {/* Toggle Q&A panel */}
          <button onClick={() => setShowQA((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", color: mutedFg }}>
            Q&A {showQA ? "Hide" : "Show"}
          </button>
          {/* Nav to other views */}
          <button onClick={() => navigate(`/moderator/${eventId}`)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", color: mutedFg }}>
            Moderator
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ borderBottom: `1px solid ${borderColor}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: "24px", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <Clock style={{ width: "14px", height: "14px", color: mutedFg }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{formatTime(elapsedSeconds)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <Users style={{ width: "14px", height: "14px", color: mutedFg }} />
          <span style={{ fontWeight: 600 }}>{presenceCount.toLocaleString()}</span>
          <span style={{ color: mutedFg, fontSize: "11px" }}>live</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <BarChart3 style={{ width: "14px", height: "14px", color: sentimentColor }} />
          <span style={{ fontWeight: 700, color: sentimentColor }}>{sentiment.score} · {sentiment.label}</span>
        </div>
        {/* Feature #10: Speaking-Pace Coach */}
        {wpm !== null && paceLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: `${paceColor}18`, border: `1px solid ${paceColor}40`, borderRadius: "8px", padding: "4px 10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: paceColor }}>⚡ {wpm} WPM</span>
            <span style={{ fontSize: "10px", fontWeight: 600, color: paceColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>{paceLabel}</span>
          </div>
        )}
        {/* Feature #13: Audience Sentiment Feed */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: mutedFg, textTransform: "uppercase", letterSpacing: "0.08em" }}>Audience</span>
          <svg width="48" height="20" viewBox="0 0 48 20">
            {sentimentHistory.slice(-8).map((v, i, arr) => {
              const x1 = (i / (arr.length - 1)) * 44 + 2;
              const y1 = 18 - (v / 100) * 16;
              const x2 = ((i + 1) / (arr.length - 1)) * 44 + 2;
              const y2 = 18 - (arr[i + 1] / 100) * 16;
              return i < arr.length - 1 ? (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={sentimentColor} strokeWidth="1.5" strokeLinecap="round" />
              ) : null;
            })}
            <circle cx={44 + 2} cy={18 - (sentimentHistory[sentimentHistory.length - 1] / 100) * 16} r="2.5" fill={sentimentColor} />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: sentimentColor }}>{sentiment.score}</span>
        </div>
        {rollingSummary && (
          <button
            onClick={() => setShowSummary((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: showSummary ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", color: "#a78bfa" }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700 }}>✦ AI Summary</span>
            <span style={{ fontSize: "10px", color: "rgba(167,139,250,0.7)" }}>{showSummary ? "Hide" : "Show"}</span>
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "live-pulse 2s ease-in-out infinite" }} />
          Live Transcription Active
        </div>
      </div>

      {/* Rolling AI Summary overlay */}
      {showSummary && rollingSummary && (
        <div style={{ background: "rgba(139,92,246,0.06)", borderBottom: `1px solid rgba(139,92,246,0.2)`, padding: "12px 24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "10px" }}>✦</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>AI Rolling Summary</div>
            <div style={{ fontSize: "14px", color: isDark ? "rgba(241,245,249,0.85)" : "rgba(15,23,42,0.85)", lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{rollingSummary.text}</div>
          </div>
          <button onClick={() => setShowSummary(false)} style={{ flexShrink: 0, color: mutedFg, background: "none", border: "none", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Teleprompter */}
        <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "32px 48px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {transcript.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: mutedFg }}>
              <Mic style={{ width: "48px", height: "48px", marginBottom: "12px", opacity: 0.3 }} />
              <span style={{ fontSize: "16px" }}>Waiting for live transcription…</span>
            </div>
          )}
          {transcript.map((seg, i) => {
            const isLatest = i === transcript.length - 1;
            return (
              <div key={seg.id} style={{ opacity: isLatest ? 1 : Math.max(0.25, 1 - (transcript.length - 1 - i) * 0.15), transition: "opacity 0.5s ease" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", color: speakerColor[seg.speaker] ?? mutedFg }}>
                  {seg.speaker} · {seg.timeLabel}
                </div>
                <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.4, fontFamily: "'Inter', sans-serif", fontWeight: isLatest ? 500 : 400, color: isLatest ? fg : (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"), transition: "all 0.5s ease" }}>
                  {seg.text}
                </p>
              </div>
            );
          })}
          {/* Blinking cursor for latest */}
          {transcript.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {[0, 200, 400].map((d) => (
                <span key={d} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", opacity: 0.7, animation: `bounce 1s ${d}ms infinite` }} />
              ))}
              <span style={{ fontSize: "13px", color: mutedFg, fontFamily: "'Inter', sans-serif" }}>Transcribing…</span>
            </div>
          )}
        </div>

        {/* Q&A Sidebar */}
        {showQA && (
          <div style={{ width: "320px", flexShrink: 0, borderLeft: `1px solid ${borderColor}`, background: cardBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: `1px solid ${borderColor}`, fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Approved Q&A</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 8px", borderRadius: "999px" }}>
                {approvedQA.length} ready
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {approvedQA.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", color: mutedFg, fontSize: "13px", textAlign: "center" }}>
                  No approved questions yet.<br />
                  <span style={{ fontSize: "11px", marginTop: "4px" }}>Moderator approves from their console.</span>
                </div>
              )}
              {approvedQA.map((q, i) => (
                <div key={q.id} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${i === 0 ? "rgba(16,185,129,0.3)" : borderColor}`, borderRadius: "10px", padding: "12px" }}>
                  {i === 0 && (
                    <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#10b981", marginBottom: "6px" }}>Next Up</div>
                  )}
                  <p style={{ fontSize: "13px", lineHeight: 1.5, fontFamily: "'Inter', sans-serif", color: fg, marginBottom: "6px" }}>{q.question}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: mutedFg }}>
                    <ChevronUp style={{ width: "12px", height: "12px" }} />
                    <span style={{ fontWeight: 600 }}>{q.votes}</span>
                    <span>·</span>
                    <span>{q.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exported page (wraps with AblyProvider) ─────────────────────────────────

export default function Presenter() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "q4-earnings-2026";
  return (
    <AblyProvider eventId={eventId}>
      <PresenterInner eventId={eventId} />
    </AblyProvider>
  );
}
