import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface Props {
  shadowSessionId?: number;
  eventName?: string;
  clientName?: string;
}

type StatusFilter = "all" | "pending" | "triaged" | "approved" | "answered" | "rejected" | "flagged";

export default function LiveQaDashboard({ shadowSessionId, eventName, clientName }: Props) {
  const [qaSessionId, setQaSessionId] = useState<number | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<Record<number, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [creating, setCreating] = useState(false);

  const sessionByShadow = trpc.liveQa.getSessionByShadow.useQuery(
    { shadowSessionId: shadowSessionId || 0 },
    { enabled: !!shadowSessionId }
  );

  const sessionsList = trpc.liveQa.listSessions.useQuery();

  const questionsQuery = trpc.liveQa.listQuestions.useQuery(
    { sessionId: qaSessionId || 0, statusFilter },
    { enabled: !!qaSessionId, refetchInterval: 5000 }
  );

  const createSession = trpc.liveQa.createSession.useMutation();
  const updateStatus = trpc.liveQa.updateQuestionStatus.useMutation();
  const submitAnswer = trpc.liveQa.submitAnswer.useMutation();
  const generateDraft = trpc.liveQa.generateDraft.useMutation();
  const updateSessionStatus = trpc.liveQa.updateSessionStatus.useMutation();

  useEffect(() => {
    if (sessionByShadow.data) {
      setQaSessionId(sessionByShadow.data.id);
      setSessionCode(sessionByShadow.data.sessionCode);
    }
  }, [sessionByShadow.data]);

  async function handleCreateSession() {
    if (!eventName) { toast.error("Event name required"); return; }
    setCreating(true);
    try {
      const s = await createSession.mutateAsync({
        eventName: eventName || "Live Event",
        clientName: clientName || undefined,
        shadowSessionId: shadowSessionId || undefined,
      });
      setQaSessionId(s.id);
      setSessionCode(s.sessionCode);
      toast.success("Live Q&A session created!");
      sessionsList.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusUpdate(questionId: number, status: string) {
    try {
      await updateStatus.mutateAsync({ questionId, status: status as any });
      questionsQuery.refetch();
      toast.success(`Question ${status}`);
    } catch { toast.error("Failed to update status"); }
  }

  async function handleGenerateDraft(questionId: number) {
    try {
      const draft = await generateDraft.mutateAsync({ questionId });
      setDraftAnswer(prev => ({ ...prev, [questionId]: draft.answerText }));
      setExpandedQ(questionId);
      toast.success("AI draft generated");
    } catch { toast.error("Failed to generate draft"); }
  }

  async function handleSubmitAnswer(questionId: number) {
    const text = draftAnswer[questionId];
    if (!text?.trim()) { toast.error("Please enter an answer"); return; }
    try {
      await submitAnswer.mutateAsync({ questionId, answerText: text.trim() });
      setDraftAnswer(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      setExpandedQ(null);
      questionsQuery.refetch();
      toast.success("Answer submitted!");
    } catch { toast.error("Failed to submit answer"); }
  }

  async function handleSessionStatus(status: "active" | "paused" | "closed") {
    if (!qaSessionId) return;
    try {
      await updateSessionStatus.mutateAsync({ sessionId: qaSessionId, status });
      sessionByShadow.refetch();
      toast.success(`Session ${status}`);
    } catch { toast.error("Failed to update session"); }
  }

  function copyShareLink() {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/qa/${sessionCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Q&A link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const questions = questionsQuery.data || [];
  const statusCounts: Record<string, number> = {};
  questions.forEach((q: any) => {
    const s = q.question_status || "pending";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const styles = {
    container: { padding: "1.5rem" } as React.CSSProperties,
    card: { background: "#111128", border: "1px solid #2a2a4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" } as React.CSSProperties,
    btn: { border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    btnPrimary: { background: "#6366f1", color: "#fff" } as React.CSSProperties,
    btnSuccess: { background: "#22c55e", color: "#fff" } as React.CSSProperties,
    btnDanger: { background: "#dc2626", color: "#fff" } as React.CSSProperties,
    btnWarning: { background: "#f59e0b", color: "#000" } as React.CSSProperties,
    btnGhost: { background: "transparent", border: "1px solid #2a2a4a", color: "#aaa" } as React.CSSProperties,
    badge: (color: string) => ({ display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600, background: color + "22", color, border: `1px solid ${color}44` }) as React.CSSProperties,
    input: { width: "100%", background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8, color: "#fff", padding: "0.6rem", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const },
  };

  const statusColors: Record<string, string> = {
    pending: "#888", triaged: "#6366f1", approved: "#22c55e", answered: "#3b82f6", rejected: "#dc2626", flagged: "#f59e0b"
  };

  if (!qaSessionId) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>Live Q&A Intelligence Engine</h3>
          <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Create a Live Q&A session to let attendees submit questions in real-time.
            AI triage automatically categorises, scores, and flags compliance risks.
          </p>
          <button onClick={handleCreateSession} disabled={creating} style={{ ...styles.btn, ...styles.btnPrimary, padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
            {creating ? "Creating..." : "Launch Live Q&A Session"}
          </button>

          {(sessionsList.data?.length || 0) > 0 && (
            <div style={{ marginTop: "2rem", textAlign: "left" }}>
              <h4 style={{ color: "#aaa", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Previous Sessions</h4>
              {sessionsList.data?.slice(0, 5).map((s: any) => (
                <div key={s.id} onClick={() => { setQaSessionId(s.id); setSessionCode(s.sessionCode); }} style={{ ...styles.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem" }}>
                  <div>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{s.eventName}</span>
                    <span style={{ color: "#666", fontSize: "0.8rem", marginLeft: "0.75rem" }}>{s.sessionCode}</span>
                  </div>
                  <span style={styles.badge(statusColors[s.status] || "#888")}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>Live Q&A — {sessionCode}</h3>
          <p style={{ color: "#888", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{questions.length} questions · {statusCounts["approved"] || 0} approved · {statusCounts["flagged"] || 0} flagged</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={copyShareLink} style={{ ...styles.btn, ...styles.btnPrimary }}>{copiedLink ? "✓ Copied!" : "📋 Copy Q&A Link"}</button>
          <button onClick={() => handleSessionStatus("paused")} style={{ ...styles.btn, ...styles.btnWarning }}>⏸ Pause</button>
          <button onClick={() => handleSessionStatus("active")} style={{ ...styles.btn, ...styles.btnSuccess }}>▶ Resume</button>
          <button onClick={() => handleSessionStatus("closed")} style={{ ...styles.btn, ...styles.btnDanger }}>■ Close</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {(["all", "pending", "triaged", "approved", "answered", "rejected", "flagged"] as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              ...styles.btn,
              ...(statusFilter === f ? styles.btnPrimary : styles.btnGhost),
              padding: "0.35rem 0.75rem", fontSize: "0.75rem"
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && statusCounts[f] ? ` (${statusCounts[f]})` : ""}
          </button>
        ))}
      </div>

      {questions.length === 0 && (
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem", color: "#666" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</p>
          <p>No questions yet. Share the Q&A link with attendees to get started.</p>
        </div>
      )}

      {questions.map((q: any) => {
        const isExpanded = expandedQ === q.id;
        return (
          <div key={q.id} style={{ ...styles.card, borderLeft: `3px solid ${statusColors[q.question_status] || "#333"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#e0e0e0", lineHeight: 1.5 }}>{q.question_text}</p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={styles.badge(statusColors[q.question_status] || "#888")}>{q.question_status}</span>
                  <span style={styles.badge("#6366f1")}>{q.question_category}</span>
                  {q.triage_score != null && <span style={{ fontSize: "0.7rem", color: "#aaa" }}>Triage: {Math.round(q.triage_score)}</span>}
                  {q.priority_score != null && <span style={{ fontSize: "0.7rem", color: "#aaa" }}>Priority: {Math.round(q.priority_score)}</span>}
                  {q.compliance_risk_score > 50 && <span style={styles.badge("#f59e0b")}>⚠ Risk: {Math.round(q.compliance_risk_score)}</span>}
                  {q.unresolved_flags > 0 && <span style={styles.badge("#dc2626")}>🚩 {q.unresolved_flags} flags</span>}
                  <span style={{ fontSize: "0.7rem", color: "#666" }}>▲ {q.upvotes || 0}</span>
                </div>
                {q.submitter_name && <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.35rem 0 0" }}>{q.submitter_name}{q.submitter_company ? ` · ${q.submitter_company}` : ""}</p>}
                {q.triage_reason && <p style={{ fontSize: "0.75rem", color: "#888", margin: "0.35rem 0 0", fontStyle: "italic" }}>AI: {q.triage_reason}</p>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                {q.question_status !== "approved" && q.question_status !== "answered" && (
                  <button onClick={() => handleStatusUpdate(q.id, "approved")} style={{ ...styles.btn, ...styles.btnSuccess, padding: "0.3rem 0.6rem" }}>✓ Approve</button>
                )}
                {q.question_status !== "rejected" && (
                  <button onClick={() => handleStatusUpdate(q.id, "rejected")} style={{ ...styles.btn, ...styles.btnDanger, padding: "0.3rem 0.6rem" }}>✗ Reject</button>
                )}
                <button onClick={() => handleGenerateDraft(q.id)} style={{ ...styles.btn, ...styles.btnPrimary, padding: "0.3rem 0.6rem" }}>🤖 Draft</button>
                <button onClick={() => setExpandedQ(isExpanded ? null : q.id)} style={{ ...styles.btn, ...styles.btnGhost, padding: "0.3rem 0.6rem" }}>{isExpanded ? "▼" : "▶"} Answer</button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #2a2a4a", paddingTop: "1rem" }}>
                <textarea
                  value={draftAnswer[q.id] || ""}
                  onChange={e => setDraftAnswer(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type or edit the response..."
                  style={{ ...styles.input, minHeight: 80, resize: "vertical" } as any}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button onClick={() => { setExpandedQ(null); }} style={{ ...styles.btn, ...styles.btnGhost }}>Cancel</button>
                  <button onClick={() => handleSubmitAnswer(q.id)} style={{ ...styles.btn, ...styles.btnSuccess }}>Submit Answer</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
