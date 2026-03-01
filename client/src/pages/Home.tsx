import { useLocation } from "wouter";
import { Zap, Video, Mic, BarChart3, MessageSquare, Globe, ArrowRight, Play } from "lucide-react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-hero-bg-bFr44AaNNWKkv4uMRbTXe8.webp";

const DEMO_EVENTS = [
  {
    id: "q4-earnings-2026",
    title: "Q4 2025 Earnings Call",
    company: "Chorus Call Inc.",
    platform: "Zoom",
    status: "live",
    attendees: 1247,
    duration: "42:18",
  },
  {
    id: "investor-day-2026",
    title: "Annual Investor Day",
    company: "Chorus Call Inc.",
    platform: "Microsoft Teams",
    status: "upcoming",
    attendees: 3500,
    duration: "—",
  },
  {
    id: "board-briefing",
    title: "Board Strategy Briefing",
    company: "Chorus Call Inc.",
    platform: "Webex",
    status: "completed",
    attendees: 24,
    duration: "1:28:05",
  },
];

const FEATURES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text powered by OpenAI Whisper with <1s latency." },
  { icon: BarChart3, label: "Sentiment Analysis", desc: "AI monitors tone and audience reaction in real-time throughout the event." },
  { icon: MessageSquare, label: "Smart Q&A", desc: "Attendees submit, upvote, and categorize questions — moderated by AI." },
  { icon: Globe, label: "Auto-Translation", desc: "Participants choose their language; transcripts translate instantly." },
  { icon: Video, label: "Platform Neutral", desc: "Works with Zoom, Microsoft Teams, Webex, and any RTMP source." },
  { icon: Zap, label: "Ably Real-Time", desc: "Sub-100ms message delivery via Ably's global edge network." },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
        <span className="live-badge-dot inline-block w-2 h-2 rounded-full bg-red-400" />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Upcoming</span>
    );
  }
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</span>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "Zoom") return <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">Zoom</span>;
  if (platform === "Microsoft Teams") return <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">Teams</span>;
  return <span className="text-[10px] font-bold bg-slate-600 text-white px-1.5 py-0.5 rounded">{platform}</span>;
}

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">Chorus<span className="text-primary">.AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#events" className="hover:text-foreground transition-colors">Events</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
          </nav>
          <button
            onClick={() => navigate("/event/q4-earnings-2026")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" />
            Launch Demo
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Broadcast studio"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <span className="live-badge-dot inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              Now Live — Board Demo
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              The Intelligence Layer<br />
              <span className="text-primary">for Every Meeting</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
              Chorus.AI sits on top of Zoom, Microsoft Teams, and Webex — delivering real-time transcription, sentiment analysis, and smart Q&A to every investor event, earnings call, and board briefing.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/event/q4-earnings-2026")}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Enter Live Event Room
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors"
              >
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-24 border-t border-border">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-3">Active Events</h2>
            <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Click any event to enter the live intelligence room.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {DEMO_EVENTS.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="group text-left bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={event.status} />
                  <PlatformIcon platform={event.platform} />
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{event.company}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span>{event.attendees.toLocaleString()} attendees</span>
                  <span className="flex items-center gap-1">
                    {event.status === "live" && <span className="text-primary font-medium">{event.duration}</span>}
                    {event.status !== "live" && event.duration}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border bg-card/30">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-3">Intelligence Features</h2>
            <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Everything your IR team needs, delivered in real-time.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-24 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Platform Neutral by Design</h2>
              <p className="text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                Chorus.AI doesn't compete with Zoom or Teams — it sits on top of them. We capture audio via native APIs and deliver intelligence to every participant, regardless of which platform they're on.
              </p>
              <div className="space-y-3">
                {[
                  { name: "Zoom RTMS", desc: "Real-Time Media Streams API — direct audio capture", color: "bg-blue-600" },
                  { name: "Microsoft Teams Bot", desc: "Azure Bot Framework — joins as a trusted participant", color: "bg-purple-600" },
                  { name: "Recall.ai", desc: "Universal bot — works on any platform, no setup required", color: "bg-primary" },
                  { name: "RTMP Ingest", desc: "Professional studio encoders (OBS, vMix, Wirecast)", color: "bg-slate-600" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-3">
                    <span className={`text-[10px] font-bold text-white px-2 py-1 rounded ${item.color} shrink-0`}>{item.name}</span>
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-primary mb-2">~$0.98</div>
              <div className="text-muted-foreground text-sm mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>Total cost per 90-minute event</div>
              <div className="space-y-3 text-left">
                {[
                  ["Recall.ai (Recording)", "$0.50"],
                  ["Whisper (Transcription)", "$0.15"],
                  ["Ably (Real-Time Messaging)", "$0.05"],
                  ["Cloud Compute", "$0.28"],
                ].map(([label, cost]) => (
                  <div key={label} className="flex justify-between text-sm border-b border-border pb-2">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
                    <span className="font-semibold">{cost}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Premium Gross Margin</div>
                <div className="text-2xl font-bold text-primary">&gt; 99%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Chorus<span className="text-primary">.AI</span></span>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Confidential — Chorus Call Internal Board Presentation
          </p>
        </div>
      </footer>
    </div>
  );
}
