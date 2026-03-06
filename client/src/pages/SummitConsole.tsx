/**
 * CONTEX SUMMIT Windows Operator Console — Web Replication
 * Faithfully replicates the UI structure, layout, and functionality
 * of the Virgilio.exe / Summit WOC Windows application.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConferenceStatus = "Active" | "Idle" | "Hold";
type PartyStatus = "Connected" | "Hold" | "Muted" | "Disconnected";
type QAState = "OFF" | "ON";
type Tab = "active" | "idle" | "hold" | "incoming" | "signal" | "forwarding" | "alerts" | "res_alerts";

interface Conference {
  id: string;
  name: string;
  billingCode: string;
  status: ConferenceStatus;
  startTime: string;
  partition: string;
  parties: number;
  hold: boolean;
  info: string;
}

interface Party {
  id: number;
  role: "Host" | "Guest" | "Operator" | "Moderator";
  name: string;
  phone: string;
  quality: "Good" | "Fair" | "Poor";
  dnisDesc: string;
  userDefined: string;
  mode: "Listen" | "Talk" | "Muted" | "Hold";
  status: PartyStatus;
  connectTime: string;
  port: string;
}

interface QAItem {
  id: number;
  name: string;
  phone: string;
  question: string;
  state: "Waiting" | "Active" | "Done";
}

interface Signal {
  id: number;
  partyName: string;
  index: string;
  confOid: string;
  type: string;
}

interface IncomingCall {
  id: number;
  time: string;
  bridgeName: string;
  dnisAni: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONFERENCES: Conference[] = [
  { id: "C001", name: "Q4 2025 Earnings Call", billingCode: "BC-9921", status: "Active", startTime: "10:02:14", partition: "Partition 1", parties: 1247, hold: false, info: "JSE Listed — CuraLive Inc." },
  { id: "C002", name: "Annual Investor Day", billingCode: "BC-9922", status: "Idle", startTime: "—", partition: "Partition 1", parties: 0, hold: false, info: "Scheduled 15 Mar 09:00" },
  { id: "C003", name: "Board Strategy Briefing", billingCode: "BC-9923", status: "Hold", startTime: "14:01:55", partition: "Partition 2", parties: 24, hold: true, info: "Board members only" },
  { id: "C004", name: "JSE Analyst Briefing", billingCode: "BC-9924", status: "Active", startTime: "09:45:00", partition: "Partition 1", parties: 312, hold: false, info: "Quarterly results" },
];

const MOCK_PARTIES: Party[] = [
  { id: 1, role: "Host", name: "Sarah Dlamini", phone: "+27 11 555 0100", quality: "Good", dnisDesc: "JSE Earnings", userDefined: "CEO", mode: "Talk", status: "Connected", connectTime: "00:42:18", port: "P001" },
  { id: 2, role: "Moderator", name: "James Okafor", phone: "+27 21 555 0200", quality: "Good", dnisDesc: "JSE Earnings", userDefined: "CFO", mode: "Talk", status: "Connected", connectTime: "00:41:55", port: "P002" },
  { id: 3, role: "Guest", name: "Priya Naidoo", phone: "+27 31 555 0300", quality: "Fair", dnisDesc: "JSE Earnings", userDefined: "Goldman Sachs", mode: "Listen", status: "Connected", connectTime: "00:38:12", port: "P003" },
  { id: 4, role: "Guest", name: "Tom Barker", phone: "+44 20 555 0400", quality: "Good", dnisDesc: "JSE Earnings", userDefined: "JP Morgan", mode: "Muted", status: "Muted", connectTime: "00:35:04", port: "P004" },
  { id: 5, role: "Guest", name: "Lena Fischer", phone: "+49 30 555 0500", quality: "Poor", dnisDesc: "JSE Earnings", userDefined: "UBS", mode: "Listen", status: "Connected", connectTime: "00:29:44", port: "P005" },
  { id: 6, role: "Operator", name: "Chorus Operator 1", phone: "+27 11 555 0001", quality: "Good", dnisDesc: "OPS", userDefined: "Internal", mode: "Listen", status: "Connected", connectTime: "00:43:00", port: "P006" },
];

const MOCK_QA: QAItem[] = [
  { id: 1, name: "Priya Naidoo", phone: "+27 31 555 0300", question: "Can you provide more detail on the CuraLive revenue contribution in Q4?", state: "Active" },
  { id: 2, name: "Tom Barker", phone: "+44 20 555 0400", question: "What is the timeline for the native Microsoft Teams integration?", state: "Waiting" },
  { id: 3, name: "Lena Fischer", phone: "+49 30 555 0500", question: "How does the Recall.ai partnership affect your gross margin profile?", state: "Waiting" },
];

const MOCK_SIGNALS: Signal[] = [
  { id: 1, partyName: "Priya Naidoo", index: "003", confOid: "C001", type: "Q&A Request" },
  { id: 2, partyName: "Tom Barker", index: "004", confOid: "C001", type: "Operator Request" },
];

const MOCK_INCOMING: IncomingCall[] = [
  { id: 1, time: "10:44:02", bridgeName: "Bridge-ZA-01", dnisAni: "0800555019 / +27115550300" },
  { id: 2, time: "10:44:15", bridgeName: "Bridge-ZA-01", dnisAni: "0800555019 / +441715550400" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function WinButton({ children, onClick, disabled, className = "", title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-0.5 text-[11px] font-normal border border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#d4d0c8] text-black hover:bg-[#e0ddd5] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white disabled:opacity-50 disabled:cursor-default select-none ${className}`}
      style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
    >
      {children}
    </button>
  );
}

function WinTab({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-0.5 text-[11px] border-t border-l border-r select-none ${
        active
          ? "bg-[#d4d0c8] border-t-white border-l-white border-r-[#808080] -mb-px z-10 relative font-semibold"
          : "bg-[#c0bdb5] border-t-[#808080] border-l-[#808080] border-r-[#808080] text-[#444] mt-0.5"
      }`}
      style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
    >
      {label}{badge !== undefined && badge > 0 && <span className="ml-1 bg-red-600 text-white text-[9px] px-1 rounded-full">{badge}</span>}
    </button>
  );
}

function WinListHeader({ columns }: { columns: { label: string; width: string }[] }) {
  return (
    <div className="flex bg-[#d4d0c8] border-b border-[#808080]">
      {columns.map((col) => (
        <div
          key={col.label}
          className="text-[11px] px-1 py-0.5 border-r border-[#808080] font-semibold overflow-hidden whitespace-nowrap text-ellipsis flex-shrink-0 cursor-pointer hover:bg-[#c0bdb5] select-none"
          style={{ width: col.width, fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}

function StatusBar({ items }: { items: string[] }) {
  return (
    <div className="flex border-t border-[#808080] bg-[#d4d0c8] text-[11px]" style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}>
      {items.map((item, i) => (
        <div key={i} className="px-2 py-0.5 border-r border-[#808080] whitespace-nowrap">{item}</div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SummitConsole() {
  const [, navigate] = useLocation();
  const [selectedConf, setSelectedConf] = useState<Conference | null>(MOCK_CONFERENCES[0]);
  const [selectedParties, setSelectedParties] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [qaState, setQaState] = useState<QAState>("OFF");
  const [qaItems, setQaItems] = useState<QAItem[]>(MOCK_QA);
  const [parties, setParties] = useState<Party[]>(MOCK_PARTIES);
  const [conferences, setConferences] = useState<Conference[]>(MOCK_CONFERENCES);
  const [elapsedSeconds, setElapsedSeconds] = useState(2538); // 42:18
  const [showQA, setShowQA] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Not Connected");
  const [connected, setConnected] = useState(true);
  const [holdCount] = useState(0);
  const [sigCount] = useState(MOCK_SIGNALS.length);
  const [bellCount] = useState(0);
  const [inUse] = useState(1247);
  const [freeCount] = useState(253);
  const [userDefined, setUserDefined] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [dialout, setDialout] = useState(false);
  const [holdWait, setHoldWait] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [voip, setVoip] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-ZA");

  const togglePartySelect = (id: number) => {
    setSelectedParties((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const muteSelected = () => {
    setParties((prev) => prev.map((p) => selectedParties.includes(p.id) ? { ...p, mode: "Muted", status: "Muted" } : p));
    toast.info(`Muted ${selectedParties.length} party(ies)`);
  };

  const holdSelected = () => {
    setParties((prev) => prev.map((p) => selectedParties.includes(p.id) ? { ...p, mode: "Hold", status: "Hold" } : p));
    toast.info(`Held ${selectedParties.length} party(ies)`);
  };

  const disconnectSelected = () => {
    setParties((prev) => prev.filter((p) => !selectedParties.includes(p.id)));
    setSelectedParties([]);
    toast.info("Disconnected selected parties");
  };

  const qualityColor = (q: string) => q === "Good" ? "text-green-800" : q === "Fair" ? "text-amber-700" : "text-red-700";
  const statusColor = (s: string) => s === "Connected" ? "" : s === "Muted" ? "text-amber-700" : s === "Hold" ? "text-blue-700" : "text-red-700";

  return (
    <div
      className="flex flex-col bg-[#d4d0c8] text-black select-none overflow-hidden"
      style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif", fontSize: "11px", minHeight: "100vh" }}
    >
      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-0.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-[#d4d0c8] border border-[#808080] flex items-center justify-center text-[9px] font-bold">S</div>
          <span className="text-white text-[11px] font-bold" style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}>
            CONTEX SUMMIT Windows Operator Console — {selectedConf?.name ?? "No Conference Selected"}
          </span>
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => toast.info("Minimise")} className="w-5 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[9px] flex items-end justify-center pb-0.5 hover:bg-[#c0bdb5]">_</button>
          <button onClick={() => toast.info("Maximise")} className="w-5 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[9px] flex items-center justify-center hover:bg-[#c0bdb5]">□</button>
          <button onClick={() => navigate("/")} className="w-5 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[9px] flex items-center justify-center hover:bg-red-500 hover:text-white font-bold">✕</button>
        </div>
      </div>

      {/* ── Menu Bar ── */}
      <div className="flex items-center border-b border-[#808080] bg-[#d4d0c8] px-1 gap-0 flex-shrink-0">
        {[
          { label: "&File", items: ["Details", "Find", "Exit"] },
          { label: "&Edit", items: ["Select All", "Clear Fields"] },
          { label: "&Conference", items: ["Activate Passcode", "ActiveConf", "Clear Alert", "View Conferee List", "View History"] },
          { label: "&Name/Phone", items: ["Telephone Directory", "Speed Match", "Import List"] },
          { label: "&Utility", items: ["System Parameters", "View Log File", "View Error File", "View Operator List", "Operator Logins", "My Login Details", "Synchronize Linked Conferences", "Backup Passcode Dir", "Upload Passcode Dir", "Delete Passcode Dir"] },
          { label: "&Setup", items: ["Operator Connection", "Show Port Percentages", "System Parameters"] },
          { label: "&About", items: ["About Summit WOC", "View OpenSSL License"] },
        ].map(({ label, items }) => (
          <div key={label} className="relative group">
            <button
              className="px-2 py-0.5 text-[11px] hover:bg-[#0a246a] hover:text-white"
              style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
            >
              {label.replace("&", "")}
            </button>
            <div className="hidden group-hover:block absolute top-full left-0 z-50 bg-[#d4d0c8] border border-[#808080] shadow-md min-w-[180px]">
              {items.map((item) => (
                <button
                  key={item}
                  onClick={() => toast.info(item)}
                  className="block w-full text-left px-4 py-0.5 text-[11px] hover:bg-[#0a246a] hover:text-white whitespace-nowrap"
                  style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left Panel: Conference List ── */}
        <div className="flex flex-col border-r border-[#808080] bg-[#d4d0c8]" style={{ width: "260px", flexShrink: 0 }}>
          {/* Active Conferences header */}
          <div className="bg-[#0a246a] text-white text-[11px] px-2 py-0.5 font-bold flex items-center justify-between flex-shrink-0">
            <span>Active Conferences</span>
            <span className="text-[10px] font-normal">{conferences.filter(c => c.status === "Active").length} active</span>
          </div>

          {/* Tab strip */}
          <div className="flex border-b border-[#808080] bg-[#c0bdb5] flex-shrink-0 flex-wrap">
            {(["active", "idle", "hold", "incoming", "signal", "forwarding", "alerts", "res_alerts"] as Tab[]).map((t) => (
              <WinTab
                key={t}
                label={t === "active" ? "Active" : t === "idle" ? "Idle" : t === "hold" ? "Hold" : t === "incoming" ? "Incoming" : t === "signal" ? "Signal" : t === "forwarding" ? "Fwd" : t === "alerts" ? "Alerts" : "Res Alerts"}
                active={activeTab === t}
                onClick={() => setActiveTab(t)}
                badge={t === "signal" ? sigCount : t === "incoming" ? MOCK_INCOMING.length : undefined}
              />
            ))}
          </div>

          {/* Conference list */}
          <div className="flex-1 overflow-y-auto bg-white border border-[#808080] m-1">
            <WinListHeader columns={[
              { label: "Conference Name", width: "120px" },
              { label: "Hold", width: "30px" },
              { label: "Info", width: "80px" },
            ]} />
            <div>
              {(activeTab === "active" ? conferences.filter(c => c.status === "Active") :
                activeTab === "idle" ? conferences.filter(c => c.status === "Idle") :
                activeTab === "hold" ? conferences.filter(c => c.status === "Hold") :
                activeTab === "incoming" ? [] :
                activeTab === "signal" ? [] :
                conferences
              ).map((conf) => (
                <div
                  key={conf.id}
                  onClick={() => setSelectedConf(conf)}
                  className={`flex cursor-pointer hover:bg-[#0a246a] hover:text-white ${selectedConf?.id === conf.id ? "bg-[#0a246a] text-white" : ""}`}
                >
                  <div className="px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "120px" }}>{conf.name}</div>
                  <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "30px" }}>{conf.hold ? "✓" : ""}</div>
                  <div className="px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis flex-shrink-0" style={{ width: "80px" }}>{conf.info}</div>
                </div>
              ))}
              {activeTab === "incoming" && MOCK_INCOMING.map((inc) => (
                <div key={inc.id} className="flex cursor-pointer hover:bg-[#0a246a] hover:text-white">
                  <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "60px" }}>{inc.time}</div>
                  <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "80px" }}>{inc.bridgeName}</div>
                  <div className="px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis">{inc.dnisAni}</div>
                </div>
              ))}
              {activeTab === "signal" && MOCK_SIGNALS.map((sig) => (
                <div key={sig.id} className="flex cursor-pointer hover:bg-[#0a246a] hover:text-white">
                  <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "100px" }}>{sig.partyName}</div>
                  <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "40px" }}>{sig.index}</div>
                  <div className="px-1 py-0.5 overflow-hidden whitespace-nowrap text-ellipsis">{sig.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status counters */}
          <div className="border-t border-[#808080] bg-[#d4d0c8] px-2 py-1 text-[10px] grid grid-cols-2 gap-x-2 flex-shrink-0">
            <span>hold: &nbsp;&nbsp;{holdCount}</span>
            <span>sig: &nbsp;&nbsp;{sigCount}</span>
            <span>bell: &nbsp;&nbsp;{bellCount}</span>
            <span>in use: &nbsp;{inUse}</span>
            <span className="col-span-2">free: &nbsp;&nbsp;{freeCount}</span>
          </div>
        </div>

        {/* ── Right Panel: Conference Control ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* ── Conference Info Bar ── */}
          {selectedConf && (
            <div className="flex items-center gap-3 border-b border-[#808080] bg-[#d4d0c8] px-2 py-1 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Conf:</span>
                <span className="font-bold text-[11px]">{selectedConf.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Billing:</span>
                <span className="font-mono text-[11px]">{selectedConf.billingCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Start:</span>
                <span className="font-mono text-[11px]">{selectedConf.startTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Duration:</span>
                <span className="font-mono text-[11px] text-red-700 font-bold">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Parties:</span>
                <span className="font-bold text-[11px]">{parties.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#444]">Partition:</span>
                <span className="text-[11px]">{selectedConf.partition}</span>
              </div>
              <div className={`ml-auto px-2 py-0.5 text-[10px] font-bold border ${selectedConf.status === "Active" ? "bg-green-100 border-green-600 text-green-800" : selectedConf.status === "Hold" ? "bg-blue-100 border-blue-600 text-blue-800" : "bg-gray-100 border-gray-400 text-gray-600"}`}>
                {selectedConf.status.toUpperCase()}
              </div>
            </div>
          )}

          {/* ── Action Toolbar ── */}
          <div className="flex items-center gap-1 border-b border-[#808080] bg-[#d4d0c8] px-2 py-1 flex-shrink-0 flex-wrap">
            <WinButton onClick={() => { setPartyPhone(""); setPartyName(""); toast.info("Call dialog opened"); }} title="F3 Call">F3 &amp;Call</WinButton>
            <WinButton onClick={() => toast.info("OpJoin")} title="F4 Operator Join">F4 &amp;OpJoin</WinButton>
            <WinButton onClick={() => { if (selectedParties.length) { toast.info("Joined selected parties"); } else toast.error("Select parties first"); }} title="F5 Join">F5 &amp;Join</WinButton>
            <WinButton onClick={holdSelected} title="F6 Hold">F6 &amp;Hold</WinButton>
            <WinButton onClick={() => toast.info("TL/Mon")} title="F7 TL/Mon">F7 &amp;TL/Mon</WinButton>
            <WinButton onClick={() => toast.info("Discon Monitor")} title="F8 Disconnect Monitor">F8 D&amp;iscon</WinButton>
            <WinButton onClick={() => { setShowVoting(true); toast.info("Voting panel opened"); }} title="F9 Voting">F9 &amp;Voting</WinButton>
            <WinButton onClick={() => setShowQA(!showQA)} title="F10 Q&A" className={showQA ? "border-t-[#808080] border-l-[#808080] border-b-white border-r-white" : ""}>
              F10 Q&amp;A {qaState === "ON" ? "ON" : "OFF"}
            </WinButton>
            <div className="w-px h-4 bg-[#808080] mx-1" />
            <WinButton onClick={() => toast.info("Sub Conference")} title="Sub Conference">Su&amp;b Conf</WinButton>
            <WinButton onClick={() => toast.info("Play/Record")} title="Play/Record">Play/Record</WinButton>
            <WinButton onClick={() => toast.info("Transcribe")} title="Transcribe">Transcribe</WinButton>
            <WinButton onClick={() => toast.info("Conf Info")} title="Conf Info">Conf Info</WinButton>
            <WinButton onClick={() => setShowDetails(!showDetails)} title="Conf Detail">Conf Detail</WinButton>
            <div className="w-px h-4 bg-[#808080] mx-1" />
            <WinButton onClick={muteSelected} disabled={selectedParties.length === 0} title="Mute selected">Mute</WinButton>
            <WinButton onClick={disconnectSelected} disabled={selectedParties.length === 0} title="Disconnect selected" className="text-red-700">Disconnect</WinButton>
          </div>

          {/* ── Party Entry Fields ── */}
          <div className="flex items-center gap-2 border-b border-[#808080] bg-[#d4d0c8] px-2 py-1 flex-shrink-0 flex-wrap">
            <label className="text-[11px]">Name:</label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white px-1 py-0.5 text-[11px] w-32 focus:outline-none"
              style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
            />
            <label className="text-[11px]">Phone:</label>
            <input
              type="text"
              value={partyPhone}
              onChange={(e) => setPartyPhone(e.target.value)}
              className="border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white px-1 py-0.5 text-[11px] w-36 focus:outline-none"
              style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
            />
            <div className="flex items-center gap-1">
              <input type="checkbox" id="dialout" checked={dialout} onChange={(e) => setDialout(e.target.checked)} className="w-3 h-3" />
              <label htmlFor="dialout" className="text-[11px]">Dialout</label>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" id="holdwait" checked={holdWait} onChange={(e) => setHoldWait(e.target.checked)} className="w-3 h-3" />
              <label htmlFor="holdwait" className="text-[11px]">Hold/Wait</label>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" id="joinmode" checked={joinMode} onChange={(e) => setJoinMode(e.target.checked)} className="w-3 h-3" />
              <label htmlFor="joinmode" className="text-[11px]">Join Mode</label>
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" id="voip" checked={voip} onChange={(e) => setVoip(e.target.checked)} className="w-3 h-3" />
              <label htmlFor="voip" className="text-[11px]">VoIP</label>
            </div>
            <label className="text-[11px] ml-2">User Def:</label>
            <input
              type="text"
              value={userDefined}
              onChange={(e) => setUserDefined(e.target.value)}
              className="border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white px-1 py-0.5 text-[11px] w-24 focus:outline-none"
              style={{ fontFamily: "MS Sans Serif, Tahoma, sans-serif" }}
            />
          </div>

          {/* ── Party List ── */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto bg-white border border-[#808080] m-1">
              <WinListHeader columns={[
                { label: "Role", width: "70px" },
                { label: "Name", width: "130px" },
                { label: "Phone", width: "130px" },
                { label: "Quality", width: "55px" },
                { label: "DNIS Description", width: "110px" },
                { label: "User Defined", width: "90px" },
                { label: "Mode", width: "60px" },
                { label: "Status", width: "80px" },
                { label: "Connect Time", width: "80px" },
                { label: "Port", width: "50px" },
              ]} />
              <div>
                {parties.map((party) => (
                  <div
                    key={party.id}
                    onClick={() => togglePartySelect(party.id)}
                    className={`flex cursor-pointer hover:bg-[#cce8ff] ${selectedParties.includes(party.id) ? "bg-[#0a246a] text-white" : party.id % 2 === 0 ? "bg-[#f5f5f5]" : "bg-white"}`}
                  >
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] font-semibold" style={{ width: "70px" }}>{party.role}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: "130px" }}>{party.name}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] font-mono" style={{ width: "130px" }}>{party.phone}</div>
                    <div className={`px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] ${selectedParties.includes(party.id) ? "" : qualityColor(party.quality)}`} style={{ width: "55px" }}>{party.quality}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: "110px" }}>{party.dnisDesc}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: "90px" }}>{party.userDefined}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5]" style={{ width: "60px" }}>{party.mode}</div>
                    <div className={`px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] ${selectedParties.includes(party.id) ? "" : statusColor(party.status)}`} style={{ width: "80px" }}>{party.status}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] font-mono" style={{ width: "80px" }}>{party.connectTime}</div>
                    <div className="px-1 py-0.5 flex-shrink-0 font-mono" style={{ width: "50px" }}>{party.port}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Q&A Panel ── */}
            {showQA && (
              <div className="border-t border-[#808080] bg-[#d4d0c8] flex-shrink-0" style={{ height: "180px" }}>
                <div className="bg-[#0a246a] text-white text-[11px] px-2 py-0.5 font-bold flex items-center justify-between">
                  <span>Question and Answer</span>
                  <div className="flex gap-1">
                    <WinButton onClick={() => { setQaState(qaState === "OFF" ? "ON" : "OFF"); toast.info(`Q&A ${qaState === "OFF" ? "started" : "stopped"}`); }}>
                      Start Q&amp;A: {qaState}
                    </WinButton>
                    <WinButton onClick={() => toast.info("Queue cleared")}>Clear Queue</WinButton>
                    <WinButton onClick={() => setShowQA(false)}>Close</WinButton>
                  </div>
                </div>
                <div className="flex gap-2 p-1 h-full overflow-hidden">
                  {/* Question Queue */}
                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] font-bold mb-0.5">Question Queue</div>
                    <div className="flex-1 overflow-y-auto bg-white border border-[#808080]">
                      <WinListHeader columns={[{ label: "Name", width: "100px" }, { label: "Question", width: "200px" }, { label: "State", width: "60px" }]} />
                      {qaItems.filter(q => q.state !== "Done").map((q) => (
                        <div key={q.id} onClick={() => setQaItems(items => items.map(i => i.id === q.id ? { ...i, state: "Active" } : i))} className="flex cursor-pointer hover:bg-[#cce8ff]">
                          <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: "100px" }}>{q.name}</div>
                          <div className="px-1 py-0.5 flex-shrink-0 border-r border-[#e0ddd5] overflow-hidden whitespace-nowrap text-ellipsis" style={{ width: "200px" }}>{q.question}</div>
                          <div className={`px-1 py-0.5 flex-shrink-0 text-[10px] font-bold ${q.state === "Active" ? "text-green-700" : "text-amber-700"}`} style={{ width: "60px" }}>{q.state}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Moderator List */}
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold">Moderator List</div>
                    <div className="bg-white border border-[#808080] overflow-y-auto" style={{ width: "120px", minHeight: "60px" }}>
                      {parties.filter(p => p.role === "Moderator" || p.role === "Host").map(p => (
                        <div key={p.id} className="px-1 py-0.5 text-[10px] hover:bg-[#cce8ff] cursor-pointer">{p.name}</div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <WinButton onClick={() => toast.info("Play Name")}>Play Name</WinButton>
                      <WinButton onClick={() => { setQaItems(items => items.map(i => i.state === "Active" ? { ...i, state: "Done" } : i)); toast.info("Question cleared"); }}>Clear Question</WinButton>
                      <WinButton onClick={() => toast.info("Remove Selection")}>Remove Selection</WinButton>
                      <WinButton onClick={() => { setQaItems(items => items.map(i => i.state !== "Done" ? { ...i, state: "Done" } : i)); toast.info("Queue cleared"); }}>Clear Queue</WinButton>
                      <WinButton onClick={() => { setQaState("OFF"); setShowQA(false); toast.info("Q&A closed"); }}>Rec. Name Off</WinButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Conference Details Panel ── */}
            {showDetails && selectedConf && (
              <div className="border-t border-[#808080] bg-[#d4d0c8] flex-shrink-0 p-2">
                <div className="bg-[#0a246a] text-white text-[11px] px-2 py-0.5 font-bold flex items-center justify-between mb-1">
                  <span>Conf Detail</span>
                  <WinButton onClick={() => setShowDetails(false)}>Close</WinButton>
                </div>
                <div className="grid grid-cols-4 gap-x-4 gap-y-0.5 text-[11px]">
                  {[
                    ["Conference Name", selectedConf.name],
                    ["Billing Code", selectedConf.billingCode],
                    ["Start Time", selectedConf.startTime],
                    ["Duration", formatTime(elapsedSeconds)],
                    ["Partition", selectedConf.partition],
                    ["Status", selectedConf.status],
                    ["Parties Connected", String(parties.length)],
                    ["Bridge", "Bridge-ZA-01"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-1">
                      <span className="text-[#444]">{k}:</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar items={[
        connected ? `Connected: Bridge-ZA-01` : "Not Connected",
        `Time: ${timeStr}`,
        `Date: ${dateStr}`,
        `Operator: Chorus Operator 1`,
        selectedParties.length > 0 ? `${selectedParties.length} party(ies) selected` : "No selection",
        `Audio Prob: 0`,
        `Res Alerts: 0`,
        `Free Ports: ${freeCount}`,
      ]} />
    </div>
  );
}
