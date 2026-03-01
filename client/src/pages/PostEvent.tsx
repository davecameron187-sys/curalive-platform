import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Zap, ArrowLeft, Download, Play, FileText, BarChart3,
  MessageSquare, Clock, Users, Globe, CheckCircle,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Mail
} from "lucide-react";

const SUMMARY = `Chorus Call delivered a strong Q4 2025, with revenue of $47.2 million representing 28% year-over-year growth. CEO James Mitchell highlighted the accelerating adoption of the Chorus.AI intelligence platform, which drove a 40% improvement in engagement metrics across the enterprise client base.

CFO Sarah Chen reported gross margin expansion to 72%, driven by AI infrastructure efficiencies. The company ended the quarter with $124 million in cash and equivalents. Full-year 2026 guidance was set at $195–$210 million in revenue with adjusted EBITDA margins of 18–22%.

Key strategic themes: native Zoom RTMS and Microsoft Teams integrations, the Recall.ai partnership enabling rapid multi-platform deployment, and the Ably real-time infrastructure underpinning the live intelligence layer.`;

const TRANSCRIPT = [
  { speaker: "Operator", time: "00:00:05", text: "Good morning and welcome to the Chorus Call Q4 2025 Earnings Call. All participants will be in listen-only mode." },
  { speaker: "James Mitchell (CEO)", time: "00:01:12", text: "Thank you, Operator. Good morning everyone. I'm delighted to share that Q4 has been an exceptional quarter for Chorus Call." },
  { speaker: "James Mitchell (CEO)", time: "00:02:30", text: "Our AI-powered platform, Chorus.AI, has seen remarkable adoption across our enterprise client base, with a 40% increase in engagement metrics." },
  { speaker: "Sarah Chen (CFO)", time: "00:04:15", text: "Thank you James. From a financial perspective, Q4 revenue came in at $47.2 million, representing 28% year-over-year growth." },
  { speaker: "Sarah Chen (CFO)", time: "00:05:40", text: "Our gross margins expanded to 72%, driven primarily by the efficiency gains from our new Chorus.AI intelligence layer." },
  { speaker: "James Mitchell (CEO)", time: "00:07:22", text: "Looking ahead to 2026, we're particularly excited about our Teams and Zoom native integrations, which will open significant new enterprise opportunities." },
  { speaker: "Sarah Chen (CFO)", time: "00:09:05", text: "We're guiding to full-year 2026 revenue of $195 to $210 million, with adjusted EBITDA margins of 18 to 22 percent." },
  { speaker: "Operator", time: "00:10:30", text: "We will now open the line for questions. Please press star one to join the queue." },
  { speaker: "James Mitchell (CEO)", time: "00:12:15", text: "The Chorus.AI platform represents a fundamental shift in how we deliver value to our clients. We're not just a conferencing provider anymore." },
  { speaker: "Sarah Chen (CFO)", time: "00:14:00", text: "Capital expenditure for the year was $8.3 million, primarily invested in our AI infrastructure and the Ably real-time messaging integration." },
  { speaker: "James Mitchell (CEO)", time: "00:16:45", text: "Our partnership with Recall.ai has been transformative. It allows us to deploy the Chorus.AI intelligence layer on any platform within days, not months." },
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

export default function PostEvent() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "analytics">("summary");
  const [expandedTranscript, setExpandedTranscript] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (type: string) => {
    setDownloading(true);
    setTimeout(() => { setDownloading(false); }, 1500);
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
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">Chorus<span className="text-primary">.AI</span></span>
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
            { icon: Globe, label: "Languages", value: "6", sub: "active" },
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
          <div className="bg-black/60 aspect-video flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button className="relative z-10 w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </button>
            <div className="absolute bottom-4 left-4 text-white/80 text-sm font-semibold">Q4 2025 Earnings Call — Full Replay</div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Replay available for 90 days</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDownload("video")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Download className="w-3 h-3" /> Video (MP4)
              </button>
              <button onClick={() => handleDownload("audio")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
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
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── AI Summary ── */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-semibold">Chorus.AI Executive Summary</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:?subject=${encodeURIComponent("Q4 2025 Earnings Call — Chorus.AI Executive Summary")}&body=${encodeURIComponent("Dear IR Contacts,\n\nPlease find below the AI-generated executive summary for the Q4 2025 Earnings Call, produced by Chorus.AI.\n\n" + SUMMARY + "\n\nKey Metrics:\n• Q4 Revenue: $47.2M (+28% YoY)\n• Gross Margin: 72%\n• 2026 Revenue Guidance: $195–210M\n• Cash & Equivalents: $124M\n\nFull replay and transcript available at your Chorus.AI portal.\n\nBest regards,\nInvestor Relations — Chorus Call Inc.")}`}
                    className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Mail className="w-3 h-3" /> Email to IR Contacts
                  </a>
                  <button onClick={() => handleDownload("summary")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif" }}>{SUMMARY}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-sm mb-3">Key Topics Detected</div>
                <div className="flex flex-wrap gap-2">
                  {["Q4 Revenue", "AI Strategy", "Chorus.AI", "Gross Margin", "Teams Integration", "2026 Guidance", "Recall.ai", "EBITDA", "Cash Position", "Investor Day"].map((tag) => (
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
              <button onClick={() => handleDownload("transcript")} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
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
                    ["Languages Used", "6"],
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
      </div>
    </div>
  );
}
