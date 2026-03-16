/**
 * Custom Alert Thresholds Manager
 * Round 63 Features
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, AlertTriangle } from "lucide-react";

interface AlertThreshold {
  id: number;
  metricType: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  isEnabled: boolean;
}

export default function CustomAlertThresholdsManager() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string>("");
  const [kioskId, setKioskId] = useState<string>("");
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<AlertThreshold | null>(null);

  const [formData, setFormData] = useState({
    metricType: "latency",
    warningThreshold: 150,
    criticalThreshold: 300,
    unit: "ms",
  });

  // Fetch thresholds
  const { data: fetchedThresholds, refetch } =
    trpc.alertThresholds.getThresholds.useQuery(
      eventId && kioskId ? { eventId, kioskId } : undefined,
      { enabled: !!eventId && !!kioskId }
    );

  // Create threshold mutation
  const createThresholdMutation =
    trpc.alertThresholds.createThreshold.useMutation({
      onSuccess: () => {
        refetch();
        setShowForm(false);
        setFormData({
          metricType: "latency",
          warningThreshold: 150,
          criticalThreshold: 300,
          unit: "ms",
        });
      },
    });

  // Update threshold mutation
  const updateThresholdMutation =
    trpc.alertThresholds.updateThreshold.useMutation({
      onSuccess: () => {
        refetch();
        setEditingThreshold(null);
        setShowForm(false);
      },
    });

  // Delete threshold mutation
  const deleteThresholdMutation =
    trpc.alertThresholds.deleteThreshold.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  useEffect(() => {
    if (fetchedThresholds) {
      setThresholds(fetchedThresholds as AlertThreshold[]);
    }
  }, [fetchedThresholds]);

  const handleSubmit = () => {
    if (!eventId || !kioskId) {
      alert("Please fill in event and kiosk IDs");
      return;
    }

    if (editingThreshold) {
      updateThresholdMutation.mutate({
        thresholdId: editingThreshold.id,
        warningThreshold: formData.warningThreshold,
        criticalThreshold: formData.criticalThreshold,
        unit: formData.unit,
      });
    } else {
      createThresholdMutation.mutate({
        kioskId,
        eventId,
        metricType: formData.metricType,
        warningThreshold: formData.warningThreshold,
        criticalThreshold: formData.criticalThreshold,
        unit: formData.unit,
      });
    }
  };

  const handleDelete = (thresholdId: number) => {
    if (confirm("Are you sure you want to delete this threshold?")) {
      deleteThresholdMutation.mutate({ thresholdId });
    }
  };

  const handleEdit = (threshold: AlertThreshold) => {
    setEditingThreshold(threshold);
    setFormData({
      metricType: threshold.metricType,
      warningThreshold: threshold.warningThreshold,
      criticalThreshold: threshold.criticalThreshold,
      unit: threshold.unit,
    });
    setShowForm(true);
  };

  const metricOptions = [
    { value: "latency", label: "Latency (ms)" },
    { value: "bandwidth", label: "Bandwidth (Mbps)" },
    { value: "signal_strength", label: "Signal Strength (%)" },
    { value: "packet_loss", label: "Packet Loss (%)" },
    { value: "uptime", label: "Uptime (%)" },
  ];

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
            <h1 className="text-3xl font-bold">Custom Alert Thresholds</h1>
            <p className="text-muted-foreground mt-1">
              Configure per-location alert thresholds
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Threshold
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
              {editingThreshold ? "Edit Threshold" : "Create New Threshold"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Metric Type</label>
                <select
                  value={formData.metricType}
                  onChange={(e) => {
                    const selected = metricOptions.find(
                      (m) => m.value === e.target.value
                    );
                    setFormData({
                      ...formData,
                      metricType: e.target.value,
                      unit: selected?.label.split("(")[1]?.replace(")", "") || "ms",
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                >
                  {metricOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Warning Threshold ({formData.unit})
                </label>
                <input
                  type="number"
                  value={formData.warningThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warningThreshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Critical Threshold ({formData.unit})
                </label>
                <input
                  type="number"
                  value={formData.criticalThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      criticalThreshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} size="sm">
                  {editingThreshold ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingThreshold(null);
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

        {/* Thresholds List */}
        <div className="space-y-3">
          {thresholds.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No thresholds configured</p>
            </Card>
          ) : (
            thresholds.map((threshold) => (
              <Card key={threshold.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">
                        {metricOptions.find((m) => m.value === threshold.metricType)?.label}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          ⚠️ Warning: {threshold.warningThreshold}{" "}
                          {threshold.unit}
                        </span>
                        <span>
                          🔴 Critical: {threshold.criticalThreshold}{" "}
                          {threshold.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(threshold)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(threshold.id)}
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
