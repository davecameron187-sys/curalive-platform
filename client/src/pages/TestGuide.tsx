import { ExternalLink, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

const BASE_URL = "https://chorusai-mdu4k2ib.manus.space";

interface TestStep {
  step: number;
  action: string;
  url?: string;
  note: string;
}

interface Section {
  id: string;
  number: string;
  title: string;
  role: string;
  roleColor: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  steps: TestStep[];
}

const SECTIONS: Section[] = [
  {
    id: "start",
    number: "1",
    title: "Start Here — Home & Sales Demo",
    role: "All Roles",
    roleColor: "text-slate-400",
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-400/15",
    badgeText: "text-slate-400",
    steps: [
      {
        step: 1,
        action: "Open the main platform homepage",
        url: `${BASE_URL}`,
        note: "Review the hero section, watch the embedded 55-second demo video, and click \"Download MP4\" to save a copy.",
      },
      {
        step: 2,
        action: "Open the Sales Demo page",
        url: `${BASE_URL}/demo`,
        note: "This is the page to share with prospects. Review all 6 platform module cards, the feature grid, and the download button.",
      },
      {
        step: 3,
        action: "Register as an event attendee",
        url: `${BASE_URL}/register/q4-earnings-2026`,
        note: "Fill in your name and email. You will be directed to the attendee event room.",
      },
    ],
  },
  {
    id: "attendee",
    number: "2",
    title: "Attendee — Live Event Room",
    role: "Attendee",
    roleColor: "text-blue-400",
    dotColor: "bg-blue-400",
    badgeBg: "bg-blue-400/15",
    badgeText: "text-blue-400",
    steps: [
      {
        step: 1,
        action: "Enter the live event room",
        url: `${BASE_URL}/event/q4-earnings-2026`,
        note: "You will see the live transcript feed, rolling AI summary, and sentiment indicator updating in real time.",
      },
      {
        step: 2,
        action: "Submit a question via the Q&A panel",
        note: "Type a question in the Q&A input field and click Submit. Test upvoting another question. Check that it appears in the queue.",
      },
      {
        step: 3,
        action: "Change the display language",
        note: "Use the language selector (top right) to switch between English, Afrikaans, Zulu, French, Arabic, and 7 other languages.",
      },
      {
        step: 4,
        action: "Test the dial-in number display",
        note: "Click \"Dial In\" to view the 18-country dial-in numbers. Verify South Africa, Nigeria, UAE, and Mauritius are listed.",
      },
    ],
  },
  {
    id: "moderator",
    number: "3",
    title: "Moderator Console",
    role: "Moderator",
    roleColor: "text-amber-400",
    dotColor: "bg-amber-400",
    badgeBg: "bg-amber-400/15",
    badgeText: "text-amber-400",
    steps: [
      {
        step: 1,
        action: "Open the moderator console",
        url: `${BASE_URL}/moderator/q4-earnings-2026`,
        note: "You will see the incoming Q&A queue with AI priority scores, sentiment tags, and compliance flags.",
      },
      {
        step: 2,
        action: "Approve and reject questions",
        note: "Click Approve on a question to move it to the \"Approved\" queue. Click Reject to remove it. Test the toxicity filter.",
      },
      {
        step: 3,
        action: "Launch a live poll",
        note: "Click \"New Poll\", enter a question and 3 options, and click Launch. Verify the poll appears in the attendee event room simultaneously.",
      },
      {
        step: 4,
        action: "Monitor the live sentiment graph",
        note: "Observe the real-time sentiment indicator. Verify it updates as the transcript progresses.",
      },
    ],
  },
  {
    id: "presenter",
    number: "4",
    title: "Presenter Teleprompter",
    role: "Presenter",
    roleColor: "text-red-400",
    dotColor: "bg-red-400",
    badgeBg: "bg-red-400/15",
    badgeText: "text-red-400",
    steps: [
      {
        step: 1,
        action: "Open the presenter view",
        url: `${BASE_URL}/presenter/q4-earnings-2026`,
        note: "Designed for a second screen or tablet. Shows the live transcript in large text with pace coaching and filler-word alerts.",
      },
      {
        step: 2,
        action: "Check the pace coaching indicator",
        note: "Verify the words-per-minute indicator is visible. Check that the \"Too Fast / On Track / Too Slow\" indicator updates in real time.",
      },
      {
        step: 3,
        action: "View the approved Q&A feed",
        note: "Questions approved by the moderator should appear in the lower panel within 2 seconds.",
      },
    ],
  },
  {
    id: "operator",
    number: "5",
    title: "Operator Console",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    badgeBg: "bg-emerald-400/15",
    badgeText: "text-emerald-400",
    steps: [
      {
        step: 1,
        action: "Open the operator console",
        url: `${BASE_URL}/operator/q4-earnings-2026`,
        note: "Review all platform connection options: Zoom, Teams, Webex, RTMP, and PSTN.",
      },
      {
        step: 2,
        action: "Review the RTMP stream key and platform connections",
        note: "Verify Zoom, Teams, Webex, and RTMP connection options are visible and configurable.",
      },
      {
        step: 3,
        action: "Test the silence detector alert",
        note: "Verify the silence detection threshold is configurable and the alert notification displays correctly.",
      },
      {
        step: 4,
        action: "Confirm 18-country dial-in numbers",
        note: "Scroll through the dial-in panel. Confirm SA, Nigeria, Kenya, UAE, and Mauritius are listed.",
      },
    ],
  },
  {
    id: "postevent",
    number: "6",
    title: "Post-Event Report",
    role: "Post-Event",
    roleColor: "text-violet-400",
    dotColor: "bg-violet-400",
    badgeBg: "bg-violet-400/15",
    badgeText: "text-violet-400",
    steps: [
      {
        step: 1,
        action: "Open the post-event report",
        url: `${BASE_URL}/post-event/q4-earnings-2026`,
        note: "Review the AI executive summary, financial highlights, and key themes sections.",
      },
      {
        step: 2,
        action: "Download the full transcript",
        note: "Click \"Download Transcript\". Verify the PDF downloads correctly with all content.",
      },
      {
        step: 3,
        action: "Generate the press release",
        note: "Click \"Generate Press Release\". Verify the SENS/RNS-style draft is produced within 10 seconds.",
      },
      {
        step: 4,
        action: "Check JSE/IFRS compliance section",
        note: "Verify the regulatory flags and compliance disclaimer are visible at the bottom of the report.",
      },
    ],
  },
  {
    id: "whitelabel",
    number: "7",
    title: "White-Label & Integrations",
    role: "All Roles",
    roleColor: "text-slate-400",
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-400/15",
    badgeText: "text-slate-400",
    steps: [
      {
        step: 1,
        action: "Open the white-label configuration",
        url: `${BASE_URL}/white-label`,
        note: "Upload a test logo, change the brand colour, and preview the live result in real time.",
      },
      {
        step: 2,
        action: "Open the Integration Hub",
        url: `${BASE_URL}/integrations`,
        note: "Review the platform comparison table. Verify Zoom, Teams, Webex, RTMP, and PSTN are listed.",
      },
      {
        step: 3,
        action: "Open the Partner API page",
        url: `${BASE_URL}/partner-api`,
        note: "Review the webhook events, REST API endpoints, and embeddable widget documentation.",
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
      title="Copy URL"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
      )}
    </button>
  );
}

function SectionCard({ section }: { section: Section }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const allDone = section.steps.every((s) => checked[s.step]);

  return (
    <div
      className={`rounded-xl border transition-all ${
        allDone
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-white/8 bg-white/[0.03]"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${section.dotColor}`} />
        <span className="font-semibold text-white text-sm flex-1">
          {section.number}. {section.title}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${section.badgeBg} ${section.badgeText}`}
        >
          {section.role}
        </span>
        {allDone && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            Done
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/5">
        {section.steps.map((step) => (
          <div
            key={step.step}
            className={`flex gap-3 px-5 py-3 transition-colors ${
              checked[step.step] ? "opacity-50" : ""
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() =>
                setChecked((prev) => ({ ...prev, [step.step]: !prev[step.step] }))
              }
              className="mt-0.5 flex-shrink-0"
            >
              <CheckCircle2
                className={`w-4 h-4 transition-colors ${
                  checked[step.step] ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"
                }`}
              />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-slate-600 mt-0.5 flex-shrink-0">
                  {String(step.step).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      checked[step.step] ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {step.action}
                  </p>
                  {step.url && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-sky-400 hover:text-sky-300 hover:underline truncate max-w-xs"
                      >
                        {step.url.replace("https://", "")}
                      </a>
                      <ExternalLink className="w-3 h-3 text-sky-500 flex-shrink-0" />
                      <CopyButton text={step.url} />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.note}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestGuide() {
  const [filter, setFilter] = useState<string>("all");

  const roles = [
    { id: "all", label: "All Roles", color: "text-slate-300" },
    { id: "Attendee", label: "Attendee", color: "text-blue-400" },
    { id: "Moderator", label: "Moderator", color: "text-amber-400" },
    { id: "Presenter", label: "Presenter", color: "text-red-400" },
    { id: "Operator", label: "Operator", color: "text-emerald-400" },
    { id: "Post-Event", label: "Post-Event", color: "text-violet-400" },
  ];

  const filtered =
    filter === "all"
      ? SECTIONS
      : SECTIONS.filter((s) => s.role === filter || s.role === "All Roles");

  return (
    <div
      className="min-h-screen bg-[#0a0e1a] text-foreground"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0a0e1a]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              ← Chorus.AI
            </a>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-semibold text-white">Team Testing Guide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
              Internal Use Only
            </span>
            <span className="text-[10px] text-slate-600 font-mono">v5 · March 2026</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Platform Testing Reference Card
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step-by-step instructions for testing every module of the Chorus.AI platform.
            Tick off each step as you complete it. Assign one person per role for best results.
            Estimated time: <strong className="text-slate-300">45 minutes</strong>.
          </p>
        </div>

        {/* Base URL bar */}
        <div className="flex items-center justify-between bg-[#0f1629] border border-[#1e3a5f] border-l-4 border-l-amber-400 rounded-lg px-5 py-3 mb-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Base URL</div>
            <div className="font-mono text-sm text-sky-400 font-bold">{BASE_URL}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>All links below are relative to this address</span>
            <CopyButton text={BASE_URL} />
          </div>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mr-1">Filter by role:</span>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setFilter(r.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === r.id
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Team assignment tip */}
        <div className="bg-white/[0.03] border border-white/8 rounded-lg px-5 py-3 mb-8 flex items-start gap-3">
          <div className="text-amber-400 text-lg flex-shrink-0 mt-0.5">💡</div>
          <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <p className="text-sm font-semibold text-slate-200 mb-1">Recommended team assignment for your first test session</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Assign one person per role: <span className="text-blue-400 font-medium">Attendee</span>, <span className="text-amber-400 font-medium">Moderator</span>, <span className="text-red-400 font-medium">Presenter</span>, <span className="text-emerald-400 font-medium">Operator</span>, and <span className="text-violet-400 font-medium">Post-Event</span>. Run all roles simultaneously to verify real-time sync between the Moderator Console, Presenter Teleprompter, and Event Room. The full test session takes approximately 45 minutes.
            </p>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 border-t border-white/8 pt-6 flex items-center justify-between">
          <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
            Chorus Call — Confidential · Internal Use Only · Do Not Distribute
          </p>
          <a
            href="/demo"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Sales Demo Page →
          </a>
        </div>
      </div>
    </div>
  );
}
