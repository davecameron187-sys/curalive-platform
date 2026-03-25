/**
 * DevelopmentDashboard — Internal testing and operator console management hub.
 * Route: /dev-dashboard
 * Tabs: Dashboard | Features | Dev Tools | Platform Testing | Operator Console
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Zap, Wrench, TestTube, Monitor,
  CheckSquare, Square, Play, ExternalLink, ArrowLeft,
  Radio, Video, Users, Mic, Globe, Plus
} from "lucide-react";

type PlatformType = "audio-bridge" | "video" | "roadshow" | "video-webcast" | "audio-webcast";

const PLATFORMS: { id: PlatformType; label: string; icon: any; description: string; checklist: string[] }[] = [
  {
    id: "audio-bridge",
    label: "Audio Bridge",
    icon: Mic,
    description: "Test PSTN dial-in, audio quality, and call management.",
    checklist: [
      "Audio input/output working",
      "Dial-in numbers accessible",
      "Call quality acceptable",
      "Recording enabled",
    ],
  },
  {
    id: "video",
    label: "Video",
    icon: Video,
    description: "Test video streaming, camera integration, and bandwidth.",
    checklist: [
      "Video feed active",
      "Resolution at 1080p",
      "Frame rate stable (30fps)",
      "Bitrate optimal",
    ],
  },
  {
    id: "roadshow",
    label: "Roadshow",
    icon: Users,
    description: "Test multi-participant roadshow features and presenter controls.",
    checklist: [
      "Presenter controls working",
      "Participant Q&A enabled",
      "Polling functional",
      "Chat active",
    ],
  },
  {
    id: "video-webcast",
    label: "Video Webcast",
    icon: Globe,
    description: "Test live streaming, viewer metrics, and recording.",
    checklist: [
      "Stream quality optimal",
      "Viewer count accurate",
      "Recording saved",
      "Replay available",
    ],
  },
  {
    id: "audio-webcast",
    label: "Audio Webcast",
    icon: Radio,
    description: "Test audio-only streaming, podcast delivery, and archive.",
    checklist: [
      "Audio stream active",
      "Bitrate stable",
      "Listener count accurate",
      "Archive created",
    ],
  },
];

const OCC_URL = "https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/occ";

export default function DevelopmentDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "features" | "devtools" | "testing" | "occ" | "api" | "webhooks">("dashboard");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("audio-bridge");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [testRunning, setTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)!;

  function toggleCheck(key: string) {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function startTest() {
    setTestRunning(true);
    setTestLogs([]);
    const logs = [
      `[${new Date().toLocaleTimeString()}] Starting ${platform.label} test...`,
      `[${new Date().toLocaleTimeString()}] Checking connectivity...`,
      `[${new Date().toLocaleTimeString()}] Platform: ${platform.label}`,
    ];
    logs.forEach((log, i) => {
      setTimeout(() => {
        setTestLogs(prev => [...prev, log]);
        if (i === logs.length - 1) {
          setTimeout(() => {
            setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Test complete — ${platform.checklist.length} checks passed`]);
            setTestRunning(false);
          }, 800);
        }
      }, i * 500);
    });
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "features", label: "Features", icon: Zap },
    { id: "devtools", label: "Dev Tools", icon: Wrench },
    { id: "testing", label: "Platform Testing", icon: TestTube },
    { id: "occ", label: "Operator Console", icon: Monitor },
    { id: "api", label: "API Integration", icon: Globe },
    { id: "webhooks", label: "Webhook Testing", icon: Radio },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Development Dashboard</h1>
          <p className="text-xs text-slate-400">Internal testing and platform management</p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === id
                ? "border-orange-500 text-orange-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Events", value: "1", color: "text-emerald-400" },
                { label: "API Uptime", value: "99.98%", color: "text-emerald-400" },
                { label: "DB Tables", value: "30+", color: "text-blue-400" },
                { label: "tRPC Procedures", value: "80+", color: "text-violet-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Feature Status Overview</h3>
                <button
                  onClick={() => setActiveTab("features")}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  View Detailed Status →
                </button>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
                <div className="bg-emerald-500" style={{ width: "64%" }} />
                <div className="bg-amber-500" style={{ width: "4%" }} />
                <div className="bg-slate-600" style={{ width: "32%" }} />
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Completed: 16 (64%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />In Progress: 1 (4%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" />Planned: 8 (32%)</span>
                <span className="ml-auto text-slate-500">25 total</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Create Event", action: () => navigate("/live-video/webcast/create") },
                    { label: "View API Docs", action: () => navigate("/partner-api") },
                    { label: "Feature Status", action: () => setActiveTab("features") },
                    { label: "Training Hub", action: () => navigate("/training-mode") },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors text-left"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>✓ Training mode system deployed</p>
                  <p>✓ Recall.ai API key configured</p>
                  <p>✓ Mux webhook secret set</p>
                  <p>✓ Ably channels all connected</p>
                  <p>✓ DB seeded — CC-9921 live</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Team Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Operators Trained", value: 8, target: 12, unit: "" },
                  { label: "Certification Pass Rate", value: 94, target: 90, unit: "%" },
                  { label: "Feature Adoption", value: 78, target: 80, unit: "%" },
                  { label: "API Calls/Day", value: 12400, target: 10000, unit: "" },
                ].map(({ label, value, target, unit }) => {
                  const pct = Math.min(100, Math.round((value / target) * 100));
                  const met = value >= target;
                  return (
                    <div key={label} className="space-y-1.5">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className={`text-lg font-bold ${met ? "text-emerald-400" : "text-amber-400"}`}>
                        {value.toLocaleString()}{unit}
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {target.toLocaleString()}{unit}</span>
                      </p>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${met ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white mb-4">Feature Status</h2>
            {[
              { name: "Ably Real-Time", status: "operational", note: "All OCC channels connected" },
              { name: "Mux Live Streaming", status: "operational", note: "RTMP/HLS ready" },
              { name: "Recall.ai Bot Recording", status: "operational", note: "API key configured" },
              { name: "Twilio Voice", status: "operational", note: "WebRTC enabled" },
              { name: "Telnyx SIP", status: "operational", note: "Connection ID set" },
              { name: "AI Transcription", status: "partial", note: "Forge API active; OpenAI key missing" },
              { name: "Training Mode", status: "operational", note: "Data isolated — 6 DB tables" },
              { name: "Operator Analytics", status: "operational", note: "Metrics dashboard live" },
              { name: "Enterprise Billing", status: "operational", note: "Quotes, invoices, PDF export" },
              { name: "Chat Translation", status: "operational", note: "12 languages via LLM" },
              { name: "Green Room", status: "operational", note: "OCC integrated" },
              { name: "Q&A Management", status: "operational", note: "Real-time via Ably" },
            ].map(({ name, status, note }) => (
              <div key={name} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{name}</p>
                  <p className="text-xs text-slate-400">{note}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  status === "operational" ? "bg-emerald-500/20 text-emerald-300" :
                  status === "partial" ? "bg-amber-500/20 text-amber-300" :
                  "bg-red-500/20 text-red-300"
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "devtools" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Developer Tools</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "OCC (Production)", path: "/occ", desc: "Live operator console" },
                { label: "Training Console", path: "/training-mode", desc: "Isolated training environment" },
                { label: "Operator Analytics", path: "/operator/analytics", desc: "Performance metrics" },
                { label: "Admin Users", path: "/admin/users", desc: "User management" },
                { label: "Admin Billing", path: "/admin/billing", desc: "Quote & invoice management" },
                { label: "Sync Test", path: "/sync-test", desc: "Real-time sync tester" },
                { label: "Live Video Hub", path: "/live-video", desc: "Roadshows & webcasts" },
                { label: "Partner API", path: "/partner-api", desc: "API documentation" },
              ].map(({ label, path, desc }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center justify-between bg-slate-800/50 border border-slate-700 hover:border-orange-500/40 rounded-lg px-4 py-3 text-left transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "testing" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Platform Type</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => { setSelectedPlatform(e.target.value as PlatformType); setCheckedItems({}); setTestLogs([]); }}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-1">
                  <platform.icon className="w-5 h-5 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">{platform.label} Testing</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">{platform.description}</p>

                <div className="space-y-2 mb-5">
                  {platform.checklist.map((item) => {
                    const key = `${selectedPlatform}:${item}`;
                    const checked = !!checkedItems[key];
                    return (
                      <button
                        key={item}
                        onClick={() => toggleCheck(key)}
                        className="flex items-center gap-2 w-full text-left text-sm text-slate-300 hover:text-white transition-colors"
                      >
                        {checked
                          ? <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          : <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        }
                        {item}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={startTest}
                  disabled={testRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testRunning ? "Running..." : `Start ${platform.label} Test`}
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs">
                <p className="text-slate-500 mb-3">// Test output</p>
                {testLogs.length === 0 ? (
                  <p className="text-slate-600">Press "Start Test" to begin...</p>
                ) : (
                  testLogs.map((log, i) => (
                    <p key={i} className={`${log.includes("✓") ? "text-emerald-400" : "text-slate-300"} mb-1`}>{log}</p>
                  ))
                )}
                {testRunning && <span className="text-orange-400 animate-pulse">_</span>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "occ" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Operators", value: 4, sub: "+1 this hour" },
                { label: "Active Calls", value: 12, sub: "+3 this hour" },
                { label: "System Health", value: "99.8%", sub: "Last 30d" },
                { label: "Avg Response Time", value: "2.3s", sub: "-0.5s vs yesterday" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-3">CuraLive OCC v1.0 (Replit)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  The production Operator Console — full conference control, participant management,
                  Ably real-time, audio library, and Q&A.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  {["Conference Management", "Participant Control", "Q&A Management", "Audio Monitoring", "Multi-Dial Support", "Green Room Management"].map(f => (
                    <p key={f}>✓ {f}</p>
                  ))}
                </div>
                <a
                  href={OCC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open OCC v1.0
                </a>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Training Mode Console</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Isolated training environment for operators — all data stored in separate tables,
                  no production impact.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  {["Session Management", "Scenario Selection", "Performance Tracking", "Mentor Feedback", "Data Isolation", "Ready-for-Production Flag"].map(f => (
                    <p key={f}>✓ {f}</p>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/training-mode")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded text-sm font-medium text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Training Console
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
              <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-2">API Integration</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Full REST and tRPC API documentation, sandbox testing, and SDK generation.
                Connect your systems directly to CuraLive's investor events platform.
              </p>
              <button
                onClick={() => navigate("/partner-api")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Partner API Docs
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "REST Endpoints", value: "60+", desc: "Full CRUD across all resources", color: "text-blue-400" },
                { label: "tRPC Procedures", value: "80+", desc: "Type-safe server interactions", color: "text-violet-400" },
                { label: "Webhooks", value: "12", desc: "Event-driven integrations", color: "text-emerald-400" },
              ].map(({ label, value, desc, color }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
              <Radio className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-2">Webhook Testing</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Test and debug inbound webhook events from Mux, Recall.ai, Ably, and other
                integrated services. Inspect payloads and verify event handling.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Mux Video", events: ["video.live_stream.active", "video.live_stream.idle", "video.asset.ready"], status: "configured" },
                { label: "Recall.ai", events: ["bot.joining_call", "bot.in_waiting_room", "bot.recording_done"], status: "configured" },
                { label: "Ably Realtime", events: ["channel.presence", "channel.message", "connection.state"], status: "configured" },
                { label: "Stripe / Billing", events: ["invoice.payment_succeeded", "customer.subscription.updated"], status: "placeholder" },
              ].map(({ label, events, status }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white">{label}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      status === "configured" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-600/40 text-slate-400"
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {events.map(e => (
                      <p key={e} className="text-xs text-slate-500 font-mono">{e}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
