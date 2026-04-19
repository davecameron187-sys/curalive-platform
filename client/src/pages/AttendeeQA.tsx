import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function AttendeeQA() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session") ?? "";
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitQuestion = trpc.liveQa.submitQuestion.useMutation({
    onSuccess: () => { setSubmitted(true); setQuestion(""); },
    onError: (e) => setError(e.message),
  });

  const joinLinks = trpc.liveQa.getJoinLinks.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  if (!sessionId) {
    return (
      <div style={{ fontFamily: "monospace", background: "#0a0a0a", minHeight: "100vh", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#f87171", fontSize: "13px" }}>Invalid session link.</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0a", minHeight: "100vh", color: "#e2e8f0", padding: "32px 24px", maxWidth: "560px", margin: "0 auto" }}>
      <div style={{ color: "#60a5fa", fontSize: "14px", letterSpacing: "2px", marginBottom: "4px" }}>CURALIVE</div>
      <div style={{ color: "#334155", fontSize: "11px", marginBottom: "32px" }}>LIVE Q&A</div>

      {joinLinks.data?.webphone_url && (
        <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "6px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "8px" }}>JOIN THE CALL</div>
          <a href={joinLinks.data.webphone_url} target="_blank" rel="noreferrer"
            style={{ color: "#60a5fa", fontSize: "12px", textDecoration: "none" }}>
            Join via webphone →
          </a>
        </div>
      )}

      {!submitted ? (
        <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "6px", padding: "20px" }}>
          <div style={{ color: "#475569", fontSize: "11px", letterSpacing: "1px", marginBottom: "16px" }}>SUBMIT A QUESTION</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px", color: "#e2e8f0", fontSize: "12px", fontFamily: "monospace", outline: "none", marginBottom: "12px", boxSizing: "border-box" }} />
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your question..." rows={4}
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px", color: "#e2e8f0", fontSize: "12px", fontFamily: "monospace", outline: "none", marginBottom: "12px", resize: "vertical", boxSizing: "border-box" }} />
          {error && <div style={{ color: "#f87171", fontSize: "11px", marginBottom: "8px" }}>{error}</div>}
          <button
            onClick={() => { if (!question.trim()) return; submitQuestion.mutate({ sessionId, attendeeId: `attendee-${Date.now()}`, attendeeName: name.trim() || "Anonymous", questionText: question.trim() }); }}
            disabled={submitQuestion.isPending || !question.trim()}
            style={{ background: question.trim() ? "#1e40af" : "#1e293b", border: "none", color: question.trim() ? "white" : "#475569", padding: "10px 20px", fontSize: "11px", letterSpacing: "1px", borderRadius: "4px", cursor: question.trim() ? "pointer" : "default", fontFamily: "monospace" }}>
            {submitQuestion.isPending ? "SUBMITTING..." : "SUBMIT QUESTION"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#111", border: "1px solid #166534", borderRadius: "6px", padding: "20px", textAlign: "center" }}>
          <div style={{ color: "#4ade80", fontSize: "13px", marginBottom: "8px" }}>✓ Question submitted</div>
          <div style={{ color: "#475569", fontSize: "11px", marginBottom: "16px" }}>Your question is pending review.</div>
          <button onClick={() => setSubmitted(false)}
            style={{ background: "none", border: "1px solid #1e293b", color: "#475569", padding: "6px 14px", fontSize: "11px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
            SUBMIT ANOTHER
          </button>
        </div>
      )}
    </div>
  );
}
