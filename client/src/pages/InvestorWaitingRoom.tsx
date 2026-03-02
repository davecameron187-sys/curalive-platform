import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Video, CheckCircle2, Clock, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type WaitingRoomStatus = "not_arrived" | "in_waiting_room" | "admitted" | "completed" | "no_show";

type CheckInResult = {
  investor: { id: number; name: string; institution: string; jobTitle?: string | null; waitingRoomStatus: WaitingRoomStatus };
  meeting: {
    id: number;
    meetingDate: string;
    startTime: string;
    endTime: string;
    platform: string;
    videoLink?: string | null;
    meetingId?: string | null;
    passcode?: string | null;
    status: string;
    currentSlideIndex: number;
    totalSlides: number;
    slideDeckUrl?: string | null;
  } | null;
  roadshow: { title: string; issuer: string } | null;
};

// ─── Status display helpers ───────────────────────────────────────────────────
function StatusCard({ status }: { status: WaitingRoomStatus }) {
  if (status === "in_waiting_room") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold">You're in the waiting room</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          The operator will admit you when your meeting is ready to begin. Please keep this page open.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Waiting for admission…
        </div>
      </div>
    );
  }
  if (status === "admitted") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-400">You've been admitted!</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          The operator has admitted you to the meeting. Please join using the link below.
        </p>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="w-20 h-20 rounded-full bg-slate-500/10 border-2 border-slate-500/40 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold">Meeting completed</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Thank you for joining. This meeting has concluded.
        </p>
      </div>
    );
  }
  if (status === "no_show") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Meeting missed</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          This meeting slot has been marked as no-show. Please contact the operator to reschedule.
        </p>
      </div>
    );
  }
  return null;
}

// ─── Slide viewer (read-only for investor) ───────────────────────────────────
function SlideViewer({ slideDeckUrl, currentSlide, totalSlides }: {
  slideDeckUrl: string;
  currentSlide: number;
  totalSlides: number;
}) {
  // Render PDF pages using an iframe with page hash (works for most PDF viewers)
  const pageUrl = `${slideDeckUrl}#page=${currentSlide + 1}`;

  return (
    <div className="mt-6 border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/60">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presentation</span>
        <span className="text-xs text-muted-foreground">Slide {currentSlide + 1} of {totalSlides}</span>
      </div>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          key={currentSlide}
          src={pageUrl}
          className="absolute inset-0 w-full h-full border-0"
          title={`Slide ${currentSlide + 1}`}
        />
      </div>
      <div className="px-4 py-2 border-t border-border bg-card/60">
        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalSlides, 20) }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i === currentSlide ? "bg-primary" : "bg-border"}`}
            />
          ))}
          {totalSlides > 20 && <span className="text-xs text-muted-foreground ml-1">+{totalSlides - 20}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvestorWaitingRoom() {
  const { token } = useParams<{ token: string }>();
  const [checkInData, setCheckInData] = useState<CheckInResult | null>(null);
  const [status, setStatus] = useState<WaitingRoomStatus>("not_arrived");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ablyRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const meetingChannelRef = useRef<any>(null);

  // Check-in mutation
  const checkIn = trpc.liveVideo.investorCheckIn.useMutation({
    onSuccess: (data) => {
      setCheckInData(data as CheckInResult);
      setStatus((data as CheckInResult).investor.waitingRoomStatus);
      setCurrentSlide((data as CheckInResult).meeting?.currentSlideIndex ?? 0);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Poll for status updates (fallback if Ably not available)
  const { data: statusData } = trpc.liveVideo.getInvestorStatus.useQuery(
    { inviteToken: token ?? "" },
    {
      enabled: !!token && !!checkInData,
      refetchInterval: 8000, // Poll every 8s as fallback
    }
  );

  // Ably token for real-time
  const { data: ablyTokenData } = trpc.liveVideo.getInvestorAblyToken.useQuery(
    { inviteToken: token ?? "" },
    { enabled: !!token && !!checkInData }
  );

  // Auto check-in on mount
  useEffect(() => {
    if (token && !checkInData && !checkIn.isPending) {
      checkIn.mutate({ inviteToken: token });
    }
  }, [token]);

  // Apply polled status updates
  useEffect(() => {
    if (statusData) {
      setStatus(statusData.waitingRoomStatus as WaitingRoomStatus);
      if (statusData.meeting) {
        setCurrentSlide(statusData.meeting.currentSlideIndex);
      }
    }
  }, [statusData]);

  // Wire Ably for real-time updates
  useEffect(() => {
    if (!ablyTokenData?.tokenRequest || !checkInData) return;

    let mounted = true;
    (async () => {
      try {
        const Ably = (await import("ably")).default ?? (await import("ably"));
        const client = new (Ably as any).Realtime({
          authCallback: (_: any, callback: any) => {
            callback(null, ablyTokenData.tokenRequest);
          },
        });
        ablyRef.current = client;

        // Personal status channel
        const investorChannel = client.channels.get(`roadshow-investor-${checkInData.investor.id}`);
        investorChannel.subscribe("status-update", (msg: any) => {
          if (!mounted) return;
          setStatus(msg.data.waitingRoomStatus as WaitingRoomStatus);
        });
        channelRef.current = investorChannel;

        // Meeting slide channel
        if (checkInData.meeting) {
          const meetingChannel = client.channels.get(
            `roadshow-${checkInData.roadshow?.title}-meeting-${checkInData.meeting.id}`
          );
          meetingChannel.subscribe("slide-change", (msg: any) => {
            if (!mounted) return;
            setCurrentSlide(msg.data.slideIndex);
          });
          meetingChannelRef.current = meetingChannel;
        }
      } catch (_) {
        // Ably not available — rely on polling
      }
    })();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
      meetingChannelRef.current?.unsubscribe();
      ablyRef.current?.close();
    };
  }, [ablyTokenData, checkInData]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid link</h2>
          <p className="text-muted-foreground">This invite link is missing a token.</p>
        </div>
      </div>
    );
  }

  if (checkIn.isPending) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking you in…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to check in</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Please check your invite link or contact the operator.</p>
        </div>
      </div>
    );
  }

  if (!checkInData) return null;

  const { investor, meeting, roadshow } = checkInData;
  const isAdmitted = status === "admitted";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Chorus.AI</span>
          </div>
          <div className="text-xs text-muted-foreground">Investor Waiting Room</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Roadshow / meeting info */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{roadshow?.issuer}</p>
              <h1 className="text-lg font-bold">{roadshow?.title}</h1>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              status === "admitted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
              status === "in_waiting_room" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              status === "completed" ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" :
              "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {status === "in_waiting_room" ? "In Waiting Room" :
               status === "admitted" ? "Admitted" :
               status === "completed" ? "Completed" :
               status === "no_show" ? "No Show" : "Checking in…"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Investor</p>
              <p className="font-medium">{investor.name}</p>
              <p className="text-muted-foreground text-xs">{investor.institution}{investor.jobTitle ? ` · ${investor.jobTitle}` : ""}</p>
            </div>
            {meeting && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Meeting Time</p>
                <p className="font-medium">{meeting.meetingDate}</p>
                <p className="text-muted-foreground text-xs">{meeting.startTime} – {meeting.endTime}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status card */}
        <StatusCard status={status} />

        {/* Join button — shown when admitted */}
        {isAdmitted && meeting?.videoLink && (
          <div className="mt-6">
            <a
              href={meeting.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity"
            >
              <Video className="w-5 h-5" />
              Join Meeting on {meeting.platform.charAt(0).toUpperCase() + meeting.platform.slice(1)}
            </a>
            {meeting.meetingId && (
              <div className="mt-3 bg-card border border-border rounded-lg p-3 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Meeting ID</span>
                  <span className="font-mono font-medium">{meeting.meetingId}</span>
                </div>
                {meeting.passcode && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Passcode</span>
                    <span className="font-mono font-medium">{meeting.passcode}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Slide deck — shown when meeting has a deck and investor is admitted */}
        {isAdmitted && meeting?.slideDeckUrl && meeting.totalSlides > 0 && (
          <SlideViewer
            slideDeckUrl={meeting.slideDeckUrl}
            currentSlide={currentSlide}
            totalSlides={meeting.totalSlides}
          />
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8" style={{ fontFamily: "'Inter', sans-serif" }}>
          Keep this page open. You will be notified automatically when the operator admits you.
        </p>
      </div>
    </div>
  );
}
