import { useState } from "react";
import { trpc } from "../lib/trpc";

interface QAPatternPanelProps {
  sessionId: number;
  isLive?: boolean;
}

export function QAPatternPanel({ sessionId, isLive = true }: QAPatternPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { data } = trpc.qaAnalytics.getLiveQAPatterns.useQuery(
    { sessionId },
    {
      refetchInterval: isLive ? 15_000 : false,
      enabled: !!sessionId,
    }
  );

  const firms = data?.firms ?? [];
  const alerts = (data?.alerts ?? []).filter(
    (a: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.firm === a.firm) === i
  );
  const totalQuestions = data?.totalQuestions ?? 0;

  const S: Record<string, React.CSSProperties> = {
    container: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.02)',
      borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer',
      userSelect: 'none' as const,
    },
    headerTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: 'rgba(255,255,255,0.5)',
      letterSpacing: '.08em',
      textTransform: 'uppercase' as const,
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    alertBadge: {
      background: 'rgba(192,41,26,0.2)',
      border: '1px solid rgba(192,41,26,0.35)',
      color: '#ff8a80',
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 4,
    },
    body: {
      padding: '12px 14px',
    },
  };

  return (
    <div style={S.container}>
      <div style={S.header} onClick={() => setCollapsed(c => !c)}>
        <div style={S.headerTitle}>
          Q&A Patterns {totalQuestions > 0 ? `· ${totalQuestions} questions` : ''}
        </div>
        <div style={S.badge}>
          {alerts.length > 0 && (
            <span style={S.alertBadge}>
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            {collapsed ? '\u25BC' : '\u25B2'}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div style={S.body}>

          {alerts.map((alert, i) => (
            <div key={i} style={{
              background: alert.severity === 'critical'
                ? 'rgba(192,41,26,0.12)' : 'rgba(186,117,23,0.1)',
              border: `1px solid ${alert.severity === 'critical'
                ? 'rgba(192,41,26,0.3)' : 'rgba(186,117,23,0.25)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: alert.severity === 'critical' ? '#ff8a80' : '#ffc947',
                marginBottom: 3,
              }}>
                Coordinated questioning — {alert.firm}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {alert.count} questions in the last 10 minutes.
                Possible coordinated institutional strategy.
              </div>
            </div>
          ))}

          {firms.length === 0 ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0' }}>
              No questions submitted yet
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 48px 48px',
                gap: '0 8px',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '.06em',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span>Firm</span>
                <span style={{ textAlign: 'right' as const }}>Qs</span>
                <span style={{ textAlign: 'right' as const }}>%</span>
              </div>

              {firms.map((firm: any, i: number) => (
                <div key={firm.firm} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 48px 48px',
                  gap: '0 8px',
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      color: i === 0 ? '#6ee7c0' : 'rgba(255,255,255,0.65)',
                      fontWeight: i === 0 ? 600 : 400,
                      marginBottom: 3,
                    }}>
                      {firm.firm}
                    </div>
                    <div style={{
                      height: 3,
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${firm.pct}%`,
                        background: firm.riskCount > 0
                          ? 'linear-gradient(90deg,#ff8a80,#ffc947)'
                          : 'linear-gradient(90deg,#6ee7c0,#1D9E75)',
                        borderRadius: 2,
                        transition: 'width .3s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right' as const,
                    fontSize: 13,
                    fontWeight: 600,
                    color: firm.riskCount > 0
                      ? '#ffc947' : 'rgba(255,255,255,0.6)',
                  }}>
                    {firm.count}
                    {firm.riskCount > 0 && (
                      <span style={{ fontSize: 9, color: '#ff8a80', marginLeft: 3 }}>
                        !{firm.riskCount}
                      </span>
                    )}
                  </div>
                  <div style={{
                    textAlign: 'right' as const,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                  }}>
                    {firm.pct}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.timeline && data.timeline.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
              }}>
                Question volume (10-min windows)
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
                {data.timeline.map((t: any, i: number) => {
                  const maxCount = Math.max(...data.timeline.map((x: any) => x.count));
                  const pct = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={i}
                      title={`${t.count} questions`}
                      style={{
                        flex: 1,
                        height: `${Math.max(pct, 8)}%`,
                        background: pct > 70
                          ? 'rgba(192,41,26,0.6)'
                          : 'rgba(29,158,117,0.4)',
                        borderRadius: '2px 2px 0 0',
                        minHeight: 3,
                        transition: 'height .3s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div style={{
            marginTop: 10,
            fontSize: 10,
            color: 'rgba(255,255,255,0.15)',
            textAlign: 'right' as const,
          }}>
            Auto-refreshes every 30s
          </div>
        </div>
      )}
    </div>
  );
}
