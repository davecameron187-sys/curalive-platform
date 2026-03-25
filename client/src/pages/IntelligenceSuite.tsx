// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Shield, TrendingUp, Globe, FileText, AlertTriangle,
  CheckCircle2, Loader2, Activity, Eye, Target, Zap, BarChart3,
  Users, MessageSquare, Radio, ChevronDown, ChevronRight, Sparkles,
  Siren, Search, GitCompareArrows, LineChart, Cpu, Fingerprint,
} from "lucide-react";

type SuiteTab = "evasiveness" | "market-impact" | "compliance" | "external-sentiment" | "briefings"
  | "materiality-risk" | "investor-intent" | "consistency-guardian" | "volatility-sim" | "regulatory-engine" | "integrity-twin";

const SUITE_TABS: { id: SuiteTab; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "evasiveness", label: "Evasive Answer Detection", icon: Eye, color: "text-red-400", desc: "NLP + vocal forensics to flag hedging and topic shifts" },
  { id: "market-impact", label: "Market Impact Forecast", icon: TrendingUp, color: "text-blue-400", desc: "Predict short-term stock reaction from tone & topics" },
  { id: "compliance", label: "Multi-Modal Compliance", icon: Shield, color: "text-amber-400", desc: "Text + tone + behavioral violation detection" },
  { id: "external-sentiment", label: "External Sentiment", icon: Globe, color: "text-emerald-400", desc: "Fuse call sentiment with social/media signals" },
  { id: "briefings", label: "IR Briefing Generator", icon: FileText, color: "text-violet-400", desc: "Personalized RAG-powered stakeholder briefings" },
  { id: "materiality-risk", label: "Materiality Risk Oracle", icon: Siren, color: "text-rose-400", desc: "Real-time MNPI detection with auto-drafted regulatory filings (Reg FD / JSE)" },
  { id: "investor-intent", label: "Investor Intention Decoder", icon: Search, color: "text-cyan-400", desc: "Decode hidden investor intent — activist pressure, short signals, hostile probing" },
  { id: "consistency-guardian", label: "Cross-Event Consistency", icon: GitCompareArrows, color: "text-yellow-400", desc: "Track executive messaging across events for contradictions" },
  { id: "volatility-sim", label: "Volatility Simulator", icon: LineChart, color: "text-indigo-400", desc: "Live Monte-Carlo simulations predicting short-term stock impact" },
  { id: "regulatory-engine", label: "Regulatory Intervention", icon: Cpu, color: "text-orange-400", desc: "Self-evolving compliance engine with reinforcement learning" },
  { id: "integrity-twin", label: "Event Integrity Twin", icon: Fingerprint, color: "text-teal-400", desc: "SHA-256 hash chain digital twin with Clean Disclosure Certificate" },
];

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[level] || colors.medium}`}>
      {level.toUpperCase()}
    </span>
  );
}

function ScoreGauge({ score, label, color, maxLabel }: { score: number; label: string; color: string; maxLabel?: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" className="text-white/5" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" className={color}
            strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{pct}%</span>
        </div>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
      {maxLabel && <div className="text-[10px] text-slate-600">{maxLabel}</div>}
    </div>
  );
}

function EvasivenessPanel() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [speakerRole, setSpeakerRole] = useState("CEO");
  const detect = trpc.evasiveAnswer.detectEvasiveness.useMutation();

  const handleAnalyze = () => {
    if (!question.trim() || !response.trim()) return toast.error("Enter both question and response");
    detect.mutate({ questionText: question, responseText: response, speakerRole });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-red-400" />
          Analyze Q&A Exchange
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Analyst/Investor Question</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Enter the question asked during the call..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/30 resize-none h-32" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Executive Response</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)}
              placeholder="Enter the executive's response..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/30 resize-none h-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={speakerRole} onChange={e => setSpeakerRole(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["CEO", "CFO", "COO", "IR Head", "Board Member", "General Counsel"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button onClick={handleAnalyze} disabled={detect.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm rounded-lg transition">
            {detect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Detect Evasiveness
          </button>
        </div>
      </div>

      {detect.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Analysis Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ScoreGauge score={detect.data.score} label="Evasiveness" color="text-red-400" maxLabel="0=Direct, 100=Evasive" />
            <ScoreGauge score={detect.data.directnessIndex / 100} label="Directness" color="text-emerald-400" />
            <div className="flex flex-col items-center justify-center">
              <div className={`text-2xl font-bold ${detect.data.topicShiftDetected ? "text-amber-400" : "text-emerald-400"}`}>
                {detect.data.topicShiftDetected ? "YES" : "NO"}
              </div>
              <div className="text-xs text-slate-400 mt-1">Topic Shift</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-violet-400">{detect.data.flags.length}</div>
              <div className="text-xs text-slate-400 mt-1">Flags Raised</div>
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
            <div className="text-xs text-slate-500 mb-1">Explanation</div>
            <p className="text-sm text-slate-300">{detect.data.explanation}</p>
          </div>

          {detect.data.flags.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Detection Flags</div>
              <div className="flex flex-wrap gap-2">
                {detect.data.flags.map((flag: string) => (
                  <span key={flag} className="text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                    {flag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detect.data.hedgingPhrases.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Hedging Phrases Detected</div>
              <div className="space-y-1">
                {detect.data.hedgingPhrases.map((phrase: string, i: number) => (
                  <div key={i} className="text-xs text-amber-400/80 bg-amber-500/5 px-3 py-1.5 rounded border border-amber-500/10">
                    "{phrase}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MarketImpactPanel() {
  const [sentiment, setSentiment] = useState("0.2");
  const [keywords, setKeywords] = useState("guidance raised, strong revenue growth");
  const [ticker, setTicker] = useState("");
  const [eventType, setEventType] = useState("earnings_call");
  const [transcript, setTranscript] = useState("");
  const predict = trpc.marketImpactPredictor.predictImpact.useMutation();

  const handlePredict = () => {
    predict.mutate({
      sentimentScore: parseFloat(sentiment),
      topicKeywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      companyTicker: ticker || undefined,
      eventType,
      transcriptExcerpt: transcript || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Predict Market Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Sentiment Score (-1.0 to +1.0)</label>
            <input type="number" step="0.1" min="-1" max="1" value={sentiment} onChange={e => setSentiment(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company Ticker</label>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="e.g. MTN, NPN, AGL"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Key Topics (comma-separated)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-300">
              {["earnings_call", "agm", "interim_results", "capital_markets_day", "investor_day", "roadshow"].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Transcript Excerpt (optional)</label>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste key transcript sections..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 resize-none h-24 mb-4" />
        </div>
        <button onClick={handlePredict} disabled={predict.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm rounded-lg transition">
          {predict.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          Predict Impact
        </button>
      </div>

      {predict.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Prediction Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${predict.data.direction === "positive" ? "text-emerald-400" : predict.data.direction === "negative" ? "text-red-400" : "text-slate-400"}`}>
                {predict.data.direction === "positive" ? "+" : predict.data.direction === "negative" ? "-" : "~"}{predict.data.predictedVolatility.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Volatility (0-10)</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${predict.data.direction === "positive" ? "text-emerald-400" : predict.data.direction === "negative" ? "text-red-400" : "text-amber-400"}`}>
                {predict.data.direction === "positive" ? "BULLISH" : predict.data.direction === "negative" ? "BEARISH" : "NEUTRAL"}
              </div>
              <div className="text-xs text-slate-400 mt-1">Direction</div>
            </div>
            <ScoreGauge score={predict.data.confidence} label="Confidence" color="text-blue-400" />
            <div className="text-center">
              <div className="text-lg font-bold text-violet-400">{predict.data.timeHorizon}</div>
              <div className="text-xs text-slate-400 mt-1">Time Horizon</div>
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
            <div className="text-xs text-slate-500 mb-1">Reasoning</div>
            <p className="text-sm text-slate-300">{predict.data.reasoning}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predict.data.riskFactors.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Risk Factors</div>
                {predict.data.riskFactors.map((r: string, i: number) => (
                  <div key={i} className="text-xs text-red-400/80 bg-red-500/5 px-3 py-1.5 rounded border border-red-500/10 mb-1">
                    {r}
                  </div>
                ))}
              </div>
            )}
            {predict.data.catalysts.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Catalysts</div>
                {predict.data.catalysts.map((c: string, i: number) => (
                  <div key={i} className="text-xs text-emerald-400/80 bg-emerald-500/5 px-3 py-1.5 rounded border border-emerald-500/10 mb-1">
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompliancePanel() {
  const [transcript, setTranscript] = useState("");
  const [jurisdiction, setJurisdiction] = useState("multi");
  const [eventType, setEventType] = useState("earnings_call");
  const score = trpc.multiModalCompliance.scoreComplianceRisk.useMutation();

  const handleScore = () => {
    if (!transcript.trim()) return toast.error("Enter transcript text to analyze");
    score.mutate({ transcriptText: transcript, jurisdiction, eventType });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Multi-Modal Compliance Risk Scoring
        </h3>
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Transcript / Speech Text</label>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste transcript excerpt for compliance analysis..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 resize-none h-40" />
        </div>
        <div className="flex items-center gap-3">
          <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            <option value="multi">Multi-Jurisdictional</option>
            <option value="za">South Africa (JSE)</option>
            <option value="us">United States (SEC)</option>
            <option value="uk">United Kingdom (FCA)</option>
          </select>
          <select value={eventType} onChange={e => setEventType(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["earnings_call", "agm", "interim_results", "capital_markets_day", "board_meeting"].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button onClick={handleScore} disabled={score.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white text-sm rounded-lg transition">
            {score.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Score Compliance Risk
          </button>
        </div>
      </div>

      {score.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Compliance Risk Assessment</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <ScoreGauge score={score.data.overallRisk} label="Overall Risk" color="text-amber-400" />
            <ScoreGauge score={score.data.textRisk} label="Text Risk" color="text-blue-400" />
            <ScoreGauge score={score.data.toneRisk} label="Tone Risk" color="text-violet-400" />
            <ScoreGauge score={score.data.behavioralRisk} label="Behavioral" color="text-orange-400" />
            <ScoreGauge score={score.data.selectiveDisclosureRisk} label="Sel. Disclosure" color="text-red-400" />
          </div>

          {score.data.violations.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Violations Detected</div>
              <div className="space-y-2">
                {score.data.violations.map((v: any, i: number) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <RiskBadge level={v.severity} />
                      <span className="text-xs text-white font-medium">{v.type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-500">{v.regulation}</span>
                    </div>
                    <p className="text-xs text-slate-400">{v.description}</p>
                    {v.evidence && <p className="text-xs text-red-400/60 mt-1 italic">"{v.evidence}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {score.data.recommendations.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Recommendations</div>
              {score.data.recommendations.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-400/80 mb-1">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {score.data.insiderTradingIndicators.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Insider Trading Indicators</div>
              {score.data.insiderTradingIndicators.map((ind: string, i: number) => (
                <div key={i} className="text-xs text-red-400 bg-red-500/5 px-3 py-1.5 rounded border border-red-500/10 mb-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />{ind}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalSentimentPanel() {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [callSentiment, setCallSentiment] = useState("0.3");
  const [topics, setTopics] = useState("strong revenue, new acquisition");
  const [eventType, setEventType] = useState("earnings_call");
  const aggregate = trpc.externalSentiment.aggregateExternalSentiment.useMutation();

  const handleAggregate = () => {
    if (!companyName.trim()) return toast.error("Enter company name");
    aggregate.mutate({
      companyTicker: ticker,
      companyName,
      eventType,
      callSentiment: parseFloat(callSentiment),
      keyTopicsFromCall: topics.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          External Sentiment Aggregation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. MTN Group"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ticker</label>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="e.g. MTN"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Call Sentiment (-1 to +1)</label>
            <input type="number" step="0.1" min="-1" max="1" value={callSentiment} onChange={e => setCallSentiment(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Key Topics from Call</label>
          <input value={topics} onChange={e => setTopics(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30" />
        </div>
        <button onClick={handleAggregate} disabled={aggregate.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm rounded-lg transition">
          {aggregate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          Aggregate External Sentiment
        </button>
      </div>

      {aggregate.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">External Sentiment Report</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${aggregate.data.aggregatedSentiment > 0.2 ? "text-emerald-400" : aggregate.data.aggregatedSentiment < -0.2 ? "text-red-400" : "text-amber-400"}`}>
                {aggregate.data.aggregatedSentiment > 0 ? "+" : ""}{aggregate.data.aggregatedSentiment.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Aggregated Sentiment</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{aggregate.data.socialMentions.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Social Mentions</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${aggregate.data.crowdReaction === "bullish" ? "text-emerald-400" : aggregate.data.crowdReaction === "bearish" ? "text-red-400" : "text-amber-400"}`}>
                {aggregate.data.crowdReaction.toUpperCase()}
              </div>
              <div className="text-xs text-slate-400 mt-1">Crowd Reaction</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${Math.abs(aggregate.data.divergenceFromCall) > 0.3 ? "text-red-400" : "text-emerald-400"}`}>
                {aggregate.data.divergenceFromCall > 0 ? "+" : ""}{aggregate.data.divergenceFromCall.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Call Divergence</div>
            </div>
          </div>

          {aggregate.data.topThemes.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Top Themes</div>
              <div className="space-y-2">
                {aggregate.data.topThemes.map((theme: any, i: number) => (
                  <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${theme.sentiment === "positive" ? "text-emerald-400" : theme.sentiment === "negative" ? "text-red-400" : "text-slate-400"}`}>
                        {theme.sentiment}
                      </span>
                      <span className="text-xs text-white font-medium">{theme.theme}</span>
                      <span className="text-[10px] text-slate-600">{theme.volume} mentions</span>
                    </div>
                    {theme.representativePosts?.map((post: string, j: number) => (
                      <p key={j} className="text-[11px] text-slate-500 italic mt-1">"{post}"</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aggregate.data.earlyWarnings.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Early Warnings for IR Team</div>
              {aggregate.data.earlyWarnings.map((w: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-400/80 mb-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefingPanel() {
  const [stakeholder, setStakeholder] = useState<string>("ir_head");
  const [companyName, setCompanyName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("earnings_call");
  const [transcript, setTranscript] = useState("");
  const generate = trpc.personalizedBriefing.generateBriefing.useMutation();

  const handleGenerate = () => {
    if (!companyName.trim() || !eventName.trim() || !transcript.trim()) {
      return toast.error("Fill in company, event name, and transcript");
    }
    generate.mutate({
      stakeholderType: stakeholder as any,
      companyName,
      eventName,
      eventType,
      transcriptExcerpt: transcript,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          Generate Personalized IR Briefing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Stakeholder Type</label>
            <select value={stakeholder} onChange={e => setStakeholder(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-300">
              <option value="ceo">CEO</option>
              <option value="cfo">CFO</option>
              <option value="ir_head">IR Head</option>
              <option value="board_member">Board Member</option>
              <option value="analyst">Analyst</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="investor">Investor</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. MTN Group"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Event Name</label>
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. FY2026 Results"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/30" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-300">
              {["earnings_call", "agm", "interim_results", "capital_markets_day", "investor_day"].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Transcript / Event Data</label>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste transcript excerpt or key event data for the briefing..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/30 resize-none h-32" />
        </div>
        <button onClick={handleGenerate} disabled={generate.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm rounded-lg transition">
          {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Briefing
        </button>
      </div>

      {generate.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{generate.data.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600">Confidence: {Math.round(generate.data.appendix.confidenceLevel * 100)}%</span>
            </div>
          </div>

          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4 mb-4">
            <div className="text-xs text-violet-400 font-medium mb-1">Executive Summary</div>
            <p className="text-sm text-slate-300">{generate.data.executiveSummary}</p>
          </div>

          {generate.data.keyFindings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Key Findings</div>
              <div className="space-y-2">
                {generate.data.keyFindings.map((f: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <RiskBadge level={f.importance} />
                    <div>
                      <div className="text-xs text-slate-400">{f.category}</div>
                      <p className="text-xs text-white">{f.finding}</p>
                    </div>
                    {f.actionRequired && <Zap className="w-3 h-3 text-amber-400 flex-shrink-0 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {generate.data.riskAlerts.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Risk Alerts</div>
              {generate.data.riskAlerts.map((r: any, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={r.severity} />
                    <span className="text-xs text-white">{r.risk}</span>
                  </div>
                  <p className="text-xs text-slate-500">Mitigation: {r.mitigation}</p>
                </div>
              ))}
            </div>
          )}

          {generate.data.actionItems.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">Action Items</div>
              {generate.data.actionItems.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-3 border border-white/5 mb-1">
                  <RiskBadge level={a.priority === "urgent" ? "critical" : a.priority} />
                  <div className="flex-1">
                    <p className="text-xs text-white">{a.action}</p>
                    <span className="text-[10px] text-slate-600">Owner: {a.owner} | Deadline: {a.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Stakeholder Impact</div>
            <p className="text-sm text-slate-300">{generate.data.stakeholderImpact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialityRiskPanel() {
  const [statement, setStatement] = useState("");
  const [speakerRole, setSpeakerRole] = useState("CEO");
  const [jurisdiction, setJurisdiction] = useState("multi");
  const score = trpc.materialityRisk.scoreStatement.useMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Siren className="w-4 h-4 text-rose-400" />
          Analyze Statement for MNPI Risk
        </h3>
        <textarea value={statement} onChange={e => setStatement(e.target.value)}
          placeholder="Enter executive statement to check for material non-public information risk..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/30 resize-none h-32 mb-4" />
        <div className="flex items-center gap-3">
          <select value={speakerRole} onChange={e => setSpeakerRole(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["CEO", "CFO", "COO", "IR Head", "Board Member", "General Counsel"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["multi", "US-SEC", "SA-JSE", "UK-FCA", "EU-MAR"].map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          <button onClick={() => { if (!statement.trim()) return toast.error("Enter a statement"); score.mutate({ statementText: statement, speakerRole, jurisdiction }); }}
            disabled={score.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-sm rounded-lg transition">
            {score.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
            Score Materiality
          </button>
        </div>
      </div>
      {score.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ScoreGauge score={score.data.materialityScore} label="MNPI Risk" color="text-rose-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <RiskBadge level={score.data.riskLevel} />
                {score.data.filingRequired && <span className="text-xs text-red-400 font-bold animate-pulse">⚠ FILING REQUIRED: {score.data.filingType}</span>}
              </div>
              <p className="text-xs text-slate-400">{score.data.explanation}</p>
            </div>
          </div>
          {score.data.mnpiIndicators?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">MNPI Indicators</div>
              <div className="flex flex-wrap gap-2">{score.data.mnpiIndicators.map((ind: string, i: number) => (
                <span key={i} className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded">{ind}</span>
              ))}</div></div>
          )}
          {score.data.draftFiling && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <div className="text-xs text-red-400 font-semibold mb-2">Auto-Drafted {score.data.filingType} Filing</div>
              <p className="text-sm text-white font-medium mb-1">{score.data.draftFiling.headline}</p>
              <p className="text-xs text-slate-400">{score.data.draftFiling.body}</p>
              <div className="mt-2 text-[10px] text-orange-400">Urgency: {score.data.draftFiling.urgency}</div>
            </div>
          )}
          {score.data.suggestedCorrection && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="text-xs text-emerald-400 font-semibold mb-1">Suggested Correction</div>
              <p className="text-xs text-slate-300">{score.data.suggestedCorrection}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorIntentPanel() {
  const [question, setQuestion] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [investorType, setInvestorType] = useState("Institutional");
  const decode = trpc.investorIntent.decodeIntent.useMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          Decode Investor Question Intent
        </h3>
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Enter the investor's question to decode hidden intent..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30 resize-none h-28 mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <input value={investorName} onChange={e => setInvestorName(e.target.value)} placeholder="Investor name (optional)"
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 flex-1" />
          <select value={investorType} onChange={e => setInvestorType(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["Institutional", "Retail", "Analyst", "Activist", "Short-Seller", "Media"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={() => { if (!question.trim()) return toast.error("Enter a question"); decode.mutate({ questionText: question, investorName: investorName || undefined, investorType }); }}
            disabled={decode.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-sm rounded-lg transition">
            {decode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Decode Intent
          </button>
        </div>
      </div>
      {decode.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-1">
                <span className="text-lg font-bold text-cyan-400">{decode.data.intentBadge}</span>
              </div>
              <div className="text-[10px] text-slate-500">Intent Badge</div>
            </div>
            <ScoreGauge score={decode.data.confidence} label="Confidence" color="text-cyan-400" />
            <ScoreGauge score={decode.data.aggressionScore / 100} label="Aggression" color="text-red-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <RiskBadge level={decode.data.riskLevel} />
                <span className="text-xs text-white font-medium">{decode.data.primaryIntent.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-slate-400">{decode.data.explanation}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-2">Hidden Agenda</div>
              <p className="text-xs text-slate-300">{decode.data.hiddenAgenda}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-2">Predicted Follow-Up</div>
              <p className="text-xs text-slate-300">{decode.data.followUpPrediction}</p>
            </div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <div className="text-xs text-emerald-400 font-semibold mb-1">Suggested Response Strategy</div>
            <p className="text-xs text-slate-300">{decode.data.suggestedResponse}</p>
          </div>
          {decode.data.linguisticPatterns?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">Linguistic Patterns Detected</div>
              <div className="flex flex-wrap gap-2">{decode.data.linguisticPatterns.map((p: string, i: number) => (
                <span key={i} className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded">{p}</span>
              ))}</div></div>
          )}
        </div>
      )}
    </div>
  );
}

function ConsistencyGuardianPanel() {
  const [statement, setStatement] = useState("");
  const [historicalRaw, setHistoricalRaw] = useState("");
  const [companyName, setCompanyName] = useState("");
  const check = trpc.crossEventConsistency.checkConsistency.useMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-yellow-400" />
          Cross-Event Statement Consistency Check
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Current Statement</label>
            <textarea value={statement} onChange={e => setStatement(e.target.value)}
              placeholder="Enter the executive's current statement..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/30 resize-none h-32" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Historical Statements (one per line)</label>
            <textarea value={historicalRaw} onChange={e => setHistoricalRaw(e.target.value)}
              placeholder="Q1: We're investing heavily in R&D&#10;Q2: R&D spending remains a priority..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/30 resize-none h-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name"
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600" />
          <button onClick={() => {
            if (!statement.trim()) return toast.error("Enter current statement");
            const historical = historicalRaw.split("\n").filter(s => s.trim());
            check.mutate({ currentStatement: statement, historicalStatements: historical.length ? historical : undefined, companyName: companyName || undefined });
          }}
            disabled={check.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 text-white text-sm rounded-lg transition">
            {check.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
            Check Consistency
          </button>
        </div>
      </div>
      {check.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ScoreGauge score={check.data.consistencyScore} label="Consistency" color="text-yellow-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2"><RiskBadge level={check.data.riskLevel} /></div>
              <p className="text-xs text-slate-400">{check.data.explanation}</p>
            </div>
          </div>
          {check.data.contradictionsFound?.length > 0 && (
            <div><div className="text-xs text-red-400 font-semibold mb-2">Contradictions Found ({check.data.contradictionsFound.length})</div>
              {check.data.contradictionsFound.map((c: any, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1"><RiskBadge level={c.severity} /><span className="text-xs text-white">{c.explanation}</span></div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-[10px] text-slate-500"><span className="text-slate-600">Current:</span> {c.statement}</div>
                    <div className="text-[10px] text-slate-500"><span className="text-slate-600">Prior:</span> {c.priorStatement}</div>
                  </div>
                </div>
              ))}</div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Messaging Drift</div>
              <p className="text-xs text-slate-300">{check.data.messagingDrift}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Investigation Risk</div>
              <p className="text-xs text-slate-300">{check.data.investigationRisk}</p>
            </div>
          </div>
          {check.data.correctiveLanguage && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="text-xs text-emerald-400 font-semibold mb-1">Corrective Language</div>
              <p className="text-xs text-slate-300">{check.data.correctiveLanguage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VolatilitySimPanel() {
  const [transcript, setTranscript] = useState("");
  const [sentiment, setSentiment] = useState("0");
  const [guidanceTone, setGuidanceTone] = useState("not yet discussed");
  const [ticker, setTicker] = useState("");
  const sim = trpc.volatilitySimulator.runSimulation.useMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <LineChart className="w-4 h-4 text-indigo-400" />
          Live "What-If" Volatility Simulation
        </h3>
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
          placeholder="Enter transcript excerpt from the live call..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/30 resize-none h-28 mb-4" />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Sentiment:</label>
            <input type="range" min="-1" max="1" step="0.1" value={sentiment} onChange={e => setSentiment(e.target.value)}
              className="w-24" />
            <span className="text-xs text-indigo-400 w-8">{sentiment}</span>
          </div>
          <select value={guidanceTone} onChange={e => setGuidanceTone(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["not yet discussed", "raised", "maintained", "lowered", "ambiguous"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Ticker"
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 w-24" />
          <button onClick={() => { if (!transcript.trim()) return toast.error("Enter transcript"); sim.mutate({ transcriptExcerpt: transcript, currentSentiment: parseFloat(sentiment), guidanceTone, companyTicker: ticker || undefined }); }}
            disabled={sim.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm rounded-lg transition">
            {sim.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LineChart className="w-4 h-4" />}
            Run Simulation
          </button>
        </div>
      </div>
      {sim.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-red-400">{sim.data.bearCase.priceMove > 0 ? "+" : ""}{sim.data.bearCase.priceMove}%</div>
              <div className="text-xs text-slate-500">Bear Case ({Math.round(sim.data.bearCase.probability * 100)}%)</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-blue-400">{sim.data.baseCase.priceMove > 0 ? "+" : ""}{sim.data.baseCase.priceMove}%</div>
              <div className="text-xs text-slate-500">Base Case ({Math.round(sim.data.baseCase.probability * 100)}%)</div>
              <div className="text-[10px] text-slate-600">{sim.data.baseCase.timeframe}</div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-emerald-400">{sim.data.bullCase.priceMove > 0 ? "+" : ""}{sim.data.bullCase.priceMove}%</div>
              <div className="text-xs text-slate-500">Bull Case ({Math.round(sim.data.bullCase.probability * 100)}%)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-indigo-400">{sim.data.expectedVolatility.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500">Expected Vol</div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-white">{sim.data.confidenceInterval.lower.toFixed(1)}% to {sim.data.confidenceInterval.upper.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500">95% CI</div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-amber-400">{sim.data.guidanceSignal}</div>
              <div className="text-[10px] text-slate-500">Guidance Signal</div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3 text-center">
              <div className="text-sm font-bold" style={{ color: sim.data.toneImpact >= 0 ? "#34d399" : "#f87171" }}>{sim.data.toneImpact > 0 ? "+" : ""}{sim.data.toneImpact.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">Tone Impact</div>
            </div>
          </div>
          {sim.data.simulations?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">Top Scenarios</div>
              {sim.data.simulations.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-2 mb-1">
                  <span className="text-xs text-white flex-1">{s.scenario}</span>
                  <span className={`text-xs font-bold ${s.priceMove >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.priceMove > 0 ? "+" : ""}{s.priceMove}%</span>
                  <span className="text-[10px] text-slate-500">{Math.round(s.probability * 100)}%</span>
                </div>
              ))}</div>
          )}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
            <div className="text-xs text-indigo-400 font-semibold mb-1">Trading Desk Recommendation</div>
            <p className="text-xs text-slate-300">{sim.data.tradingRecommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RegulatoryEnginePanel() {
  const [transcript, setTranscript] = useState("");
  const [jurisdiction, setJurisdiction] = useState("multi");
  const analyze = trpc.regulatoryIntervention.analyzeAndEvolve.useMutation();

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          Autonomous Regulatory Intervention Engine
        </h3>
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
          placeholder="Enter event transcript for regulatory analysis and self-evolution..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/30 resize-none h-28 mb-4" />
        <div className="flex items-center gap-3">
          <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
            {["multi", "US-SEC", "SA-JSE", "UK-FCA", "EU-MAR"].map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          <button onClick={() => { if (!transcript.trim()) return toast.error("Enter transcript"); analyze.mutate({ eventTranscript: transcript, jurisdiction }); }}
            disabled={analyze.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white text-sm rounded-lg transition">
            {analyze.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            Analyze & Evolve
          </button>
        </div>
      </div>
      {analyze.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ScoreGauge score={analyze.data.currentRiskAssessment.overallRisk} label="Overall Risk" color="text-orange-400" />
            <ScoreGauge score={analyze.data.confidenceInUpdates} label="Confidence" color="text-blue-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold">{analyze.data.evolutionStage.toUpperCase()}</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">{analyze.data.deploymentRecommendation.replace(/_/g, " ")}</span>
                {analyze.data.falsePositiveReduction > 0 && <span className="text-xs text-emerald-400">↓{analyze.data.falsePositiveReduction.toFixed(1)}% false positives</span>}
              </div>
              <p className="text-xs text-slate-400">{analyze.data.explanation}</p>
            </div>
          </div>
          {analyze.data.thresholdAdjustments?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">Threshold Adjustments</div>
              {analyze.data.thresholdAdjustments.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-3 mb-1">
                  <span className="text-xs text-white flex-1">{t.parameter}</span>
                  <span className="text-xs text-red-400">{t.currentValue.toFixed(2)}</span>
                  <span className="text-xs text-slate-600">→</span>
                  <span className="text-xs text-emerald-400">{t.proposedValue.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500">{t.reasoning}</span>
                </div>
              ))}</div>
          )}
          {analyze.data.classifierUpdates?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">Classifier Updates</div>
              {analyze.data.classifierUpdates.map((c: any, i: number) => (
                <div key={i} className="bg-white/[0.02] rounded-lg p-3 mb-1">
                  <div className="flex items-center gap-2"><span className="text-xs text-white font-medium">{c.classifierName}</span><span className="text-[10px] text-blue-400">{c.updateType}</span><span className="text-[10px] text-emerald-400">+{(c.expectedImprovement * 100).toFixed(0)}%</span></div>
                  <p className="text-[10px] text-slate-500 mt-1">{c.details}</p>
                </div>
              ))}</div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrityTwinPanel() {
  const [eventName, setEventName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [segmentsRaw, setSegmentsRaw] = useState("");
  const build = trpc.eventIntegrity.buildDigitalTwin.useMutation();

  const handleBuild = () => {
    if (!eventName.trim() || !segmentsRaw.trim()) return toast.error("Enter event name and transcript segments");
    const lines = segmentsRaw.split("\n").filter(l => l.trim());
    const segments = lines.map((line, i) => ({
      transcript: line.trim(),
      sentiment: Math.random() * 2 - 1,
      compliance: 0.7 + Math.random() * 0.3,
      timestamp: new Date(Date.now() - (lines.length - i) * 60000).toISOString(),
    }));
    build.mutate({ eventId: `EVT-${Date.now()}`, eventName, companyName: companyName || "Unknown", segments });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-teal-400" />
          Event Integrity Digital Twin & Certificate
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Event name (e.g. Q4 2025 Earnings Call)"
            className="bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/30" />
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name"
            className="bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/30" />
        </div>
        <textarea value={segmentsRaw} onChange={e => setSegmentsRaw(e.target.value)}
          placeholder="Enter transcript segments (one per line) to build the hash chain..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/30 resize-none h-28 mb-4" />
        <button onClick={handleBuild} disabled={build.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white text-sm rounded-lg transition">
          {build.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
          Build Digital Twin & Certificate
        </button>
      </div>
      {build.data && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ScoreGauge score={build.data.integrityScore} label="Integrity" color="text-teal-400" />
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">{build.data.certificateGrade}</div>
              <div className="text-[10px] text-slate-500">Certificate Grade</div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Disclosure:</span>
                <div className="flex-1 bg-white/5 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full" style={{ width: `${build.data.disclosureCompleteness}%` }} /></div>
                <span className="text-xs text-teal-400">{build.data.disclosureCompleteness}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Compliance:</span>
                <div className="flex-1 bg-white/5 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${build.data.regulatoryCompliance}%` }} /></div>
                <span className="text-xs text-blue-400">{build.data.regulatoryCompliance}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Consistency:</span>
                <div className="flex-1 bg-white/5 rounded-full h-2"><div className="bg-violet-500 h-2 rounded-full" style={{ width: `${build.data.consistencyRating}%` }} /></div>
                <span className="text-xs text-violet-400">{build.data.consistencyRating}%</span>
              </div>
            </div>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-4">
            <div className="text-xs text-teal-400 font-semibold mb-2">Clean Disclosure Certificate</div>
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{build.data.certificateText}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Chain Length</div>
              <div className="text-sm font-bold text-white">{build.data.chainLength} segments</div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Twin Hash</div>
              <div className="text-[9px] font-mono text-teal-400 break-all">{build.data.twinHash?.slice(0, 24)}...</div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Audit Trail</div>
              <div className="text-[10px] text-slate-400">{build.data.auditTrailSummary}</div>
            </div>
          </div>
          {build.data.findings?.length > 0 && (
            <div><div className="text-xs text-slate-500 mb-2">Key Findings</div>
              <ul className="space-y-1">{build.data.findings.map((f: string, i: number) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" />{f}</li>
              ))}</ul></div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntelligenceSuite() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<SuiteTab>("evasiveness");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Intelligence Suite</h1>
              <p className="text-xs text-slate-500">11 Advanced AI Algorithms for Investor Event Intelligence</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {SUITE_TABS.map(({ id, label, icon: Icon, color, desc }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border whitespace-nowrap transition-all ${
                activeTab === id
                  ? `${color} bg-white/[0.05] border-white/20`
                  : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.03]"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-600">
            {SUITE_TABS.find(t => t.id === activeTab)?.desc}
          </p>
        </div>

        {activeTab === "evasiveness" && <EvasivenessPanel />}
        {activeTab === "market-impact" && <MarketImpactPanel />}
        {activeTab === "compliance" && <CompliancePanel />}
        {activeTab === "external-sentiment" && <ExternalSentimentPanel />}
        {activeTab === "briefings" && <BriefingPanel />}
        {activeTab === "materiality-risk" && <MaterialityRiskPanel />}
        {activeTab === "investor-intent" && <InvestorIntentPanel />}
        {activeTab === "consistency-guardian" && <ConsistencyGuardianPanel />}
        {activeTab === "volatility-sim" && <VolatilitySimPanel />}
        {activeTab === "regulatory-engine" && <RegulatoryEnginePanel />}
        {activeTab === "integrity-twin" && <IntegrityTwinPanel />}
      </div>
    </div>
  );
}
