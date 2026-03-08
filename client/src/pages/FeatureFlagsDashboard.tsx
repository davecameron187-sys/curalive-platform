import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  GitBranch,
  BarChart3,
} from "lucide-react";

export default function FeatureFlagsDashboard() {
  const [features, setFeatures] = useState([
    { id: "1", name: "Event Brief Generator", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
    { id: "2", name: "Q&A Auto-Triage", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
    { id: "3", name: "Toxicity Filter", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
    { id: "4", name: "Transcript Editing", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
    { id: "5", name: "Redaction Workflow", env: { dev: true, staging: true, prod: false }, rollout: 50, users: 12, status: "beta" },
    { id: "6", name: "Real-Time Collaboration", env: { dev: true, staging: false, prod: false }, rollout: 25, users: 6, status: "alpha" },
    { id: "7", name: "Compliance Dashboard", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
    { id: "8", name: "Speaking-Pace Coach", env: { dev: true, staging: true, prod: true }, rollout: 100, users: 24, status: "stable" },
  ]);

  const deploymentTimeline = [
    { version: "v2.5.0", date: "Mar 15, 2026", status: "planned", features: ["Compliance Dashboard", "Redaction Workflow"] },
    { version: "v2.4.0", date: "Mar 8, 2026", status: "deployed", features: ["Event Brief Generator", "Q&A Auto-Triage"] },
    { version: "v2.3.0", date: "Feb 28, 2026", status: "deployed", features: ["Transcript Editing", "Speaking-Pace Coach"] },
    { version: "v2.2.0", date: "Feb 15, 2026", status: "deployed", features: ["Toxicity Filter", "Live Rolling Summary"] },
  ];

  const toggleFeature = (featureId: string, env: "dev" | "staging" | "prod") => {
    setFeatures(features.map(f =>
      f.id === featureId
        ? { ...f, env: { ...f.env, [env]: !f.env[env] } }
        : f
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Feature Flags Dashboard</h1>
          <p className="text-muted-foreground">Manage feature rollout, A/B testing, and deployment timeline</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Features Deployed</div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-emerald-400 mt-1">100% of planned</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">In Beta</div>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold">1</div>
            <div className="text-xs text-amber-400 mt-1">Redaction Workflow</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">In Alpha</div>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">1</div>
            <div className="text-xs text-blue-400 mt-1">Real-Time Collab</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Users</div>
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-violet-400 mt-1">+8 this week</div>
          </Card>
        </div>

        <Tabs defaultValue="flags" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="rollout">Rollout Control</TabsTrigger>
            <TabsTrigger value="timeline">Deployment Timeline</TabsTrigger>
          </TabsList>

          {/* Feature Flags Tab */}
          <TabsContent value="flags" className="mt-6 space-y-4">
            <div className="grid gap-4">
              {features.map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold text-lg">{feature.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {feature.users} active users • {feature.rollout}% rollout
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        feature.status === "stable"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : feature.status === "beta"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }
                    >
                      {feature.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium mb-2">Environment Status</div>
                    <div className="grid grid-cols-3 gap-3">
                      {(["dev", "staging", "prod"] as const).map((env) => (
                        <button
                          key={env}
                          onClick={() => toggleFeature(feature.id, env)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            feature.env[env]
                              ? "bg-emerald-500/10 border-emerald-500/20"
                              : "bg-slate-500/10 border-slate-500/20"
                          }`}
                        >
                          <span className="text-sm font-medium capitalize">{env}</span>
                          {feature.env[env] ? (
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Button size="sm" variant="outline">
                      Edit Rollout
                    </Button>
                    <Button size="sm" variant="outline">
                      A/B Test
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      Disable
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rollout Control Tab */}
          <TabsContent value="rollout" className="mt-6 space-y-4">
            <div className="grid gap-4">
              {features.filter(f => f.status !== "stable").map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{feature.name}</div>
                      <div className="text-sm font-bold text-primary">{feature.rollout}%</div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${feature.rollout}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[25, 50, 75, 100].map((percent) => (
                      <Button
                        key={percent}
                        size="sm"
                        variant={feature.rollout === percent ? "default" : "outline"}
                        className="text-xs"
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Affected users: {Math.round((feature.users * feature.rollout) / 100)} / {feature.users}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-400">A/B Testing</div>
                  <div className="text-sm text-blue-300">
                    Set up A/B tests to compare feature variants and measure impact on user engagement and conversion rates.
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Deployment Timeline Tab */}
          <TabsContent value="timeline" className="mt-6 space-y-4">
            <div className="space-y-4">
              {deploymentTimeline.map((deployment, index) => (
                <Card key={deployment.version} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        deployment.status === "deployed"
                          ? "bg-emerald-500/20"
                          : "bg-slate-500/20"
                      }`}>
                        {deployment.status === "deployed" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      {index < deploymentTimeline.length - 1 && (
                        <div className="w-0.5 h-12 bg-border my-2"></div>
                      )}
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{deployment.version}</div>
                          <div className="text-sm text-muted-foreground">{deployment.date}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            deployment.status === "deployed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }
                        >
                          {deployment.status === "deployed" ? "DEPLOYED" : "PLANNED"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {deployment.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      {deployment.status === "planned" && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            Schedule
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Upcoming Releases</div>
                <Button size="sm" variant="outline">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Create Release
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Next planned release: <span className="text-primary font-semibold">v2.5.0</span> on March 15, 2026
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
