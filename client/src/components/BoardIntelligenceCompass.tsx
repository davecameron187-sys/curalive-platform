import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function BoardIntelligenceCompass({ sessionId }: { sessionId: number }) {
  const [activeTab, setActiveTab] = useState('overview');

  const compass = trpc.boardIntelligence.getOrCreateCompass.useQuery({ sessionId });
  const priorCommitments = trpc.boardIntelligence.getPriorCommitmentAudit.useQuery(
    { compassId: compass.data?.id || 0 },
    { enabled: !!compass.data?.id }
  );
  const liabilities = trpc.boardIntelligence.getDirectorLiabilityMap.useQuery(
    { compassId: compass.data?.id || 0 },
    { enabled: !!compass.data?.id }
  );
  const expectations = trpc.boardIntelligence.getAnalystExpectationAudit.useQuery(
    { compassId: compass.data?.id || 0 },
    { enabled: !!compass.data?.id }
  );
  const governance = trpc.boardIntelligence.getGovernanceCommunicationScore.useQuery(
    { compassId: compass.data?.id || 0 },
    { enabled: !!compass.data?.id }
  );
  const resolutions = trpc.boardIntelligence.getBoardResolutions.useQuery(
    { compassId: compass.data?.id || 0 },
    { enabled: !!compass.data?.id }
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
          <h2 className="text-2xl font-bold text-foreground">Board Intelligence Compass</h2>
          <p className="text-sm text-muted-foreground mt-1">Pre-board briefing pack with commitment audit, liability mapping, and governance assessment</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Briefing
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commitments">Commitments</TabsTrigger>
          <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
          <TabsTrigger value="expectations">Expectations</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Governance Communication Score</CardTitle>
            </CardHeader>
            <CardContent>
              {governance.data ? (
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-300">{((governance.data.clarity ?? 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-slate-400 mt-1">Clarity</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-300">{((governance.data.consistency ?? 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-slate-400 mt-1">Consistency</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-300">{((governance.data.completeness ?? 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-slate-400 mt-1">Completeness</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-300">{((governance.data.timeliness ?? 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-slate-400 mt-1">Timeliness</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">{((governance.data.overallScore ?? 0) * 100).toFixed(0)}%</div>
                    <p className="text-xs text-slate-400 mt-1">Overall</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">No governance score data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commitments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prior Commitment Audit</CardTitle>
              <CardDescription>Tracking prior statements and commitments</CardDescription>
            </CardHeader>
            <CardContent>
              {priorCommitments.isLoading ? (
                <p className="text-muted-foreground">Loading commitments...</p>
              ) : priorCommitments.data?.length === 0 ? (
                <p className="text-muted-foreground">No prior commitments found</p>
              ) : (
                <div className="space-y-3">
                  {priorCommitments.data?.map((commitment: any) => (
                    <div key={commitment.id} className={`border-2 rounded-lg p-4 ${getRiskColor(commitment.riskLevel ?? 'low')}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{commitment.commitmentType}</p>
                          <p className="text-xs opacity-75">{commitment.speaker} {commitment.eventDate ? `• ${new Date(commitment.eventDate).toLocaleDateString()}` : ''}</p>
                        </div>
                        <Badge className={getRiskColor(commitment.riskLevel ?? 'low')}>
                          {(commitment.riskLevel ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm">{commitment.statement}</p>
                      <p className="text-xs mt-2 opacity-75">Confidence: {((commitment.confidence ?? 0) * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Director Liability Map</CardTitle>
              <CardDescription>Potential liability exposures by director</CardDescription>
            </CardHeader>
            <CardContent>
              {liabilities.isLoading ? (
                <p className="text-muted-foreground">Loading liabilities...</p>
              ) : liabilities.data?.length === 0 ? (
                <p className="text-muted-foreground">No liabilities identified</p>
              ) : (
                <div className="space-y-3">
                  {liabilities.data?.map((liability: any) => (
                    <div key={liability.id} className={`border-2 rounded-lg p-4 ${getRiskColor(liability.exposureLevel ?? 'low')}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{liability.directorName}</p>
                          <p className="text-xs opacity-75">{liability.liabilityArea}</p>
                        </div>
                        <Badge className={getRiskColor(liability.exposureLevel ?? 'low')}>
                          {(liability.exposureLevel ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{liability.description}</p>
                      <p className="text-xs font-semibold">Mitigation: {liability.mitigationSteps}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expectations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Expectation Audit</CardTitle>
              <CardDescription>Consensus expectations and surprise risks</CardDescription>
            </CardHeader>
            <CardContent>
              {expectations.isLoading ? (
                <p className="text-muted-foreground">Loading expectations...</p>
              ) : expectations.data?.length === 0 ? (
                <p className="text-muted-foreground">No analyst expectations found</p>
              ) : (
                <div className="space-y-3">
                  {expectations.data?.map((exp: any) => (
                    <div key={exp.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">{exp.analystName}</p>
                        </div>
                        <Badge variant={exp.surpriseRisk === 'high' ? 'destructive' : 'secondary'}>
                          {(exp.surpriseRisk ?? 'LOW').toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Consensus EPS</p>
                          <p className="font-semibold">${exp.consensusEps}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-semibold">${exp.consensusRevenue}M</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Growth</p>
                          <p className="font-semibold">{exp.consensusGrowth}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Board Resolutions & Actions</CardTitle>
              <CardDescription>Recommended actions and follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              {resolutions.isLoading ? (
                <p className="text-muted-foreground">Loading actions...</p>
              ) : resolutions.data?.length === 0 ? (
                <p className="text-muted-foreground">No actions identified</p>
              ) : (
                <div className="space-y-3">
                  {resolutions.data?.map((resolution: any) => (
                    <div key={resolution.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{resolution.actionType}</p>
                          <p className="text-sm text-muted-foreground">{resolution.description}</p>
                        </div>
                        <Badge variant={resolution.priority === 'high' ? 'destructive' : 'secondary'}>
                          {(resolution.priority ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Owner: {resolution.owner}</span>
                        <span>Due: {resolution.dueDate ? new Date(resolution.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
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
