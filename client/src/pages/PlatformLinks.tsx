/**
 * PlatformLinks.tsx — Chorus.AI Platform Links Reference
 * Version 3 · All 35 live URLs organized by section with search, copy, and new-tab links.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Copy, Check, ExternalLink, ChevronDown, ChevronRight,
  Home, Radio, Users, Monitor, Settings, FileText, Globe,
  Video, BarChart3, Code2, Package, Zap, Shield, BookOpen,
  Star, Lock
} from "lucide-react";
import { toast } from "sonner";

const BASE = "https://chorusai-mdu4k2ib.manus.space";

type LinkEntry = {
  label: string;
  url: string;
  description: string;
  isNew?: boolean;
  isTokenBased?: boolean;
  isInternal?: boolean;
};

type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  links: LinkEntry[];
};

const SECTIONS: Section[] = [
  {
    id: "entry",
    title: "Main Entry Points",
    icon: Home,
    color: "text-blue-400",
    links: [
      { label: "Homepage", url: `${BASE}/`, description: "Main platform portal with all module entry points" },
      { label: "Sales Demo", url: `${BASE}/demo`, description: "Investor-facing demo page with video, modules & direct links" },
      { label: "Book a Demo", url: `${BASE}/book-demo`, description: "Lead capture & demo scheduling form" },
    ],
  },
  {
    id: "capital-markets",
    title: "Live Event Suite — Capital Markets",
    icon: Radio,
    color: "text-red-400",
    links: [
      { label: "Attendee Event Room", url: `${BASE}/event/q4-earnings-2026`, description: "Live transcript, sentiment, Q&A, 12 languages (demo: q4-earnings-2026)" },
      { label: "Moderator Console", url: `${BASE}/moderator/q4-earnings-2026`, description: "Q&A triage, polls, sentiment dashboard" },
      { label: "Presenter Teleprompter", url: `${BASE}/presenter/q4-earnings-2026`, description: "Large-text transcript, approved Q&A feed, pace coach" },
      { label: "Operator Console", url: `${BASE}/operator/q4-earnings-2026`, description: "Platform connect, dial-in, stream controls" },
      { label: "Event Registration", url: `${BASE}/register/q4-earnings-2026`, description: "Attendee registration page" },
      { label: "Event Pass", url: `${BASE}/event-pass/q4-earnings-2026`, description: "Attendee event pass / confirmation" },
      { label: "Post-Event Report", url: `${BASE}/post-event/q4-earnings-2026`, description: "AI summary, transcript, replay, analytics" },
      { label: "Embed Widget", url: `${BASE}/embed/q4-earnings-2026`, description: "Embeddable attendee widget for external sites" },
    ],
  },
  {
    id: "occ",
    title: "Operator Conference Console (OCC)",
    icon: Settings,
    color: "text-amber-400",
    links: [
      { label: "OCC Dashboard", url: `${BASE}/occ`, description: "Full operator control centre — all active conferences, dial-in management, Q&A queue, sentiment monitoring", isInternal: true },
    ],
  },
  {
    id: "live-video",
    title: "Live Video Meetings — Capital Markets Suite",
    icon: Video,
    color: "text-violet-400",
    links: [
      { label: "Live Video Hub", url: `${BASE}/live-video`, description: "Capital markets hub — roadshows, earnings calls, hybrid conferences" },
      { label: "Aggreko Roadshow", url: `${BASE}/live-video/roadshow/aggreko-series-b-2026`, description: "Demo roadshow (publicly accessible, no login required)" },
      { label: "Roadshow Order Book", url: `${BASE}/live-video/roadshow/aggreko-series-b-2026/order-book`, description: "Live order book for the Aggreko Series B roadshow" },
      { label: "Hybrid Conference", url: `${BASE}/live-video/conference`, description: "Hybrid conference management console" },
      { label: "Investor Waiting Room", url: `${BASE}/live-video/join/:token`, description: "Pre-meeting waiting room (accessed via join token link)", isTokenBased: true },
    ],
  },
  {
    id: "webcasting-hub",
    title: "Webcasting Platform — Hub & Management",
    icon: Globe,
    color: "text-emerald-400",
    links: [
      { label: "Webcasting Hub", url: `${BASE}/live-video/webcasting`, description: "Central hub — all event types, 8 industry verticals, live/scheduled/on-demand events" },
      { label: "Create Event Wizard", url: `${BASE}/live-video/webcast/create`, description: "6-step guided wizard: type → branding → agenda → speakers → registration → publish" },
      { label: "On-Demand Library", url: `${BASE}/live-video/on-demand`, description: "Searchable recording library with CPD/CME certification support" },
      { label: "Analytics Dashboard", url: `${BASE}/live-video/analytics`, description: "Cross-event analytics — attendance trends, lead scoring, engagement" },
    ],
  },
  {
    id: "webcast-event",
    title: "Webcasting Platform — Per-Event Pages",
    icon: Monitor,
    color: "text-cyan-400",
    links: [
      { label: "Webcast Studio (CEO Town Hall)", url: `${BASE}/live-video/webcast/ceo-town-hall-q1-2026`, description: "Live production console — Q&A moderation, polls, Ably real-time chat, captions, recording publish" },
      { label: "Registration Landing Page", url: `${BASE}/live-video/webcast/ceo-town-hall-q1-2026/register`, description: "Public registration page — vertical-specific templates (Healthcare CME, Financial Services, Government)" },
      { label: "Attendee Webcast Room", url: `${BASE}/live-video/webcast/ceo-town-hall-q1-2026/attend?token={attendeeToken}`, description: "Token-gated live attendee view — stream, transcript, Q&A, polls, 12-language selector", isNew: true, isTokenBased: true },
      { label: "On-Demand Watch", url: `${BASE}/live-video/webcast/ceo-town-hall-q1-2026/watch?token={attendeeToken}`, description: "Token-gated recording replay page — accessible after event ends", isNew: true, isTokenBased: true },
      { label: "Webcast Post-Event Report", url: `${BASE}/live-video/webcast/ceo-town-hall-q1-2026/report`, description: "Post-event report — attendance stats, poll results, Q&A log, AI summary, recording link", isNew: true },
    ],
  },
  {
    id: "integrations",
    title: "Integrations & Developer Tools",
    icon: Code2,
    color: "text-orange-400",
    links: [
      { label: "Integration Hub", url: `${BASE}/integrations`, description: "Recall.ai, Zoom RTMS, Microsoft Teams Bot, RTMP, PSTN setup guides" },
      { label: "Partner API & Widget", url: `${BASE}/partner-api`, description: "Webhook events, REST API docs, embeddable attendee widget" },
      { label: "Cross-Device Sync Test", url: `${BASE}/sync-test`, description: "Real-time sync verification — open on two devices to test Ably delivery" },
    ],
  },
  {
    id: "legal",
    title: "Legal Pages",
    icon: Shield,
    color: "text-slate-400",
    links: [
      { label: "Terms of Service", url: `${BASE}/legal/terms`, description: "Full platform terms of service", isNew: true },
      { label: "Privacy Policy", url: `${BASE}/legal/privacy`, description: "Full privacy policy (GDPR, POPIA, HIPAA-aligned)", isNew: true },
    ],
  },
  {
    id: "internal",
    title: "Internal & Admin Pages",
    icon: Lock,
    color: "text-slate-500",
    links: [
      { label: "Team Guide", url: `${BASE}/test-guide`, description: "Internal testing guide and QA checklist for the Chorus.AI team", isInternal: true },
      { label: "Tech Handover", url: `${BASE}/tech-handover`, description: "Technical architecture, integration specs, and handover documentation", isInternal: true },
      { label: "Summit Console", url: `${BASE}/summit-console`, description: "Summit & large-scale event management console", isInternal: true },
      { label: "Admin — Users", url: `${BASE}/admin/users`, description: "User management and role administration", isInternal: true },
    ],
  },
];

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title="Copy URL"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/** Highlight matching text segments within a string */
function Highlight({ text, query, className = "" }: { text: string; query: string; className?: string }) {
  if (!query.trim()) return <span className={className}>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/25 text-primary rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function LinkRow({ link, query = "" }: { link: LinkEntry; query?: string }) {
  const isTemplate = link.url.includes("{");
  // Determine which fields matched so we can show a match indicator
  const q = query.trim().toLowerCase();
  const urlMatched = q && link.url.toLowerCase().includes(q);
  const descMatched = q && link.description.toLowerCase().includes(q);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Highlight text={link.label} query={query} className="text-sm font-medium text-foreground" />
          {link.isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">New</span>
          )}
          {link.isTokenBased && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Token</span>
          )}
          {link.isInternal && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-400/10 border border-slate-400/20 px-1.5 py-0.5 rounded">Internal</span>
          )}
          {urlMatched && !descMatched && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">URL match</span>
          )}
        </div>
        <Highlight text={link.description} query={descMatched ? query : ""} className="text-xs text-muted-foreground mb-1.5 block" />
        <code className="text-[11px] font-mono break-all block">
          <Highlight text={link.url} query={query} className="text-primary/80" />
        </code>
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        <CopyButton url={link.url} />
        {!isTemplate && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section, defaultOpen = true, query = "" }: { section: Section; defaultOpen?: boolean; query?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${section.color}`} />
          <span className="font-semibold text-sm">{section.title}</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{section.links.length}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-2">
          {section.links.map(link => (
            <LinkRow key={link.url} link={link} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlatformLinks() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  const allLinks = SECTIONS.flatMap(s => s.links);
  const totalCount = allLinks.length;

  const filteredSections = search.trim()
    ? SECTIONS.map(s => ({
        ...s,
        links: s.links.filter(l =>
          l.label.toLowerCase().includes(search.toLowerCase()) ||
          l.url.toLowerCase().includes(search.toLowerCase()) ||
          l.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.links.length > 0)
    : SECTIONS;

  const filteredCount = filteredSections.reduce((acc, s) => acc + s.links.length, 0);

  const handleCopyAll = () => {
    const text = allLinks.map(l => `${l.label}\n${l.url}`).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      toast.success(`${totalCount} URLs copied to clipboard`);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  const newCount = allLinks.filter(l => l.isNew).length;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Chorus.AI</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium">Platform Links</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">Version 3 · March 3, 2026</span>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy All
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Platform Links Reference</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
            All {totalCount} live URLs for the Chorus.AI platform, organized by module. 
            {newCount > 0 && <> <span className="text-emerald-400 font-medium">{newCount} new pages</span> added in v3.</>}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total URLs", value: totalCount, color: "text-primary" },
              { label: "New in v3", value: newCount, color: "text-emerald-400" },
              { label: "Sections", value: SECTIONS.length, color: "text-violet-400" },
              { label: "Token-based", value: allLinks.filter(l => l.isTokenBased).length, color: "text-amber-400" },
              { label: "Internal", value: allLinks.filter(l => l.isInternal).length, color: "text-slate-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-lg px-3 py-2.5 text-center">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by page name, URL, or description…"
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            {search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {filteredCount} result{filteredCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">New</span>
            Added in v3
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Token</span>
            Requires attendee token in URL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-400/10 border border-slate-400/20 px-1.5 py-0.5 rounded">Internal</span>
            Requires login / operator role
          </div>
        </div>

        {/* Sections */}
        {filteredSections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No links match "<span className="text-foreground">{search}</span>"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map((section, i) => (
              <SectionCard key={section.id} section={section} defaultOpen={i < 3 || !!search} query={search} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span>Chorus.AI Platform · Version 3 · March 3, 2026</span>
          <div className="flex items-center gap-3">
            <a href={`${BASE}/legal/terms`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
            <a href={`${BASE}/legal/privacy`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
