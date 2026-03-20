import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function AttendeeQA() {
  const path = window.location.pathname;
  const accessCode = path.split("/qa/")[1]?.split("?")[0]?.toUpperCase() || "";

  const [questionText, setQuestionText] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterCompany, setSubmitterCompany] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sessionQuery = trpc.liveQa.getSessionByCode.useQuery(
    { accessCode },
    { enabled: !!accessCode, refetchInterval: 10000 }
  );

  const questionsQuery = trpc.liveQa.listQuestionsPublic.useQuery(
    { sessionCode: accessCode },
    { enabled: !!accessCode, refetchInterval: 5000 }
  );

  const submitMutation = trpc.liveQa.submitQuestion.useMutation();
  const upvoteMutation = trpc.liveQa.upvoteQuestion.useMutation();

  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());

  const session = sessionQuery.data;
  const questions = questionsQuery.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim() || questionText.length < 5) {
      toast.error("Please enter at least 5 characters");
      return;
    }
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        sessionCode: accessCode,
        questionText: questionText.trim(),
        submitterName: isAnonymous ? undefined : submitterName || undefined,
        submitterEmail: submitterEmail || undefined,
        submitterCompany: isAnonymous ? undefined : submitterCompany || undefined,
        isAnonymous,
      });
      setQuestionText("");
      setSubmitted(true);
      toast.success("Question submitted!");
      questionsQuery.refetch();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(questionId: number) {
    if (votedIds.has(questionId)) return;
    try {
      await upvoteMutation.mutateAsync({ questionId });
      setVotedIds(prev => new Set(prev).add(questionId));
      questionsQuery.refetch();
    } catch {
      toast.error("Failed to upvote");
    }
  }

  if (!accessCode) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invalid Q&A Link</h1>
          <p style={{ color: "#999" }}>Please check the link provided by your event operator.</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #333", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p>Loading Q&A session...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Session Not Found</h1>
          <p style={{ color: "#999" }}>This Q&A session may have ended or the code is invalid.</p>
        </div>
      </div>
    );
  }

  const isClosed = session.status === "closed";
  const isPaused = session.status === "paused";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "system-ui, -apple-system, sans-serif", padding: "0" }}>
      <header style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderBottom: "1px solid #2a2a4a", padding: "1.25rem 1.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ background: isClosed ? "#dc2626" : isPaused ? "#f59e0b" : "#22c55e", width: 10, height: 10, borderRadius: "50%", display: "inline-block", animation: !isClosed && !isPaused ? "pulse 2s infinite" : "none" }} />
            <span style={{ fontSize: "0.8rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isClosed ? "Session Ended" : isPaused ? "Paused" : "Live Q&A"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", margin: 0 }}>{session.eventName}</h1>
          {session.clientName && <p style={{ fontSize: "0.85rem", color: "#888", margin: "0.25rem 0 0" }}>{session.clientName}</p>}
        </div>
      </header>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem" }}>
        {!isClosed && !isPaused && (
          <form onSubmit={handleSubmit} style={{ background: "#111128", border: "1px solid #2a2a4a", borderRadius: 12, padding: "1.25rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#fff" }}>Ask a Question</h2>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              maxLength={2000}
              style={{ width: "100%", minHeight: 80, background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8, color: "#fff", padding: "0.75rem", fontSize: "0.95rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#666", margin: "0.25rem 0 0.75rem" }}>
              <span>{questionText.length}/2000</span>
            </div>

            {!isAnonymous && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <input value={submitterName} onChange={e => setSubmitterName(e.target.value)} placeholder="Your name (optional)" style={{ background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8, color: "#fff", padding: "0.6rem", fontSize: "0.85rem", outline: "none" }} />
                <input value={submitterCompany} onChange={e => setSubmitterCompany(e.target.value)} placeholder="Company (optional)" style={{ background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8, color: "#fff", padding: "0.6rem", fontSize: "0.85rem", outline: "none" }} />
              </div>
            )}
            <input value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} placeholder="Email (optional, for follow-up)" type="email" style={{ width: "100%", background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8, color: "#fff", padding: "0.6rem", fontSize: "0.85rem", marginBottom: "0.75rem", outline: "none", boxSizing: "border-box" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#aaa", cursor: "pointer" }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ accentColor: "#6366f1" }} />
                Submit anonymously
              </label>
              <button
                type="submit"
                disabled={submitting || questionText.length < 5}
                style={{ background: submitted ? "#22c55e" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 600, cursor: submitting ? "wait" : "pointer", opacity: submitting || questionText.length < 5 ? 0.6 : 1 }}
              >
                {submitting ? "Submitting..." : submitted ? "✓ Sent!" : "Submit Question"}
              </button>
            </div>
          </form>
        )}

        {(isClosed || isPaused) && (
          <div style={{ background: "#1a1a2e", border: `1px solid ${isClosed ? "#7f1d1d" : "#78350f"}`, borderRadius: 12, padding: "1.25rem", marginBottom: "2rem", textAlign: "center" }}>
            <p style={{ color: isClosed ? "#fca5a5" : "#fbbf24", fontSize: "0.95rem" }}>
              {isClosed ? "This Q&A session has ended. Thank you for participating." : "Q&A is currently paused. Please check back shortly."}
            </p>
          </div>
        )}

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>Questions ({questions.length})</h2>
          </div>

          {questions.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#666" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</p>
              <p>No questions yet. Be the first to ask!</p>
            </div>
          )}

          {questions.map((q: any) => (
            <div key={q.id} style={{ background: "#111128", border: "1px solid #2a2a4a", borderRadius: 10, padding: "1rem", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => handleUpvote(q.id)}
                  disabled={votedIds.has(q.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
                    background: votedIds.has(q.id) ? "#1e1b4b" : "transparent",
                    border: `1px solid ${votedIds.has(q.id) ? "#6366f1" : "#2a2a4a"}`,
                    borderRadius: 8, padding: "0.5rem", minWidth: 44, cursor: votedIds.has(q.id) ? "default" : "pointer", color: votedIds.has(q.id) ? "#818cf8" : "#aaa",
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>▲</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{q.upvotes || 0}</span>
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5, color: "#e0e0e0" }}>{q.question_text}</p>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "#666" }}>
                    <span>{q.submitterName || "Anonymous"}</span>
                    {q.submitter_company && <span>· {q.submitter_company}</span>}
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{q.category}</span>
                    {q.status === "answered" && <span style={{ color: "#22c55e" }}>✓ Answered</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer style={{ textAlign: "center", padding: "2rem 0 1rem", fontSize: "0.75rem", color: "#444" }}>
          Powered by CuraLive · Live Q&A Intelligence Engine
        </footer>
      </main>
    </div>
  );
}
