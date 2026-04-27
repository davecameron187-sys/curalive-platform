// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import * as Ably from "ably";
import { trpc } from "../lib/trpc";

const TABS = ["Live Events", "Daily Intelligence", "Post-Event", "Governance", "Profile"];

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-4">
        <span className="text-2xl">⚡</span>
      </div>
      <div className="text-white font-semibold text-lg mb-2">{label}</div>
      <div className="text-gray-500 text-sm">This module is being activated.</div>
      <div className="mt-3 text-xs text-blue-400 uppercase tracking-widest">Coming Next</div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: "bg-red-900/60 text-red-300 border border-red-700",
    medium: "bg-yellow-900/60 text-yellow-300 border border-yellow-700",
    low: "bg-green-900/60 text-green-300 border border-green-700",
    critical: "bg-red-950 text-red-200 border border-red-600",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${map[level] ?? "bg-gray-800 text-gray-400 border border-gray-600"}`}>
      {level}
    </span>
  );
}

function FeedCard({ item, sessionId, onAction, actionStates = {} }: { item: any; sessionId: string | null; onAction: (type: "acknowledge" | "follow_up", id: number) => void; actionStates?: Record<string, string> }) {
  const typeColors: Record<string, string> = {
    compliance: "border-l-red-500",
    sentiment: "border-l-blue-500",
    correlation: "border-l-purple-500",
    governance: "border-l-yellow-500",
  };
  const borderColor = typeColors[item.feed_type?.toLowerCase()] ?? "border-l-gray-600";

  return (
    <div className={`bg-gray-900 border border-gray-800 border-l-4 ${borderColor} rounded-lg p-4 mb-3 hover:border-gray-700 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{item.feed_type}</span>
          <RiskBadge level={item.severity ?? "low"} />
        </div>
        <span className="text-xs text-gray-600">
          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
        </span>
      </div>
      <div className="text-white font-semibold text-sm mb-1">{item.title}</div>
      <div className="text-gray-400 text-xs leading-relaxed mb-3">{item.body}</div>
      {item.pipeline && (
        <div className="text-xs text-gray-600 mb-3">Pipeline: {item.pipeline}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onAction("acknowledge", item.id)}
          disabled={actionStates[`${item.id}:acknowledge`] === "loading" || actionStates[`${item.id}:acknowledge`] === "success"}
          className={`text-xs px-3 py-1.5 border rounded transition-colors font-medium ${
            actionStates[`${item.id}:acknowledge`] === "success"
              ? "bg-green-900/50 text-green-300 border-green-700 cursor-default"
              : actionStates[`${item.id}:acknowledge`] === "loading"
              ? "bg-gray-800 text-gray-500 border-gray-700 cursor-wait"
              : "bg-blue-900/50 hover:bg-blue-800 text-blue-300 border-blue-700"
          }`}
        >
          {actionStates[`${item.id}:acknowledge`] === "loading" ? "..." : actionStates[`${item.id}:acknowledge`] === "success" ? "Acknowledged ✓" : "Acknowledge"}
        </button>
        <button
          onClick={() => onAction("follow_up", item.id)}
          disabled={actionStates[`${item.id}:follow_up`] === "loading" || actionStates[`${item.id}:follow_up`] === "success"}
          className={`text-xs px-3 py-1.5 border rounded transition-colors font-medium ${
            actionStates[`${item.id}:follow_up`] === "success"
              ? "bg-green-900/50 text-green-300 border-green-700 cursor-default"
              : actionStates[`${item.id}:follow_up`] === "loading"
              ? "bg-gray-800 text-gray-500 border-gray-700 cursor-wait"
              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600"
          }`}
        >
          {actionStates[`${item.id}:follow_up`] === "loading" ? "..." : actionStates[`${item.id}:follow_up`] === "success" ? "Followed Up ✓" : "Follow Up"}
        </button>
      </div>
    </div>
  );
}

function LiveEventsBanner({ session }: { session: any }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  if (!session) return null;
  const isLive = session.status === "active" || session.status === "live";

  return (
    <div className={`rounded-lg border p-4 mb-6 ${isLive ? "border-green-700 bg-green-950/30" : "border-gray-700 bg-gray-900/50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-green-400" : "bg-gray-500"} ${isLive && pulse ? "opacity-100" : "opacity-50"} transition-opacity`} />
          <div>
            <div className={`text-sm font-bold ${isLive ? "text-green-300" : "text-gray-400"}`}>
              {isLive ? "LIVE SESSION ACTIVE" : "SESSION COMPLETED"}
            </div>
            <div className="text-white font-semibold mt-0.5">{session.event_name}</div>
          </div>
        </div>
        {isLive && (
          <div className="text-xs text-green-400 bg-green-900/30 border border-green-700 px-3 py-1 rounded-full">
            CuraLive Intelligence Active
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("Live Events");
  const [, navigate] = useLocation();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const sessionsQuery = trpc.customerDashboard.getSessions.useQuery(undefined, { refetchInterval: 5000 });
  const feedQuery = trpc.customerDashboard.getFeed.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );
  const governanceQuery = trpc.customerDashboard.getGovernance.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );
  const recordAction = trpc.customerDashboard.recordAction.useMutation();
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [ablyStatus, setAblyStatus] = useState<string>("disconnected");
  const [actionStates, setActionStates] = useState<Record<string, "loading" | "success" | "error">>({});
  const actionKey = (itemId: number, actionType: string) => `${itemId}:${actionType}`;
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  useEffect(() => {
    if (!selectedSession?.ably_channel) return;
    (async () => {

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (ablyRef.current) {
      ablyRef.current.close();
      ablyRef.current = null;
    }

    setLiveItems([]);

    setAblyStatus("connecting");
    const ably = new (Ably as any).Realtime({
      authCallback: async (_tokenParams: any, callback: any) => {
        try {
          const res = await fetch("/api/ably-token-string");
          const { token } = await res.json();
          callback(null, token);
        } catch (err) {
          callback(err as Error, null);
        }
      },
    });
    ablyRef.current = ably;
    ably.connection.on("connected", () => setAblyStatus("connected"));
    ably.connection.on("failed", () => setAblyStatus("failed"));
    ably.connection.on("disconnected", () => setAblyStatus("disconnected"));

    const channelName = `curalive-event-${selectedSession.ably_channel}`;
    console.log("[CustomerDashboard] subscribing to channel:", channelName);
    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    channel.subscribe("intelligence_feed", (message) => {
      console.log("[CustomerDashboard] Ably message received:", message.data);
      try {
        const item = typeof message.data === "string"
          ? JSON.parse(message.data)
          : message.data;
        setLiveItems(prev => {
          if (prev.some(e => e.id === item.id)) return prev;
          const updated = [item, ...prev];
          updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return updated;
        });
      } catch (err) {
        console.error("[Ably] Failed to parse message:", err);
      }
    });

    })();
    return () => {
      console.log("[CustomerDashboard] unsubscribing from channel:", selectedSession.ably_channel);
      if (channelRef.current) channelRef.current.unsubscribe();
      if (ablyRef.current) ablyRef.current.close();
    };
  }, [selectedSession?.ably_channel]);

  const sessions = sessionsQuery.data ?? [];
  const dbItems = feedQuery.data ?? [];
  const feedItems = [...liveItems, ...dbItems].reduce((acc: any[], item: any) => {
    if (acc.some(e => e.id === item.id)) return acc;
    acc.push(item);
    return acc;
  }, []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const decisions = governanceQuery.data ?? [];

  useEffect(() => {
    if (sessions.length > 0) {
      const newest = sessions[0];
      if (!selectedSessionId || `shadow-${newest.id}` !== selectedSessionId) {
        console.log("[CustomerDashboard] selectedSessionId:", `shadow-${newest.id}`);
        setSelectedSessionId(`shadow-${newest.id}`);
        setSelectedSession(newest);
      }
    }
  }, [sessions]);

  const handleAction = (actionType: "acknowledge" | "follow_up", itemId: number) => {
    if (!selectedSession?.id) return;
    const key = actionKey(itemId, actionType);
    setActionStates(prev => ({ ...prev, [key]: "loading" }));
    recordAction.mutate(
      {
        sessionId: selectedSession.id,
        targetType: "feed_item",
        targetId: itemId,
        actionType,
      },
      {
        onSuccess: () => {
          setActionStates(prev => ({ ...prev, [key]: "success" }));
        },
        onError: () => {
          setActionStates(prev => ({ ...prev, [key]: "error" }));
          setTimeout(() => {
            setActionStates(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }, 2500);
        },
      }
    );
  };

  const riskLevel = feedItems.some((i: any) => i.severity === "high" || i.severity === "critical") ? "Elevated" : "Normal";
  const sentimentItems = feedItems.filter((i: any) => i.feed_type === "sentiment");
  const openActions = feedItems.filter((i: any) => i.severity === "high").length;

  const authorised = decisions.filter((d: any) => d.decision === "authorised").length;
  const pending = decisions.filter((d: any) => d.decision === "pending_review").length;
  const withheld = decisions.filter((d: any) => d.decision === "withheld").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* HEADER */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-blue-400 font-bold text-lg tracking-tight">CuraLive</div>
          <div className="text-gray-600 text-xs uppercase tracking-widest">Intelligence — Client Command Centre</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-xs text-gray-400">
            <span className="text-gray-600">Organisation</span>
            <span className="ml-2 text-white font-medium">{selectedSession?.client_name ?? "—"}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div className="text-xs text-green-400">System Active</div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-gray-800 px-6 flex gap-1 bg-gray-950">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden">

        {activeTab === "Live Events" && (
          <div className="flex h-full">

            {/* LEFT — Session List */}
            <div className="w-56 border-r border-gray-800 bg-gray-950 overflow-y-auto flex-shrink-0">
              <div className="px-4 py-3 border-b border-gray-800">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Sessions</div>
              </div>
              {sessionsQuery.isLoading && (
                <div className="p-4 text-gray-600 text-xs">Loading...</div>
              )}
              {sessions.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSessionId(`shadow-${s.id}`); setSelectedSession(s); }}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-900 hover:bg-gray-900 transition-colors ${
                    selectedSessionId === s.session_id ? "bg-gray-900 border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <div className="text-xs font-medium text-white truncate">{s.event_name}</div>
                  <div className="text-xs text-gray-600 truncate mt-0.5">{s.client_name}</div>
                  <div className={`text-xs mt-1 font-medium ${
                    s.status === "active" || s.status === "live" ? "text-green-400" :
                    s.status === "completed" ? "text-gray-500" : "text-red-400"
                  }`}>{s.status}</div>
                </div>
              ))}
            </div>

            {/* CENTRE — Intelligence Feed */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
              <LiveEventsBanner session={selectedSession} />
              <div className={`text-xs px-3 py-1 rounded mb-4 ${
                ablyStatus === "connected" ? "bg-green-900/30 text-green-400 border border-green-700" :
                ablyStatus === "connecting" ? "bg-yellow-900/30 text-yellow-400 border border-yellow-700" :
                ablyStatus === "failed" ? "bg-red-900/30 text-red-400 border border-red-700" :
                "bg-gray-900 text-gray-500 border border-gray-700"
              }`}>
                Ably: {ablyStatus}
              </div>

              {/* KPI Strip */}
              {selectedSessionId && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Risk Level</div>
                    <div className={`text-lg font-bold ${riskLevel === "Elevated" ? "text-red-400" : "text-green-400"}`}>{riskLevel}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Open Actions</div>
                    <div className="text-lg font-bold text-yellow-400">{openActions}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Signals</div>
                    <div className="text-lg font-bold text-blue-400">{feedItems.length}</div>
                  </div>
                </div>
              )}

              {/* Feed */}
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
                Intelligence Feed
              </div>
              {!selectedSessionId && (
                <div className="text-gray-600 text-sm">Select a session to view intelligence.</div>
              )}
              {feedQuery.isLoading && (
                <div className="text-gray-600 text-sm">Loading intelligence...</div>
              )}
              {feedItems.length === 0 && selectedSessionId && !feedQuery.isLoading && (
                <div className="text-gray-600 text-sm">No intelligence signals for this session.</div>
              )}
              {feedItems.map((item: any) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  sessionId={selectedSessionId}
                  onAction={handleAction}
                  actionStates={actionStates}
                />
              ))}
            </div>

            {/* RIGHT — Governance + Sessions */}
            <div className="w-64 border-l border-gray-800 bg-gray-950 overflow-y-auto flex-shrink-0">

              {/* Governance Snapshot */}
              <div className="p-4 border-b border-gray-800">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Governance</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-gray-900 rounded p-3">
                    <span className="text-xs text-gray-400">Authorised</span>
                    <span className="text-sm font-bold text-green-400">{authorised}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-900 rounded p-3">
                    <span className="text-xs text-gray-400">Pending Review</span>
                    <span className="text-sm font-bold text-yellow-400">{pending}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-900 rounded p-3">
                    <span className="text-xs text-gray-400">Withheld</span>
                    <span className="text-sm font-bold text-red-400">{withheld}</span>
                  </div>
                </div>
              </div>

              {/* Live Intelligence Health */}
              <div className="p-4 border-b border-gray-800">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Daily Intelligence</div>
                <div className="text-sm text-white mb-1">{sentimentItems.length > 0 ? "Sentiment active" : "Monitoring"}</div>
                <div className="text-xs text-gray-500">{sentimentItems.length} sentiment signals in feed</div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-800">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Quick Actions</div>
                <div className="space-y-2">
                  <button className="w-full text-left text-xs px-3 py-2 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300">Export Session</button>
                  <button className="w-full text-left text-xs px-3 py-2 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300">Request Review</button>
                </div>
              </div>

              <div className="p-4 text-xs text-gray-600">
                Customer dashboard modules are available below.
              </div>
            </div>
          </div>
        )}

        {activeTab === "Daily Intelligence" && <ComingSoon label="Daily Intelligence" />}
        {activeTab === "Post-Event" && <ComingSoon label="Post-Event" />}
        {activeTab === "Governance" && <ComingSoon label="Governance" />}
        {activeTab === "Profile" && navigate("/customer/profile")}

      </div>
    </div>
  );
}
