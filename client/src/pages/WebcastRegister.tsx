/**
 * WebcastRegister.tsx — Chorus.AI Event Registration Landing Page
 * Public-facing registration page for any webcast, webinar, virtual event, or hybrid event.
 * Auto-applies vertical-specific templates:
 *   - healthcare / professional_services → CME/CPD accreditation banner + certificate download
 *   - financial_services / capital_markets → Regulatory disclaimer + gated access notice
 *   - government → Accessibility-first layout + multi-language toggle + public notice banner
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Globe, Users, CheckCircle2, ChevronRight,
  Video, Mic, BarChart3, MessageSquare, Play, ArrowRight,
  Loader2, AlertCircle, Zap, Radio, Award, Shield, Landmark,
  Heart, FileText, Download, Lock, Info, Languages
} from "lucide-react";

// ─── Demo event data (fallback when slug not found) ───────────────────────────
const DEMO_EVENT = {
  id: 1,
  title: "CEO All-Hands Town Hall — Q1 2026",
  subtitle: "Quarterly business update, strategy review, and open Q&A with the leadership team.",
  hostName: "David Cameron",
  hostTitle: "Chief Executive Officer",
  hostOrganization: "Chorus Call Inc.",
  eventType: "webcast",
  industryVertical: "corporate_communications",
  status: "scheduled",
  startTime: new Date("2026-03-15T10:00:00Z").getTime(),
  endTime: new Date("2026-03-15T11:30:00Z").getTime(),
  timezone: "Africa/Johannesburg",
  language: "English",
  registrationCount: 412,
  maxAttendees: 1000,
  agenda: [
    { time: "10:00", title: "Welcome & Opening Remarks", speaker: "David Cameron, CEO", duration: "10 min" },
    { time: "10:10", title: "Q1 2026 Business Performance Review", speaker: "Sarah Mitchell, CFO", duration: "25 min" },
    { time: "10:35", title: "Strategy & Growth Initiatives", speaker: "David Cameron, CEO", duration: "20 min" },
    { time: "10:55", title: "People & Culture Update", speaker: "Nadia Osei, CHRO", duration: "15 min" },
    { time: "11:10", title: "Open Q&A Session", speaker: "All Panellists", duration: "20 min" },
  ],
  speakers: [
    { name: "David Cameron", title: "Chief Executive Officer", initials: "DC", color: "bg-blue-500" },
    { name: "Sarah Mitchell", title: "Chief Financial Officer", initials: "SM", color: "bg-violet-500" },
    { name: "Nadia Osei", title: "Chief Human Resources Officer", initials: "NO", color: "bg-emerald-500" },
    { name: "James Adeyemi", title: "Chief Operating Officer", initials: "JA", color: "bg-amber-500" },
  ],
  features: [
    { icon: Mic, label: "Live Q&A", desc: "Submit and upvote questions in real-time" },
    { icon: BarChart3, label: "Live Polls", desc: "Participate in interactive audience polls" },
    { icon: MessageSquare, label: "Chat", desc: "Connect with fellow attendees" },
    { icon: Globe, label: "Multi-language", desc: "Captions in 8 languages" },
    { icon: Play, label: "On-Demand", desc: "Recording available after the event" },
    { icon: Zap, label: "Real-Time", desc: "Sub-100ms delivery via Chorus edge" },
  ],
};

// ─── Vertical template configs ────────────────────────────────────────────────
type VerticalTemplate = {
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  banner: React.ReactNode | null;
  formExtras: React.ReactNode | null;
  successExtras: React.ReactNode | null;
  consentText: string;
  submitLabel: string;
};

function HealthcareBanner() {
  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Award className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-violet-400 mb-1">CME/CPD Accredited Event</div>
          <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            This webinar has been approved for <strong>1.5 CPD points</strong> by the Health Professions Council.
            Registered attendees who complete the session will receive a downloadable certificate of attendance.
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
              <Award className="w-3 h-3" /> HPCSA Accredited
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
              1.5 CPD Points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthcareFormExtras({ form, updateForm }: { form: any; updateForm: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">HPCSA / Professional Registration No. *</label>
        <input
          type="text"
          value={form.hpcsaNumber || ""}
          onChange={e => updateForm("hpcsaNumber", e.target.value)}
          placeholder="MP 0123456"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Required for CPD certificate generation.
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Specialty / Discipline</label>
        <select
          value={form.specialty || ""}
          onChange={e => updateForm("specialty", e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="">Select specialty…</option>
          <option value="general_practice">General Practice</option>
          <option value="internal_medicine">Internal Medicine</option>
          <option value="cardiology">Cardiology</option>
          <option value="oncology">Oncology</option>
          <option value="paediatrics">Paediatrics</option>
          <option value="nursing">Nursing</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="allied_health">Allied Health</option>
          <option value="other">Other</option>
        </select>
      </div>
    </>
  );
}

function HealthcareSuccessExtras({ email }: { email: string }) {
  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mt-4 text-left">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold text-violet-400">CPD Certificate</span>
      </div>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
        After attending the full session, your CPD certificate will be emailed to <strong>{email}</strong> within 24 hours. You can also download it from the post-event page.
      </p>
      <button className="mt-3 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
        <Download className="w-3.5 h-3.5" /> Download will be available after the event
      </button>
    </div>
  );
}

function FinancialServicesBanner() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-amber-400 mb-1">Regulatory Notice</div>
          <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            This event contains material non-public information and is intended for <strong>institutional investors and professional advisors only</strong>.
            By registering, you confirm that you are a qualified investor as defined under applicable securities legislation.
            This event is not open to retail investors. Recording and redistribution of event content is strictly prohibited.
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3" /> Gated Access
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              <Shield className="w-3 h-3" /> Institutional Only
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              FSB Regulated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialServicesFormExtras({ form, updateForm }: { form: any; updateForm: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Investor Type *</label>
        <select
          value={form.investorType || ""}
          onChange={e => updateForm("investorType", e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          required
        >
          <option value="">Select investor type…</option>
          <option value="institutional_asset_manager">Institutional Asset Manager</option>
          <option value="hedge_fund">Hedge Fund</option>
          <option value="pension_fund">Pension / Provident Fund</option>
          <option value="sell_side_analyst">Sell-Side Analyst</option>
          <option value="investment_bank">Investment Bank</option>
          <option value="private_equity">Private Equity / Venture Capital</option>
          <option value="family_office">Family Office</option>
          <option value="corporate_treasury">Corporate Treasury</option>
          <option value="other_professional">Other Professional Investor</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Assets Under Management (AUM)</label>
        <select
          value={form.aum || ""}
          onChange={e => updateForm("aum", e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="">Prefer not to say</option>
          <option value="under_100m">Under $100M</option>
          <option value="100m_1b">$100M – $1B</option>
          <option value="1b_10b">$1B – $10B</option>
          <option value="over_10b">Over $10B</option>
        </select>
      </div>
    </>
  );
}

function FinancialServicesConsentExtra({ form, updateForm }: { form: any; updateForm: (k: string, v: any) => void }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={form.qualifiedInvestorConfirm || false}
        onChange={e => updateForm("qualifiedInvestorConfirm", e.target.checked)}
        className="mt-0.5 accent-amber-400"
        required
      />
      <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        I confirm that I am a <strong>qualified / institutional investor</strong> as defined under applicable securities legislation and that I am not a retail investor. *
      </span>
    </label>
  );
}

function GovernmentBanner({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const langs = [
    { code: "en", label: "English" },
    { code: "af", label: "Afrikaans" },
    { code: "zu", label: "isiZulu" },
    { code: "xh", label: "isiXhosa" },
    { code: "st", label: "Sesotho" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
  ];
  return (
    <div className="mb-6 space-y-3">
      {/* Public notice */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-blue-400 mb-1">Public Notice — Open Government Event</div>
            <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              This is an official public event. It will be broadcast live and a full recording will be made available on the government portal within 48 hours.
              All attendees are subject to the <span className="text-blue-400 underline cursor-pointer">Public Access Policy</span>.
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                <Globe className="w-3 h-3" /> Open to Public
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                WCAG 2.1 AA
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                <FileText className="w-3 h-3" /> Transcript Available
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Language selector */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Select your preferred language:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                lang === l.code
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-blue-500/20"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GovernmentFormExtras({ form, updateForm }: { form: any; updateForm: (k: string, v: any) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">Province / Region</label>
      <select
        value={form.province || ""}
        onChange={e => updateForm("province", e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="">Select province…</option>
        <option value="gp">Gauteng</option>
        <option value="wc">Western Cape</option>
        <option value="kzn">KwaZulu-Natal</option>
        <option value="ec">Eastern Cape</option>
        <option value="lp">Limpopo</option>
        <option value="mp">Mpumalanga</option>
        <option value="nw">North West</option>
        <option value="nc">Northern Cape</option>
        <option value="fs">Free State</option>
        <option value="other">Other / International</option>
      </select>
    </div>
  );
}

function GovernmentAccessibilityBar() {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 mb-6 text-xs text-muted-foreground flex-wrap">
      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      <span>Accessibility:</span>
      <span className="text-blue-400">Sign Language Interpretation</span>
      <span>·</span>
      <span className="text-blue-400">Live Captions (WCAG 2.1 AA)</span>
      <span>·</span>
      <span className="text-blue-400">Audio Description</span>
      <span>·</span>
      <span className="text-blue-400">Screen Reader Compatible</span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  country: string;
  phone: string;
  consent: boolean;
  // Healthcare extras
  hpcsaNumber?: string;
  specialty?: string;
  // Financial extras
  investorType?: string;
  aum?: string;
  qualifiedInvestorConfirm?: boolean;
  // Government extras
  province?: string;
};

const COUNTRIES = [
  "South Africa", "United Kingdom", "United States", "Kenya", "Nigeria",
  "Ghana", "Egypt", "France", "Germany", "Netherlands", "Switzerland",
  "United Arab Emirates", "Singapore", "Australia", "Canada", "Other"
];

function formatEventDate(ts: number, tz: string) {
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: tz,
  });
}

function formatEventTime(ts: number, tz: string) {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: tz, timeZoneName: "short"
  });
}

function formatDuration(startTs: number, endTs: number) {
  const mins = Math.round((endTs - startTs) / 60000);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim();
  return `${mins} minutes`;
}

// ─── Vertical template resolver ───────────────────────────────────────────────
function getVerticalTemplate(vertical: string, form: FormData, updateForm: (k: string, v: any) => void, lang: string, setLang: (l: string) => void): VerticalTemplate {
  const isHealthcare = vertical === "healthcare" || vertical === "professional_services";
  const isFinancial = vertical === "financial_services" || vertical === "capital_markets";
  const isGov = vertical === "government";

  if (isHealthcare) {
    return {
      accentColor: "text-violet-400",
      accentBg: "bg-violet-500/10",
      accentBorder: "border-violet-500/20",
      banner: <HealthcareBanner />,
      formExtras: <HealthcareFormExtras form={form} updateForm={updateForm} />,
      successExtras: <HealthcareSuccessExtras email={form.email} />,
      consentText: "I agree to receive event communications, accept the privacy policy, and consent to my CPD records being submitted to the relevant accrediting body. *",
      submitLabel: "Register & Claim CPD Points",
    };
  }

  if (isFinancial) {
    return {
      accentColor: "text-amber-400",
      accentBg: "bg-amber-500/10",
      accentBorder: "border-amber-500/20",
      banner: <FinancialServicesBanner />,
      formExtras: <FinancialServicesFormExtras form={form} updateForm={updateForm} />,
      successExtras: (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Gated Access Confirmed</span>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Your registration has been verified. You will receive a unique access link 30 minutes before the event. Do not share this link.
          </p>
        </div>
      ),
      consentText: "I confirm I am a qualified/institutional investor, agree to the event terms, and accept that recording or redistribution of content is prohibited. *",
      submitLabel: "Request Gated Access",
    };
  }

  if (isGov) {
    return {
      accentColor: "text-blue-400",
      accentBg: "bg-blue-500/10",
      accentBorder: "border-blue-500/20",
      banner: <GovernmentBanner lang={lang} setLang={setLang} />,
      formExtras: <GovernmentFormExtras form={form} updateForm={updateForm} />,
      successExtras: (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mt-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400">Public Event — No Login Required</span>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            You can join this event without logging in. A reminder will be sent to your email. A full transcript and recording will be available on the government portal after the event.
          </p>
        </div>
      ),
      consentText: "I agree to receive event communications and accept the public participation terms. *",
      submitLabel: "Register to Attend",
    };
  }

  // Default template
  return {
    accentColor: "text-primary",
    accentBg: "bg-primary/10",
    accentBorder: "border-primary/20",
    banner: null,
    formExtras: null,
    successExtras: null,
    consentText: "I agree to receive event communications and accept the privacy policy. *",
    submitLabel: "Register Now",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WebcastRegister() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendeeToken, setAttendeeToken] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", company: "",
    jobTitle: "", country: "", phone: "", consent: false,
  });

  const { data: event, isLoading: eventLoading } = trpc.webcast.getEvent.useQuery(
    { slug: slug || "" },
    { enabled: !!slug, retry: false }
  );

  const registerMutation = trpc.webcast.register.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setSubmitting(false);
      if (data.attendeeToken) setAttendeeToken(data.attendeeToken);
    },
    onError: (err) => { setError(err.message); setSubmitting(false); },
  });

  const ev = (event || DEMO_EVENT) as any;
  const vertical = ev.industryVertical || "general";
  const template = getVerticalTemplate(vertical, form, (k, v) => setForm(f => ({ ...f, [k]: v })), lang, setLang);
  const isGov = vertical === "government";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) { setError("Please accept the terms to register."); return; }
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Please fill in all required fields."); return;
    }
    if ((vertical === "financial_services" || vertical === "capital_markets") && !form.qualifiedInvestorConfirm) {
      setError("Please confirm your qualified investor status to proceed."); return;
    }
    setError(null);
    setSubmitting(true);
    registerMutation.mutate({
      eventId: ev.id,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      company: form.company,
      jobTitle: form.jobTitle,
      country: form.country,
      registrationSource: "direct",
      origin: window.location.origin,
    });
  };

  const updateForm = (field: string, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }));
    setError(null);
  };

  const spotsLeft = ev.maxAttendees ? ev.maxAttendees - (ev.registrationCount || 0) : null;
  const pctFull = ev.maxAttendees ? Math.round(((ev.registrationCount || 0) / ev.maxAttendees) * 100) : 0;

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Vertical accent bar at top ── */}
      <div className={`h-1 w-full ${
        vertical === "healthcare" || vertical === "professional_services" ? "bg-violet-500" :
        vertical === "financial_services" || vertical === "capital_markets" ? "bg-amber-500" :
        vertical === "government" ? "bg-blue-500" :
        "bg-primary"
      }`} />

      {/* ── Header ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => navigate("/live-video/webcasting")} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1.5">
            ← All Events
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Chorus.AI</span>
          </div>
          <button onClick={() => navigate("/book-demo")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Request Demo
          </button>
        </div>
      </header>

      {/* ── Government accessibility bar ── */}
      {isGov && (
        <div className="border-b border-border bg-blue-500/5">
          <div className="container py-2">
            <GovernmentAccessibilityBar />
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start max-w-5xl mx-auto">

          {/* ── Left: Event Details ── */}
          <div>
            {/* Vertical banner */}
            {template.banner}

            {/* Event type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                ev.status === "live"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : `${template.accentBg} ${template.accentColor} ${template.accentBorder}`
              }`}>
                {ev.status === "live" ? "🔴 Live Now" : ev.eventType?.replace(/_/g, " ") || "Webcast"}
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded border border-border capitalize">
                {ev.industryVertical?.replace(/_/g, " ") || "Corporate"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold leading-tight mb-3">{ev.title}</h1>
            {ev.subtitle && (
              <p className="text-muted-foreground leading-relaxed mb-6 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                {ev.subtitle}
              </p>
            )}

            {/* Event meta */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Calendar className={`w-4 h-4 ${template.accentColor} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Date</div>
                  <div className="text-sm font-semibold">
                    {ev.startTime ? formatEventDate(ev.startTime, ev.timezone || "UTC") : "TBC"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Clock className={`w-4 h-4 ${template.accentColor} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Time</div>
                  <div className="text-sm font-semibold">
                    {ev.startTime ? formatEventTime(ev.startTime, ev.timezone || "UTC") : "TBC"}
                    {ev.startTime && ev.endTime && (
                      <span className="text-muted-foreground text-xs ml-1.5">({formatDuration(ev.startTime, ev.endTime)})</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Video className={`w-4 h-4 ${template.accentColor} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Format</div>
                  <div className="text-sm font-semibold capitalize">{ev.eventType?.replace(/_/g, " ") || "Live Webcast"} · Online</div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Users className={`w-4 h-4 ${template.accentColor} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Registered</div>
                  <div className="text-sm font-semibold">{(ev.registrationCount || 0).toLocaleString()} attendees</div>
                  {spotsLeft !== null && spotsLeft < 200 && (
                    <div className="text-xs text-amber-400 mt-0.5">{spotsLeft} spots remaining</div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration progress bar */}
            {ev.maxAttendees && pctFull > 50 && (
              <div className="mb-8 bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Registration capacity</span>
                  <span className={`font-semibold ${pctFull > 80 ? "text-amber-400" : "text-foreground"}`}>{pctFull}% full</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pctFull > 80 ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: `${pctFull}%` }}
                  />
                </div>
              </div>
            )}

            {/* Agenda */}
            {ev.agenda && ev.agenda.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Agenda</h2>
                <div className="space-y-2">
                  {ev.agenda.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-border/50 last:border-0">
                      <div className="text-xs font-mono text-muted-foreground w-12 shrink-0 pt-0.5">{item.time}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {item.speaker} · {item.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {ev.speakers && ev.speakers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Speakers</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ev.speakers.map((sp: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                      <div className={`w-10 h-10 rounded-full ${sp.color || "bg-primary/20"} flex items-center justify-center shrink-0`}>
                        <span className="text-sm font-bold text-white">{sp.initials}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{sp.name}</div>
                        <div className="text-xs text-muted-foreground">{sp.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h2 className="text-lg font-bold mb-4">What to expect</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEMO_EVENT.features.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5 bg-card border border-border rounded-xl p-3">
                    <Icon className={`w-4 h-4 ${template.accentColor} shrink-0 mt-0.5`} />
                    <div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Registration Form ── */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-card border border-border rounded-2xl p-6">
              {submitted ? (
                /* Success state */
                <div className="text-center py-4">
                  <div className={`w-14 h-14 rounded-full ${template.accentBg} border ${template.accentBorder} flex items-center justify-center mx-auto mb-4`}>
                    <CheckCircle2 className={`w-7 h-7 ${template.accentColor}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">You're registered!</h3>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    A confirmation email with a calendar invite (.ics) has been sent to <strong>{form.email}</strong>.
                  </p>
                  <div className="bg-secondary rounded-xl p-4 text-left mb-4">
                    <div className="text-xs text-muted-foreground mb-1">Event</div>
                    <div className="text-sm font-semibold">{ev.title}</div>
                    {ev.startTime && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatEventDate(ev.startTime, ev.timezone || "UTC")} at {formatEventTime(ev.startTime, ev.timezone || "UTC")}
                      </div>
                    )}
                  </div>
                  {template.successExtras}
                  {attendeeToken && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-left">
                      <div className="text-xs font-semibold text-primary mb-1">
                        {ev.status === "on_demand" || ev.status === "ended" ? "Your personal watch link" : "Your personal join link"}
                      </div>
                      <div className="text-[10px] text-muted-foreground break-all font-mono">
                        {window.location.origin}/live-video/webcast/{slug || "ceo-town-hall-q1-2026"}/{
                          ev.status === "on_demand" || ev.status === "ended" ? "watch" : "attend"
                        }?token={attendeeToken}
                      </div>
                    </div>
                  )}
                  {/* Primary CTA: Watch Recording (on_demand/ended) or Enter Event Room (live/scheduled) */}
                  {(ev.status === "on_demand" || ev.status === "ended") && attendeeToken ? (
                    <button
                      onClick={() => navigate(`/live-video/webcast/${slug || "ceo-town-hall-q1-2026"}/watch?token=${attendeeToken}`)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-4"
                    >
                      <Play className="w-4 h-4" /> Watch Recording Now
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(attendeeToken
                        ? `/live-video/webcast/${slug || "ceo-town-hall-q1-2026"}/attend?token=${attendeeToken}`
                        : `/live-video/webcast/${slug || "ceo-town-hall-q1-2026"}`
                      )}
                      className={`w-full flex items-center justify-center gap-2 ${template.accentBg} ${template.accentColor} border ${template.accentBorder} py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-4`}
                    >
                      <Play className="w-4 h-4" /> {ev.status === "live" ? "Watch Live Now" : "Enter Event Room"}
                    </button>
                  )}
                </div>
              ) : (
                /* Registration form */
                <form onSubmit={handleSubmit}>
                  <h2 className="text-lg font-bold mb-1">
                    {vertical === "financial_services" || vertical === "capital_markets" ? "Request Gated Access" :
                     vertical === "healthcare" || vertical === "professional_services" ? "Register & Claim CPD" :
                     "Register for Free"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Fill in your details to secure your spot. Fields marked * are required.
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">First name *</label>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={e => updateForm("firstName", e.target.value)}
                          placeholder="Jane"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Last name *</label>
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={e => updateForm("lastName", e.target.value)}
                          placeholder="Smith"
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Work email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => updateForm("email", e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        {vertical === "government" ? "Organisation (optional)" : "Company *"}
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => updateForm("company", e.target.value)}
                        placeholder={vertical === "government" ? "Department / Organisation" : "Acme Corp"}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        required={vertical !== "government"}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Job title</label>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={e => updateForm("jobTitle", e.target.value)}
                        placeholder="Portfolio Manager"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Country *</label>
                      <select
                        value={form.country}
                        onChange={e => updateForm("country", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        required
                      >
                        <option value="">Select country…</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Phone (optional)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => updateForm("phone", e.target.value)}
                        placeholder="+27 11 000 0000"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Vertical-specific form extras */}
                    {template.formExtras}

                    {/* Financial services qualified investor checkbox */}
                    {(vertical === "financial_services" || vertical === "capital_markets") && (
                      <FinancialServicesConsentExtra form={form} updateForm={updateForm} />
                    )}

                    {/* Standard consent */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={e => updateForm("consent", e.target.checked)}
                        className="mt-0.5 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {template.consentText}
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-3">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-5 disabled:opacity-60 ${
                      vertical === "healthcare" || vertical === "professional_services"
                        ? "bg-violet-500 text-white"
                        : vertical === "financial_services" || vertical === "capital_markets"
                        ? "bg-amber-500 text-black"
                        : vertical === "government"
                        ? "bg-blue-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                    ) : (
                      <>{template.submitLabel} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-muted-foreground mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {vertical === "financial_services" || vertical === "capital_markets"
                      ? "Institutional access only · Powered by Chorus.AI"
                      : vertical === "healthcare" || vertical === "professional_services"
                      ? "CPD accredited · Powered by Chorus.AI"
                      : "Free to attend · Powered by Chorus.AI"}
                  </p>
                </form>
              )}
            </div>

            {/* Hosted by */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${template.accentBg} flex items-center justify-center shrink-0`}>
                <span className={`text-sm font-bold ${template.accentColor}`}>
                  {ev.hostName?.split(" ").map((n: string) => n[0]).join("") || "CH"}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Hosted by</div>
                <div className="text-sm font-semibold">{ev.hostName || "Chorus Call"}</div>
                {ev.hostTitle && <div className="text-xs text-muted-foreground">{ev.hostTitle}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
