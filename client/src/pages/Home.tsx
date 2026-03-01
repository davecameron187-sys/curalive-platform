import { useLocation } from "wouter";
import { Zap, Video, Mic, BarChart3, MessageSquare, Globe, ArrowRight, Play, Settings, Code2, Package, FileText, Radio, MonitorPlay, Activity } from "lucide-react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-hero-bg-bFr44AaNNWKkv4uMRbTXe8.webp";
const DEMO_VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus_ai_demo_v5_7a9fdeb3.mp4";

const DEMO_EVENTS = [
  { id: "q4-earnings-2026", title: "Q4 2025 Earnings Call", company: "Chorus Call Inc.", platform: "Zoom", status: "live", attendees: 1247, duration: "42:18" },
  { id: "investor-day-2026", title: "Annual Investor Day", company: "Chorus Call Inc.", platform: "Microsoft Teams", status: "upcoming", attendees: 3500, duration: "—" },
  { id: "board-briefing", title: "Board Strategy Briefing", company: "Chorus Call Inc.", platform: "Webex", status: "completed", attendees: 24, duration: "1:28:05" },
];

const FEATURES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text powered by OpenAI Whisper with <1s latency via Recall.ai." },
  { icon: BarChart3, label: "Sentiment Analysis", desc: "AI monitors tone and audience reaction in real-time throughout the event." },
  { icon: MessageSquare, label: "Smart Q&A", desc: "Attendees submit, upvote, and categorize questions — moderated by the operator." },
  { icon: Globe, label: "Auto-Translation", desc: "Participants choose their language; transcripts translate instantly into 8 languages." },
  { icon: Video, label: "Platform Neutral", desc: "Works with Zoom RTMS, Microsoft Teams Bot, Webex, RTMP, and PSTN dial-in." },
  { icon: Zap, label: "Real-Time Delivery", desc: "Sub-100ms message delivery via Chorus Call's proprietary edge network — zero polling." },
];

const PLATFORM_PAGES = [
  { icon: Radio, label: "Moderator Console", desc: "Approve/reject Q&A, push polls, monitor sentiment live", path: "/moderator/q4-earnings-2026", color: "text-amber-400" },
  { icon: MonitorPlay, label: "Presenter Teleprompter", desc: "Large-text live transcript + approved Q&A for speakers", path: "/presenter/q4-earnings-2026", color: "text-red-400" },
  { icon: Settings, label: "Operator Console", desc: "Host controls, RTMP key, dial-in numbers, stream setup", path: "/operator/q4-earnings-2026", color: "text-slate-400" },
  { icon: FileText, label: "Post-Event Report", desc: "AI summary, full transcript, replay, analytics", path: "/post-event/q4-earnings-2026", color: "text-emerald-400" },
  { icon: Code2, label: "Integration Hub", desc: "Recall.ai, Zoom RTMS, Teams Bot, RTMP, PSTN", path: "/integrations", color: "text-blue-400" },
  { icon: Package, label: "Partner API & Widget", desc: "Webhook events, REST API, embeddable widget", path: "/partner-api", color: "text-violet-400" },
  { icon: Activity, label: "Cross-Device Sync Test", desc: "Live real-time sync — open on two devices to verify instant cross-device delivery", path: "/sync-test", color: "text-cyan-400" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "live") return <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400"><span className="live-badge-dot inline-block w-2 h-2 rounded-full bg-red-400" />Live</span>;
  if (status === "upcoming") return <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Upcoming</span>;
  return <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</span>;
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "Zoom") return <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">Zoom</span>;
  if (platform === "Microsoft Teams") return <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">Teams</span>;
  return <span className="text-[10px] font-bold bg-slate-600 text-white px-1.5 py-0.5 rounded">{platform}</span>;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png" alt="Chorus Call" className="h-9 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#events" className="hover:text-foreground transition-colors">Events</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <button onClick={() => navigate("/integrations")} className="hover:text-foreground transition-colors">Integrations</button>
            <button onClick={() => navigate("/partner-api")} className="hover:text-foreground transition-colors">Partner API</button>
            <button onClick={() => navigate("/demo")} className="text-primary font-semibold hover:opacity-80 transition-opacity">Sales Demo</button>
            <button onClick={() => navigate("/test-guide")} className="hover:text-foreground transition-colors">Team Guide</button>
            <button onClick={() => navigate("/tech-handover")} className="hover:text-foreground transition-colors">Tech Handover</button>
          </nav>
          <button onClick={() => navigate("/event/q4-earnings-2026")} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Play className="w-3.5 h-3.5" /> Launch Demo
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Broadcast studio" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="live-badge-dot inline-block w-1.5 h-1.5 rounded-full bg-primary" /> Board Demo — Chorus Call Inc.
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
                The Intelligence Layer<br /><span className="text-primary">for Every Meeting</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
                Chorus.AI sits on top of Zoom, Microsoft Teams, Webex, and any RTMP source — delivering real-time transcription, sentiment analysis, smart Q&A, and AI summaries to every investor event, earnings call, and board briefing.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate("/event/q4-earnings-2026")} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Enter Live Event Room <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/demo")} className="flex items-center gap-2 border border-primary/40 text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                  <Play className="w-4 h-4" /> Watch Demo
                </button>
              </div>
            </div>
            {/* Demo Video */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10">
              <video
                src={DEMO_VIDEO_URL}
                controls
                playsInline
                className="w-full aspect-video object-cover bg-black"
                poster={HERO_IMAGE}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Chorus.AI Demo — 55s
              </div>
            </div>
            {/* Download button */}
            <div className="mt-3 flex justify-center">
              <a
                href={DEMO_VIDEO_URL}
                download="Chorus_AI_Demo.mp4"
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download MP4 (26.8 MB)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pages */}
      <section className="py-16 border-t border-border bg-card/20">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Platform Modules</h2>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Every role has a dedicated view. Click to explore each module.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_PAGES.map(({ icon: Icon, label, desc, path, color }) => (
              <button key={path} onClick={() => navigate(path)} className="group text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all">
                <Icon className={`w-5 h-5 ${color} mb-3`} />
                <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
              </button>
            ))}
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
              <div key={event.id} className="group bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:bg-card/80 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={event.status} />
                  <PlatformIcon platform={event.platform} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{event.company}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span>{event.attendees.toLocaleString()} attendees</span>
                  <span>{event.status === "live" ? <span className="text-primary font-medium">{event.duration}</span> : event.duration}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/event/${event.id}`)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <Play className="w-3 h-3" /> Event Room
                  </button>
                  <button onClick={() => navigate(`/moderator/${event.id}`)} title="Moderator" className="flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors">
                    <Radio className="w-3 h-3" />
                  </button>
                  <button onClick={() => navigate(`/presenter/${event.id}`)} title="Presenter" className="flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
                    <MonitorPlay className="w-3 h-3" />
                  </button>
                  {event.status === "completed" && (
                    <button onClick={() => navigate(`/post-event/${event.id}`)} title="Post-Event Report" className="flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <FileText className="w-3 h-3" />
                    </button>
                  )}
                  {event.status !== "completed" && (
                    <button onClick={() => navigate(`/register/${event.id}`)} title="Register" className="flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
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
      <section className="py-24 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Platform Neutral by Design</h2>
              <p className="text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                Chorus.AI doesn't compete with Zoom or Teams — it sits on top of them. We capture audio via native APIs and deliver intelligence to every participant, regardless of which platform they're on.
              </p>
              <div className="space-y-3">
                {[
                  { name: "Zoom RTMS", desc: "Real-Time Media Streams API — direct audio capture at 200ms", color: "bg-blue-600" },
                  { name: "Microsoft Teams Bot", desc: "Azure Bot Framework — joins as a trusted participant", color: "bg-purple-600" },
                  { name: "Recall.ai", desc: "Universal bot — works on any platform, no setup required", color: "bg-primary" },
                  { name: "RTMP Ingest", desc: "Professional studio encoders (OBS, vMix, Wirecast)", color: "bg-slate-600" },
                  { name: "PSTN Dial-In", desc: "Twilio Voice — essential for Africa & emerging markets", color: "bg-amber-600" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-3">
                    <span className={`text-[10px] font-bold text-white px-2 py-1 rounded ${item.color} shrink-0`}>{item.name}</span>
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{item.desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/integrations")} className="mt-6 flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80 transition-opacity">
                View Integration Hub <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-4">Platform Advantages</h3>
              <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                {[
                  "Platform-neutral — no vendor lock-in for your clients",
                  "Fully white-label — your brand, your domain",
                  "12 languages including Arabic RTL",
                  "JSE/IFRS compliance flagging built-in",
                  "18-country PSTN dial-in coverage",
                  "Partner API for IR portal integration",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-sm text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Powered by</div>
                <div className="text-lg font-bold text-primary">Chorus Call</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Performance */}
      <section className="py-24 border-t border-border bg-card/20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by Chorus Call</h2>
            <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Traditional HTTP polling generates 60,000 unnecessary database reads per hour for a 50-person event. Chorus.AI replaces this with proprietary WebSocket push — reducing DB reads to zero.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stat: "<100ms", label: "Message delivery latency", desc: "Chorus Call proprietary edge network" },
              { stat: "7", label: "Real-time channels", desc: "slides, qa, transcript, polls, voting, presence, chat" },
              { stat: "0", label: "Polling requests", desc: "Pure WebSocket push model" },
            ].map(({ stat, label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat}</div>
                <div className="font-semibold text-sm mb-1">{label}</div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png" alt="Chorus Call" className="h-6 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            <button onClick={() => navigate("/integrations")} className="hover:text-foreground transition-colors">Integration Hub</button>
            <button onClick={() => navigate("/partner-api")} className="hover:text-foreground transition-colors">Partner API</button>
            <button onClick={() => navigate("/embed/q4-earnings-2026")} className="hover:text-foreground transition-colors">Embed Widget</button>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Confidential — Chorus Call Board Presentation
          </p>
        </div>
      </footer>
    </div>
  );
}
