/**
 * OnDemandWatch.tsx — Token-gated on-demand recording page for registered attendees.
 *
 * Route: /live-video/webcast/:slug/watch?token=<attendeeToken>
 *
 * Validates the attendee token, then renders:
 *   - Full-width Mux on-demand player (or native <video> for non-Mux URLs)
 *   - Event metadata (title, host, date)
 *   - "Event not yet available" state when recording is not ready
 *   - Invalid token / not found error state
 */
import { useState } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import {
  Zap, ArrowLeft, Calendar, Building2, Clock, AlertCircle,
  Loader2, Play, Download, Share2, CheckCircle2, Lock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import MuxPlayer from "@mux/mux-player-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDuration(startTs: number | null | undefined, endTs: number | null | undefined): string {
  if (!startTs || !endTs) return "—";
  const mins = Math.round((endTs - startTs) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnDemandWatch() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [, navigate] = useLocation();

  const { data, isLoading, error } = trpc.webcast.getOnDemandAccess.useQuery(
    { slug, token },
    { retry: false, refetchOnWindowFocus: false, enabled: !!token }
  );

  // ── No token provided ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Access Link Required</h1>
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            This recording is only accessible via your personal link from the registration confirmation email.
          </p>
          <button
            onClick={() => navigate(`/live-video/webcast/${slug}/register`)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Register to Access
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  // ── Invalid token / not found ──────────────────────────────────────────────
  if (error || !data || !data.valid) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Access Link</h1>
          <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            This link is invalid or has expired. Please check your registration confirmation email for the correct link.
          </p>
          <button
            onClick={() => navigate(`/live-video/webcast/${slug}/register`)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Register Again
          </button>
        </div>
      </div>
    );
  }

  // ── Recording not yet available ────────────────────────────────────────────
  const isLiveOrScheduled = data.eventStatus === "live" || data.eventStatus === "scheduled" || data.eventStatus === "draft";
  if (isLiveOrScheduled || !data.recordingUrl) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-foreground flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {/* Header */}
        <header className="flex items-center gap-3 px-4 h-14 border-b border-border bg-[#0a0d14]/90 backdrop-blur-md">
          <button
            onClick={() => navigate(`/live-video/webcast/${slug}/attend?token=${token}`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Event</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm truncate max-w-xs">{data.eventTitle}</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {data.eventStatus === "live" ? "Event is Live Right Now" : "Recording Not Yet Available"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              {data.eventStatus === "live"
                ? "The event is currently in progress. The recording will be available shortly after it ends."
                : "The recording will be published here once the event has concluded. Check back soon."}
            </p>
            {data.eventStatus === "live" && (
              <button
                onClick={() => navigate(`/live-video/webcast/${slug}/attend?token=${token}`)}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity mx-auto"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Watch Live Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Recording available ────────────────────────────────────────────────────
  return <OnDemandPlayer data={data} slug={slug} token={token} />;
}

// ─── On-demand player component ───────────────────────────────────────────────
function OnDemandPlayer({
  data,
  slug,
  token,
}: {
  data: {
    eventTitle: string;
    eventStatus: string;
    recordingUrl: string | null;
    muxPlaybackId: string | null;
    attendeeName: string;
    hostName: string | null | undefined;
    hostOrganization: string | null | undefined;
    startTime: number | null | undefined;
    endTime: number | null | undefined;
  };
  slug: string;
  token: string;
}) {
  const [, navigate] = useLocation();
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/live-video/webcast/${slug}/watch?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Personal watch link copied to clipboard");
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-foreground flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-[#0a0d14]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/live-video/webcasting`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Webcasting</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm truncate max-w-[180px] sm:max-w-xs">{data.eventTitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Registered</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs border border-border px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Player + metadata */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Player */}
          <div className="bg-black w-full" style={{ aspectRatio: "16/9", maxHeight: "calc(100vh - 14rem)" }}>
            {data.muxPlaybackId ? (
              <MuxPlayer
                playbackId={data.muxPlaybackId}
                streamType="on-demand"
                autoPlay={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : data.recordingUrl ? (
              <video
                src={data.recordingUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Recording unavailable</p>
                </div>
              </div>
            )}
          </div>

          {/* Event metadata */}
          <div className="p-5 border-b border-border">
            <h1 className="text-xl font-bold mb-3">{data.eventTitle}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              {data.hostOrganization && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{data.hostOrganization}</span>
                </div>
              )}
              {data.startTime && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(data.startTime)}</span>
                </div>
              )}
              {data.startTime && data.endTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(data.startTime, data.endTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-card/20">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Watching as {data.attendeeName}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Copy Link
              </button>
              <button
                onClick={() => toast.info("Download will be available soon")}
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* On-demand notice */}
          <div className="px-5 py-4 bg-card/10">
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <Play className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary mb-0.5">On-Demand Recording</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                  This recording is available exclusively to registered attendees. Your personal link grants access for 90 days from the event date.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Related / info panel */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-[#0a0d14] shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Event Details</h2>
          </div>
          <div className="p-4 space-y-4 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Event</p>
              <p className="font-medium">{data.eventTitle}</p>
            </div>
            {data.hostName && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Host</p>
                <p className="font-medium">{data.hostName}</p>
              </div>
            )}
            {data.hostOrganization && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Organisation</p>
                <p className="font-medium">{data.hostOrganization}</p>
              </div>
            )}
            {data.startTime && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="font-medium">{formatDate(data.startTime)}</p>
              </div>
            )}
            {data.startTime && data.endTime && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{formatDuration(data.startTime, data.endTime)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                On Demand
              </span>
            </div>
          </div>

          {/* Access info */}
          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Access granted to {data.attendeeName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
