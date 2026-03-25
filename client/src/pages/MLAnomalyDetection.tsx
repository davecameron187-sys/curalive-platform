import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  type: string;
  anomalyScore: number;
  predictedRisk: string;
  affectedArea: string;
  detectedAt: number;
  autoRemediationApplied: boolean;
  confidence: number;
}

interface ModelMetric {
  name: string;
  value: number;
  trend: number;
  threshold: number;
}

interface VulnerabilityPrediction {
  id: string;
  vulnerability: string;
  probability: number;
  timeframe: string;
  affectedComponent: string;
  suggestedAction: string;
}

export default function MLAnomalyDetection() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: "anom-001",
      type: "Unusual Scan Pattern",
      anomalyScore: 0.87,
      predictedRisk: "High",
      affectedArea: "CI/CD Pipeline",
      detectedAt: Date.now() - 1800000,
      autoRemediationApplied: true,
      confidence: 0.92,
    },
    {
      id: "anom-002",
      type: "Policy Violation Spike",
      anomalyScore: 0.76,
      predictedRisk: "Medium",
      affectedArea: "Access Control",
      detectedAt: Date.now() - 3600000,
      autoRemediationApplied: false,
      confidence: 0.85,
    },
    {
      id: "anom-003",
      type: "Vendor Risk Escalation",
      anomalyScore: 0.64,
      predictedRisk: "Medium",
      affectedArea: "Third-Party Risk",
      detectedAt: Date.now() - 7200000,
      autoRemediationApplied: true,
      confidence: 0.78,
    },
  ]);

  const [predictions, setPredictions] = useState<VulnerabilityPrediction[]>([
    {
      id: "pred-001",
      vulnerability: "SQL Injection in API Gateway",
      probability: 0.68,
      timeframe: "Next 7 days",
      affectedComponent: "Recall.ai Integration",
      suggestedAction: "Increase DAST scanning frequency",
    },
    {
      id: "pred-002",
      vulnerability: "Privilege Escalation",
      probability: 0.52,
      timeframe: "Next 14 days",
      affectedComponent: "Access Control System",
      suggestedAction: "Review IAM policies",
    },
    {
      id: "pred-003",
      vulnerability: "Data Exposure",
      probability: 0.41,
      timeframe: "Next 30 days",
      affectedComponent: "Data Residency",
      suggestedAction: "Audit encryption settings",
    },
  ]);

  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([
    {
      name: "Precision",
      value: 0.94,
      trend: 0.03,
      threshold: 0.90,
    },
    {
      name: "Recall",
      value: 0.89,
      trend: 0.05,
      threshold: 0.85,
    },
    {
      name: "F1 Score",
      value: 0.91,
      trend: 0.04,
      threshold: 0.88,
    },
    {
      name: "AUC-ROC",
      value: 0.96,
      trend: 0.02,
      threshold: 0.92,
    },
  ]);

  const stats = {
    totalAnomalies: anomalies.length,
    autoRemediations: anomalies.filter((a) => a.autoRemediationApplied).length,
    predictions: predictions.length,
    avgConfidence: (
      anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length
    ).toFixed(2),
  };

  const handleTrainModel = () => {
    toast.success("Model training initiated - ETA 2 hours");
  };

  const handleApplyRemediation = (anomalyId: string) => {
    toast.success("Auto-remediation applied");
  };

  const handleReviewPrediction = (predictionId: string) => {
    toast.success("Prediction details opened");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-red-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML Anomaly Detection</h1>
        <p className="text-muted-foreground mt-1">
          Machine learning models for pattern detection and vulnerability prediction
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Anomalies Detected</p>
          <p className="text-3xl font-bold">{stats.totalAnomalies}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Auto-Remediated</p>
          <p className="text-3xl font-bold text-green-600">{stats.autoRemediations}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Predictions</p>
          <p className="text-3xl font-bold">{stats.predictions}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
          <p className="text-3xl font-bold">{stats.avgConfidence}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Detected Anomalies
          </h2>
          <Button onClick={handleTrainModel}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retrain Model
          </Button>
        </div>

        <div className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{anomaly.type}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {anomaly.affectedArea} • Detected {Math.floor((Date.now() - anomaly.detectedAt) / (1000 * 60))} min ago
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getRiskColor(anomaly.predictedRisk)} bg-opacity-20`}>
                  {anomaly.predictedRisk}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Anomaly Score</p>
                  <p className={`font-semibold ${getScoreColor(anomaly.anomalyScore)}`}>
                    {(anomaly.anomalyScore * 100).toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-semibold text-green-600">
                    {(anomaly.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-Remediation</p>
                  <p className="font-semibold">
                    {anomaly.autoRemediationApplied ? "✓ Applied" : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">
                    {anomaly.autoRemediationApplied ? "Resolved" : "Active"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {!anomaly.autoRemediationApplied && (
                  <Button size="sm" onClick={() => handleApplyRemediation(anomaly.id)}>
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Remediate
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Vulnerability Predictions
        </h2>

        <div className="space-y-3">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{prediction.vulnerability}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prediction.affectedComponent} • {prediction.timeframe}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded font-semibold bg-blue-500/20 text-blue-600">
                  {(prediction.probability * 100).toFixed(0)}% Probability
                </span>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Suggested Action</p>
                <p className="font-semibold">{prediction.suggestedAction}</p>
              </div>

              <Button size="sm" onClick={() => handleReviewPrediction(prediction.id)} variant="outline">
                Review & Plan
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Model Performance
        </h2>

        <div className="space-y-3">
          {modelMetrics.map((metric) => (
            <div key={metric.name} className="p-3 border border-border rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{metric.name}</p>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{(metric.value * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    ↑ {(metric.trend * 100).toFixed(1)}% from last week
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full"
                    style={{ width: `${metric.value * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Threshold: {(metric.threshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Model Configuration
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Training Data</p>
            <p className="text-muted-foreground text-xs mt-1">
              Last trained: 3 days ago • Data points: 50,000 • Features: 128
            </p>
          </div>

          <div>
            <p className="font-semibold">Algorithm</p>
            <p className="text-muted-foreground text-xs mt-1">
              Isolation Forest + Gradient Boosting ensemble
            </p>
          </div>

          <div>
            <p className="font-semibold">Auto-Remediation Rules</p>
            <p className="text-muted-foreground text-xs mt-1">
              Low-risk findings: Auto-remediate • Medium/High: Manual review required
            </p>
          </div>

          <div>
            <p className="font-semibold">Retraining Schedule</p>
            <p className="text-muted-foreground text-xs mt-1">
              Weekly on Sundays at 2:00 AM UTC
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
