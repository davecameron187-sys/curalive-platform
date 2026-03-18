// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Shield, TrendingUp, Globe, FileText, AlertTriangle,
  CheckCircle2, Loader2, Activity, Eye, Target, Zap, BarChart3,
  Users, MessageSquare, Radio, ChevronDown, ChevronRight, Sparkles,
} from "lucide-react";

type SuiteTab = "evasiveness" | "market-impact" | "compliance" | "external-sentiment" | "briefings";

const SUITE_TABS: { id: SuiteTab; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "evasiveness", label: "Evasive Answer Detection", icon: Eye, color: "text-red-400", desc: "NLP + vocal forensics to flag hedging and topic shifts" },
  { id: "market-impact", label: "Market Impact Forecast", icon: TrendingUp, color: "text-blue-400", desc: "Predict short-term stock reaction from tone & topics" },
  { id: "compliance", label: "Multi-Modal Compliance", icon: Shield, color: "text-amber-400", desc: "Text + tone + behavioral violation detection" },
  { id: "external-sentiment", label: "External Sentiment", icon: Globe, color: "text-emerald-400", desc: "Fuse call sentiment with social/media signals" },
  { id: "briefings", label: "IR Briefing Generator", icon: FileText, color: "text-violet-400", desc: "Personalized RAG-powered stakeholder briefings" },
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
              <p className="text-xs text-slate-500">5 Advanced AI Algorithms for Investor Event Intelligence</p>
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
      </div>
    </div>
  );
}
