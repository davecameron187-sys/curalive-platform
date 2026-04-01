import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

type BridgeEvent = {
  id: number;
  name: string;
  organiserName: string | null;
  status: string;
  accessCode: string | null;
  dialInNumber: string | null;
};

type Conference = {
  id: number;
  type: string;
  phase: string;
  isRecording: boolean;
  isLocked: boolean;
  qaActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
};

type Participant = {
  id: number;
  name: string | null;
  organisation: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  connectionMethod: string | null;
  isMuted: boolean;
  isOnHold: boolean;
  handRaised: boolean;
  joinTime: string | null;
  notes: string | null;
};

type GreeterEntry = {
  id: number;
  phoneNumber: string | null;
  voiceNameUrl: string | null;
  voiceOrgUrl: string | null;
  transcribedName: string | null;
  transcribedOrg: string | null;
  queuedAt: string;
};

type QaQuestion = {
  id: number;
  participantId: number | null;
  questionText: string | null;
  method: string | null;
  queuePosition: number | null;
  status: string;
  raisedAt: string;
};

type LogEntry = {
  id: number;
  action: string;
  category: string | null;
  performedAt: string;
  metadata: string | null;
};

const OPERATOR_STATES = [
  { key: "available", label: "AVAILABLE" },
  { key: "in_event", label: "IN EVENT" },
  { key: "on_assist", label: "ON ASSIST" },
  { key: "on_break", label: "ON BREAK" },
  { key: "wrap_up", label: "WRAP-UP" },
] as const;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "speakers", label: "Speakers" },
  { key: "attendees", label: "Attendees" },
  { key: "waiting", label: "Waiting" },
  { key: "muted", label: "Muted" },
  { key: "hand", label: "✋ Hand Raised" },
  { key: "phone", label: "Phone" },
  { key: "web", label: "Web" },
] as const;

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function BridgeConsole({ initialEventId }: { initialEventId?: number } = {}) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(initialEventId ?? null);
  const [showEventSelector, setShowEventSelector] = useState(!initialEventId);
  const [operatorState, setOperatorState] = useState<string>("available");
  const [showOpDropdown, setShowOpDropdown] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showDialoutForm, setShowDialoutForm] = useState(false);
  const [showAssistPanel, setShowAssistPanel] = useState(false);
  const [assistTarget, setAssistTarget] = useState<Participant | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitorTarget, setMonitorTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [localLogs, setLocalLogs] = useState<Array<{ time: string; cat: string; catLabel: string; text: string }>>([]);
  const timerRef = useRef<any>(null);

  const [doName, setDoName] = useState("");
  const [doOrg, setDoOrg] = useState("");
  const [doPhone, setDoPhone] = useState("");
  const [doRole, setDoRole] = useState<"participant" | "presenter" | "observer">("participant");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventOrganiser, setNewEventOrganiser] = useState("");

  const eventsQuery = trpc.bridgeConsole.getEvents.useQuery();
  const eventQuery = trpc.bridgeConsole.getEvent.useQuery(
    { id: selectedEventId! },
    { enabled: !!selectedEventId, refetchInterval: 3000 }
  );
  const logQuery = trpc.bridgeConsole.getOperatorLog.useQuery(
    { conferenceId: eventQuery.data?.mainConf?.id! },
    { enabled: !!eventQuery.data?.mainConf?.id, refetchInterval: 5000 }
  );

  const createEventMut = trpc.bridgeConsole.createEvent.useMutation();
  const openConfMut = trpc.bridgeConsole.openConference.useMutation();
  const endConfMut = trpc.bridgeConsole.endConference.useMutation();
  const toggleLockMut = trpc.bridgeConsole.toggleLock.useMutation();
  const toggleRecMut = trpc.bridgeConsole.toggleRecording.useMutation();
  const toggleQAMut = trpc.bridgeConsole.toggleQA.useMutation();
  const admitMut = trpc.bridgeConsole.admitCaller.useMutation();
  const rejectMut = trpc.bridgeConsole.rejectCaller.useMutation();
  const dialOutMut = trpc.bridgeConsole.dialOut.useMutation();
  const muteMut = trpc.bridgeConsole.muteParticipant.useMutation();
  const holdMut = trpc.bridgeConsole.holdParticipant.useMutation();
  const removeMut = trpc.bridgeConsole.removeParticipant.useMutation();
  const muteAllMut = trpc.bridgeConsole.muteAll.useMutation();
  const unmuteAllMut = trpc.bridgeConsole.unmuteAll.useMutation();
  const approveQMut = trpc.bridgeConsole.approveQuestion.useMutation();
  const takeQMut = trpc.bridgeConsole.takeQuestion.useMutation();
  const doneQMut = trpc.bridgeConsole.doneQuestion.useMutation();
  const dismissQMut = trpc.bridgeConsole.dismissQuestion.useMutation();
  const skipQMut = trpc.bridgeConsole.skipQuestion.useMutation();
  const raiseHandMut = trpc.bridgeConsole.raiseHand.useMutation();

  const event = eventQuery.data?.event;
  const mainConf = eventQuery.data?.mainConf;
  const participants = eventQuery.data?.participants ?? [];
  const greeterQueue = eventQuery.data?.greeterQueue ?? [];
  const qaQuestions = eventQuery.data?.qaQuestions ?? [];

  const isLive = mainConf?.phase === "live";
  const isEnded = mainConf?.phase === "ended";
  const isRec = mainConf?.isRecording ?? false;
  const isLocked = mainConf?.isLocked ?? false;
  const isQAOpen = mainConf?.qaActive ?? false;

  useEffect(() => {
    if (isLive && mainConf?.startedAt) {
      const startTime = new Date(mainConf.startedAt).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if (!isLive) {
      clearInterval(timerRef.current);
    }
  }, [isLive, mainConf?.startedAt]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addLocalLog = useCallback((cat: string, catLabel: string, text: string) => {
    setLocalLogs(prev => [{
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      cat, catLabel, text,
    }, ...prev].slice(0, 100));
  }, []);

  const activeParticipants = participants.filter(p =>
    !["left", "removed", "failed"].includes(p.status)
  );

  const presenters = activeParticipants.filter(p => p.role === "presenter");
  const attendees = activeParticipants.filter(p => p.role === "participant" || p.role === "observer");
  const invited = participants.filter(p => p.status === "invited");

  const filteredParticipants = (list: Participant[]) => {
    if (filter === "all") return list;
    if (filter === "speakers") return list.filter(p => p.role === "presenter");
    if (filter === "attendees") return list.filter(p => p.role !== "presenter");
    if (filter === "waiting") return list.filter(p => ["invited", "lobby"].includes(p.status));
    if (filter === "muted") return list.filter(p => p.isMuted);
    if (filter === "hand") return list.filter(p => p.handRaised);
    if (filter === "phone") return list.filter(p => p.connectionMethod === "phone");
    if (filter === "web") return list.filter(p => p.connectionMethod === "web");
    return list;
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    const result = await createEventMut.mutateAsync({
      name: newEventName,
      organiserName: newEventOrganiser || undefined,
    });
    setSelectedEventId(result.event.id);
    setShowEventSelector(false);
    setShowCreateEvent(false);
    showToast("Bridge event created — access code: " + result.accessCode);
    eventsQuery.refetch();
  };

  const handleOpenConference = async () => {
    if (!mainConf) return;
    if (isLive) {
      await endConfMut.mutateAsync({ conferenceId: mainConf.id });
      addLocalLog("conference", "CONF", "Conference ended — generating attendance report");
      setOperatorState("wrap_up");
      showToast("Call ended — wrap-up mode started");
    } else {
      await openConfMut.mutateAsync({ conferenceId: mainConf.id });
      if (!isRec) {
        await toggleRecMut.mutateAsync({ conferenceId: mainConf.id, recording: true });
      }
      addLocalLog("conference", "CONF", `Conference opened — ${activeParticipants.length} participants, lecture mode active`);
      setOperatorState("in_event");
      showToast("Conference opened — lecture mode active");
    }
    eventQuery.refetch();
  };

  const handleToggleLock = async () => {
    if (!mainConf) return;
    await toggleLockMut.mutateAsync({ conferenceId: mainConf.id, locked: !isLocked });
    addLocalLog("operator", "OPER", isLocked ? "Conference unlocked" : "Conference locked — no new joiners");
    showToast(isLocked ? "Conference unlocked" : "Conference locked");
    eventQuery.refetch();
  };

  const handleToggleRec = async () => {
    if (!mainConf) return;
    await toggleRecMut.mutateAsync({ conferenceId: mainConf.id, recording: !isRec });
    addLocalLog("operator", "OPER", isRec ? "Recording paused" : "Recording started");
    showToast(isRec ? "Recording paused" : "Recording started");
    eventQuery.refetch();
  };

  const handleToggleQA = async () => {
    if (!mainConf) return;
    await toggleQAMut.mutateAsync({ conferenceId: mainConf.id, active: !isQAOpen });
    addLocalLog("qa", "Q&A", isQAOpen ? "Q&A closed by operator" : "Q&A opened — participants can press *2 to raise hand");
    showToast(isQAOpen ? "Q&A closed" : "Q&A open — press *2 to raise hand");
    eventQuery.refetch();
  };

  const handleAdmit = async (g: GreeterEntry, name: string, org: string, role: "presenter" | "participant" | "observer") => {
    if (!mainConf) return;
    await admitMut.mutateAsync({
      greeterId: g.id,
      conferenceId: mainConf.id,
      name,
      organisation: org,
      role,
    });
    addLocalLog("operator", "OPER", `Admitted ${name} (${org}) from greeter queue`);
    showToast(`${name} from ${org} admitted — muted`);
    eventQuery.refetch();
  };

  const handleReject = async (g: GreeterEntry) => {
    if (!mainConf) return;
    await rejectMut.mutateAsync({ greeterId: g.id, conferenceId: mainConf.id });
    addLocalLog("operator", "OPER", "Caller rejected from greeter queue");
    showToast("Caller rejected — goodbye message played");
    eventQuery.refetch();
  };

  const handleDialOut = async () => {
    if (!mainConf || !event || !doPhone.trim()) return;
    await dialOutMut.mutateAsync({
      bridgeEventId: event.id,
      conferenceId: mainConf.id,
      name: doName,
      organisation: doOrg,
      phoneNumber: doPhone,
      role: doRole,
    });
    addLocalLog("operator", "OPER", `Dialing out to ${doName} (${doOrg})`);
    showToast(`Calling ${doName}...`);
    setShowDialoutForm(false);
    setDoName(""); setDoOrg(""); setDoPhone("");
    eventQuery.refetch();
  };

  const handleMute = async (p: Participant, muted: boolean) => {
    if (!mainConf) return;
    await muteMut.mutateAsync({ participantId: p.id, conferenceId: mainConf.id, muted });
    addLocalLog("operator", "OPER", `${p.name} ${muted ? "muted" : "unmuted"}`);
    showToast(`${p.name} ${muted ? "muted" : "unmuted"}`);
    eventQuery.refetch();
  };

  const handleHold = async (p: Participant) => {
    if (!mainConf) return;
    await holdMut.mutateAsync({ participantId: p.id, conferenceId: mainConf.id, hold: !p.isOnHold });
    showToast(`${p.name} ${p.isOnHold ? "taken off hold" : "on hold"}`);
    eventQuery.refetch();
  };

  const handleRemove = async (p: Participant) => {
    if (!mainConf) return;
    await removeMut.mutateAsync({ participantId: p.id, conferenceId: mainConf.id });
    addLocalLog("operator", "OPER", `Removed ${p.name}`);
    showToast(`${p.name} removed`);
    eventQuery.refetch();
  };

  const handleMuteAll = async () => {
    if (!mainConf) return;
    await muteAllMut.mutateAsync({ conferenceId: mainConf.id });
    showToast("All participants muted");
    eventQuery.refetch();
  };

  const handleUnmuteAll = async () => {
    if (!mainConf) return;
    await unmuteAllMut.mutateAsync({ conferenceId: mainConf.id });
    showToast("All participants unmuted");
    eventQuery.refetch();
  };

  const handleAddToQA = async (p: Participant) => {
    if (!mainConf) return;
    await raiseHandMut.mutateAsync({
      conferenceId: mainConf.id,
      participantId: p.id,
      method: "operator_added",
    });
    addLocalLog("qa", "Q&A", `${p.name} added to participation queue`);
    showToast(`${p.name} added to Q&A queue`);
    eventQuery.refetch();
  };

  const handleApproveQ = async (q: QaQuestion) => {
    if (!mainConf) return;
    await approveQMut.mutateAsync({ questionId: q.id, conferenceId: mainConf.id });
    showToast("Question approved");
    eventQuery.refetch();
  };

  const handleTakeQ = async (q: QaQuestion) => {
    if (!mainConf) return;
    await takeQMut.mutateAsync({ questionId: q.id, conferenceId: mainConf.id });
    const p = participants.find(pp => pp.id === q.participantId);
    addLocalLog("qa", "Q&A", `Taking question from ${p?.name ?? "Unknown"}`);
    showToast("Question live — participant unmuted");
    eventQuery.refetch();
  };

  const handleDoneQ = async (q: QaQuestion) => {
    if (!mainConf) return;
    await doneQMut.mutateAsync({ questionId: q.id, conferenceId: mainConf.id });
    showToast("Question done — participant remuted");
    eventQuery.refetch();
  };

  const handleDismissQ = async (q: QaQuestion) => {
    if (!mainConf) return;
    await dismissQMut.mutateAsync({ questionId: q.id, conferenceId: mainConf.id });
    showToast("Question dismissed");
    eventQuery.refetch();
  };

  const handleSkipQ = async (q: QaQuestion) => {
    if (!mainConf) return;
    await skipQMut.mutateAsync({ questionId: q.id, conferenceId: mainConf.id });
    showToast("Question skipped to end");
    eventQuery.refetch();
  };

  if (showEventSelector) {
    return (
      <div style={styles.root}>
        <div style={styles.eventSelector}>
          <div style={styles.logoLarge}>CURA<span style={{ color: "#c8d8e8" }}>LIVE</span></div>
          <div style={{ fontSize: 13, color: "#4a6070", marginBottom: 24, letterSpacing: ".08em" }}>BRIDGE CONSOLE</div>

          {!showCreateEvent ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <button style={styles.createBtn} onClick={() => setShowCreateEvent(true)}>
                  + NEW BRIDGE EVENT
                </button>
              </div>

              <div style={{ fontSize: 9, color: "#4a6070", fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>
                EXISTING EVENTS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflow: "auto" }}>
                {eventsQuery.data?.map(ev => (
                  <button
                    key={ev.id}
                    style={styles.eventCard}
                    onClick={() => { setSelectedEventId(ev.id); setShowEventSelector(false); }}
                  >
                    <div style={{ fontSize: 12, color: "#c8d8e8", fontWeight: 700 }}>{ev.name}</div>
                    <div style={{ fontSize: 9, color: "#4a6070" }}>
                      {ev.status.toUpperCase()} · Code: {ev.accessCode}
                    </div>
                  </button>
                ))}
                {eventsQuery.data?.length === 0 && (
                  <div style={{ fontSize: 10, color: "#2a3a4a", textAlign: "center", padding: 20 }}>
                    No bridge events yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
              <input
                style={styles.input}
                placeholder="Event name (e.g. Q2 2026 Investor Day)"
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Organiser name (optional)"
                value={newEventOrganiser}
                onChange={e => setNewEventOrganiser(e.target.value)}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button style={styles.admitBtn} onClick={handleCreateEvent}>CREATE</button>
                <button style={styles.cancelBtn} onClick={() => setShowCreateEvent(false)}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const serverLogs = logQuery.data ?? [];
  const combinedLogs = [
    ...localLogs.map((l, i) => ({ ...l, id: `local-${i}` })),
    ...serverLogs.map(l => ({
      id: `server-${l.id}`,
      time: formatTime(l.performedAt),
      cat: l.category ?? "system",
      catLabel: (l.category ?? "SYS").toUpperCase().substring(0, 4),
      text: l.action.replace(/_/g, " "),
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 50);

  const phasePillClass = isLive ? "live" : isEnded ? "ended" : "lobby";
  const phaseLabel = isLive ? "LIVE" : isEnded ? "ENDED" : "LOBBY";

  const activeQa = qaQuestions.filter(q => !["answered", "dismissed"].includes(q.status));

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <div style={styles.hdr}>
        <div style={styles.logo}>CURA<span style={{ color: "#c8d8e8", fontStyle: "normal" }}>LIVE</span></div>
        <div style={styles.hdrEvent}>{event?.name ?? "Bridge Console"}</div>
        <div style={styles.hdrCenter}>
          <div style={{ ...styles.phasePill, ...styles[`phase_${phasePillClass}` as keyof typeof styles] as any }}>
            {phaseLabel}
          </div>
          <div style={styles.dur}>{formatDuration(elapsed)}</div>
          {isMonitoring && (
            <div style={styles.monitorBadge}>
              {monitorTarget ? `MON: ${monitorTarget}` : "MONITORING"}
            </div>
          )}
        </div>
        <div style={styles.hdrRight}>
          <div
            style={{ ...styles.opState, ...styles[`op_${operatorState}` as keyof typeof styles] as any }}
            onClick={() => setShowOpDropdown(!showOpDropdown)}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
            <span>{OPERATOR_STATES.find(s => s.key === operatorState)?.label}</span>
            {showOpDropdown && (
              <div style={styles.opDropdown}>
                {OPERATOR_STATES.map(s => (
                  <div
                    key={s.key}
                    style={styles.opDdItem}
                    onClick={(e) => { e.stopPropagation(); setOperatorState(s.key); setShowOpDropdown(false); addLocalLog("operator", "OPER", `Operator state: ${s.label}`); showToast(`State: ${s.label}`); }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{ ...styles.hpill, ...(isRec ? styles.hpillRecOn : {}) }}
            onClick={handleToggleRec}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: isRec ? "#e05050" : "#4a6070" }} />
            <span>REC</span>
          </div>

          <div
            style={{ ...styles.hpill, ...(isLocked ? styles.hpillLocked : {}) }}
            onClick={handleToggleLock}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
            <span>{isLocked ? "LOCKED" : "UNLOCKED"}</span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={styles.body}>
        <div style={styles.bridgeLayout}>
          {/* GREETER QUEUE COLUMN */}
          <div style={styles.greeterCol}>
            <div style={styles.colHdr}>
              <div style={styles.colTitle}>GREETER QUEUE</div>
              <div style={styles.badgeBlue}>{greeterQueue.length}</div>
            </div>
            <div style={styles.colBody}>
              {greeterQueue.length === 0 ? (
                <div style={styles.emptyState}>No callers waiting</div>
              ) : (
                greeterQueue.map(g => (
                  <GreeterCard key={g.id} entry={g} onAdmit={handleAdmit} onReject={handleReject} showToast={showToast} />
                ))
              )}
            </div>
          </div>

          {/* ROSTER COLUMN */}
          <div style={styles.rosterCol}>
            <div style={styles.rosterHdr}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={styles.colTitle}>PARTICIPANTS</div>
                <div style={styles.badgeTeal}>{activeParticipants.length}</div>
              </div>
              <button style={styles.dialoutBtn} onClick={() => setShowDialoutForm(!showDialoutForm)}>
                + DIAL OUT
              </button>
            </div>

            <div style={styles.filterStrip}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  style={{ ...styles.flt, ...(filter === f.key ? styles.fltActive : {}) }}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={styles.rosterBody}>
              {/* ASSIST PANEL */}
              {showAssistPanel && assistTarget && (
                <div style={styles.assistPanel}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#c87010", letterSpacing: ".08em" }}>
                      ASSIST MODE — PARTICIPANT SUPPORT
                    </div>
                    <div style={{ fontSize: 13, color: "#4a6070", cursor: "pointer" }} onClick={() => setShowAssistPanel(false)}>
                      ×
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#c8d8e8" }}>{assistTarget.name}</div>
                  <div style={{ fontSize: 9, color: "#4a6070", marginBottom: 7 }}>
                    {assistTarget.organisation} · {assistTarget.connectionMethod}
                  </div>
                  <select style={styles.assistSelect}>
                    <option value="">Select issue...</option>
                    <option value="wrong_pin">Wrong PIN</option>
                    <option value="bad_audio">Bad audio</option>
                    <option value="lost_connection">Lost connection</option>
                    <option value="vip_support">VIP support</option>
                    <option value="other">Other</option>
                  </select>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                    <button style={styles.abtn} onClick={() => { setShowAssistPanel(false); showToast("Resolved"); }}>DONE</button>
                    <button style={{ ...styles.abtn, color: "#e05050" }} onClick={() => { handleRemove(assistTarget); setShowAssistPanel(false); }}>REMOVE</button>
                  </div>
                </div>
              )}

              {/* DIAL OUT FORM */}
              {showDialoutForm && (
                <div style={styles.dialoutForm}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#4a6070", letterSpacing: ".08em", marginBottom: 7 }}>
                    DIAL OUT TO PARTICIPANT
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                    <input style={styles.doInput} placeholder="Full name" value={doName} onChange={e => setDoName(e.target.value)} />
                    <input style={styles.doInput} placeholder="Organisation" value={doOrg} onChange={e => setDoOrg(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                    <input style={{ ...styles.doInput, flex: 2 }} placeholder="+44XXXXXXXXXX" value={doPhone} onChange={e => setDoPhone(e.target.value)} />
                    <select style={styles.doSelect} value={doRole} onChange={e => setDoRole(e.target.value as any)}>
                      <option value="participant">Participant</option>
                      <option value="presenter">Presenter</option>
                      <option value="observer">Observer</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={styles.admitBtn} onClick={handleDialOut}>CALL NOW</button>
                    <button style={styles.cancelBtn} onClick={() => setShowDialoutForm(false)}>CANCEL</button>
                  </div>
                </div>
              )}

              {/* PRESENTERS */}
              {filteredParticipants(presenters).length > 0 && (
                <>
                  <SectionDivider label="PRESENTERS" />
                  {filteredParticipants(presenters).map(p => (
                    <ParticipantRow
                      key={p.id}
                      participant={p}
                      onMute={handleMute}
                      onHold={handleHold}
                      onRemove={handleRemove}
                      onAddQA={handleAddToQA}
                      onAssist={(p) => { setAssistTarget(p); setShowAssistPanel(true); }}
                      onMonitor={(p) => { setIsMonitoring(true); setMonitorTarget(p.name); showToast(`Monitoring ${p.name} silently`); }}
                      showToast={showToast}
                    />
                  ))}
                </>
              )}

              {/* ACTIVE ATTENDEES */}
              {filteredParticipants(attendees).length > 0 && (
                <>
                  <SectionDivider label="PARTICIPANTS" />
                  {filteredParticipants(attendees).map(p => (
                    <ParticipantRow
                      key={p.id}
                      participant={p}
                      onMute={handleMute}
                      onHold={handleHold}
                      onRemove={handleRemove}
                      onAddQA={handleAddToQA}
                      onAssist={(p) => { setAssistTarget(p); setShowAssistPanel(true); }}
                      onMonitor={(p) => { setIsMonitoring(true); setMonitorTarget(p.name); showToast(`Monitoring ${p.name} silently`); }}
                      showToast={showToast}
                    />
                  ))}
                </>
              )}

              {/* NOT YET JOINED */}
              {filter === "all" && invited.length > 0 && (
                <>
                  <SectionDivider label="NOT YET JOINED" />
                  {invited.map(p => (
                    <div key={p.id} style={{ ...styles.pRow, opacity: 0.55 }}>
                      <div style={{ ...styles.pAvatar, ...styles.avatarInvited }}>
                        {getInitials(p.name)}
                      </div>
                      <div style={styles.pInfo}>
                        <div style={{ ...styles.pName, color: "#4a6070" }}>{p.name}</div>
                        <div style={styles.pOrg}>{p.organisation}</div>
                      </div>
                      <div style={styles.sbInvited}>NOT JOINED</div>
                      <div style={styles.pDur}>—</div>
                    </div>
                  ))}
                </>
              )}

              {activeParticipants.length === 0 && invited.length === 0 && (
                <div style={styles.emptyState}>No participants yet. Use DIAL OUT or wait for inbound callers.</div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Q&A + LOG */}
          <div style={styles.rightCol}>
            {/* Q&A SECTION */}
            <div style={styles.rpSec}>
              <div style={styles.rpHdr}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={styles.rpTitle}>PARTICIPATION QUEUE</div>
                  <div style={styles.badgePurple}>{activeQa.length}</div>
                </div>
                <button
                  style={{ ...styles.qaToggle, ...(isQAOpen ? styles.qaToggleActive : {}) }}
                  onClick={handleToggleQA}
                >
                  {isQAOpen ? "CLOSE Q&A" : "OPEN Q&A"}
                </button>
              </div>
              <div style={{ padding: "6px 10px 8px" }}>
                {activeQa.length === 0 ? (
                  <div style={styles.emptyState}>No questions in queue</div>
                ) : (
                  activeQa.map((q, i) => {
                    const p = participants.find(pp => pp.id === q.participantId);
                    return (
                      <div key={q.id} style={{
                        ...styles.qaCard,
                        ...(q.status === "live" ? styles.qaCardLive : {}),
                        ...(q.status === "pending" ? styles.qaCardPending : {}),
                      }}>
                        <div style={styles.qaPos}>
                          {q.status === "live" ? "NOW LIVE" : `ITEM ${i + 1}`}
                        </div>
                        <div style={styles.qaWho}>{p?.name ?? "Unknown"}</div>
                        <div style={styles.qaOrg}>{p?.organisation ?? ""}</div>
                        <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                          <span style={{ ...styles.qaMethod, ...(q.method === "phone_keypress" ? styles.qaMethodPhone : styles.qaMethodWeb) }}>
                            {q.method === "phone_keypress" ? "PHONE *2" : q.method === "web_button" ? "WEB" : "OPERATOR"}
                          </span>
                          <span style={styles.qaTypeBadge}>
                            {q.questionText ? "QUESTION" : "HAND RAISED"}
                          </span>
                        </div>
                        {q.questionText && (
                          <div style={styles.qaText}>"{q.questionText}"</div>
                        )}
                        <div style={styles.qaTime}>{timeAgo(q.raisedAt)}</div>
                        <div style={{ ...styles.qaSb, ...styles[`qsb_${q.status}` as keyof typeof styles] as any }}>
                          {q.status.toUpperCase()}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                          {q.status === "pending" && (
                            <>
                              <button style={{ ...styles.qaBtn, ...styles.qaBtnApprove }} onClick={() => handleApproveQ(q)}>APPROVE</button>
                              <button style={{ ...styles.qaBtn, ...styles.qaBtnDismiss }} onClick={() => handleDismissQ(q)}>DISMISS</button>
                            </>
                          )}
                          {q.status === "approved" && (
                            <>
                              <button style={{ ...styles.qaBtn, ...styles.qaBtnTake }} onClick={() => handleTakeQ(q)}>TAKE QUESTION</button>
                              <button style={styles.qaBtn} onClick={() => handleSkipQ(q)}>SKIP</button>
                              <button style={{ ...styles.qaBtn, ...styles.qaBtnDismiss }} onClick={() => handleDismissQ(q)}>DISMISS</button>
                            </>
                          )}
                          {q.status === "live" && (
                            <button style={{ ...styles.qaBtn, ...styles.qaBtnDone }} onClick={() => handleDoneQ(q)}>DONE — REMUTE</button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* OPERATOR EVENT LOG */}
            <div style={styles.logFlex}>
              <div style={styles.logHdr}>
                <div style={styles.rpTitle}>OPERATOR EVENT LOG</div>
              </div>
              <div style={styles.logEntries}>
                {combinedLogs.map((l) => (
                  <div key={l.id} style={styles.logEntry}>
                    <div style={styles.logTs}>{l.time}</div>
                    <div style={{ ...styles.logCat, ...getLogCatStyle(l.cat) }}>
                      {l.catLabel}
                    </div>
                    <div style={styles.logText}>{l.text}</div>
                  </div>
                ))}
                {combinedLogs.length === 0 && (
                  <div style={styles.emptyState}>No events yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <div style={styles.fl}>
          <button
            style={{ ...styles.openBtn, ...(isLive ? styles.openBtnEnd : {}) }}
            onClick={handleOpenConference}
            disabled={isEnded}
          >
            {isLive ? "▪ End Call" : isEnded ? "Call Ended" : "▶ Open Conference"}
          </button>
          <button
            style={{ ...styles.qaToggleFooter, ...(isQAOpen ? styles.qaToggleActive : {}) }}
            onClick={handleToggleQA}
          >
            {isQAOpen ? "Close Q&A" : "Open Q&A"}
          </button>
          <button
            style={{ ...styles.monitorBtn, ...(isMonitoring ? styles.monitorActive : {}) }}
            onClick={() => { setIsMonitoring(!isMonitoring); setMonitorTarget(null); showToast(isMonitoring ? "Monitor stopped" : "Monitoring conference audio"); }}
          >
            {isMonitoring ? "Stop Monitor" : "Monitor"}
          </button>
        </div>
        <div style={styles.fm}>
          <button style={styles.fbtn} onClick={handleMuteAll}>Mute All</button>
          <button style={styles.fbtn} onClick={handleUnmuteAll}>Unmute All</button>
          <button style={styles.fbtn} onClick={() => showToast("Announcement played to all")}>Announce</button>
          <button style={{ ...styles.fbtn, ...(isLocked ? styles.fbtnActive : {}) }} onClick={handleToggleLock}>
            {isLocked ? "Unlock" : "Lock"}
          </button>
          <button style={{ ...styles.fbtn, ...(isRec ? styles.fbtnActive : {}) }} onClick={handleToggleRec}>
            Record
          </button>
        </div>
        <div style={styles.fr}>
          <div style={styles.hbs}>
            {[4, 7, 10, 13, 16].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: isLive ? "#1D9E75" : "#1a2a3a" }} />
            ))}
          </div>
          <span style={styles.hlbl}>{isLive ? "Signal: Healthy" : "Signal: Standby"}</span>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </div>
  );
}

function GreeterCard({ entry, onAdmit, onReject, showToast }: {
  entry: GreeterEntry;
  onAdmit: (g: GreeterEntry, name: string, org: string, role: "presenter" | "participant" | "observer") => void;
  onReject: (g: GreeterEntry) => void;
  showToast: (msg: string) => void;
}) {
  const [name, setName] = useState(entry.transcribedName ?? "");
  const [org, setOrg] = useState(entry.transcribedOrg ?? "");
  const [role, setRole] = useState<"presenter" | "participant" | "observer">("participant");

  const waitSec = Math.floor((Date.now() - new Date(entry.queuedAt).getTime()) / 1000);
  const waitMin = Math.floor(waitSec / 60);
  const isUrgent = waitMin >= 3;

  return (
    <div style={{ ...styles.greeterCard, ...(isUrgent ? styles.greeterCardUrgent : {}) }}>
      <div style={styles.gcPhone}>{entry.phoneNumber ?? "Unknown"} · {waitMin > 0 ? `${waitMin}m ago` : `${waitSec}s ago`}</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <button style={styles.playBtn} onClick={() => showToast("Playing name...")}>▶ Name</button>
        <button style={styles.playBtn} onClick={() => showToast("Playing company...")}>▶ Co.</button>
      </div>
      <div style={styles.gcLabel}>NAME</div>
      <input style={styles.gcInput} value={name} onChange={e => setName(e.target.value)} />
      <div style={styles.gcLabel}>COMPANY</div>
      <input style={styles.gcInput} value={org} onChange={e => setOrg(e.target.value)} />
      <select style={styles.gcRole} value={role} onChange={e => setRole(e.target.value as any)}>
        <option value="participant">Participant</option>
        <option value="presenter">Presenter</option>
        <option value="observer">Observer</option>
      </select>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={styles.admitBtn} onClick={() => onAdmit(entry, name, org, role)}>ADMIT</button>
        <button style={styles.rejectBtn} onClick={() => onReject(entry)}>REJECT</button>
      </div>
      {isUrgent && (
        <div style={styles.gcWaitUrgent}>{waitMin}m {waitSec % 60}s — urgent</div>
      )}
    </div>
  );
}

function ParticipantRow({ participant: p, onMute, onHold, onRemove, onAddQA, onAssist, onMonitor, showToast }: {
  participant: Participant;
  onMute: (p: Participant, muted: boolean) => void;
  onHold: (p: Participant) => void;
  onRemove: (p: Participant) => void;
  onAddQA: (p: Participant) => void;
  onAssist: (p: Participant) => void;
  onMonitor: (p: Participant) => void;
  showToast: (msg: string) => void;
}) {
  const isPresenter = p.role === "presenter";
  const elapsed = p.joinTime ? Math.floor((Date.now() - new Date(p.joinTime).getTime()) / 1000) : 0;
  const durStr = p.joinTime
    ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
    : "—";

  const statusLabel = p.isOnHold ? "HOLD" : p.isMuted ? "MUTED" : p.status === "dialing" ? "DIALING" : "LIVE";
  const statusStyle = p.isOnHold ? styles.sbHold : p.isMuted ? styles.sbMuted : p.status === "dialing" ? styles.sbDialing : styles.sbLive;

  return (
    <div style={{
      ...styles.pRow,
      ...(p.handRaised ? styles.pRowHandRaised : {}),
    }}>
      <div style={{ ...styles.pAvatar, ...(isPresenter ? styles.avatarPresenter : styles.avatarParticipant) }}>
        {getInitials(p.name)}
      </div>
      <div style={styles.pInfo}>
        <div style={styles.pName}>{p.name ?? "Unknown"}</div>
        <div style={styles.pOrg}>{p.organisation ?? ""}</div>
        <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
          <span style={{ ...styles.metaTag, ...(p.connectionMethod === "web" ? styles.mtWeb : styles.mtPhone) }}>
            {(p.connectionMethod ?? "phone").toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {p.handRaised && <span style={{ fontSize: 11, color: "#c87010" }}>✋</span>}
        <div style={{ ...styles.statusBadge, ...statusStyle }}>{statusLabel}</div>
      </div>
      <div style={styles.pDur}>{durStr}</div>
      <div style={styles.pActions}>
        {p.isMuted ? (
          <button style={{ ...styles.actBtn, ...styles.actUnmute }} onClick={() => onMute(p, false)}>UNMUTE</button>
        ) : (
          <button style={{ ...styles.actBtn, ...styles.actMute }} onClick={() => onMute(p, true)}>MUTE</button>
        )}
        {isPresenter ? (
          <button style={styles.actBtn} onClick={() => showToast("Whisper: only presenter hears you")}>WHISPER</button>
        ) : (
          <>
            <button style={styles.actBtn} onClick={() => onHold(p)}>
              {p.isOnHold ? "UNHOLD" : "HOLD"}
            </button>
            <button style={{ ...styles.actBtn, ...styles.actQa }} onClick={() => onAddQA(p)}>+Q&A</button>
            <button style={{ ...styles.actBtn, ...styles.actAssist }} onClick={() => onAssist(p)}>ASSIST</button>
            <button style={{ ...styles.actBtn, ...styles.actMonitor }} onClick={() => onMonitor(p)}>MON</button>
          </>
        )}
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "3px 0 5px" }}>
      <div style={{ flex: 1, height: 1, background: "#1a2a3a" }} />
      <div style={{ fontSize: 8, color: "#2a3a4a", fontWeight: 700, letterSpacing: ".1em", whiteSpace: "nowrap" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: "#1a2a3a" }} />
    </div>
  );
}

function getLogCatStyle(cat: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    operator: { background: "#0f2a1e", color: "#1D9E75" },
    conference: { background: "#0f2a1e", color: "#1D9E75" },
    participant: { background: "#0f2030", color: "#4ab0d4" },
    qa: { background: "#1a0f3a", color: "#9a7aff" },
    alert: { background: "#1a1500", color: "#c87010" },
    assist: { background: "#1a1500", color: "#c87010" },
    monitor: { background: "#1a1500", color: "#c87010" },
    system: { background: "#1a2a3a", color: "#4a6070" },
    handoff: { background: "#1a0f3a", color: "#9a7aff" },
  };
  return map[cat] ?? map.system;
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex", flexDirection: "column", height: "100vh", background: "#080d12",
    fontFamily: "'SF Mono','Fira Code','Courier New',monospace", fontSize: 12, color: "#c8d8e8", overflow: "hidden",
  },
  eventSelector: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    flex: 1, padding: 40,
  },
  logoLarge: {
    fontSize: 24, fontWeight: 700, letterSpacing: ".12em", color: "#1D9E75", marginBottom: 4,
  },
  createBtn: {
    padding: "8px 20px", borderRadius: 4, border: "1px solid #0f5a42", background: "#0f2a1e",
    color: "#1D9E75", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: ".05em",
    fontFamily: "inherit",
  },
  eventCard: {
    background: "#131f2c", border: "1px solid #1a2a3a", borderRadius: 4, padding: "10px 14px",
    cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: 320,
  },
  hdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px",
    height: 52, background: "#0d1520", borderBottom: "1px solid #1a2a3a", flexShrink: 0, gap: 10,
  },
  logo: {
    fontSize: 14, fontWeight: 700, letterSpacing: ".12em", color: "#1D9E75", flexShrink: 0,
  },
  hdrEvent: {
    fontSize: 11, color: "#8ab0c8", borderLeft: "1px solid #1a2a3a", paddingLeft: 10, flex: 1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  hdrCenter: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  phasePill: {
    padding: "3px 9px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: ".1em",
    border: "1px solid #1a2a3a", background: "#0d1520", color: "#4a6070",
  },
  phase_lobby: { borderColor: "#1a3a4a", background: "#0f2030", color: "#4ab0d4" },
  phase_live: { borderColor: "#3a1515", background: "#1a0808", color: "#ff6060" },
  phase_ended: { borderColor: "#2a3a4a", background: "#131f2c", color: "#4a6070" },
  dur: {
    fontSize: 18, fontWeight: 700, letterSpacing: ".15em", color: "#e8f4ff",
    fontVariantNumeric: "tabular-nums", minWidth: 82, textAlign: "center",
  },
  monitorBadge: {
    padding: "3px 9px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: ".09em",
    border: "1px solid #3a2a00", background: "#1a1500", color: "#c87010",
  },
  hdrRight: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  opState: {
    display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 3,
    fontSize: 9, fontWeight: 700, letterSpacing: ".08em", border: "1px solid #0f5a42",
    background: "#0f2a1e", color: "#1D9E75", cursor: "pointer", position: "relative" as const,
  },
  op_available: { borderColor: "#0f5a42", background: "#0f2a1e", color: "#1D9E75" },
  op_in_event: { borderColor: "#0f5a42", background: "#0f2a1e", color: "#1D9E75" },
  op_on_assist: { borderColor: "#3a2a00", background: "#1a1500", color: "#c87010" },
  op_on_break: { borderColor: "#2a3a4a", background: "#131f2c", color: "#4a6070" },
  op_wrap_up: { borderColor: "#3a2a6a", background: "#1a0f3a", color: "#9a7aff" },
  opDropdown: {
    position: "absolute" as const, top: "110%", right: 0, background: "#0d1520",
    border: "1px solid #1a2a3a", borderRadius: 4, padding: "4px 0", minWidth: 140, zIndex: 50,
  },
  opDdItem: {
    padding: "6px 12px", fontSize: 9, fontWeight: 700, color: "#4a6070", cursor: "pointer",
    letterSpacing: ".06em",
  },
  hpill: {
    display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 3,
    fontSize: 9, fontWeight: 700, letterSpacing: ".09em", border: "1px solid #1a2a3a",
    background: "#0d1520", color: "#4a6070", cursor: "pointer",
  },
  hpillRecOn: { borderColor: "#3a1515", background: "#1a0808", color: "#e05050" },
  hpillLocked: { borderColor: "#1a3a4a", background: "#0f2030", color: "#4ab0d4" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  bridgeLayout: { display: "flex", flex: 1, overflow: "hidden" },
  greeterCol: {
    width: 228, background: "#0d1520", borderRight: "1px solid #1a2a3a",
    display: "flex", flexDirection: "column" as const, flexShrink: 0, overflow: "hidden",
  },
  colHdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px",
    borderBottom: "1px solid #1a2a3a", flexShrink: 0,
  },
  colTitle: { fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#4a6070" },
  badgeBlue: {
    fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2,
    background: "#0f2030", color: "#4ab0d4", border: "1px solid #1a3a4a",
  },
  badgeTeal: {
    fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2,
    background: "#0f2a1e", color: "#1D9E75", border: "1px solid #0f5a42",
  },
  badgePurple: {
    fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2,
    background: "#1a0f3a", color: "#9a7aff", border: "1px solid #3a2a6a",
  },
  colBody: { flex: 1, overflowY: "auto" as const, padding: 7 },
  emptyState: { fontSize: 10, color: "#2a3a4a", textAlign: "center" as const, padding: "20px 10px" },
  greeterCard: {
    background: "#131f2c", border: "1px solid #1a2a3a", borderRadius: 4, padding: "8px 9px", marginBottom: 6,
  },
  greeterCardUrgent: { borderColor: "#3a2a00", background: "#1a1500" },
  gcPhone: { fontSize: 9, color: "#4a6070", marginBottom: 5 },
  gcLabel: { fontSize: 8, color: "#4a6070", marginBottom: 2 },
  gcInput: {
    width: "100%", background: "#0d1520", border: "1px solid #1a2a3a", borderRadius: 3,
    padding: "3px 7px", fontSize: 10, color: "#c8d8e8", outline: "none", fontFamily: "inherit",
    marginBottom: 4, boxSizing: "border-box" as const,
  },
  gcRole: {
    width: "100%", background: "#0d1520", border: "1px solid #1a2a3a", borderRadius: 3,
    padding: "3px 7px", fontSize: 10, color: "#c8d8e8", fontFamily: "inherit", cursor: "pointer",
    marginBottom: 6, boxSizing: "border-box" as const,
  },
  gcWaitUrgent: { fontSize: 8, color: "#c87010", marginTop: 4, textAlign: "right" as const },
  playBtn: {
    flex: 1, padding: "3px 5px", borderRadius: 3, border: "1px solid #1a2a3a", background: "#0d1520",
    color: "#4ab0d4", fontSize: 8, fontWeight: 700, cursor: "pointer", textAlign: "center" as const,
    fontFamily: "inherit",
  },
  admitBtn: {
    flex: 1, padding: "4px 8px", borderRadius: 3, border: "1px solid #0f5a42", background: "#0f2a1e",
    color: "#1D9E75", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  rejectBtn: {
    flex: 1, padding: "4px 8px", borderRadius: 3, border: "1px solid #3a1515", background: "#1a0808",
    color: "#e05050", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  cancelBtn: {
    padding: "4px 8px", borderRadius: 3, border: "1px solid #1a2a3a", background: "transparent",
    color: "#4a6070", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  input: {
    background: "#0d1520", border: "1px solid #1a2a3a", borderRadius: 3, padding: "6px 10px",
    fontSize: 11, color: "#c8d8e8", outline: "none", fontFamily: "inherit", width: "100%",
    boxSizing: "border-box" as const,
  },
  rosterCol: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden", minWidth: 0 },
  rosterHdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px",
    borderBottom: "1px solid #1a2a3a", flexShrink: 0,
  },
  dialoutBtn: {
    padding: "3px 9px", borderRadius: 3, border: "1px solid #0f5a42", background: "#0f2a1e",
    color: "#1D9E75", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  filterStrip: {
    display: "flex", flexWrap: "wrap" as const, gap: 3, padding: "6px 11px",
    borderBottom: "1px solid #1a2a3a", flexShrink: 0,
  },
  flt: {
    padding: "2px 8px", borderRadius: 2, border: "1px solid #1a2a3a", background: "#131f2c",
    color: "#4a6070", fontSize: 8, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  },
  fltActive: { borderColor: "#0f5a42", background: "#0f2a1e", color: "#1D9E75" },
  rosterBody: { flex: 1, overflowY: "auto" as const, padding: "7px 9px" },
  assistPanel: {
    background: "#1a1500", border: "1px solid #3a2a00", borderRadius: 4, margin: "0 0 7px",
    padding: "9px 10px", flexShrink: 0,
  },
  assistSelect: {
    width: "100%", background: "#0d1520", border: "1px solid #3a2a00", borderRadius: 3,
    padding: "4px 7px", fontSize: 9, color: "#c8d8e8", fontFamily: "inherit", cursor: "pointer",
  },
  abtn: {
    padding: "3px 7px", borderRadius: 2, border: "1px solid #0f5a42", background: "#0f2a1e",
    color: "#1D9E75", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  dialoutForm: {
    background: "#131f2c", border: "1px solid #1a2a3a", borderRadius: 4, padding: 9, marginBottom: 7,
  },
  doInput: {
    flex: 1, background: "#0d1520", border: "1px solid #1a2a3a", borderRadius: 3,
    padding: "4px 7px", fontSize: 10, color: "#c8d8e8", outline: "none", fontFamily: "inherit",
  },
  doSelect: {
    background: "#0d1520", border: "1px solid #1a2a3a", borderRadius: 3,
    padding: "4px 7px", fontSize: 9, color: "#c8d8e8", fontFamily: "inherit", cursor: "pointer",
  },
  pRow: {
    display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", borderRadius: 4,
    border: "1px solid #1a2a3a", background: "#131f2c", marginBottom: 4,
  },
  pRowHandRaised: { borderColor: "#3a2a00", background: "#1a1500" },
  pAvatar: {
    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0,
  },
  avatarPresenter: { background: "#0f2a1e", color: "#1D9E75", border: "1px solid #0f5a42" },
  avatarParticipant: { background: "#0f2030", color: "#4ab0d4", border: "1px solid #1a3a4a" },
  avatarInvited: { background: "#1a2a3a", color: "#4a6070", border: "1px solid #2a3a4a" },
  pInfo: { flex: 1, minWidth: 0 },
  pName: { fontSize: 11, color: "#c8d8e8", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  pOrg: { fontSize: 9, color: "#4a6070", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  metaTag: { fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2 },
  mtPhone: { background: "#0f2030", color: "#4ab0d4" },
  mtWeb: { background: "#1a0f3a", color: "#9a7aff" },
  statusBadge: {
    fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 2, letterSpacing: ".05em",
  },
  sbLive: { background: "#0f2a1e", color: "#1D9E75", border: "1px solid #0f5a42" },
  sbMuted: { background: "#1a1500", color: "#c87010", border: "1px solid #3a2a00" },
  sbHold: { background: "#1a2a3a", color: "#4a6070", border: "1px solid #2a3a4a" },
  sbDialing: { background: "#1a1500", color: "#c87010", border: "1px solid #3a2a00" },
  sbInvited: {
    fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 2,
    background: "#1a2a3a", color: "#4a6070", border: "1px solid #2a3a4a",
  },
  pDur: { fontSize: 8, color: "#2a3a4a", minWidth: 28, textAlign: "right" as const, flexShrink: 0 },
  pActions: { display: "flex", gap: 2, flexShrink: 0 },
  actBtn: {
    padding: "2px 6px", borderRadius: 2, border: "1px solid #1a2a3a", background: "#0d1520",
    color: "#4a6070", fontSize: 7, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  },
  actUnmute: { color: "#1D9E75", borderColor: "#0f5a42", background: "#0f2a1e" },
  actMute: {},
  actQa: {},
  actAssist: {},
  actMonitor: {},
  rightCol: {
    width: 248, background: "#0d1520", borderLeft: "1px solid #1a2a3a",
    display: "flex", flexDirection: "column" as const, flexShrink: 0, overflow: "hidden",
  },
  rpSec: { borderBottom: "1px solid #1a2a3a", flexShrink: 0 },
  rpHdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px",
  },
  rpTitle: { fontSize: 9, fontWeight: 700, letterSpacing: ".09em", color: "#4a6070" },
  qaToggle: {
    padding: "2px 8px", borderRadius: 3, border: "1px solid #1a2a3a", background: "#131f2c",
    color: "#4a6070", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  qaToggleActive: { borderColor: "#3a2a6a", background: "#1a0f3a", color: "#9a7aff" },
  qaCard: {
    background: "#131f2c", border: "1px solid #1a2a3a", borderRadius: 3, padding: "8px 9px",
    marginBottom: 5,
  },
  qaCardLive: { borderColor: "#0f5a42", background: "#0f1a10" },
  qaCardPending: { borderColor: "#3a2a6a" },
  qaPos: { fontSize: 8, color: "#4a6070", marginBottom: 2, fontWeight: 700 },
  qaWho: { fontSize: 10, color: "#9a7aff", fontWeight: 700 },
  qaOrg: { fontSize: 8, color: "#4a6070", marginBottom: 3 },
  qaMethod: {
    fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2,
  },
  qaMethodPhone: { background: "#0f2030", color: "#4ab0d4" },
  qaMethodWeb: { background: "#1a0f3a", color: "#9a7aff" },
  qaTypeBadge: {
    fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2,
    background: "#1a0f3a", color: "#9a7aff",
  },
  qaText: { fontSize: 9, color: "#8ab0c8", lineHeight: "1.4", marginBottom: 4, fontStyle: "italic" },
  qaTime: { fontSize: 8, color: "#2a3a4a", marginBottom: 4 },
  qaSb: {
    fontSize: 7, fontWeight: 700, padding: "1px 5px", borderRadius: 2, marginBottom: 5,
    display: "inline-block",
  },
  qsb_pending: { background: "#1a0f3a", color: "#9a7aff" },
  qsb_approved: { background: "#0f2a1e", color: "#1D9E75" },
  qsb_live: { background: "#0f2a1e", color: "#1D9E75" },
  qsb_answered: { background: "#1a2a3a", color: "#4a6070" },
  qsb_dismissed: { background: "#1a0808", color: "#e05050" },
  qsb_skipped: { background: "#1a2a3a", color: "#4a6070" },
  qaBtn: {
    padding: "2px 6px", borderRadius: 2, border: "1px solid #1a2a3a", background: "#0d1520",
    color: "#4a6070", fontSize: 7, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  qaBtnApprove: {},
  qaBtnTake: { borderColor: "#0f5a42", background: "#0f2a1e", color: "#1D9E75" },
  qaBtnDone: { borderColor: "#c87010", background: "#1a1500", color: "#c87010" },
  qaBtnDismiss: {},
  logFlex: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden", minHeight: 0 },
  logHdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px",
    borderBottom: "1px solid #1a2a3a", flexShrink: 0,
  },
  logEntries: {
    flex: 1, overflowY: "auto" as const, padding: "5px 10px",
    display: "flex", flexDirection: "column" as const, gap: 2,
  },
  logEntry: {
    display: "flex", gap: 6, padding: "3px 0", borderBottom: "1px solid rgba(26,42,58,.5)",
    alignItems: "flex-start",
  },
  logTs: { fontSize: 8, color: "#2a3a4a", flexShrink: 0, fontVariantNumeric: "tabular-nums", minWidth: 42 },
  logCat: {
    fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, flexShrink: 0, whiteSpace: "nowrap" as const,
  },
  logText: { fontSize: 9, color: "#6a8090", lineHeight: "1.4", flex: 1, minWidth: 0 },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 13px",
    height: 52, background: "#0d1520", borderTop: "1px solid #1a2a3a", flexShrink: 0, gap: 8,
  },
  fl: { display: "flex", alignItems: "center", gap: 5 },
  openBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 4,
    border: "1px solid #0f5a42", background: "#0f2a1e", color: "#1D9E75",
    fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: ".05em", fontFamily: "inherit",
  },
  openBtnEnd: { background: "#1a0808", borderColor: "#3a1515", color: "#e05050" },
  qaToggleFooter: {
    padding: "6px 12px", borderRadius: 3, border: "1px solid #1a2a3a", background: "#131f2c",
    color: "#4a6070", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  monitorBtn: {
    padding: "6px 12px", borderRadius: 3, border: "1px solid #1a2a3a", background: "#131f2c",
    color: "#4a6070", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  monitorActive: { borderColor: "#3a2a00", background: "#1a1500", color: "#c87010" },
  fm: { display: "flex", alignItems: "center", gap: 4 },
  fbtn: {
    padding: "5px 10px", borderRadius: 3, border: "1px solid #1a2a3a", background: "transparent",
    color: "#4a6070", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  fbtnActive: { borderColor: "#3a1515", background: "#1a0808", color: "#e05050" },
  fr: { display: "flex", alignItems: "center", gap: 4 },
  hbs: { display: "flex", gap: 2, alignItems: "flex-end" },
  hlbl: { fontSize: 9, color: "#4a6070" },
  toast: {
    background: "#0f2a1e", border: "1px solid #0f5a42", borderRadius: 4, padding: "7px 14px",
    fontSize: 10, color: "#1D9E75", fontWeight: 700, letterSpacing: ".04em",
    position: "fixed" as const, bottom: 62, left: "50%", transform: "translateX(-50%)", zIndex: 99,
  },
};
