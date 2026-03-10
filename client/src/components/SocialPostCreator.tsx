import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles, Send, Shield, CheckCircle, AlertTriangle, XCircle,
  Loader2, Linkedin, Twitter, Facebook, Instagram, Copy, RotateCcw,
  Calendar, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<string, { icon: React.FC<any>; color: string; charLimit: number; name: string }> = {
  linkedin: { icon: Linkedin, color: "#0A66C2", charLimit: 3000, name: "LinkedIn" },
  twitter: { icon: Twitter, color: "#000000", charLimit: 280, name: "X (Twitter)" },
  facebook: { icon: Facebook, color: "#1877F2", charLimit: 63206, name: "Facebook" },
  instagram: { icon: Instagram, color: "#E1306C", charLimit: 2200, name: "Instagram" },
  tiktok: {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.76a4.83 4.83 0 0 1-1.02-.07z"/>
      </svg>
    ),
    color: "#FF0050",
    charLimit: 2200,
    name: "TikTok"
  },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_META);

interface Props {
  eventId?: number;
  onPostCreated?: () => void;
}

type ModerationStatus = "idle" | "checking" | "approved" | "flagged" | "rejected";

export function SocialPostCreator({ eventId, onPostCreated }: Props) {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>("idle");
  const [moderationFlags, setModerationFlags] = useState<any[]>([]);
  const [moderationNote, setModerationNote] = useState("");
  const [echoGenerating, setEchoGenerating] = useState<string | null>(null);
  const [platformContents, setPlatformContents] = useState<Record<string, string>>({});
  const [activePlatformPreview, setActivePlatformPreview] = useState<string>("linkedin");

  const { data: accounts = [] } = trpc.socialMedia.getLinkedAccounts.useQuery();
  const createPostMutation = trpc.socialMedia.createPost.useMutation();
  const moderateContentMutation = trpc.socialMedia.moderateContent.useMutation();
  const generateEchoMutation = trpc.socialMedia.generateEchoPost.useMutation();

  const linkedAccounts = accounts.filter((a) => selectedPlatforms.includes(a.platform));

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
    setModerationStatus("idle");
  };

  const handleModerate = async () => {
    if (!content.trim()) return;
    setModerationStatus("checking");
    try {
      const result = await moderateContentMutation.mutateAsync({ content });
      const highFlags = result.flags.filter((f: any) => f.severity === "high" || f.severity === "critical");
      if (result.approved) {
        setModerationStatus("approved");
      } else if (highFlags.length > 0) {
        setModerationStatus("rejected");
      } else {
        setModerationStatus("flagged");
      }
      setModerationFlags(result.flags ?? []);
      setModerationNote(result.reasoning ?? "");
    } catch {
      setModerationStatus("idle");
      toast.error("Moderation check failed");
    }
  };

  const handleEchoGenerate = async (platform?: string) => {
    setEchoGenerating(platform ?? "all");
    try {
      const result = await generateEchoMutation.mutateAsync({
        eventId: eventId ?? 1,
        platforms: platform ? [platform as any] : (selectedPlatforms as any[]),
      });
      if (result.posts.length > 0) {
        const newContents: Record<string, string> = { ...platformContents };
        for (const post of result.posts) {
          newContents[post.platform] = post.content + (post.hashtags?.length ? "\n\n" + post.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ") : "");
        }
        setPlatformContents(newContents);
        if (!platform && result.posts[0]) {
          setContent(result.posts[0].content);
          setActivePlatformPreview(result.posts[0].platform);
        } else if (platform) {
          setContent(newContents[platform] ?? content);
        }
        setModerationStatus("idle");
        toast.success("Event Echo generated", { description: `AI created ${result.posts.length} platform-optimized posts` });
      }
    } catch {
      toast.error("Echo generation failed");
    } finally {
      setEchoGenerating(null);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    if (moderationStatus !== "approved") {
      toast.error("Run compliance check first", { description: "Content must be approved before publishing" });
      return;
    }
    try {
      const post = await createPostMutation.mutateAsync({
        content,
        platforms: selectedPlatforms as any[],
        eventId,
      });
      toast.success("Post saved & queued", { description: "Draft created — connect accounts to publish live" });
      setContent("");
      setPlatformContents({});
      setModerationStatus("idle");
      setModerationFlags([]);
      onPostCreated?.();
    } catch {
      toast.error("Failed to create post");
    }
  };

  const activeContent = platformContents[activePlatformPreview] ?? content;
  const charLimit = PLATFORM_META[activePlatformPreview]?.charLimit ?? 3000;
  const charPercent = Math.min(100, (activeContent.length / charLimit) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Create Post</h3>
          <p className="text-sm text-muted-foreground">AI-powered or manual content creation</p>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-violet-600 text-white"
          onClick={() => handleEchoGenerate()}
          disabled={!!echoGenerating}
        >
          {echoGenerating === "all" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Event Echo — Generate All
        </Button>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Platforms</div>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const meta = PLATFORM_META[platform];
            const Icon = meta.icon;
            const selected = selectedPlatforms.includes(platform);
            const hasGenerated = !!platformContents[platform];

            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  selected
                    ? "border-current text-white"
                    : "border-border text-muted-foreground hover:border-current hover:text-foreground"
                )}
                style={selected ? { borderColor: meta.color, backgroundColor: meta.color + "20", color: meta.color } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.name}
                {hasGenerated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlatforms.length > 1 && Object.keys(platformContents).length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Platform Preview</div>
          <div className="flex gap-1.5 flex-wrap">
            {selectedPlatforms.map((platform) => {
              const meta = PLATFORM_META[platform];
              const Icon = meta.icon;
              const isActive = activePlatformPreview === platform;
              return (
                <button
                  key={platform}
                  onClick={() => {
                    setActivePlatformPreview(platform);
                    if (platformContents[platform]) setContent(platformContents[platform]);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all",
                    isActive ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-current"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {meta.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <Textarea
          placeholder="Write your post here — or click 'Event Echo' to generate from event data..."
          value={activeContent}
          onChange={(e) => {
            const val = e.target.value;
            setContent(val);
            if (activePlatformPreview) {
              setPlatformContents((prev) => ({ ...prev, [activePlatformPreview]: val }));
            }
            setModerationStatus("idle");
          }}
          className="min-h-[160px] resize-none bg-background/60 border-border text-sm leading-relaxed pr-12"
        />
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
          <span
            className={cn(
              "text-xs font-mono",
              charPercent > 90 ? "text-red-400" : charPercent > 75 ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {activeContent.length} / {charLimit.toLocaleString()}
          </span>
          <div
            className="w-12 h-1 rounded-full overflow-hidden bg-border"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                charPercent > 90 ? "bg-red-400" : charPercent > 75 ? "bg-amber-400" : "bg-emerald-400"
              )}
              style={{ width: `${charPercent}%` }}
            />
          </div>
        </div>
      </div>

      {moderationFlags.length > 0 && (
        <div className="space-y-2">
          {moderationFlags.map((flag, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 p-3 rounded-lg border text-sm",
                flag.severity === "critical" || flag.severity === "high"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", flag.severity === "critical" || flag.severity === "high" ? "text-red-400" : "text-amber-400")} />
              <div>
                <div className="font-medium capitalize">{flag.type.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground">{flag.explanation}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {moderationNote && moderationStatus !== "idle" && (
        <div className={cn(
          "flex gap-3 p-3 rounded-lg border text-sm",
          moderationStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
        )}>
          {moderationStatus === "approved" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : moderationStatus === "rejected" ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <span className="text-xs text-muted-foreground">{moderationNote}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleModerate}
          disabled={!content.trim() || moderateContentMutation.isPending || moderationStatus === "checking"}
        >
          {moderationStatus === "checking" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {moderationStatus === "checking" ? "Checking..." : "Compliance Check"}
        </Button>

        <Button
          size="sm"
          className="gap-2"
          onClick={handlePublish}
          disabled={!content.trim() || moderationStatus !== "approved" || createPostMutation.isPending}
        >
          {createPostMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {linkedAccounts.length > 0 ? `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}` : "Save Draft"}
        </Button>

        {content.trim() && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        )}
      </div>

      {moderationStatus === "approved" && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Content cleared for publishing
        </div>
      )}
    </div>
  );
}

