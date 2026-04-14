import { ExternalLink, ArrowRight, CheckCircle2, Terminal, Globe, CreditCard, Mic, Shield, Smartphone, Github, Copy, Check } from "lucide-react";
import { useState } from "react";

const LIVE_URL = "https://curalive-platform.replit.app";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 ml-2 text-slate-500 hover:text-slate-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SectionLabel({ children, color = "text-slate-400" }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${color}`}>{children}</div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${color}`}>
      {children}
    </span>
  );
}

const STACK_ROWS = [
  { layer: "Front-end", tech: "React 19 + TypeScript + Tailwind CSS 4", note: "All UI — reusable across web & mobile" },
  { layer: "Back-end", tech: "Express 4 + tRPC 11", note: "Type-safe API, no REST boilerplate" },
  { layer: "Database", tech: "PostgreSQL (Replit managed)", note: "Attendee data, Q&A, event records" },
  { layer: "Real-time", tech: "Ably pub/sub", note: "Live presence, chat, session sync" },
  { layer: "Auth", tech: "JWT cookie sessions", note: "Role-based (viewer, operator, admin)" },
  { layer: "Hosting", tech: "Replit Deployments", note: "Auto-scaling, TLS, health checks" },
  { layer: "AI / LLM", tech: "GPT-4o via OpenAI API", note: "Summaries, Q&A triage, press release" },
  { layer: "Transcription", tech: "Recall.ai + Deepgram", note: "Live meeting bots, speech-to-text" },
  { layer: "Video", tech: "Mux RTMP/HLS", note: "Live webcasting and recording" },
];

const REAL_ITEMS = [
  "All 8 role-based interfaces (Attendee, Moderator, Presenter, Operator, Post-Event, Integration Hub, Partner API, White-Label)",
  "Real-time Q&A submission, approval, and sync between consoles",
  "Live polls with animated Chart.js results",
  "AI-generated event summaries via real LLM calls",
  "Attendee registration persisted to the PostgreSQL database",
  "12-language support including Arabic RTL layout",
  "18-country dial-in number display across 7 regions",
  "Operator Dashboard with 5 panels (Command, Sessions, Customers, Reports, Billing)",
];

const SIMULATED_ITEMS = [
  "Live transcription — looping script in demo; Recall.ai + Deepgram ready for production",
  "Real-time sentiment analysis — needs a sentiment model wired to the transcript feed",
  "Actual Zoom / Teams / Webex audio capture — Recall.ai integration partially wired",
  "Billing and subscription management — operator dashboard billing panel built, Stripe integration pending",
];

const PHASES = [
  {
    number: "01",
    title: "Infrastructure",
    timeline: "Weeks 1–4",
    cost: "Included in Replit plan",
    icon: Terminal,
    color: "text-sky-400",
    dotColor: "bg-sky-400",
    borderColor: "border-sky-400/20",
    bgColor: "bg-sky-400/5",
    description: "Platform is already deployed on Replit. Configure custom domain (curalive.cc), set up production environment variables, and verify all services are running. Authentication uses JWT cookie sessions with role-based access control.",
    action: "Configure the custom domain in Replit deployment settings. Verify all environment secrets are set in the Replit Secrets panel.",
    links: [{ label: "replit.com", url: "https://replit.com" }],
  },
  {
    number: "02",
    title: "Real Transcription",
    timeline: "Weeks 5–8",
    cost: "~R0.39/event",
    icon: Mic,
    color: "text-amber-400",
    dotColor: "bg-amber-400",
    borderColor: "border-amber-400/20",
    bgColor: "bg-amber-400/5",
    description: "Integrate Deepgram for speech-to-text and Recall.ai for meeting bots (joins Zoom/Teams calls as a participant and streams audio). Replace the simulated transcript loop with a WebSocket feed from Recall.ai's transcript webhook.",
    action: "Recall.ai webhook is already registered at POST /api/recall/webhook. Configure RECALL_AI_API_KEY and RECALL_AI_WEBHOOK_SECRET.",
    links: [{ label: "recall.ai", url: "https://recall.ai" }, { label: "deepgram.com", url: "https://deepgram.com" }],
  },
  {
    number: "03",
    title: "Billing",
    timeline: "Weeks 9–12",
    cost: "3.1–4.0% per transaction",
    icon: CreditCard,
    color: "text-emerald-400",
    dotColor: "bg-emerald-400",
    borderColor: "border-emerald-400/20",
    bgColor: "bg-emerald-400/5",
    description: "Integrate Stripe for subscription billing. The Operator Dashboard billing panel is already built with subscription and ad-hoc invoice tracking. Wire Stripe's checkout and invoice API to the existing billing service.",
    action: "Set STRIPE_SECRET_KEY in Replit Secrets. Create Products and Prices in the Stripe dashboard and wire the checkout flow.",
    links: [{ label: "stripe.com", url: "https://stripe.com" }],
  },
  {
    number: "04",
    title: "Compliance & Security",
    timeline: "Months 4–6",
    cost: "Engineering time",
    icon: Shield,
    color: "text-red-400",
    dotColor: "bg-red-400",
    borderColor: "border-red-400/20",
    bgColor: "bg-red-400/5",
    description: "Add JSE/IFRS forward-looking statement disclaimers to all AI-generated content, implement data residency controls (South Africa), add POPIA consent flows to the registration page, and conduct a penetration test before going live with JSE-listed clients.",
    action: "Engage a South African cybersecurity firm for pen testing. Add disclaimer banners to PostEvent.tsx and the AI summary output.",
    links: [],
  },
  {
    number: "05",
    title: "Mobile & Scale",
    timeline: "Months 7–12",
    cost: "Engineering time",
    icon: Smartphone,
    color: "text-violet-400",
    dotColor: "bg-violet-400",
    borderColor: "border-violet-400/20",
    bgColor: "bg-violet-400/5",
    description: "Build the React Native mobile app using Expo — it reuses all existing React components and TypeScript types. Add push notifications for Q&A approvals and operator alerts. Scale using Replit's autoscaling deployment.",
    action: "Run `npx create-expo-app curalive-mobile` and import shared components from the existing codebase. Use the same tRPC API — no back-end changes needed.",
    links: [{ label: "expo.dev", url: "https://expo.dev" }],
  },
];

const SERVICES = [
  { name: "Replit (hosting & deployment)", where: "replit.com", cost: "Included in plan" },
  { name: "Recall.ai (meeting bots)", where: "recall.ai", cost: "~R1.49/event" },
  { name: "Deepgram (transcription)", where: "deepgram.com", cost: "~R0.39/event" },
  { name: "Stripe (billing)", where: "stripe.com", cost: "3.1–4.0% per transaction" },
  { name: "Ably (real-time messaging)", where: "ably.com", cost: "Free → $29/month" },
  { name: "OpenAI (AI intelligence)", where: "openai.com", cost: "Per-token pricing" },
  { name: "Twilio (telephony)", where: "twilio.com", cost: "Per-minute pricing" },
  { name: "Domain: curalive.cc", where: "domains.co.za or Cloudflare", cost: "~R200/year" },
];

const COST_SCENARIOS = [
  { scenario: "5 events/month · 500 attendees each", cost: "~R1,200/month" },
  { scenario: "20 events/month · 1,000 attendees each", cost: "~R3,800/month" },
  { scenario: "50 events/month · 2,000 attendees each", cost: "~R8,500/month" },
];

const RESOURCES = [
  { label: "Live Platform", url: `${LIVE_URL}` },
  { label: "Team Testing Guide", url: `${LIVE_URL}/test-guide` },
  { label: "Sales Demo Page", url: `${LIVE_URL}/demo` },
  { label: "Integration Hub", url: `${LIVE_URL}/integrations` },
  { label: "Partner API Docs", url: `${LIVE_URL}/partner-api` },
];

export default function TechHandover() {
  return (
    <div className="min-h-screen bg-[#080c18] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      <header className="border-b border-white/8 bg-[#080c18]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">← CuraLive</a>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-semibold text-white">Technical Manager Handover</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="bg-sky-400/15 text-sky-400">Technical Brief</Tag>
            <span className="text-[10px] text-slate-600 font-mono">April 2026</span>
          </div>
        </div>
      </header>

      <div className="container py-10 max-w-5xl">

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            CuraLive Inc. · Confidential · For Technical Manager
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            CuraLive Platform<br />
            <span className="text-primary">Technical Handover Brief</span>
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            This document explains how the CuraLive platform is built, what is real versus simulated in the current demo, and the step-by-step roadmap for taking the platform to full production.
          </p>
        </div>

        <section className="mb-12">
          <SectionLabel color="text-primary">01 · Platform Overview</SectionLabel>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6">
            <p className="text-slate-300 leading-relaxed mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              The CuraLive platform is a full-stack real-time investor events intelligence system. It provides live webcasting, telephony bridge conferencing, AI-powered transcription, real-time sentiment analysis, regulatory compliance monitoring, and autonomous AI intelligence services. The platform is currently live at:
            </p>
            <div className="flex items-center gap-2 bg-[#0f1629] border border-[#1e3a5f] border-l-4 border-l-primary rounded-lg px-4 py-3 mb-4">
              <a href={LIVE_URL} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-sky-400 hover:underline font-bold flex-1">
                {LIVE_URL}
              </a>
              <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
              <CopyBtn text={LIVE_URL} />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              The web application uses <strong className="text-slate-300">React 19 + TypeScript</strong> on the front-end, <strong className="text-slate-300">Express 4 + tRPC 11</strong> on the back-end, and a <strong className="text-slate-300">PostgreSQL</strong> database. It is hosted and deployed on <strong className="text-slate-300">Replit</strong> with automated build and deployment pipelines.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-slate-400">02 · Technology Stack</SectionLabel>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/8">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Layer</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Technology</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {STACK_ROWS.map((row) => (
                  <tr key={row.layer} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-300 whitespace-nowrap">{row.layer}</td>
                    <td className="px-5 py-3 font-mono text-xs text-sky-400">{row.tech}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-slate-400">03 · What Is Real vs. Simulated</SectionLabel>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">Live & Working Now</span>
              </div>
              <ul className="space-y-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                {REAL_ITEMS.map((item) => (
                  <li key={item} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <span className="text-sm font-bold text-amber-400">Simulated — Needs Real Integration</span>
              </div>
              <ul className="space-y-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                {SIMULATED_ITEMS.map((item) => (
                  <li key={item} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-primary">04 · Your Production Roadmap</SectionLabel>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Five phases to take this from a board-ready demo to a fully operational, revenue-generating platform. You lead all of this.
          </p>
          <div className="space-y-4">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              return (
                <div key={phase.number} className={`rounded-xl border ${phase.borderColor} ${phase.bgColor} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${phase.color}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`font-mono text-xs font-bold ${phase.color}`}>{phase.number}</span>
                        <span className="font-bold text-white text-base">{phase.title}</span>
                        <Tag color="bg-white/5 text-slate-400">{phase.timeline}</Tag>
                        <Tag color="bg-white/5 text-slate-400">{phase.cost}</Tag>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {phase.description}
                      </p>
                      <div className="bg-black/20 rounded-lg px-4 py-2.5 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1">Your Action</span>
                        <p className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{phase.action}</p>
                      </div>
                      {phase.links.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {phase.links.map((link) => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-1 text-xs font-semibold ${phase.color} hover:opacity-80 transition-opacity`}>
                              <Globe className="w-3 h-3" /> {link.label} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-slate-400">05 · Services & Accounts You Need</SectionLabel>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/8">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Service</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Where to Sign Up</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SERVICES.map((s) => (
                  <tr key={s.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-300 font-medium text-xs">{s.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-sky-400">{s.where}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{s.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-slate-400">06 · Estimated Monthly Running Cost in Production</SectionLabel>
          <div className="grid md:grid-cols-3 gap-4">
            {COST_SCENARIOS.map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-xl p-5 text-center">
                <div className="text-2xl font-bold text-white mb-2">{s.cost}</div>
                <div className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{s.scenario}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            Costs exclude developer salaries and are estimated in ZAR at current exchange rates. Actual costs vary with usage.
          </p>
        </section>

        <section className="mb-12">
          <SectionLabel color="text-primary">07 · Quick Reference Links</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {RESOURCES.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors group">
                <Globe className="w-4 h-4 text-sky-400 group-hover:text-sky-300" />
                {r.label}
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/8 pt-8 pb-16 text-center">
          <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
            CuraLive Inc. · Technical Handover Brief · April 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
