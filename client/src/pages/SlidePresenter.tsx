import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ChevronLeft, ChevronRight, Upload, Loader2, Video,
  AlertCircle, Users, CheckCircle2, Clock, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// ─── Slide control panel ──────────────────────────────────────────────────────
function SlideControl({
  meeting,
  roadshowId,
  onSlideChange,
}: {
  meeting: {
    id: number;
    slideDeckUrl?: string | null;
    slideDeckName?: string | null;
    currentSlideIndex: number;
    totalSlides: number;
    status: string;
  };
  roadshowId: string;
  onSlideChange: (idx: number) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(meeting.currentSlideIndex);
  const utils = trpc.useUtils();

  const setSlide = trpc.liveVideo.setSlideIndex.useMutation({
    onSuccess: () => utils.liveVideo.getRoadshow.invalidate({ roadshowId }),
  });

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(meeting.totalSlides - 1, currentSlide + delta));
    setCurrentSlide(next);
    onSlideChange(next);
    setSlide.mutate({ meetingDbId: meeting.id, slideIndex: next, roadshowId });
  };

  const goTo = (idx: number) => {
    setCurrentSlide(idx);
    onSlideChange(idx);
    setSlide.mutate({ meetingDbId: meeting.id, slideIndex: idx, roadshowId });
  };

  if (!meeting.slideDeckUrl) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Slide preview */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          key={currentSlide}
          src={`${meeting.slideDeckUrl}#page=${currentSlide + 1}`}
          className="absolute inset-0 w-full h-full border-0"
          title={`Slide ${currentSlide + 1}`}
        />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">{meeting.slideDeckName ?? "Presentation"}</span>
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {meeting.totalSlides}
          </span>
        </div>

        {/* Slide strip */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {Array.from({ length: Math.min(meeting.totalSlides, 30) }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex-shrink-0 w-8 h-6 rounded text-xs font-medium transition-colors ${
                i === currentSlide
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => go(-1)}
            disabled={currentSlide === 0 || setSlide.isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => go(1)}
            disabled={currentSlide >= meeting.totalSlides - 1 || setSlide.isPending}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Investor row ─────────────────────────────────────────────────────────────
function InvestorRow({
  investor,
  roadshowId,
  meetingDbId,
}: {
  investor: {
    id: number;
    name: string;
    institution: string;
    waitingRoomStatus: string;
    inviteToken?: string | null;
  };
  roadshowId: string;
  meetingDbId: number;
}) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.liveVideo.updateInvestorStatus.useMutation({
    onSuccess: () => utils.liveVideo.getRoadshow.invalidate({ roadshowId }),
  });

  const origin = window.location.origin;
  const inviteUrl = investor.inviteToken ? `${origin}/live-video/join/${investor.inviteToken}` : null;

  const statusColor: Record<string, string> = {
    not_arrived: "text-muted-foreground",
    in_waiting_room: "text-amber-400",
    admitted: "text-emerald-400",
    completed: "text-slate-400",
    no_show: "text-red-400",
  };

  const statusLabel: Record<string, string> = {
    not_arrived: "Not arrived",
    in_waiting_room: "In waiting room",
    admitted: "Admitted",
    completed: "Completed",
    no_show: "No show",
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{investor.name}</p>
        <p className="text-xs text-muted-foreground truncate">{investor.institution}</p>
      </div>
      <span className={`text-xs font-semibold ${statusColor[investor.waitingRoomStatus] ?? "text-muted-foreground"}`}>
        {statusLabel[investor.waitingRoomStatus] ?? investor.waitingRoomStatus}
      </span>
      <div className="flex gap-1">
        {investor.waitingRoomStatus === "in_waiting_room" && (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => updateStatus.mutate({
              investorId: investor.id,
              waitingRoomStatus: "admitted",
              roadshowId,
              meetingDbId,
            })}
            disabled={updateStatus.isPending}
          >
            Admit
          </Button>
        )}
        {investor.waitingRoomStatus === "admitted" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => updateStatus.mutate({
              investorId: investor.id,
              waitingRoomStatus: "completed",
              roadshowId,
              meetingDbId,
            })}
            disabled={updateStatus.isPending}
          >
            Complete
          </Button>
        )}
        {(investor.waitingRoomStatus === "not_arrived" || investor.waitingRoomStatus === "in_waiting_room") && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-red-400 hover:text-red-300"
            onClick={() => updateStatus.mutate({
              investorId: investor.id,
              waitingRoomStatus: "no_show",
              roadshowId,
              meetingDbId,
            })}
            disabled={updateStatus.isPending}
          >
            No show
          </Button>
        )}
        {inviteUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Invite link copied"); }}
          >
            Copy link
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SlidePresenter() {
  const { roadshowId, meetingId } = useParams<{ roadshowId: string; meetingId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ablyRef = useRef<any>(null);
  const utils = trpc.useUtils();

  const meetingDbId = parseInt(meetingId ?? "0", 10);

  const { data, isLoading } = trpc.liveVideo.getRoadshow.useQuery(
    { roadshowId: roadshowId ?? "" },
    { enabled: !!roadshowId && isAuthenticated, refetchInterval: 10000 }
  );

  const meeting = data?.meetings.find((m) => m.id === meetingDbId);
  const investors = data?.investors.filter((i) => i.meetingId === meetingDbId) ?? [];

  const updateSlideDeck = trpc.liveVideo.updateSlideDeck.useMutation({
    onSuccess: () => {
      utils.liveVideo.getRoadshow.invalidate({ roadshowId });
      toast.success("Slide deck uploaded");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMeetingStatus = trpc.liveVideo.updateMeetingStatus.useMutation({
    onSuccess: () => utils.liveVideo.getRoadshow.invalidate({ roadshowId }),
  });

  // Ably token for operator
  const { data: ablyTokenData } = trpc.liveVideo.getRoadshowAblyToken.useQuery(
    { roadshowId: roadshowId ?? "", meetingDbId },
    { enabled: !!roadshowId && !!meetingDbId && isAuthenticated }
  );

  // Wire Ably for real-time investor status updates
  useEffect(() => {
    if (!ablyTokenData?.tokenRequest) return;
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
        const channel = client.channels.get(
          `roadshow-${roadshowId}-meeting-${meetingDbId}`
        );
        channel.subscribe("investor-status", () => {
          if (!mounted) return;
          // Invalidate to re-fetch fresh investor statuses
          utils.liveVideo.getRoadshow.invalidate({ roadshowId });
        });
      } catch (_) {
        // Ably unavailable — rely on polling
      }
    })();
    return () => {
      mounted = false;
      ablyRef.current?.close();
    };
  }, [ablyTokenData]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meeting) return;
    if (!file.name.match(/\.(pdf|pptx|ppt)$/i)) {
      toast.error("Please upload a PDF or PowerPoint file");
      return;
    }
    setUploading(true);
    try {
      // Upload to S3 via server
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-slide-deck", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url, totalSlides } = await res.json();
      await updateSlideDeck.mutateAsync({
        meetingDbId: meeting.id,
        slideDeckUrl: url,
        slideDeckName: file.name,
        totalSlides: totalSlides ?? 1,
      });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Meeting not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(`/live-video/roadshow/${roadshowId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roadshow
          </Button>
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    scheduled: "text-muted-foreground",
    waiting_room_open: "text-amber-400",
    in_progress: "text-emerald-400",
    completed: "text-slate-400",
    cancelled: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/live-video/roadshow/${roadshowId}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <span className="font-bold text-sm">{data?.roadshow.title}</span>
              <span className="text-muted-foreground text-xs ml-2">
                {meeting.meetingDate} · {meeting.startTime}–{meeting.endTime}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${statusColor[meeting.status] ?? "text-muted-foreground"}`}>
              {meeting.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            {meeting.status === "scheduled" && (
              <Button size="sm" onClick={() => updateMeetingStatus.mutate({ meetingDbId: meeting.id, status: "waiting_room_open" })}>
                Open Waiting Room
              </Button>
            )}
            {meeting.status === "waiting_room_open" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateMeetingStatus.mutate({ meetingDbId: meeting.id, status: "in_progress" })}>
                Start Meeting
              </Button>
            )}
            {meeting.status === "in_progress" && (
              <Button size="sm" variant="outline" onClick={() => updateMeetingStatus.mutate({ meetingDbId: meeting.id, status: "completed" })}>
                End Meeting
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Slide control */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Slide Deck</h2>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.ppt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5 mr-1" /> Upload PDF/PPTX</>
                    )}
                  </Button>
                </div>
              </div>
              {meeting.slideDeckUrl ? (
                <SlideControl
                  meeting={meeting}
                  roadshowId={roadshowId ?? ""}
                  onSlideChange={setCurrentSlide}
                />
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No slide deck uploaded yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload a PDF or PPTX to control slides during the meeting.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload Slide Deck
                  </Button>
                </div>
              )}
            </div>

            {/* Meeting link */}
            {meeting.videoLink && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="font-semibold mb-3">Meeting Link</h2>
                <div className="flex items-center gap-2">
                  <Input value={meeting.videoLink} readOnly className="font-mono text-xs" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(meeting.videoLink!); toast.success("Copied"); }}
                  >
                    Copy
                  </Button>
                  <a href={meeting.videoLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm">
                      <Video className="w-3.5 h-3.5 mr-1" /> Join
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right: Investor waiting room */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Waiting Room
                </h2>
                <span className="text-xs text-muted-foreground">
                  {investors.filter((i) => i.waitingRoomStatus === "in_waiting_room").length} waiting
                </span>
              </div>
              {investors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No investors assigned to this slot.</p>
              ) : (
                <div>
                  {investors.map((inv) => (
                    <InvestorRow
                      key={inv.id}
                      investor={inv}
                      roadshowId={roadshowId ?? ""}
                      meetingDbId={meetingDbId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Admitted", count: investors.filter((i) => i.waitingRoomStatus === "admitted").length, icon: CheckCircle2, color: "text-emerald-400" },
                { label: "Waiting", count: investors.filter((i) => i.waitingRoomStatus === "in_waiting_room").length, icon: Clock, color: "text-amber-400" },
              ].map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
