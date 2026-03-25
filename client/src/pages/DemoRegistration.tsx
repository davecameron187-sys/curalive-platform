/**
 * DemoRegistration.tsx
 * A live preview of the registration page with example "Meridian Capital" client customisations.
 * This demonstrates what the Event Customisation Portal will produce for a financial services client.
 */
import { useState } from "react";
import {
  Calendar, Clock, Globe, Users, CheckCircle2,
  BarChart3, MessageSquare, Play, Mic,
  Shield, FileText, ChevronRight, Zap, Building2
} from "lucide-react";

// ─── Meridian Capital custom branding config ──────────────────────────────────
const CLIENT = {
  name: "Meridian Capital",
  logo: null, // would be a URL in production
  accentColor: "#c8a96e",          // Meridian gold
  accentHex: "c8a96e",
  headerGradient: "from-[#0a1628] via-[#0f2040] to-[#0a1628]",
  buttonClass: "bg-[#c8a96e] hover:bg-[#b8955a] text-[#0a1628]",
  badgeBg: "bg-[#c8a96e]/10 border-[#c8a96e]/30 text-[#c8a96e]",
  senderName: "Meridian Capital Investor Relations",
  footerText: "Meridian Capital · Powered by CuraLive",
  supportEmail: "ir@meridiancapital.com",
};

const EVENT = {
  title: "Full Year 2025 Results & Outlook Presentation",
  subtitle: "Annual earnings webcast for institutional investors, analysts, and shareholders.",
  hostName: "Alexandra Thornton",
  hostTitle: "Chief Financial Officer",
  hostOrg: "Meridian Capital Group",
  date: "Thursday, 20 March 2026",
  time: "09:00 – 10:30 SAST",
  timezone: "Africa/Johannesburg (UTC+2)",
  format: "Live Webcast + Dial-In",
  registrationCount: 1847,
  maxAttendees: 5000,
  slug: "meridian-fy2025-results",
};

const SPEAKERS = [
  { name: "Alexandra Thornton", title: "Chief Financial Officer", initials: "AT", color: "#c8a96e" },
  { name: "Robert Khumalo",     title: "Chief Executive Officer",  initials: "RK", color: "#3b82f6" },
  { name: "Priya Naidoo",       title: "Head of Investor Relations", initials: "PN", color: "#8b5cf6" },
  { name: "James Whitfield",    title: "Group Treasurer",           initials: "JW", color: "#10b981" },
];

const AGENDA = [
  { time: "09:00", title: "Welcome & Housekeeping",              speaker: "Priya Naidoo, IR",       duration: "5 min"  },
  { time: "09:05", title: "CEO Strategic Overview",              speaker: "Robert Khumalo, CEO",    duration: "20 min" },
  { time: "09:25", title: "Full Year 2025 Financial Results",    speaker: "Alexandra Thornton, CFO", duration: "30 min" },
  { time: "09:55", title: "2026 Outlook & Capital Allocation",   speaker: "Alexandra Thornton, CFO", duration: "15 min" },
  { time: "10:10", title: "Analyst & Investor Q&A",              speaker: "All Panellists",          duration: "20 min" },
];

const FEATURES = [
  { icon: Mic,          label: "Live Q&A",        desc: "Submit questions directly to the CFO and CEO panel" },
  { icon: BarChart3,    label: "Live Polls",       desc: "Real-time audience sentiment and voting" },
  { icon: Globe,        label: "Multi-language",   desc: "Simultaneous captions in 8 languages" },
  { icon: Play,         label: "On-Demand",        desc: "Full recording available within 2 hours of close" },
  { icon: FileText,     label: "Transcript",       desc: "AI-generated full transcript with speaker labels" },
  { icon: Shield,       label: "Secure Access",    desc: "Institutional-grade access controls" },
];

const LANGUAGES = [
  "English", "Afrikaans", "Zulu", "Xhosa", "French", "Portuguese", "Mandarin", "Arabic",
];

// ─── Regulatory disclaimer (Financial Services vertical) ──────────────────────
function RegulatoryBanner() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
            Regulatory Notice — JSE Listed Entity
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            This presentation contains forward-looking statements. Registration constitutes agreement to the
            Meridian Capital Investor Relations Terms of Access. This webcast is intended for institutional
            investors and financial professionals only. FSCA regulated.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Customisation badge (shows what was changed from default) ────────────────
function CustomisationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full ml-2">
      ✦ customised
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DemoRegistration() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", company: "",
    jobTitle: "", phone: "", language: "English", dialIn: false, consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [showCustomisations, setShowCustomisations] = useState(true);

  const pct = Math.round((EVENT.registrationCount / EVENT.maxAttendees) * 100);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {/* Gold check */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
               style={{ background: "linear-gradient(135deg, #c8a96e, #b8955a)" }}>
            <CheckCircle2 className="w-10 h-10 text-[#0a1628]" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-3">
            Registration Confirmed
          </div>
          <h2 className="text-2xl font-bold mb-2">{form.firstName}, you're registered.</h2>
          <p className="text-muted-foreground text-sm mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            A confirmation email has been sent to <strong className="text-white">{form.email || "your email address"}</strong> from{" "}
            <strong className="text-[#c8a96e]">{CLIENT.senderName}</strong>. It includes your unique join link and a calendar invite.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left mb-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Event Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3"><Calendar className="w-4 h-4 text-[#c8a96e] shrink-0 mt-0.5" /><span>{EVENT.date}</span></div>
              <div className="flex gap-3"><Clock className="w-4 h-4 text-[#c8a96e] shrink-0 mt-0.5" /><span>{EVENT.time}</span></div>
              <div className="flex gap-3"><Globe className="w-4 h-4 text-[#c8a96e] shrink-0 mt-0.5" /><span>{EVENT.timezone}</span></div>
            </div>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-muted-foreground underline"
          >
            ← Back to registration page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Customisation overlay banner ── */}
      {showCustomisations && (
        <div className="bg-emerald-900/80 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <Zap className="w-4 h-4" />
            <strong>Demo Preview Mode</strong>
            <span className="text-emerald-400/70">— Showing "Meridian Capital" client customisations. Elements marked</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full">✦ customised</span>
            <span className="text-emerald-400/70">differ from the default template.</span>
          </div>
          <button onClick={() => setShowCustomisations(false)} className="text-emerald-400/60 hover:text-emerald-300 text-xs">
            Hide
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-[#0a1628]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            {/* Client logo placeholder */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #c8a96e, #b8955a)" }}>
              <Building2 className="w-4 h-4 text-[#0a1628]" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">
                Meridian Capital
                {showCustomisations && <CustomisationBadge label="client name" />}
              </div>
              <div className="text-[10px] text-muted-foreground">Investor Relations</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden md:block" style={{ fontFamily: "'Inter', sans-serif" }}>
            Powered by <span style={{ color: CLIENT.accentColor }}>CuraLive</span>
          </div>
        </div>
      </header>

      <div className="container py-10">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Regulatory banner — Financial Services vertical */}
            <RegulatoryBanner />
            {showCustomisations && (
              <p className="text-[10px] text-emerald-400 mb-4 -mt-2">
                ✦ customised — Regulatory banner auto-applied for "Financial Services" industry vertical
              </p>
            )}

            {/* Event type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border"
                    style={{ background: `#${CLIENT.accentHex}15`, borderColor: `#${CLIENT.accentHex}40`, color: CLIENT.accentColor }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: CLIENT.accentColor }} />
                Live Webcast
              </span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                Financial Services · JSE Listed
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              {EVENT.title}
              {showCustomisations && <CustomisationBadge label="event title" />}
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {EVENT.subtitle}
            </p>

            {/* Event meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: Calendar, label: "Date",     value: "20 March 2026" },
                { icon: Clock,    label: "Time",     value: "09:00 SAST" },
                { icon: Globe,    label: "Timezone", value: "UTC+2 (SAST)" },
                { icon: Users,    label: "Format",   value: "Webcast + Dial-In" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    <Icon className="w-3 h-3" style={{ color: CLIENT.accentColor }} />
                    {label}
                  </div>
                  <div className="text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>

            {/* Registration progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span><strong className="text-white">{EVENT.registrationCount.toLocaleString()}</strong> registered</span>
                <span>{EVENT.maxAttendees.toLocaleString()} capacity</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CLIENT.accentColor }} />
              </div>
            </div>

            {/* Host card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-[#0a1628] shrink-0"
                   style={{ background: CLIENT.accentColor }}>
                AT
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {EVENT.hostName}
                  {showCustomisations && <CustomisationBadge label="host name" />}
                </div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {EVENT.hostTitle} · {EVENT.hostOrg}
                </div>
              </div>
            </div>

            {/* Speakers */}
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Speakers
                {showCustomisations && <CustomisationBadge label="speaker profiles" />}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SPEAKERS.map((s) => (
                  <div key={s.name} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                         style={{ background: s.color }}>
                      {s.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{s.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Agenda
                {showCustomisations && <CustomisationBadge label="agenda" />}
              </h3>
              <div className="space-y-2">
                {AGENDA.map((item, i) => (
                  <div key={i} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="text-xs font-mono font-bold shrink-0 mt-0.5" style={{ color: CLIENT.accentColor }}>
                      {item.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {item.speaker} · {item.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                What to Expect
                {showCustomisations && <CustomisationBadge label="feature list" />}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <Icon className="w-4 h-4 mb-2" style={{ color: CLIENT.accentColor }} />
                    <div className="text-sm font-semibold mb-0.5">{label}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Registration Form ── */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-1">Register to Attend</h2>
              <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                Free to attend. Confirmation email sent immediately.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">First Name *</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                      placeholder="Alexandra"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Last Name *</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                      placeholder="Thornton"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Work Email *</label>
                  <input
                    required type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                    placeholder="a.thornton@institution.com"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Organisation *
                    {showCustomisations && <span className="text-[9px] text-emerald-400 ml-1">✦ required (customised)</span>}
                  </label>
                  <input
                    required
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                    placeholder="Your institution or fund"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Job Title</label>
                  <input
                    value={form.jobTitle}
                    onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                    placeholder="Portfolio Manager"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Language Preference
                    {showCustomisations && <span className="text-[9px] text-emerald-400 ml-1">✦ customised options</span>}
                  </label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c8a96e] transition-colors"
                  >
                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#0a1628]">{l}</option>)}
                  </select>
                </div>

                {/* Dial-in toggle */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.dialIn}
                    onChange={e => setForm(f => ({ ...f, dialIn: e.target.checked }))}
                    className="mt-0.5 accent-[#c8a96e]"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Send me dial-in numbers and a participant access code
                  </span>
                </label>

                {/* Consent */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
                    className="mt-0.5 accent-[#c8a96e]"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    I agree to the Meridian Capital Investor Relations{" "}
                    <span style={{ color: CLIENT.accentColor }} className="underline cursor-pointer">Terms of Access</span>{" "}
                    and confirm I am a qualified investor or financial professional.
                    {showCustomisations && <span className="text-[9px] text-emerald-400 ml-1">✦ customised consent text</span>}
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, #c8a96e, #b8955a)`, color: "#0a1628" }}
                >
                  Register for Free
                  {showCustomisations && <span className="text-[9px] opacity-60 ml-2">✦ button colour customised</span>}
                </button>

                <p className="text-[10px] text-muted-foreground text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Confirmation from <strong>{CLIENT.senderName}</strong>
                  {showCustomisations && <span className="text-[9px] text-emerald-400 ml-1">✦ customised sender</span>}
                </p>
              </form>
            </div>

            {/* Customisation summary card */}
            {showCustomisations && (
              <div className="mt-4 bg-emerald-900/30 border border-emerald-500/20 rounded-xl p-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                  ✦ Active Customisations for This Client
                </div>
                <div className="space-y-1.5 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {[
                    ["Client name",       "Meridian Capital"],
                    ["Accent colour",     "#c8a96e (Meridian Gold)"],
                    ["Industry vertical", "Financial Services → Regulatory banner auto-applied"],
                    ["Event title",       "Full Year 2025 Results & Outlook Presentation"],
                    ["Host",              "Alexandra Thornton, CFO"],
                    ["Speakers",          "4 custom speaker cards"],
                    ["Agenda",            "5 custom agenda items"],
                    ["Feature list",      "6 custom features"],
                    ["Form fields",       "Organisation set to Required"],
                    ["Language options",  "8 languages including Zulu, Xhosa, Arabic"],
                    ["Consent text",      "Custom IR terms of access"],
                    ["Email sender",      "Meridian Capital Investor Relations"],
                    ["Button colour",     "Meridian Gold gradient"],
                    ["Footer",            "Meridian Capital · Powered by CuraLive"],
                  ].map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-emerald-400 shrink-0">{key}:</span>
                      <span className="text-emerald-200/70">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-16">
        <div className="container text-center text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          {CLIENT.footerText}
          {showCustomisations && <span className="text-[9px] text-emerald-400 ml-2">✦ customised footer</span>}
          {" · "}
          <a href={`mailto:${CLIENT.supportEmail}`} style={{ color: CLIENT.accentColor }}>{CLIENT.supportEmail}</a>
          {showCustomisations && <span className="text-[9px] text-emerald-400 ml-1">✦ customised support email</span>}
        </div>
      </footer>
    </div>
  );
}
