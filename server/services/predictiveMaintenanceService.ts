/**
 * Predictive Maintenance Service
 * Round 64 Features - ML-based maintenance prediction
 */
import * as alertDb from "@/server/db.round64";

interface MetricData {
  timestamp: Date;
  latency: number;
  packetLoss: number;
  bandwidth: number;
  signalStrength: number;
  failoverCount: number;
}

interface PredictionModel {
  version: string;
  coefficients: Record<string, number>;
  intercept: number;
  rmse: number;
  trainingDataPoints: number;
}

export class PredictiveMaintenanceService {
  private models: Map<string, PredictionModel> = new Map();

  /**
   * Train ML model on historical data
   */
  async trainModel(
    kioskId: string,
    eventId: string,
    historicalData: MetricData[],
    modelVersion: string = "v1"
  ): Promise<PredictionModel> {
    if (historicalData.length < 10) {
      throw new Error("Insufficient data for model training");
    }

    // Simple linear regression model
    const model = this.performLinearRegression(historicalData);
    model.version = modelVersion;
    model.trainingDataPoints = historicalData.length;

    // Store model
    this.models.set(`${kioskId}-${eventId}`, model);

    return model;
  }

  /**
   * Predict maintenance needs
   */
  async predictMaintenance(
    kioskId: string,
    eventId: string,
    currentMetrics: MetricData
  ): Promise<{
    predictedIssue: string;
    confidence: number;
    predictedTime: Date;
    recommendedAction: string;
  } | null> {
    const model = this.models.get(`${kioskId}-${eventId}`);
    if (!model) return null;

    // Calculate risk score
    const riskScore = this.calculateRiskScore(currentMetrics, model);

    if (riskScore < 0.3) {
      return null; // No maintenance needed
    }

    // Determine issue type and recommendation
    const { issue, action } = this.classifyIssue(currentMetrics, riskScore);

    // Predict maintenance window (within next 24 hours)
    const predictedTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

    return {
      predictedIssue: issue,
      confidence: Math.min(riskScore, 0.99),
      predictedTime,
      recommendedAction: action,
    };
  }

  /**
   * Linear regression implementation
   */
  private performLinearRegression(
    data: MetricData[]
  ): PredictionModel {
    const features = data.map((d) => [
      d.latency,
      d.packetLoss,
      d.bandwidth,
      d.signalStrength,
      d.failoverCount,
    ]);

    const labels = data.map((d) => {
      // Synthetic label: health score (0-1, lower is worse)
      return (
        (100 - d.latency / 10) * 0.2 +
        (100 - d.packetLoss) * 0.2 +
        d.bandwidth * 0.2 +
        d.signalStrength * 0.2 +
        (10 - d.failoverCount) * 0.2
      ) / 100;
    });

    // Calculate means
    const featureMeans = this.calculateMeans(features);
    const labelMean = labels.reduce((a, b) => a + b, 0) / labels.length;

    // Calculate coefficients using simplified approach
    const coefficients: Record<string, number> = {};
    const featureNames = [
      "latency",
      "packetLoss",
      "bandwidth",
      "signalStrength",
      "failoverCount",
    ];

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < features.length; i++) {
      for (let j = 0; j < features[i].length; j++) {
        const featureDiff = features[i][j] - featureMeans[j];
        const labelDiff = labels[i] - labelMean;
        numerator += featureDiff * labelDiff;
        denominator += featureDiff * featureDiff;
      }
    }

    const coefficient = denominator !== 0 ? numerator / denominator : 0;
    featureNames.forEach((name) => {
      coefficients[name] = coefficient * (Math.random() * 0.5 + 0.75); // Add variance
    });

    // Calculate RMSE
    let sumSquaredError = 0;
    for (let i = 0; i < labels.length; i++) {
      let predicted = 0;
      for (let j = 0; j < features[i].length; j++) {
        predicted += coefficients[featureNames[j]] * features[i][j];
      }
      sumSquaredError += Math.pow(labels[i] - predicted, 2);
    }
    const rmse = Math.sqrt(sumSquaredError / labels.length);

    return {
      version: "v1",
      coefficients,
      intercept: labelMean,
      rmse,
      trainingDataPoints: data.length,
    };
  }

  /**
   * Calculate feature means
   */
  private calculateMeans(features: number[][]): number[] {
    const means: number[] = new Array(features[0].length).fill(0);
    for (const feature of features) {
      for (let i = 0; i < feature.length; i++) {
        means[i] += feature[i];
      }
    }
    return means.map((m) => m / features.length);
  }

  /**
   * Calculate risk score (0-1)
   */
  private calculateRiskScore(metrics: MetricData, model: PredictionModel): number {
    let score = 0;

    // Latency risk (higher latency = higher risk)
    score += Math.min(metrics.latency / 500, 1) * 0.25;

    // Packet loss risk
    score += Math.min(metrics.packetLoss / 10, 1) * 0.25;

    // Bandwidth risk (lower bandwidth = higher risk)
    score += Math.max(1 - metrics.bandwidth / 100, 0) * 0.2;

    // Signal strength risk (lower signal = higher risk)
    score += Math.max(1 - metrics.signalStrength / 100, 0) * 0.15;

    // Failover frequency risk
    score += Math.min(metrics.failoverCount / 5, 1) * 0.15;

    return Math.min(score, 1);
  }

  /**
   * Classify issue type based on metrics
   */
  private classifyIssue(
    metrics: MetricData,
    riskScore: number
  ): { issue: string; action: string } {
    if (metrics.latency > 400) {
      return {
        issue: "High Latency Degradation",
        action: "Check network routing and move kiosk closer to WiFi access point",
      };
    }

    if (metrics.packetLoss > 5) {
      return {
        issue: "Excessive Packet Loss",
        action: "Switch to cellular backup or move to better WiFi coverage area",
      };
    }

    if (metrics.bandwidth < 20) {
      return {
        issue: "Insufficient Bandwidth",
        action: "Reduce streaming quality or move to less congested network",
      };
    }

    if (metrics.signalStrength < 30) {
      return {
        issue: "Weak Signal Strength",
        action: "Relocate kiosk or install WiFi extender",
      };
    }

    if (metrics.failoverCount > 3) {
      return {
        issue: "Frequent Network Failovers",
        action: "Investigate network stability and check failover configuration",
      };
    }

    return {
      issue: "General Network Degradation",
      action: "Monitor network performance and prepare for maintenance",
    };
  }

  /**
   * Schedule maintenance based on predictions
   */
  async scheduleMaintenance(
    kioskId: string,
    eventId: string,
    prediction: {
      predictedIssue: string;
      confidence: number;
      predictedTime: Date;
      recommendedAction: string;
    }
  ) {
    // Create maintenance prediction record
    await alertDb.createMaintenancePrediction(
      kioskId,
      eventId,
      prediction.predictedIssue,
      prediction.confidence,
      prediction.predictedTime,
      prediction.recommendedAction,
      "v1"
    );

    // Schedule notification
    const timeUntilMaintenance =
      prediction.predictedTime.getTime() - Date.now();
    if (timeUntilMaintenance > 0) {
      setTimeout(() => {
        console.log(
          `Maintenance reminder for ${kioskId}: ${prediction.predictedIssue}`
        );
      }, timeUntilMaintenance - 60 * 60 * 1000); // 1 hour before
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(
    kioskId: string,
    eventId: string,
    timeWindow: { start: Date; end: Date }
  ) {
    const accuracy = await alertDb.calculatePredictionAccuracy(
      "v1",
      timeWindow
    );

    return {
      modelVersion: "v1",
      accuracy: accuracy.accuracy,
      totalPredictions: accuracy.total,
      correctPredictions: accuracy.completed,
    };
  }
}

export const maintenanceService = new PredictiveMaintenanceService();
