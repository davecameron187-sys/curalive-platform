import { useLocation } from "wouter";
import { Zap, Video, Mic, BarChart3, MessageSquare, Globe, ArrowRight, Play, Settings, Code2, Package, FileText, Radio, MonitorPlay, Activity, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { FeedbackForm } from "@/components/FeedbackForm";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-hero-bg-bFr44AaNNWKkv4uMRbTXe8.webp";
const DEMO_VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/demo_curalive_0cb4c723.mp4";

const DEMO_EVENTS = [
  { id: "q4-earnings-2026", title: "Q4 2025 Earnings Call", company: "CuraLive Inc.", platform: "Zoom", status: "live", attendees: 1247, duration: "42:18" },
  { id: "investor-day-2026", title: "Annual Investor Day", company: "CuraLive Inc.", platform: "Microsoft Teams", status: "upcoming", attendees: 3500, duration: "—" },
  { id: "board-briefing", title: "Board Strategy Briefing", company: "CuraLive Inc.", platform: "Webex", status: "completed", attendees: 24, duration: "1:28:05" },
];

const FEATURES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text powered by OpenAI Whisper with <1s latency via Recall.ai." },
  { icon: BarChart3, label: "Sentiment Analysis", desc: "AI monitors tone and audience reaction in real-time throughout the event." },
  { icon: MessageSquare, label: "Smart Q&A", desc: "Attendees submit, upvote, and categorize questions — moderated by the operator." },
  { icon: Globe, label: "Auto-Translation", desc: "Participants choose their language; transcripts translate instantly into 8 languages." },
  { icon: Video, label: "Platform Neutral", desc: "Works with Zoom RTMS, Microsoft Teams Bot, Webex, RTMP, and PSTN dial-in." },
  { icon: Zap, label: "Real-Time Delivery", desc: "Sub-100ms message delivery via CuraLive's proprietary edge network — zero polling." },
];

const PLATFORM_PAGES = [
  { icon: Radio, label: "Moderator Console", desc: "Approve/reject Q&A, push polls, monitor sentiment live", path: "/moderator/q4-earnings-2026", color: "text-amber-400" },
  { icon: MonitorPlay, label: "Presenter Teleprompter", desc: "Large-text live transcript + approved Q&A for speakers", path: "/presenter/q4-earnings-2026", color: "text-red-400" },
  { icon: Settings, label: "Operator Console", desc: "Host controls, RTMP key, dial-in numbers, stream setup", path: "/operator/q4-earnings-2026", color: "text-slate-400" },
  { icon: FileText, label: "Post-Event Report", desc: "AI summary, full transcript, replay, analytics", path: "/post-event/q4-earnings-2026", color: "text-emerald-400" },
  { icon: Code2, label: "Integration Hub", desc: "Recall.ai, Zoom RTMS, Teams Bot, RTMP, PSTN", path: "/integrations", color: "text-blue-400" },
  { icon: Package, label: "Partner API & Widget", desc: "Webhook events, REST API, embeddable widget", path: "/partner-api", color: "text-violet-400" },
  { icon: Activity, label: "Cross-Device Sync Test", desc: "Live real-time sync — open on two devices to verify instant cross-device delivery", path: "/sync-test", color: "text-cyan-400" },
  { icon: Video, label: "Live Video Meetings", desc: "Capital raising 1:1 roadshows, research presentations, earnings calls & hybrid conferences", path: "/live-video", color: "text-blue-400" },
  { icon: Radio, label: "Webcasting Platform", desc: "Webinars, webcasts, virtual events, hybrid events, on-demand — across 8 industry verticals", path: "/live-video/webcasting", color: "text-amber-400" },
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
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">Cura<span className="text-primary">Live</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#events" className="hover:text-foreground transition-colors">Events</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <button onClick={() => navigate("/live-video")} className="hover:text-foreground transition-colors">Live Video</button>
            <button onClick={() => navigate("/live-video/webcasting")} className="hover:text-foreground transition-colors">Webcasting</button>
            <button onClick={() => navigate("/integrations")} className="hover:text-foreground transition-colors">Integrations</button>
            <button onClick={() => navigate("/partner-api")} className="hover:text-foreground transition-colors">Partner API</button>
            <button onClick={() => navigate("/book-demo")} className="text-emerald-400 font-semibold hover:opacity-80 transition-opacity">Book Demo</button>
            <button onClick={() => navigate("/demo")} className="text-primary font-semibold hover:opacity-80 transition-opacity">Sales Demo</button>
            <button onClick={() => navigate("/test-guide")} className="hover:text-foreground transition-colors">Team Guide</button>
            <button onClick={() => navigate("/tech-handover")} className="hover:text-foreground transition-colors">Tech Handover</button>
            <button onClick={() => navigate("/occ")} className="flex items-center gap-1.5 hover:text-foreground transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>OCC</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/event/q4-earnings-2026")} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Play className="w-3.5 h-3.5" /> Launch Demo
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/profile")} className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <User className="w-3 h-3" />{user?.name?.split(' ')[0]}
                </button>
                <button onClick={() => navigate("/profile")} className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary transition-colors">
                  <User className="w-3 h-3" /> Profile
                </button>
                <button onClick={() => navigate("/billing")} className="hidden md:flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary transition-colors">
                  <Zap className="w-3 h-3" /> Billing
                </button>
                <button onClick={() => logout()} className="flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary transition-colors">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            ) : (
              <a href={getLoginUrl()} className="flex items-center gap-1.5 border border-primary/40 text-primary px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-colors">
                <LogIn className="w-3 h-3" /> Login
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Broadcast studio" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Left: headline + CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="live-badge-dot inline-block w-1.5 h-1.5 rounded-full bg-primary" /> Live Platform — CuraLive Inc.
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
                The Intelligence Layer<br /><span className="text-primary">for Every Meeting</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
                CuraLive sits on top of Zoom, Microsoft Teams, Webex, and any RTMP source — delivering real-time transcription, sentiment analysis, smart Q&A, and AI summaries to every investor event, earnings call, and board briefing.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate("/event/q4-earnings-2026")} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Enter Live Event Room <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/demo")} className="flex items-center gap-2 border border-primary/40 text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                  <Play className="w-4 h-4" /> Sales Demo
                </button>
              </div>
            </div>
            {/* Right: feature highlight grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mic, label: "Live Transcription", stat: "<1s latency", color: "text-primary", bg: "bg-primary/10 border-primary/20", path: "/event/q4-earnings-2026" },
                { icon: Globe, label: "12 Languages", stat: "incl. Arabic RTL", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", path: "/event/q4-earnings-2026" },
                { icon: BarChart3, label: "Sentiment Analysis", stat: "Real-time AI", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", path: "/moderator/q4-earnings-2026" },
                { icon: MessageSquare, label: "Smart Q&A", stat: "AI-moderated", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", path: "/moderator/q4-earnings-2026" },
                { icon: Video, label: "Platform Neutral", stat: "Zoom · Teams · Webex", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", path: "/integrations" },
                { icon: Zap, label: "Real-Time Delivery", stat: "<100ms edge", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", path: "/event/q4-earnings-2026" },
                { icon: Settings, label: "White-Label Ready", stat: "Your brand & domain", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", path: "/operator/q4-earnings-2026" },
                { icon: FileText, label: "JSE/IFRS Compliant", stat: "AI post-event report", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", path: "/post-event/q4-earnings-2026" },
              ].map(({ icon: Icon, label, stat, color, bg, path }) => (
                <button key={label} onClick={() => navigate(path)} className={`group flex items-start gap-3 border rounded-xl p-4 bg-card/60 backdrop-blur-sm text-left hover:scale-[1.02] transition-transform cursor-pointer ${bg}`}>
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground leading-tight group-hover:text-white transition-colors">{label}</div>
                    <div className={`text-xs mt-0.5 font-medium ${color}`} style={{ fontFamily: "'Inter', sans-serif" }}>{stat}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 border-t border-border bg-card/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "12", label: "Languages Supported", color: "text-emerald-400" },
              { value: "18", label: "Dial-In Countries", color: "text-blue-400" },
              { value: "<1s", label: "Transcription Latency", color: "text-primary" },
              { value: "<100ms", label: "Real-Time Delivery", color: "text-cyan-400" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`text-4xl font-bold mb-1 ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 border-t border-border">
        <div className="container">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>Trusted by leading financial institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {[
              { name: "Investec", abbr: "INVESTEC", color: "#0057A8" },
              { name: "JSE", abbr: "JSE", color: "#00843D" },
              { name: "Standard Bank", abbr: "STANDARD BANK", color: "#0033A0" },
              { name: "Nedbank", abbr: "NEDBANK", color: "#007A4D" },
              { name: "FirstRand", abbr: "FIRSTRAND", color: "#C8102E" },
            ].map(({ name, abbr, color }) => (
              <div key={name} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold tracking-widest text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.12em" }}>{abbr}</span>
              </div>
            ))}
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
                CuraLive doesn't compete with Zoom or Teams — it sits on top of them. We capture audio via native APIs and deliver intelligence to every participant, regardless of which platform they're on.
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
                <div className="text-lg font-bold text-primary">CuraLive</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Performance */}
      <section className="py-24 border-t border-border bg-card/20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by CuraLive</h2>
            <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Traditional HTTP polling generates 60,000 unnecessary database reads per hour for a 50-person event. CuraLive replaces this with proprietary WebSocket push — reducing DB reads to zero.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stat: "<100ms", label: "Message delivery latency", desc: "CuraLive proprietary edge network" },
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

      {/* User Feedback Section */}
      <section className="py-24 border-t border-border bg-card/30">
        <div className="container">
          <FeedbackForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-foreground">Cura<span className="text-primary">Live</span></span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            <button onClick={() => navigate("/integrations")} className="hover:text-foreground transition-colors">Integration Hub</button>
            <button onClick={() => navigate("/partner-api")} className="hover:text-foreground transition-colors">Partner API</button>
            <button onClick={() => navigate("/embed/q4-earnings-2026")} className="hover:text-foreground transition-colors">Embed Widget</button>
            <button onClick={() => navigate("/legal/terms")} className="hover:text-foreground transition-colors">Terms of Service</button>
            <button onClick={() => navigate("/legal/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            Confidential — CuraLive Board Presentation
          </p>
        </div>
      </footer>
    </div>
  );
}
