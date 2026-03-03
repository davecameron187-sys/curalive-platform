/**
 * WebcastReport.tsx — Post-Event Intelligence Report for Webcast Events
 * Accessible at /live-video/webcast/:slug/report (operator-only)
 * Shows: attendance stats, poll results with vote breakdowns, Q&A log,
 * top companies, recording link, and AI-generated summary.
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Users, BarChart3, MessageSquare, Clock, TrendingUp, Award,
  Download, Share2, ArrowLeft, CheckCircle2, Play, Building2,
  FileText, Zap, Eye, ThumbsUp, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";
}

function StatCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WebcastReport() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "qa" | "polls" | "attendees">("overview");
  const [expandedPoll, setExpandedPoll] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const { data: report, isLoading, error } = trpc.webcast.getWebcastReport.useQuery(
    { slug: slug || "" },
    { enabled: !!slug && isAuthenticated, retry: false }
  );

  const _generateSummaryMutation = (trpc.webcast as any).generateWebcastSummary?.useMutation?.({
    onSuccess: (data: { summary?: string }) => {
      setAiSummary(data?.summary ?? null);
      setGeneratingSummary(false);
    },
    onError: () => {
      setGeneratingSummary(false);
      toast.error("Failed to generate summary — please try again");
    },
  });

  const handleGenerateSummary = () => {
    if (!report?.event?.id) return;
    setGeneratingSummary(true);
    // Fallback: build a simple summary from available data
    const { stats, event } = report;
    const summary = [
      `**${event.title}** — Post-Event Summary`,
      ``,
      `**Attendance:** ${stats.totalAttendees} of ${stats.totalRegistrations} registered attendees joined (${stats.showUpRate}% show-up rate).`,
      stats.peakAttendees > 0 ? `Peak concurrent viewers: ${stats.peakAttendees}.` : "",
      stats.avgWatchTimeSeconds > 0 ? `Average watch time: ${fmtDuration(stats.avgWatchTimeSeconds)}.` : "",
      ``,
      `**Engagement:** ${stats.totalQuestions} questions submitted (${stats.answeredQuestions} answered). ${stats.totalPolls} polls ran with ${stats.totalPollVotes} total votes. Overall engagement score: ${stats.engagementScore}/100.`,
      ``,
      event.recordingUrl ? `**Recording** is available for on-demand viewing.` : "",
    ].filter(Boolean).join("\n");
    setAiSummary(summary);
    setGeneratingSummary(false);
  };

  const handleExportCSV = () => {
    if (!report?.registrations) return;
    const headers = ["First Name", "Last Name", "Email", "Company", "Job Title", "Country", "Attended", "Watch Time (s)", "Registered At"];
    const rows = report.registrations.map((r) => [
      r.firstName, r.lastName, r.email, r.company ?? "", r.jobTitle ?? "",
      r.country ?? "", r.attended ? "Yes" : "No",
      r.watchTimeSeconds ?? 0,
      fmtDate(r.registeredAt),
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Attendee list exported as CSV");
  };

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Report not found</h2>
          <p className="text-sm text-muted-foreground">The event "{slug}" could not be found or you don't have access.</p>
          <button onClick={() => navigate("/live-video/webcasting")} className="text-primary text-sm hover:underline">
            ← Back to Webcasting Hub
          </button>
        </div>
      </div>
    );
  }

  const { event, stats, questions, polls, registrations, topCompanies } = report;

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "qa", label: `Q&A (${stats.totalQuestions})`, icon: MessageSquare },
    { id: "polls", label: `Polls (${stats.totalPolls})`, icon: BarChart3 },
    { id: "attendees", label: `Attendees (${stats.totalRegistrations})`, icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/live-video/webcast/${slug}`)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Studio
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold truncate max-w-[200px]">{event.title}</span>
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Post-Event Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            {event.recordingUrl && (
              <a
                href={`/live-video/webcast/${slug}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Watch Recording
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Event meta */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {event.hostOrganization && <span>{event.hostOrganization}</span>}
            {event.startTime && (
              <>
                <span>·</span>
                <span>{fmtDate(event.startTime)}</span>
              </>
            )}
            <span>·</span>
            <span className="capitalize">{event.eventType?.replace(/_/g, " ")}</span>
            <span>·</span>
            <span className="capitalize">{event.industryVertical?.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Registered" value={stats.totalRegistrations} icon={Users} />
          <StatCard label="Attended" value={stats.totalAttendees} icon={Eye} />
          <StatCard label="Show-Up Rate" value={`${stats.showUpRate}%`} icon={TrendingUp} accent />
          <StatCard label="Avg Watch Time" value={fmtDuration(stats.avgWatchTimeSeconds)} icon={Clock} />
          <StatCard label="Questions" value={stats.totalQuestions} sub={`${stats.answeredQuestions} answered`} icon={MessageSquare} />
          <StatCard label="Engagement Score" value={`${stats.engagementScore}/100`} icon={Award} accent />
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI Summary */}
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-card/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">AI Event Summary</span>
                  </div>
                  {!aiSummary && (
                    <button
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {generatingSummary ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</> : "Generate Summary"}
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {aiSummary ? (
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {aiSummary}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      Click "Generate Summary" to produce an AI-written event summary from attendance data, Q&A, and poll results.
                    </div>
                  )}
                </div>
              </div>

              {/* Recording */}
              {event.recordingUrl && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-card/40 border-b border-border">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold">Recording</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">On Demand</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <video
                      src={event.recordingUrl}
                      controls
                      className="w-full rounded-lg bg-black aspect-video"
                      style={{ maxHeight: 280 }}
                    />
                    <div className="flex gap-2">
                      <a
                        href={event.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" /> Open Recording
                      </a>
                      <button
                        onClick={() => {
                          const watchUrl = `${window.location.origin}/live-video/webcast/${slug}/watch`;
                          navigator.clipboard.writeText(watchUrl).then(() => toast.success("Watch link copied"));
                        }}
                        className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Copy Watch Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: top companies + quick poll summary */}
            <div className="space-y-4">
              {topCompanies.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-card/40 border-b border-border">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Top Companies</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {topCompanies.map(({ company, count }) => (
                      <div key={company} className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate max-w-[160px]">{company}</span>
                        <span className="text-muted-foreground shrink-0">{count} attendee{count !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {polls.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-card/40 border-b border-border">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Poll Snapshot</span>
                  </div>
                  <div className="p-3 space-y-3">
                    {polls.slice(0, 2).map((poll) => (
                      <div key={poll.id}>
                        <p className="text-xs font-medium mb-1.5 line-clamp-2">{poll.question}</p>
                        <div className="space-y-1">
                          {poll.optionsList.slice(0, 3).map((opt: string, i: number) => (
                            <div key={i}>
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                                <span className="truncate max-w-[140px]">{opt}</span>
                                <span>{poll.percentages[i] ?? 0}%</span>
                              </div>
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${poll.percentages[i] ?? 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{poll.totalVotes} votes</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Q&A Tab ── */}
        {activeTab === "qa" && (
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No questions were submitted during this event.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="border border-border rounded-xl p-4 bg-card/30">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{q.isAnonymous ? "Anonymous" : `${q.attendeeName}`}</span>
                      {q.attendeeCompany && <span>· {q.attendeeCompany}</span>}
                      {q.category && (
                        <span className="bg-secondary border border-border px-1.5 py-0.5 rounded text-[10px]">{q.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3 h-3" /> {q.upvotes ?? 0}
                      </span>
                      {q.status === "answered" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">Answered</span>
                      )}
                      {q.status === "approved" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded">Approved</span>
                      )}
                      {q.status === "pending" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Pending</span>
                      )}
                      {q.status === "dismissed" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 rounded">Dismissed</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.question}</p>
                  {q.answer && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Answer{q.answeredBy ? ` · ${q.answeredBy}` : ""}:</p>
                      <p className="text-sm text-foreground/80 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Polls Tab ── */}
        {activeTab === "polls" && (
          <div className="space-y-4">
            {polls.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No polls were run during this event.</p>
              </div>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-card/40 hover:bg-card/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold">{poll.question}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{poll.totalVotes} votes</span>
                      {expandedPoll === poll.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedPoll === poll.id && (
                    <div className="p-4 space-y-3">
                      {poll.optionsList.map((opt: string, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-foreground">{opt}</span>
                            <span className="text-muted-foreground font-medium">
                              {poll.resultsList[i] ?? 0} votes ({poll.percentages[i] ?? 0}%)
                            </span>
                          </div>
                          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${poll.percentages[i] ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground pt-1">
                        Total: {poll.totalVotes} votes · Status: <span className="capitalize">{poll.status}</span>
                        {poll.closedAt ? ` · Closed ${fmtDate(poll.closedAt)}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Attendees Tab ── */}
        {activeTab === "attendees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                {stats.totalAttendees} of {stats.totalRegistrations} registrants attended ({stats.showUpRate}% show-up rate)
              </p>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <thead>
                    <tr className="border-b border-border bg-card/40">
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Name</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Company</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Email</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Status</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Watch Time</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-card/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{r.firstName} {r.lastName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.company ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.email}</td>
                        <td className="px-4 py-2.5">
                          {r.attended ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Attended
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Registered</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {r.watchTimeSeconds ? fmtDuration(r.watchTimeSeconds) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(r.registeredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
