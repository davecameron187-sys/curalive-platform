import { useState } from "react";
import { useLocation } from "wouter";
import { Zap, ArrowLeft, Copy, CheckCheck, Key, Webhook, Shield, Code2 } from "lucide-react";

const WEBHOOK_EVENTS = [
  { event: "transcript.segment", payload: `{ "text": "Our Q4 revenue came in at $47.2 million...", "speaker": "Sarah Chen (CFO)", "language": "en", "timestamp": 1709280000, "eventId": "q4-earnings-2026" }`, when: "Every ~3 seconds during live event" },
  { event: "sentiment.update", payload: `{ "score": 84, "label": "Positive", "eventId": "q4-earnings-2026" }`, when: "Every 30 seconds" },
  { event: "qa.question_submitted", payload: `{ "question": "Can you provide detail on Q4 revenue?", "submittedBy": "Goldman Sachs", "priority": "high", "votes": 47, "eventId": "q4-earnings-2026" }`, when: "On each Q&A submission" },
  { event: "event.started", payload: `{ "eventId": "q4-earnings-2026", "title": "Q4 2025 Earnings Call", "startedAt": "2026-03-01T14:00:00Z" }`, when: "When host starts event" },
  { event: "event.ended", payload: `{ "eventId": "q4-earnings-2026", "endedAt": "2026-03-01T14:18:32Z" }`, when: "When host ends event" },
  { event: "event.summary_ready", payload: `{ "summaryUrl": "https://chorus.ai/api/events/q4-earnings-2026/summary", "eventId": "q4-earnings-2026" }`, when: "~30s after event ends" },
];

const REST_ENDPOINTS = [
  { method: "GET", path: "/api/events/{eventId}", desc: "Get event metadata and status" },
  { method: "GET", path: "/api/events/{eventId}/transcript", desc: "Full transcript (post-event)" },
  { method: "GET", path: "/api/events/{eventId}/summary", desc: "AI-generated executive summary" },
  { method: "GET", path: "/api/events/{eventId}/sentiment", desc: "Sentiment timeline data" },
  { method: "GET", path: "/api/events/{eventId}/qa", desc: "All Q&A submissions" },
  { method: "POST", path: "/api/partners/register", desc: "Register a partner webhook URL" },
  { method: "DELETE", path: "/api/partners/{partnerId}", desc: "Remove partner registration" },
];

const VERIFICATION_CODE = `// Verify Chorus.AI webhook signature (Node.js)
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expected}\`)
  );
}

// In your Express webhook handler:
app.post('/webhook/chorus', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-chorus-signature'] as string;
  const isValid = verifyWebhookSignature(
    req.body.toString(),
    signature,
    process.env.CHORUS_WEBHOOK_SECRET!
  );
  if (!isValid) return res.status(401).send('Invalid signature');
  
  const { event, data } = JSON.parse(req.body.toString());
  // Handle event...
  res.sendStatus(200);
});`;

export default function PartnerAPI() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState(WEBHOOK_EVENTS[0].event);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeEventData = WEBHOOK_EVENTS.find((e) => e.event === activeEvent)!;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">Chorus<span className="text-primary">.AI</span></span>
          <span className="text-muted-foreground text-sm">/ Partner API</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Open Partner API</h1>
          <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Any platform can push events to Chorus.AI or receive real-time event data via webhooks. Register a webhook URL and receive signed payloads for every event in your system.
          </p>
        </div>

        {/* Auth */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <span className="font-bold">Authentication</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">API Key Header</div>
              <div className="bg-background border border-border rounded-lg px-3 py-2 font-mono text-muted-foreground flex items-center justify-between">
                <span>Authorization: Bearer ck_live_••••••••••••</span>
                <button onClick={() => handleCopy("Authorization: Bearer ck_live_your_api_key", "auth")} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                  {copied === "auth" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Base URL</div>
              <div className="bg-background border border-border rounded-lg px-3 py-2 font-mono text-muted-foreground flex items-center justify-between">
                <span>https://api.chorus.ai/v1</span>
                <button onClick={() => handleCopy("https://api.chorus.ai/v1", "base")} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                  {copied === "base" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Events */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <span className="font-bold">Webhook Events</span>
          </div>
          <div className="grid md:grid-cols-3">
            {/* Event List */}
            <div className="border-r border-border">
              {WEBHOOK_EVENTS.map((e) => (
                <button
                  key={e.event}
                  onClick={() => setActiveEvent(e.event)}
                  className={`w-full text-left px-5 py-3 border-b border-border/50 text-sm transition-colors ${activeEvent === e.event ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                >
                  <div className="font-mono text-xs">{e.event}</div>
                  <div className="text-[10px] mt-0.5 opacity-70" style={{ fontFamily: "'Inter', sans-serif" }}>{e.when}</div>
                </button>
              ))}
            </div>
            {/* Payload */}
            <div className="md:col-span-2 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm text-primary">{activeEventData.event}</div>
                <button onClick={() => handleCopy(activeEventData.payload, "payload")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {copied === "payload" ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{activeEventData.when}</div>
              <pre className="bg-background border border-border rounded-xl p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {JSON.stringify(JSON.parse(activeEventData.payload), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Signature Verification */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold">Signature Verification</span>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              All webhook requests are signed with HMAC-SHA256 using your partner secret. Verify the <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">X-Chorus-Signature</code> header on every request.
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5" /> Node.js Verification
              </div>
              <button onClick={() => handleCopy(VERIFICATION_CODE, "verify")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied === "verify" ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <pre className="bg-background border border-border rounded-xl p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {VERIFICATION_CODE}
            </pre>
          </div>
        </div>

        {/* REST Endpoints */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border font-bold">REST API Endpoints</div>
          <div className="divide-y divide-border/50">
            {REST_ENDPOINTS.map(({ method, path, desc }) => (
              <div key={path} className="flex items-center gap-4 px-6 py-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${method === "GET" ? "bg-emerald-500/10 text-emerald-400" : method === "POST" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"}`}>
                  {method}
                </span>
                <span className="font-mono text-xs text-muted-foreground flex-1">{path}</span>
                <span className="text-xs text-muted-foreground hidden md:block" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
