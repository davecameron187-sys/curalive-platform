/**
 * Alert Suppression Rules Manager
 * Round 63 Features
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Clock, Zap, Settings } from "lucide-react";

interface SuppressionRule {
  id: number;
  ruleName: string;
  anomalyType: string;
  suppressionType: "time_based" | "condition_based" | "threshold_based";
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
}

export default function AlertSuppressionRulesManager() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const [kioskId, setKioskId] = useState<string>("");
  const [rules, setRules] = useState<SuppressionRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<SuppressionRule | null>(null);

  const [formData, setFormData] = useState({
    ruleName: "",
    anomalyType: "high_latency",
    suppressionType: "time_based" as const,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
  });

  // Fetch rules
  const { data: fetchedRules, refetch } =
    trpc.alertSuppression.getRules.useQuery(
      eventId && kioskId ? { eventId, kioskId } : undefined,
      { enabled: !!eventId && !!kioskId }
    );

  // Create rule mutation
  const createRuleMutation = trpc.alertSuppression.createRule.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setFormData({
        ruleName: "",
        anomalyType: "high_latency",
        suppressionType: "time_based",
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      });
    },
  });

  // Update rule mutation
  const updateRuleMutation = trpc.alertSuppression.updateRule.useMutation({
    onSuccess: () => {
      refetch();
      setEditingRule(null);
      setShowForm(false);
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = trpc.alertSuppression.deleteRule.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (fetchedRules) {
      setRules(fetchedRules as SuppressionRule[]);
    }
  }, [fetchedRules]);

  const handleSubmit = () => {
    if (!formData.ruleName || !eventId || !kioskId) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingRule) {
      updateRuleMutation.mutate({
        ruleId: editingRule.id,
        ruleName: formData.ruleName,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
    } else {
      createRuleMutation.mutate({
        kioskId,
        eventId,
        ruleName: formData.ruleName,
        anomalyType: formData.anomalyType,
        suppressionType: formData.suppressionType,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
    }
  };

  const handleDelete = (ruleId: number) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteRuleMutation.mutate({ ruleId });
    }
  };

  const handleEdit = (rule: SuppressionRule) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      anomalyType: rule.anomalyType,
      suppressionType: rule.suppressionType,
      startTime: rule.startTime || new Date(),
      endTime: rule.endTime || new Date(),
    });
    setShowForm(true);
  };

  const getSuppressionTypeIcon = (type: string) => {
    switch (type) {
      case "time_based":
        return <Clock className="w-4 h-4" />;
      case "condition_based":
        return <Zap className="w-4 h-4" />;
      case "threshold_based":
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alert Suppression Rules</h1>
            <p className="text-muted-foreground mt-1">
              Manage notification suppression rules
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            />
            <input
              type="text"
              placeholder="Kiosk ID"
              value={kioskId}
              onChange={(e) => setKioskId(e.target.value)}
              className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
            />
          </div>
        </Card>

        {/* Form */}
        {showForm && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">
              {editingRule ? "Edit Rule" : "Create New Rule"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rule Name</label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) =>
                    setFormData({ ...formData, ruleName: e.target.value })
                  }
                  placeholder="e.g., Maintenance Window"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Anomaly Type</label>
                <select
                  value={formData.anomalyType}
                  onChange={(e) =>
                    setFormData({ ...formData, anomalyType: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                >
                  <option value="high_latency">High Latency</option>
                  <option value="packet_loss">Packet Loss</option>
                  <option value="frequent_failover">Frequent Failover</option>
                  <option value="low_bandwidth">Low Bandwidth</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Suppression Type</label>
                <select
                  value={formData.suppressionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      suppressionType: e.target.value as any,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                >
                  <option value="time_based">Time-Based</option>
                  <option value="condition_based">Condition-Based</option>
                  <option value="threshold_based">Threshold-Based</option>
                </select>
              </div>

              {formData.suppressionType === "time_based" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime.toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startTime: new Date(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime.toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endTime: new Date(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSubmit} size="sm">
                  {editingRule ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingRule(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Rules List */}
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No suppression rules yet</p>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSuppressionTypeIcon(rule.suppressionType)}
                    <div>
                      <p className="font-semibold">{rule.ruleName}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.anomalyType} • {rule.suppressionType}
                      </p>
                      {rule.startTime && rule.endTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rule.startTime).toLocaleString()} -{" "}
                          {new Date(rule.endTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(rule)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(rule.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
