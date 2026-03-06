/**
 * CreateEventWizard.tsx — CuraLive Create Event Wizard
 * 6-step guided flow: Event Type → Details → Branding → Agenda & Speakers → Registration → Publish
 * Operators can self-serve new webcasts, webinars, virtual events, and hybrid events.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Video, Mic, Globe, Users, Calendar, Clock, ChevronRight,
  ChevronLeft, Check, Plus, Trash2, Upload, Palette, FileText,
  Radio, Zap, Tv, Building2, Heart, GraduationCap, Briefcase,
  Landmark, TrendingUp, Megaphone, ArrowRight, AlertCircle,
  Loader2, Eye, Settings, Award
} from "lucide-react";

// ─── Event types ──────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: "webcast", icon: Radio, label: "Webcast", desc: "One-to-many broadcast. Ideal for earnings calls, town halls, and large-scale announcements.", badge: "Most Popular" },
  { id: "webinar", icon: Video, label: "Webinar", desc: "Interactive online seminar with Q&A, polls, and breakout rooms. Up to 10,000 attendees.", badge: null },
  { id: "virtual_event", icon: Tv, label: "Virtual Event", desc: "Multi-session conference with networking, expo halls, and parallel tracks.", badge: null },
  { id: "hybrid_event", icon: Globe, label: "Hybrid Event", desc: "Combines in-person and online audiences with seamless real-time sync.", badge: null },
  { id: "simulive", icon: Zap, label: "Simulive", desc: "Pre-recorded content broadcast as if live, with real-time Q&A and chat.", badge: "New" },
  { id: "audio_conference", icon: Mic, label: "Audio Conference", desc: "Dial-in conference call with operator controls, recording, and transcription.", badge: null },
  { id: "on_demand", icon: Eye, label: "On-Demand", desc: "Upload and host a recording with gated access, chapters, and CPD certification.", badge: null },
  { id: "capital_markets", icon: TrendingUp, label: "Capital Markets", desc: "Earnings calls, investor days, and roadshows with analyst Q&A and order book.", badge: null },
] as const;

// ─── Industry verticals ───────────────────────────────────────────────────────
const VERTICALS = [
  { id: "financial_services", icon: TrendingUp, label: "Financial Services", desc: "Earnings, investor days, AGMs" },
  { id: "corporate_communications", icon: Megaphone, label: "Corporate Comms", desc: "Town halls, all-hands, announcements" },
  { id: "healthcare", icon: Heart, label: "Healthcare", desc: "CME webinars, clinical updates" },
  { id: "technology", icon: Zap, label: "Technology", desc: "Product launches, developer events" },
  { id: "professional_services", icon: Briefcase, label: "Professional Services", desc: "CPD, training, client briefings" },
  { id: "government", icon: Landmark, label: "Government", desc: "Public hearings, budget speeches" },
  { id: "education", icon: GraduationCap, label: "Education", desc: "Lectures, graduations, open days" },
  { id: "media_entertainment", icon: Tv, label: "Media & Entertainment", desc: "Live shows, premieres, launches" },
  { id: "general", icon: Globe, label: "General", desc: "Other events" },
] as const;

// ─── Timezones ────────────────────────────────────────────────────────────────
const TIMEZONES = [
  "Africa/Johannesburg", "Africa/Nairobi", "Africa/Lagos", "Africa/Cairo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago",
  "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney", "UTC",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type AgendaItem = { time: string; title: string; speaker: string; duration: string };
type Speaker = { name: string; title: string; bio: string; initials: string };
type RegistrationField = { label: string; type: "text" | "email" | "select" | "checkbox"; required: boolean };

type WizardState = {
  // Step 1: Event Type
  eventType: string;
  industryVertical: string;
  // Step 2: Details
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  maxAttendees: number;
  hostName: string;
  hostOrganization: string;
  tags: string;
  // Step 3: Branding
  primaryColor: string;
  logoUrl: string;
  bannerText: string;
  // Step 4: Agenda & Speakers
  agenda: AgendaItem[];
  speakers: Speaker[];
  // Step 5: Registration
  registrationEnabled: boolean;
  qaEnabled: boolean;
  pollsEnabled: boolean;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  requireCompany: boolean;
  requireJobTitle: boolean;
  requirePhone: boolean;
  // Step 6: Review (no state, just display)
};

const DEFAULT_STATE: WizardState = {
  eventType: "",
  industryVertical: "",
  title: "",
  description: "",
  startDate: "",
  startTime: "10:00",
  endTime: "11:30",
  timezone: "Africa/Johannesburg",
  maxAttendees: 1000,
  hostName: "",
  hostOrganization: "",
  tags: "",
  primaryColor: "#3b82f6",
  logoUrl: "",
  bannerText: "",
  agenda: [
    { time: "00:00", title: "", speaker: "", duration: "15 min" },
  ],
  speakers: [
    { name: "", title: "", bio: "", initials: "" },
  ],
  registrationEnabled: true,
  qaEnabled: true,
  pollsEnabled: true,
  chatEnabled: true,
  recordingEnabled: true,
  requireCompany: true,
  requireJobTitle: false,
  requirePhone: false,
};

const STEPS = [
  { id: 1, label: "Event Type", icon: Radio },
  { id: 2, label: "Details", icon: FileText },
  { id: 3, label: "Branding", icon: Palette },
  { id: 4, label: "Agenda", icon: Calendar },
  { id: 5, label: "Registration", icon: Users },
  { id: 6, label: "Review & Publish", icon: Check },
];

const COLOR_PRESETS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#64748b", "#1e293b", "#dc2626",
];

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepEventType({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Event Format</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {EVENT_TYPES.map(({ id, icon: Icon, label, desc, badge }) => (
            <button
              key={id}
              onClick={() => update("eventType", id)}
              className={`relative text-left p-4 rounded-xl border transition-all ${
                state.eventType === id
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "bg-card border-border hover:border-primary/20 text-foreground"
              }`}
            >
              {badge && (
                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${state.eventType === id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Industry Vertical</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          {VERTICALS.map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              onClick={() => update("industryVertical", id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                state.industryVertical === id
                  ? "bg-primary/10 border-primary/40"
                  : "bg-card border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Icon className={`w-3.5 h-3.5 ${state.industryVertical === id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepDetails({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Event Title *</label>
        <input
          value={state.title}
          onChange={e => update("title", e.target.value)}
          placeholder="e.g. Q1 2026 Earnings Webcast"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        {state.title && (
          <p className="text-[10px] text-muted-foreground mt-1">
            URL slug: <span className="text-primary font-mono">/live-video/webcast/{slugify(state.title)}</span>
          </p>
        )}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
        <textarea
          value={state.description}
          onChange={e => update("description", e.target.value)}
          placeholder="Brief description shown on the registration page…"
          rows={3}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date *</label>
          <input
            type="date"
            value={state.startDate}
            onChange={e => update("startDate", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Start Time *</label>
          <input
            type="time"
            value={state.startTime}
            onChange={e => update("startTime", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">End Time</label>
          <input
            type="time"
            value={state.endTime}
            onChange={e => update("endTime", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Timezone</label>
          <select
            value={state.timezone}
            onChange={e => update("timezone", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Max Attendees</label>
          <input
            type="number"
            value={state.maxAttendees}
            onChange={e => update("maxAttendees", parseInt(e.target.value) || 1000)}
            min={10}
            max={100000}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Host Name</label>
          <input
            value={state.hostName}
            onChange={e => update("hostName", e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Organisation</label>
          <input
            value={state.hostOrganization}
            onChange={e => update("hostOrganization", e.target.value)}
            placeholder="Acme Corp"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Tags (comma-separated)</label>
        <input
          value={state.tags}
          onChange={e => update("tags", e.target.value)}
          placeholder="Earnings, Q1 2026, Financial Results"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>
    </div>
  );
}

function StepBranding({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Brand Colour</label>
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => update("primaryColor", c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${state.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.primaryColor}
              onChange={e => update("primaryColor", e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs font-mono text-muted-foreground">{state.primaryColor}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Logo URL</label>
        <input
          value={state.logoUrl}
          onChange={e => update("logoUrl", e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Upload your logo to a CDN and paste the URL here. Recommended: 200×60px, PNG with transparent background.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Registration Page Tagline</label>
        <input
          value={state.bannerText}
          onChange={e => update("bannerText", e.target.value)}
          placeholder="Join us for our quarterly investor update"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Live preview */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">Preview</label>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="h-2" style={{ backgroundColor: state.primaryColor }} />
          <div className="bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              {state.logoUrl ? (
                <img src={state.logoUrl} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: state.primaryColor }}>
                  {(state.hostOrganization || "Co").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold">{state.title || "Your Event Title"}</div>
                <div className="text-xs text-muted-foreground">{state.hostOrganization || "Your Organisation"}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              {state.bannerText || "Event description will appear here"}
            </div>
            <button className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: state.primaryColor }}>
              Register Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepAgenda({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: any) => void }) {
  const addAgendaItem = () => update("agenda", [...state.agenda, { time: "", title: "", speaker: "", duration: "15 min" }]);
  const removeAgendaItem = (i: number) => update("agenda", state.agenda.filter((_, idx) => idx !== i));
  const updateAgendaItem = (i: number, field: keyof AgendaItem, val: string) => {
    update("agenda", state.agenda.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  const addSpeaker = () => update("speakers", [...state.speakers, { name: "", title: "", bio: "", initials: "" }]);
  const removeSpeaker = (i: number) => update("speakers", state.speakers.filter((_, idx) => idx !== i));
  const updateSpeaker = (i: number, field: keyof Speaker, val: string) => {
    update("speakers", state.speakers.map((sp, idx) => {
      if (idx !== i) return sp;
      const updated = { ...sp, [field]: val };
      if (field === "name") updated.initials = val.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      return updated;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Agenda */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Agenda</h3>
          <button onClick={addAgendaItem} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {state.agenda.map((item, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr_80px_32px] gap-2 items-center">
              <input
                value={item.time}
                onChange={e => updateAgendaItem(i, "time", e.target.value)}
                placeholder="10:00"
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
              />
              <input
                value={item.title}
                onChange={e => updateAgendaItem(i, "title", e.target.value)}
                placeholder="Session title"
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <input
                value={item.speaker}
                onChange={e => updateAgendaItem(i, "speaker", e.target.value)}
                placeholder="Speaker name"
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <input
                value={item.duration}
                onChange={e => updateAgendaItem(i, "duration", e.target.value)}
                placeholder="15 min"
                className="bg-secondary border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button onClick={() => removeAgendaItem(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="w-20 text-center">Time</span>
          <span className="flex-1">Session Title</span>
          <span className="flex-1">Speaker</span>
          <span className="w-20 text-center">Duration</span>
        </div>
      </div>

      {/* Speakers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Speakers</h3>
          <button onClick={addSpeaker} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add speaker
          </button>
        </div>
        <div className="space-y-3">
          {state.speakers.map((sp, i) => (
            <div key={i} className="bg-secondary border border-border rounded-xl p-3">
              <div className="grid sm:grid-cols-2 gap-2 mb-2">
                <input
                  value={sp.name}
                  onChange={e => updateSpeaker(i, "name", e.target.value)}
                  placeholder="Full name"
                  className="bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <input
                  value={sp.title}
                  onChange={e => updateSpeaker(i, "title", e.target.value)}
                  placeholder="Job title"
                  className="bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={sp.bio}
                  onChange={e => updateSpeaker(i, "bio", e.target.value)}
                  placeholder="Short bio (optional)"
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <button onClick={() => removeSpeaker(i)} className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepRegistration({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: any) => void }) {
  const Toggle = ({ label, desc, field }: { label: string; desc: string; field: keyof WizardState }) => (
    <div className="flex items-start justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
      </div>
      <button
        onClick={() => update(field, !state[field])}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${state[field] ? "bg-primary" : "bg-secondary border border-border"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${state[field] ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Event Features</h3>
        <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Enable or disable features for attendees.</p>
        <Toggle label="Registration Page" desc="Show a public registration form before the event" field="registrationEnabled" />
        <Toggle label="Live Q&A" desc="Attendees can submit and upvote questions" field="qaEnabled" />
        <Toggle label="Polls" desc="Push interactive polls to attendees during the event" field="pollsEnabled" />
        <Toggle label="Live Chat" desc="Open chat channel for all attendees" field="chatEnabled" />
        <Toggle label="Recording" desc="Record the event and make it available on-demand" field="recordingEnabled" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Registration Fields</h3>
        <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>First name, last name, and email are always required.</p>
        <Toggle label="Company" desc="Require attendee's company name" field="requireCompany" />
        <Toggle label="Job Title" desc="Require attendee's job title" field="requireJobTitle" />
        <Toggle label="Phone Number" desc="Optionally collect phone number" field="requirePhone" />
      </div>

      {/* Vertical-specific notice */}
      {(state.industryVertical === "healthcare" || state.industryVertical === "professional_services") && (
        <div className="flex items-start gap-3 bg-violet-400/5 border border-violet-400/20 rounded-xl p-4">
          <Award className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-violet-400">CPD/CME Certification</div>
            <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Because you selected a {state.industryVertical === "healthcare" ? "Healthcare" : "Professional Services"} vertical, your registration page will automatically include the CME/CPD accreditation badge and post-event certificate download.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepReview({ state }: { state: WizardState }) {
  const eventTypeLabel = EVENT_TYPES.find(e => e.id === state.eventType)?.label || state.eventType;
  const verticalLabel = VERTICALS.find(v => v.id === state.industryVertical)?.label || state.industryVertical;
  const slug = slugify(state.title);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: state.primaryColor }}>
            {(state.hostOrganization || state.title).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-base">{state.title || "Untitled Event"}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded font-medium">{eventTypeLabel}</span>
              <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded font-medium">{verticalLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Event Details</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{state.startDate || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{state.startTime} – {state.endTime} ({state.timezone})</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max Attendees</span><span>{state.maxAttendees.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Host</span><span>{state.hostName || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Organisation</span><span>{state.hostOrganization || "—"}</span></div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Features Enabled</div>
          <div className="space-y-1.5 text-xs">
            {[
              { label: "Registration", enabled: state.registrationEnabled },
              { label: "Live Q&A", enabled: state.qaEnabled },
              { label: "Polls", enabled: state.pollsEnabled },
              { label: "Chat", enabled: state.chatEnabled },
              { label: "Recording", enabled: state.recordingEnabled },
            ].map(({ label, enabled }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${enabled ? "bg-emerald-400/20" : "bg-secondary"}`}>
                  {enabled ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <span className="w-1.5 h-0.5 bg-muted-foreground rounded-full" />}
                </span>
                <span className={enabled ? "text-foreground" : "text-muted-foreground line-through"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Agenda ({state.agenda.filter(a => a.title).length} sessions)</div>
        {state.agenda.filter(a => a.title).length === 0 ? (
          <p className="text-xs text-muted-foreground">No agenda items added.</p>
        ) : (
          <div className="space-y-1">
            {state.agenda.filter(a => a.title).map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-muted-foreground w-12">{item.time}</span>
                <span>{item.title}</span>
                {item.speaker && <span className="text-muted-foreground">· {item.speaker}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="text-xs font-semibold text-primary mb-1">Your event will be published at:</div>
        <div className="font-mono text-sm text-foreground">/live-video/webcast/{slug || "your-event-slug"}</div>
        <div className="text-xs text-muted-foreground mt-1">Registration page: /live-video/webcast/{slug || "your-event-slug"}/register</div>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────────────────────
export default function CreateEventWizard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const createMutation = trpc.webcast.createEvent.useMutation({
    onSuccess: () => { setPublished(true); setSubmitting(false); },
    onError: (err) => { setError(err.message); setSubmitting(false); },
  });

  const update = (key: keyof WizardState, value: any) => {
    setState(s => ({ ...s, [key]: value }));
    setError(null);
  };

  const canAdvance = () => {
    if (step === 1) return !!state.eventType && !!state.industryVertical;
    if (step === 2) return !!state.title && !!state.startDate;
    return true;
  };

  const handlePublish = () => {
    if (!state.title || !state.eventType) { setError("Please complete all required fields."); return; }
    setSubmitting(true);
    setError(null);
    const slug = slugify(state.title);
    const startTs = state.startDate ? new Date(`${state.startDate}T${state.startTime}`).getTime() : undefined;
    const endTs = state.startDate && state.endTime ? new Date(`${state.startDate}T${state.endTime}`).getTime() : undefined;
    createMutation.mutate({
      slug,
      title: state.title,
      description: state.description || undefined,
      eventType: state.eventType as any,
      industryVertical: state.industryVertical as any,
      startTime: startTs,
      endTime: endTs,
      timezone: state.timezone,
      maxAttendees: state.maxAttendees,
      hostName: state.hostName || undefined,
      hostOrganization: state.hostOrganization || undefined,
      tags: state.tags || undefined,
    });
  };

  const slug = slugify(state.title);

  // Auth guard — show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            You need to be logged in with an operator or admin role to create events. The platform owner is automatically granted admin access.
          </p>
          <div className="flex flex-col gap-3">
            <a href={getLoginUrl()} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Login to Continue
            </a>
            <button onClick={() => navigate('/live-video/webcasting')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Webcasting Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Event Created!</h1>
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            <strong>{state.title}</strong> has been created as a draft. Share the registration link or go to the studio to configure your stream.
          </p>
          <div className="bg-card border border-border rounded-xl p-4 text-left mb-6">
            <div className="text-xs text-muted-foreground mb-2">Event URLs</div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] text-muted-foreground">Registration Page</div>
                <div className="font-mono text-xs text-primary">/live-video/webcast/{slug}/register</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Studio / Production Console</div>
                <div className="font-mono text-xs text-primary">/live-video/webcast/{slug}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/live-video/webcast/${slug}/register`)}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Eye className="w-4 h-4" /> View Registration
            </button>
            <button
              onClick={() => navigate(`/live-video/webcast/${slug}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Radio className="w-4 h-4" /> Open Studio
            </button>
          </div>
          <button onClick={() => navigate("/live-video/webcasting")} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Webcasting Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => navigate("/live-video/webcasting")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Cancel
          </button>
          <span className="text-sm font-bold">Create New Event</span>
          <div className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</div>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="border-b border-border bg-card/30">
        <div className="container py-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map(({ id, label, icon: Icon }) => (
              <div key={id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => id < step && setStep(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    id === step
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : id < step
                      ? "text-emerald-400 hover:bg-emerald-400/5 cursor-pointer"
                      : "text-muted-foreground cursor-default"
                  }`}
                >
                  {id < step ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {id < STEPS.length && <ChevronRight className="w-3 h-3 text-border shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{STEPS[step - 1].label}</h2>
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {step === 1 && "Choose the format and industry for your event."}
              {step === 2 && "Set the date, time, and basic information."}
              {step === 3 && "Customise the look of your registration page."}
              {step === 4 && "Build your agenda and add speakers."}
              {step === 5 && "Configure registration and engagement features."}
              {step === 6 && "Review everything before publishing."}
            </p>
          </div>

          {step === 1 && <StepEventType state={state} update={update} />}
          {step === 2 && <StepDetails state={state} update={update} />}
          {step === 3 && <StepBranding state={state} update={update} />}
          {step === 4 && <StepAgenda state={state} update={update} />}
          {step === 5 && <StepRegistration state={state} update={update} />}
          {step === 6 && <StepReview state={state} />}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-4">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => step > 1 && setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length ? (
              <button
                onClick={() => canAdvance() && setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Check className="w-4 h-4" /> Publish Event</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
