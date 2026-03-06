import { useLocation } from "wouter";
import { ExternalLink, Phone, Monitor, FileText, Clock, Users, Mic, MicOff, PhoneOff, ArrowRightLeft, Bell, Settings, ChevronRight } from "lucide-react";

const BASE_URL = "https://curalive.cc";

function SectionLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
    >
      {label}
      {external ? <ExternalLink className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
    </a>
  );
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border pb-10 mb-10 last:border-0">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-primary/60 bg-primary/5 px-5 py-4 rounded-r-lg my-5 text-sm text-foreground leading-relaxed">
      {children}
    </div>
  );
}

export default function OperatorGuide() {
  const [, navigate] = useLocation();

  const navItems = [
    { id: "before-you-start", label: "Before You Start" },
    { id: "four-panels", label: "The Four Panels" },
    { id: "status", label: "Setting Your Status" },
    { id: "participant-list", label: "Participant List" },
    { id: "conference-bar", label: "Conference Bar" },
    { id: "feature-tabs", label: "Feature Tabs" },
    { id: "lounge", label: "Caller Lounge" },
    { id: "transfer", label: "Transferring a Conference" },
    { id: "webphone", label: "Webphone" },
    { id: "alarms", label: "Alarms" },
    { id: "quick-ref", label: "Quick Reference" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/occ")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              ← OCC
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold">Operator Quick-Start Guide</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${BASE_URL}/training`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Full Training Guide <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/OCC_Operator_Quick_Start_Guide.pdf"
              download
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3" /> Download PDF
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1 leading-snug"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              For Experienced Operators
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">CuraLive OCC Quick-Start Guide</h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              You already know how to run a conference. This guide covers what is different in the new console — where to find things, what the controls do, and the handful of habits that will make you immediately effective.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href={`${BASE_URL}/occ`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Monitor className="w-4 h-4" /> Open OCC
              </a>
              <a
                href={`${BASE_URL}/training`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
              >
                Full Training Guide <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Before you start */}
          <Section id="before-you-start" title="Before You Start" icon={ChevronRight}>
            <p className="text-muted-foreground leading-relaxed">
              Read this guide once, keep it open on a second screen for your first few calls, and you will be comfortable within a session. The OCC is designed around the same workflow you already know — the terminology and layout are just different.
            </p>
            <div className="mt-4 p-4 bg-muted/40 rounded-lg text-sm">
              <span className="font-semibold text-foreground">Platform URL: </span>
              <SectionLink href={`${BASE_URL}/occ`} label="curalive.cc/occ" external />
            </div>
          </Section>

          {/* Four panels */}
          <Section id="four-panels" title="The Four Panels You Will Use Every Day" icon={Monitor}>
            <p className="text-muted-foreground leading-relaxed mb-2">
              The OCC is built around four areas. Everything else is secondary.
            </p>
            <Table
              headers={["Panel", "What it does", "How to open it"]}
              rows={[
                [
                  <span className="font-semibold text-foreground">Conference Overview</span>,
                  "Lists all conferences by lifecycle — Running, Pending, Planned, Completed, Alarms",
                  <SectionLink href={`${BASE_URL}/occ`} label="Open OCC" external />
                ],
                [
                  <span className="font-semibold text-foreground">Conference Control Panel (CCP)</span>,
                  "Your main workspace for a live call — participant list, actions, feature tabs",
                  "Click the headset icon on any conference card in the Overview"
                ],
                [
                  <span className="font-semibold text-foreground">Webphone</span>,
                  "Built-in softphone for outbound calls, voicemail, and call transfer",
                  "Click the phone icon in the OCC top bar"
                ],
                [
                  <span className="font-semibold text-foreground">Post-Event Report</span>,
                  "Full participant list, operator notes, AI summary, and transcript",
                  <SectionLink href={`${BASE_URL}/occ`} label="Conference Bar → Post-Event" external />
                ],
              ]}
            />
          </Section>

          {/* Status */}
          <Section id="status" title="The One Thing You Must Do Before Every Shift" icon={Users}>
            <p className="text-muted-foreground leading-relaxed">
              Set your status to <strong className="text-foreground">Present & Ready</strong> in the top-right status bar of the OCC. If you show as <strong className="text-foreground">Absent</strong>, you will not receive conference transfers, you will not appear as a transfer target for other operators, and inbound Webphone calls will route to voicemail instead of your browser.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Absent", color: "bg-red-500/20 text-red-400 border-red-500/30", desc: "Default on login" },
                { label: "Present & Ready", color: "bg-green-500/20 text-green-400 border-green-500/30", desc: "Set before shift" },
                { label: "In Call", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", desc: "Auto-set by system" },
                { label: "On Break", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", desc: "Set manually" },
              ].map((s) => (
                <div key={s.label} className={`border rounded-lg px-3 py-3 text-xs ${s.color}`}>
                  <div className="font-semibold mb-1">{s.label}</div>
                  <div className="opacity-70">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <SectionLink href={`${BASE_URL}/occ`} label="Go to OCC to set your status" external />
            </div>
          </Section>

          {/* Participant list */}
          <Section id="participant-list" title="The Participant List — What Is Different" icon={Users}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The CCP participant table will feel familiar. The key differences from most legacy systems:
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">States are colour-coded, not text labels</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Green = Connected · Amber = Muted · Purple = Parked · Red = Waiting/Lounge</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Park is not Mute</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Park places the caller on hold music and removes them from live audio. Mute silences them but they remain in the conference and can hear everything. Use Park for audio issues. Use Mute for noisy lines.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Disconnect is permanent</p>
                  <p className="text-sm text-muted-foreground mt-0.5">There is no reconnect button. If you Disconnect a caller, they must dial back in. When in doubt, Park.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Bulk actions via the header checkbox</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Tick the top checkbox to select all visible participants, then use the bulk action bar at the bottom. This is how you Mute All or Unmute All in one click.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Conference Bar */}
          <Section id="conference-bar" title="The Conference Bar — Your Primary Controls" icon={Clock}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Conference Bar sits at the bottom of every active CCP session. From left to right:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Live Timer", icon: Clock, desc: "Shows elapsed time. Turns amber at warning threshold (default 50 min), red at critical (default 60 min)." },
                { label: "Unmute All", icon: Mic, desc: "Restores audio for every participant simultaneously. Use this to open the floor after a presentation." },
                { label: "Mute All", icon: MicOff, desc: "Silences every participant at once. Essential at the start of Q&A or when background noise is disruptive." },
                { label: "+15 Min", icon: Clock, desc: "Extends the conference duration by 15 minutes and resets the critical timer threshold." },
                { label: "Post-Event", icon: FileText, desc: "Saves all participant data and your notes, then navigates to the Post-Event Report." },
                { label: "Terminate", icon: PhoneOff, desc: "Ends the conference and disconnects all participants. Irreversible — confirmation prompt appears." },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Feature tabs */}
          <Section id="feature-tabs" title="The Seven Feature Tabs" icon={Settings}>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Below the participant list in the CCP, seven tabs give you specialist controls. You will use <strong className="text-foreground">Connection</strong>, <strong className="text-foreground">Notes</strong>, and <strong className="text-foreground">Q&A Queue</strong> most often.
            </p>
            <Table
              headers={["Tab", "Primary Use"]}
              rows={[
                ["Monitoring", "Listen silently to any participant's line, whisper privately to them, or barge in for emergencies"],
                ["Connection", "Dial out to add a new caller to the live conference"],
                ["History", "Per-participant event log — joins, mutes, parks, disconnects with timestamps"],
                ["Audio Files", "Play hold music or pre-recorded announcements"],
                ["Chat", "Broadcast text messages to all participants or a specific caller"],
                ["Notes", "Your operator notepad — auto-saved per conference, exported with the Post-Event report"],
                ["Q&A Queue", "Review and approve attendee questions submitted via the web interface"],
              ]}
            />
            <Callout>
              <strong>Tip:</strong> Write timestamps in the Notes tab throughout the call — "14:32 Q&A opened", "14:55 Technical issue, parked line 7". These notes appear verbatim in the Post-Event Operator Report and are invaluable for client queries after the call.
            </Callout>
          </Section>

          {/* Lounge */}
          <Section id="lounge" title="The Caller Lounge" icon={Users}>
            <p className="text-muted-foreground leading-relaxed">
              Callers who self-dialled and are waiting to be admitted sit in the Lounge. The Lounge panel is accessible from the launcher icon in the top bar. When callers are waiting, the badge pulses amber.
            </p>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border text-sm space-y-2">
              <p className="font-semibold text-foreground">To admit a caller:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open the Lounge panel from the top bar launcher icon</li>
                <li>Click <strong className="text-foreground">Pick</strong> on the waiting caller</li>
                <li>The Caller Control popup appears — confirm name, company, and role</li>
                <li>Click <strong className="text-foreground">Admit</strong></li>
              </ol>
            </div>
            <Callout>
              Check the Lounge every 60 seconds during a live call. Late-joining VIPs and dial-in participants always land here first.
            </Callout>
          </Section>

          {/* Transfer */}
          <Section id="transfer" title="Transferring a Conference" icon={ArrowRightLeft}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you need to hand off a live conference to another operator:
            </p>
            <ol className="space-y-3">
              {[
                { step: "1", text: "Click Transfer in the CCP header." },
                { step: "2", text: "Select the target operator from the list — only operators showing Present & Ready appear." },
                { step: "3", text: 'Add a handover note (e.g., "Q4 Earnings — 1,247 participants. Moderator Thabo is live. Q&A starts at 45 min mark.")' },
                { step: "4", text: "Click Send Transfer — the target operator receives a real-time notification with the conference details and your note." },
              ].map((item) => (
                <li key={item.step} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{item.step}</span>
                  <span className="text-muted-foreground pt-0.5">{item.text}</span>
                </li>
              ))}
            </ol>
            <Callout>
              Never leave a live conference unattended. Always use Transfer for shift handoffs.
            </Callout>
          </Section>

          {/* Webphone */}
          <Section id="webphone" title="The Webphone" icon={Phone}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The built-in Webphone handles all outbound PSTN calls without leaving the OCC. Open it from the phone icon in the top bar.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Caller ID selection", desc: "Choose from your verified numbers in the dropdown before dialling." },
                { label: "Call history", desc: "Recent calls with duration, status, and direction. Click any number to redial." },
                { label: "Voicemail", desc: "When no operators are available, callers leave voicemails that are automatically transcribed." },
                { label: "Call transfer", desc: "During an active call, click the transfer button to blind-transfer or warm-transfer." },
                { label: "Recording", desc: "All calls are recorded automatically. Playback and transcription in the call history panel." },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-muted/30 rounded-lg border border-border text-sm">
                  <p className="font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <SectionLink href={`${BASE_URL}/occ`} label="Open OCC → click phone icon in top bar" external />
            </div>
          </Section>

          {/* Alarms */}
          <Section id="alarms" title="Alarms" icon={Bell}>
            <p className="text-muted-foreground leading-relaxed mb-2">
              The Alarms tab in the Overview panel shows conferences with active alerts. The alarm badge in the top navigation pulses red when an alarm is active.
            </p>
            <Table
              headers={["Alarm Type", "Cause", "Action"]}
              rows={[
                ["Timer exceeded", "Conference has run past the critical threshold", "Click +15 Min or Terminate"],
                ["Lounge overflow", "More than 5 callers waiting in the Lounge", "Open Lounge panel and admit callers"],
                ["Operator request", "Moderator pressed *0 on their keypad", "Open Operator Requests panel and pick the request"],
              ]}
            />
            <p className="text-sm text-muted-foreground mt-4">Do not leave an alarm unacknowledged for more than 2 minutes.</p>
          </Section>

          {/* Quick reference */}
          <Section id="quick-ref" title="Quick Reference — Common Actions" icon={ChevronRight}>
            <Table
              headers={["Action", "Steps"]}
              rows={[
                ["Open a conference", "Overview panel → click headset icon on conference card"],
                ["Mute one caller", "Participant row → click amber mic-off button"],
                ["Mute all participants", "Header checkbox → select all → Bulk bar → Mute All"],
                ["Park a caller", "Participant row → click purple park button"],
                ["Admit a lounge caller", "Lounge panel → Pick → Caller Control → Admit"],
                ["Dial out to a participant", "CCP → Connection tab → fill form → Dial Now"],
                ["Extend conference +15 min", "Conference Bar → +15 Min"],
                ["Transfer to another operator", "CCP header → Transfer → select operator → add note → Send"],
                ["End the conference", "Conference Bar → red Terminate button"],
                ["Export to Post-Event Report", "Conference Bar → Post-Event → Operator Report tab"],
                ["Open the Webphone", "Top bar → phone icon"],
                ["Check voicemails", "Webphone → voicemail tab (envelope icon)"],
                ["Set your status", "Top-right status bar → select state"],
              ]}
            />
          </Section>

          {/* Settings */}
          <Section id="settings" title="Settings to Configure on Day One" icon={Settings}>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Open Settings from the gear icon in the CCP header.
            </p>
            <div className="space-y-3">
              {[
                { label: "Timer Warning Threshold", desc: "Set to your typical call length minus 10 minutes (default 50 min)." },
                { label: "Timer Critical Threshold", desc: "Set to your maximum call length (default 60 min)." },
                { label: "Preferred Dial-In Country", desc: "Set to South Africa (or your primary market) to pre-fill the country code in the dial-out form." },
                { label: "Audio Alert Volume", desc: "Set to a level you will notice without it being disruptive to your headset." },
                { label: "Default Participant Filter", desc: "Set to All for most events; switch to Moderators for large calls where you only want to see key participants." },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="text-muted-foreground"> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Platform links */}
          <div className="mt-4 p-5 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm font-semibold text-foreground mb-3">Platform Links</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { label: "OCC Dashboard", href: `${BASE_URL}/occ` },
                { label: "Full Training Guide", href: `${BASE_URL}/training` },
                { label: "Post-Event Reports", href: `${BASE_URL}/post-event/q4-earnings-2026` },
                { label: "Tech Handover", href: `${BASE_URL}/tech-handover` },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            CuraLive OCC Operator Quick-Start Guide · v2.0 · March 2026
          </p>
        </main>
      </div>
    </div>
  );
}
