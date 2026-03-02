/**
 * WebcastRegister.tsx — Chorus.AI Event Registration Landing Page
 * Public-facing registration page for any webcast, webinar, virtual event, or hybrid event.
 * Supports: custom branding, agenda, speakers, and registration form.
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Globe, Users, CheckCircle2, ChevronRight,
  Video, Mic, BarChart3, MessageSquare, Play, ArrowRight,
  Loader2, AlertCircle, Zap, Radio
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

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  country: string;
  phone: string;
  consent: boolean;
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WebcastRegister() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", company: "",
    jobTitle: "", country: "", phone: "", consent: false,
  });

  const { data: event, isLoading: eventLoading } = trpc.webcast.getEvent.useQuery(
    { slug: slug || "" },
    { enabled: !!slug, retry: false }
  );

  const registerMutation = trpc.webcast.register.useMutation({
    onSuccess: () => { setSubmitted(true); setSubmitting(false); },
    onError: (err) => { setError(err.message); setSubmitting(false); },
  });

  // Cast to any to allow DEMO_EVENT fallback fields (subtitle, agenda, speakers, hostTitle)
  const ev = (event || DEMO_EVENT) as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) { setError("Please accept the terms to register."); return; }
    if (!form.firstName || !form.lastName || !form.email || !form.company || !form.country) {
      setError("Please fill in all required fields."); return;
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
    });
  };

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }));
    setError(null);
  };

  const spotsLeft = (ev as any).maxAttendees ? (ev as any).maxAttendees - ((ev as any).registrationCount || 0) : null;
  const pctFull = (ev as any).maxAttendees ? Math.round((((ev as any).registrationCount || 0) / (ev as any).maxAttendees) * 100) : 0;

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

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

      {/* ── Main Layout ── */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start max-w-5xl mx-auto">

          {/* ── Left: Event Details ── */}
          <div>
            {/* Event type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                ev.status === "live"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-primary/10 text-primary border-primary/20"
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
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Date</div>
                  <div className="text-sm font-semibold">
                    {ev.startTime ? formatEventDate(ev.startTime, ev.timezone || "UTC") : "TBC"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
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
                <Video className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Format</div>
                  <div className="text-sm font-semibold">Live Webcast · Online</div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
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
                    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">You're registered!</h3>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    A confirmation email has been sent to <strong>{form.email}</strong>. You'll receive a reminder 24 hours and 1 hour before the event.
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
                  <button
                    onClick={() => navigate(`/live-video/webcast/${slug || "ceo-town-hall-q1-2026"}`)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Play className="w-4 h-4" /> Enter Event Room
                  </button>
                </div>
              ) : (
                /* Registration form */
                <form onSubmit={handleSubmit}>
                  <h2 className="text-lg font-bold mb-1">Register for Free</h2>
                  <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Fill in your details to secure your spot. All fields marked * are required.
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
                          placeholder="Investor"
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
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Company *</label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => updateForm("company", e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        required
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

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={e => updateForm("consent", e.target.checked)}
                        className="mt-0.5 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        I agree to receive event communications and accept the{" "}
                        <span className="text-primary underline cursor-pointer">privacy policy</span>. *
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
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                    ) : (
                      <>Register Now <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-muted-foreground mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Free to attend · Powered by Chorus.AI
                  </p>
                </form>
              )}
            </div>

            {/* Hosted by */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
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
