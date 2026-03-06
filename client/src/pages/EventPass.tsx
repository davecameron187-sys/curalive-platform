/**
 * EventPass — Public-facing event registration page for CuraLive.
 * Accessible at /event-pass/:id
 * Embeddable on curalive.cc via iframe or direct link.
 * Replaces the legacy "Diamond Pass" product page.
 */
import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Calendar, Clock, Globe, Users, CheckCircle, Mic, BarChart3,
  MessageSquare, Shield, Phone, Zap, ChevronRight, Copy
} from "lucide-react";

// ── Event metadata (mirrors Registration.tsx) ────────────────────────────────
const EVENT_META: Record<string, {
  title: string; company: string; platform: string; date: string;
  time: string; description: string; coverImage?: string;
}> = {
  "q4-earnings-2026": {
    title: "Q4 2025 Earnings Call",
    company: "CuraLive Inc.",
    platform: "Zoom",
    date: "March 1, 2026",
    time: "9:00 AM EST / 2:00 PM GMT",
    description: "Join CuraLive's CEO James Mitchell and CFO Sarah Chen for a live discussion of Q4 2025 financial results, full-year 2025 performance, and 2026 guidance.",
  },
  "investor-day-2026": {
    title: "Annual Investor Day",
    company: "CuraLive Inc.",
    platform: "Microsoft Teams",
    date: "March 15, 2026",
    time: "10:00 AM EST / 3:00 PM GMT",
    description: "A full-day investor event featuring presentations from the executive team on CuraLive strategy, product roadmap, and long-term financial targets.",
  },
  "board-briefing": {
    title: "Board Strategy Briefing",
    company: "CuraLive Inc.",
    platform: "Webex",
    date: "March 5, 2026",
    time: "2:00 PM EST / 7:00 PM GMT",
    description: "Confidential board briefing on the CuraLive platform strategy, competitive positioning, and 2026 build plan.",
  },
};

const LANGUAGES = [
  { code: "en",  label: "English",    region: "Pan-Africa · UAE" },
  { code: "fr",  label: "Français",   region: "West & Central Africa · Mauritius" },
  { code: "ar",  label: "العربية",    region: "North Africa · UAE" },
  { code: "pt",  label: "Português",  region: "Angola · Mozambique" },
  { code: "sw",  label: "Kiswahili",  region: "East Africa" },
  { code: "zu",  label: "isiZulu",    region: "South Africa" },
  { code: "af",  label: "Afrikaans",  region: "South Africa · Namibia" },
  { code: "zh",  label: "中文",       region: "China · Pan-Africa" },
  { code: "hi",  label: "हिन्दी",    region: "Mauritius · UAE" },
];

const FEATURES = [
  { icon: Mic,          label: "Live Transcription",   desc: "Real-time speech-to-text with <1s latency" },
  { icon: BarChart3,    label: "Sentiment Analysis",   desc: "AI monitors tone and audience reaction live" },
  { icon: MessageSquare,label: "Smart Q&A",            desc: "Submit, upvote, and moderate questions live" },
  { icon: Globe,        label: "Multi-Language",       desc: "Instant translation into 9 languages" },
  { icon: Shield,       label: "Secure & Private",     desc: "End-to-end encrypted, SOC 2 compliant" },
  { icon: Phone,        label: "Any Platform",         desc: "Zoom, Teams, Webex, RTMP, PSTN dial-in" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function EventPass() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ?? "q4-earnings-2026";
  const meta = EVENT_META[eventId];

  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "", jobTitle: "",
    language: "en", dialInRequired: false, accessibilityNeeds: "",
  });
  const [step, setStep] = useState<"form" | "success">("form");
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const registerMut = trpc.registrations.register.useMutation({
    onSuccess: (data) => {
      if (data.success || data.alreadyRegistered) {
        setRegistrationId(data.registrationId ?? null);
        setStep("success");
        if (data.alreadyRegistered) {
          toast.info("You are already registered for this event.");
        }
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    registerMut.mutate({
      eventId,
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      language: form.language,
      dialIn: form.dialInRequired,
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">You're Registered!</h1>
          <p className="text-slate-400 mb-2">
            Your <span className="text-white font-semibold">Event Pass</span> has been confirmed.
          </p>
          {registrationId && (
            <p className="text-xs text-slate-500 mb-6">Confirmation ID: <span className="text-slate-300 font-mono">EP-{String(registrationId).padStart(6, "0")}</span></p>
          )}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 text-left mb-6">
            <div className="font-semibold text-lg mb-1">{meta?.title ?? eventId}</div>
            <div className="text-sm text-slate-400 mb-3">{meta?.company}</div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              {meta?.date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />{meta.date}</span>}
              {meta?.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{meta.time}</span>}
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            A confirmation email has been sent to <span className="text-white">{form.email}</span>. You will receive dial-in details 24 hours before the event.
          </p>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Share this event"}
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header bar */}
      <header className="border-b border-slate-800 bg-[#0a0f1a]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight">CuraLive</span>
          </div>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Event Pass</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_420px] gap-12 items-start">
        {/* Left — Event info */}
        <div>
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Event Pass — CuraLive Inc.
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-3">
            {meta?.title ?? eventId}
          </h1>
          <p className="text-slate-400 text-lg mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            {meta?.description ?? "Register to receive your dial-in details and event access."}
          </p>

          {/* Event details */}
          <div className="flex flex-wrap gap-4 mb-8">
            {meta?.date && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-primary" />
                {meta.date}
              </div>
            )}
            {meta?.time && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-primary" />
                {meta.time}
              </div>
            )}
            {meta?.platform && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Globe className="w-4 h-4 text-primary" />
                {meta.platform}
              </div>
            )}
          </div>

          {/* What's included */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">What's Included in Your Event Pass</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-0.5">{label}</div>
                    <div className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embed snippet */}
          <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Embed on your website</span>
              <button
                onClick={() => {
                  const snippet = `<iframe src="${window.location.origin}/event-pass/${eventId}" width="100%" height="700" frameborder="0" style="border-radius:12px;border:1px solid #1e293b;"></iframe>`;
                  navigator.clipboard.writeText(snippet);
                  toast.success("Embed code copied to clipboard!");
                }}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy embed code
              </button>
            </div>
            <code className="text-xs text-slate-500 font-mono break-all">
              {`<iframe src="${window.location.origin}/event-pass/${eventId}" width="100%" height="700" ...>`}
            </code>
          </div>
        </div>

        {/* Right — Registration form */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 shadow-2xl sticky top-20">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Register for Free</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="James Mitchell"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="james@curalive.cc"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="CuraLive Inc."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Job Title</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="CFO"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Phone Number (for dial-in)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+27 11 000 0000"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Preferred Language</label>
                <select
                  value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label} — {l.region}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMut.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl text-sm transition-opacity disabled:opacity-60 mt-2"
            >
              {registerMut.isPending ? (
                <span className="animate-pulse">Registering...</span>
              ) : (
                <>Get My Event Pass <ChevronRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
              By registering you agree to receive event communications from CuraLive. No spam.
            </p>
          </form>

          {/* Trust badges */}
          <div className="mt-5 pt-4 border-t border-slate-700 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Free to attend</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> 9 languages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
