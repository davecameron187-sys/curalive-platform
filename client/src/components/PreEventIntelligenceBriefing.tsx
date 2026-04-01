import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pre-Event Intelligence Briefing</h2>
          <p className="text-sm text-muted-foreground mt-1">60-minute prep briefing with analyst consensus, predicted Q&A, and compliance hotspots</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Briefing
        </Button>
      </div>

      {scores.data && scores.data.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader>
            <CardTitle className="text-white">Event Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {scores.data.slice(0, 4).map((score: any) => (
                <div key={score.id} className="text-center">
                  <div className="text-3xl font-bold text-blue-300">
                    {(((score.score ?? 0) / (score.maxScore || 1)) * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-blue-200 mt-1">{score.category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="qa">Predicted Q&A</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Consensus Data</CardTitle>
              <CardDescription>Key metrics and analyst expectations</CardDescription>
            </CardHeader>
            <CardContent>
              {consensus.isLoading ? (
                <p className="text-muted-foreground">Loading consensus data...</p>
              ) : consensus.data?.length === 0 ? (
                <p className="text-muted-foreground">No consensus data available</p>
              ) : (
                <div className="space-y-3">
                  {consensus.data?.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.metric}</p>
                        <Badge variant={item.revisionTrend === 'up' ? 'default' : 'secondary'}>
                          {item.revisionTrend?.toUpperCase() ?? 'FLAT'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Consensus</p>
                          <p className="font-semibold">{item.consensusValue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Range</p>
                          <p className="font-semibold">{item.lowEstimate} - {item.highEstimate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Analysts</p>
                          <p className="font-semibold">{item.numAnalysts}</p>
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
              <CardTitle>Predicted Q&A</CardTitle>
              <CardDescription>Likely questions and suggested responses</CardDescription>
            </CardHeader>
            <CardContent>
              {qa.isLoading ? (
                <p className="text-muted-foreground">Loading Q&A...</p>
              ) : qa.data?.length === 0 ? (
                <p className="text-muted-foreground">No predicted Q&A available</p>
              ) : (
                <div className="space-y-3">
                  {qa.data?.map((item: any) => (
                    <div key={item.id} className={`border-2 rounded-lg p-4 ${getRiskColor(item.riskLevel ?? 'low')}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.topic}</p>
                        <Badge className={getRiskColor(item.riskLevel ?? 'low')}>
                          {(item.riskLevel ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold mb-1">Q: {item.predictedQuestion}</p>
                        <p className="text-sm">A: {item.suggestedAnswer}</p>
                      </div>
                      <p className="text-xs opacity-75">Probability: {((item.probability ?? 0) * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotspots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Hotspots</CardTitle>
              <CardDescription>Areas requiring careful attention</CardDescription>
            </CardHeader>
            <CardContent>
              {hotspots.isLoading ? (
                <p className="text-muted-foreground">Loading hotspots...</p>
              ) : hotspots.data?.length === 0 ? (
                <p className="text-muted-foreground">No compliance hotspots identified</p>
              ) : (
                <div className="space-y-3">
                  {hotspots.data?.map((hotspot: any) => (
                    <div key={hotspot.id} className={`border-2 rounded-lg p-4 ${getRiskColor(hotspot.riskLevel ?? 'low')}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{hotspot.area}</p>
                        <Badge className={getRiskColor(hotspot.riskLevel ?? 'low')}>
                          {(hotspot.riskLevel ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{hotspot.description}</p>
                      <p className="text-xs font-semibold mb-1">Regulatory: {hotspot.regulatoryBasis}</p>
                      <p className="text-xs">Action: {hotspot.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readiness Assessment</CardTitle>
              <CardDescription>Preparation status by category</CardDescription>
            </CardHeader>
            <CardContent>
              {scores.isLoading ? (
                <p className="text-muted-foreground">Loading readiness scores...</p>
              ) : scores.data?.length === 0 ? (
                <p className="text-muted-foreground">No readiness data available</p>
              ) : (
                <div className="space-y-3">
                  {scores.data?.map((score: any) => (
                    <div key={score.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{score.category}</p>
                        <p className="font-semibold">{(((score.score ?? 0) / (score.maxScore || 1)) * 100).toFixed(0)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${((score.score ?? 0) / (score.maxScore || 1)) * 100}%` }}
                        />
                      </div>
                      {score.gaps && <p className="text-xs text-muted-foreground mb-1">Gaps: {score.gaps}</p>}
                      {score.recommendations && <p className="text-xs font-semibold">Recommendations: {score.recommendations}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
