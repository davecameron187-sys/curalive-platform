import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Shield, ShieldCheck, ShieldAlert, Activity,
  RefreshCw, TrendingUp, Eye, CheckCircle, XCircle, Clock
} from "lucide-react";
import { toast } from "sonner";

const severityColor: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-400 text-white",
};

const statusColor: Record<string, string> = {
  detected: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-orange-100 text-orange-800",
  mitigated: "bg-green-100 text-green-800",
  false_positive: "bg-gray-100 text-gray-600",
};

const threatTypeIcon: Record<string, typeof AlertTriangle> = {
  fraud: AlertTriangle,
  access_anomaly: Eye,
  data_exfiltration: ShieldAlert,
  policy_violation: XCircle,
  regulatory_breach: Shield,
  predictive_warning: TrendingUp,
};

export default function ComplianceEngineDashboard() {
  const [scanning, setScanning] = useState(false);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);

  const dashboardQuery = trpc.complianceEngine.dashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const threatsQuery = trpc.complianceEngine.threats.useQuery({ limit: 50 });
  const statsQuery = trpc.complianceEngine.threatStats.useQuery();
  const scanMutation = trpc.complianceEngine.runScan.useMutation();
  const updateThreatMutation = trpc.complianceEngine.updateThreat.useMutation();
  const seedControlsMutation = trpc.complianceEngine.seedControls.useMutation();

  const dashboard = dashboardQuery.data;
  const threats = threatsQuery.data ?? [];
  const stats = statsQuery.data;

  async function handleScan() {
    setScanning(true);
    try {
      const result = await scanMutation.mutateAsync();
      toast.success(`Scan complete: ${result.threats.length} threats detected, risk score ${result.riskScore}`);
      dashboardQuery.refetch();
      threatsQuery.refetch();
      statsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleSeedControls() {
    try {
      await seedControlsMutation.mutateAsync();
      toast.success("SOC2 & ISO 27001 framework controls seeded successfully");
      dashboardQuery.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Seed failed");
    }
  }

  async function handleUpdateThreat(id: number, status: string) {
    try {
      await updateThreatMutation.mutateAsync({ id, status: status as any });
      toast.success("Threat status updated");
      threatsQuery.refetch();
      statsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Update failed");
    }
  }

  const isoScore = dashboard?.frameworks?.iso27001?.score ?? 0;
  const soc2Score = dashboard?.frameworks?.soc2?.score ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            AI Compliance Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Autonomous threat detection, predictive fraud analysis & framework compliance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={seedControlsMutation.isPending} size="sm" variant="outline">
                <Shield className={`h-4 w-4 mr-2 ${seedControlsMutation.isPending ? "animate-pulse" : ""}`} />
                {seedControlsMutation.isPending ? "Seeding..." : "Seed Controls"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Seed Framework Controls?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will idempotently re-seed all SOC2 and ISO 27001 framework controls into the database.
                  Existing controls will not be duplicated — only missing controls will be added.
                  This operation is safe to run in production.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setSeedDialogOpen(false);
                    handleSeedControls();
                  }}
                >
                  Seed Controls
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleScan} disabled={scanning} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Run Full Scan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-3xl font-bold">{stats?.activeThreats ?? 0}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${(stats?.activeThreats ?? 0) > 0 ? "text-red-500" : "text-green-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-3xl font-bold ${
                  (dashboard as any)?.riskScore > 50 ? "text-red-600" :
                  (dashboard as any)?.riskScore > 20 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {(dashboard as any)?.riskScore ?? 0}/100
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ISO 27001</p>
                <p className={`text-3xl font-bold ${isoScore >= 70 ? "text-green-600" : isoScore >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                  {isoScore}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-violet-500" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${isoScore}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SOC 2</p>
                <p className={`text-3xl font-bold ${soc2Score >= 70 ? "text-green-600" : soc2Score >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                  {soc2Score}%
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${soc2Score}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Feed</TabsTrigger>
          <TabsTrigger value="frameworks">Framework Status</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-3">
          {threats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">No active threats detected</p>
                <p className="text-sm mt-1">Run a full scan to check for new threats</p>
              </CardContent>
            </Card>
          ) : (
            threats.map((threat: any) => {
              const Icon = threatTypeIcon[threat.threat_type] ?? AlertTriangle;
              return (
                <Card key={threat.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{threat.title}</span>
                            <Badge className={severityColor[threat.severity] ?? "bg-gray-200"}>
                              {threat.severity}
                            </Badge>
                            <Badge variant="outline" className={statusColor[threat.status] ?? ""}>
                              {threat.status?.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {threat.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(threat.created_at).toLocaleString()}
                            </span>
                            {threat.ai_confidence != null && (
                              <span>Confidence: {Math.round(threat.ai_confidence * 100)}%</span>
                            )}
                            <span>Source: {threat.source_system}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {threat.status === "detected" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateThreat(threat.id, "investigating")}>
                              Investigate
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateThreat(threat.id, "false_positive")}>
                              Dismiss
                            </Button>
                          </>
                        )}
                        {threat.status === "investigating" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateThreat(threat.id, "mitigated")}>
                            Mark Mitigated
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-500" />
                  ISO 27001 Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      Passing: {dashboard?.frameworks?.iso27001?.passing ?? 0}
                    </span>
                    <span className="text-yellow-600 font-medium">
                      Warning: {dashboard?.frameworks?.iso27001?.warning ?? 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      Failing: {dashboard?.frameworks?.iso27001?.failing ?? 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                    {(() => {
                      const iso = dashboard?.frameworks?.iso27001;
                      const total = (iso?.total ?? 1);
                      return (
                        <>
                          <div className="bg-green-500 h-3" style={{ width: `${((iso?.passing ?? 0) / total) * 100}%` }} />
                          <div className="bg-yellow-500 h-3" style={{ width: `${((iso?.warning ?? 0) / total) * 100}%` }} />
                          <div className="bg-red-500 h-3" style={{ width: `${((iso?.failing ?? 0) / total) * 100}%` }} />
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dashboard?.frameworks?.iso27001?.total ?? 0} controls assessed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  SOC 2 Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      Passing: {dashboard?.frameworks?.soc2?.passing ?? 0}
                    </span>
                    <span className="text-yellow-600 font-medium">
                      Warning: {dashboard?.frameworks?.soc2?.warning ?? 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      Failing: {dashboard?.frameworks?.soc2?.failing ?? 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                    {(() => {
                      const soc = dashboard?.frameworks?.soc2;
                      const total = (soc?.total ?? 1);
                      return (
                        <>
                          <div className="bg-green-500 h-3" style={{ width: `${((soc?.passing ?? 0) / total) * 100}%` }} />
                          <div className="bg-yellow-500 h-3" style={{ width: `${((soc?.warning ?? 0) / total) * 100}%` }} />
                          <div className="bg-red-500 h-3" style={{ width: `${((soc?.failing ?? 0) / total) * 100}%` }} />
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dashboard?.frameworks?.soc2?.total ?? 0} controls assessed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.byType && Object.keys(stats.byType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium capitalize">{type.replace(/_/g, " ")}</p>
                        <p className="text-lg font-bold">{count as number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-3">
          {scanMutation.data?.predictiveAlerts && scanMutation.data.predictiveAlerts.length > 0 ? (
            scanMutation.data.predictiveAlerts.map((alert: any, i: number) => (
              <Card key={i} className="border-l-4 border-l-yellow-500">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{alert.type.replace(/_/g, " ")}</span>
                        <Badge variant="outline">
                          {Math.round(alert.probability * 100)}% probability
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.timeHorizon}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Recommended: </span>
                        {alert.preventiveAction}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-blue-400" />
                <p className="font-medium">No predictive alerts</p>
                <p className="text-sm mt-1">Run a full scan to generate predictive analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
