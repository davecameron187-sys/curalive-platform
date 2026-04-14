import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function RegulatoryComplianceMonitor({ sessionId }: { sessionId: number }) {
  const [activeTab, setActiveTab] = useState('overview');

  const monitor = trpc.regulatoryCompliance.getOrCreateMonitor.useQuery({ sessionId });
  const flags = trpc.regulatoryCompliance.getSessionRegulatoryFlags.useQuery({ sessionId });
  const summary = trpc.regulatoryCompliance.getEventComplianceSummary.useQuery({ sessionId });
  const jurisdictions = trpc.regulatoryCompliance.getJurisdictionProfiles.useQuery();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    return level === 'high' ? 'destructive' as const : 'secondary' as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Regulatory Compliance Monitor</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time jurisdiction-aware compliance flagging with disclosure detection</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {summary.data && (
        <div className="grid grid-cols-4 gap-4">
          <Card className={summary.data.complianceRiskLevel === 'high' ? 'border-red-300 bg-red-50' : summary.data.complianceRiskLevel === 'medium' ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{summary.data.totalFlagsDetected}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Flags</p>
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-red-700">{summary.data.highSeverityFlags}</div>
              <p className="text-xs text-muted-foreground mt-1">High Severity</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-yellow-700">{summary.data.mediumSeverityFlags}</div>
              <p className="text-xs text-muted-foreground mt-1">Medium Severity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{summary.data.disclosureTriggersDetected}</div>
              <p className="text-xs text-muted-foreground mt-1">Disclosure Triggers</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Flags</TabsTrigger>
          <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Regulatory Flags
              </CardTitle>
              <CardDescription>Detected compliance issues during the session</CardDescription>
            </CardHeader>
            <CardContent>
              {flags.isLoading ? (
                <p className="text-muted-foreground">Loading flags...</p>
              ) : (flags.data?.flags?.length ?? 0) === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">No regulatory flags detected</p>
                  <p className="text-xs text-muted-foreground mt-1">The compliance monitor is active and scanning</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flags.data?.flags.map((flag: any) => (
                    <div key={flag.id} className={`border-2 rounded-lg p-4 ${getSeverityColor(flag.severity ?? 'low')}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{flag.flagType}</p>
                          <p className="text-xs opacity-75">{flag.jurisdiction} - {flag.ruleSet}</p>
                        </div>
                        <Badge variant={getRiskBadgeVariant(flag.severity ?? 'low')}>
                          {(flag.severity ?? 'LOW').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">"{flag.statement}"</p>
                      <div className="flex justify-between text-xs opacity-75">
                        <span>Speaker: {flag.speaker}</span>
                        <span>Rule: {flag.ruleBasis}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jurisdictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdiction Profiles</CardTitle>
              <CardDescription>Applicable regulatory frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              {jurisdictions.isLoading ? (
                <p className="text-muted-foreground">Loading jurisdictions...</p>
              ) : (jurisdictions.data?.jurisdictions?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground">No jurisdiction profiles configured</p>
              ) : (
                <div className="space-y-3">
                  {jurisdictions.data?.jurisdictions.map((j: any) => (
                    <div key={j.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{j.name}</p>
                          <p className="text-xs text-muted-foreground">{j.code}</p>
                        </div>
                        <Badge variant="outline">{j.ruleSetVersion}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{j.applicableRules}</p>
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
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Compliance action items based on detected flags</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.data?.recommendedActions && summary.data.recommendedActions.length > 0 ? (
                <div className="space-y-3">
                  {summary.data.recommendedActions.map((action: string, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No action items at this time</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
