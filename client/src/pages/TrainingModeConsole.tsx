/**
 * TrainingModeConsole — Operator training environment with full data isolation.
 * Route: /training-mode
 * All data written here goes to dedicated training tables, never production.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, Play, Pause, CheckCircle2, Plus, Users, Phone,
  BarChart2, FileText, ArrowLeft, Clock, Star, Activity, BookOpen
} from "lucide-react";

const SCENARIOS = [
  { value: "earnings-call", label: "Earnings Call" },
  { value: "roadshow", label: "Roadshow" },
  { value: "webcast", label: "Video Webcast" },
  { value: "audio-bridge", label: "Audio Bridge" },
  { value: "board-meeting", label: "Board Meeting" },
  { value: "general", label: "General Practice" },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 4 ? "text-emerald-400" : score >= 3 ? "text-amber-400" : "text-red-400";
  return <span className={`font-bold ${color}`}>{score.toFixed(1)}</span>;
}

export default function TrainingModeConsole() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"sessions" | "new" | "metrics">("sessions");
  const [sessionName, setSessionName] = useState("");
  const [scenario, setScenario] = useState<string>("earnings-call");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const { data: sessionsData, refetch: refetchSessions } = trpc.trainingMode.getOperatorSessions.useQuery({ operatorId: undefined });
  const { data: metricsData } = trpc.trainingMode.getSessionMetrics.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession }
  );

  const createSession = trpc.trainingMode.createSession.useMutation({
    onSuccess: (data) => {
      toast.success("Training session started");
      setSelectedSession(data.sessionId);
      setSessionName("");
      setActiveTab("metrics");
      refetchSessions();
    },
    onError: (e) => toast.error(e.message),
  });

  const completeSession = trpc.trainingMode.completeSession.useMutation({
    onSuccess: () => {
      toast.success("Session marked as complete");
      refetchSessions();
      setSelectedSession(null);
      setActiveTab("sessions");
    },
    onError: (e) => toast.error(e.message),
  });

  const sessions = sessionsData?.sessions ?? [];
  const metrics = metricsData?.metrics;
  const callLogs = metricsData?.callLogs ?? [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/occ")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Training Mode Console</h1>
            <p className="text-xs text-slate-400">Data isolated — no production impact</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium">
            TRAINING ENVIRONMENT
          </span>
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        {[
          { id: "sessions", label: "My Sessions", icon: BookOpen },
          { id: "new", label: "New Session", icon: Plus },
          { id: "metrics", label: "Performance", icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Training Sessions</h2>
              <button
                onClick={() => setActiveTab("new")}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded text-xs font-medium text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No training sessions yet</p>
                <button
                  onClick={() => setActiveTab("new")}
                  className="mt-3 text-violet-400 hover:text-violet-300 text-sm underline"
                >
                  Start your first session
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSession(s.id); setActiveTab("metrics"); }}
                    className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 cursor-pointer hover:border-violet-500/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{s.sessionName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {SCENARIOS.find(sc => sc.value === s.scenario)?.label} ·{" "}
                        {new Date(s.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                        s.status === "completed" ? "bg-slate-600/40 text-slate-300" :
                        "bg-amber-500/20 text-amber-300"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "new" && (
          <div className="max-w-md space-y-5">
            <h2 className="text-base font-semibold text-white">Start New Training Session</h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Session Name</label>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Q4 Earnings Call Practice"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Scenario</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400 space-y-1">
              <p className="text-slate-300 font-medium mb-2">Data isolation guarantee</p>
              <p>✓ All session data stored in dedicated training tables</p>
              <p>✓ Zero impact on live conferences or production participants</p>
              <p>✓ Can be archived or deleted independently</p>
            </div>

            <button
              onClick={() => {
                if (!sessionName.trim()) { toast.error("Please enter a session name"); return; }
                createSession.mutate({ sessionName: sessionName.trim(), scenario: scenario as any });
              }}
              disabled={createSession.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded font-medium text-sm text-white transition-colors"
            >
              <Play className="w-4 h-4" />
              {createSession.isPending ? "Starting..." : "Start Session"}
            </button>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="space-y-6">
            {!selectedSession ? (
              <div className="text-center py-16 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a session to view performance metrics</p>
                <button onClick={() => setActiveTab("sessions")} className="mt-3 text-violet-400 hover:text-violet-300 text-sm underline">
                  View sessions
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Overall Score", value: metricsData?.overallScore?.toFixed(1) ?? "—", icon: Star },
                    { label: "Calls Handled", value: metrics?.totalCallsHandled ?? 0, icon: Phone },
                    { label: "Avg Duration", value: metrics ? `${Math.round((metrics.averageCallDuration ?? 0) / 60)}m` : "—", icon: Clock },
                    { label: "Ready for Prod", value: metrics?.readyForProduction ? "Yes" : "No", icon: CheckCircle2 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-violet-400" />
                        <span className="text-xs text-slate-400">{label}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {metrics && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Performance Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: "Communication", value: parseFloat(metrics.communicationScore) },
                        { label: "Problem Solving", value: parseFloat(metrics.problemSolvingScore) },
                        { label: "Professionalism", value: parseFloat(metrics.professionalism) },
                        { label: "Call Quality", value: parseFloat(metrics.callQualityScore) },
                        { label: "Participant Sat.", value: parseFloat(metrics.averageParticipantSatisfaction) },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">{label}</span>
                            <ScoreBadge score={value} />
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${(value / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {metrics.mentorNotes && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Mentor Notes</p>
                        <p className="text-sm text-slate-300">{metrics.mentorNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {callLogs.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Call Log ({callLogs.length})</h3>
                    <div className="space-y-2">
                      {callLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                          <div>
                            <p className="text-sm text-white">{log.participantName}</p>
                            <p className="text-xs text-slate-400">{Math.round(log.callDuration / 60)}m · {log.callQuality}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            log.callQuality === "excellent" ? "bg-emerald-500/20 text-emerald-300" :
                            log.callQuality === "good" ? "bg-blue-500/20 text-blue-300" :
                            log.callQuality === "fair" ? "bg-amber-500/20 text-amber-300" :
                            "bg-red-500/20 text-red-300"
                          }`}>
                            {log.callQuality}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessions.find(s => s.id === selectedSession)?.status === "active" && (
                  <button
                    onClick={() => completeSession.mutate({ sessionId: selectedSession, finalOverallScore: metricsData?.overallScore ?? 3, readyForProduction: false })}
                    disabled={completeSession.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {completeSession.isPending ? "Completing..." : "Mark Session Complete"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
