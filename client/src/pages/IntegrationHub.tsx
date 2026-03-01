import { useState } from "react";
import { useLocation } from "wouter";
import {
  Zap, ArrowLeft, CheckCircle, AlertCircle, Clock,
  Code2, ExternalLink, Copy, CheckCheck, ChevronDown, ChevronUp
} from "lucide-react";

const INTEGRATIONS = [
  {
    id: "recall",
    name: "Recall.ai",
    badge: "Recommended",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    status: "active",
    complexity: "Very Low",
    costPer90: "~$0.98",
    platforms: ["Zoom", "Microsoft Teams", "Webex", "Google Meet", "Slack Huddles", "GoTo Meeting"],
    realTimeAudio: true,
    realTimeTranscript: true,
    description: "Universal connector — single API covers all major platforms. SOC 2, ISO 27001, GDPR, CCPA, HIPAA compliant. First 5 hours free.",
    setup: "2 weeks",
    code: `// 1. Send bot to meeting
const bot = await fetch('https://api.recall.ai/api/v1/bot', {
  method: 'POST',
  headers: { Authorization: \`Token \${RECALL_API_KEY}\` },
  body: JSON.stringify({
    meeting_url: meetingUrl,
    webhook_url: \`\${origin}/api/webhooks/recall\`,
    transcription_options: { provider: 'recall' },
    metadata: { eventId },
  }),
}).then(r => r.json());

// 2. Handle webhook
app.post('/api/webhooks/recall', (req, res) => {
  const { event, data } = req.body;
  if (event === 'transcript.data') {
    const { words, speaker } = data;
    // Push to Chorus Call real-time broadcast
  }
  res.sendStatus(200); // Must respond within 5s
});`,
    webhookEvents: ["bot.joining_call", "bot.in_call_recording", "transcript.data", "participant_events.joined", "bot.call_ended", "bot.done"],
  },
  {
    id: "zoom",
    name: "Zoom RTMS",
    badge: "Native",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    status: "available",
    complexity: "Low",
    costPer90: "~$0.23",
    platforms: ["Zoom"],
    realTimeAudio: true,
    realTimeTranscript: true,
    description: "Native Zoom Real-Time Media Streams SDK. Zero third-party dependency. Requires Zoom Business/Enterprise plan and RTMS enabled by Zoom admin.",
    setup: "2 weeks",
    code: `import rtms from '@zoom/rtms';

rtms.onWebhookEvent(({ event, payload }) => {
  if (event !== 'meeting.rtms_started') return;
  const client = new rtms.Client();
  client.onAudioData((data, timestamp, metadata) => {
    // Feed audio chunks to Whisper transcription pipeline
    processAudioChunk(data, metadata.speakerId);
  });
  client.join(payload);
});

// Configure in Zoom Marketplace app:
// Webhooks: meeting.rtms_started, meeting.rtms_stopped`,
    webhookEvents: ["meeting.rtms_started", "meeting.rtms_stopped"],
  },
  {
    id: "teams",
    name: "Microsoft Teams Bot",
    badge: "Enterprise",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    status: "available",
    complexity: "Medium-High",
    costPer90: "~$0.10",
    platforms: ["Microsoft Teams"],
    realTimeAudio: true,
    realTimeTranscript: true,
    description: "Azure Bot Framework SDK with Calls.AccessMedia.All permission. Requires Azure AD admin consent from customer's IT department — can take weeks in enterprise environments.",
    setup: "3–4 weeks",
    code: `// Azure Bot Framework — Teams media bot
// Requires: Azure AD app registration
// Permission: Calls.AccessMedia.All (admin consent required)

// Graph API alternative (simpler, not real-time):
// Subscribe to callTranscript change notifications
// Transcript arrives within minutes of meeting end

const subscribeToTranscript = async (callId: string) => {
  await graphClient.api('/subscriptions').post({
    changeType: 'created',
    notificationUrl: \`\${origin}/api/webhooks/teams\`,
    resource: \`/communications/calls/\${callId}/transcripts\`,
    expirationDateTime: new Date(Date.now() + 3600000).toISOString(),
  });
};`,
    webhookEvents: ["callTranscript.created", "call.started", "call.ended"],
  },
  {
    id: "rtmp",
    name: "RTMP Ingest",
    badge: "Universal",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    status: "active",
    complexity: "Low",
    costPer90: "~$0.10",
    platforms: ["OBS Studio", "vMix", "Wirecast", "Teradek", "LiveU", "Any RTMP encoder"],
    realTimeAudio: true,
    realTimeTranscript: false,
    description: "Professional studio encoder path. Run Node Media Server alongside Express. Extract audio with ffmpeg, feed 5-second WAV chunks to Whisper. ~5–8s transcript lag.",
    setup: "1 week",
    code: `# ffmpeg audio extraction from RTMP stream
ffmpeg -i rtmp://0.0.0.0:1935/live/STREAM_KEY \\
  -vn -acodec pcm_s16le -ar 16000 -ac 1 \\
  -f segment -segment_time 5 \\
  /tmp/audio_chunks/chunk_%03d.wav

# RTMP ingest URL format for partners:
# rtmp://ingest.chorus.ai/live/{eventStreamKey}

# Node Media Server config (server/rtmp.ts):
const nms = new NodeMediaServer({
  rtmp: { port: 1935, chunk_size: 60000 },
  http: { port: 8000, allow_origin: '*' },
});
nms.run();`,
    webhookEvents: [],
  },
  {
    id: "pstn",
    name: "PSTN Dial-In (Twilio)",
    badge: "Fallback",
    badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    status: "active",
    complexity: "Low",
    costPer90: "~$0.50 / caller",
    platforms: ["Phone", "Mobile", "Landline"],
    realTimeAudio: true,
    realTimeTranscript: false,
    description: "Essential for Africa and emerging markets where mobile data costs make browser-based audio unreliable. Twilio Voice streams audio through the same Whisper AI pipeline.",
    setup: "1 week",
    code: `// Twilio Voice webhook handler
app.post('/api/webhooks/twilio-voice', (req, res) => {
  const twiml = new VoiceResponse();
  const dial = twiml.dial();
  // Connect to conference room
  dial.conference(\`chorus-event-\${eventId}\`, {
    startConferenceOnEnter: false,
    endConferenceOnExit: false,
    record: 'record-from-start',
    recordingStatusCallback: '/api/webhooks/twilio-recording',
  });
  res.type('text/xml');
  res.send(twiml.toString());
});`,
    webhookEvents: ["voice.call.initiated", "voice.recording.completed"],
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400"><CheckCircle className="w-3 h-3" /> Active</span>;
  return <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Clock className="w-3 h-3" /> Available</span>;
}

export default function IntegrationHub() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<string | null>("recall");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
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
          <span className="text-muted-foreground text-sm">/ Integration Hub</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Integration Hub</h1>
          <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Chorus.AI is platform-neutral by design. Connect any webcast platform using the method that fits your infrastructure. All paths feed into the same AI pipeline — transcription, sentiment, Q&A, and summary.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Method</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Real-Time Audio</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Real-Time Transcript</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Complexity</th>
                  <th className="text-right px-5 py-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cost / 90 min</th>
                </tr>
              </thead>
              <tbody>
                {INTEGRATIONS.map((intg) => (
                  <tr key={intg.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === intg.id ? null : intg.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{intg.name}</span>
                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${intg.badgeColor}`}>{intg.badge}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      {intg.realTimeAudio ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="text-center px-4 py-3">
                      {intg.realTimeTranscript ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <AlertCircle className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="text-center px-4 py-3 text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>{intg.complexity}</td>
                    <td className="text-right px-5 py-3 font-semibold">{intg.costPer90}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="space-y-4">
          {INTEGRATIONS.map((intg) => (
            <div key={intg.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-secondary/20 transition-colors"
                onClick={() => setExpanded(expanded === intg.id ? null : intg.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{intg.name}</span>
                    <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${intg.badgeColor}`}>{intg.badge}</span>
                    <StatusBadge status={intg.status} />
                  </div>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{intg.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Setup</div>
                    <div className="text-sm font-semibold">{intg.setup}</div>
                  </div>
                  {expanded === intg.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expanded === intg.id && (
                <div className="border-t border-border px-6 py-5 space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Supported Platforms</div>
                      <div className="flex flex-wrap gap-1.5">
                        {intg.platforms.map((p) => (
                          <span key={p} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    </div>
                    {intg.webhookEvents.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Webhook Events</div>
                        <div className="flex flex-wrap gap-1.5">
                          {intg.webhookEvents.map((e) => (
                            <span key={e} className="text-[10px] font-mono bg-background border border-border text-muted-foreground px-2 py-0.5 rounded">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <Code2 className="w-3.5 h-3.5" /> Code Example
                      </div>
                      <button onClick={() => handleCopy(intg.code, intg.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {copied === intg.id ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <pre className="bg-background border border-border rounded-xl p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {intg.code}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
