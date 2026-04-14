import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Palette, FileText, Mail, Link2, Settings2, ChevronRight, Save, RotateCcw,
  Copy, Check, Eye, EyeOff, Plus, Trash2, Building2, Calendar, Users,
  Globe, Phone, AlignLeft, ToggleLeft, ToggleRight, Zap
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Speaker { name: string; title: string; org: string; initials: string; color: string; }
interface AgendaItem { time: string; title: string; speaker: string; }
interface CustomisationState {
  // Brand
  clientName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  showPoweredBy: boolean;
  // Registration
  regPageTitle: string;
  regPageSubtitle: string;
  regHostName: string;
  regHostTitle: string;
  regHostOrg: string;
  regEventDate: string;
  regEventTime: string;
  regEventTimezone: string;
  regDescription: string;
  regFeatures: string[];
  regAgenda: AgendaItem[];
  regSpeakers: Speaker[];
  regIndustryVertical: string;
  regMaxAttendees: number;
  regConsentText: string;
  regSupportEmail: string;
  regFieldCompany: boolean;
  regFieldJobTitle: boolean;
  regFieldPhone: boolean;
  regFieldCountry: boolean;
  regFieldLanguage: boolean;
  regFieldDialIn: boolean;
  // Booking
  bookHeadline: string;
  bookSubheadline: string;
  bookFeatures: string[];
  bookServiceOptions: string[];
  bookReplyEmail: string;
  bookButtonLabel: string;
  // Email
  emailSenderName: string;
  emailSenderAddress: string;
  emailHeaderColor: string;
  emailButtonColor: string;
  emailButtonLabel: string;
  emailFooterText: string;
  // Links
  customSlug: string;
  shortLinkEnabled: boolean;
}

const DEFAULTS: CustomisationState = {
  clientName: "CuraLive", logoUrl: "", primaryColor: "#c8a96e", accentColor: "#10b981",
  fontFamily: "Space Grotesk", showPoweredBy: true,
  regPageTitle: "", regPageSubtitle: "", regHostName: "", regHostTitle: "", regHostOrg: "",
  regEventDate: "", regEventTime: "", regEventTimezone: "SAST", regDescription: "",
  regFeatures: ["Live transcription & AI summary", "Real-time Q&A moderation", "Multi-language support", "Post-event recording"],
  regAgenda: [{ time: "09:00", title: "Welcome & Introduction", speaker: "" }, { time: "09:15", title: "Keynote Presentation", speaker: "" }],
  regSpeakers: [{ name: "", title: "", org: "", initials: "AB", color: "#c8a96e" }],
  regIndustryVertical: "general", regMaxAttendees: 1000, regConsentText: "", regSupportEmail: "",
  regFieldCompany: true, regFieldJobTitle: true, regFieldPhone: false, regFieldCountry: false,
  regFieldLanguage: true, regFieldDialIn: true,
  bookHeadline: "Book Your Event with CuraLive", bookSubheadline: "Professional event management for investor days, earnings calls, and corporate webcasts.",
  bookFeatures: ["Live transcription & AI summaries", "Multi-platform support (Zoom, Teams, Webex)", "Real-time Q&A moderation", "Post-event analytics & reports"],
  bookServiceOptions: ["Q&A Webcast", "Earnings Call", "Investor Day", "AGM / Shareholder Meeting", "Board Briefing", "Product Launch", "Town Hall", "Other"],
  bookReplyEmail: "", bookButtonLabel: "Submit Booking Request",
  emailSenderName: "CuraLive", emailSenderAddress: "", emailHeaderColor: "#0f172a",
  emailButtonColor: "#3b82f6", emailButtonLabel: "Join Event", emailFooterText: "",
  customSlug: "", shortLinkEnabled: false,
};

type Section = "brand" | "registration" | "booking" | "email" | "links";

// ─── Helper Components ────────────────────────────────────────────────────────
function SectionTab({ id, label, icon: Icon, active, onClick }: { id: Section; label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left ${active ? "bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/20" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#c8a96e]/50 transition-colors" />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#c8a96e]/50 transition-colors resize-none" />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!value)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${value ? "bg-[#c8a96e]/10 border-[#c8a96e]/30 text-[#c8a96e]" : "bg-white/3 border-white/10 text-slate-500"}`}>
      {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
      {label}
    </button>
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2 bg-[#06080f] border border-white/10 rounded-lg px-3 py-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-slate-300 focus:outline-none" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomisationPortal({ eventId }: { eventId: string }) {
  const [section, setSection] = useState<Section>("brand");
  const [cfg, setCfg] = useState<CustomisationState>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Load existing customisation
  const { data: existing } = trpc.customisation.get.useQuery({ eventId });
  const saveMutation = trpc.customisation.save.useMutation({
    onSuccess: () => { toast.success("Customisation saved!"); setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (e) => toast.error("Save failed: " + e.message),
  });
  const resetMutation = trpc.customisation.reset.useMutation({
    onSuccess: () => { setCfg(DEFAULTS); toast.success("Reset to defaults"); },
  });

  useEffect(() => {
    if (!existing) return;
    setCfg({
      clientName: existing.clientName ?? DEFAULTS.clientName,
      logoUrl: existing.logoUrl ?? "",
      primaryColor: existing.primaryColor ?? DEFAULTS.primaryColor,
      accentColor: existing.accentColor ?? DEFAULTS.accentColor,
      fontFamily: existing.fontFamily ?? DEFAULTS.fontFamily,
      showPoweredBy: existing.showPoweredBy !== false,
      regPageTitle: existing.regPageTitle ?? "",
      regPageSubtitle: existing.regPageSubtitle ?? "",
      regHostName: existing.regHostName ?? "",
      regHostTitle: existing.regHostTitle ?? "",
      regHostOrg: existing.regHostOrg ?? "",
      regEventDate: existing.regEventDate ?? "",
      regEventTime: existing.regEventTime ?? "",
      regEventTimezone: existing.regEventTimezone ?? "SAST",
      regDescription: existing.regDescription ?? "",
      regFeatures: existing.regFeatures ? JSON.parse(existing.regFeatures) : DEFAULTS.regFeatures,
      regAgenda: existing.regAgenda ? JSON.parse(existing.regAgenda) : DEFAULTS.regAgenda,
      regSpeakers: existing.regSpeakers ? JSON.parse(existing.regSpeakers) : DEFAULTS.regSpeakers,
      regIndustryVertical: existing.regIndustryVertical ?? "general",
      regMaxAttendees: existing.regMaxAttendees ?? 1000,
      regConsentText: existing.regConsentText ?? "",
      regSupportEmail: existing.regSupportEmail ?? "",
      regFieldCompany: existing.regFieldCompany !== false,
      regFieldJobTitle: existing.regFieldJobTitle !== false,
      regFieldPhone: existing.regFieldPhone ?? false,
      regFieldCountry: existing.regFieldCountry ?? false,
      regFieldLanguage: existing.regFieldLanguage !== false,
      regFieldDialIn: existing.regFieldDialIn !== false,
      bookHeadline: existing.bookHeadline ?? DEFAULTS.bookHeadline,
      bookSubheadline: existing.bookSubheadline ?? DEFAULTS.bookSubheadline,
      bookFeatures: existing.bookFeatures ? JSON.parse(existing.bookFeatures) : DEFAULTS.bookFeatures,
      bookServiceOptions: existing.bookServiceOptions ? JSON.parse(existing.bookServiceOptions) : DEFAULTS.bookServiceOptions,
      bookReplyEmail: existing.bookReplyEmail ?? "",
      bookButtonLabel: existing.bookButtonLabel ?? DEFAULTS.bookButtonLabel,
      emailSenderName: existing.emailSenderName ?? DEFAULTS.emailSenderName,
      emailSenderAddress: existing.emailSenderAddress ?? "",
      emailHeaderColor: existing.emailHeaderColor ?? DEFAULTS.emailHeaderColor,
      emailButtonColor: existing.emailButtonColor ?? DEFAULTS.emailButtonColor,
      emailButtonLabel: existing.emailButtonLabel ?? DEFAULTS.emailButtonLabel,
      emailFooterText: existing.emailFooterText ?? "",
      customSlug: existing.customSlug ?? "",
      shortLinkEnabled: existing.shortLinkEnabled ?? false,
    });
  }, [existing]);

  const set = <K extends keyof CustomisationState>(key: K, value: CustomisationState[K]) =>
    setCfg(c => ({ ...c, [key]: value }));

  const handleSave = () => {
    saveMutation.mutate({
      eventId,
      ...cfg,
      regFeatures: JSON.stringify(cfg.regFeatures),
      regAgenda: JSON.stringify(cfg.regAgenda),
      regSpeakers: JSON.stringify(cfg.regSpeakers),
      bookFeatures: JSON.stringify(cfg.bookFeatures),
      bookServiceOptions: JSON.stringify(cfg.bookServiceOptions),
    });
  };

  const copyLink = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const slug = cfg.customSlug || eventId;
  const origin = window.location.origin;
  const regLink = `${origin}/register/${slug}`;
  const webcastLink = `${origin}/live-video/webcast/${slug}/register`;
  const bookLink = `${origin}/book-demo`;

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "brand", label: "Brand Identity", icon: Palette },
    { id: "registration", label: "Registration Page", icon: FileText },
    { id: "booking", label: "Booking Form", icon: Settings2 },
    { id: "email", label: "Email Branding", icon: Mail },
    { id: "links", label: "Unique Links", icon: Link2 },
  ];

  return (
    <div className="p-6 max-w-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#c8a96e]" /> Event Customisation Portal
          </h2>
          <p className="text-slate-500 text-sm">Customise branding, registration, booking form, and emails for this event.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all">
            {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? "Edit" : "Preview"}
          </button>
          <button onClick={() => resetMutation.mutate({ eventId })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handleSave} disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ backgroundColor: saved ? "#10b981" : "#c8a96e", color: "#0a0f1e" }}>
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveMutation.isPending ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Sidebar Nav */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {SECTIONS.map(s => (
            <SectionTab key={s.id} id={s.id} label={s.label} icon={s.icon} active={section === s.id} onClick={() => setSection(s.id)} />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">

          {/* ── BRAND IDENTITY ─────────────────────────────────────────────── */}
          {section === "brand" && (
            <div className="space-y-5">
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Client Identity
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Client / Company Name</FieldLabel>
                    <Input value={cfg.clientName} onChange={v => set("clientName", v)} placeholder="e.g. Meridian Capital" />
                  </div>
                  <div>
                    <FieldLabel>Logo URL</FieldLabel>
                    <Input value={cfg.logoUrl} onChange={v => set("logoUrl", v)} placeholder="https://cdn.example.com/logo.png" />
                  </div>
                </div>
                {cfg.logoUrl && (
                  <div className="mt-3 p-3 bg-[#06080f] rounded-lg border border-white/5">
                    <img src={cfg.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Colours & Typography
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <ColorInput value={cfg.primaryColor} onChange={v => set("primaryColor", v)} label="Primary Colour" />
                  <ColorInput value={cfg.accentColor} onChange={v => set("accentColor", v)} label="Accent Colour" />
                </div>
                <div className="mt-4">
                  <FieldLabel>Font Family</FieldLabel>
                  <select value={cfg.fontFamily} onChange={e => set("fontFamily", e.target.value)}
                    className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c8a96e]/50">
                    {["Space Grotesk", "Inter", "Montserrat", "Poppins", "Lato", "Roboto", "Playfair Display"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Show "Powered by CuraLive" watermark</span>
                  <Toggle value={cfg.showPoweredBy} onChange={v => set("showPoweredBy", v)} label={cfg.showPoweredBy ? "Visible" : "Hidden"} />
                </div>
              </div>

              {/* Live Colour Preview */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Colour Preview</div>
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <div className="h-10 flex items-center px-4 gap-3" style={{ backgroundColor: cfg.primaryColor + "22", borderBottom: `1px solid ${cfg.primaryColor}33` }}>
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: cfg.primaryColor }} />
                    <span className="text-sm font-bold" style={{ color: cfg.primaryColor, fontFamily: cfg.fontFamily }}>{cfg.clientName}</span>
                  </div>
                  <div className="bg-[#06080f] p-4">
                    <div className="text-sm font-bold text-white mb-1" style={{ fontFamily: cfg.fontFamily }}>Sample Event Title</div>
                    <div className="text-xs text-slate-500 mb-3">Hosted by {cfg.clientName}</div>
                    <button className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: cfg.primaryColor, color: "#0a0f1e" }}>Register Now</button>
                    {cfg.showPoweredBy && <div className="text-[10px] text-slate-700 mt-3 text-right">Powered by CuraLive</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTRATION PAGE ──────────────────────────────────────────── */}
          {section === "registration" && (
            <div className="space-y-5">
              {/* Event Details */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Event Details
                </div>
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Page Title</FieldLabel>
                    <Input value={cfg.regPageTitle} onChange={v => set("regPageTitle", v)} placeholder="e.g. Full Year 2025 Results & Outlook" />
                  </div>
                  <div>
                    <FieldLabel>Subtitle</FieldLabel>
                    <Input value={cfg.regPageSubtitle} onChange={v => set("regPageSubtitle", v)} placeholder="e.g. Join us for our annual investor presentation" />
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>Event Date</FieldLabel>
                      <Input value={cfg.regEventDate} onChange={v => set("regEventDate", v)} placeholder="e.g. 15 April 2026" />
                    </div>
                    <div>
                      <FieldLabel>Event Time</FieldLabel>
                      <Input value={cfg.regEventTime} onChange={v => set("regEventTime", v)} placeholder="e.g. 10:00" />
                    </div>
                    <div>
                      <FieldLabel>Timezone</FieldLabel>
                      <select value={cfg.regEventTimezone} onChange={e => set("regEventTimezone", e.target.value)}
                        className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c8a96e]/50">
                        {["SAST", "UTC", "GMT", "EST", "PST", "CET", "IST", "WAT", "EAT"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea value={cfg.regDescription} onChange={v => set("regDescription", v)} placeholder="Brief description of the event…" rows={3} />
                  </div>
                </div>
              </div>

              {/* Host */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4">Host Details</div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>Host Name</FieldLabel>
                    <Input value={cfg.regHostName} onChange={v => set("regHostName", v)} placeholder="e.g. Alexandra Thornton" />
                  </div>
                  <div>
                    <FieldLabel>Host Title</FieldLabel>
                    <Input value={cfg.regHostTitle} onChange={v => set("regHostTitle", v)} placeholder="e.g. Chief Financial Officer" />
                  </div>
                  <div>
                    <FieldLabel>Organisation</FieldLabel>
                    <Input value={cfg.regHostOrg} onChange={v => set("regHostOrg", v)} placeholder="e.g. Meridian Capital" />
                  </div>
                </div>
              </div>

              {/* Speakers */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e]">Speakers</div>
                  <button onClick={() => set("regSpeakers", [...cfg.regSpeakers, { name: "", title: "", org: "", initials: "XX", color: "#c8a96e" }])}
                    className="flex items-center gap-1.5 text-xs text-[#c8a96e] hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add Speaker
                  </button>
                </div>
                <div className="space-y-3">
                  {cfg.regSpeakers.map((sp, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2">
                        <FieldLabel>Name</FieldLabel>
                        <Input value={sp.name} onChange={v => { const s = [...cfg.regSpeakers]; s[i] = { ...s[i], name: v }; set("regSpeakers", s); }} placeholder="Full name" />
                      </div>
                      <div>
                        <FieldLabel>Title</FieldLabel>
                        <Input value={sp.title} onChange={v => { const s = [...cfg.regSpeakers]; s[i] = { ...s[i], title: v }; set("regSpeakers", s); }} placeholder="CEO" />
                      </div>
                      <div>
                        <FieldLabel>Initials</FieldLabel>
                        <Input value={sp.initials} onChange={v => { const s = [...cfg.regSpeakers]; s[i] = { ...s[i], initials: v.slice(0, 2).toUpperCase() }; set("regSpeakers", s); }} placeholder="AT" />
                      </div>
                      <button onClick={() => set("regSpeakers", cfg.regSpeakers.filter((_, j) => j !== i))}
                        className="h-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e]">Agenda</div>
                  <button onClick={() => set("regAgenda", [...cfg.regAgenda, { time: "", title: "", speaker: "" }])}
                    className="flex items-center gap-1.5 text-xs text-[#c8a96e] hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {cfg.regAgenda.map((item, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <FieldLabel>Time</FieldLabel>
                        <Input value={item.time} onChange={v => { const a = [...cfg.regAgenda]; a[i] = { ...a[i], time: v }; set("regAgenda", a); }} placeholder="09:00" />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel>Session Title</FieldLabel>
                        <Input value={item.title} onChange={v => { const a = [...cfg.regAgenda]; a[i] = { ...a[i], title: v }; set("regAgenda", a); }} placeholder="Welcome & Introduction" />
                      </div>
                      <div>
                        <FieldLabel>Speaker</FieldLabel>
                        <Input value={item.speaker} onChange={v => { const a = [...cfg.regAgenda]; a[i] = { ...a[i], speaker: v }; set("regAgenda", a); }} placeholder="Name" />
                      </div>
                      <button onClick={() => set("regAgenda", cfg.regAgenda.filter((_, j) => j !== i))}
                        className="h-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e]">"What to Expect" Features</div>
                  <button onClick={() => set("regFeatures", [...cfg.regFeatures, ""])}
                    className="flex items-center gap-1.5 text-xs text-[#c8a96e] hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {cfg.regFeatures.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={f} onChange={v => { const arr = [...cfg.regFeatures]; arr[i] = v; set("regFeatures", arr); }} placeholder="Feature description…" />
                      <button onClick={() => set("regFeatures", cfg.regFeatures.filter((_, j) => j !== i))}
                        className="w-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Fields & Industry */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <AlignLeft className="w-3.5 h-3.5" /> Form Fields & Settings
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Industry Vertical</FieldLabel>
                    <select value={cfg.regIndustryVertical} onChange={e => set("regIndustryVertical", e.target.value)}
                      className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c8a96e]/50 mb-4">
                      {[["general", "General"], ["financial_services", "Financial Services / Capital Markets"], ["healthcare", "Healthcare / Medical"], ["technology", "Technology"], ["professional_services", "Professional Services"], ["government", "Government / Public Sector"], ["education", "Education"]].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <FieldLabel>Max Attendees</FieldLabel>
                    <input type="number" value={cfg.regMaxAttendees} onChange={e => set("regMaxAttendees", parseInt(e.target.value) || 1000)}
                      className="w-full bg-[#06080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c8a96e]/50" />
                  </div>
                  <div>
                    <FieldLabel>Form Fields (toggle on/off)</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "regFieldCompany" as const, label: "Company" },
                        { key: "regFieldJobTitle" as const, label: "Job Title" },
                        { key: "regFieldPhone" as const, label: "Phone" },
                        { key: "regFieldCountry" as const, label: "Country" },
                        { key: "regFieldLanguage" as const, label: "Language" },
                        { key: "regFieldDialIn" as const, label: "Dial-In" },
                      ].map(({ key, label }) => (
                        <Toggle key={key} value={cfg[key]} onChange={v => set(key, v)} label={label} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Support Email</FieldLabel>
                    <Input value={cfg.regSupportEmail} onChange={v => set("regSupportEmail", v)} placeholder="ir@company.com" type="email" />
                  </div>
                  <div>
                    <FieldLabel>Custom Consent Text (optional)</FieldLabel>
                    <Input value={cfg.regConsentText} onChange={v => set("regConsentText", v)} placeholder="Leave blank for default" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKING FORM ───────────────────────────────────────────────── */}
          {section === "booking" && (
            <div className="space-y-5">
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4">Headline & Copy</div>
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Headline</FieldLabel>
                    <Input value={cfg.bookHeadline} onChange={v => set("bookHeadline", v)} placeholder="Book Your Event with CuraLive" />
                  </div>
                  <div>
                    <FieldLabel>Sub-headline</FieldLabel>
                    <Textarea value={cfg.bookSubheadline} onChange={v => set("bookSubheadline", v)} placeholder="Professional event management for…" rows={2} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Reply-To Email</FieldLabel>
                      <Input value={cfg.bookReplyEmail} onChange={v => set("bookReplyEmail", v)} placeholder="bookings@company.com" type="email" />
                    </div>
                    <div>
                      <FieldLabel>Submit Button Label</FieldLabel>
                      <Input value={cfg.bookButtonLabel} onChange={v => set("bookButtonLabel", v)} placeholder="Submit Booking Request" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e]">Feature List (Left Column)</div>
                  <button onClick={() => set("bookFeatures", [...cfg.bookFeatures, ""])}
                    className="flex items-center gap-1.5 text-xs text-[#c8a96e] hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {cfg.bookFeatures.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={f} onChange={v => { const arr = [...cfg.bookFeatures]; arr[i] = v; set("bookFeatures", arr); }} placeholder="Feature…" />
                      <button onClick={() => set("bookFeatures", cfg.bookFeatures.filter((_, j) => j !== i))}
                        className="w-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e]">Service Interest Options (Dropdown)</div>
                  <button onClick={() => set("bookServiceOptions", [...cfg.bookServiceOptions, ""])}
                    className="flex items-center gap-1.5 text-xs text-[#c8a96e] hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {cfg.bookServiceOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={opt} onChange={v => { const arr = [...cfg.bookServiceOptions]; arr[i] = v; set("bookServiceOptions", arr); }} placeholder="Service name…" />
                      <button onClick={() => set("bookServiceOptions", cfg.bookServiceOptions.filter((_, j) => j !== i))}
                        className="w-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EMAIL BRANDING ─────────────────────────────────────────────── */}
          {section === "email" && (
            <div className="space-y-5">
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Sender Details
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Sender Name</FieldLabel>
                    <Input value={cfg.emailSenderName} onChange={v => set("emailSenderName", v)} placeholder="CuraLive" />
                  </div>
                  <div>
                    <FieldLabel>Sender Email Address</FieldLabel>
                    <Input value={cfg.emailSenderAddress} onChange={v => set("emailSenderAddress", v)} placeholder="noreply@company.com" type="email" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">The sender address requires DNS verification via Resend before it can be used in production.</p>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4">Email Appearance</div>
                <div className="grid md:grid-cols-3 gap-4">
                  <ColorInput value={cfg.emailHeaderColor} onChange={v => set("emailHeaderColor", v)} label="Header Background" />
                  <ColorInput value={cfg.emailButtonColor} onChange={v => set("emailButtonColor", v)} label="Button Colour" />
                  <div>
                    <FieldLabel>Button Label</FieldLabel>
                    <Input value={cfg.emailButtonLabel} onChange={v => set("emailButtonLabel", v)} placeholder="Join Event" />
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel>Footer Text</FieldLabel>
                  <Input value={cfg.emailFooterText} onChange={v => set("emailFooterText", v)} placeholder="e.g. Meridian Capital · Powered by CuraLive" />
                </div>
              </div>

              {/* Email Preview */}
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Email Preview</div>
                <div className="rounded-lg overflow-hidden border border-white/10 max-w-sm">
                  <div className="h-14 flex items-center px-4" style={{ background: `linear-gradient(135deg, ${cfg.emailHeaderColor}, ${cfg.emailHeaderColor}dd)` }}>
                    <span className="text-sm font-bold text-white">{cfg.emailSenderName || "CuraLive"}</span>
                  </div>
                  <div className="bg-[#0d1117] p-4">
                    <div className="text-xs text-slate-400 mb-3">Hi [First Name],<br />Your registration is confirmed.</div>
                    <button className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: cfg.emailButtonColor }}>
                      {cfg.emailButtonLabel || "Join Event"}
                    </button>
                    <div className="text-[10px] text-slate-600 mt-4">{cfg.emailFooterText || `${cfg.emailSenderName} · Powered by CuraLive`}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── UNIQUE LINKS ───────────────────────────────────────────────── */}
          {section === "links" && (
            <div className="space-y-5">
              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Custom Slug
                </div>
                <div>
                  <FieldLabel>Event Slug (URL identifier)</FieldLabel>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-0 flex-1 bg-[#06080f] border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-3 text-xs text-slate-600 border-r border-white/10 py-2 whitespace-nowrap">{origin}/register/</span>
                      <input value={cfg.customSlug || eventId} onChange={e => set("customSlug", e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none" placeholder={eventId} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">Use lowercase letters, numbers, and hyphens only. Leave blank to use the default event ID.</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Enable short link (e.g. /e/{slug})</span>
                  <Toggle value={cfg.shortLinkEnabled} onChange={v => set("shortLinkEnabled", v)} label={cfg.shortLinkEnabled ? "Enabled" : "Disabled"} />
                </div>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4">Generated Links</div>
                <div className="space-y-3">
                  {[
                    { label: "Classic Registration Page", url: regLink, key: "reg", desc: "Share with attendees for earnings calls, investor days, board briefings" },
                    { label: "Webcast Registration Page", url: webcastLink, key: "webcast", desc: "Share with attendees for webcasts, webinars, and virtual events" },
                    { label: "Event Booking Form", url: bookLink, key: "book", desc: "Share with clients to submit a new event booking request" },
                  ].map(({ label, url, key, desc }) => (
                    <div key={key} className="bg-[#06080f] rounded-lg p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-300">{label}</span>
                        <button onClick={() => copyLink(url, key)}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#c8a96e] transition-colors">
                          {copied === key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === key ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="text-xs font-mono text-slate-500 truncate mb-1">{url}</div>
                      <div className="text-[11px] text-slate-700">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f1629] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Quick Stats
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Registered", value: "—" },
                    { label: "Attended", value: "—" },
                    { label: "Completion Rate", value: "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#06080f] rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xl font-bold text-white">{value}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-700 mt-2">Live stats will appear once the event has registrations.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
