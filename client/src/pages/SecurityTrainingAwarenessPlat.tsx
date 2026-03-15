import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Target, TrendingUp, Zap, Users } from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  duration: number;
  completionRate: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  enrollees: number;
  avgScore: number;
}

interface PhishingCampaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalEmails: number;
  clickRate: number;
  reportRate: number;
  status: "active" | "completed" | "scheduled";
}

interface UserProgress {
  id: string;
  name: string;
  role: string;
  completedModules: number;
  totalModules: number;
  score: number;
  certifications: number;
  phishingTests: number;
  lastTraining: string;
}

interface Leaderboard {
  rank: number;
  name: string;
  department: string;
  points: number;
  completedModules: number;
  certifications: number;
}

export default function SecurityTrainingAwarenessPlat() {
  const modules: TrainingModule[] = [
    {
      id: "MOD-001",
      title: "Security Fundamentals",
      category: "Foundations",
      duration: 45,
      completionRate: 98,
      difficulty: "beginner",
      enrollees: 1245,
      avgScore: 92,
    },
    {
      id: "MOD-002",
      title: "Phishing & Social Engineering",
      category: "Threats",
      duration: 60,
      completionRate: 94,
      difficulty: "beginner",
      enrollees: 1189,
      avgScore: 88,
    },
    {
      id: "MOD-003",
      title: "Data Protection & Privacy",
      category: "Compliance",
      duration: 75,
      completionRate: 91,
      difficulty: "intermediate",
      enrollees: 1050,
      avgScore: 85,
    },
    {
      id: "MOD-004",
      title: "Incident Response Procedures",
      category: "Response",
      duration: 90,
      completionRate: 87,
      difficulty: "intermediate",
      enrollees: 856,
      avgScore: 82,
    },
    {
      id: "MOD-005",
      title: "Advanced Threat Analysis",
      category: "Advanced",
      duration: 120,
      completionRate: 72,
      difficulty: "advanced",
      enrollees: 342,
      avgScore: 78,
    },
  ];

  const campaigns: PhishingCampaign[] = [
    {
      id: "CAMP-001",
      name: "Q1 2026 Phishing Campaign",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      totalEmails: 2450,
      clickRate: 8.2,
      reportRate: 12.5,
      status: "active",
    },
    {
      id: "CAMP-002",
      name: "Advanced Phishing Simulation",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      totalEmails: 2100,
      clickRate: 6.8,
      reportRate: 18.3,
      status: "completed",
    },
    {
      id: "CAMP-003",
      name: "Spear Phishing Scenario",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      totalEmails: 1800,
      clickRate: 0,
      reportRate: 0,
      status: "scheduled",
    },
  ];

  const userProgress: UserProgress[] = [
    {
      id: "USR-001",
      name: "Alice Johnson",
      role: "Security Manager",
      completedModules: 12,
      totalModules: 15,
      score: 94,
      certifications: 3,
      phishingTests: 8,
      lastTraining: "2026-03-12",
    },
    {
      id: "USR-002",
      name: "Bob Smith",
      role: "Developer",
      completedModules: 8,
      totalModules: 15,
      score: 87,
      certifications: 1,
      phishingTests: 5,
      lastTraining: "2026-03-10",
    },
    {
      id: "USR-003",
      name: "Carol Davis",
      role: "HR Manager",
      completedModules: 10,
      totalModules: 15,
      score: 91,
      certifications: 2,
      phishingTests: 7,
      lastTraining: "2026-03-14",
    },
    {
      id: "USR-004",
      name: "David Wilson",
      role: "Operations",
      completedModules: 6,
      totalModules: 15,
      score: 78,
      certifications: 0,
      phishingTests: 3,
      lastTraining: "2026-03-08",
    },
  ];

  const leaderboard: Leaderboard[] = [
    { rank: 1, name: "Alice Johnson", department: "Security", points: 2850, completedModules: 12, certifications: 3 },
    { rank: 2, name: "Carol Davis", department: "HR", points: 2640, completedModules: 10, certifications: 2 },
    { rank: 3, name: "Bob Smith", department: "Engineering", points: 2320, completedModules: 8, certifications: 1 },
    { rank: 4, name: "Emma Wilson", department: "Finance", points: 2180, completedModules: 7, certifications: 1 },
    { rank: 5, name: "Frank Brown", department: "Operations", points: 1950, completedModules: 6, certifications: 0 },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-300";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-300";
      case "advanced":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-300";
      case "completed":
        return "bg-green-500/20 text-green-300";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            Security Training & Awareness Platform
          </h1>
          <p className="text-muted-foreground">Phishing simulations, compliance training, and security culture metrics</p>
        </div>

        {/* Training Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{modules.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Available courses</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {Math.round(modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all modules</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phishing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Simulations running</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Report Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">15.4%</div>
              <p className="text-xs text-muted-foreground mt-1">Phishing emails reported</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {modules.reduce((sum, m) => sum + m.enrollees, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active learners</p>
            </CardContent>
          </Card>
        </div>

        {/* Training Modules */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Security Training Modules
            </CardTitle>
            <CardDescription>Compliance and awareness training courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modules.map((module) => (
                <div key={module.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{module.category} • {module.duration} minutes</p>
                    </div>
                    <Badge className={getDifficultyColor(module.difficulty)}>{module.difficulty}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Completion</p>
                      <p className="font-semibold text-green-400">{module.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Enrollees</p>
                      <p className="font-semibold">{module.enrollees}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Avg Score</p>
                      <p className="font-semibold">{module.avgScore}%</p>
                    </div>
                    <div>
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${module.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phishing Simulations */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Phishing Simulation Campaigns
            </CardTitle>
            <CardDescription>Ongoing phishing awareness simulations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaign.startDate} to {campaign.endDate}
                      </p>
                    </div>
                    <Badge className={getCampaignStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Emails</p>
                      <p className="font-semibold">{campaign.totalEmails}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Click Rate</p>
                      <p className={`font-semibold ${campaign.clickRate > 10 ? "text-red-400" : "text-green-400"}`}>
                        {campaign.clickRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Report Rate</p>
                      <p className={`font-semibold ${campaign.reportRate > 15 ? "text-green-400" : "text-yellow-400"}`}>
                        {campaign.reportRate}%
                      </p>
                    </div>
                    <div>
                      <Button size="sm" variant="outline" className="w-full">
                        View Report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Progress */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Training Progress
            </CardTitle>
            <CardDescription>Individual employee training completion and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Name</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Role</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Modules</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Score</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Certifications</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Phishing Tests</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Last Training</th>
                  </tr>
                </thead>
                <tbody>
                  {userProgress.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 font-semibold">{user.name}</td>
                      <td className="py-2 px-3 text-xs">{user.role}</td>
                      <td className="py-2 px-3">
                        <span className="font-semibold">
                          {user.completedModules}/{user.totalModules}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-green-400">{user.score}%</span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{user.certifications}</Badge>
                      </td>
                      <td className="py-2 px-3">{user.phishingTests}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{user.lastTraining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gamified Leaderboard */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Security Culture Leaderboard
            </CardTitle>
            <CardDescription>Gamified scoring and recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between border border-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-bold text-primary">#{entry.rank}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{entry.completedModules}</p>
                      <p className="text-xs text-muted-foreground">modules</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">{entry.certifications}</p>
                      <p className="text-xs text-muted-foreground">certs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Training Controls */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Training Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Launch New Campaign</label>
              <Button variant="outline" className="w-full gap-2">
                <Target className="w-4 h-4" />
                Create Phishing Simulation
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Generate Training Report</label>
              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="w-4 h-4" />
                Export Compliance Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
