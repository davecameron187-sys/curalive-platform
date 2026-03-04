/**
 * WebphoneActivityCard — Live Webphone Activity summary card for the OCC dashboard.
 *
 * Shows real-time call stats: active calls, today's totals, carrier split,
 * average duration, and a mini recent-calls list.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone, PhoneIncoming, PhoneOutgoing, Activity, Clock, Signal,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Settings, Zap
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSecs(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type StatsPeriod = "today" | "week" | "allTime";

export default function WebphoneActivityCard() {
  const [period, setPeriod] = useState<StatsPeriod>("today");
  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Fetch activity stats — Ably pushes trigger instant refetch; 30s fallback polling
  const { data: stats, isLoading, refetch } = trpc.webphone.getActivityStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  // Ably token for real-time subscription
  const { data: ablyToken } = trpc.ably.tokenRequest.useQuery(
    { clientId: `occ-activity-${Date.now()}` },
    { staleTime: 300000 }
  );

  // Ably real-time subscription — triggers instant refetch on call events
  const ablyRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const handleAblyMessage = useCallback(() => {
    // Instantly refetch stats when any call event arrives
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!ablyToken?.tokenRequest || ablyToken.mode !== "ably") return;

    let ably: any = null;
    let channel: any = null;

    const connectAbly = async () => {
      try {
        const Ably = await import("ably");
        ably = new Ably.Realtime({ authCallback: (_params, cb) => cb(null, ablyToken.tokenRequest as any) });
        channel = ably.channels.get("webphone:activity");
        channel.subscribe(handleAblyMessage);
        ablyRef.current = ably;
        channelRef.current = channel;
        console.log("[WebphoneActivity] Ably connected — real-time updates active");
      } catch (err) {
        console.warn("[WebphoneActivity] Ably connection failed, falling back to polling:", err);
      }
    };

    connectAbly();

    return () => {
      if (channel) channel.unsubscribe();
      if (ably) ably.close();
      ablyRef.current = null;
      channelRef.current = null;
    };
  }, [ablyToken, handleAblyMessage]);

  // Inbound routing status
  const { data: routingStatus } = trpc.webphone.getInboundRoutingStatus.useQuery(
    undefined,
    { enabled: showConfig }
  );

  // Telnyx numbers
  const { data: telnyxNumbers } = trpc.webphone.getTelnyxNumbers.useQuery(
    undefined,
    { enabled: showConfig }
  );

  // Mutations
  type MutationResult = { success: boolean; message?: string; error?: string };

  const configureInbound = trpc.webphone.configureInboundRouting.useMutation({
    onSuccess: (result: MutationResult) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    },
  });

  const purchaseTelnyx = trpc.webphone.purchaseTelnyxNumber.useMutation({
    onSuccess: (result: MutationResult) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    },
  });

  const currentStats = stats?.[period] ?? { total: 0, completed: 0, failed: 0, totalSecs: 0, avgDuration: 0, twilioCount: 0, telnyxCount: 0, inbound: 0, outbound: 0 };
  const activeCalls = stats?.activeCalls ?? 0;
  const recentCalls = stats?.recentCalls ?? [];

  const periodLabels: Record<StatsPeriod, string> = { today: "Today", week: "This Week", allTime: "All Time" };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Webphone Activity</h3>
            <p className="text-[10px] text-muted-foreground">Live call statistics</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeCalls > 0 && (
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              {activeCalls} active
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConfig(v => !v)} title="Configuration">
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} title="Refresh">
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex border-b border-border">
        {(["today", "week", "allTime"] as StatsPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              period === p ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <StatCell icon={Phone} label="Total" value={currentStats.total} color="text-blue-400" />
        <StatCell icon={CheckCircle} label="Completed" value={currentStats.completed} color="text-emerald-400" />
        <StatCell icon={XCircle} label="Failed" value={currentStats.failed} color="text-red-400" />
        <StatCell icon={Clock} label="Avg Duration" value={formatSecs(currentStats.avgDuration)} color="text-amber-400" />
      </div>

      {/* Direction + Carrier Split */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1"><PhoneOutgoing className="w-3 h-3" /> Outbound: {currentStats.outbound}</span>
          <span className="flex items-center gap-1"><PhoneIncoming className="w-3 h-3" /> Inbound: {currentStats.inbound}</span>
        </div>
        {/* Carrier bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
          {currentStats.total > 0 ? (
            <>
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(currentStats.twilioCount / currentStats.total) * 100}%` }}
                title={`Twilio: ${currentStats.twilioCount}`}
              />
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(currentStats.telnyxCount / currentStats.total) * 100}%` }}
                title={`Telnyx: ${currentStats.telnyxCount}`}
              />
            </>
          ) : (
            <div className="w-full bg-slate-700" />
          )}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Twilio {currentStats.twilioCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Telnyx {currentStats.telnyxCount}</span>
        </div>
      </div>

      {/* Expanded: Recent Calls */}
      {expanded && (
        <div className="border-t border-border">
          <div className="px-4 py-2">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Calls</h4>
            {recentCalls.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-3">No calls recorded yet.</p>
            ) : (
              <div className="space-y-1">
                {recentCalls.map((call: { id: number; carrier: string; direction: string; remoteNumber: string | null; status: string; durationSecs: number | null; startedAt: number | null }) => (
                  <div key={call.id} className="flex items-center justify-between py-1 px-2 rounded bg-background/50 text-[11px]">
                    <div className="flex items-center gap-2">
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <PhoneOutgoing className="w-3 h-3 text-blue-400" />
                      )}
                      <span className="text-foreground font-mono">{call.remoteNumber || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[9px] py-0 h-4",
                        call.carrier === "twilio" ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400"
                      )}>
                        {call.carrier}
                      </Badge>
                      <span className={cn(
                        "text-[10px]",
                        call.status === "completed" ? "text-emerald-400" : call.status === "failed" ? "text-red-400" : "text-amber-400"
                      )}>
                        {call.status === "completed" && call.durationSecs != null ? formatSecs(call.durationSecs) : call.status}
                      </span>
                      <span className="text-muted-foreground">{formatTime(call.startedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Inbound Routing</h4>

          {/* Twilio Numbers */}
          {routingStatus?.numbers && routingStatus.numbers.length > 0 ? (
            <div className="space-y-1.5">
              {routingStatus.numbers.map((n: { phoneNumber: string; friendlyName: string; voiceUrl: string; isConfigured: boolean }) => (
                <div key={n.phoneNumber} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-blue-400" />
                    <span className="font-mono text-foreground">{n.phoneNumber}</span>
                    {n.isConfigured ? (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-emerald-500/30 text-emerald-400">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Routed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/30 text-amber-400">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Not Routed
                      </Badge>
                    )}
                  </div>
                  {!n.isConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => configureInbound.mutate({ phoneNumber: n.phoneNumber })}
                      disabled={configureInbound.isPending}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">No Twilio numbers found.</p>
          )}

          {/* Telnyx Numbers */}
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Telnyx Numbers</h4>
          {telnyxNumbers?.numbers && telnyxNumbers.numbers.length > 0 ? (
            <div className="space-y-1.5">
              {telnyxNumbers.numbers.map((n: { phoneNumber: string; status: string; connectionId: string | null; connectionName: string | null }) => (
                <div key={n.phoneNumber} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono text-foreground">{n.phoneNumber}</span>
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-slate-500/30 text-slate-400">
                      {n.status}
                    </Badge>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{n.connectionName || "No connection"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">No Telnyx numbers.</p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => purchaseTelnyx.mutate({ countryCode: "US" })}
                disabled={purchaseTelnyx.isPending}
              >
                <Phone className="w-3 h-3 mr-1" />
                {purchaseTelnyx.isPending ? "Purchasing..." : "Purchase US Number"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCell({ icon: Icon, label, value, color }: { icon: typeof Phone; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card px-3 py-2.5 text-center">
      <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", color)} />
      <div className="text-lg font-bold text-foreground leading-none">{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
