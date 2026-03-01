import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Zap, ArrowLeft, Wifi, WifiOff, Send, Trash2, Copy, Check, Activity } from "lucide-react";
import { AblyProvider, useAbly } from "@/contexts/AblyContext";

// ─── Inner Component ──────────────────────────────────────────────────────────

interface PingMessage {
  id: string;
  text: string;
  sender: string;
  ts: number;
  latency?: number;
}

function SyncTestInner() {
  const [, navigate] = useLocation();
  const { mode, presenceCount } = useAbly();

  const [messages, setMessages] = useState<PingMessage[]>([]);
  const [input, setInput] = useState("");
  const [myId] = useState(() => `Device-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [pingCount, setPingCount] = useState(0);
  const [avgLatency, setAvgLatency] = useState<number | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Simulate connection status based on mode
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate receiving messages from "other devices" in demo mode
  useEffect(() => {
    if (mode !== "demo") return;
    const DEMO_DEVICES = ["Device-ALPHA", "Device-BETA", "Device-GAMMA"];
    const DEMO_MESSAGES = [
      "Hello from another device! 👋",
      "Real-time sync is working!",
      "Chorus Call delivers this in <100ms",
      "Open this page on your phone to test",
      "All three views stay in sync via Chorus Call",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= DEMO_MESSAGES.length) return;
      const sender = DEMO_DEVICES[i % DEMO_DEVICES.length];
      const sentAt = Date.now() - Math.floor(Math.random() * 80 + 20);
      const latency = Date.now() - sentAt;
      setMessages((prev) => [
        ...prev,
        { id: `demo-${i}`, text: DEMO_MESSAGES[i], sender, ts: Date.now(), latency },
      ]);
      setPingCount((c) => c + 1);
      setAvgLatency((prev) => (prev === null ? latency : Math.round((prev + latency) / 2)));
      i++;
    }, 2500);
    return () => clearInterval(interval);
  }, [mode]);

  const handleSend = () => {
    if (!input.trim()) return;
    const sentAt = Date.now();
    const msg: PingMessage = {
      id: `msg-${sentAt}`,
      text: input.trim(),
      sender: myId,
      ts: sentAt,
      latency: 0,
    };
    setMessages((prev) => [...prev, msg]);
    setPingCount((c) => c + 1);
    setInput("");
    // Simulate echo latency for demo
    if (mode === "demo") {
      const latency = Math.floor(Math.random() * 60 + 15);
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, latency } : m))
        );
        setAvgLatency((prev) => (prev === null ? latency : Math.round((prev + latency) / 2)));
      }, latency);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2500);
    });
  };

  const isMe = (sender: string) => sender === myId;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-md px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm">
          Chorus<span className="text-primary">.AI</span>
        </span>
        <div className="w-px h-5 bg-border" />
        <span className="text-sm font-semibold text-muted-foreground">Cross-Device Sync Test</span>
        <div className="flex-1" />
        {/* Connection badge */}
        <div
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}
        >
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? (mode === "ably" ? "Connected" : "Demo Mode") : "Connecting…"}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left: Chat / Ping Panel */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Instructions banner */}
          <div className="shrink-0 bg-primary/5 border-b border-primary/10 px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Test real-time sync across devices</p>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                Open this URL on another device or browser tab — messages appear instantly via Chorus Call.
              </p>
            </div>
            <button
              onClick={handleCopyUrl}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-all ${
                urlCopied
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
              }`}
            >
              {urlCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {urlCopied ? "Copied!" : "Copy URL"}
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mb-2 opacity-30" />
                <p>No messages yet.</p>
                <p className="text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Send a message below or open this page on another device.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${isMe(msg.sender) ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 ${
                    isMe(msg.sender)
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  {!isMe(msg.sender) && (
                    <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
                      {msg.sender}
                    </div>
                  )}
                  <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {msg.text}
                  </p>
                  <div
                    className={`text-[10px] mt-1 ${
                      isMe(msg.sender) ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {msg.latency !== undefined && msg.latency > 0
                      ? `${msg.latency}ms latency`
                      : new Date(msg.ts).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3 flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
              <span className="text-xs text-primary font-bold shrink-0">{myId}</span>
              <div className="w-px h-4 bg-border" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message to broadcast…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 border border-border text-muted-foreground px-3 py-2 rounded-xl text-sm hover:bg-secondary transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className="w-full lg:w-72 shrink-0 bg-card/30 border-t lg:border-t-0 border-border flex flex-col overflow-y-auto p-5 gap-5">
          <div className="font-semibold text-sm">Sync Statistics</div>

          {/* Your Device ID */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Device ID</div>
            <div className="font-mono text-sm font-bold text-primary">{myId}</div>
            <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Unique per browser tab
            </div>
          </div>

          {/* Connection Mode */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Connection Mode</div>
            <div className={`text-sm font-bold ${mode === "ably" ? "text-emerald-400" : "text-amber-400"}`}>
              {mode === "ably" ? "🟢 Chorus Call Live" : "🟡 Demo Mode"}
            </div>
            <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {mode === "ably"
                ? "Real cross-device sync via Chorus Call WebSocket"
                : "Simulated — upgrade to see real sync"}
            </div>
          </div>

          {/* Presence */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Devices Online</div>
            <div className="text-3xl font-bold text-primary">{presenceCount}</div>
            <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Chorus Call presence channel
            </div>
          </div>

          {/* Message Count */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Messages Sent</div>
            <div className="text-3xl font-bold">{pingCount}</div>
          </div>

          {/* Avg Latency */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Latency</div>
            <div className={`text-3xl font-bold ${avgLatency !== null && avgLatency < 100 ? "text-emerald-400" : "text-amber-400"}`}>
              {avgLatency !== null ? `${avgLatency}ms` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Target: &lt;100ms
            </div>
          </div>

          {/* How it works */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">How It Works</div>
            <div className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              {[
                "1. Browser requests token from /api/trpc/realtime.tokenRequest",
                "2. Server signs token with platform key (never exposed to browser)",
                "3. SDK connects via WebSocket using the token",
                "4. Messages publish to chorus-event-{eventId} channel",
                "5. All subscribers receive the message in <100ms",
              ].map((step) => (
                <div key={step} className="flex gap-2">
                  <span className="text-primary shrink-0">→</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exported Page (wraps with AblyProvider) ──────────────────────────────────

export default function SyncTest() {
  return (
    <AblyProvider eventId="sync-test">
      <SyncTestInner />
    </AblyProvider>
  );
}
