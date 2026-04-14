import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, BarChart3, MessageSquare, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function PreEventIntelligenceBriefing({ sessionId }: { sessionId: number }) {
  const [activeTab, setActiveTab] = useState('consensus');

  const briefing = trpc.preEventIntelligence.getOrCreateBriefing.useQuery({ sessionId });
  const consensus = trpc.preEventIntelligence.getAnalystConsensus.useQuery(
    { briefingId: briefing.data?.id || 0 },
    { enabled: !!briefing.data?.id }
  );
  const qa = trpc.preEventIntelligence.getPredictedQa.useQuery(
    { briefingId: briefing.data?.id || 0 },
    { enabled: !!briefing.data?.id }
  );
  const hotspots = trpc.preEventIntelligence.getComplianceHotspots.useQuery(
    { briefingId: briefing.data?.id || 0 },
    { enabled: !!briefing.data?.id }
  );
  const scores = trpc.preEventIntelligence.getReadinessScores.useQuery(
    { briefingId: briefing.data?.id || 0 },
    { enabled: !!briefing.data?.id }
  );

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'High Risk';
      case 'medium': return 'Moderate';
      case 'low': return 'Low Risk';
      default: return level?.toUpperCase() ?? 'N/A';
    }
  };

  const readinessPercent = (score: any) => (((score.score ?? 0) / (score.maxScore || 1)) * 100);
  const readinessColor = (pct: number) => pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';
  const readinessBarColor = (pct: number) => pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const highRiskHotspots = (hotspots.data ?? []).filter((h: any) => h.riskLevel === 'high' || h.riskLevel === 'medium');
  const highRiskQa = (qa.data ?? []).filter((q: any) => q.riskLevel === 'high');

  const handleExport = () => {
    const lines: string[] = [];
    lines.push("PRE-EVENT INTELLIGENCE BRIEFING");
    lines.push("=".repeat(40));
    lines.push(`Session ID: ${sessionId}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    if (scores.data?.length) {
      lines.push("EVENT READINESS");
      lines.push("-".repeat(20));
      for (const s of scores.data as any[]) {
        const pct = readinessPercent(s);
        lines.push(`  ${(s.category ?? "").toUpperCase()}: ${pct.toFixed(0)}%`);
        if (s.gaps) lines.push(`    Gaps: ${s.gaps}`);
        if (s.recommendations) lines.push(`    Next steps: ${s.recommendations}`);
      }
      lines.push("");
    }

    if (consensus.data?.length) {
      lines.push("ANALYST CONSENSUS");
      lines.push("-".repeat(20));
      for (const c of consensus.data as any[]) {
        lines.push(`  ${c.metric}: Consensus ${c.consensusValue} (Range: ${c.lowEstimate} – ${c.highEstimate}, ${c.numAnalysts} analysts, Trend: ${c.revisionTrend})`);
      }
      lines.push("");
    }

    if (qa.data?.length) {
      lines.push("PREDICTED QUESTIONS");
      lines.push("-".repeat(20));
      for (const q of qa.data as any[]) {
        lines.push(`  [${(q.riskLevel ?? "low").toUpperCase()}] ${q.topic}`);
        lines.push(`    Q: ${q.predictedQuestion}`);
        lines.push(`    A: ${q.suggestedAnswer}`);
        lines.push(`    Probability: ${((q.probability ?? 0) * 100).toFixed(0)}%`);
        lines.push("");
      }
    }

    if (hotspots.data?.length) {
      lines.push("COMPLIANCE HOTSPOTS");
      lines.push("-".repeat(20));
      for (const h of hotspots.data as any[]) {
        lines.push(`  [${(h.riskLevel ?? "low").toUpperCase()}] ${h.area}`);
        lines.push(`    ${h.description}`);
        lines.push(`    Regulatory basis: ${h.regulatoryBasis}`);
        lines.push(`    Action: ${h.recommendedAction}`);
        lines.push("");
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `briefing-session-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (briefing.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pre-Event Intelligence Briefing</h2>
          <p className="text-sm text-muted-foreground mt-1">Loading briefing data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (briefing.isError || !briefing.data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pre-Event Intelligence Briefing</h2>
          <p className="text-sm text-muted-foreground mt-1">Unable to load briefing data for this session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pre-Event Intelligence Briefing</h2>
          <p className="text-sm text-muted-foreground mt-1">Analyst consensus, predicted Q&A, compliance review, and readiness assessment</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export Briefing Pack
        </Button>
      </div>

      {(highRiskHotspots.length > 0 || highRiskQa.length > 0) && (
        <Card className="bg-gradient-to-br from-red-900/30 to-amber-900/20 border-red-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-300 flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5" />
              Key Risk Areas
            </CardTitle>
            <CardDescription className="text-red-200/60">
              Items requiring immediate attention ahead of this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highRiskHotspots.map((h: any) => (
                <div key={h.id} className="flex items-start gap-2 text-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-red-100">
                    <span className="font-semibold">{h.area}:</span> {h.description}
                  </span>
                </div>
              ))}
              {highRiskQa.map((q: any) => (
                <div key={q.id} className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-red-100">
                    <span className="font-semibold">Predicted question ({q.topic}):</span> {q.predictedQuestion}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scores.data && scores.data.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-300" />
              Event Readiness
            </CardTitle>
            <CardDescription className="text-blue-200/70">
              Preparation status across key categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {scores.data.slice(0, 4).map((score: any) => {
                const pct = readinessPercent(score);
                return (
                  <div key={score.id} className="text-center">
                    <div className={`text-3xl font-bold ${readinessColor(pct)}`}>
                      {pct.toFixed(0)}%
                    </div>
                    <p className="text-xs text-blue-200 mt-1 capitalize">{score.category}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consensus" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 hidden sm:inline" />
            Analyst Consensus
          </TabsTrigger>
          <TabsTrigger value="qa" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 hidden sm:inline" />
            Predicted Q&A
            {highRiskQa.length > 0 && (
              <span className="ml-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{highRiskQa.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="hotspots" className="gap-1.5">
            <Shield className="w-3.5 h-3.5 hidden sm:inline" />
            Compliance
            {highRiskHotspots.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{highRiskHotspots.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 hidden sm:inline" />
            Readiness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Consensus Data</CardTitle>
              <CardDescription>Key financial metrics and analyst expectations ahead of the event</CardDescription>
            </CardHeader>
            <CardContent>
              {consensus.isLoading ? (
                <p className="text-muted-foreground">Loading analyst consensus data...</p>
              ) : consensus.data?.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground">No analyst consensus data available for this event.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Consensus data is populated when analyst estimates are provided prior to the event.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consensus.data?.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.metric}</p>
                        <Badge variant={item.revisionTrend === 'up' ? 'default' : 'secondary'}>
                          {item.revisionTrend === 'up' ? 'Revised Up' : item.revisionTrend === 'down' ? 'Revised Down' : 'Flat'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Consensus</p>
                          <p className="font-semibold">{item.consensusValue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Range</p>
                          <p className="font-semibold">{item.lowEstimate} — {item.highEstimate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Analysts</p>
                          <p className="font-semibold">{item.numAnalysts} covering</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predicted Questions</CardTitle>
              <CardDescription>Likely analyst and investor questions with suggested responses and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {qa.isLoading ? (
                <p className="text-muted-foreground">Generating predicted Q&A...</p>
              ) : qa.data?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground">No predicted questions generated for this event.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Questions are generated based on historical data and current market conditions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {qa.data?.map((item: any) => {
                    const riskBorder = item.riskLevel === 'high' ? 'border-l-4 border-l-red-500' : item.riskLevel === 'medium' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500';
                    return (
                      <div key={item.id} className={`border rounded-lg p-4 ${riskBorder} bg-white`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{item.topic}</p>
                          <Badge className={getRiskColor(item.riskLevel ?? 'low')}>
                            {getRiskLabel(item.riskLevel ?? 'low')}
                          </Badge>
                        </div>
                        <div className="mb-3 space-y-2">
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Predicted Question</p>
                            <p className="text-sm font-medium">{item.predictedQuestion}</p>
                          </div>
                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-xs text-blue-600 uppercase tracking-wider font-semibold mb-1">Suggested Response</p>
                            <p className="text-sm">{item.suggestedAnswer}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Probability: <span className="font-semibold">{((item.probability ?? 0) * 100).toFixed(0)}%</span></p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotspots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Hotspots</CardTitle>
              <CardDescription>Regulatory areas and topics requiring careful attention during the event</CardDescription>
            </CardHeader>
            <CardContent>
              {hotspots.isLoading ? (
                <p className="text-muted-foreground">Scanning for compliance hotspots...</p>
              ) : hotspots.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground">No compliance hotspots identified for this event.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">This is a positive signal — no areas of elevated regulatory concern were detected.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotspots.data?.map((hotspot: any) => {
                    const riskBorder = hotspot.riskLevel === 'high' ? 'border-l-4 border-l-red-500' : hotspot.riskLevel === 'medium' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500';
                    return (
                      <div key={hotspot.id} className={`border rounded-lg p-4 ${riskBorder} bg-white`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{hotspot.area}</p>
                          <Badge className={getRiskColor(hotspot.riskLevel ?? 'low')}>
                            {getRiskLabel(hotspot.riskLevel ?? 'low')}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{hotspot.description}</p>
                        <div className="bg-slate-50 rounded p-3 space-y-1.5">
                          <p className="text-xs"><span className="font-semibold text-slate-700">Regulatory basis:</span> <span className="text-slate-600">{hotspot.regulatoryBasis}</span></p>
                          <p className="text-xs"><span className="font-semibold text-blue-700">Recommended action:</span> <span className="text-slate-600">{hotspot.recommendedAction}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readiness Assessment</CardTitle>
              <CardDescription>Preparation completeness across key event readiness categories</CardDescription>
            </CardHeader>
            <CardContent>
              {scores.isLoading ? (
                <p className="text-muted-foreground">Calculating readiness scores...</p>
              ) : scores.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground">No readiness data available yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Readiness scores are generated once pre-event data is collected.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scores.data?.map((score: any) => {
                    const pct = readinessPercent(score);
                    return (
                      <div key={score.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium capitalize">{score.category}</p>
                          <p className={`font-semibold ${readinessColor(pct)}`}>{pct.toFixed(0)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`${readinessBarColor(pct)} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {score.gaps && (
                          <p className="text-xs text-muted-foreground mb-1">
                            <span className="font-medium text-amber-600">Gaps:</span> {score.gaps}
                          </p>
                        )}
                        {score.recommendations && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-blue-600">Next steps:</span> {score.recommendations}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
