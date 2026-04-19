import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Question = {
  id: number;
  attendeeName: string;
  questionText: string;
  status: string;
  upvotes: number;
  submittedAt: string;
};

type Props = {
  sessionId: string;
};

const STATUS_COLOURS: Record<string, string> = {
  pending: "#facc15",
  approved: "#60a5fa",
  answered: "#4ade80",
  dismissed: "#475569",
};

export default function LiveQaDashboard({ sessionId }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "answered" | "dismissed">("pending");

  const questionsQuery = trpc.liveQa.listQuestions.useQuery(
    { sessionId, status: filter },
    { refetchInterval: 5000 }
  );

  const updateStatus = trpc.liveQa.updateQuestionStatus.useMutation({
    onSuccess: () => questionsQuery.refetch(),
  });

  const questions: Question[] = questionsQuery.data ?? [];
  const filters: typeof filter[] = ["pending", "approved", "answered", "dismissed", "all"];

  return (
    <div style={{ fontFamily: "monospace", color: "#e2e8f0" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "#1e293b" : "none",
              border: `1px solid ${filter === f ? "#3b82f6" : "#1e293b"}`,
              color: filter === f ? "#60a5fa" : "#475569",
              padding: "4px 12px",
              fontSize: "11px",
              letterSpacing: "1px",
              borderRadius: "3px",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "#475569", fontSize: "11px", alignSelf: "center" }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {questions.length === 0 && (
          <div style={{ color: "#334155", fontSize: "12px" }}>No {filter === "all" ? "" : filter} questions</div>
        )}
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              background: "#111",
              border: `1px solid #1e293b`,
              borderLeft: `3px solid ${STATUS_COLOURS[q.status] ?? "#334155"}`,
              borderRadius: "4px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>{q.attendeeName}</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#475569", fontSize: "10px" }}>▲ {q.upvotes}</span>
                <span style={{ color: STATUS_COLOURS[q.status], fontSize: "10px", letterSpacing: "1px" }}>{q.status.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>{q.questionText}</div>
            {q.status === "pending" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => updateStatus.mutate({ questionId: q.id, status: "approved" })}
                  style={{ background: "#1e40af", border: "none", color: "white", padding: "4px 10px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
                  APPROVE
                </button>
                <button onClick={() => updateStatus.mutate({ questionId: q.id, status: "dismissed" })}
                  style={{ background: "#1e293b", border: "none", color: "#475569", padding: "4px 10px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
                  DISMISS
                </button>
              </div>
            )}
            {q.status === "approved" && (
              <button onClick={() => updateStatus.mutate({ questionId: q.id, status: "answered" })}
                style={{ background: "#166534", border: "none", color: "white", padding: "4px 10px", fontSize: "10px", borderRadius: "3px", cursor: "pointer", fontFamily: "monospace" }}>
                MARK ANSWERED
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
