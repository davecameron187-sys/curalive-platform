import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialMediaLinking } from "@/components/SocialMediaLinking";
import { SocialPostCreator } from "@/components/SocialPostCreator";
import { SocialAnalyticsDashboard } from "@/components/SocialAnalyticsDashboard";
import {
  Sparkles, BarChart3, Settings, Radio, PenSquare,
  ArrowLeft, Zap, TrendingUp, Clock, CheckCircle, AlertCircle,
  Loader2, Linkedin, Twitter, Facebook, Instagram, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "echo" | "create" | "analytics" | "accounts";

const TABS: { id: Tab; label: string; icon: React.FC<any>; desc: string }[] = [
  { id: "echo", label: "Event Echo", icon: Zap, desc: "AI-generated from live events" },
  { id: "create", label: "Create Post", icon: PenSquare, desc: "Manual & AI-assisted" },
  { id: "analytics", label: "Analytics", icon: BarChart3, desc: "ROI & engagement" },
  { id: "accounts", label: "Accounts", icon: Settings, desc: "Platform connections" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  pending_approval: "text-amber-400",
  approved: "text-blue-400",
  scheduled: "text-cyan-400",
  published: "text-emerald-400",
  failed: "text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

export default function SocialMediaPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("echo");
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
  const [echoGenerating, setEchoGenerating] = useState(false);
  const [echoResult, setEchoResult] = useState<any>(null);

  const { data: posts = [], refetch: refetchPosts, isLoading: postsLoading } = trpc.socialMedia.listPosts.useQuery({
    limit: 10,
    eventId: selectedEventId,
  });

  const { data: aggregate } = trpc.socialMedia.getAggregateAnalytics.useQuery({ days: 30 });

  const generateEchoMutation = trpc.socialMedia.generateEchoPost.useMutation({
    onSuccess: (data) => {
      setEchoResult(data);
      toast.success("Event Echo generated", { description: `${data.posts.length} posts ready for review` });
    },
    onError: () => toast.error("Echo generation failed"),
  });

  const moderateMutation = trpc.socialMedia.moderatePost.useMutation({
    onSuccess: (result) => {
      refetchPosts();
      if (result.approved) {
        toast.success("Post approved", { description: result.notes?.slice(0, 100) });
      } else {
        toast.error("Post flagged", { description: result.notes?.slice(0, 100) });
      }
    },
  });

  const handleGenerateEcho = async () => {
    setEchoGenerating(true);
    try {
      await generateEchoMutation.mutateAsync({
        eventId: selectedEventId ?? 1,
        platforms: ["linkedin", "twitter"],
      });
    } finally {
      setEchoGenerating(false);
    }
  };

  const publishedCount = aggregate?.publishedPosts ?? 0;
  const draftCount = aggregate?.draftPosts ?? 0;
  const aiCount = aggregate?.aiGeneratedCount ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-violet-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-base leading-tight">Social Command Center</div>
                  <div className="text-xs text-muted-foreground">Event Echo · AI Publishing · ROI Analytics</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                {publishedCount} published
              </Badge>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-violet-600 text-white"
                onClick={() => { setActiveTab("echo"); handleGenerateEcho(); }}
                disabled={echoGenerating}
              >
                {echoGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {echoGenerating ? "Generating..." : "Run Event Echo"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Share2, label: "Total Posts", value: aggregate?.totalPosts ?? 0, color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: TrendingUp, label: "Published", value: publishedCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: Sparkles, label: "AI Generated", value: aiCount, color: "text-violet-400", bg: "bg-violet-500/10" },
            { icon: Clock, label: "Drafts / Review", value: draftCount, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-xl border border-border bg-card/50 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-card/60 rounded-xl border border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                  isActive
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "echo" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Live Event Echo
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    CuraLive analyzes your live event — transcription, sentiment, Q&A highlights — and generates
                    compliance-checked, platform-optimized social posts in seconds. One click to review and publish.
                  </p>
                </div>
                <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-xs">
                  Patent Pending
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                {[
                  { step: "1", label: "Event Data", desc: "Transcription + Q&A + Sentiment", icon: Radio, active: true },
                  { step: "2", label: "AI Analysis", desc: "LLM extracts key insights", icon: Sparkles, active: echoGenerating || !!echoResult },
                  { step: "3", label: "Compliance", desc: "Auto-moderation check", icon: CheckCircle, active: !!echoResult },
                  { step: "4", label: "Publish", desc: "Multi-platform in one click", icon: Share2, active: false },
                ].map(({ step, label, desc, icon: Icon, active }) => (
                  <div
                    key={step}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg border transition-all",
                      active ? "border-primary/30 bg-primary/5" : "border-border bg-card/40"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {!echoResult ? (
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-violet-600 text-white"
                  onClick={handleGenerateEcho}
                  disabled={echoGenerating}
                >
                  {echoGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing event data...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Event Echo Posts
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {echoResult.posts.length} posts generated from "{echoResult.eventTitle}"
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {echoResult.posts.map((post: any, i: number) => {
                      const platformColors: Record<string, string> = {
                        linkedin: "#0A66C2", twitter: "#000", facebook: "#1877F2",
                        instagram: "#E1306C", tiktok: "#FF0050"
                      };
                      const PlatformIcons: Record<string, React.FC<any>> = {
                        linkedin: Linkedin, twitter: Twitter, facebook: Facebook, instagram: Instagram
                      };
                      const Icon = PlatformIcons[post.platform] ?? Share2;
                      return (
                        <div key={i} className="rounded-xl border border-border bg-card/60 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: (platformColors[post.platform] ?? "#888") + "20" }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: platformColors[post.platform] }} />
                            </div>
                            <span className="text-sm font-medium capitalize">{post.platform === "twitter" ? "X (Twitter)" : post.platform}</span>
                            {post.predictedEngagement && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                ~{(post.predictedEngagement * 100).toFixed(0)}% engagement
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {post.content}
                          </p>
                          {post.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.hashtags.map((h: string) => (
                                <span key={h} className="text-xs text-primary">#{h.replace(/^#/, "")}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-7"
                              onClick={() => {
                                setActiveTab("create");
                              }}
                            >
                              Edit & Publish
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEchoResult(null)} className="gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Posts
              </h3>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No posts yet — run Event Echo or create manually</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const platforms = (() => { try { return JSON.parse(post.platforms); } catch { return []; } })();
                    return (
                      <div key={post.id} className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-card/80 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {post.aiGenerated && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI
                              </Badge>
                            )}
                            <div className="flex gap-1">
                              {platforms.slice(0, 3).map((p: string) => (
                                <Badge key={p} variant="outline" className="text-xs px-1.5 py-0 capitalize">
                                  {p === "twitter" ? "X" : p}
                                </Badge>
                              ))}
                            </div>
                            <span className={cn("text-xs font-medium ml-auto", STATUS_COLORS[post.status] ?? "text-muted-foreground")}>
                              {STATUS_LABELS[post.status] ?? post.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{post.content?.slice(0, 120)}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {post.moderationStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 shrink-0"
                            disabled={moderateMutation.isPending}
                            onClick={() => moderateMutation.mutate({ postId: post.id })}
                          >
                            {moderateMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Review"
                            )}
                          </Button>
                        )}
                        {post.moderationStatus === "approved" && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        )}
                        {post.moderationStatus === "flagged" && (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="rounded-xl border border-border bg-card/60 p-6">
            <SocialPostCreator eventId={selectedEventId} onPostCreated={() => { refetchPosts(); setActiveTab("echo"); }} />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="rounded-xl border border-border bg-card/60 p-6">
            <SocialAnalyticsDashboard eventId={selectedEventId} />
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="rounded-xl border border-border bg-card/60 p-6">
            <SocialMediaLinking />
          </div>
        )}
      </div>
    </div>
  );
}
