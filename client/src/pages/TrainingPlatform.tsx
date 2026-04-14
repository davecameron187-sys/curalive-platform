import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Video,
  CheckCircle,
  AlertCircle,
  Award,
  Users,
  BarChart3,
  Play,
  Download,
  Plus,
  Eye,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: "video" | "interactive" | "quiz" | "simulation";
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  enrolledUsers: number;
  completionRate: number;
  lastUpdated: number;
  topics: string[];
}

interface PhishingSimulation {
  id: string;
  name: string;
  description: string;
  launchDate: number;
  targetUsers: number;
  reportRate: number;
  clickRate: number;
  submissionRate: number;
  status: "draft" | "running" | "completed";
  difficulty: "easy" | "medium" | "hard";
}

interface UserProgress {
  id: string;
  name: string;
  email: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  certifications: string[];
  lastActivity: number;
  riskLevel: "low" | "medium" | "high";
}

interface Certification {
  id: string;
  name: string;
  description: string;
  requiredModules: string[];
  earnedBy: number;
  validityPeriod: number;
  renewalRequired: boolean;
  lastIssued: number;
}

export default function TrainingPlatform() {
  const [modules] = useState<TrainingModule[]>([
    {
      id: "MOD-001",
      title: "Security Fundamentals",
      description: "Introduction to information security principles",
      type: "video",
      duration: 45,
      difficulty: "beginner",
      enrolledUsers: 245,
      completionRate: 89,
      lastUpdated: Date.now() - 604800000,
      topics: ["Confidentiality", "Integrity", "Availability"],
    },
    {
      id: "MOD-002",
      title: "Password Security",
      description: "Best practices for password management",
      type: "interactive",
      duration: 30,
      difficulty: "beginner",
      enrolledUsers: 198,
      completionRate: 92,
      lastUpdated: Date.now() - 1209600000,
      topics: ["Passwords", "MFA", "Authentication"],
    },
    {
      id: "MOD-003",
      title: "Phishing Detection",
      description: "Identify and report phishing emails",
      type: "simulation",
      duration: 60,
      difficulty: "intermediate",
      enrolledUsers: 156,
      completionRate: 78,
      lastUpdated: Date.now() - 1814400000,
      topics: ["Email", "Social Engineering", "Reporting"],
    },
    {
      id: "MOD-004",
      title: "Data Protection",
      description: "Handling sensitive data securely",
      type: "quiz",
      duration: 20,
      difficulty: "intermediate",
      enrolledUsers: 134,
      completionRate: 85,
      lastUpdated: Date.now() - 2419200000,
      topics: ["Data Classification", "DLP", "Encryption"],
    },
  ]);

  const [phishingSimulations] = useState<PhishingSimulation[]>([
    {
      id: "PHISH-001",
      name: "Q1 2026 Campaign",
      description: "Targeted phishing simulation for finance team",
      launchDate: Date.now() - 604800000,
      targetUsers: 45,
      reportRate: 72,
      clickRate: 18,
      submissionRate: 8,
      status: "completed",
      difficulty: "medium",
    },
    {
      id: "PHISH-002",
      name: "Executive Impersonation",
      description: "CEO impersonation attack simulation",
      launchDate: Date.now() - 259200000,
      targetUsers: 120,
      reportRate: 65,
      clickRate: 25,
      submissionRate: 12,
      status: "running",
      difficulty: "hard",
    },
    {
      id: "PHISH-003",
      name: "HR Onboarding Scam",
      description: "Fake HR onboarding email simulation",
      launchDate: Date.now() + 604800000,
      targetUsers: 80,
      reportRate: 0,
      clickRate: 0,
      submissionRate: 0,
      status: "draft",
      difficulty: "easy",
    },
  ]);

  const [userProgress] = useState<UserProgress[]>([
    {
      id: "USR-001",
      name: "Alice Johnson",
      email: "alice@company.com",
      completedModules: 4,
      totalModules: 4,
      completionPercentage: 100,
      certifications: ["Security Fundamentals", "Data Protection"],
      lastActivity: Date.now() - 86400000,
      riskLevel: "low",
    },
    {
      id: "USR-002",
      name: "Bob Smith",
      email: "bob@company.com",
      completedModules: 2,
      totalModules: 4,
      completionPercentage: 50,
      certifications: ["Security Fundamentals"],
      lastActivity: Date.now() - 604800000,
      riskLevel: "high",
    },
    {
      id: "USR-003",
      name: "Carol White",
      email: "carol@company.com",
      completedModules: 3,
      totalModules: 4,
      completionPercentage: 75,
      certifications: ["Security Fundamentals", "Password Security"],
      lastActivity: Date.now() - 259200000,
      riskLevel: "medium",
    },
  ]);

  const [certifications] = useState<Certification[]>([
    {
      id: "CERT-001",
      name: "Security Fundamentals",
      description: "Foundational security knowledge",
      requiredModules: ["MOD-001"],
      earnedBy: 245,
      validityPeriod: 365,
      renewalRequired: true,
      lastIssued: Date.now() - 86400000,
    },
    {
      id: "CERT-002",
      name: "Data Protection Specialist",
      description: "Advanced data protection practices",
      requiredModules: ["MOD-001", "MOD-004"],
      earnedBy: 89,
      validityPeriod: 730,
      renewalRequired: true,
      lastIssued: Date.now() - 259200000,
    },
  ]);

  const handleEnrollModule = (moduleId: string) => {
    toast.success(`Enrolled in module ${moduleId}`);
  };

  const handleStartModule = (moduleId: string) => {
    toast.success(`Starting module ${moduleId}`);
  };

  const handleLaunchSimulation = (simId: string) => {
    toast.success(`Launching phishing simulation ${simId}`);
  };

  const handleDownloadCertificate = (userId: string) => {
    toast.success(`Downloading certificate for user ${userId}`);
  };

  const totalUsers = userProgress.length;
  const averageCompletion =
    Math.round(
      userProgress.reduce((sum, u) => sum + u.completionPercentage, 0) /
        userProgress.length
    ) || 0;
  const certifiedUsers = userProgress.filter((u) => u.certifications.length > 0)
    .length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Awareness Training</h1>
        <p className="text-muted-foreground mt-1">
          Interactive training modules, phishing simulations, and certification management
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Users</p>
          <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Completion</p>
          <p className="text-3xl font-bold">{averageCompletion}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Certified Users</p>
          <p className="text-3xl font-bold text-green-600">{certifiedUsers}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Modules</p>
          <p className="text-3xl font-bold">{modules.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Training Modules
          </h2>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            New Module
          </Button>
        </div>

        <div className="space-y-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {module.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        module.type === "video"
                          ? "bg-blue-500/20 text-blue-600"
                          : module.type === "interactive"
                            ? "bg-purple-500/20 text-purple-600"
                            : module.type === "quiz"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-orange-500/20 text-orange-600"
                      }`}
                    >
                      {module.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        module.difficulty === "beginner"
                          ? "bg-green-500/20 text-green-600"
                          : module.difficulty === "intermediate"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {module.difficulty}
                    </span>
                  </div>
                  <h4 className="font-semibold">{module.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {module.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartModule(module.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnrollModule(module.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Enroll
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{module.duration} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-semibold">{module.enrolledUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completion</p>
                  <p className="font-semibold">{module.completionRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - module.lastUpdated) / 604800000)}w ago
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {module.topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Phishing Simulations
          </h2>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            New Campaign
          </Button>
        </div>

        <div className="space-y-3">
          {phishingSimulations.map((sim) => (
            <div
              key={sim.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {sim.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        sim.status === "running"
                          ? "bg-green-500/20 text-green-600"
                          : sim.status === "completed"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {sim.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        sim.difficulty === "easy"
                          ? "bg-green-500/20 text-green-600"
                          : sim.difficulty === "medium"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {sim.difficulty}
                    </span>
                  </div>
                  <h4 className="font-semibold">{sim.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sim.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLaunchSimulation(sim.id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {sim.status === "draft" ? "Launch" : "View"}
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Target Users</p>
                  <p className="font-semibold">{sim.targetUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Report Rate</p>
                  <p className="font-semibold text-green-600">{sim.reportRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Click Rate</p>
                  <p className="font-semibold text-orange-600">{sim.clickRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submission Rate</p>
                  <p className="font-semibold text-red-600">{sim.submissionRate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          User Progress
        </h2>

        <div className="space-y-3">
          {userProgress.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {user.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        user.riskLevel === "low"
                          ? "bg-green-500/20 text-green-600"
                          : user.riskLevel === "medium"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {user.riskLevel} risk
                    </span>
                  </div>
                  <h4 className="font-semibold">{user.name}</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCertificate(user.id)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Certificate
                </Button>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Completion Progress</p>
                  <p className="text-xs font-semibold">{user.completionPercentage}%</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${user.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div>
                  <p className="text-muted-foreground">Modules</p>
                  <p className="font-semibold">
                    {user.completedModules}/{user.totalModules}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Certifications</p>
                  <p className="font-semibold">{user.certifications.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Activity</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - user.lastActivity) / 86400000)}d ago
                  </p>
                </div>
              </div>

              {user.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {user.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded font-semibold"
                    >
                      ✓ {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-4 w-4" />
          Certifications
        </h2>

        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cert.description}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Earned By</p>
                  <p className="font-semibold">{cert.earnedBy} users</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validity</p>
                  <p className="font-semibold">{cert.validityPeriod} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Renewal</p>
                  <p className="font-semibold">
                    {cert.renewalRequired ? "Required" : "Not Required"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
