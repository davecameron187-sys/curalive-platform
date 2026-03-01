import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
import {
  Zap, ArrowLeft, CheckCircle, XCircle, Clock, ChevronUp,
  Send, Plus, Trash2, Play, Square, Users, MessageSquare,
  BarChart3, Mic, AlertTriangle, Radio, Hand, MicOff
} from "lucide-react";
import { AblyProvider, useAbly, type QAItem, type Poll, type RaisedHand } from "@/contexts/AblyContext";

// ─── Inner component (needs AblyProvider) ────────────────────────────────────

function ModeratorInner({ eventId }: { eventId: string }) {
  const [, navigate] = useLocation();
  const { transcript, sentiment, qaItems, polls, raisedHands, presenceCount, publish } = useAbly();
  const [activeTab, setActiveTab] = useState<"qa" | "polls" | "transcript" | "hands">("qa");
  const [newPollQ, setNewPollQ] = useState("");
  const [newPollOpts, setNewPollOpts] = useState(["", ""]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleQAStatus = (id: string, status: QAItem["status"]) => {
    publish({ type: "qa.status", data: { id, status } });
  };

  const handlePushPoll = () => {
    const opts = newPollOpts.filter((o) => o.trim());
    if (!newPollQ.trim() || opts.length < 2) return;
    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPollQ.trim(),
      options: opts.map((label, i) => ({ id: `opt-${i}`, label, votes: 0 })),
      status: "live",
      createdAt: Date.now(),
    };
    publish({ type: "poll.pushed", data: poll });
    setNewPollQ("");
    setNewPollOpts(["", ""]);
    setShowPollForm(false);
  };

  const handleClosePoll = (pollId: string) => {
    publish({ type: "poll.closed", data: { pollId } });
  };

  const pendingQA = qaItems.filter((q) => q.status === "pending").sort((a, b) => b.votes - a.votes);
  const approvedQA = qaItems.filter((q) => q.status === "approved").sort((a, b) => b.votes - a.votes);
  const answeredQA = qaItems.filter((q) => q.status === "answered");
  const rejectedQA = qaItems.filter((q) => q.status === "rejected");

  const speakerColor: Record<string, string> = {
    "Operator": "#94a3b8",
    "James Mitchell (CEO)": "#60a5fa",
    "Sarah Chen (CFO)": "#34d399",
    "Dr. Priya Nair (CTO)": "#a78bfa",
  };

  const sentimentColor = sentiment.score >= 75 ? "#10b981" : sentiment.score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-md px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border" />
        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png" alt="Chorus Call" className="h-6 w-auto object-contain" />
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
          <Radio className="w-3 h-3" /> Moderator
        </div>
        <span className="text-sm text-muted-foreground hidden md:block">Q4 2025 Earnings Call</span>
        <div className="flex-1" />
        {/* Live stats */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{presenceCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: sentimentColor }}>
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-semibold">{sentiment.score} · {sentiment.label}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/event/${eventId}`)} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <Play className="w-3 h-3" /> Attendee View
        </button>
        <button onClick={() => navigate(`/presenter/${eventId}`)} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <Mic className="w-3 h-3" /> Presenter View
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Q&A / Polls / Transcript Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="shrink-0 flex border-b border-border bg-card/40">
            {[
              { key: "qa", label: "Q&A Queue", icon: MessageSquare, badge: pendingQA.length },
              { key: "hands", label: "Raised Hands", icon: Hand, badge: raisedHands.filter((h) => h.status === "waiting").length },
              { key: "polls", label: "Polls", icon: BarChart3, badge: polls.filter((p) => p.status === "live").length },
              { key: "transcript", label: "Live Transcript", icon: Mic, badge: 0 },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                <Icon className="w-4 h-4" /> {label}
                {badge > 0 && <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">{badge}</span>}
              </button>
            ))}
          </div>

          {/* ── Q&A Tab ── */}
          {activeTab === "qa" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Pending */}
              {pendingQA.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending Review ({pendingQA.length})
                  </div>
                  <div className="space-y-2">
                    {pendingQA.map((q) => (
                      <QACard key={q.id} item={q} onApprove={() => handleQAStatus(q.id, "approved")} onReject={() => handleQAStatus(q.id, "rejected")} onAnswer={() => handleQAStatus(q.id, "answered")} />
                    ))}
                  </div>
                </div>
              )}
              {/* Approved */}
              {approvedQA.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved — Ready to Answer ({approvedQA.length})
                  </div>
                  <div className="space-y-2">
                    {approvedQA.map((q) => (
                      <QACard key={q.id} item={q} onApprove={() => handleQAStatus(q.id, "approved")} onReject={() => handleQAStatus(q.id, "rejected")} onAnswer={() => handleQAStatus(q.id, "answered")} />
                    ))}
                  </div>
                </div>
              )}
              {/* Answered */}
              {answeredQA.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Answered ({answeredQA.length})</div>
                  <div className="space-y-2 opacity-50">
                    {answeredQA.map((q) => (
                      <QACard key={q.id} item={q} onApprove={() => handleQAStatus(q.id, "approved")} onReject={() => handleQAStatus(q.id, "rejected")} onAnswer={() => handleQAStatus(q.id, "answered")} />
                    ))}
                  </div>
                </div>
              )}
              {pendingQA.length === 0 && approvedQA.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                  No questions in queue yet
                </div>
              )}
            </div>
          )}

          {/* ── Raised Hands Tab ── */}
          {activeTab === "hands" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {raisedHands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <Hand className="w-8 h-8 mb-2 opacity-30" />
                  No hands raised yet
                </div>
              ) : (
                raisedHands.map((hand) => (
                  <div key={hand.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between gap-4 ${
                    hand.status === "unmuted" ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        hand.status === "unmuted" ? "bg-emerald-500/20" : "bg-amber-500/20"
                      }`}>
                        <Hand className={`w-4 h-4 ${hand.status === "unmuted" ? "text-emerald-400" : "text-amber-400"}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{hand.name}</div>
                        <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {hand.status === "unmuted" ? "Currently unmuted — speaking" : "Waiting to speak"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hand.status === "waiting" && (
                        <button
                          onClick={() => publish({ type: "hand.unmute", data: { id: hand.id } })}
                          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        >
                          <Mic className="w-3 h-3" /> Unmute
                        </button>
                      )}
                      {hand.status === "unmuted" && (
                        <button
                          onClick={() => publish({ type: "hand.dismiss", data: { id: hand.id } })}
                          className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <MicOff className="w-3 h-3" /> Mute & Dismiss
                        </button>
                      )}
                      <button
                        onClick={() => publish({ type: "hand.dismiss", data: { id: hand.id } })}
                        className="flex items-center gap-1.5 border border-border text-muted-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Polls Tab ── */}
          {activeTab === "polls" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Create Poll */}
              {showPollForm ? (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="font-semibold text-sm">Create New Poll</div>
                  <input value={newPollQ} onChange={(e) => setNewPollQ(e.target.value)}
                    placeholder="Poll question…"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                    style={{ fontFamily: "'Inter', sans-serif" }} />
                  {newPollOpts.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={(e) => { const o = [...newPollOpts]; o[i] = e.target.value; setNewPollOpts(o); }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                        style={{ fontFamily: "'Inter', sans-serif" }} />
                      {newPollOpts.length > 2 && (
                        <button onClick={() => setNewPollOpts(newPollOpts.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setNewPollOpts([...newPollOpts, ""])} className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 transition-opacity">
                    <Plus className="w-3.5 h-3.5" /> Add option
                  </button>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handlePushPoll} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                      <Send className="w-3.5 h-3.5" /> Push to Attendees
                    </button>
                    <button onClick={() => setShowPollForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowPollForm(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-xl p-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  <Plus className="w-4 h-4" /> Create New Poll
                </button>
              )}

              {/* Existing Polls */}
              {polls.length === 0 && !showPollForm && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                  No polls yet. Create one to push to attendees.
                </div>
              )}
              {polls.map((poll) => {
                const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                const CHART_COLORS = [
                  "rgba(239,68,68,0.85)",
                  "rgba(59,130,246,0.85)",
                  "rgba(16,185,129,0.85)",
                  "rgba(245,158,11,0.85)",
                  "rgba(139,92,246,0.85)",
                ];
                const chartData = {
                  labels: poll.options.map((o) => o.label),
                  datasets: [{
                    label: "Votes",
                    data: poll.options.map((o) => o.votes),
                    backgroundColor: poll.options.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                };
                const chartOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 600, easing: "easeInOutQuart" as const },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx: { parsed: { y: number | null } }) => {
                          const votes = ctx.parsed.y ?? 0;
                          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          return ` ${votes} votes (${pct}%)`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { color: "rgba(255,255,255,0.05)" },
                      ticks: { color: "#94a3b8", font: { size: 11 } },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: "rgba(255,255,255,0.05)" },
                      ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 1 },
                    },
                  },
                };
                return (
                  <div key={poll.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-sm mb-1">{poll.question}</div>
                        <div className={`text-xs font-semibold ${poll.status === "live" ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {poll.status === "live" ? "● Live" : "Closed"} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {poll.status === "live" && (
                        <button onClick={() => handleClosePoll(poll.id)} className="flex items-center gap-1.5 text-xs text-destructive border border-destructive/30 px-2.5 py-1 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Square className="w-3 h-3" /> Close
                        </button>
                      )}
                    </div>
                    {/* Animated Chart.js bar chart */}
                    <div style={{ height: "180px" }} className="mb-3">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                    {/* Percentage breakdown below chart */}
                    <div className="space-y-1 pt-2 border-t border-border">
                      {poll.options.map((opt, i) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        return (
                          <div key={opt.id} className="flex justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              {opt.label}
                            </span>
                            <span className="font-semibold text-foreground">{pct}% <span className="text-muted-foreground">({opt.votes})</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Transcript Tab ── */}
          {activeTab === "transcript" && (
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <Mic className="w-8 h-8 mb-2 opacity-30" />
                  Waiting for transcript…
                </div>
              )}
              {transcript.map((seg) => (
                <div key={seg.id} className="transcript-line-enter">
                  <div className="text-xs font-bold mb-0.5" style={{ color: speakerColor[seg.speaker] ?? "#94a3b8" }}>{seg.speaker}</div>
                  <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{seg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Stats */}
        <div className="w-64 shrink-0 border-l border-border bg-card/30 flex flex-col overflow-y-auto p-4 space-y-4 hidden lg:flex">
          <div className="font-semibold text-sm">Live Stats</div>

          {/* Sentiment */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Sentiment</div>
            <div className="relative w-20 h-20 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={sentimentColor} strokeWidth="10"
                  strokeDasharray={`${(sentiment.score / 100) * 251.2} 251.2`} strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1.2s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold" style={{ color: sentimentColor }}>{sentiment.score}</span>
              </div>
            </div>
            <div className="text-xs font-semibold mt-2" style={{ color: sentimentColor }}>{sentiment.label}</div>
          </div>

          {/* Q&A Stats */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Q&A</div>
            {[
              { label: "Pending", value: pendingQA.length, color: "text-amber-400" },
              { label: "Approved", value: approvedQA.length, color: "text-emerald-400" },
              { label: "Answered", value: answeredQA.length, color: "text-muted-foreground" },
              { label: "Rejected", value: rejectedQA.length, color: "text-destructive" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Attendees */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{presenceCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Live Attendees</div>
          </div>

          {/* Polls */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{polls.filter((p) => p.status === "live").length}</div>
            <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Active Polls</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Q&A Card ────────────────────────────────────────────────────────────────

function QACard({ item, onApprove, onReject, onAnswer }: { item: QAItem; onApprove: () => void; onReject: () => void; onAnswer: () => void }) {
  const statusConfig: Record<QAItem["status"], { label: string; color: string }> = {
    pending: { label: "Pending", color: "text-amber-400" },
    approved: { label: "Approved", color: "text-emerald-400" },
    answered: { label: "Answered", color: "text-muted-foreground" },
    rejected: { label: "Rejected", color: "text-destructive" },
  };
  const cfg = statusConfig[item.status];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold">{item.votes}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{item.question}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.author}</span>
            <span>·</span>
            <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>
      </div>
      {(item.status === "pending" || item.status === "approved") && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {item.status === "pending" && (
            <button onClick={onApprove} className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
          )}
          {item.status === "approved" && (
            <button onClick={onAnswer} className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">
              <Mic className="w-3 h-3" /> Mark Answered
            </button>
          )}
          <button onClick={onReject} className="flex items-center gap-1 text-xs text-destructive border border-destructive/20 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Exported page (wraps with AblyProvider) ─────────────────────────────────

export default function Moderator() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "q4-earnings-2026";
  return (
    <AblyProvider eventId={eventId}>
      <ModeratorInner eventId={eventId} />
    </AblyProvider>
  );
}
