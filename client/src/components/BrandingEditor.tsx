import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Palette, Upload, Eye, EyeOff, Save, RotateCcw, Loader2, X, Check } from "lucide-react";

interface BrandingEditorProps {
  roadshowId: string;
  roadshowTitle: string;
  onClose: () => void;
}

const FONT_OPTIONS = [
  "Space Grotesk",
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "DM Sans",
  "Work Sans",
  "Playfair Display",
];

const PRESET_THEMES = [
  {
    name: "CuraLive Dark",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
  },
  {
    name: "Goldman Sachs",
    primaryColor: "#0033a0",
    accentColor: "#c9a84c",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
  },
  {
    name: "Morgan Stanley",
    primaryColor: "#003087",
    accentColor: "#e31837",
    backgroundColor: "#f5f5f5",
    textColor: "#1a1a1a",
  },
  {
    name: "JP Morgan",
    primaryColor: "#003087",
    accentColor: "#d4a017",
    backgroundColor: "#0a0a0a",
    textColor: "#f0f0f0",
  },
  {
    name: "Barclays",
    primaryColor: "#00aeef",
    accentColor: "#1e3a5f",
    backgroundColor: "#0d1b2a",
    textColor: "#e8f4fd",
  },
  {
    name: "BofA",
    primaryColor: "#e31837",
    accentColor: "#c8102e",
    backgroundColor: "#1a1a2e",
    textColor: "#f5f5f5",
  },
];

export default function BrandingEditor({ roadshowId, roadshowTitle, onClose }: BrandingEditorProps) {
  const { data: existing, isLoading } = trpc.branding.getBranding.useQuery({ roadshowId });

  const [form, setForm] = useState({
    clientName: "",
    logoUrl: "",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    fontFamily: "Space Grotesk",
    tagline: "",
    footerText: "",
    showChorusWatermark: true,
    customCss: "",
  });

  const [activeTab, setActiveTab] = useState<"theme" | "content" | "advanced">("theme");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (existing) {
      setForm({
        clientName: existing.clientName ?? "",
        logoUrl: existing.logoUrl ?? "",
        primaryColor: existing.primaryColor ?? "#3b82f6",
        accentColor: existing.accentColor ?? "#10b981",
        backgroundColor: existing.backgroundColor ?? "#0f172a",
        textColor: existing.textColor ?? "#f8fafc",
        fontFamily: existing.fontFamily ?? "Space Grotesk",
        tagline: existing.tagline ?? "",
        footerText: existing.footerText ?? "",
        showChorusWatermark: existing.showChorusWatermark !== false,
        customCss: existing.customCss ?? "",
      });
    } else {
      setForm(f => ({ ...f, clientName: roadshowTitle }));
    }
  }, [existing, roadshowTitle]);

  const saveMutation = trpc.branding.saveBranding.useMutation({
    onSuccess: () => toast.success("Branding saved successfully"),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.branding.deleteBranding.useMutation({
    onSuccess: () => {
      toast.success("Branding reset to CuraLive defaults");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setForm(f => ({
      ...f,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
    }));
  };

  const handleSave = () => {
    if (!form.clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    saveMutation.mutate({ roadshowId, ...form });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">White-Label Branding</h2>
              <p className="text-[11px] text-slate-500">{roadshowTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Editor Panel */}
          <div className="w-96 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              {(["theme", "content", "advanced"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "text-white border-b-2 border-violet-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "theme" && (
                <>
                  {/* Preset Themes */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-2">Quick Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_THEMES.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className="group relative rounded-lg overflow-hidden border border-slate-700 hover:border-violet-500 transition-colors"
                          style={{ backgroundColor: preset.backgroundColor }}
                          title={preset.name}
                        >
                          <div className="h-8 flex items-center justify-center gap-1 px-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                          </div>
                          <div className="text-[9px] text-center pb-1.5 font-medium" style={{ color: preset.textColor }}>
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Pickers */}
                  <div className="space-y-3">
                    {[
                      { key: "primaryColor", label: "Primary Colour" },
                      { key: "accentColor", label: "Accent Colour" },
                      { key: "backgroundColor", label: "Background" },
                      { key: "textColor", label: "Text Colour" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-xs text-slate-300">{label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={(form as any)[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer border border-slate-600 bg-transparent"
                          />
                          <input
                            type="text"
                            value={(form as any)[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Font */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Font Family</label>
                    <select
                      value={form.fontFamily}
                      onChange={e => setForm(f => ({ ...f, fontFamily: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      {FONT_OPTIONS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === "content" && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Client Name *</label>
                    <input
                      type="text"
                      value={form.clientName}
                      onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="e.g. Goldman Sachs"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Logo URL</label>
                    <input
                      type="url"
                      value={form.logoUrl}
                      onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="https://cdn.example.com/logo.png"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Upload your logo to a CDN and paste the URL here.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                      placeholder="e.g. Capital Markets Excellence"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Footer Text</label>
                    <textarea
                      value={form.footerText}
                      onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
                      rows={3}
                      placeholder="e.g. Confidential — For Authorised Investors Only"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs text-slate-300">Show CuraLive Watermark</p>
                      <p className="text-[10px] text-slate-500">Displays "Powered by CuraLive" in the footer</p>
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, showChorusWatermark: !f.showChorusWatermark }))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${form.showChorusWatermark ? "bg-violet-500" : "bg-slate-600"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.showChorusWatermark ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </>
              )}

              {activeTab === "advanced" && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Custom CSS</label>
                    <textarea
                      value={form.customCss}
                      onChange={e => setForm(f => ({ ...f, customCss: e.target.value }))}
                      rows={10}
                      placeholder={`/* Override any styles */\n.waiting-room-header {\n  border-bottom: 2px solid var(--primary);\n}`}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-green-300 font-mono focus:outline-none focus:border-violet-500 resize-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Applied to all attendee-facing pages for this event.</p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-800 p-4 space-y-2">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Branding
              </button>
              {existing && (
                <button
                  onClick={() => deleteMutation.mutate({ roadshowId })}
                  disabled={deleteMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to CuraLive Defaults
                </button>
              )}
            </div>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#1e293b" }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-4">Live Preview — Investor Waiting Room</p>
              <div
                className="rounded-xl overflow-hidden border border-slate-700 shadow-xl"
                style={{
                  backgroundColor: form.backgroundColor,
                  color: form.textColor,
                  fontFamily: `'${form.fontFamily}', sans-serif`,
                }}
              >
                {/* Preview Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between border-b"
                  style={{ borderColor: `${form.primaryColor}30` }}
                >
                  <div className="flex items-center gap-3">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div
                        className="h-8 px-3 rounded flex items-center text-xs font-bold"
                        style={{ backgroundColor: form.primaryColor, color: form.backgroundColor }}
                      >
                        {form.clientName || "Client Name"}
                      </div>
                    )}
                    {form.tagline && (
                      <span className="text-xs opacity-60">{form.tagline}</span>
                    )}
                  </div>
                  <div
                    className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: `${form.accentColor}20`, color: form.accentColor }}
                  >
                    Waiting Room
                  </div>
                </div>

                {/* Preview Body */}
                <div className="px-6 py-8 text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: `${form.primaryColor}20`, color: form.primaryColor }}
                  >
                    JD
                  </div>
                  <h2 className="text-lg font-bold mb-1">Welcome, John Doe</h2>
                  <p className="text-sm opacity-60 mb-6">BlackRock Asset Management</p>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                    style={{ backgroundColor: `${form.accentColor}20`, color: form.accentColor, border: `1px solid ${form.accentColor}40` }}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: form.accentColor }} />
                    You are next — please stand by
                  </div>
                  <div className="text-sm opacity-50 mb-8">Your meeting begins at 10:30 AM</div>
                  <button
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: form.primaryColor, color: form.backgroundColor }}
                    disabled
                  >
                    Join Meeting (Not Yet Available)
                  </button>
                </div>

                {/* Preview Footer */}
                <div
                  className="px-6 py-3 border-t text-center text-xs opacity-40"
                  style={{ borderColor: `${form.primaryColor}20` }}
                >
                  {form.footerText || "Confidential — For Authorised Investors Only"}
                  {form.showChorusWatermark && (
                    <span className="ml-2">· Powered by CuraLive</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
