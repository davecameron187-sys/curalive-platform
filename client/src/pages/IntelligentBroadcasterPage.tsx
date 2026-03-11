import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSmartBack } from "@/lib/useSmartBack";
import {
  ArrowLeft, Zap, AlertTriangle, TrendingDown, TrendingUp,
  MessageSquare, Shield, Activity, Bell, CheckCircle2, Clock,
  Radio, BarChart3
} from "lucide-react";

type AlertLevel = "critical" | "warning" | "info" | "success";

interface BroadcastAlert {
  id: string;
  level: AlertLevel;
  source: string;
  message: string;
  action?: string;
  timestamp: string;
  icon: React.ElementType;
}

const INITIAL_ALERTS: BroadcastAlert[] = [
  { id: "1", level: "warning", source: "Sentiment Analysis", message: "Sentiment dropped 12 points in last 2 minutes — monitor closely", action: "Suggest presenter pause for Q&A", timestamp: "00:04:32", icon: TrendingDown },
  { id: "2", level: "info", source: "Q&A Auto-Triage", message: "8 new questions submitted — 3 flagged as high priority", action: "Open Q&A queue", timestamp: "00:04:15", icon: MessageSquare },
  { id: "3", level: "success", source: "Compliance Check", message: "No compliance issues detected in last 5 minutes", timestamp: "00:03:58", icon: Shield },
  { id: "4", level: "critical", source: "Pace Coach", message: "Presenter speaking at 185 WPM — 35% above optimal rate", action: "Send pace alert to presenter", timestamp: "00:03:41", icon: Activity },
  { id: "5", level: "info", source: "Live Transcription", message: "12 languages active — 847 attendees on translated feeds", timestamp: "00:03:20", icon: Radio },
];

const LEVEL_STYLES: Record<AlertLevel, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400" },
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const METRICS = [
  { label: "Live Sentiment", value: "74%", subtext: "Positive", icon: BarChart3, color: "text-emerald-400" },
  { label: "Attendees", value: "1,247", subtext: "Active now", icon: Radio, color: "text-blue-400" },
  { label: "Q&A Queue", value: "8", subtext: "Pending", icon: MessageSquare, color: "text-amber-400" },
  { label: "Compliance", value: "98", subtext: "Score / 100", icon: Shield, color: "text-primary" },
];

export default function IntelligentBroadcasterPage() {
  const [, navigate] = useLocation();
  const goBack = useSmartBack("/");
  const [alerts, setAlerts] = useState<BroadcastAlert[]>(INITIAL_ALERTS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(272);
  const [isLive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const addAlert = () => {
      const newAlerts: BroadcastAlert[] = [
        { id: Date.now().toString(), level: "info", source: "Sentiment Analysis", message: "Sentiment recovering — up 4 points after presenter clarification", timestamp: formatTime(elapsed), icon: TrendingUp },
        { id: Date.now().toString(), level: "warning", source: "Q&A Auto-Triage", message: "Spike detected — 15 questions in 60 seconds on revenue guidance", action: "Prioritise revenue Q&A", timestamp: formatTime(elapsed), icon: MessageSquare },
        { id: Date.now().toString(), level: "success", source: "Pace Coach", message: "Presenter pace normalised — 148 WPM, within optimal range", timestamp: formatTime(elapsed), icon: Activity },
      ];
      const pick = newAlerts[Math.floor(Math.random() * newAlerts.length)];
      setAlerts(prev => [pick, ...prev.slice(0, 8)]);
    };
    const interval = setInterval(addAlert, 12000);
    return () => clearInterval(interval);
  }, [elapsed]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `00:${m}:${sec}`;
  }

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.level === "critical").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Intelligent Broadcaster</span>
            </div>
            {criticalCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                LIVE · {formatTime(elapsed)}
              </div>
            )}
            <button
              onClick={() => navigate("/live-video/webcast/ceo-town-hall-q1-2026")}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Open Studio
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {METRICS.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-muted-foreground">{m.subtext}</div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Live Alert Feed</h2>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{visibleAlerts.length} active</span>
                </div>
                <button
                  onClick={() => setDismissed(new Set(alerts.map(a => a.id)))}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {visibleAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                    <p className="text-sm">All clear — no active alerts</p>
                  </div>
                ) : (
                  visibleAlerts.map(alert => {
                    const styles = LEVEL_STYLES[alert.level];
                    const Icon = alert.icon;
                    return (
                      <div key={alert.id} className={`p-4 ${styles.bg}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${styles.bg} border ${styles.border} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${styles.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>{alert.level}</span>
                              <span className="text-xs text-muted-foreground">· {alert.source}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                                <Clock className="w-3 h-3" />{alert.timestamp}
                              </span>
                            </div>
                            <p className="text-sm">{alert.message}</p>
                            {alert.action && (
                              <button className={`mt-2 text-xs font-semibold ${styles.text} hover:underline`}>
                                → {alert.action}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => setDismissed(d => new Set([...Array.from(d), alert.id]))}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Open Q&A Queue", path: "/moderator/q4-earnings-2026", icon: MessageSquare },
                  { label: "View Compliance", path: "/compliance/dashboard", icon: Shield },
                  { label: "Presenter View", path: "/presenter/q4-earnings-2026", icon: Activity },
                  { label: "Full Analytics", path: "/analytics", icon: BarChart3 },
                  { label: "Virtual Studio", path: "/virtual-studio", icon: Radio },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left text-sm"
                    >
                      <Icon className="w-4 h-4 text-primary" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Alert Summary</h3>
              <div className="space-y-2">
                {(["critical", "warning", "info", "success"] as AlertLevel[]).map(level => {
                  const count = visibleAlerts.filter(a => a.level === level).length;
                  const styles = LEVEL_STYLES[level];
                  return (
                    <div key={level} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                        <span className="capitalize text-muted-foreground">{level}</span>
                      </div>
                      <span className={`font-semibold ${count > 0 ? styles.text : "text-muted-foreground"}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
