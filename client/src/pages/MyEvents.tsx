/**
 * MyEvents.tsx
 * Attendee self-service portal — shows all events the logged-in user has
 * registered for, with their CuraLive Direct PIN and a link to join each event.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Calendar, KeyRound, Phone, Play, ArrowRight, Clock, CheckCircle2,
  Radio, Copy, CheckCheck, RefreshCw, Loader2, AlertTriangle, User,
  ExternalLink, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function PinDisplay({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    toast.success("PIN copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-[#1e1b4b] border border-violet-700/50 rounded-lg px-3 py-1.5">
        <KeyRound className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span className="font-mono font-bold text-lg tracking-[6px] text-violet-200">{pin}</span>
      </div>
      <button
        onClick={copy}
        title="Copy PIN"
        className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      >
        {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live") return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live
    </span>
  );
  if (status === "upcoming") return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
      <Clock className="w-3 h-3" />Upcoming
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
      <CheckCircle2 className="w-3 h-3" />Completed
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    "Zoom": "bg-blue-800/60 text-blue-300",
    "Microsoft Teams": "bg-purple-800/60 text-purple-300",
    "Webex": "bg-emerald-800/60 text-emerald-300",
    "RTMP": "bg-orange-800/60 text-orange-300",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[platform] ?? "bg-slate-700 text-slate-400"}`}>
      {platform || "Platform"}
    </span>
  );
}

export default function MyEvents() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const { data: registrations, isLoading, refetch } = trpc.registrations.getMyRegistrations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-violet-900/40 border border-violet-700/40 flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Sign in to view your events</h2>
          <p className="text-sm text-slate-400 mb-6">Your registered events and CuraLive Direct PINs are available after signing in.</p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#080d1a]/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-900/60 border border-violet-700/40 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-sm font-semibold text-slate-200">CuraLive</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sm text-slate-400">My Events</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{user?.name ?? user?.email}</span>
            <button
              onClick={() => refetch()}
              title="Refresh"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-10 max-w-3xl">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">My Events</h1>
          <p className="text-sm text-slate-400">Your registered events and CuraLive Direct dial-in PINs.</p>
        </div>

        {/* CuraLive Direct explainer */}
        <div className="mb-8 rounded-xl border border-violet-700/30 bg-violet-900/15 p-4 flex gap-3">
          <KeyRound className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-200 mb-1">CuraLive Direct — Personal Dial-In PIN</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each event you register for comes with a unique 5-digit PIN. When the event goes live, dial the conference number and enter your PIN when prompted — you'll be connected instantly, no operator needed.
            </p>
          </div>
        </div>

        {/* Registrations list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : !registrations || registrations.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium mb-2">No registrations yet</p>
            <p className="text-sm text-slate-500 mb-6">Register for an event to see it here with your personal dial-in PIN.</p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Browse Events <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(registrations as NonNullable<typeof registrations>).map((reg) => (
              <div
                key={reg.id}
                className={`rounded-xl border transition-colors ${
                  reg.eventStatus === "live"
                    ? "border-red-700/40 bg-red-900/10"
                    : reg.eventStatus === "completed"
                    ? "border-slate-700/50 bg-slate-800/20"
                    : "border-slate-700 bg-[#111827]"
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={reg.eventStatus} />
                        {reg.eventPlatform && <PlatformBadge platform={reg.eventPlatform} />}
                      </div>
                      <h3 className="font-semibold text-slate-100 text-base leading-tight">{reg.eventTitle}</h3>
                      {reg.eventCompany && (
                        <p className="text-xs text-slate-500 mt-0.5">{reg.eventCompany}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest">Registered</p>
                      <p className="text-xs text-slate-400">
                        {new Date(reg.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>

                  {/* PIN section */}
                  <div className="border-t border-slate-700/50 pt-4">
                    {reg.accessPin ? (
                      <div>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                              CuraLive Direct PIN
                            </p>
                            <PinDisplay pin={reg.accessPin} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {reg.pinUsedAt && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Used {new Date(reg.pinUsedAt).toLocaleDateString("en-ZA")}
                              </span>
                            )}
                            {reg.eventStatus !== "completed" && (
                              <button
                                onClick={() => navigate(`/event/${reg.eventId}`)}
                                className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <Play className="w-3 h-3" /> Join Online
                              </button>
                            )}
                            {reg.eventStatus === "completed" && (
                              <button
                                onClick={() => navigate(`/post-event/${reg.eventId}`)}
                                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Post-Event Report
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-400 leading-relaxed">
                            To dial in: call the conference number, wait for the prompt, then enter your PIN <strong className="text-slate-300 font-mono">{reg.accessPin}</strong> followed by <strong className="text-slate-300">#</strong>. You will be connected automatically.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        No CuraLive Direct PIN assigned. Contact your event organiser if you need dial-in access.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer help */}
        {registrations && registrations.length > 0 && (
          <div className="mt-8 rounded-xl border border-slate-700/50 bg-[#0d1526] p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Need help?</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              If you have lost your PIN or need a new one, contact your event organiser or CuraLive account manager. They can re-send or reset your PIN from the Operator Console.
            </p>
            <button
              onClick={() => navigate("/integrations/twilio-direct")}
              className="mt-3 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> How CuraLive Direct works
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
