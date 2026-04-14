/**
 * Operator Hub — Single landing page for all operator training and resources.
 * Route: /operator-hub
 * Covers: Learning path, call type guides (Audio Bridge / Audio Webcast / Video Webcast),
 * links to Training Guide and Training Mode Console.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap, Phone, Monitor, Radio, CheckCircle2, ChevronDown,
  ChevronUp, ExternalLink, AlertTriangle, Zap, BookOpen, Play,
  Users, Headphones, Mic, Video, ArrowRight, Clock, Star,
  Shield, Activity, LayoutGrid, FileText, MessageSquare, Settings,
  Circle, Info
} from "lucide-react";

type CallType = "audio-bridge" | "audio-webcast" | "video-webcast";

interface Step {
  n: number;
  title: string;
  detail: string;
  warning?: string;
  tip?: string;
}

const CALL_TYPES: {
  id: CallType;
  label: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
  badge: string;
  badgeBg: string;
  capacity: string;
  latency: string;
  bestFor: string[];
  notFor: string[];
  setup: Step[];
  operatingTips: string[];
  routeLabel: string;
  route: string;
}[] = [
  {
    id: "audio-bridge",
    label: "Audio Bridge",
    tagline: "Operator-managed telephone conference",
    icon: Phone,
    color: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/8",
    badge: "PSTN",
    badgeBg: "bg-blue-500/20 text-blue-300",
    capacity: "Up to 500 callers",
    latency: "Near-zero (telephony)",
    bestFor: [
      "Earnings calls where institutional investors dial in",
      "Board meetings with executives on phones",
      "Any event where participants need to speak",
      "Events with international attendees on landlines",
    ],
    notFor: [
      "Large public audiences (use Audio Webcast instead)",
      "Slide-sharing or screen sharing requirements",
    ],
    setup: [
      { n: 1, title: "Create the conference in Scheduling", detail: "Go to /events/schedule → select Earnings Call or Audio Bridge template → fill in the date/time/dial-in numbers. The system auto-allocates a conference ID (e.g. CC-9921) and PSTN dial-in numbers.", tip: "Book at least 30 minutes before the event start time so participants can join the lounge." },
      { n: 2, title: "Set your status to Present & Ready", detail: "Open the OCC → click the status indicator top-right → select Present & Ready. This is required — if you show Absent, you won't receive any conference transfers.", warning: "Never start a shift without setting your status. Callers in the lounge will not be visible to Absent operators." },
      { n: 3, title: "Load the conference into the CCP", detail: "In the Conference Overview panel on the left, find the conference in the PENDING tab. Click the headset icon on the conference card. The full CCP loads on the right with the empty participant list." },
      { n: 4, title: "Admit the moderator first", detail: "The moderator will dial in ahead of participants. They appear in the Lounge (amber badge in the top bar). Click the Lounge icon → click Pick next to the moderator to admit them to the live bridge. Unmute them immediately — moderators join muted by default." },
      { n: 5, title: "Dial out to presenters (if required)", detail: "Go to CCP → Connection tab → enter the presenter's name and E.164 phone number (e.g. +27831234567) → select role Moderator → click Dial Now. The system calls them out and connects them directly to the conference. Unmute them once connected.", tip: "Pre-load all presenter numbers into the Connection tab before the event starts to save time." },
      { n: 6, title: "Open the Q&A queue and enable Requests", detail: "Click the Q&A tab in the CCP feature bar. Enable Request to Speak mode for the Q&A segment. Participants press *5 to raise their hand — their line appears in the Requests panel with a star." },
      { n: 7, title: "Manage Q&A hand-raises", detail: "During the Q&A segment, open the Requests window. Unmute the next caller (they come off mute automatically when you click their entry). After they speak, mute them and move to the next. Approve text questions from the Q&A tab — approved questions go to the moderator's screen." },
      { n: 8, title: "Terminate and hand off to Post-Event", detail: "Click the red Terminate button in the conference bar at the bottom of the CCP. Confirm. The conference moves to COMPLETED in the Overview panel. Click Post-Event to open the post-event report for AI summary generation.", tip: "Wait 30 seconds after terminating before clicking Post-Event — the transcript pipeline needs a moment to finalise." },
    ],
    operatingTips: [
      "Park (don't Disconnect) for audio issues — Park puts them on hold music; Disconnect is permanent.",
      "Check the Lounge every 60 seconds during open-access events — VIP callers may be waiting.",
      "Use the Monitoring tab to listen silently to a caller if you suspect audio issues before asking them to re-dial.",
      "Mute All before the moderator starts speaking to eliminate background noise.",
      "The Alarms tab in the Overview panel flashes red when the conference timer exceeds its booked duration — click +15 Min to extend.",
    ],
    routeLabel: "Open OCC",
    route: "/occ",
  },
  {
    id: "audio-webcast",
    label: "Audio Webcast",
    tagline: "One-to-many broadcast with web listening",
    icon: Radio,
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/8",
    badge: "Broadcast",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    capacity: "Unlimited web listeners + up to 100 dial-in",
    latency: "15–30 seconds web delay",
    bestFor: [
      "Earnings calls with large public investor audiences",
      "Investor day broadcasts where most attendees only listen",
      "Events with 500+ registrants who don't need to speak",
      "Events requiring a replay/on-demand recording",
    ],
    notFor: [
      "Small meetings where everyone needs to speak",
      "Board meetings (privacy concerns with web streaming)",
    ],
    setup: [
      { n: 1, title: "Create the event in Webcasting Hub", detail: "Go to /live-video/webcasting → click Create New Webcast → fill in title, date/time, company, and select the Audio Webcast type. The system creates a webcast slug, registration page, and an audio bridge for the speaker line.", tip: "Add a registration page description and company logo — attendees see this when they register." },
      { n: 2, title: "Share the registration link with attendees", detail: "From the Webcast Studio, copy the registration URL (/live-video/webcast/:slug/register) and share it via email/IR website. Attendees register and receive the attendee link (/live-video/webcast/:slug/attend)." },
      { n: 3, title: "Set up the speaker audio bridge (OCC)", detail: "Open the OCC. The webcast creates an associated audio conference for speakers to dial in. Load this conference into the CCP 15 minutes before start. Dial out to presenters via the Connection tab so they join the speaker bridge.", warning: "Speakers join the audio bridge — NOT the web player. The web player pulls audio from the bridge. Make sure speakers use the dial-in number provided, not the public attendee link." },
      { n: 4, title: "Start the broadcast", detail: "In the Webcast Studio (/live-video/webcast/:slug), click Go Live when ready. The audio stream from the speaker bridge is now being broadcast to all web attendees. The Live indicator turns red and the listener count starts incrementing.", tip: "Do a 10-second private test before going live — have a colleague listen on the attendee URL and confirm audio is clear." },
      { n: 5, title: "Monitor web Q&A and text questions", detail: "Web attendees submit text questions via the Q&A panel in the attendee room. In the Webcast Studio → Q&A tab, you'll see all submitted questions. Approve questions to pass them to the moderator for verbal Q&A. Use bulk approve/reject for high-volume events." },
      { n: 6, title: "Manage audio Q&A (if hybrid)", detail: "For hybrid events where some attendees can dial in and ask questions verbally: manage the dial-in speakers in the OCC CCP as you would an Audio Bridge. The web stream captures the audio from the bridge — speaker questions are heard by web listeners too.", tip: "Mute all dial-in participants during the presentation segment. Only unmute during Q&A when they're called on." },
      { n: 7, title: "End the broadcast and publish recording", detail: "Click Stop Broadcast in the Webcast Studio. Confirm. The recording is automatically processed by Mux. Once processing completes (3–10 minutes), click Publish Recording to make the replay available at the on-demand URL. Send the replay link to registered attendees." },
    ],
    operatingTips: [
      "The 15–30 second web delay is normal — the audio bridge and web stream are not synchronised in real-time.",
      "Monitor the Viewer Count in the Webcast Studio to gauge attendance. Significant drops mid-event often mean audio issues.",
      "Use the Webcast Analytics page post-event to see peak viewer counts, drop-off points, and Q&A engagement.",
      "Always test the attendee URL on a separate device before the event starts — just because the studio looks good doesn't mean attendees can hear.",
      "The AI transcription runs automatically from the audio bridge — the post-event transcript is available in the Post-Event Report within minutes of ending.",
    ],
    routeLabel: "Open Webcast Studio",
    route: "/live-video/webcasting",
  },
  {
    id: "video-webcast",
    label: "Video Webcast",
    tagline: "Full video stream with slides, polls, and chat",
    icon: Video,
    color: "text-violet-400",
    border: "border-violet-500/40",
    bg: "bg-violet-500/8",
    badge: "RTMP/HLS",
    badgeBg: "bg-violet-500/20 text-violet-300",
    capacity: "Unlimited viewers",
    latency: "5–10 seconds (HLS)",
    bestFor: [
      "Investor Days with multiple speakers and slides",
      "Product launches with visual demonstrations",
      "Annual General Meetings requiring video presence",
      "Executive briefings where body language matters",
    ],
    notFor: [
      "Pure dial-in calls (use Audio Bridge)",
      "Events where speakers are remote without video feeds",
    ],
    setup: [
      { n: 1, title: "Create the video webcast event", detail: "Go to /live-video/webcasting → Create New Webcast → select Video Webcast type. You'll get an RTMP ingest URL and stream key. Share these with your video production team or the presenter's streaming software (OBS, Zoom, Teams).", tip: "Ask the presenter to connect their streaming software to the RTMP URL 30 minutes before the event. You need to see the stream preview in the Webcast Studio before going live." },
      { n: 2, title: "Set up the Recall.ai bot (if using Zoom/Teams)", detail: "If the presenter is on Zoom or Microsoft Teams, go to OCC → the Webcast Studio's Recall Bot Panel → enter the Zoom/Teams meeting URL → click Connect Bot. The Recall.ai bot joins the meeting and relays the video to CuraLive's Mux stream. No RTMP setup needed.", warning: "The Recall.ai bot takes 30–60 seconds to join a meeting. Connect it at least 2 minutes before the scheduled start." },
      { n: 3, title: "Load slides into the Slide Presenter (optional)", detail: "If the presenter needs a teleprompter or live slide control: go to /live-video/roadshow/:id/present/:meetingId. This opens the slide presenter view where slides sync in real-time to the attendee room. Upload the slide deck as a PDF before the event.", tip: "The slide presenter view has a Confidence Monitor mode — the presenter sees their notes while attendees see the clean slide." },
      { n: 4, title: "Check the stream preview in Webcast Studio", detail: "Open /live-video/webcast/:slug in the Webcast Studio. You should see the video preview in the Studio Monitor before going live. Check audio levels, video quality, and slide sync. If no preview appears, ask the presenter to check their RTMP connection or verify the Recall bot has joined.", warning: "Never go live without a preview. A blank screen means the stream source is not connected." },
      { n: 5, title: "Launch pre-event polls and chat (optional)", detail: "Use the Poll Manager in the Webcast Studio to queue up polls before the event. These launch instantly during the event. Enable the chat panel so attendees can engage before the stream starts — this builds energy." },
      { n: 6, title: "Go Live", detail: "Click Go Live in the Webcast Studio. The HLS stream becomes available to all attendees at the attendee URL. The live indicator turns red. Monitor the Viewer Count — it may take 30–60 seconds for the first viewers to appear due to the HLS buffer.", tip: "Have a colleague watch the attendee URL on a separate device from the moment you go live. They can alert you immediately if there are audio/video issues." },
      { n: 7, title: "Manage polls, chat, and Q&A during the event", detail: "During the event: launch polls from the Poll Manager → monitor responses in real-time → close polls to show results. Moderate the Q&A panel — approve text questions and relay them to the moderator via the Notes tab in the OCC. Use Rolling AI Summary to get a live digest of what's been covered." },
      { n: 8, title: "End stream and publish on-demand", detail: "Click Stop Stream when the event ends. Mux processes the recording (5–15 minutes for long events). Click Publish On-Demand to release the replay. Share the watch URL (/live-video/webcast/:slug/watch) with registered attendees and on your IR website.", tip: "The AI-generated Post-Event Report is available within minutes of ending. Share it with your IR team before the replay goes public." },
    ],
    operatingTips: [
      "HLS streams have a 5–10 second delay — attendees are not watching in real-time. Don't synchronise audio Q&A with the web stream.",
      "Monitor Mux stream health in the Webcast Studio — look for dropped frames or bitrate warnings.",
      "If the RTMP source disconnects mid-event, Mux will show a 'buffering' state for attendees. Reconnect the stream source and it will resume automatically within 30 seconds.",
      "The Rolling AI Summary updates every 30 seconds — use it to catch up quickly if you step away.",
      "Export the post-event report PDF for compliance records before archiving the event.",
    ],
    routeLabel: "Open Webcast Hub",
    route: "/live-video/webcasting",
  },
];

const LEARNING_PATH = [
  {
    step: "01",
    title: "Complete the OCC Training Guide",
    detail: "Work through the 4-phase interactive training guide. Each phase takes 15–25 minutes. Covers OCC layout, participant management, Q&A, compliance, and pro techniques. Complete the quiz at the end of each phase (75% to pass).",
    time: "~75 min total",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/8",
    action: { label: "Open Training Guide", route: "/training" },
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Read the Call Type Guides below",
    detail: "Understand the three event types you'll operate: Audio Bridge, Audio Webcast, and Video Webcast. Each has a different setup flow and tools. Read the guide for your first event type before running a practice session.",
    time: "~20 min",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    action: { label: "Read Call Type Guides", route: "#call-types" },
    icon: FileText,
  },
  {
    step: "03",
    title: "Run a Training Mode practice session",
    detail: "Open the Training Mode Console and create a practice session for your call type (Earnings Call, Audio Bridge, Video Webcast, etc.). The environment is fully isolated — nothing you do here affects production. Practice until you score 4+ stars.",
    time: "~30 min per scenario",
    color: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/8",
    action: { label: "Open Training Mode", route: "/training-mode" },
    icon: Play,
  },
  {
    step: "04",
    title: "Shadow a live event",
    detail: "Before operating solo, shadow an experienced operator on a live event. Open the OCC alongside them, follow their actions in real-time, and ask questions after the event. One shadowed event is worth more than ten practice sessions.",
    time: "1 live event",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    action: { label: "Open OCC", route: "/occ" },
    icon: Users,
  },
];

const QUICK_REF = [
  { action: "Park a caller (audio issues)", how: "CCP → click Park button on caller row" },
  { action: "Mute All participants", how: "CCP → bottom bar → Mute All button" },
  { action: "Dial out to a presenter", how: "CCP → Connection tab → enter number → Dial Now" },
  { action: "Admit a lounge caller", how: "Top bar → Lounge icon → Pick next to caller" },
  { action: "Enable Q&A hand raises", how: "CCP → Q&A tab → toggle Request to Speak" },
  { action: "Extend conference time", how: "CCP → bottom bar → +15 Min button" },
  { action: "Terminate a conference", how: "CCP → bottom bar → red Terminate button" },
  { action: "Launch a poll (video webcast)", how: "Webcast Studio → Poll Manager → Launch" },
  { action: "Start Recall.ai bot recording", how: "Webcast Studio → Recall Bot Panel → enter meeting URL → Connect" },
  { action: "Go Live (webcast)", how: "Webcast Studio → click Go Live button" },
  { action: "Open Post-Event Report", how: "OCC → conference card (Completed tab) → Post-Event" },
  { action: "Transfer an operator", how: "CCP → Actions → Transfer → select target operator" },
];

function CallTypeCard({ type, isOpen, onToggle }: { type: typeof CALL_TYPES[0]; isOpen: boolean; onToggle: () => void }) {
  const [, navigate] = useLocation();
  const Icon = type.icon;

  return (
    <div className={`border rounded-xl overflow-hidden ${type.border} transition-all`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 ${type.bg} hover:opacity-90 transition-opacity text-left`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl border ${type.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${type.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold ${type.color}`}>{type.label}</span>
              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${type.badgeBg}`}>{type.badge}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{type.tagline}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex gap-4 text-xs text-slate-500">
            <span>👥 {type.capacity}</span>
            <span>⚡ {type.latency}</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="bg-[#0d1220] divide-y divide-slate-800/60">
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Best For
              </div>
              <ul className="space-y-1">
                {type.bestFor.map(b => (
                  <li key={b} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>{b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Circle className="w-3 h-3 text-red-400" /> Not For
              </div>
              <ul className="space-y-1">
                {type.notFor.map(n => (
                  <li key={n} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5">
            <div className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className={`w-4 h-4 ${type.color}`} />
              Step-by-Step Setup
            </div>
            <div className="space-y-4">
              {type.setup.map(step => (
                <div key={step.n} className="flex gap-4">
                  <div className={`w-7 h-7 rounded-full border ${type.border} flex items-center justify-center text-xs font-bold ${type.color} shrink-0 mt-0.5`}>
                    {step.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200 mb-1">{step.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{step.detail}</div>
                    {step.warning && (
                      <div className="mt-2 flex items-start gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-red-300 leading-relaxed">{step.warning}</span>
                      </div>
                    )}
                    {step.tip && (
                      <div className="mt-2 flex items-start gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-blue-300 leading-relaxed"><strong>Tip:</strong> {step.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400" /> Operating Tips
            </div>
            <ul className="space-y-2">
              {type.operatingTips.map(tip => (
                <li key={tip} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 flex justify-end">
            <button
              onClick={() => navigate(type.route)}
              className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-4 py-2 border ${type.border} ${type.color} hover:bg-white/5 transition-colors`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {type.routeLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OperatorHub() {
  const [, navigate] = useLocation();
  const [openType, setOpenType] = useState<CallType | null>("audio-bridge");
  const [showQuickRef, setShowQuickRef] = useState(false);

  function toggleType(id: CallType) {
    setOpenType(prev => prev === id ? null : id);
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      <div className="sticky top-0 z-10 bg-[#080c14]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/occ")} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Operator Hub</div>
                <div className="text-xs text-slate-500">Training · Call Guides · Quick Reference</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickRef(v => !v)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2.5 py-1.5 text-slate-300 transition-colors"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Quick Ref
            </button>
            <button
              onClick={() => navigate("/occ")}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-2.5 py-1.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open OCC
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        <div className="bg-gradient-to-r from-blue-500/10 via-violet-500/8 to-emerald-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white mb-1">Welcome to CuraLive — Operator Hub</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Everything you need to start operating confidently. Follow the learning path below in order — it takes about 2 hours to complete and covers everything from the OCC layout to running a live video webcast.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> ~2 hours to complete
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Training mode is safe — nothing affects production
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Aim for 4+ stars in training before going live
                </div>
              </div>
            </div>
          </div>
        </div>

        {showQuickRef && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-slate-200">Quick Reference — Common Operator Actions</span>
              </div>
              <button onClick={() => setShowQuickRef(false)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <div className="divide-y divide-slate-800/60">
              {QUICK_REF.map(({ action, how }) => (
                <div key={action} className="flex items-center gap-4 px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-300 w-56 shrink-0">{action}</span>
                  <span className="text-xs text-slate-500 font-mono">{how}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-200">Your Learning Path</h2>
          </div>
          <div className="space-y-3">
            {LEARNING_PATH.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.step} className={`border rounded-xl p-4 ${item.border} ${item.bg} flex items-start gap-4`}>
                  <div className={`w-10 h-10 rounded-xl border ${item.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 bg-slate-800 text-slate-500 font-mono`}>STEP {item.step}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.title}</span>
                      <span className="text-xs text-slate-600 ml-auto">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{item.detail}</p>
                    <button
                      onClick={() => {
                        if (item.action.route.startsWith("#")) {
                          document.getElementById("call-types")?.scrollIntoView({ behavior: "smooth" });
                        } else {
                          navigate(item.action.route);
                        }
                      }}
                      className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold border rounded px-3 py-1.5 ${item.color} ${item.border} hover:bg-white/5 transition-colors`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {item.action.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="call-types">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-200">Call Type Guides</h2>
            <span className="text-xs text-slate-500 ml-2">Click a call type to expand its full setup guide</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {CALL_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`border rounded-xl p-3 text-left transition-all hover:opacity-90 ${
                    openType === type.id ? `${type.border} ${type.bg}` : "border-slate-700/50 bg-slate-900/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${openType === type.id ? type.color : "text-slate-500"}`} />
                  <div className={`text-xs font-bold ${openType === type.id ? type.color : "text-slate-400"}`}>{type.label}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{type.tagline}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {CALL_TYPES.map(type => (
              <CallTypeCard
                key={type.id}
                type={type}
                isOpen={openType === type.id}
                onToggle={() => toggleType(type.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-violet-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-200">All Training Resources</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: "OCC Operator Training Guide",
                desc: "4-phase interactive guide with quizzes. Covers OCC layout, participant management, CCP features, Q&A, compliance, and pro techniques.",
                time: "~75 min",
                icon: BookOpen,
                color: "text-blue-400",
                border: "border-blue-500/30",
                bg: "bg-blue-500/8",
                route: "/training",
              },
              {
                title: "Training Mode Console",
                desc: "Isolated sandbox to practice operating. Create sessions for Earnings Call, Roadshow, Video Webcast, Audio Bridge, or Board Meeting scenarios.",
                time: "30 min per scenario",
                icon: Play,
                color: "text-violet-400",
                border: "border-violet-500/30",
                bg: "bg-violet-500/8",
                route: "/training-mode",
              },
              {
                title: "Operator Console (OCC)",
                desc: "Your main workspace for live events. Explore the layout, Conference Overview panel, CCP, and all feature tabs before your first live event.",
                time: "Live only",
                icon: LayoutGrid,
                color: "text-emerald-400",
                border: "border-emerald-500/30",
                bg: "bg-emerald-500/8",
                route: "/occ",
              },
              {
                title: "Operator Reference Guide",
                desc: "Detailed reference covering dial-in numbers, platform integrations, webphone setup, and escalation procedures.",
                time: "Reference",
                icon: FileText,
                color: "text-amber-400",
                border: "border-amber-500/30",
                bg: "bg-amber-500/8",
                route: "/operator-guide",
              },
              {
                title: "Webcasting Hub",
                desc: "Create and manage video webcasts, audio webcasts, and roadshows. Start here to set up a new webcast event.",
                time: "Event setup",
                icon: Radio,
                color: "text-rose-400",
                border: "border-rose-500/30",
                bg: "bg-rose-500/8",
                route: "/live-video/webcasting",
              },
              {
                title: "Operator Analytics",
                desc: "Your personal performance dashboard. Track calls handled, average handle time, quality scores, and training certifications.",
                time: "Reference",
                icon: Activity,
                color: "text-cyan-400",
                border: "border-cyan-500/30",
                bg: "bg-cyan-500/8",
                route: "/operator/analytics",
              },
            ].map(res => {
              const Icon = res.icon;
              return (
                <button
                  key={res.route}
                  onClick={() => navigate(res.route)}
                  className={`border rounded-xl p-4 ${res.border} ${res.bg} text-left hover:opacity-90 transition-opacity group`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${res.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${res.color}`}>{res.title}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${res.color} opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0`} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{res.desc}</p>
                      <span className="text-[10px] text-slate-600 mt-2 block">{res.time}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-amber-500/8 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-300 mb-1">Before Your First Live Event</div>
              <ul className="space-y-1.5">
                {[
                  "Complete at least Phases 1–2 of the OCC Training Guide.",
                  "Run one full practice session in Training Mode for your event type.",
                  "Shadow an experienced operator on a live event.",
                  "Know your escalation path: if something goes wrong on a live call, who do you contact?",
                  "Test your headset and webphone registration 15 minutes before the event.",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-amber-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-700 pb-4">
          CuraLive Operator Hub · Internal Training Resource · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
