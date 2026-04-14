import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, MessageSquare, BookOpen, Award, Send, Zap,
  Phone, Mail, ExternalLink, CheckCircle2, ChevronRight
} from "lucide-react";

type PageType = "support" | "docs" | "certification" | "feedback" | "whats-new" | "my-dashboard";

const PAGE_CONTENT: Record<string, {
  title: string; subtitle: string; icon: React.ElementType; color: string;
}> = {
  support: { title: "Support & Escalation", subtitle: "Get help when you need it most", icon: Phone, color: "text-blue-400" },
  docs: { title: "Documentation", subtitle: "Complete platform documentation and guides", icon: BookOpen, color: "text-emerald-400" },
  certification: { title: "Operator Certification", subtitle: "Earn CuraLive certification by completing all training", icon: Award, color: "text-amber-400" },
  feedback: { title: "Feedback & Suggestions", subtitle: "Help us improve CuraLive for everyone", icon: Send, color: "text-pink-400" },
  "whats-new": { title: "What's New", subtitle: "Latest platform updates and feature releases", icon: Zap, color: "text-purple-400" },
  "my-dashboard": { title: "My Dashboard", subtitle: "Your personal performance and training overview", icon: CheckCircle2, color: "text-primary" },
};

const WHATS_NEW = [
  { version: "v2.1 — March 2026", badge: "NEW", items: ["Feature Interconnection Map — interactive SVG graph with clickable nodes", "Virtual Studio — bundle-customised broadcast environment with ESG flags", "Interconnection Analytics Dashboard — adoption, ROI & workflow metrics", "AI Shop 'See Connections' — connection badges on all app cards", "Recommended Workflows — pre-configured feature activation sequences"] },
  { version: "v2.0 — February 2026", badge: "PREV", items: ["Webcast Enhancement Suite — XR overlays, language dubbing, ad integration", "Intelligent Broadcaster Panel — unified AI alert feed", "Podcast Converter — automatic episode generation from webcasts", "ESG Sustainability Dashboard — carbon footprint tracking", "Social Media Amplification — Event Echo across 5 platforms"] },
  { version: "v1.9 — January 2026", badge: "PREV", items: ["Live Transcription in 12 languages", "Q&A Auto-Triage with toxicity filter", "Compliance Dashboard with FINRA/JSE/IFRS monitoring", "Training Mode Console — isolated sandbox", "OCC Training Guide — 4-phase interactive learning"] },
];

const DOCS_SECTIONS = [
  { title: "Getting Started", items: ["Platform overview", "Operator onboarding checklist", "OCC quick start", "First event setup guide"] },
  { title: "Live Events", items: ["Earnings call operations", "Webcast production guide", "Audio bridge management", "Q&A moderation workflow"] },
  { title: "AI Features", items: ["Live transcription setup", "Sentiment monitoring guide", "Compliance check configuration", "Intelligent Broadcaster usage"] },
  { title: "New Features", items: ["Virtual Studio configuration", "Feature Map navigation", "Interconnection Workflows", "AI Shop & bundles"] },
];

const CERTS = [
  { title: "CuraLive Core Operator", description: "Complete OCC Training Guide all 4 phases with 75%+ score", status: "In Progress", progress: 50, color: "text-blue-400" },
  { title: "AI Features Specialist", description: "Complete AI Features training and pass the assessment", status: "Not Started", progress: 0, color: "text-purple-400" },
  { title: "Virtual Studio Operator", description: "Complete Virtual Studio training module", status: "Not Started", progress: 0, color: "text-pink-400" },
  { title: "Compliance Monitor", description: "Complete compliance monitoring training and 10 live events", status: "Not Started", progress: 0, color: "text-red-400" },
];

const MY_STATS = [
  { label: "Training Completion", value: "50%", color: "text-primary" },
  { label: "Events Operated", value: "3", color: "text-emerald-400" },
  { label: "Certifications", value: "0 / 4", color: "text-amber-400" },
  { label: "Quality Score", value: "4.2 / 5", color: "text-blue-400" },
];

export default function OperatorQuickRef() {
  const [location, navigate] = useLocation();
  const params = useParams<{ page: string }>();
  const pathEnd = location.split("/").pop() || "";
  const page = (params.page || pathEnd || "support") as PageType;
  const info = PAGE_CONTENT[page] || PAGE_CONTENT.support;
  const Icon = info.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14 gap-3">
          <button onClick={() => navigate("/operator-links")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Operator Links</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">{info.title}</span>
        </div>
      </header>

      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
            <Icon className={`w-6 h-6 ${info.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{info.title}</h1>
            <p className="text-muted-foreground text-sm">{info.subtitle}</p>
          </div>
        </div>

        {page === "support" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Phone, label: "Call Support", desc: "+27 11 000 0000", action: "Call Now", color: "text-blue-400" },
                { icon: Mail, label: "Email Support", desc: "support@curalive.cc", action: "Send Email", color: "text-emerald-400" },
                { icon: MessageSquare, label: "Live Chat", desc: "Available 08:00–22:00 SAST", action: "Start Chat", color: "text-purple-400" },
              ].map(c => {
                const CIcon = c.icon;
                return (
                  <div key={c.label} className="bg-card border border-border rounded-xl p-5 text-center">
                    <CIcon className={`w-8 h-8 mx-auto mb-3 ${c.color}`} />
                    <h3 className="font-semibold text-sm mb-1">{c.label}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
                    <button className="text-xs text-primary font-semibold hover:underline">{c.action} →</button>
                  </div>
                );
              })}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3">Escalation Path</h3>
              <div className="space-y-2">
                {["Technical issue during live event → Call +27 11 000 0000 immediately", "Platform access issue → Email support@curalive.cc with subject 'URGENT'", "Compliance concern → Contact your compliance supervisor directly", "Audio/video failure → Switch to backup PSTN bridge, then contact support"].map(e => (
                  <div key={e} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === "docs" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {DOCS_SECTIONS.map(section => (
              <div key={section.title} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3 text-primary">{section.title}</h3>
                <div className="space-y-1.5">
                  {section.items.map(item => (
                    <button key={item} className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-1 rounded text-left">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "certification" && (
          <div className="space-y-4">
            {CERTS.map(cert => (
              <div key={cert.title} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{cert.description}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    cert.status === "In Progress" ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-muted-foreground"
                  }`}>{cert.status}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all bg-primary`} style={{ width: `${cert.progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{cert.progress}% complete</span>
                  {cert.progress === 0 && <button onClick={() => navigate("/training")} className="text-primary hover:underline">Start Training →</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "feedback" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Share Your Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Category</label>
                <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
                  <option>Feature Request</option>
                  <option>Bug Report</option>
                  <option>Training Feedback</option>
                  <option>General Suggestion</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Your Feedback</label>
                <textarea rows={5} placeholder="Describe your feedback, suggestion, or issue…" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50" />
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Feedback
              </button>
            </div>
          </div>
        )}

        {page === "whats-new" && (
          <div className="space-y-6">
            {WHATS_NEW.map(release => (
              <div key={release.version} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <h3 className="font-bold">{release.version}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    release.badge === "NEW" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-muted-foreground"
                  }`}>{release.badge}</span>
                </div>
                <div className="p-5 space-y-2">
                  {release.items.map(item => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "my-dashboard" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MY_STATS.map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Continue Training", path: "/training" },
                    { label: "View Certifications", path: "/certification" },
                    { label: "Operator Analytics", path: "/operator/analytics" },
                    { label: "Training Mode", path: "/training-mode" },
                  ].map(a => (
                    <button key={a.label} onClick={() => navigate(a.path)} className="w-full flex items-center justify-between text-sm p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      {a.label}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {["Completed: Training Phase 1 (100%)", "Completed: Training Phase 2 (100%)", "Operated: Q4 Earnings Call demo", "Started: AI Features Training (30%)"].map(a => (
                    <div key={a} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
