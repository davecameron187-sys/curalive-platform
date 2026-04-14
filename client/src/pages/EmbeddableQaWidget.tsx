import { useState, useEffect, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function EmbeddableQaWidget() {
  const path = window.location.pathname;
  const accessCode = path.split("/embed/qa/")[1]?.split("?")[0]?.toUpperCase() || "";

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isWhiteLabel = params.get("theme") === "platform";
  const brandName = params.get("brandName") || "";
  const brandColor = params.get("brandColor") || "#6366f1";
  const hideBranding = params.get("hideBranding") === "1";

  const accentColor = isWhiteLabel && brandColor ? brandColor : "#6366f1";

  const [questionText, setQuestionText] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
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
    if (!questionText.trim() || questionText.length < 5) return;
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        sessionCode: accessCode,
        questionText: questionText.trim(),
        submitterName: isAnonymous ? undefined : submitterName || undefined,
        isAnonymous,
      });
      setQuestionText("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      questionsQuery.refetch();
    } catch {
      toast.error("Failed to submit");
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
    } catch {}
  }

  if (!accessCode) {
    return (
      <div style={S.container}>
        <div style={S.center}>
          <p style={{ color: "#999", fontSize: "0.85rem" }}>Invalid Q&A link</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div style={S.container}>
        <div style={S.center}>
          <div style={{ ...S.spinner, borderTopColor: accentColor }} />
          <p style={{ color: "#999", fontSize: "0.8rem", marginTop: "0.75rem" }}>Loading...</p>
          <style>{`@keyframes wSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={S.container}>
        <div style={S.center}>
          <p style={{ color: "#ccc", fontSize: "0.95rem", fontWeight: 600 }}>Session Not Found</p>
          <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "0.25rem" }}>This Q&A session may have ended.</p>
        </div>
      </div>
    );
  }

  const isClosed = session.status === "closed";
  const isPaused = session.status === "paused";

  return (
    <div style={S.container}>
      <div style={{ ...S.header, background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}99)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          {!isClosed && !isPaused && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "wPulse 2s infinite" }} />
          )}
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isClosed ? "Ended" : isPaused ? "Paused" : "Live"}
          </span>
        </div>
        <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
          {isWhiteLabel && brandName ? brandName : session.eventName}
        </h1>
        {isWhiteLabel && brandName && (
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", margin: "0.15rem 0 0" }}>{session.eventName}</p>
        )}
      </div>

      <style>{`@keyframes wPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } } @keyframes wSpin { to { transform: rotate(360deg) } }`}</style>

      <div style={S.body}>
        {!isClosed && !isPaused && (
          <form onSubmit={handleSubmit} style={S.form}>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Type your question..."
              maxLength={2000}
              style={S.textarea}
              rows={2}
            />
            {!isAnonymous && (
              <input
                value={submitterName}
                onChange={e => setSubmitterName(e.target.value)}
                placeholder="Your name (optional)"
                style={S.nameInput}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "#888", cursor: "pointer" }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ accentColor }} />
                Anonymous
              </label>
              <button
                type="submit"
                disabled={submitting || questionText.length < 5}
                style={{ ...S.submitBtn, background: submitted ? "#22c55e" : accentColor, opacity: submitting || questionText.length < 5 ? 0.5 : 1 }}
              >
                {submitting ? "..." : submitted ? "\u2713" : "Send"}
              </button>
            </div>
          </form>
        )}

        {(isClosed || isPaused) && (
          <div style={{ padding: "0.75rem", background: "#1a1a2e", borderRadius: 8, marginBottom: "0.75rem", textAlign: "center" }}>
            <p style={{ color: isClosed ? "#fca5a5" : "#fbbf24", fontSize: "0.8rem", margin: 0 }}>
              {isClosed ? "Q&A has ended." : "Q&A is paused."}
            </p>
          </div>
        )}

        <div style={S.questionList}>
          {questions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0.5rem", color: "#555" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.25rem" }}>💬</p>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>No questions yet</p>
            </div>
          ) : (
            questions.map((q: any) => (
              <div key={q.id} style={S.questionCard}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleUpvote(q.id)}
                    disabled={votedIds.has(q.id)}
                    style={{
                      ...S.upvoteBtn,
                      borderColor: votedIds.has(q.id) ? accentColor : "#2a2a4a",
                      background: votedIds.has(q.id) ? `${accentColor}22` : "transparent",
                      color: votedIds.has(q.id) ? accentColor : "#888",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem" }}>▲</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{q.upvotes || 0}</span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.4, color: "#e0e0e0", wordBreak: "break-word" }}>{q.question_text}</p>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", fontSize: "0.65rem", color: "#666", flexWrap: "wrap" }}>
                      <span>{q.submitterName || "Anonymous"}</span>
                      <span style={{ background: `${accentColor}22`, color: accentColor, padding: "0.05rem 0.3rem", borderRadius: 3 }}>{q.category}</span>
                      {q.status === "answered" && <span style={{ color: "#22c55e" }}>✓ Answered</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!hideBranding && (
        <div style={S.footer}>
          {isWhiteLabel ? (
            <span>Powered by {brandName || "CuraLive"} + CuraLive AI</span>
          ) : (
            <span>Powered by CuraLive · Live Q&A Intelligence</span>
          )}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxHeight: "100vh",
    background: "#0a0a0f",
    color: "#e0e0e0",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid #2a2a4a",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflow: "auto",
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
  },
  form: {
    background: "#111128",
    border: "1px solid #2a2a4a",
    borderRadius: 10,
    padding: "0.75rem",
    marginBottom: "0.75rem",
    flexShrink: 0,
  },
  textarea: {
    width: "100%",
    background: "#0a0a1a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    color: "#fff",
    padding: "0.5rem",
    fontSize: "0.85rem",
    resize: "none",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  nameInput: {
    width: "100%",
    background: "#0a0a1a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    color: "#fff",
    padding: "0.4rem 0.5rem",
    fontSize: "0.8rem",
    outline: "none",
    marginTop: "0.4rem",
    boxSizing: "border-box" as const,
  },
  submitBtn: {
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "0.4rem 1rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  questionList: {
    flex: 1,
    overflow: "auto",
  },
  questionCard: {
    background: "#111128",
    border: "1px solid #2a2a4a",
    borderRadius: 8,
    padding: "0.65rem",
    marginBottom: "0.5rem",
  },
  upvoteBtn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.1rem",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    padding: "0.3rem",
    minWidth: 34,
    cursor: "pointer",
    background: "transparent",
    transition: "all 0.15s",
  },
  footer: {
    padding: "0.5rem",
    textAlign: "center" as const,
    fontSize: "0.6rem",
    color: "#444",
    borderTop: "1px solid #1a1a3a",
    flexShrink: 0,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "2px solid #333",
    borderRadius: "50%",
    animation: "wSpin 1s linear infinite",
  },
};
