import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  Target,
  TrendingUp,
  Play,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface TrainingCourse {
  id: string;
  title: string;
  category: string;
  duration: number;
  completionRate: number;
  enrolledUsers: number;
  status: "active" | "archived" | "draft";
  lastUpdated: number;
}

interface PhishingCampaign {
  id: string;
  name: string;
  startDate: number;
  endDate?: number;
  status: "active" | "completed" | "scheduled";
  totalEmails: number;
  clickRate: number;
  reportRate: number;
  trainingCompleted: number;
}

interface UserTraining {
  id: string;
  userId: string;
  userName: string;
  coursesCompleted: number;
  certifications: string[];
  lastTrainingDate: number;
  complianceScore: number;
  phishingVulnerability: number;
}

export default function SecurityTrainingAwareness() {
  const [courses, setCourses] = useState<TrainingCourse[]>([
    {
      id: "course-001",
      title: "Security Fundamentals",
      category: "Mandatory",
      duration: 45,
      completionRate: 0.94,
      enrolledUsers: 245,
      status: "active",
      lastUpdated: Date.now() - 604800000,
    },
    {
      id: "course-002",
      title: "Phishing Awareness",
      category: "Mandatory",
      duration: 30,
      completionRate: 0.89,
      enrolledUsers: 245,
      status: "active",
      lastUpdated: Date.now() - 1209600000,
    },
    {
      id: "course-003",
      title: "Data Protection & Privacy",
      category: "Mandatory",
      duration: 60,
      completionRate: 0.82,
      enrolledUsers: 245,
      status: "active",
      lastUpdated: Date.now() - 1814400000,
    },
    {
      id: "course-004",
      title: "Incident Response",
      category: "Advanced",
      duration: 90,
      completionRate: 0.56,
      enrolledUsers: 78,
      status: "active",
      lastUpdated: Date.now() - 2419200000,
    },
  ]);

  const [campaigns, setCampaigns] = useState<PhishingCampaign[]>([
    {
      id: "campaign-001",
      name: "March 2026 Phishing Test",
      startDate: Date.now() - 604800000,
      endDate: Date.now() - 259200000,
      status: "completed",
      totalEmails: 245,
      clickRate: 0.12,
      reportRate: 0.68,
      trainingCompleted: 168,
    },
    {
      id: "campaign-002",
      name: "April 2026 Phishing Test",
      startDate: Date.now() - 86400000,
      status: "active",
      totalEmails: 245,
      clickRate: 0.08,
      reportRate: 0.72,
      trainingCompleted: 45,
    },
  ]);

  const [users, setUsers] = useState<UserTraining[]>([
    {
      id: "user-001",
      userId: "u-001",
      userName: "Sarah Chen",
      coursesCompleted: 4,
      certifications: ["Security Fundamentals", "Phishing Awareness", "Data Protection"],
      lastTrainingDate: Date.now() - 604800000,
      complianceScore: 98,
      phishingVulnerability: 0.05,
    },
    {
      id: "user-002",
      userId: "u-002",
      userName: "Mike Johnson",
      coursesCompleted: 3,
      certifications: ["Security Fundamentals", "Phishing Awareness"],
      lastTrainingDate: Date.now() - 1209600000,
      complianceScore: 85,
      phishingVulnerability: 0.15,
    },
    {
      id: "user-003",
      userId: "u-003",
      userName: "Lisa Anderson",
      coursesCompleted: 2,
      certifications: ["Security Fundamentals"],
      lastTrainingDate: Date.now() - 1814400000,
      complianceScore: 72,
      phishingVulnerability: 0.28,
    },
  ]);

  const stats = {
    totalCourses: courses.length,
    avgCompletionRate: (
      courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length
    ).toFixed(2),
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    avgPhishingReportRate: (
      campaigns.reduce((sum, c) => sum + c.reportRate, 0) / campaigns.length
    ).toFixed(2),
  };

  const handleStartCourse = (courseId: string) => {
    toast.success("Course started");
  };

  const handleLaunchCampaign = () => {
    toast.success("Phishing campaign launched");
  };

  const handleAssignTraining = (userId: string) => {
    toast.success("Training assigned");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "completed":
        return "bg-blue-500/20 text-blue-600";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-600";
      case "archived":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Training & Awareness</h1>
        <p className="text-muted-foreground mt-1">
          Phishing simulations, mandatory training, and awareness metrics
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Courses</p>
          <p className="text-3xl font-bold">{stats.totalCourses}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Completion</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgCompletionRate}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Report Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgPhishingReportRate}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Training Courses
          </h2>
          <Button>
            <Plus className="h-3 w-3 mr-1" />
            Create Course
          </Button>
        </div>

        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{course.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.category} • {course.duration} minutes
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(course.status)}`}>
                  {course.status}
                </span>
              </div>

              <div className="mb-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-muted-foreground">Completion Rate</p>
                  <p className="font-semibold">{(course.completionRate * 100).toFixed(0)}%</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${course.completionRate * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-semibold">{course.enrolledUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - course.lastUpdated) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <Button size="sm" onClick={() => handleStartCourse(course.id)}>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Phishing Campaigns
          </h2>
          <Button onClick={handleLaunchCampaign}>
            <Plus className="h-3 w-3 mr-1" />
            New Campaign
          </Button>
        </div>

        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{campaign.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(campaign.startDate).toLocaleDateString()} •{" "}
                    {campaign.totalEmails} emails sent
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Click Rate</p>
                  <p className="font-semibold">{(campaign.clickRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Report Rate</p>
                  <p className="font-semibold text-green-600">{(campaign.reportRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Training Completed</p>
                  <p className="font-semibold">{campaign.trainingCompleted}</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          User Training Status
        </h2>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{user.userName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.coursesCompleted} courses completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Compliance Score</p>
                  <p className="text-lg font-bold text-green-600">{user.complianceScore}</p>
                </div>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Certifications:</p>
                <div className="flex flex-wrap gap-1">
                  {user.certifications.map((cert) => (
                    <span key={cert} className="bg-green-500/20 text-green-600 px-2 py-0.5 rounded">
                      ✓ {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Last Training</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - user.lastTrainingDate) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phishing Risk</p>
                  <p className={`font-semibold ${user.phishingVulnerability > 0.2 ? "text-red-600" : "text-green-600"}`}>
                    {(user.phishingVulnerability * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <Button size="sm" onClick={() => handleAssignTraining(user.userId)} variant="outline">
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Awareness Metrics
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Organization-Wide Metrics</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Avg Compliance Score</p>
                <p className="font-semibold">85/100</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Training Completion Rate</p>
                <p className="font-semibold">88%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Phishing Report Rate</p>
                <p className="font-semibold">72%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Avg Phishing Click Rate</p>
                <p className="font-semibold">10%</p>
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded">
            <p className="font-semibold mb-2">Trend Analysis</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Compliance (vs last month)</p>
                <p className="font-semibold text-green-600">↑ 3 points</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Report Rate (vs last month)</p>
                <p className="font-semibold text-green-600">↑ 8%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Click Rate (vs last month)</p>
                <p className="font-semibold text-green-600">↓ 2%</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Training Completion</p>
                <p className="font-semibold text-green-600">↑ 5%</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
