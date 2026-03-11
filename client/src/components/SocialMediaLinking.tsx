import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle, AlertCircle, Link, Unlink, ExternalLink,
  Linkedin, Twitter, Facebook, Instagram, Loader2, Plus, Settings
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLATFORM_ICONS: Record<string, React.FC<any>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.76a4.83 4.83 0 0 1-1.02-.07z"/>
    </svg>
  ),
};

interface DemoLinkModal {
  platform: string;
  displayName: string;
}

export function SocialMediaLinking() {
  const [demoModal, setDemoModal] = useState<DemoLinkModal | null>(null);
  const [demoName, setDemoName] = useState("");
  const [demoHandle, setDemoHandle] = useState("");

  const { data: platforms = [], isLoading, refetch } = trpc.socialMedia.getPlatformStatus.useQuery();
  const unlinkMutation = trpc.socialMedia.unlinkAccount.useMutation({
    onSuccess: () => { refetch(); toast.success("Account disconnected"); },
  });
  const linkDemoMutation = trpc.socialMedia.linkDemoAccount.useMutation({
    onSuccess: () => {
      refetch();
      setDemoModal(null);
      setDemoName("");
      setDemoHandle("");
      toast.success("Demo account linked", { description: "Connected in demo mode — wire OAuth credentials to go live" });
    },
  });
  const { data: oauthData } = trpc.socialMedia.getOAuthUrl.useQuery(
    { platform: (demoModal?.platform as any) ?? "linkedin" },
    { enabled: !!demoModal }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold">Connected Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Link your social accounts to publish Event Echo content directly
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {platforms.filter((p) => p.linked).length} / {platforms.length} connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const Icon = PLATFORM_ICONS[platform.platform] ?? Link;
          const isLinked = platform.linked;
          const isConfigured = platform.configured;

          return (
            <div
              key={platform.platform}
              className={`relative rounded-xl border p-4 transition-all ${
                isLinked
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-card/60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: platform.color + "20" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: platform.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{platform.displayName}</div>
                    <div className="text-xs text-muted-foreground">{platform.charLimit.toLocaleString()} char limit</div>
                  </div>
                </div>
                {isLinked ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                )}
              </div>

              {isLinked && platform.accountName && (
                <div className="mb-3 p-2 rounded-lg bg-background/40 text-xs">
                  <div className="font-medium text-foreground">{platform.accountName}</div>
                  {platform.accountHandle && (
                    <div className="text-muted-foreground">{platform.accountHandle}</div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {isLinked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => platform.accountDbId && unlinkMutation.mutate({ accountId: platform.accountDbId })}
                    disabled={unlinkMutation.isPending}
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <>
                    {isConfigured && oauthData?.url ? (
                      <Button
                        size="sm"
                        className="w-full text-xs h-8"
                        style={{ backgroundColor: platform.color }}
                        asChild
                      >
                        <a href={oauthData.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Connect
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-8"
                        onClick={() => {
                          setDemoModal({ platform: platform.platform, displayName: platform.displayName });
                          setDemoName("");
                          setDemoHandle("");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Demo Connect
                      </Button>
                    )}
                  </>
                )}
              </div>

              {!isConfigured && !isLinked && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>OAuth keys needed</span>
                </div>
              )}

              <div className="mt-2 flex gap-1 flex-wrap">
                {platform.supportsImages && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">Images</Badge>
                )}
                {platform.supportsVideo && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">Video</Badge>
                )}
                {(platform as any).supportsScheduling && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">Scheduling</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <Settings className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">To enable live OAuth publishing:</p>
            <p>Set environment variables: <code className="text-amber-400">LINKEDIN_CLIENT_ID</code>, <code className="text-amber-400">TWITTER_CLIENT_ID</code>, <code className="text-amber-400">FACEBOOK_APP_ID</code>, <code className="text-amber-400">INSTAGRAM_APP_ID</code>, <code className="text-amber-400">TIKTOK_CLIENT_KEY</code> (plus matching secrets). Register your app at each platform's developer portal and set the OAuth redirect URI to <code className="text-amber-400">/api/social/oauth/callback/[platform]</code>.</p>
          </div>
        </div>
      </div>

      <Dialog open={!!demoModal} onOpenChange={() => setDemoModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demo Connect — {demoModal?.displayName}</DialogTitle>
            <DialogDescription>
              Link a demo account to test the full Event Echo workflow without OAuth credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="demo-name">Account Name</Label>
              <Input
                id="demo-name"
                placeholder="e.g. Cura Investor Relations"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-handle">Handle (optional)</Label>
              <Input
                id="demo-handle"
                placeholder="e.g. @CuraIR"
                value={demoHandle}
                onChange={(e) => setDemoHandle(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDemoModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!demoName.trim() || linkDemoMutation.isPending}
                onClick={() => {
                  if (!demoModal || !demoName.trim()) return;
                  linkDemoMutation.mutate({
                    platform: demoModal.platform as any,
                    accountName: demoName.trim(),
                    accountHandle: demoHandle.trim() || undefined,
                  });
                }}
              >
                {linkDemoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Connect Demo Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
