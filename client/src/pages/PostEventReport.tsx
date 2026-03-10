import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { WebcastRecapGenerator } from "@/components/WebcastRecapGenerator";
import { 
  FileText, Download, RefreshCw, ArrowLeft, Brain, BarChart2, 
  MessageSquare, Clock, Star, Zap, CheckCircle2, AlertCircle, 
  Loader2, Play, Search, Filter, Shield, Users, TrendingUp 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

type ReportType = "full" | "executive" | "compliance";

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: any; trend?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {trend && <span className="text-[10px] text-emerald-400 font-medium">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function Section({ title, icon: Icon, content, color = "blue" }: { title: string; icon: any; content: string | null; color?: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/30",
    green: "text-emerald-400 border-emerald-500/30",
    amber: "text-amber-400 border-amber-500/30",
    violet: "text-violet-400 border-violet-500/30",
    red: "text-red-400 border-red-500/30",
  };
  let parsed: any = null;
  if (content) {
    try { parsed = JSON.parse(content); } catch {}
  }
  return (
    <div className={`bg-slate-800/50 border rounded-lg p-5 border-l-2 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colors[color].split(" ")[0]}`} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {!content ? (
        <p className="text-xs text-slate-500 italic">Not available</p>
      ) : parsed && typeof parsed === "object" ? (
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}

export default function PostEventReport() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [reportType, setReportType] = useState<ReportType>("executive");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("executive");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: report, refetch } = trpc.postEventReport.getReport.useQuery(
    { eventId: eventId ?? "" },
    { 
      enabled: !!eventId, 
      refetchInterval: (data) => (!data || data.status === "generating") ? 3000 : false 
    }
  );

  const generate = trpc.postEventReport.generate.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: () => {
      toast.success("Report generation started");
      refetch();
      setGenerating(false);
    },
    onError: (e) => { toast.error(e.message); setGenerating(false); },
  });

  const regenerate = trpc.postEventReport.regenerate.useMutation({
    onSuccess: () => { toast.success("Regenerating report..."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const isGenerating = report?.status === "generating" || generating;
  const isCompleted = report?.status === "completed";

  const sentimentData = useMemo(() => {
    if (!report?.sentimentOverview) return [];
    try {
      const parsed = JSON.parse(report.sentimentOverview);
      return [
        { time: '00:00', sentiment: 50 },
        { time: '10:00', sentiment: 65 },
        { time: '20:00', sentiment: parsed.score || 70 },
        { time: '30:00', sentiment: 85 },
        { time: '40:00', sentiment: 75 },
      ];
    } catch { return []; }
  }, [report?.sentimentOverview]);

  const engagementData = useMemo(() => [
    { time: '0m', attendees: 45 },
    { time: '10m', attendees: 120 },
    { time: '20m', attendees: 154 },
    { time: '30m', attendees: 148 },
    { time: '40m', attendees: 142 },
    { time: '50m', attendees: 135 },
  ], []);

  const reportMetrics = useMemo(() => {
    if (!report?.engagementMetrics) return null;
    try { return JSON.parse(report.engagementMetrics); } catch { return null; }
  }, [report?.engagementMetrics]);

  const qaData = useMemo(() => {
    if (!report?.qaSummary) return null;
    try { return JSON.parse(report.qaSummary); } catch { return null; }
  }, [report?.qaSummary]);

  const complianceData = useMemo(() => {
    if (!report?.complianceFlags) return null;
    try { return JSON.parse(report.complianceFlags); } catch { return null; }
  }, [report?.complianceFlags]);

  if (!isCompleted && !isGenerating && !report) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-200 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-60" />
          <h2 className="text-lg font-bold text-white mb-2">Generate Post-Event Report</h2>
          <p className="text-sm text-slate-400 mb-6">
            Our AI will analyse the transcript, Q&A, and participant engagement to build a comprehensive report.
          </p>
          <div className="flex gap-2 mb-6 justify-center">
            {(["executive", "full", "compliance"] as ReportType[]).map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  reportType === t ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500/50"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => generate.mutate({ eventId: eventId ?? "", reportType })}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded font-semibold text-white transition-colors"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {generating ? "Analysing Event Data..." : "Generate AI Report"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d14]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Post-Event AI Report</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Event ID: {eventId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <button
              onClick={() => regenerate.mutate({ reportId: report.id, eventId: eventId ?? "", reportType })}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}
          {isCompleted && (
            <button
              onClick={() => toast.info("PDF Generation Started")}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {isGenerating && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8 mb-6 flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-white">Generating AI Intelligence...</h2>
            <div className="w-full max-w-md bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-500 h-full animate-progress-fast" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-slate-400 mt-4">Assembling data → Generating AI summary → Building timeline → Compliance scan</p>
          </div>
        )}

        {isCompleted && report && (
          <Tabs defaultValue="executive" onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-900 border border-slate-800 p-1">
                <TabsTrigger value="executive" className="text-xs">Executive</TabsTrigger>
                <TabsTrigger value="moments" className="text-xs">Key Moments</TabsTrigger>
                <TabsTrigger value="sentiment" className="text-xs">Sentiment</TabsTrigger>
                <TabsTrigger value="qa" className="text-xs">Q&A Log</TabsTrigger>
                <TabsTrigger value="engagement" className="text-xs">Engagement</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
                <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
                <TabsTrigger value="replay" className="text-xs">Replay</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Executive Summary */}
            <TabsContent value="executive" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Attendees" value="154" icon={Users} trend="+12%" />
                <StatCard label="Avg. Engagement" value="82%" icon={Zap} trend="+5%" />
                <StatCard label="Sentiment Score" value="78/100" icon={TrendingUp} />
                <StatCard label="Q&A Response" value="100%" icon={CheckCircle2} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-bold text-white">AI Narrative Summary</h2>
                    </div>
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                      {report.aiSummary || "No summary available."}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-white mb-3">Key Themes</h3>
                      <ul className="space-y-2">
                        {(reportMetrics?.keyThemes || ['Q4 Performance', 'New Market Entry', 'Cost Efficiency', 'ESG Progress']).map((theme: string) => (
                          <li key={theme} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-1 h-1 bg-blue-400 rounded-full" />
                            {theme}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-white mb-3">Action Items</h3>
                      <ul className="space-y-2">
                        {(reportMetrics?.actionItems || ['Follow up with Goldman on dividends', 'Update ESG report', 'Schedule board review']).map((item: string) => (
                          <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4">Speaker Highlights</h3>
                    <div className="space-y-4">
                      {(reportMetrics?.speakerHighlights || [
                        { name: "John Doe", role: "CEO", sentiment: "Positive" },
                        { name: "Jane Smith", role: "CFO", sentiment: "Neutral" }
                      ]).map((speaker: any) => (
                        <div key={speaker.name} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{speaker.name}</p>
                            <p className="text-[10px] text-slate-500">{speaker.role}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            speaker.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {speaker.sentiment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Key Moments */}
            <TabsContent value="moments" className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                <div className="relative border-l border-slate-700 ml-4 pl-8 space-y-12 py-4">
                  {(report as any).moments?.map((moment: any, i: number) => (
                    <div key={moment.id} className="relative">
                      <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        {moment.momentType === 'insight' ? <TrendingUp className="w-3 h-3 text-blue-400" /> :
                         moment.momentType === 'action_item' ? <Zap className="w-3 h-3 text-amber-400" /> :
                         moment.momentType === 'question' ? <MessageSquare className="w-3 h-3 text-violet-400" /> :
                         <Star className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {Math.floor(moment.timestampSeconds / 60)}:{(moment.timestampSeconds % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{moment.momentType}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{moment.content}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Speaker: {moment.speaker}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Sentiment Timeline */}
            <TabsContent value="sentiment" className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-6">Sentiment Progression</h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentData}>
                      <defs>
                        <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="sentiment" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSentiment)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Q&A Log */}
            <TabsContent value="qa" className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search questions..." 
                      className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
                <div className="divide-y divide-slate-700">
                  {qaData?.notable_exchanges?.map((qa: any, i: number) => (
                    <div key={i} className="p-6 hover:bg-slate-700/10 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Participant Question</span>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Institutional</span>
                          </div>
                          <p className="text-sm font-bold text-white mb-3">{qa.question}</p>
                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI Answer Summary</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{qa.summary}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Engagement Metrics */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-6">Attendance Curve</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="attendees" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-6">Drop-off Analysis</h3>
                  <div className="space-y-4">
                    {[
                      { point: "Intro & Disclaimers", drop: "2%", color: "emerald" },
                      { point: "Q4 Financials", drop: "1%", color: "emerald" },
                      { point: "Strategy Outlook", drop: "8%", color: "amber" },
                      { point: "Q&A Session", drop: "15%", color: "red" }
                    ].map(point => (
                      <div key={point.point} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{point.point}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className={`bg-${point.color}-500 h-full`} style={{ width: point.drop }} />
                          </div>
                          <span className="text-xs font-mono text-white">{point.drop}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 6: Compliance Flags */}
            <TabsContent value="compliance" className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Severity</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Statement Excerpt</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {[
                      { severity: "Medium", text: "We expect a 50% increase in EBITDA next quarter...", cat: "Forward Looking" },
                      { severity: "Low", text: "Our internal tests show better results than public data...", cat: "Material Info" }
                    ].map((flag, i) => (
                      <tr key={i} className="hover:bg-slate-700/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            flag.severity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {flag.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-300 italic">"{flag.text}"</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{flag.cat}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">View Transcript</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Tab 7: Full Transcript */}
            <TabsContent value="transcript" className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                  {[
                    { speaker: "John Doe", time: "00:00", text: "Welcome everyone to our Q4 2026 earnings call. I'm joined today by our CFO, Jane Smith." },
                    { speaker: "Jane Smith", time: "02:15", text: "Thank you, John. Let's start with the financial highlights. Revenue grew by 15% year-over-year, driven largely by our expansion into Asian markets." }
                  ].map((seg, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-white">{seg.speaker}</span>
                        <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">[{seg.time}]</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{seg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 8: Replay */}
            <TabsContent value="replay" className="space-y-6">
              <div className="bg-slate-900 border border-slate-700 rounded-xl aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                      <div>
                        <p className="text-sm font-bold text-white">Event Recording</p>
                        <p className="text-[10px] text-slate-400">Duration: 52:14</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Play className="w-20 h-20 text-slate-700" />
                <p className="text-slate-500 text-sm mt-4">Mux Player Embed Placeholder</p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {eventId && (
          <div className="mt-6">
            <WebcastRecapGenerator eventId={eventId} />
          </div>
        )}
      </div>
    </div>
  );
}
