import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Activity, AlertTriangle, Loader2, RefreshCw, User, X } from "lucide-react";
import { AblyProvider, useAbly } from "@/contexts/AblyContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function SentimentGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 67 ? "#10b981" : pct <= 33 ? "#ef4444" : "#f59e0b";
  const label = pct >= 67 ? "Bullish" : pct <= 33 ? "Bearish" : "Neutral";
  const angle = (pct / 100) * 180 - 180; // needle logic

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Background track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
          {/* Colored track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 251.3} 251.3`} />
          {/* Needle */}
          <line
            x1="100" y1="100"
            x2={100 + 75 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 75 * Math.sin((angle * Math.PI) / 180)}
            stroke="white" strokeWidth="4" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="white" />
        </svg>
      </div>
      <div className="text-center -mt-2">
        <p className="text-4xl font-bold text-white">{score}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function SentimentTimeline({ history }: { history: Array<{ overallScore: number; snapshotAt: Date | string }> }) {
  const data = useMemo(() => ({
    labels: history.map(h => new Date(h.snapshotAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [
      {
        label: 'Sentiment Score',
        data: history.map(h => h.overallScore),
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
      }
    ]
  }), [history]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: '#334155' },
        ticks: { color: '#94a3b8', stepSize: 25 }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}

function SentimentDashboardInner({ eventId }: { eventId: string }) {
  const [, navigate] = useLocation();
  const [analysing, setAnalysing] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [spikeAlert, setSpikeAlert] = useState<{ magnitude: number; direction: string } | null>(null);

  const { sentiment: ablySentiment } = useAbly();

  const { data: live, refetch: refetchLive } = trpc.sentiment.getLiveScore.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId, refetchInterval: 30000 }
  );

  const { data: history, refetch: refetchHistory } = trpc.sentiment.getSentimentHistory.useQuery(
    { eventId: eventId ?? "", limit: 50 },
    { enabled: !!eventId }
  );

  const { data: speakers, refetch: refetchSpeakers } = trpc.sentiment.getSpeakerSentiment.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId }
  );

  const triggerSnapshot = trpc.sentiment.triggerSnapshot.useMutation({
    onMutate: () => setAnalysing(true),
    onSuccess: () => {
      refetchLive();
      refetchHistory();
      refetchSpeakers();
      setAnalysing(false);
      toast.success("Sentiment snapshot triggered");
    },
    onError: (e) => { toast.error(e.message); setAnalysing(false); },
  });

  // Handle Ably updates and spikes
  useEffect(() => {
    if (ablySentiment) {
      if (lastScore !== null) {
        const diff = ablySentiment.score - lastScore;
        if (Math.abs(diff) >= 15) {
          setSpikeAlert({ magnitude: Math.abs(diff), direction: diff > 0 ? "up" : "down" });
        }
      }
      setLastScore(ablySentiment.score);
      refetchLive();
      refetchHistory();
      refetchSpeakers();
    }
  }, [ablySentiment]);

  const score = ablySentiment?.score ?? live?.score ?? 50;
  const trend = score >= 67 ? "bullish" : score <= 33 ? "bearish" : "neutral";
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
            <h1 className="text-lg font-bold text-white">Live Sentiment Dashboard</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <button
          onClick={() => triggerSnapshot.mutate({ eventId: eventId ?? "" })}
          disabled={analysing}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-600/40 rounded text-xs font-medium text-indigo-200 transition-colors"
        >
          {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {analysing ? "Analysing..." : "Refresh Snapshot"}
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {spikeAlert && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sentiment Spike Detected!</h4>
                <p className="text-xs text-slate-400">
                  Sentiment shifted {spikeAlert.direction === "up" ? "positively" : "negatively"} by {spikeAlert.magnitude} points in the last update.
                </p>
              </div>
            </div>
            <button onClick={() => setSpikeAlert(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
            <SentimentGauge score={score} />
            <div className="flex items-center gap-1.5 mt-4">
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              <span className={`text-lg font-bold capitalize ${trendColor}`}>{trend}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Based on real-time transcript analysis
            </p>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Bullish Signals", value: live?.bullishCount ?? 0, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Neutral Signals", value: live?.neutralCount ?? 0, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Bearish Signals", value: live?.bearishCount ?? 0, color: "text-red-400", bg: "bg-red-500/10" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center`}>
                <p className={`text-4xl font-black ${color}`}>{value}</p>
                <p className="text-sm font-medium text-slate-400 mt-1">{label}</p>
              </div>
            ))}
            
            <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white">Sentiment Timeline</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Score
                  </div>
                  <span className="text-xs text-slate-500">{historyData.length} data points</span>
                </div>
              </div>
              <SentimentTimeline history={historyData} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Per-Speaker Sentiment
            </h3>
            <div className="space-y-4">
              {(speakers ?? []).map((s: any) => {
                const spColor = s.score >= 67 ? "bg-emerald-500" : s.score <= 33 ? "bg-red-500" : "bg-amber-500";
                return (
                  <div key={s.speaker} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{s.speaker}</span>
                        <span className="text-xs text-slate-500">{s.segments} segments analyzed</span>
                      </div>
                      <span className={`text-lg font-black ${s.score >= 67 ? "text-emerald-400" : s.score <= 33 ? "text-red-400" : "text-amber-400"}`}>{s.score}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${s.bullish}%` }} />
                      <div className="h-full bg-amber-500 transition-all" style={{ width: `${s.neutral}%` }} />
                      <div className="h-full bg-red-500 transition-all" style={{ width: `${s.bearish}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      <span>Bullish {s.bullish}%</span>
                      <span>Neutral {s.neutral}%</span>
                      <span>Bearish {s.bearish}%</span>
                    </div>
                  </div>
                );
              })}
              {(!speakers || speakers.length === 0) && (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No speaker data available yet
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-indigo-400" /> Sentiment Drivers
            </h3>
            <div className="space-y-3">
              {drivers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No drivers identified yet. Refresh snapshot to analyze.
                </div>
              ) : drivers.map((d: any, i: number) => (
                <div key={i} className="bg-slate-800/40 border border-slate-800/60 rounded-xl p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${d.impact === "positive" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {d.impact}
                      </span>
                      <span className="text-[10px] font-black uppercase text-slate-500">Strength: {d.strength}</span>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">{d.factor}</p>
                  </div>
                  {d.impact === "positive" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex items-center gap-3 text-xs text-indigo-300/80">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <p>
            Real-time sentiment monitoring is active. Data is processed in 30-second windows and pushed via Ably. 
            Confidence threshold: 85%. Alerts are triggered for sentiment swings exceeding 15 points.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SentimentDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) return <div className="p-8 text-center text-red-400">No event ID provided</div>;
  return (
    <AblyProvider eventId={eventId}>
      <SentimentDashboardInner eventId={eventId} />
    </AblyProvider>
  );
}
