import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Play,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  completionRate: number;
  enrolledUsers: number;
  description: string;
}

interface UserProgress {
  userId: string;
  userName: string;
  completedModules: number;
  totalModules: number;
  certifications: string[];
  lastActivity: number;
  completionPercentage: number;
}

export default function SecurityAwarenessTrainingPortal() {
  const [modules, setModules] = useState<TrainingModule[]>([
    {
      id: "tm-001",
      title: "Phishing Recognition & Prevention",
      category: "Security Awareness",
      duration: 30,
      difficulty: "beginner",
      completionRate: 92,
      enrolledUsers: 245,
      description: "Learn to identify and report phishing attempts",
    },
    {
      id: "tm-002",
      title: "Secure Coding Practices",
      category: "Development",
      duration: 120,
      difficulty: "advanced",
      completionRate: 68,
      enrolledUsers: 89,
      description: "Best practices for writing secure code",
    },
    {
      id: "tm-003",
      title: "Data Protection & Privacy",
      category: "Compliance",
      duration: 45,
      difficulty: "intermediate",
      completionRate: 85,
      enrolledUsers: 312,
      description: "GDPR, CCPA, and data handling compliance",
    },
    {
      id: "tm-004",
      title: "Password Security & MFA",
      category: "Security Awareness",
      duration: 20,
      difficulty: "beginner",
      completionRate: 96,
      enrolledUsers: 567,
      description: "Strong passwords and multi-factor authentication",
    },
    {
      id: "tm-005",
      title: "Social Engineering Defense",
      category: "Security Awareness",
      duration: 40,
      difficulty: "intermediate",
      completionRate: 78,
      enrolledUsers: 198,
      description: "Recognize and prevent social engineering attacks",
    },
    {
      id: "tm-006",
      title: "Incident Response Procedures",
      category: "Operations",
      duration: 60,
      difficulty: "advanced",
      completionRate: 71,
      enrolledUsers: 124,
      description: "How to respond to security incidents",
    },
  ]);

  const [userProgress, setUserProgress] = useState<UserProgress[]>([
    {
      userId: "usr-001",
      userName: "Alice Johnson",
      completedModules: 5,
      totalModules: 6,
      certifications: ["Security Awareness", "Data Protection"],
      lastActivity: Date.now() - 86400000,
      completionPercentage: 83,
    },
    {
      userId: "usr-002",
      userName: "Bob Smith",
      completedModules: 4,
      totalModules: 6,
      certifications: ["Security Awareness"],
      lastActivity: Date.now() - 172800000,
      completionPercentage: 67,
    },
    {
      userId: "usr-003",
      userName: "Carol Davis",
      completedModules: 6,
      totalModules: 6,
      certifications: ["Security Awareness", "Data Protection", "Development"],
      lastActivity: Date.now() - 3600000,
      completionPercentage: 100,
    },
  ]);

  const [selectedTab, setSelectedTab] = useState<"modules" | "users">("modules");

  const stats = {
    totalModules: modules.length,
    avgCompletion: Math.round(
      modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length
    ),
    totalEnrolled: modules.reduce((sum, m) => sum + m.enrolledUsers, 0),
    certifiedUsers: userProgress.filter((u) => u.certifications.length > 0)
      .length,
  };

  const handleEnrollModule = (moduleId: string) => {
    toast.success("Enrolled in module");
  };

  const handleCompleteModule = (moduleId: string) => {
    toast.success("Module marked as complete");
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      modules,
      userProgress,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `training-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Training report exported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Awareness Training</h1>
        <p className="text-muted-foreground mt-1">
          Interactive training modules and compliance certification
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Modules</p>
          <p className="text-3xl font-bold">{stats.totalModules}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Completion</p>
          <p className="text-3xl font-bold">{stats.avgCompletion}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Enrolled Users</p>
          <p className="text-3xl font-bold">{stats.totalEnrolled}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Certified</p>
          <p className="text-3xl font-bold">{stats.certifiedUsers}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSelectedTab("modules")}
            className={`px-4 py-2 rounded font-semibold text-sm ${
              selectedTab === "modules"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            Training Modules
          </button>
          <button
            onClick={() => setSelectedTab("users")}
            className={`px-4 py-2 rounded font-semibold text-sm ${
              selectedTab === "users"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            User Progress
          </button>
          <Button onClick={handleExportReport} size="sm" className="ml-auto">
            Export Report
          </Button>
        </div>

        {selectedTab === "modules" && (
          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{module.title}</h4>
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                        {module.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
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
                    <p className="text-xs text-muted-foreground mb-2">
                      {module.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.duration}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {module.enrolledUsers} enrolled
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{module.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">completion</p>
                    <Button
                      size="sm"
                      onClick={() => handleEnrollModule(module.id)}
                      className="mt-2"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </div>

                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${module.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === "users" && (
          <div className="space-y-3">
            {userProgress.map((user) => (
              <div
                key={user.userId}
                className="p-4 border border-border rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{user.userName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed: {user.completedModules}/{user.totalModules}
                      modules
                    </p>
                    {user.certifications.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {user.certifications.map((cert) => (
                          <span
                            key={cert}
                            className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded flex items-center gap-1"
                          >
                            <Award className="h-3 w-3" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {user.completionPercentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(
                        (Date.now() - user.lastActivity) / 86400000
                      )}
                      d ago
                    </p>
                  </div>
                </div>

                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${user.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Training Categories
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold">Security Awareness</p>
            <p className="text-muted-foreground text-xs mt-1">3 modules</p>
          </div>
          <div className="p-3 border border-border rounded">
            <p className="font-semibold">Development</p>
            <p className="text-muted-foreground text-xs mt-1">1 module</p>
          </div>
          <div className="p-3 border border-border rounded">
            <p className="font-semibold">Compliance</p>
            <p className="text-muted-foreground text-xs mt-1">1 module</p>
          </div>
          <div className="p-3 border border-border rounded">
            <p className="font-semibold">Operations</p>
            <p className="text-muted-foreground text-xs mt-1">1 module</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
