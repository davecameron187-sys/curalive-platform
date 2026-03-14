import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  low: { label: "Low", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  non_compliant: <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />,
  partial: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />,
  compliant: <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />,
};

export default function ComplianceGapAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const generateMutation = trpc.compliance.generateGapAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Gap analysis complete");
    },
    onError: (e) => toast.error(`Gap analysis failed: ${e.message}`),
  });

  const handleGenerate = () => {
    generateMutation.mutate({ frameworks: ["BOTH"] });
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Compliance Gap Analysis</h1>
              <p className="text-sm text-muted-foreground">AI-powered cross-framework gap analysis and remediation roadmap</p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-2"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {generateMutation.isPending ? "Analysing..." : "Run Gap Analysis"}
          </Button>
        </div>

        {/* Empty state */}
        {!analysisResult && !generateMutation.isPending && (
          <Card className="p-12 bg-card border-border flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Target className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">No Analysis Yet</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Click <strong>Run Gap Analysis</strong> to fetch your live SOC 2 and ISO 27001 control data and generate an AI-powered remediation roadmap.
              </p>
            </div>
            <Button onClick={handleGenerate} className="gap-2 mt-2">
              <Zap className="w-4 h-4" /> Run Gap Analysis
            </Button>
          </Card>
        )}

        {/* Loading state */}
        {generateMutation.isPending && (
          <Card className="p-12 bg-card border-border flex flex-col items-center justify-center gap-4 text-center">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
            <div>
              <h2 className="text-lg font-semibold mb-1">Analysing Controls...</h2>
              <p className="text-sm text-muted-foreground">Fetching control data and generating AI remediation roadmap</p>
            </div>
          </Card>
        )}

        {/* Results */}
        {analysisResult && (
          <>
            {/* Score overview */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold">SOC 2 Type II</h2>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className={`text-4xl font-bold ${scoreColor(analysisResult.soc2.score)}`}>
                    {analysisResult.soc2.score}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Readiness Score</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-500/5 rounded p-2">
                    <div className="text-lg font-bold text-emerald-400">{analysisResult.soc2.compliant}</div>
                    <div className="text-xs text-muted-foreground">Compliant</div>
                  </div>
                  <div className="bg-amber-500/5 rounded p-2">
                    <div className="text-lg font-bold text-amber-400">{analysisResult.soc2.partial}</div>
                    <div className="text-xs text-muted-foreground">Partial</div>
                  </div>
                  <div className="bg-red-500/5 rounded p-2">
                    <div className="text-lg font-bold text-red-400">{analysisResult.soc2.nonCompliant}</div>
                    <div className="text-xs text-muted-foreground">Non-Compliant</div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-violet-400" />
                  <h2 className="font-semibold">ISO 27001 Annex A</h2>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className={`text-4xl font-bold ${scoreColor(analysisResult.iso27001.score)}`}>
                    {analysisResult.iso27001.score}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Readiness Score</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-500/5 rounded p-2">
                    <div className="text-lg font-bold text-emerald-400">{analysisResult.iso27001.compliant}</div>
                    <div className="text-xs text-muted-foreground">Compliant</div>
                  </div>
                  <div className="bg-amber-500/5 rounded p-2">
                    <div className="text-lg font-bold text-amber-400">{analysisResult.iso27001.partial}</div>
                    <div className="text-xs text-muted-foreground">Partial</div>
                  </div>
                  <div className="bg-red-500/5 rounded p-2">
                    <div className="text-lg font-bold text-red-400">{analysisResult.iso27001.nonCompliant}</div>
                    <div className="text-xs text-muted-foreground">Non-Compliant</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Top gaps */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysisResult.soc2.topGaps.length > 0 && (
                <Card className="p-5 bg-card border-border">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Top SOC 2 Gaps</h3>
                  <div className="space-y-2">
                    {analysisResult.soc2.topGaps.map((gap: any) => (
                      <div key={gap.id} className="flex items-center gap-2 text-sm">
                        {STATUS_ICON[gap.status] || STATUS_ICON.non_compliant}
                        <span className="text-muted-foreground text-xs shrink-0">{gap.category}</span>
                        <span className="text-foreground truncate">{gap.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {analysisResult.iso27001.topGaps.length > 0 && (
                <Card className="p-5 bg-card border-border">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Top ISO 27001 Gaps</h3>
                  <div className="space-y-2">
                    {analysisResult.iso27001.topGaps.map((gap: any) => (
                      <div key={gap.id} className="flex items-center gap-2 text-sm">
                        {STATUS_ICON[gap.status] || STATUS_ICON.non_compliant}
                        <span className="text-muted-foreground text-xs shrink-0">{gap.clause}</span>
                        <span className="text-foreground truncate">{gap.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* AI Remediation Roadmap */}
            {analysisResult.roadmap && analysisResult.roadmap.length > 0 && (
              <Card className="p-5 bg-card border-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-semibold">AI Remediation Roadmap</h2>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Generated {new Date(analysisResult.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {analysisResult.roadmap.map((item: any, i: number) => {
                    const pCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div key={i} className="border border-border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={`text-xs border ${pCfg.color}`}>{pCfg.label}</Badge>
                              <Badge variant="outline" className="text-xs">{item.framework}</Badge>
                              <span className="font-semibold text-sm">{item.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.estimatedEffort}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" /> {item.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Re-run Analysis
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
