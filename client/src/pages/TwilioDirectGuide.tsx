/**
 * TwilioDirectGuide.tsx
 * Step-by-step setup guide for connecting a Twilio phone number to the
 * CuraLive Direct IVR (auto-admit via PIN).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, CheckCircle2, Copy, CheckCheck, Phone, KeyRound,
  ShieldCheck, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  Zap, Globe, Settings, BookOpen
} from "lucide-react";
import { toast } from "sonner";

function CodeBlock({ code, language = "text" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg bg-[#0a0f1e] border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/60 border-b border-slate-700">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function StepCard({
  number, title, children, done = false
}: { number: number; title: string; children: React.ReactNode; done?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-xl border transition-colors ${done ? "border-emerald-700/40 bg-emerald-900/10" : "border-slate-700 bg-[#111827]"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-300"}`}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : number}
        </div>
        <span className="font-semibold text-sm text-slate-100 flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 text-sm text-slate-300 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

const WEBHOOK_URL_PLACEHOLDER = "https://curalive-mdu4k2ib.manus.space/api/voice/inbound";
const PIN_WEBHOOK_URL_PLACEHOLDER = "https://curalive-mdu4k2ib.manus.space/api/voice/pin";

const TWIML_INBOUND = `<?xml version="1.0" encoding="UTF-8"?>
<!-- This TwiML is generated dynamically by /api/voice/inbound -->
<!-- It is shown here for reference only. -->
<Response>
  <Gather action="/api/voice/pin" method="POST" numDigits="5" timeout="10">
    <Say voice="Polly.Joanna">
      Welcome to CuraLive. Please enter your 5-digit CuraLive Direct PIN,
      followed by the hash key. If you do not have a PIN, press zero.
    </Say>
  </Gather>
  <Redirect>/api/voice/inbound</Redirect>
</Response>`;

const TWIML_PIN_ADMIT = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated when PIN matches and auto-admit is ON -->
<Response>
  <Say voice="Polly.Joanna">PIN accepted. Connecting you now.</Say>
  <Dial>
    <Conference>q4-earnings-2026</Conference>
  </Dial>
</Response>`;

export default function TwilioDirectGuide() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#080d1a] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#080d1a]/90 backdrop-blur-md">
        <div className="container flex items-center gap-4 h-14">
          <button
            onClick={() => navigate("/integrations")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Integrations
          </button>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">CuraLive Direct — Twilio Setup</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded bg-violet-900/40 text-violet-300 border border-violet-700/40">
              IVR Guide
            </span>
          </div>
        </div>
      </header>

      <div className="container py-10 max-w-3xl">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-700/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">CuraLive Direct — Twilio Configuration</h1>
              <p className="text-sm text-slate-400 mt-0.5">Connect a Twilio phone number to the PIN-based auto-admit IVR</p>
            </div>
          </div>
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-violet-300">How it works:</strong> Registered attendees receive a unique 5-digit PIN in their confirmation email.
              When they dial your Twilio number, the IVR prompts them to enter the PIN. If the PIN is valid and
              <em> CuraLive Direct</em> is enabled on the conference, the caller is auto-connected to the bridge — no operator needed.
            </div>
          </div>
        </div>

        {/* Architecture diagram (text) */}
        <div className="mb-8 rounded-xl border border-slate-700 bg-[#0d1526] p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Call Flow
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-slate-300">
            {[
              { label: "Caller dials", color: "bg-slate-700" },
              { label: "→" },
              { label: "Twilio", color: "bg-blue-900/50 border border-blue-700/40 text-blue-300" },
              { label: "→" },
              { label: "POST /api/voice/inbound", color: "bg-violet-900/40 border border-violet-700/40 text-violet-300" },
              { label: "→" },
              { label: "IVR: Enter PIN", color: "bg-slate-700" },
              { label: "→" },
              { label: "POST /api/voice/pin", color: "bg-violet-900/40 border border-violet-700/40 text-violet-300" },
              { label: "→" },
              { label: "PIN valid?", color: "bg-slate-700" },
            ].map((item, i) => (
              item.label === "→"
                ? <span key={i} className="text-slate-600 font-bold">→</span>
                : <span key={i} className={`px-2 py-1 rounded ${item.color ?? ""}`}>{item.label}</span>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Valid PIN + Auto-Admit ON → Bridge</div>
            <div className="flex items-center gap-1.5 text-amber-400"><AlertTriangle className="w-3.5 h-3.5" /> Valid PIN + Auto-Admit OFF → Operator queue</div>
            <div className="flex items-center gap-1.5 text-red-400"><AlertTriangle className="w-3.5 h-3.5" /> Invalid PIN → Retry / Operator queue</div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <StepCard number={1} title="Create or locate a Twilio phone number">
            <p>Log in to the <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-1">Twilio Console <ExternalLink className="w-3 h-3" /></a> and navigate to <strong>Phone Numbers → Manage → Active Numbers</strong>.</p>
            <p>If you do not have a number, click <strong>Buy a number</strong>. For South Africa, search for <code className="bg-slate-800 px-1 rounded text-violet-300">+27</code> numbers with Voice capability. A local Johannesburg number costs approximately $1/month.</p>
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 flex gap-2 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Ensure the number has <strong>Voice</strong> capability enabled. SMS-only numbers will not work.</span>
            </div>
          </StepCard>

          <StepCard number={2} title="Configure the Voice URL on your Twilio number">
            <p>In the Twilio Console, open your phone number's configuration page. Under <strong>Voice Configuration → A call comes in</strong>, set:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li><strong>Configure with:</strong> Webhook</li>
              <li><strong>URL:</strong></li>
            </ul>
            <CodeBlock code={WEBHOOK_URL_PLACEHOLDER} language="Voice URL" />
            <ul className="list-disc list-inside space-y-1 text-slate-300 mt-2">
              <li><strong>HTTP Method:</strong> POST</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">Replace the domain above with your published Manus domain if you have configured a custom domain.</p>
          </StepCard>

          <StepCard number={3} title="Verify the PIN webhook endpoint">
            <p>The inbound webhook collects digits via Twilio's <code className="bg-slate-800 px-1 rounded text-violet-300">&lt;Gather&gt;</code> verb and posts them to the PIN validation endpoint. No additional Twilio configuration is required — this is handled automatically by the IVR TwiML response.</p>
            <p className="text-xs text-slate-400">For reference, the PIN endpoint is:</p>
            <CodeBlock code={PIN_WEBHOOK_URL_PLACEHOLDER} language="PIN Webhook (auto-configured)" />
          </StepCard>

          <StepCard number={4} title="Review the TwiML responses (reference)">
            <p>The server generates these TwiML responses dynamically. They are shown here for transparency and debugging.</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Inbound greeting (POST /api/voice/inbound)</p>
            <CodeBlock code={TWIML_INBOUND} language="TwiML" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 mt-3">Successful auto-admit (POST /api/voice/pin)</p>
            <CodeBlock code={TWIML_PIN_ADMIT} language="TwiML" />
          </StepCard>

          <StepCard number={5} title="Enable CuraLive Direct on a conference in the OCC">
            <p>Open the <strong>OCC</strong>, select a running conference, and click the <strong>CuraLive Direct</strong> tab in the Feature Bar at the bottom of the Conference Control Panel.</p>
            <p>Click <strong>Enable Auto-Admit</strong>. The status badge will turn violet. From this point, any registered attendee who calls your Twilio number and enters their PIN will be auto-connected to the bridge.</p>
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 flex gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>The CuraLive Direct tab also shows live stats (admitted, failed PINs, operator queue) and a real-time access log for every PIN attempt.</span>
            </div>
          </StepCard>

          <StepCard number={6} title="Test the end-to-end flow">
            <p>Register for a test event via <code className="bg-slate-800 px-1 rounded text-violet-300">/register/&lt;eventId&gt;</code>. You will receive a confirmation email containing your 5-digit CuraLive Direct PIN.</p>
            <p>Dial your Twilio number, enter the PIN when prompted, and verify you are connected to the conference bridge. Check the CuraLive Direct tab in the OCC — the attempt should appear in the access log with outcome <strong className="text-emerald-400">admitted</strong>.</p>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-slate-500">// Twilio test call (from Twilio Console → Phone Numbers → Test)</div>
              <div>1. Dial your Twilio number</div>
              <div>2. Listen for: <span className="text-violet-300">"Please enter your 5-digit CuraLive Direct PIN"</span></div>
              <div>3. Enter your PIN + # key</div>
              <div>4. Listen for: <span className="text-emerald-300">"PIN accepted. Connecting you now."</span></div>
            </div>
          </StepCard>
        </div>

        {/* Troubleshooting */}
        <div className="mt-10 rounded-xl border border-slate-700 bg-[#0d1526] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Troubleshooting</span>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            {[
              { q: "Caller hears silence or an error tone", a: "Check that the Voice URL is set to POST (not GET) and that the domain is publicly accessible. Use Twilio's Request Inspector in the Console to see the HTTP response." },
              { q: "PIN is rejected but the attendee is registered", a: "Confirm the conference is in 'running' status and that the dial-in number on the conference matches the Twilio number exactly (including country code)." },
              { q: "Caller is sent to operator queue even with a valid PIN", a: "CuraLive Direct (Auto-Admit) may be disabled on the conference. Open the OCC → CuraLive Direct tab and click Enable Auto-Admit." },
              { q: "No entries appear in the access log", a: "Verify the Twilio Voice URL points to /api/voice/inbound on your live domain, not localhost. The sandbox dev server is not reachable by Twilio." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className="text-slate-200 font-medium mb-1">{q}</div>
                <div className="text-slate-400">{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate("/occ")}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Open OCC
          </button>
          <button
            onClick={() => navigate("/integrations")}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" /> All Integrations
          </button>
          <a
            href="https://console.twilio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-600 hover:border-slate-400 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Twilio Console
          </a>
        </div>
      </div>
    </div>
  );
}
