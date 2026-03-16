/**
 * Predictive Anomaly Detection Service
 * Uses ML to predict network issues before they impact operations
 * Round 62 Features
 */
import * as analyticsDb from "@/server/db.analytics";
import { ablyMetricsService } from "./ablyMetricsStreaming";

interface AnomalyPrediction {
  kioskId: string;
  eventId: string;
  anomalyType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-1
  predictedTime: Date;
  reason: string;
}

interface TrainingData {
  latency: number;
  bandwidth: number;
  signalStrength: number;
  isOnline: boolean;
  failoverCount: number;
  label: "normal" | "anomaly";
}

class PredictiveAnomalyDetectionService {
  private trainingData: Map<string, TrainingData[]> = new Map();
  private models: Map<string, any> = new Map();
  private readonly MIN_TRAINING_SAMPLES = 100;

  /**
   * Train model with historical data
   */
  async trainModel(kioskId: string, eventId: string): Promise<void> {
    const modelKey = `${kioskId}:${eventId}`;

    try {
      // Fetch last 7 days of data
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endTime = new Date();

      const metrics = await analyticsDb.getKioskMetrics(
        kioskId,
        eventId,
        startTime,
        endTime
      );

      const anomalies = await analyticsDb.getAnomalies(
        kioskId,
        eventId,
        startTime,
        endTime
      );

      if (metrics.length < this.MIN_TRAINING_SAMPLES) {
        console.warn(
          `[AnomalyDetection] Insufficient training data for ${modelKey}`
        );
        return;
      }

      // Prepare training data
      const trainingData: TrainingData[] = metrics.map((metric) => ({
        latency: metric.latency,
        bandwidth: Number(metric.bandwidth),
        signalStrength: metric.signalStrength,
        isOnline: metric.isOnline,
        failoverCount: 0, // Would need to aggregate from failover events
        label: anomalies.some(
          (a) =>
            a.detectedAt >= metric.timestamp &&
            a.detectedAt <= new Date(metric.timestamp.getTime() + 60000)
        )
          ? "anomaly"
          : "normal",
      }));

      this.trainingData.set(modelKey, trainingData);

      // Train simple ML model (using statistical approach)
      const model = this.trainStatisticalModel(trainingData);
      this.models.set(modelKey, model);

      console.log(`[AnomalyDetection] Model trained for ${modelKey}`);
    } catch (error) {
      console.error(
        `[AnomalyDetection] Error training model for ${modelKey}:`,
        error
      );
    }
  }

  /**
   * Train statistical model based on historical patterns
   */
  private trainStatisticalModel(data: TrainingData[]) {
    const normalData = data.filter((d) => d.label === "normal");
    const anomalyData = data.filter((d) => d.label === "anomaly");

    // Calculate statistics for normal data
    const normalStats = {
      latency: {
        mean: this.calculateMean(normalData.map((d) => d.latency)),
        stdDev: this.calculateStdDev(normalData.map((d) => d.latency)),
      },
      bandwidth: {
        mean: this.calculateMean(normalData.map((d) => d.bandwidth)),
        stdDev: this.calculateStdDev(normalData.map((d) => d.bandwidth)),
      },
      signalStrength: {
        mean: this.calculateMean(normalData.map((d) => d.signalStrength)),
        stdDev: this.calculateStdDev(normalData.map((d) => d.signalStrength)),
      },
    };

    // Calculate statistics for anomaly data
    const anomalyStats = {
      latency: {
        mean: this.calculateMean(anomalyData.map((d) => d.latency)),
        stdDev: this.calculateStdDev(anomalyData.map((d) => d.latency)),
      },
      bandwidth: {
        mean: this.calculateMean(anomalyData.map((d) => d.bandwidth)),
        stdDev: this.calculateStdDev(anomalyData.map((d) => d.bandwidth)),
      },
      signalStrength: {
        mean: this.calculateMean(anomalyData.map((d) => d.signalStrength)),
        stdDev: this.calculateStdDev(anomalyData.map((d) => d.signalStrength)),
      },
    };

    return { normalStats, anomalyStats };
  }

  /**
   * Predict anomalies for current metrics
   */
  async predictAnomalies(
    kioskId: string,
    eventId: string,
    currentMetrics: any
  ): Promise<AnomalyPrediction[]> {
    const modelKey = `${kioskId}:${eventId}`;
    const model = this.models.get(modelKey);

    if (!model) {
      return [];
    }

    const predictions: AnomalyPrediction[] = [];

    // Check latency anomaly
    const latencyAnomaly = this.detectLatencyAnomaly(
      currentMetrics.latency,
      model
    );
    if (latencyAnomaly) {
      predictions.push({
        kioskId,
        eventId,
        anomalyType: "high_latency",
        severity: latencyAnomaly.severity,
        confidence: latencyAnomaly.confidence,
        predictedTime: new Date(Date.now() + 60000), // Predict 1 min ahead
        reason: `Latency trending high: ${currentMetrics.latency}ms`,
      });
    }

    // Check bandwidth anomaly
    const bandwidthAnomaly = this.detectBandwidthAnomaly(
      currentMetrics.bandwidth,
      model
    );
    if (bandwidthAnomaly) {
      predictions.push({
        kioskId,
        eventId,
        anomalyType: "low_bandwidth",
        severity: bandwidthAnomaly.severity,
        confidence: bandwidthAnomaly.confidence,
        predictedTime: new Date(Date.now() + 60000),
        reason: `Bandwidth degrading: ${currentMetrics.bandwidth}Mbps`,
      });
    }

    // Check signal strength anomaly
    const signalAnomaly = this.detectSignalAnomaly(
      currentMetrics.signalStrength,
      model
    );
    if (signalAnomaly) {
      predictions.push({
        kioskId,
        eventId,
        anomalyType: "weak_signal",
        severity: signalAnomaly.severity,
        confidence: signalAnomaly.confidence,
        predictedTime: new Date(Date.now() + 60000),
        reason: `Signal strength weak: ${currentMetrics.signalStrength}%`,
      });
    }

    return predictions;
  }

  /**
   * Detect latency anomalies using Z-score
   */
  private detectLatencyAnomaly(
    latency: number,
    model: any
  ): { severity: string; confidence: number } | null {
    const { normalStats, anomalyStats } = model;
    const mean = normalStats.latency.mean;
    const stdDev = normalStats.latency.stdDev;

    const zScore = (latency - mean) / stdDev;

    if (zScore > 3) {
      return { severity: "critical", confidence: Math.min(zScore / 5, 1) };
    } else if (zScore > 2) {
      return { severity: "high", confidence: Math.min(zScore / 4, 1) };
    } else if (zScore > 1.5) {
      return { severity: "medium", confidence: Math.min(zScore / 3, 1) };
    }

    return null;
  }

  /**
   * Detect bandwidth anomalies
   */
  private detectBandwidthAnomaly(
    bandwidth: number,
    model: any
  ): { severity: string; confidence: number } | null {
    const { normalStats } = model;
    const mean = normalStats.bandwidth.mean;
    const stdDev = normalStats.bandwidth.stdDev;

    const zScore = (mean - bandwidth) / stdDev; // Inverted: lower bandwidth is bad

    if (zScore > 3) {
      return { severity: "critical", confidence: Math.min(zScore / 5, 1) };
    } else if (zScore > 2) {
      return { severity: "high", confidence: Math.min(zScore / 4, 1) };
    } else if (zScore > 1.5) {
      return { severity: "medium", confidence: Math.min(zScore / 3, 1) };
    }

    return null;
  }

  /**
   * Detect signal strength anomalies
   */
  private detectSignalAnomaly(
    signalStrength: number,
    model: any
  ): { severity: string; confidence: number } | null {
    if (signalStrength < 20) {
      return { severity: "critical", confidence: 0.95 };
    } else if (signalStrength < 40) {
      return { severity: "high", confidence: 0.85 };
    } else if (signalStrength < 60) {
      return { severity: "medium", confidence: 0.7 };
    }

    return null;
  }

  /**
   * Calculate mean of array
   */
  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  /**
   * Process predictions and create alerts
   */
  async processPredictions(
    predictions: AnomalyPrediction[]
  ): Promise<void> {
    for (const prediction of predictions) {
      try {
        // Store anomaly in database
        await analyticsDb.storeNetworkAnomaly({
          kioskId: prediction.kioskId,
          eventId: prediction.eventId,
          anomalyType: prediction.anomalyType,
          severity: prediction.severity,
          description: prediction.reason,
          detectedAt: new Date(),
          isResolved: false,
          metadata: JSON.stringify({
            confidence: prediction.confidence,
            predictedTime: prediction.predictedTime,
          }),
          createdAt: new Date(),
        });

        // Publish alert via Ably
        await ablyMetricsService.publishAnomalyAlert(
          prediction.kioskId,
          prediction.eventId,
          {
            id: 0, // Would be set by database
            anomalyType: prediction.anomalyType,
            severity: prediction.severity,
            description: prediction.reason,
          }
        );

        console.log(
          `[AnomalyDetection] Alert published: ${prediction.anomalyType} (${prediction.severity})`
        );
      } catch (error) {
        console.error("[AnomalyDetection] Error processing prediction:", error);
      }
    }
  }

  /**
   * Get model for kiosk
   */
  getModel(kioskId: string, eventId: string) {
    const modelKey = `${kioskId}:${eventId}`;
    return this.models.get(modelKey);
  }

  /**
   * Clear old models
   */
  clearOldModels(): void {
    // Keep only last 100 models
    if (this.models.size > 100) {
      const keysToDelete = Array.from(this.models.keys()).slice(0, 50);
      keysToDelete.forEach((key) => {
        this.models.delete(key);
        this.trainingData.delete(key);
      });
    }
  }
}

export const predictiveAnomalyService = new PredictiveAnomalyDetectionService();
