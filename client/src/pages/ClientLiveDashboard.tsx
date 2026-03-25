import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  setup: { label: "Setting Up", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  ready: { label: "Ready", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  live: { label: "Live", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  completed: { label: "Completed", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "#60a5fa",
  low: "#34d399",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export default function ClientLiveDashboard() {
  const [, params] = useRoute("/live/:token");
  const token = params?.token ?? "";

  const { data, isLoading, error, refetch } = trpc.lumiBooking.clientDashboard.useQuery(
    { token },
    { enabled: !!token, refetchInterval: false }
  );

  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!data || !autoRefresh) return;
    if (data.isCompleted) return;
    const interval = setInterval(() => refetch(), data.isLive ? 4000 : 10000);
    return () => clearInterval(interval);
  }, [data, autoRefresh, refetch]);

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={{ margin: 0, color: "#f87171" }}>Invalid Dashboard Link</h2>
          <p style={{ color: "#94a3b8" }}>Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={{ color: "#94a3b8", marginTop: 16 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={{ margin: 0, color: "#f87171" }}>Dashboard Not Found</h2>
          <p style={{ color: "#94a3b8" }}>This dashboard link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const { booking, session, resolutions, observations, isLive, isCompleted } = data;
  const statusInfo = STATUS_LABELS[booking.status] ?? STATUS_LABELS.booked;

  const sentiment = session?.overallSentiment ?? "Awaiting data";
  const sentimentColor = sentiment === "Positive" ? "#34d399"
    : sentiment === "Negative" ? "#f87171"
    : sentiment === "Neutral" ? "#f59e0b" : "#64748b";

  const complianceAlerts = observations.filter(o =>
    o.severity === "high" || o.severity === "critical"
  ).length;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.logo}>CuraLive</div>
          <span style={{ color: "#475569", fontSize: 14 }}>|</span>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>AGM Intelligence Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            ...styles.statusBadge,
            color: statusInfo.color,
            background: statusInfo.bg,
          }}>
            {isLive && <span style={styles.liveDot} />}
            {statusInfo.label}
          </div>
        </div>
      </header>

      <div style={styles.titleCard}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#f1f5f9" }}>{booking.agmTitle}</h1>
        <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
          <span style={styles.metaItem}>
            <span style={{ color: "#64748b" }}>Client:</span> {booking.clientName}
          </span>
          {booking.agmDate && (
            <span style={styles.metaItem}>
              <span style={{ color: "#64748b" }}>Date:</span> {booking.agmDate}
            </span>
          )}
          <span style={styles.metaItem}>
            <span style={{ color: "#64748b" }}>Jurisdiction:</span> {(booking.jurisdiction ?? "").replace(/_/g, " ")}
          </span>
          {booking.expectedAttendees && (
            <span style={styles.metaItem}>
              <span style={{ color: "#64748b" }}>Expected:</span> {booking.expectedAttendees} attendees
            </span>
          )}
        </div>
      </div>

      {!isLive && !isCompleted && (
        <div style={styles.waitingCard}>
          <div style={styles.waitingIcon}>⏳</div>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: 20 }}>Preparing for Your AGM</h2>
          <p style={{ color: "#94a3b8", margin: "8px 0 0" }}>
            CuraLive intelligence will activate when the session goes live. Check back shortly before your AGM start time.
          </p>
        </div>
      )}

      {(isLive || isCompleted) && (
        <>
          <div style={styles.metricsRow}>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Overall Sentiment</div>
              <div style={{ ...styles.metricValue, color: sentimentColor }}>{sentiment}</div>
              {session?.sentimentSummary && (
                <div style={styles.metricDetail}>{session.sentimentSummary}</div>
              )}
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Resolutions Tracked</div>
              <div style={styles.metricValue}>{resolutions.length}</div>
              <div style={styles.metricDetail}>
                {resolutions.filter(r => r.predictedOutcome === "pass").length} predicted to pass
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Compliance Alerts</div>
              <div style={{
                ...styles.metricValue,
                color: complianceAlerts > 0 ? "#f97316" : "#34d399",
              }}>
                {complianceAlerts}
              </div>
              <div style={styles.metricDetail}>
                {complianceAlerts === 0 ? "No issues detected" : `${complianceAlerts} alert(s) requiring attention`}
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Intelligence Insights</div>
              <div style={styles.metricValue}>{observations.length}</div>
              <div style={styles.metricDetail}>AI-generated observations</div>
            </div>
          </div>

          {resolutions.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Resolution Tracking</h2>
              <div style={styles.resolutionGrid}>
                {resolutions.map((r, i) => (
                  <div key={i} style={styles.resolutionCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={styles.resNum}>#{r.number}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{r.title}</span>
                      </div>
                      <span style={{
                        ...styles.outcomeBadge,
                        color: r.predictedOutcome === "pass" ? "#34d399" : r.predictedOutcome === "fail" ? "#f87171" : "#f59e0b",
                        background: r.predictedOutcome === "pass" ? "rgba(52,211,153,0.12)" : r.predictedOutcome === "fail" ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)",
                      }}>
                        {r.predictedOutcome ?? "Pending"}
                      </span>
                    </div>
                    {r.category && (
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{r.category}</div>
                    )}
                    {r.confidence != null && (
                      <div style={{ marginTop: 8 }}>
                        <div style={styles.confidenceBar}>
                          <div style={{ ...styles.confidenceFill, width: `${(r.confidence * 100).toFixed(0)}%` }} />
                        </div>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                          {(r.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {observations.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Intelligence Feed</h2>
              <div style={styles.observationList}>
                {observations.map((o, i) => (
                  <div key={i} style={styles.observationItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        ...styles.severityDot,
                        background: SEVERITY_COLORS[o.severity] ?? "#64748b",
                      }} />
                      <span style={{ color: "#e2e8f0", fontWeight: 500, fontSize: 14 }}>{o.title}</span>
                      <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>
                        {o.algorithm?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, paddingLeft: 20 }}>
                      {o.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCompleted && (
            <div style={styles.completedCard}>
              <h2 style={{ margin: 0, color: "#a78bfa", fontSize: 20 }}>AGM Completed</h2>
              <p style={{ color: "#94a3b8", margin: "8px 0 0" }}>
                This AGM session has concluded. The governance report and insights above reflect the final analysis.
              </p>
            </div>
          )}
        </>
      )}

      <footer style={styles.footer}>
        <span style={{ color: "#475569", fontSize: 12 }}>
          Powered by CuraLive AGM Intelligence
        </span>
        {isLive && (
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              ...styles.refreshBtn,
              opacity: autoRefresh ? 1 : 0.6,
            }}
          >
            {autoRefresh ? "Auto-refreshing" : "Paused"} — click to {autoRefresh ? "pause" : "resume"}
          </button>
        )}
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #060a10 0%, #0c1220 100%)",
    color: "#e2e8f0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "0 0 40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    background: "rgba(6,10,16,0.9)",
    backdropFilter: "blur(12px)",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#ef4444",
    animation: "pulse 2s infinite",
    display: "inline-block",
  },
  titleCard: {
    margin: "24px 24px 0",
    padding: "24px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.08)",
  },
  metaItem: {
    fontSize: 14,
    color: "#94a3b8",
    textTransform: "capitalize" as const,
  },
  waitingCard: {
    margin: "24px",
    padding: "48px 24px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.08)",
    textAlign: "center" as const,
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    margin: "24px 24px 0",
  },
  metricCard: {
    padding: "20px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.08)",
  },
  metricLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#f1f5f9",
    marginTop: 4,
  },
  metricDetail: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    margin: "24px 24px 0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: 12,
  },
  resolutionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 12,
  },
  resolutionCard: {
    padding: "16px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.08)",
  },
  resNum: {
    color: "#60a5fa",
    fontWeight: 700,
    marginRight: 8,
    fontSize: 14,
  },
  outcomeBadge: {
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "capitalize" as const,
    whiteSpace: "nowrap" as const,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    background: "rgba(148,163,184,0.12)",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2,
    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
    transition: "width 0.5s ease",
  },
  observationList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  observationItem: {
    padding: "12px 16px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.08)",
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-block",
  },
  completedCard: {
    margin: "24px",
    padding: "32px 24px",
    background: "rgba(167,139,250,0.06)",
    borderRadius: 12,
    border: "1px solid rgba(167,139,250,0.15)",
    textAlign: "center" as const,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    marginTop: 24,
  },
  refreshBtn: {
    background: "none",
    border: "1px solid rgba(148,163,184,0.15)",
    color: "#64748b",
    fontSize: 12,
    padding: "4px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  errorCard: {
    margin: "120px auto",
    maxWidth: 400,
    padding: "48px 32px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(248,113,113,0.2)",
    textAlign: "center" as const,
  },
  loadingCard: {
    margin: "120px auto",
    maxWidth: 400,
    padding: "48px 32px",
    background: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.08)",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(148,163,184,0.15)",
    borderTopColor: "#60a5fa",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
