import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Zap, Calendar, Clock, Users, Globe, ArrowRight, CheckCircle } from "lucide-react";

const EVENT_META: Record<string, { title: string; company: string; platform: string; date: string; time: string; description: string }> = {
  "q4-earnings-2026": {
    title: "Q4 2025 Earnings Call",
    company: "Chorus Call Inc.",
    platform: "Zoom",
    date: "March 1, 2026",
    time: "9:00 AM EST / 2:00 PM GMT",
    description: "Join Chorus Call's CEO James Mitchell and CFO Sarah Chen for a live discussion of Q4 2025 financial results, full-year 2025 performance, and 2026 guidance.",
  },
  "investor-day-2026": {
    title: "Annual Investor Day",
    company: "Chorus Call Inc.",
    platform: "Microsoft Teams",
    date: "March 15, 2026",
    time: "10:00 AM EST / 3:00 PM GMT",
    description: "A full-day investor event featuring presentations from the executive team on Chorus.AI strategy, product roadmap, and long-term financial targets.",
  },
  "board-briefing": {
    title: "Board Strategy Briefing",
    company: "Chorus Call Inc.",
    platform: "Webex",
    date: "March 5, 2026",
    time: "2:00 PM EST / 7:00 PM GMT",
    description: "Confidential board briefing on the Chorus.AI platform strategy, competitive positioning, and 2026 build plan.",
  },
};

const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Mandarin", "Portuguese", "Arabic"];

export default function Registration() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const eventId = params.id ?? "q4-earnings-2026";
  const meta = EVENT_META[eventId] ?? EVENT_META["q4-earnings-2026"];

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "", title: "", language: "English", dialIn: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.company) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're registered!</h1>
          <p className="text-muted-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            A confirmation has been sent to <strong className="text-foreground">{form.email}</strong>
          </p>
          <p className="text-muted-foreground text-sm mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            Your preferred language is <strong className="text-foreground">{form.language}</strong>. Transcripts will be translated automatically.
          </p>
          <div className="bg-card border border-border rounded-xl p-5 text-left mb-6 space-y-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between"><span className="text-muted-foreground">Event</span><span className="font-semibold">{meta.title}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{meta.date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{meta.time}</span></div>
            {form.dialIn && <div className="flex justify-between"><span className="text-muted-foreground">Dial-In</span><span className="text-primary">Included in confirmation email</span></div>}
          </div>
          <button onClick={() => navigate(`/event/${eventId}`)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Enter Event Room <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">Chorus<span className="text-primary">.AI</span></span>
        </div>
        <span className="text-muted-foreground text-sm">/ Registration</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        {/* Event Info */}
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Upcoming Event
          </div>
          <h1 className="text-3xl font-bold mb-3">{meta.title}</h1>
          <p className="text-muted-foreground font-medium mb-6">{meta.company}</p>
          <p className="text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>{meta.description}</p>

          <div className="space-y-3">
            {[
              { icon: Calendar, label: meta.date },
              { icon: Clock, label: meta.time },
              { icon: Users, label: "Open to registered investors and analysts" },
              { icon: Globe, label: "Available in 8 languages via Chorus.AI translation" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Powered by Chorus.AI</div>
            <div className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              {["Real-time transcription in your language", "Live sentiment analysis", "AI-prioritized Q&A", "Post-event summary & full transcript"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Register to Attend</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">First Name *</label>
                  <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                    style={{ fontFamily: "'Inter', sans-serif" }} placeholder="James" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Last Name *</label>
                  <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                    style={{ fontFamily: "'Inter', sans-serif" }} placeholder="Mitchell" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  style={{ fontFamily: "'Inter', sans-serif" }} placeholder="james@example.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Company *</label>
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  style={{ fontFamily: "'Inter', sans-serif" }} placeholder="Goldman Sachs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Job Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  style={{ fontFamily: "'Inter', sans-serif" }} placeholder="Portfolio Manager" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Preferred Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="dialin" checked={form.dialIn} onChange={(e) => setForm({ ...form, dialIn: e.target.checked })}
                  className="w-4 h-4 rounded border-border accent-primary" />
                <label htmlFor="dialin" className="text-sm text-muted-foreground cursor-pointer" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Send me dial-in phone numbers (PSTN fallback)
                </label>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Registering…</>
                ) : (
                  <>Register Now <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
