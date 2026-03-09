import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Activity, AlertTriangle, Loader2, RefreshCw, User } from "lucide-react";

function SentimentGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 67 ? "#10b981" : pct <= 33 ? "#ef4444" : "#f59e0b";
  const label = pct >= 67 ? "Bullish" : pct <= 33 ? "Bearish" : "Neutral";
  const angle = (pct / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full">
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 283} 283`} />
          <line
            x1="100" y1="100"
            x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
            stroke="white" strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill="white" />
        </svg>
      </div>
      <div className="text-center -mt-2">
        <p className="text-4xl font-bold text-white">{score}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function MiniChart({ history }: { history: Array<{ overallScore: number; snapshotAt: Date | string }> }) {
  if (history.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-slate-600 text-xs">
        Collecting data points...
      </div>
    );
  }
  const scores = history.map(h => h.overallScore);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;
  const w = 400, h = 80, pad = 10;
  const points = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((s - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => {
        const x = pad + (i / (scores.length - 1)) * (w - 2 * pad);
        const y = h - pad - ((s - min) / range) * (h - 2 * pad);
        return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
      })}
    </svg>
  );
}

export default function SentimentDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, navigate] = useLocation();
  const [analysing, setAnalysing] = useState(false);

  const { data: live, refetch: refetchLive } = trpc.sentiment.getLiveScore.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId, refetchInterval: 30000 }
  );

  const { data: history, refetch: refetchHistory } = trpc.sentiment.getSentimentHistory.useQuery(
    { eventId: eventId ?? "", limit: 20 },
    { enabled: !!eventId }
  );

  const { data: speakers } = trpc.sentiment.getSpeakerSentiment.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId }
  );

  const analyseSegment = trpc.sentiment.analyseSegment.useMutation({
    onMutate: () => setAnalysing(true),
    onSuccess: (data) => {
      if (data.spike) {
        toast.warning(`Sentiment spike detected! ${data.direction === "up" ? "+" : ""}${data.change} points`);
      } else {
        toast.success(`Sentiment updated: ${data.score}`);
      }
      refetchLive();
      refetchHistory();
      setAnalysing(false);
    },
    onError: (e) => { toast.error(e.message); setAnalysing(false); },
  });

  const score = live?.score ?? 50;
  const trend = live?.trend ?? "neutral";
  const TrendIcon = trend === "bullish" ? TrendingUp : trend === "bearish" ? TrendingDown : Minus;
  const trendColor = trend === "bullish" ? "text-emerald-400" : trend === "bearish" ? "text-red-400" : "text-amber-400";

  const historyData = (history ?? []).map(h => ({
    overallScore: h.overallScore,
    snapshotAt: h.snapshotAt,
  }));

  const drivers: any[] = live?.topDrivers ?? [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/operator/${eventId}`)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Live Sentiment</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <button
          onClick={() => analyseSegment.mutate({ eventId: eventId ?? "", transcriptSegment: "Sample segment for demonstration", currentScore: score })}
          disabled={analysing}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-600/40 rounded text-xs font-medium text-indigo-200 transition-colors"
        >
          {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {analysing ? "Analysing..." : "Refresh Sentiment"}
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center">
            <SentimentGauge score={score} />
            <div className="flex items-center gap-1.5 mt-3">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-medium capitalize ${trendColor}`}>{trend}</span>
            </div>
            {live?.lastUpdated && (
              <p className="text-xs text-slate-600 mt-1.5">
                Updated {new Date(live.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Sentiment Timeline</h3>
              <span className="text-xs text-slate-500">{historyData.length} data point{historyData.length !== 1 ? "s" : ""}</span>
            </div>
            <MiniChart history={historyData} />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Bullish", value: live?.bullishCount ?? 0, color: "text-emerald-400" },
                { label: "Neutral", value: live?.neutralCount ?? 0, color: "text-amber-400" },
                { label: "Bearish", value: live?.bearishCount ?? 0, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-slate-900/40 rounded p-2">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Speaker Sentiment
            </h3>
            <div className="space-y-3">
              {(speakers ?? []).map((s: any) => {
                const spColor = s.score >= 67 ? "bg-emerald-500" : s.score <= 33 ? "bg-red-500" : "bg-amber-500";
                return (
                  <div key={s.speaker}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{s.speaker}</span>
                      <span className={`font-bold ${s.score >= 67 ? "text-emerald-400" : s.score <= 33 ? "text-red-400" : "text-amber-400"}`}>{s.score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${spColor}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{s.segments} segment{s.segments !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
              {(!speakers || speakers.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-3">No speaker data yet</p>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-400" /> Sentiment Drivers
            </h3>
            <div className="space-y-2">
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No drivers data yet. Click "Refresh Sentiment" to analyse.</p>
              ) : drivers.map((d: any, i: number) => (
                <div key={i} className="bg-slate-900/40 rounded p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-medium ${d.impact === "positive" ? "text-emerald-400" : "text-red-400"}`}>
                      {d.impact === "positive" ? "+" : "–"} {d.strength}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{d.factor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-xs text-indigo-300">
          Sentiment updates automatically every 30 seconds using Ably real-time channels. Alerts fire for changes of 15+ points.
        </div>
      </div>
    </div>
  );
}
