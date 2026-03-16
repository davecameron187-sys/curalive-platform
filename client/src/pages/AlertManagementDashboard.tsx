/**
 * Alert Management Dashboard
 * Escalation Rules, Maintenance Predictions, Correlation Monitoring
 */
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Zap,
  TrendingUp,
  Network,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AlertManagementDashboard() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState("event-1");
  const [selectedTab, setSelectedTab] = useState("escalation");

  // Escalation Rules
  const escalationRules = trpc.alertManagement.listEscalationRules.useQuery({
    eventId,
  });

  const createEscalation = trpc.alertManagement.createEscalationRule.useMutation(
    {
      onSuccess: () => {
        escalationRules.refetch();
      },
    }
  );

  // Maintenance Predictions
  const predictions = trpc.alertManagement.listMaintenancePredictions.useQuery({
    eventId,
  });

  // Alert Correlations
  const correlations = trpc.alertManagement.getCorrelationPatterns.useQuery({
    eventId,
  });

  // Alert Statistics
  const stats = trpc.alertManagement.getAlertStatistics.useQuery({ eventId });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only administrators can access this dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Alert Management</h1>
          <p className="text-muted-foreground">
            Manage escalation rules, maintenance predictions, and alert
            correlations
          </p>
        </div>

        {/* Statistics Cards */}
        {stats.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Alerts
                  </p>
                  <p className="text-3xl font-bold">{stats.data.totalAlerts}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Escalated
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.data.escalatedAlerts}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Correlated
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.data.correlatedAlerts}
                  </p>
                </div>
                <Network className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Unresolved
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.data.unresolvedAlerts}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
            <TabsTrigger value="predictions">Maintenance</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
          </TabsList>

          {/* Escalation Rules Tab */}
          <TabsContent value="escalation">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Escalation Rules</h2>
                <Button
                  onClick={() => {
                    createEscalation.mutate({
                      eventId,
                      name: "New Escalation Rule",
                      anomalyType: "high_latency",
                      severityThreshold: "high",
                      triggerCondition: "latency > 300ms",
                      steps: [
                        {
                          level: 1,
                          delay: 300000,
                          notificationChannels: ["email"],
                          recipients: { email: ["admin@chorus.ai"] },
                          message: "Alert escalation level 1",
                        },
                      ],
                    });
                  }}
                  disabled={createEscalation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </div>

              {escalationRules.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading escalation rules...
                </div>
              ) : escalationRules.data && escalationRules.data.length > 0 ? (
                <div className="space-y-4">
                  {escalationRules.data.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {rule.anomalyType} • Severity: {rule.severityThreshold}
                        </p>
                      </div>
                      <Badge
                        variant={rule.enabled ? "default" : "secondary"}

                        className="mr-4"
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No escalation rules configured
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Maintenance Predictions Tab */}
          <TabsContent value="predictions">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Maintenance Predictions</h2>

              {predictions.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading predictions...
                </div>
              ) : predictions.data && predictions.data.length > 0 ? (
                <div className="space-y-4">
                  {predictions.data.map((pred) => (
                    <div
                      key={pred.id}
                      className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {pred.kioskId}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {pred.predictedIssue}
                          </p>
                        </div>
                        <Badge
                          variant={
                            pred.confidence > 0.8 ? "destructive" : "secondary"
                          }
                        >
                          {(pred.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">
                        <strong>Recommended:</strong> {pred.recommendedAction}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Predicted on{" "}
                        {new Date(pred.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No maintenance predictions available
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Correlations Tab */}
          <TabsContent value="correlations">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Alert Correlations</h2>

              {correlations.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading correlations...
                </div>
              ) : correlations.data?.patterns &&
                correlations.data.patterns.length > 0 ? (
                <div className="space-y-4">
                  {correlations.data.patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{pattern.type}</h3>
                            <Badge
                              variant={
                                pattern.severity === "critical"
                                  ? "destructive"
                                  : pattern.severity === "high"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {pattern.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pattern.description}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                      </div>
                      <p className="text-sm mb-2">
                        <strong>Affected Kiosks:</strong>{" "}
                        {pattern.affectedKiosks.join(", ") || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Detected on{" "}
                        {new Date(pattern.detectedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No alert correlations detected
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
