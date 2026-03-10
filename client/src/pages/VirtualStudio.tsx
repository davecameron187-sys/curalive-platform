import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Monitor, User, Globe, Shield, Play, Settings,
  AlertTriangle, CheckCircle2, X, ChevronDown, Layers, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AVATAR_STYLES = [
  { id: "professional", label: "Professional", desc: "Clean, corporate look", icon: "👔" },
  { id: "executive", label: "Executive", desc: "Senior leadership presence", icon: "🏛️" },
  { id: "animated", label: "Animated AI", desc: "Digital avatar with expressions", icon: "🤖" },
  { id: "minimal", label: "Minimal", desc: "Focus on content, not presenter", icon: "◻️" },
];

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "pt", label: "Portuguese" }, { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" }, { code: "ar", label: "Arabic" }, { code: "hi", label: "Hindi" },
  { code: "ko", label: "Korean" }, { code: "it", label: "Italian" }, { code: "nl", label: "Dutch" },
];

const BUNDLES = [
  { id: "A", label: "Investor Relations", color: "#3b82f6" },
  { id: "B", label: "Compliance & Risk", color: "#ef4444" },
  { id: "C", label: "Operations", color: "#10b981" },
  { id: "D", label: "Content Marketing", color: "#f59e0b" },
  { id: "E", label: "Premium", color: "#8b5cf6" },
  { id: "F", label: "Social Amplification", color: "#ec4899" },
];

const OVERLAY_OPTIONS = [
  { id: "sentiment-gauge", label: "Sentiment Gauge", desc: "Live investor mood" },
  { id: "engagement-bar", label: "Engagement Bar", desc: "Real-time viewer engagement" },
  { id: "compliance-indicator", label: "Compliance Light", desc: "Green/amber/red compliance signal" },
  { id: "investor-ticker", label: "Investor Ticker", desc: "Key stats scrolling at bottom" },
  { id: "social-ticker", label: "Social Ticker", desc: "Live social reaction count" },
  { id: "ai-insights", label: "AI Insights Panel", desc: "AI suggestions for presenter" },
];

type Tab = "config" | "languages" | "esg" | "overlays" | "replay";

export default function VirtualStudio() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [eventId, setEventId] = useState("demo-event-001");
  const [bundleId, setBundleId] = useState("A");
  const [avatarStyle, setAvatarStyle] = useState("professional");
  const [primaryLang, setPrimaryLang] = useState("en");
  const [dubbingLangs, setDubbingLangs] = useState<string[]>(["es", "fr"]);
  const [esgEnabled, setEsgEnabled] = useState(false);
  const [replayEnabled, setReplayEnabled] = useState(true);
  const [replayQuality, setReplayQuality] = useState<"720p" | "1080p" | "4k">("1080p");
  const [activeOverlays, setActiveOverlays] = useState<string[]>(["sentiment-gauge", "engagement-bar"]);
  const [studioId, setStudioId] = useState<number | null>(null);

  const createStudio = trpc.virtualStudio.createStudio.useMutation({
    onSuccess: (data) => {
      setStudioId(data.studio?.id ?? null);
      toast.success("Virtual Studio configured!");
    },
    onError: () => toast.error("Failed to create studio"),
  });

  const toggleESG = trpc.virtualStudio.toggleESG.useMutation({
    onSuccess: (d) => {
      setEsgEnabled(d.esgEnabled);
      toast.success(`ESG flagging ${d.esgEnabled ? "enabled" : "disabled"}`);
    },
  });

  const updateLang = trpc.virtualStudio.updateLanguageConfig.useMutation({
    onSuccess: () => toast.success("Language settings saved"),
  });

  const generateReplay = trpc.virtualStudio.generateReplay.useMutation({
    onSuccess: (d) => toast.success(`Replay queued — est. ${d.replayConfig.estimatedProcessingMinutes} min`),
  });

  const { data: esgData } = trpc.virtualStudio.getESGFlags.useQuery(
    { studioId: studioId! },
    { enabled: studioId !== null && esgEnabled }
  );

  const resolveFlag = trpc.virtualStudio.resolveESGFlag.useMutation({
    onSuccess: () => toast.success("Flag resolved"),
  });

  const toggleDubbingLang = (code: string) => {
    setDubbingLangs(prev => prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]);
  };

  const toggleOverlay = (id: string) => {
    setActiveOverlays(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  };

  const selectedBundle = BUNDLES.find(b => b.id === bundleId);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "config", label: "Studio Config", icon: Settings },
    { id: "languages", label: "Languages", icon: Globe },
    { id: "overlays", label: "Overlays", icon: Layers },
    { id: "esg", label: "ESG Flags", icon: Shield },
    { id: "replay", label: "Replay", icon: Play },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-violet-400" /> Virtual Studio
            </h1>
            <p className="text-xs text-slate-400">Bundle-customised broadcast environment</p>
          </div>
        </div>
        <button
          onClick={() => createStudio.mutate({ eventId, bundleId, avatarStyle, primaryLanguage: primaryLang })}
          className="text-xs px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors font-medium"
        >
          {createStudio.isPending ? "Saving…" : "Save Studio"}
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-3 md:col-span-1">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Event ID</label>
              <input
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="event-id"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Bundle</label>
              <div className="space-y-1.5">
                {BUNDLES.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBundleId(b.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      bundleId === b.id ? "bg-slate-700 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="font-medium">{b.id}</span>
                    <span className="text-xs">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 aspect-video relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-dashed" style={{ borderColor: selectedBundle?.color ?? "#6366f1" }}>
                  <User className="w-10 h-10 text-slate-600" />
                </div>
              </div>
              {activeOverlays.includes("sentiment-gauge") && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-2 py-1.5">
                  <div className="text-[9px] text-slate-400">Sentiment</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-emerald-400 rounded-full" />
                    </div>
                    <span className="text-[9px] text-emerald-400">74%</span>
                  </div>
                </div>
              )}
              {activeOverlays.includes("engagement-bar") && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">Live</span>
                  <div className="flex gap-3 text-[9px] text-slate-300">
                    <span>👥 1,247 watching</span>
                    <span>❤️ 89%</span>
                    <span>💬 34 Q&As</span>
                  </div>
                  <span className="text-[9px]" style={{ color: selectedBundle?.color }}>● LIVE</span>
                </div>
              )}
              {activeOverlays.includes("compliance-indicator") && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-emerald-400 text-[10px]">✓</span>
                </div>
              )}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Studio Preview</div>
            </div>
            <div className="flex border-b border-slate-800">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 text-[10px] py-2 flex flex-col items-center gap-0.5 transition-colors ${
                    activeTab === t.id ? "text-white border-b-2" : "text-slate-500 hover:text-slate-300"
                  }`}
                  style={activeTab === t.id ? { borderColor: selectedBundle?.color } : {}}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "config" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 mb-3">Avatar Style</div>
                  <div className="grid grid-cols-2 gap-2">
                    {AVATAR_STYLES.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setAvatarStyle(a.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-colors border ${
                          avatarStyle === a.id
                            ? "border-current text-white"
                            : "border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                        style={avatarStyle === a.id ? { borderColor: selectedBundle?.color, backgroundColor: `${selectedBundle?.color}15` } : {}}
                      >
                        <span className="text-base">{a.icon}</span>
                        <div>
                          <div className="font-medium">{a.label}</div>
                          <div className="text-[10px] text-slate-500">{a.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "languages" && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">Primary Language</div>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.map(l => (
                        <button
                          key={l.code}
                          onClick={() => setPrimaryLang(l.code)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            primaryLang === l.code
                              ? "text-white border-current"
                              : "border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                          style={primaryLang === l.code ? { borderColor: selectedBundle?.color, backgroundColor: `${selectedBundle?.color}20` } : {}}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">AI Dubbing Languages ({dubbingLangs.length} selected)</div>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.filter(l => l.code !== primaryLang).map(l => (
                        <button
                          key={l.code}
                          onClick={() => toggleDubbingLang(l.code)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            dubbingLangs.includes(l.code)
                              ? "text-white border-current"
                              : "border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                          style={dubbingLangs.includes(l.code) ? { borderColor: selectedBundle?.color, backgroundColor: `${selectedBundle?.color}20` } : {}}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => updateLang.mutate({ eventId, primaryLanguage: primaryLang, dubbingLanguages: dubbingLangs })}
                    className="w-full text-sm py-2 rounded-xl text-white font-medium transition-colors"
                    style={{ backgroundColor: selectedBundle?.color }}
                  >
                    {updateLang.isPending ? "Saving…" : "Save Language Settings"}
                  </button>
                </div>
              )}

              {activeTab === "overlays" && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 mb-3">Data Overlays</div>
                  {OVERLAY_OPTIONS.map(o => (
                    <div key={o.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-white">{o.label}</div>
                        <div className="text-[10px] text-slate-500">{o.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleOverlay(o.id)}
                        className={`w-8 h-4 rounded-full transition-all ${activeOverlays.includes(o.id) ? "bg-indigo-500" : "bg-slate-700"}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white mx-0.5 transition-transform ${activeOverlays.includes(o.id) ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "esg" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">ESG Content Monitoring</div>
                      <div className="text-[10px] text-slate-500">AI flags greenwashing, governance issues, discriminatory language</div>
                    </div>
                    <button
                      onClick={() => toggleESG.mutate({ eventId, enabled: !esgEnabled })}
                      className={`w-10 h-5 rounded-full transition-all ${esgEnabled ? "bg-emerald-500" : "bg-slate-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${esgEnabled ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  {esgEnabled && esgData && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Open Flags", value: esgData.open, color: "text-red-400" },
                          { label: "Resolved", value: esgData.resolved, color: "text-emerald-400" },
                          { label: "Total", value: esgData.totalFlags, color: "text-slate-300" },
                        ].map(m => (
                          <div key={m.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                            <div className="text-[10px] text-slate-500">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {esgData.flags.filter((f: any) => !f.resolvedAt).map((flag: any) => (
                        <div key={flag.id} className="flex items-start gap-2 bg-slate-800/40 rounded-lg px-3 py-2">
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${flag.severity === "high" ? "text-red-400" : flag.severity === "medium" ? "text-amber-400" : "text-slate-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white">{flag.flagType}</div>
                            <div className="text-[10px] text-slate-400 truncate">{flag.description}</div>
                          </div>
                          <button onClick={() => resolveFlag.mutate({ flagId: flag.id })} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex-shrink-0">
                            Resolve
                          </button>
                        </div>
                      ))}
                      {esgData.flags.filter((f: any) => !f.resolvedAt).length === 0 && (
                        <div className="text-center py-4">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                          <div className="text-xs text-emerald-400">No open ESG flags</div>
                        </div>
                      )}
                    </div>
                  )}

                  {esgEnabled && !studioId && (
                    <div className="text-center py-6 text-xs text-slate-500">Save your studio first to enable ESG monitoring</div>
                  )}

                  {!esgEnabled && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
                      Enable ESG monitoring to automatically flag content that may compromise your ESG reporting or governance standards.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "replay" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">Replay Generation</div>
                      <div className="text-[10px] text-slate-500">Automatically generate post-event replay with overlays & subtitles</div>
                    </div>
                    <button
                      onClick={() => setReplayEnabled(!replayEnabled)}
                      className={`w-10 h-5 rounded-full transition-all ${replayEnabled ? "bg-violet-500" : "bg-slate-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${replayEnabled ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  {replayEnabled && (
                    <>
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-2">Quality</div>
                        <div className="flex gap-2">
                          {(["720p", "1080p", "4k"] as const).map(q => (
                            <button
                              key={q}
                              onClick={() => setReplayQuality(q)}
                              className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                                replayQuality === q ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => generateReplay.mutate({ eventId, quality: replayQuality, includeOverlays: true, includeSubtitles: dubbingLangs.length > 0 })}
                        className="w-full text-sm py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {generateReplay.isPending ? "Queueing…" : "Generate Replay"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Bundle Interconnection Overlays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-400 mb-3">
              Bundle <strong className="text-white">{bundleId}</strong> ({selectedBundle?.label}) includes these pre-configured data overlays for your studio.
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              {OVERLAY_OPTIONS.filter(o => activeOverlays.includes(o.id)).map(o => (
                <div key={o.id} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedBundle?.color }} />
                  <div>
                    <div className="text-xs font-medium text-white">{o.label}</div>
                    <div className="text-[10px] text-slate-500">{o.desc}</div>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />
                </div>
              ))}
              {OVERLAY_OPTIONS.filter(o => !activeOverlays.includes(o.id)).map(o => (
                <div key={o.id} className="flex items-center gap-2 bg-slate-800/20 rounded-lg px-3 py-2 opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-400">{o.label}</div>
                    <div className="text-[10px] text-slate-600">{o.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
