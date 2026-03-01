import { useLocation } from "wouter";
import {
  Zap, Video, Mic, BarChart3, MessageSquare, Globe, ArrowRight,
  Play, Settings, Code2, Package, FileText, Radio, MonitorPlay,
  CheckCircle2, ExternalLink, Users, Clock, Shield, TrendingUp,
  PhoneCall, Mail, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus_ai_demo_v5_7a9fdeb3.mp4";
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png";
const APP_BASE = "https://chorusai-mdu4k2ib.manus.space";

const PLATFORM_MODULES = [
  {
    icon: Users,
    label: "Attendee Event Room",
    desc: "Live transcript, 12-language toggle, real-time sentiment, AI rolling summary, Q&A submission",
    path: "/event/q4-earnings-2026",
    color: "text-primary",
    badge: "LIVE DEMO",
  },
  {
    icon: Radio,
    label: "Moderator Console",
    desc: "AI Q&A triage, toxicity filter, live polls, sentiment dashboard, approve/reject queue",
    path: "/moderator/q4-earnings-2026",
    color: "text-amber-400",
    badge: "OPERATOR",
  },
  {
    icon: MonitorPlay,
    label: "Presenter Teleprompter",
    desc: "Large-text live transcript, approved Q&A feed, pace coach, filler-word detector",
    path: "/presenter/q4-earnings-2026",
    color: "text-red-400",
    badge: "SPEAKER",
  },
  {
    icon: Settings,
    label: "Operator Console",
    desc: "Platform connect (Zoom/Teams/Webex/RTMP), 18-country dial-in, silence detector, stream controls",
    path: "/operator/q4-earnings-2026",
    color: "text-slate-400",
    badge: "HOST",
  },
  {
    icon: FileText,
    label: "Post-Event Intelligence",
    desc: "AI summary, JSE/IFRS highlights, press release draft, full transcript, replay, analytics",
    path: "/post-event/q4-earnings-2026",
    color: "text-emerald-400",
    badge: "REPORT",
  },
  {
    icon: Code2,
    label: "Integration Hub",
    desc: "Recall.ai, Zoom RTMS, Microsoft Teams Bot, RTMP ingest, PSTN dial-in setup guides",
    path: "/integrations",
    color: "text-blue-400",
    badge: "TECH",
  },
  {
    icon: Package,
    label: "Partner API & Widget",
    desc: "Webhook events, REST API docs, embeddable attendee widget for your IR portal",
    path: "/partner-api",
    color: "text-violet-400",
    badge: "API",
  },
];

const FEATURES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text, <1s latency, powered by OpenAI Whisper via Recall.ai" },
  { icon: Globe, label: "12 Languages", desc: "Arabic (RTL), French, Portuguese, Swahili, Zulu, Hindi, Mandarin + more" },
  { icon: BarChart3, label: "Sentiment Analysis", desc: "AI monitors tone and audience reaction in real-time throughout the event" },
  { icon: MessageSquare, label: "Smart Q&A", desc: "Attendees submit, upvote, categorize — moderated and AI-prioritised" },
  { icon: Video, label: "Platform Neutral", desc: "Zoom RTMS, Microsoft Teams Bot, Webex, RTMP, PSTN dial-in — all supported" },
  { icon: Zap, label: "Real-Time Delivery", desc: "Sub-100ms message delivery via Chorus Call's proprietary edge network — zero polling" },
  { icon: Shield, label: "White-Label Ready", desc: "Your brand, your domain, your colours — full white-label configuration" },
  { icon: TrendingUp, label: "JSE/IFRS Compliance", desc: "Post-event AI summary flags regulatory items and generates press-ready output" },
];

const STATS = [
  { value: "12", label: "Languages Supported" },
  { value: "18", label: "Dial-In Countries" },
  { value: "<1s", label: "Transcription Latency" },
  { value: "100ms", label: "Real-Time Delivery" },
];

export default function Demo() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Chorus Call" className="h-9 w-auto object-contain" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">Sales Demo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#video" className="hover:text-foreground transition-colors">Demo Video</a>
            <a href="#modules" className="hover:text-foreground transition-colors">Platform Modules</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <Button onClick={() => navigate("/event/q4-earnings-2026")} size="sm" className="gap-2">
            <Play className="w-3.5 h-3.5" /> Launch Live Demo
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 border-b border-border">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Board Presentation — Sales Forecast Q1 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
              Chorus.AI<br />
              <span className="text-primary">The Intelligence Layer</span><br />
              for Every Investor Event
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              Real-time transcription, sentiment analysis, smart Q&A, and AI summaries — delivered live to every participant across Zoom, Microsoft Teams, Webex, RTMP, and PSTN. Fully white-label. JSE/IFRS compliant. 12 languages.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => navigate("/event/q4-earnings-2026")} size="lg" className="gap-2">
                <Play className="w-4 h-4" /> Enter Live Event Room
              </Button>
              <Button variant="outline" size="lg" className="gap-2 bg-card" onClick={() => {
                document.getElementById("video")?.scrollIntoView({ behavior: "smooth" });
              }}>
                <Video className="w-4 h-4" /> Watch Demo Video
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-border bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section id="video" className="py-20 border-b border-border">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3">Platform Demo Video</h2>
              <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                55-second overview of all 10 platform modules — generated with Runway Gen-4.5 AI visuals and professional voiceover.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-border bg-black shadow-2xl">
              <video
                controls
                autoPlay={false}
                className="w-full aspect-video"
                poster={LOGO_URL}
              >
                <source src={DEMO_VIDEO_URL} type="video/mp4" />
              </video>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span>55 seconds</span>
              <span>·</span>
              <span>1280×720 HD</span>
              <span>·</span>
              <span>Professional AI voiceover</span>
              <span>·</span>
              <a href={DEMO_VIDEO_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                Download MP4 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section id="modules" className="py-20 border-b border-border bg-card/20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-3">Live Platform Modules</h2>
            <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              Click any module to enter the live demo environment. All data is real-time, powered by Chorus Call.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live at: <a href={APP_BASE} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">{APP_BASE}</a>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {PLATFORM_MODULES.map(({ icon: Icon, label, desc, path, color, badge }) => (
              <button
                key={path}
                onClick={() => window.open(`${APP_BASE}${path}`, "_blank")}
                className="group text-left bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-[9px] font-bold tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded">{badge}</span>
                </div>
                <div className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">{label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open module <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Direct URLs */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Direct Demo URLs</h2>
          <div className="space-y-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {[
              { label: "🏠 Main Platform", url: `${APP_BASE}/` },
              { label: "🎯 Attendee Event Room (Q4 Earnings Call)", url: `${APP_BASE}/event/q4-earnings-2026` },
              { label: "🎛️ Moderator Console", url: `${APP_BASE}/moderator/q4-earnings-2026` },
              { label: "🎤 Presenter Teleprompter", url: `${APP_BASE}/presenter/q4-earnings-2026` },
              { label: "⚙️ Operator Console", url: `${APP_BASE}/operator/q4-earnings-2026` },
              { label: "📊 Post-Event Intelligence Report", url: `${APP_BASE}/post-event/q4-earnings-2026` },
              { label: "🔗 Integration Hub", url: `${APP_BASE}/integrations` },
              { label: "📦 Partner API & Widget", url: `${APP_BASE}/partner-api` },
              { label: "🎬 This Sales Demo Page", url: `${APP_BASE}/demo` },
            ].map(({ label, url }) => (
              <div key={url} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                <span className="text-sm font-medium">{label}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
                >
                  {url.replace("https://", "")} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-b border-border bg-card/20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-3">Intelligence Features</h2>
            <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Everything your IR team needs, delivered in real-time.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 border-b border-border">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-5">Why Chorus.AI Wins</h2>
              <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                {[
                  "Platform-neutral — sits on top of Zoom, Teams, Webex, RTMP, PSTN",
                  "Fully white-label — client's brand, domain, and colour scheme",
                  "12 languages including Arabic RTL — Africa, Mauritius, UAE markets",
                  "JSE/IFRS compliance flagging in post-event AI summary",
                  "Sub-100ms real-time delivery via Chorus Call proprietary edge network",
                  "AI Q&A moderation with toxicity filter — zero manual triage",
                  "18-country PSTN dial-in — essential for emerging markets",
                  "Partner API + embeddable widget for IR portal integration",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-2">Target Markets</h3>
              <div className="space-y-4 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {[
                  { market: "JSE-Listed Companies", desc: "Earnings calls, investor days, AGMs — JSE/IFRS compliant summaries" },
                  { market: "African Capital Markets", desc: "18-country dial-in, Swahili, Zulu, French, Portuguese support" },
                  { market: "Mauritius & UAE", desc: "Arabic RTL, French — IFC and DIFC-regulated IR events" },
                  { market: "IR Agencies & Banks", desc: "White-label reseller model — your brand, Chorus.AI engine" },
                ].map(({ market, desc }) => (
                  <div key={market} className="border-l-2 border-primary/40 pl-3">
                    <div className="font-semibold text-foreground">{market}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-20">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book a Live Demo?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Schedule a personalised walkthrough with the Chorus.AI team. We'll configure a white-label instance with your brand and run a live test event on your preferred platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Calendar, label: "Book a Demo", desc: "30-min live walkthrough", action: "Schedule Now" },
              { icon: Mail, label: "Email Us", desc: "demo@chorus.ai", action: "Send Email" },
              { icon: PhoneCall, label: "Call Us", desc: "+27 11 000 0000", action: "Call Now" },
            ].map(({ icon: Icon, label, desc, action }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-sm mb-1">{label}</div>
                <div className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                <span className="text-xs text-primary font-semibold">{action} →</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => navigate("/event/q4-earnings-2026")} size="lg" className="gap-2">
              <Play className="w-4 h-4" /> Enter Live Demo Now
            </Button>
            <Button variant="outline" size="lg" className="gap-2 bg-card" onClick={() => window.open(APP_BASE, "_blank")}>
              <ExternalLink className="w-4 h-4" /> Open Full Platform
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/20">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Chorus Call" className="h-6 w-auto object-contain opacity-70" />
            <span>© 2026 Chorus Call Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Platform: <a href={APP_BASE} className="text-primary hover:underline">{APP_BASE}</a></span>
            <span>·</span>
            <span>Powered by Chorus.AI</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
