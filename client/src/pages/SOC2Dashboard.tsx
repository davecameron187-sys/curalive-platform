import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_CONFIG = {
  compliant: { label: "Compliant", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, iconClass: "text-emerald-400" },
  partial: { label: "Partial", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle, iconClass: "text-amber-400" },
  non_compliant: { label: "Non-Compliant", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, iconClass: "text-red-400" },
  not_applicable: { label: "N/A", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Shield, iconClass: "text-slate-400" },
};

export default function SOC2Dashboard() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const utils = trpc.useUtils();

  const seedMutation = trpc.soc2.seedIfEmpty.useMutation({
    onSuccess: (data) => {
      if (data.seeded) {
        toast.success(`Seeded ${data.count} SOC 2 controls`);
        utils.soc2.getControls.invalidate();
        utils.soc2.getStats.invalidate();
        utils.soc2.getCategories.invalidate();
      }
    },
  });

  const { data: stats } = trpc.soc2.getStats.useQuery();
  const { data: categories } = trpc.soc2.getCategories.useQuery();
  const { data: controls = [], isLoading } = trpc.soc2.getControls.useQuery(undefined, {
    onSuccess: (data) => {
      if (data.length === 0) seedMutation.mutate();
    },
  });

  const updateMutation = trpc.soc2.updateControl.useMutation({
    onSuccess: () => {
      toast.success("Control updated");
      utils.soc2.getControls.invalidate();
      utils.soc2.getStats.invalidate();
      utils.soc2.getCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredControls = filterStatus === "all"
    ? controls
    : controls.filter(c => c.status === filterStatus);

  const groupedByCategory = filteredControls.reduce((acc, ctrl) => {
    if (!acc[ctrl.category]) acc[ctrl.category] = [];
    acc[ctrl.category].push(ctrl);
    return acc;
  }, {} as Record<string, typeof controls>);

  const scoreColor = !stats ? "text-slate-400" : stats.score >= 80 ? "text-emerald-400" : stats.score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SOC 2 Compliance</h1>
              <p className="text-sm text-muted-foreground">Trust Services Criteria — Type II Readiness</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              utils.soc2.getControls.invalidate();
              utils.soc2.getStats.invalidate();
              utils.soc2.getCategories.invalidate();
            }}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Score Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 col-span-2 md:col-span-1 flex flex-col items-center justify-center bg-card border-border">
              <div className={`text-4xl font-bold ${scoreColor}`}>{stats.score}%</div>
              <div className="text-xs text-muted-foreground mt-1">Readiness Score</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-emerald-400">{stats.compliant}</div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-amber-400">{stats.partial}</div>
              <div className="text-xs text-muted-foreground">Partial</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-red-400">{stats.nonCompliant}</div>
              <div className="text-xs text-muted-foreground">Non-Compliant</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-slate-400">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Controls</div>
            </Card>
          </div>
        )}

        {/* Category Progress */}
        {categories && categories.length > 0 && (
          <Card className="p-4 bg-card border-border">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Category Breakdown</h2>
            <div className="space-y-2">
              {categories.map(cat => {
                const pct = cat.total > 0 ? Math.round(((cat.compliant + cat.partial * 0.5) / cat.total) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-44 text-xs text-muted-foreground truncate">{cat.category}</div>
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground w-10 text-right">{pct}%</div>
                    <div className="text-xs text-muted-foreground w-16 text-right">{cat.compliant}/{cat.total}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "compliant", "partial", "non_compliant"].map(s => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "All" : s === "non_compliant" ? "Non-Compliant" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        {/* Controls by Category */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading controls...</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByCategory).map(([category, catControls]) => {
              const isExpanded = expandedCategory === category;
              return (
                <Card key={category} className="bg-card border-border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{category}</span>
                      <div className="flex gap-1">
                        {catControls.filter(c => c.status === "compliant").length > 0 && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                            {catControls.filter(c => c.status === "compliant").length} ✓
                          </span>
                        )}
                        {catControls.filter(c => c.status === "partial").length > 0 && (
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                            {catControls.filter(c => c.status === "partial").length} ~
                          </span>
                        )}
                        {catControls.filter(c => c.status === "non_compliant").length > 0 && (
                          <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                            {catControls.filter(c => c.status === "non_compliant").length} ✗
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {catControls.map(ctrl => {
                        const cfg = STATUS_CONFIG[ctrl.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.non_compliant;
                        const Icon = cfg.icon;
                        return (
                          <div key={ctrl.id} className="p-4 flex items-start gap-4">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconClass}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono text-muted-foreground">{ctrl.controlId}</span>
                                <span className="text-sm font-medium">{ctrl.name}</span>
                              </div>
                              {ctrl.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ctrl.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {ctrl.ownerName && (
                                  <span className="text-xs text-muted-foreground">Owner: {ctrl.ownerName}</span>
                                )}
                                {ctrl.testingFrequency && (
                                  <span className="text-xs text-muted-foreground">Testing: {ctrl.testingFrequency}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                              <select
                                className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
                                value={ctrl.status}
                                onChange={(e) => updateMutation.mutate({
                                  id: ctrl.id,
                                  status: e.target.value as "compliant" | "partial" | "non_compliant" | "not_applicable",
                                })}
                              >
                                <option value="compliant">Compliant</option>
                                <option value="partial">Partial</option>
                                <option value="non_compliant">Non-Compliant</option>
                                <option value="not_applicable">N/A</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
