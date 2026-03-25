import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Target, Award, ArrowUp, ArrowDown } from "lucide-react";

interface BenchmarkMetric {
  id: string;
  metric: string;
  yourScore: number;
  industryAvg: number;
  percentile: number;
  trend: "up" | "down" | "stable";
  gap: number;
  recommendation: string;
}

interface PeerComparison {
  company: string;
  score: number;
  percentile: number;
  maturity: string;
  focusAreas: string[];
}

interface IndustryBenchmark {
  industry: string;
  avgScore: number;
  topScore: number;
  bottomScore: number;
  yourScore: number;
  percentile: number;
}

export default function BenchmarkingDashboard() {
  const benchmarks: BenchmarkMetric[] = [
    {
      id: "BM-001",
      metric: "Incident Response Time",
      yourScore: 45,
      industryAvg: 62,
      percentile: 78,
      trend: "up",
      gap: -17,
      recommendation: "Maintain current MTTR performance; consider automation for further improvement",
    },
    {
      id: "BM-002",
      metric: "Vulnerability Patch Rate",
      yourScore: 89,
      industryAvg: 72,
      percentile: 92,
      trend: "up",
      gap: 17,
      recommendation: "Excellent performance; share best practices with industry peers",
    },
    {
      id: "BM-003",
      metric: "Security Awareness Training",
      yourScore: 78,
      industryAvg: 65,
      percentile: 85,
      trend: "up",
      gap: 13,
      recommendation: "Continue training initiatives; expand to include advanced modules",
    },
    {
      id: "BM-004",
      metric: "Compliance Audit Pass Rate",
      yourScore: 96,
      industryAvg: 88,
      percentile: 95,
      trend: "stable",
      gap: 8,
      recommendation: "Maintain current compliance posture; document processes for audits",
    },
    {
      id: "BM-005",
      metric: "Security Tool Integration",
      yourScore: 72,
      industryAvg: 68,
      percentile: 68,
      trend: "down",
      gap: 4,
      recommendation: "Increase tool integration; consolidate security stack for efficiency",
    },
    {
      id: "BM-006",
      metric: "Threat Detection Accuracy",
      yourScore: 87,
      industryAvg: 79,
      percentile: 89,
      trend: "up",
      gap: 8,
      recommendation: "Leverage ML models; continue tuning detection rules",
    },
  ];

  const peers: PeerComparison[] = [
    {
      company: "Your Organization",
      score: 84,
      percentile: 85,
      maturity: "Advanced",
      focusAreas: ["Automation", "AI/ML Integration", "Third-Party Risk"],
    },
    {
      company: "Industry Leader A",
      score: 92,
      percentile: 98,
      maturity: "Mature",
      focusAreas: ["Zero-Trust", "Cloud Security", "Incident Response"],
    },
    {
      company: "Peer Company B",
      score: 78,
      percentile: 72,
      maturity: "Intermediate",
      focusAreas: ["Compliance", "Vulnerability Mgmt", "Access Control"],
    },
    {
      company: "Peer Company C",
      score: 81,
      percentile: 80,
      maturity: "Advanced",
      focusAreas: ["Threat Intelligence", "SOAR", "Automation"],
    },
    {
      company: "Peer Company D",
      score: 76,
      percentile: 68,
      maturity: "Intermediate",
      focusAreas: ["IAM", "DLP", "Monitoring"],
    },
  ];

  const industryBenchmarks: IndustryBenchmark[] = [
    {
      industry: "Financial Services",
      avgScore: 82,
      topScore: 95,
      bottomScore: 65,
      yourScore: 84,
      percentile: 72,
    },
    {
      industry: "Healthcare",
      avgScore: 79,
      topScore: 93,
      bottomScore: 62,
      yourScore: 84,
      percentile: 78,
    },
    {
      industry: "Technology",
      avgScore: 85,
      topScore: 97,
      bottomScore: 68,
      yourScore: 84,
      percentile: 65,
    },
    {
      industry: "Retail",
      avgScore: 74,
      topScore: 88,
      bottomScore: 58,
      yourScore: 84,
      percentile: 88,
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <TrendingUp className="w-4 h-4 text-yellow-400" />;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "bg-green-500/20 text-green-300";
    if (percentile >= 75) return "bg-blue-500/20 text-blue-300";
    if (percentile >= 50) return "bg-yellow-500/20 text-yellow-300";
    return "bg-red-500/20 text-red-300";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Award className="w-10 h-10 text-primary" />
            Security Metrics Benchmarking
          </h1>
          <p className="text-muted-foreground">Industry peer comparison and competitive positioning</p>
        </div>

        {/* Overall Positioning */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">84</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Percentile Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">85th</div>
              <p className="text-xs text-muted-foreground mt-1">Among peers</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Industry Avg</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">78</div>
              <p className="text-xs text-muted-foreground mt-1">+6 pts above</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maturity Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">Advanced</div>
              <p className="text-xs text-muted-foreground mt-1">Level 4/5</p>
            </CardContent>
          </Card>
        </div>

        {/* Benchmark Metrics */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Benchmark Metrics Comparison
            </CardTitle>
            <CardDescription>Your performance vs industry average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarks.map((benchmark) => (
                <div key={benchmark.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{benchmark.metric}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{benchmark.recommendation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(benchmark.trend)}
                      <Badge className={getPercentileColor(benchmark.percentile)}>
                        {benchmark.percentile}th percentile
                      </Badge>
                    </div>
                  </div>

                  {/* Score Comparison */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${benchmark.yourScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{benchmark.yourScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Industry Avg</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2">
                          <div
                            className="bg-muted-foreground h-2 rounded-full"
                            style={{ width: `${benchmark.industryAvg}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{benchmark.industryAvg}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gap</p>
                      <p className={`text-sm font-semibold ${benchmark.gap > 0 ? "text-green-400" : "text-red-400"}`}>
                        {benchmark.gap > 0 ? "+" : ""}{benchmark.gap}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peer Comparison */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Peer Organization Comparison
            </CardTitle>
            <CardDescription>Security posture across comparable organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peers.map((peer, idx) => (
                <div key={idx} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${peer.company === "Your Organization" ? "text-primary" : "text-foreground"}`}>
                        {peer.company}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Maturity: {peer.maturity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{peer.score}</p>
                      <Badge className={getPercentileColor(peer.percentile)}>{peer.percentile}th</Badge>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-border rounded-full h-2">
                        <div
                          className={peer.company === "Your Organization" ? "bg-primary" : "bg-muted-foreground"}
                          style={{ width: `${peer.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="flex flex-wrap gap-2">
                    {peer.focusAreas.map((area, areaIdx) => (
                      <Badge key={areaIdx} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Benchmarks */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Industry Benchmarks
            </CardTitle>
            <CardDescription>Your score across different industry verticals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Industry</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Your Score</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Industry Avg</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Top Score</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Bottom Score</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  {industryBenchmarks.map((bench, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 font-semibold">{bench.industry}</td>
                      <td className="py-2 px-3">
                        <span className="text-primary font-bold">{bench.yourScore}</span>
                      </td>
                      <td className="py-2 px-3">{bench.avgScore}</td>
                      <td className="py-2 px-3 text-green-400">{bench.topScore}</td>
                      <td className="py-2 px-3 text-red-400">{bench.bottomScore}</td>
                      <td className="py-2 px-3">
                        <Badge className={getPercentileColor(bench.percentile)}>{bench.percentile}th</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis & Recommendations */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Gap Analysis & Improvement Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-foreground mb-1">Critical Gaps</h4>
                <p className="text-sm text-muted-foreground">Security Tool Integration (4 pts below avg) - Consolidate tools and improve SIEM coverage</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-foreground mb-1">Opportunities</h4>
                <p className="text-sm text-muted-foreground">Incident Response Time (17 pts above avg) - Document and share best practices with industry</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-foreground mb-1">Strengths</h4>
                <p className="text-sm text-muted-foreground">Vulnerability Patch Rate (92nd percentile) - Maintain current processes and expand automation</p>
              </div>
            </div>
            <Button className="w-full gap-2">
              Download Detailed Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
