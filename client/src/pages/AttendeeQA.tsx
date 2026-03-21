import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  timeLabel: string;
};

type SentimentUpdate = {
  score: number;
  label: string;
  timestamp: number;
};

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  const recognitionRef = useRef<any>(null);

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [sentiment, setSentiment] = useState<SentimentUpdate | null>(null);
  const [ablyConnected, setAblyConnected] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const ablyClientRef = useRef<any>(null);
  const ablyChannelRef = useRef<any>(null);

  const sessionQuery = trpc.liveQa.getSessionByCode.useQuery(
    { accessCode },
    { enabled: !!accessCode, refetchInterval: 10000 }
  );

  const questionsQuery = trpc.liveQa.listQuestionsPublic.useQuery(
    { sessionCode: accessCode },
    { enabled: !!accessCode, refetchInterval: 5000 }
  );

  const ablyTokenQuery = trpc.liveQa.getAttendeeAblyToken.useQuery(
    { accessCode },
    { enabled: !!accessCode && !!sessionQuery.data?.ablyChannel, staleTime: 30 * 60 * 1000 }
  );

  const submitMutation = trpc.liveQa.submitQuestion.useMutation();
  const upvoteMutation = trpc.liveQa.upvoteQuestion.useMutation();

  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());

  const session = sessionQuery.data;
  const questions = questionsQuery.data || [];

  useEffect(() => {
    if (!ablyTokenQuery.data?.tokenRequest || !ablyTokenQuery.data?.channel) return;
    if (ablyClientRef.current) return;

    let mounted = true;
    (async () => {
      try {
        const Ably = await import("ably");
        const tokenReq = ablyTokenQuery.data.tokenRequest;
        const client = new Ably.Realtime({
          authCallback: (_params: any, cb: any) => {
            cb(null, tokenReq);
          },
          autoConnect: true,
        });

        client.connection.on("connected", () => {
          if (mounted) setAblyConnected(true);
        });
        client.connection.on("disconnected", () => {
          if (mounted) setAblyConnected(false);
        });
        client.connection.on("failed", () => {
          if (mounted) setAblyConnected(false);
        });

        const channel = client.channels.get(ablyTokenQuery.data.channel!);
        channel.subscribe("curalive", (msg: any) => {
          try {
            const parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
            if (parsed.type === "transcript.segment" && parsed.data) {
              setTranscript(prev => {
                const exists = prev.some(s => s.id === parsed.data.id);
                if (exists) return prev;
                const updated = [...prev, parsed.data];
                if (updated.length > 200) return updated.slice(-200);
                return updated;
              });
            } else if (parsed.type === "sentiment.update" && parsed.data) {
              setSentiment(parsed.data);
            }
          } catch {}
        });

        ablyClientRef.current = client;
        ablyChannelRef.current = channel;
      } catch (err) {
        console.error("[AttendeeQA] Ably connection failed:", err);
      }
    })();

    return () => {
      mounted = false;
      if (ablyChannelRef.current) {
        ablyChannelRef.current.unsubscribe();
      }
      if (ablyClientRef.current) {
        ablyClientRef.current.close();
        ablyClientRef.current = null;
        ablyChannelRef.current = null;
      }
    };
  }, [ablyTokenQuery.data]);

  useEffect(() => {
    if (showTranscript && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, showTranscript]);

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

  function toggleVoiceInput() {
    if (!speechSupported) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null; toast.error("Voice input failed"); };
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setQuestionText(prev => prev ? `${prev} ${result}` : result);
      toast.success("Voice captured!");
    };
    recognitionRef.current = recognition;
    recognition.start();
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
          <p>Connecting to live session...</p>
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
  const hasLiveStream = !!session.ablyChannel && session.isLiveStreaming;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "system-ui, -apple-system, sans-serif", padding: 0 }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes livePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4) } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }
        @keyframes waveform1 { 0%,100% { height: 8px } 50% { height: 18px } }
        @keyframes waveform2 { 0%,100% { height: 12px } 50% { height: 6px } }
        @keyframes waveform3 { 0%,100% { height: 6px } 50% { height: 16px } }
      `}</style>

      <header style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderBottom: "1px solid #2a2a4a", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                {hasLiveStream ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "0.2rem 0.75rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "livePulse 1.5s infinite" }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live</span>
                  </div>
                ) : (
                  <span style={{ background: isClosed ? "#dc2626" : isPaused ? "#f59e0b" : "#22c55e", width: 10, height: 10, borderRadius: "50%", display: "inline-block", animation: !isClosed && !isPaused ? "pulse 2s infinite" : "none" }} />
                )}
                <span style={{ fontSize: "0.75rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {isClosed ? "Session Ended" : isPaused ? "Paused" : hasLiveStream ? "Live Webphone" : "Live Q&A"}
                </span>
              </div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0 }}>{session.eventName}</h1>
              {session.clientName && <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.2rem 0 0" }}>{session.clientName}</p>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {sentiment && (
                <div style={{
                  fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: 12,
                  background: sentiment.label === "Positive" ? "rgba(34,197,94,0.15)" : sentiment.label === "Negative" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                  color: sentiment.label === "Positive" ? "#22c55e" : sentiment.label === "Negative" ? "#ef4444" : "#818cf8",
                  border: `1px solid ${sentiment.label === "Positive" ? "rgba(34,197,94,0.3)" : sentiment.label === "Negative" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
                }}>
                  {sentiment.label}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "1rem 1.5rem" }}>
        {hasLiveStream && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              style={{
                width: "100%", background: ablyConnected ? "linear-gradient(135deg, #1a1a2e, #1e1b4b)" : "#111128",
                border: `1px solid ${ablyConnected ? "#4338ca" : "#2a2a4a"}`, borderRadius: 12,
                padding: "0.75rem 1rem", cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {ablyConnected ? (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20 }}>
                    <div style={{ width: 3, background: "#818cf8", borderRadius: 1, animation: "waveform1 0.8s ease-in-out infinite" }} />
                    <div style={{ width: 3, background: "#818cf8", borderRadius: 1, animation: "waveform2 0.6s ease-in-out infinite" }} />
                    <div style={{ width: 3, background: "#818cf8", borderRadius: 1, animation: "waveform3 0.7s ease-in-out infinite" }} />
                    <div style={{ width: 3, background: "#818cf8", borderRadius: 1, animation: "waveform1 0.9s ease-in-out infinite" }} />
                    <div style={{ width: 3, background: "#818cf8", borderRadius: 1, animation: "waveform2 0.5s ease-in-out infinite" }} />
                  </div>
                ) : (
                  <div style={{ width: 16, height: 16, border: "2px solid #555", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                )}
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {ablyConnected ? "Live Transcript" : "Connecting..."}
                </span>
                {transcript.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>
                    {transcript.length} segments
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#888" }}>{showTranscript ? "Hide" : "Show"}</span>
            </button>

            {showTranscript && (
              <div style={{
                background: "#0d0d1a", border: "1px solid #2a2a4a", borderTop: "none",
                borderRadius: "0 0 12px 12px", maxHeight: 300, overflowY: "auto",
                padding: "0.75rem",
              }}>
                {transcript.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#555" }}>
                    <p style={{ fontSize: "0.85rem" }}>
                      {ablyConnected ? "Waiting for speakers..." : "Connecting to live feed..."}
                    </p>
                  </div>
                ) : (
                  transcript.map((seg) => (
                    <div key={seg.id} style={{ marginBottom: "0.5rem", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                        <span style={{ color: "#818cf8", fontWeight: 600, fontSize: "0.75rem", minWidth: 50, flexShrink: 0 }}>
                          {seg.timeLabel}
                        </span>
                        <span style={{ color: "#6366f1", fontWeight: 600, fontSize: "0.8rem", minWidth: 80, flexShrink: 0 }}>
                          {seg.speaker}
                        </span>
                        <span style={{ color: "#d1d5db" }}>{seg.text}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        )}

        {!isClosed && !isPaused && (
          <form onSubmit={handleSubmit} style={{ background: "#111128", border: "1px solid #2a2a4a", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#fff" }}>Ask a Question</h2>
            <div style={{ position: "relative" }}>
              <textarea
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder={isListening ? "Listening... speak your question" : "Type your question here..."}
                maxLength={2000}
                style={{ width: "100%", minHeight: 80, background: "#0a0a1a", border: `1px solid ${isListening ? "#6366f1" : "#2a2a4a"}`, borderRadius: 8, color: "#fff", padding: "0.75rem", paddingRight: "3rem", fontSize: "0.95rem", resize: "vertical", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  style={{
                    position: "absolute", right: 8, top: 8,
                    width: 36, height: 36, borderRadius: "50%",
                    background: isListening ? "#6366f1" : "#1a1a2e",
                    border: `1px solid ${isListening ? "#818cf8" : "#2a2a4a"}`,
                    color: isListening ? "#fff" : "#888",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", transition: "all 0.2s",
                    animation: isListening ? "pulse 1.5s infinite" : "none",
                  }}
                  title={isListening ? "Stop listening" : "Speak your question"}
                >
                  &#127908;
                </button>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#666", margin: "0.25rem 0 0.75rem" }}>
              <span>{questionText.length}/2000</span>
              {speechSupported && <span style={{ color: isListening ? "#818cf8" : "#444" }}>{isListening ? "Listening..." : "Voice input available"}</span>}
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
                {submitting ? "Submitting..." : submitted ? "Sent!" : "Submit Question"}
              </button>
            </div>
          </form>
        )}

        {(isClosed || isPaused) && (
          <div style={{ background: "#1a1a2e", border: `1px solid ${isClosed ? "#7f1d1d" : "#78350f"}`, borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
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
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#128172;</p>
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
                  <span style={{ fontSize: "1rem" }}>&#9650;</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{q.upvotes || 0}</span>
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5, color: "#e0e0e0" }}>{q.question_text}</p>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "#666" }}>
                    <span>{q.submitterName || "Anonymous"}</span>
                    {q.submitter_company && <span>- {q.submitter_company}</span>}
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{q.category}</span>
                    {q.status === "answered" && <span style={{ color: "#22c55e" }}>Answered</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasLiveStream && !isClosed && (
          <div style={{ background: "#111128", border: "1px solid #2a2a4a", borderRadius: 12, padding: "1rem", marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>
              &#127911; This session uses browser-based streaming. No dial-in number required.
            </p>
          </div>
        )}

        <footer style={{ textAlign: "center", padding: "2rem 0 1rem", fontSize: "0.75rem", color: "#444" }}>
          Powered by CuraLive - Live Webphone Q&A
        </footer>
      </main>
    </div>
  );
}
