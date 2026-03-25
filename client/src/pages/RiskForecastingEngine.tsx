import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, BarChart3, Calendar, Target, Zap } from "lucide-react";

interface RiskForecast {
  id: string;
  metric: string;
  currentRisk: number;
  forecasted30d: number;
  forecasted90d: number;
  trend: "increasing" | "decreasing" | "stable";
  confidence: number;
  riskFactors: string[];
}

interface ExecutiveScorecard {
  date: string;
  overallRisk: number;
  trend: string;
  criticalThreats: number;
  vulnerabilities: number;
  complianceGaps: number;
  recommendations: string[];
}

interface ScenarioModel {
  id: string;
  name: string;
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  mitigation: string;
}

export default function RiskForecastingEngine() {
  const forecasts: RiskForecast[] = [
    {
      id: "RF-001",
      metric: "Ransomware Risk",
      currentRisk: 72,
      forecasted30d: 78,
      forecasted90d: 82,
      trend: "increasing",
      confidence: 94,
      riskFactors: ["Unpatched systems", "Weak MFA adoption", "Phishing campaigns"],
    },
    {
      id: "RF-002",
      metric: "Data Breach Risk",
      currentRisk: 58,
      forecasted30d: 62,
      forecasted90d: 65,
      trend: "increasing",
      confidence: 91,
      riskFactors: ["Insider threats", "Cloud misconfigurations", "Third-party risks"],
    },
    {
      id: "RF-003",
      metric: "Compliance Risk",
      currentRisk: 45,
      forecasted30d: 42,
      forecasted90d: 38,
      trend: "decreasing",
      confidence: 88,
      riskFactors: ["Audit findings", "Policy updates", "Training completion"],
    },
    {
      id: "RF-004",
      metric: "Infrastructure Risk",
      currentRisk: 64,
      forecasted30d: 68,
      forecasted90d: 71,
      trend: "increasing",
      confidence: 89,
      riskFactors: ["Legacy systems", "Patch delays", "Configuration drift"],
    },
  ];

  const scorecards: ExecutiveScorecard[] = [
    {
      date: "2026-03-14",
      overallRisk: 65,
      trend: "↑ +3 pts",
      criticalThreats: 4,
      vulnerabilities: 23,
      complianceGaps: 8,
      recommendations: [
        "Accelerate patching for critical vulnerabilities",
        "Increase MFA adoption to 85%+",
        "Conduct ransomware tabletop exercise",
      ],
    },
    {
      date: "2026-03-07",
      overallRisk: 62,
      trend: "↑ +2 pts",
      criticalThreats: 3,
      vulnerabilities: 19,
      complianceGaps: 10,
      recommendations: [
        "Review third-party risk assessments",
        "Update incident response playbooks",
        "Schedule compliance audit",
      ],
    },
    {
      date: "2026-02-28",
      overallRisk: 60,
      trend: "↓ -1 pts",
      criticalThreats: 3,
      vulnerabilities: 21,
      complianceGaps: 12,
      recommendations: [
        "Continue security awareness training",
        "Monitor threat intelligence feeds",
        "Plan Q2 security investments",
      ],
    },
  ];

  const scenarios: ScenarioModel[] = [
    {
      id: "SC-001",
      name: "Ransomware Attack Scenario",
      description: "Widespread ransomware deployment across critical systems",
      probability: 35,
      impact: 95,
      timeframe: "Q2 2026",
      mitigation: "Implement zero-trust architecture, enhance backup strategy",
    },
    {
      id: "SC-002",
      name: "Data Exfiltration Campaign",
      description: "Targeted data theft by advanced persistent threat",
      probability: 28,
      impact: 88,
      timeframe: "Q1-Q2 2026",
      mitigation: "Deploy DLP solutions, enhance monitoring, increase MFA",
    },
    {
      id: "SC-003",
      name: "Supply Chain Compromise",
      description: "Third-party vendor compromise affecting organization",
      probability: 22,
      impact: 82,
      timeframe: "Q2-Q3 2026",
      mitigation: "Vendor risk assessments, supply chain monitoring",
    },
    {
      id: "SC-004",
      name: "Insider Threat Incident",
      description: "Malicious insider or compromised employee account",
      probability: 18,
      impact: 75,
      timeframe: "Ongoing",
      mitigation: "Behavioral analytics, access controls, user monitoring",
    },
  ];

  const getTrendColor = (trend: string) => {
    if (trend === "increasing") return "text-red-400";
    if (trend === "decreasing") return "text-green-400";
    return "text-yellow-400";
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return "bg-red-500/20 text-red-300";
    if (risk >= 50) return "bg-orange-500/20 text-orange-300";
    if (risk >= 25) return "bg-yellow-500/20 text-yellow-300";
    return "bg-green-500/20 text-green-300";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            Security Risk Forecasting Engine
          </h1>
          <p className="text-muted-foreground">ML-powered predictive risk modeling and executive scorecards</p>
        </div>

        {/* Forecast Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">65</div>
              <p className="text-xs text-muted-foreground mt-1">Organization-wide</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">70</div>
              <p className="text-xs text-muted-foreground mt-1">+5 pts increase</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">90-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">74</div>
              <p className="text-xs text-muted-foreground mt-1">+9 pts increase</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">91%</div>
              <p className="text-xs text-muted-foreground mt-1">Average accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Forecasts */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Risk Forecasts by Category
            </CardTitle>
            <CardDescription>ML-powered predictions for next 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div key={forecast.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{forecast.metric}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Model confidence: {forecast.confidence}%</p>
                    </div>
                    <Badge className={getTrendColor(forecast.trend) + " bg-opacity-20"}>
                      {forecast.trend === "increasing" ? "↑" : forecast.trend === "decreasing" ? "↓" : "→"}{" "}
                      {forecast.trend}
                    </Badge>
                  </div>

                  {/* Risk Timeline */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <div className={`text-2xl font-bold ${getRiskColor(forecast.currentRisk)}`}>
                        {forecast.currentRisk}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">30-Day</p>
                      <div className={`text-2xl font-bold ${getRiskColor(forecast.forecasted30d)}`}>
                        {forecast.forecasted30d}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">90-Day</p>
                      <div className={`text-2xl font-bold ${getRiskColor(forecast.forecasted90d)}`}>
                        {forecast.forecasted90d}
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Key Risk Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {forecast.riskFactors.map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Scorecards */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Executive Risk Scorecards
            </CardTitle>
            <CardDescription>Weekly risk assessments and board-level recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scorecards.map((scorecard, idx) => (
                <div key={idx} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-foreground">{scorecard.date}</h3>
                        <p className={`text-sm font-semibold ${getTrendColor(scorecard.trend.includes("↑") ? "increasing" : "decreasing")}`}>
                          {scorecard.trend}
                        </p>
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${getRiskColor(scorecard.overallRisk)}`}>
                      {scorecard.overallRisk}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="bg-red-500/10 rounded p-2">
                      <p className="text-muted-foreground text-xs">Critical Threats</p>
                      <p className="font-bold text-red-400">{scorecard.criticalThreats}</p>
                    </div>
                    <div className="bg-orange-500/10 rounded p-2">
                      <p className="text-muted-foreground text-xs">Vulnerabilities</p>
                      <p className="font-bold text-orange-400">{scorecard.vulnerabilities}</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded p-2">
                      <p className="text-muted-foreground text-xs">Compliance Gaps</p>
                      <p className="font-bold text-yellow-400">{scorecard.complianceGaps}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Board Recommendations:</p>
                    <ul className="space-y-1">
                      {scorecard.recommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Modeling */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Scenario Modeling & Impact Analysis
            </CardTitle>
            <CardDescription>Probability and impact assessment for threat scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{scenario.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                    </div>
                    <Badge variant="outline">{scenario.timeframe}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${scenario.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{scenario.probability}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Impact</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2">
                          <div
                            className={scenario.impact >= 80 ? "bg-red-500" : "bg-orange-500"}
                            style={{ width: `${scenario.impact}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{scenario.impact}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card/50 rounded p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Mitigation Strategy:</p>
                    <p className="text-sm text-foreground">{scenario.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Forecasting Controls */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Forecasting Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Generate Custom Forecast</label>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 rounded border border-border/50 bg-background text-foreground text-sm">
                  <option>Select risk category...</option>
                  <option>Ransomware Risk</option>
                  <option>Data Breach Risk</option>
                  <option>Compliance Risk</option>
                  <option>Infrastructure Risk</option>
                </select>
                <Button className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Forecast
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Export Scorecard</label>
              <Button variant="outline" className="w-full gap-2">
                Export Board Report (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
