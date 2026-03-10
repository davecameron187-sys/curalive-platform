/**
 * AIOnboarding — Guided 4-question quiz that recommends an AI bundle.
 * Route: /ai-onboarding
 *
 * Questions mirror the guided onboarding flow from the business brief.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Brain, CheckCircle2, TrendingUp, ShieldCheck,
  Zap, Megaphone, Star, Lightbulb, BarChart2, Users, Clock,
} from "lucide-react";

// ─── Quiz data ─────────────────────────────────────────────────────────────────

interface Option { id: string; label: string; icon?: any }
interface Question { id: string; text: string; options: Option[] }

const QUESTIONS: Question[] = [
  {
    id: "role",
    text: "What's your primary role?",
    options: [
      { id: "ir", label: "Investor Relations", icon: TrendingUp },
      { id: "compliance", label: "Compliance & Legal", icon: ShieldCheck },
      { id: "operations", label: "Event Operations", icon: Zap },
      { id: "marketing", label: "Marketing & Communications", icon: Megaphone },
      { id: "executive", label: "Executive / C-Suite", icon: Star },
      { id: "other", label: "Other", icon: Users },
    ],
  },
  {
    id: "challenge",
    text: "What's your biggest challenge?",
    options: [
      { id: "engagement", label: "Investor engagement and follow-up" },
      { id: "compliance", label: "Regulatory compliance" },
      { id: "efficiency", label: "Event efficiency and speed" },
      { id: "content", label: "Content creation and distribution" },
      { id: "experience", label: "Attendee experience" },
      { id: "multiple", label: "Multiple challenges" },
    ],
  },
  {
    id: "event_type",
    text: "What's your primary event type?",
    options: [
      { id: "earnings", label: "Earnings calls" },
      { id: "investor_day", label: "Investor days" },
      { id: "board", label: "Board meetings" },
      { id: "product", label: "Product launches" },
      { id: "roadshow", label: "Roadshows" },
      { id: "webinar", label: "Webinars" },
      { id: "other", label: "Other" },
    ],
  },
  {
    id: "budget",
    text: "What's your budget tier?",
    options: [
      { id: "starter", label: "Starter — 1 bundle, 10 events/month" },
      { id: "professional", label: "Professional — 2 bundles, unlimited events" },
      { id: "enterprise", label: "Enterprise — All bundles, unlimited everything" },
    ],
  },
];

// ─── Recommendation engine ─────────────────────────────────────────────────────

interface Bundle {
  id: string;
  letter: string;
  name: string;
  tagline: string;
  roi: string;
  color: string;
  bgColor: string;
  icon: any;
  price: string;
  quickWins: string[];
  timeline: string[];
}

const BUNDLES: Bundle[] = [
  {
    id: "investor-relations",
    letter: "A",
    name: "Investor Relations",
    tagline: "Turn every investor event into a revenue opportunity",
    roi: "+35% investor engagement · 80% faster follow-up",
    color: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-600",
    icon: TrendingUp,
    price: "$299/month",
    quickWins: [
      "Real-Time Sentiment Dashboard — see live investor mood",
      "Event Brief Generator — auto-written executive summary",
      "Investor Commitment Signals — identify deal opportunities",
    ],
    timeline: [
      "Day 1: Activate Sentiment Dashboard, Event Brief, Commitment Signals",
      "Week 1: Add Investor Briefing Pack + Q&A Analysis",
      "Month 1: Full bundle + Investor Debrief Reports",
    ],
  },
  {
    id: "compliance-risk",
    letter: "B",
    name: "Compliance & Risk",
    tagline: "Eliminate regulatory risk from every event",
    roi: "100% audit coverage · Zero compliance violations",
    color: "from-rose-600 to-rose-800",
    bgColor: "bg-rose-600",
    icon: ShieldCheck,
    price: "$299/month",
    quickWins: [
      "Material Statement Flagging — auto-detect compliance risks",
      "Compliance Risk Assessment — real-time risk scoring",
      "Compliance Certificate Generation — audit-ready reports",
    ],
    timeline: [
      "Day 1: Activate Flagging, Risk Assessment, Certificate",
      "Week 1: Add Redaction Workflow",
      "Month 1: Full Compliance Audit Trail active",
    ],
  },
  {
    id: "operations-efficiency",
    letter: "C",
    name: "Operations & Efficiency",
    tagline: "Run flawless events with AI-powered operations",
    roi: "80% manual work reduction · 5× faster moderation",
    color: "from-emerald-600 to-emerald-800",
    bgColor: "bg-emerald-600",
    icon: Zap,
    price: "$299/month",
    quickWins: [
      "Live Transcription — real-time speech-to-text, <1s latency",
      "Smart Q&A Triage — auto-categorize and prioritize questions",
      "Speaking Pace Analysis — real-time delivery coaching",
    ],
    timeline: [
      "Day 1: Live Transcription + Q&A Triage + Pace Analysis",
      "Week 1: Add Filler Word Detection + Transcript Search",
      "Month 1: Full operations suite with Delivery Coaching",
    ],
  },
  {
    id: "content-marketing",
    letter: "D",
    name: "Content & Marketing",
    tagline: "Generate 10× more content from every event",
    roi: "90% faster content creation · 5× distribution reach",
    color: "from-violet-600 to-violet-800",
    bgColor: "bg-violet-600",
    icon: Megaphone,
    price: "$299/month",
    quickWins: [
      "Press Release Generator — media-ready content in seconds",
      "Rolling Summary — live content updates during event",
      "Talking Points Generator — speaker prep in <1 minute",
    ],
    timeline: [
      "Day 1: Press Release + Rolling Summary + Talking Points",
      "Week 1: Add Sentiment Report + Event Report",
      "Month 1: Full content suite with Chat Translation",
    ],
  },
  {
    id: "premium",
    letter: "E",
    name: "Premium All-Access",
    tagline: "Unlock the full power of AI-driven events",
    roi: "Complete event intelligence across all dimensions",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500",
    icon: Star,
    price: "Custom pricing",
    quickWins: [
      "All 28 AI applications activated from day one",
      "Dedicated account manager + custom integrations",
      "Priority support with 2-hour SLA",
    ],
    timeline: [
      "Day 1: Full suite activation with onboarding session",
      "Week 1: Custom configuration for your workflow",
      "Month 1: ROI review + optimization session",
    ],
  },
];

function getRecommendedBundle(answers: Record<string, string>): Bundle {
  const role = answers.role;
  const challenge = answers.challenge;
  const budget = answers.budget;

  if (budget === "enterprise") return BUNDLES[4];

  if (role === "ir" || challenge === "engagement") return BUNDLES[0];
  if (role === "compliance" || challenge === "compliance") return BUNDLES[1];
  if (role === "operations" || challenge === "efficiency") return BUNDLES[2];
  if (role === "marketing" || challenge === "content") return BUNDLES[3];
  if (role === "executive") return BUNDLES[0];

  return BUNDLES[2];
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AIOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const isResult = step === QUESTIONS.length;
  const question = QUESTIONS[step];
  const recommendedBundle = isResult ? getRecommendedBundle(answers) : null;
  const BundleIcon = recommendedBundle?.icon;

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
  };

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [question.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 0) { navigate("/ai-shop"); return; }
    setStep(s => s - 1);
    setSelected(answers[QUESTIONS[step - 1].id] ?? null);
  };

  const progress = isResult ? 100 : Math.round((step / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">AI Bundle Recommender</h1>
            <p className="text-xs text-slate-400">3-minute guided setup</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">{isResult ? "Complete" : `${step + 1} of ${QUESTIONS.length}`}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {!isResult ? (
          <div className="w-full max-w-xl space-y-6">
            <div className="text-center">
              <p className="text-xs text-primary font-semibold mb-2">Question {step + 1} of {QUESTIONS.length}</p>
              <h2 className="text-2xl font-bold text-white">{question.text}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map(option => {
                const Icon = option.icon;
                const isActive = selected === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-white"
                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                    }`}
                  >
                    {Icon && (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-primary/20" : "bg-slate-700"
                      }`}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400"}`} />
                      </div>
                    )}
                    {isActive && !Icon && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!selected}
                className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {step === QUESTIONS.length - 1 ? "Get My Recommendation" : "Next"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ── Result screen ── */
          recommendedBundle && BundleIcon && (
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recommendation ready
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Perfect Bundle</h2>
                <p className="text-slate-400 text-sm">Based on your answers, we recommend:</p>
              </div>

              {/* Bundle card */}
              <div className={`rounded-2xl bg-gradient-to-br ${recommendedBundle.color} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <BundleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium">Bundle {recommendedBundle.letter}</p>
                    <h3 className="text-white text-xl font-bold">{recommendedBundle.name}</h3>
                  </div>
                  <span className="ml-auto bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    {recommendedBundle.price}
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-3">"{recommendedBundle.tagline}"</p>
                <p className="text-white/60 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {recommendedBundle.roi}
                </p>
              </div>

              {/* Quick wins */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> 3 Quick Wins — Start Here
                  </h4>
                  <div className="space-y-2">
                    {recommendedBundle.quickWins.map((win, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-300">{win}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-blue-400" /> Progressive Activation Timeline
                  </h4>
                  <div className="space-y-2">
                    {recommendedBundle.timeline.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                          i === 0 ? "bg-emerald-400" : i === 1 ? "bg-blue-400" : "bg-violet-400"
                        }`} />
                        <p className="text-xs text-slate-400">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROI snapshot */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Time to First Value", value: "48 hours", icon: Clock },
                  { label: "Feature Adoption Target", value: "70%+ in 30 days", icon: BarChart2 },
                  { label: "Expected NPS Uplift", value: "+20 points", icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                    <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/ai-shop")}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Explore Bundle <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setStep(0); setAnswers({}); setSelected(null); }}
                  className="flex-1 border border-slate-700 text-slate-300 text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>

              <p className="text-center text-xs text-slate-600">
                Want to compare all bundles?{" "}
                <button onClick={() => navigate("/ai-shop")} className="text-primary hover:underline">
                  View AI Shop
                </button>
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
