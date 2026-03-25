import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, BarChart3, Sparkles, Loader2, Target,
  Linkedin, Twitter, Facebook, Instagram, RefreshCw,
  MessageCircle, Heart, Share2, Eye
} from "lucide-react";

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

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  twitter: "#000000",
  facebook: "#1877F2",
  instagram: "#E1306C",
  tiktok: "#FF0050",
};

interface Props {
  eventId?: number;
}

export function SocialAnalyticsDashboard({ eventId }: Props) {
  const { data: aggregate, isLoading: aggLoading, refetch: refetchAgg } = trpc.socialMedia.getAggregateAnalytics.useQuery({ days: 30 });
  const { data: roiData, isLoading: roiLoading } = trpc.socialMedia.getEventSocialROI.useQuery(
    { eventId: eventId ?? 0 },
    { enabled: !!eventId }
  );

  const isLoading = aggLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = aggregate ?? { totalPosts: 0, publishedPosts: 0, draftPosts: 0, topPlatform: null, platformBreakdown: {}, aiGeneratedCount: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Social Analytics</h3>
          <p className="text-sm text-muted-foreground">Last 30 days · Event Echo performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchAgg()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: stats.totalPosts, icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Published", value: stats.publishedPosts, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "AI Generated", value: stats.aiGeneratedCount, icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Drafts", value: stats.draftPosts, icon: Target, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card/60 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {Object.keys(stats.platformBreakdown ?? {}).length > 0 && (
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Platform Distribution
          </h4>
          <div className="space-y-3">
            {Object.entries(stats.platformBreakdown ?? {})
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([platform, count]) => {
                const Icon = PLATFORM_ICONS[platform];
                const max = Math.max(...(Object.values(stats.platformBreakdown ?? {}) as number[]));
                const pct = max > 0 ? Math.round(((count as number) / max) * 100) : 0;
                return (
                  <div key={platform} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (PLATFORM_COLORS[platform] ?? "#888") + "20" }}>
                      {Icon ? <Icon className="w-3.5 h-3.5" style={{ color: PLATFORM_COLORS[platform] }} /> : null}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="capitalize font-medium">{platform === "twitter" ? "X (Twitter)" : platform}</span>
                        <span className="text-muted-foreground">{count as number} post{(count as number) !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: PLATFORM_COLORS[platform] ?? "#888" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {eventId && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Event ROI Correlation
            {roiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </h4>

          {roiData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-primary">
                  {(roiData.correlation * 100).toFixed(1)}%
                </div>
                <div>
                  <div className="text-sm font-medium">ROI Correlation</div>
                  <div className="text-xs text-muted-foreground">Social → Event engagement uplift</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{roiData.insight}</p>

              {roiData.recommendations?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-foreground mb-2 uppercase tracking-wide">AI Recommendations</div>
                  <ul className="space-y-1.5">
                    {roiData.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-primary shrink-0 font-bold">{i + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Publish posts from this event to start tracking ROI correlation between social engagement and event outcomes.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/40 p-5">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Event Echo Impact
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Estimated Reach", value: (stats.publishedPosts ?? 0) * 1200, color: "text-blue-400" },
            { icon: Heart, label: "Est. Engagements", value: (stats.publishedPosts ?? 0) * 47, color: "text-rose-400" },
            { icon: Share2, label: "Est. Shares", value: (stats.publishedPosts ?? 0) * 12, color: "text-emerald-400" },
            { icon: MessageCircle, label: "Est. Comments", value: (stats.publishedPosts ?? 0) * 8, color: "text-violet-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
              <div className="text-lg font-bold">{value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Estimates based on industry averages · Connect accounts to track live metrics
        </p>
      </div>
    </div>
  );
}
