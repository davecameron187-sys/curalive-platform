import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Plus,
  Edit2,
  Eye,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Incident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  createdAt: number;
  resolvedAt?: number;
  assignee: string;
  timeToDetect: number;
  timeToRespond: number;
  timeToResolve?: number;
  affectedSystems: string[];
  evidence: number;
}

interface IncidentTimeline {
  id: string;
  incidentId: string;
  timestamp: number;
  action: string;
  actor: string;
  details: string;
}

interface PostIncidentReview {
  id: string;
  incidentId: string;
  reviewDate: number;
  findings: string[];
  recommendations: string[];
  status: "pending" | "in-progress" | "completed";
}

export default function SecurityIncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "inc-001",
      title: "Unauthorized API Access Attempt",
      severity: "critical",
      status: "resolved",
      createdAt: Date.now() - 86400000,
      resolvedAt: Date.now() - 82800000,
      assignee: "Sarah Chen",
      timeToDetect: 15,
      timeToRespond: 8,
      timeToResolve: 3600,
      affectedSystems: ["API Gateway", "Authentication"],
      evidence: 12,
    },
    {
      id: "inc-002",
      title: "Suspicious Data Export Activity",
      severity: "high",
      status: "investigating",
      createdAt: Date.now() - 7200000,
      assignee: "Mike Johnson",
      timeToDetect: 45,
      timeToRespond: 12,
      affectedSystems: ["Data Storage", "Logging"],
      evidence: 8,
    },
    {
      id: "inc-003",
      title: "Policy Violation - Unapproved Software",
      severity: "medium",
      status: "open",
      createdAt: Date.now() - 3600000,
      assignee: "Unassigned",
      timeToDetect: 120,
      timeToRespond: 0,
      affectedSystems: ["Endpoint Security"],
      evidence: 3,
    },
  ]);

  const [timelines, setTimelines] = useState<IncidentTimeline[]>([
    {
      id: "tl-001",
      incidentId: "inc-001",
      timestamp: Date.now() - 86400000,
      action: "Incident Detected",
      actor: "Security System",
      details: "Unusual API access pattern detected",
    },
    {
      id: "tl-002",
      incidentId: "inc-001",
      timestamp: Date.now() - 85800000,
      action: "Alert Escalated",
      actor: "Automated System",
      details: "Escalated to critical severity",
    },
    {
      id: "tl-003",
      incidentId: "inc-001",
      timestamp: Date.now() - 85200000,
      action: "Incident Assigned",
      actor: "Sarah Chen",
      details: "Assigned to incident response team",
    },
  ]);

  const [reviews, setReviews] = useState<PostIncidentReview[]>([
    {
      id: "pir-001",
      incidentId: "inc-001",
      reviewDate: Date.now() - 82800000,
      findings: [
        "API rate limiting was not enforced",
        "Logs were not monitored in real-time",
        "Escalation procedures were delayed",
      ],
      recommendations: [
        "Implement API rate limiting",
        "Set up real-time log monitoring",
        "Update escalation procedures",
      ],
      status: "completed",
    },
  ]);

  const stats = {
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((i) => i.status === "open").length,
    avgTimeToDetect: Math.round(
      incidents.reduce((sum, i) => sum + i.timeToDetect, 0) / incidents.length
    ),
    avgTimeToRespond: Math.round(
      incidents.reduce((sum, i) => sum + i.timeToRespond, 0) / incidents.length
    ),
  };

  const handleCreateIncident = () => {
    toast.success("New incident created");
  };

  const handleAssignIncident = (incidentId: string) => {
    toast.success("Incident assigned");
  };

  const handleResolveIncident = (incidentId: string) => {
    toast.success("Incident marked as resolved");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-600";
      case "high":
        return "bg-orange-500/20 text-orange-600";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600";
      case "low":
        return "bg-blue-500/20 text-blue-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500/20 text-red-600";
      case "investigating":
        return "bg-yellow-500/20 text-yellow-600";
      case "resolved":
        return "bg-green-500/20 text-green-600";
      case "closed":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Incident Management</h1>
        <p className="text-muted-foreground mt-1">
          Incident ticketing with timeline tracking and post-incident reviews
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Incidents</p>
          <p className="text-3xl font-bold">{stats.totalIncidents}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Open</p>
          <p className="text-3xl font-bold text-red-600">{stats.openIncidents}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg MTTD</p>
          <p className="text-3xl font-bold">{stats.avgTimeToDetect}m</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg MTTR</p>
          <p className="text-3xl font-bold">{stats.avgTimeToRespond}m</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Incidents
          </h2>
          <Button onClick={handleCreateIncident}>
            <Plus className="h-3 w-3 mr-1" />
            New Incident
          </Button>
        </div>

        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{incident.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {incident.id} • Assigned to: {incident.assignee}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Affected Systems:</p>
                <div className="flex flex-wrap gap-1">
                  {incident.affectedSystems.map((system) => (
                    <span key={system} className="bg-secondary px-2 py-1 rounded">
                      {system}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">MTTD</p>
                  <p className="font-semibold">{incident.timeToDetect}m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MTTR</p>
                  <p className="font-semibold">{incident.timeToRespond}m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Evidence</p>
                  <p className="font-semibold">{incident.evidence} items</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - incident.createdAt) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{incident.status}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAssignIncident(incident.id)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Assign
                </Button>
                <Button size="sm" onClick={() => handleResolveIncident(incident.id)} variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View Timeline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Incident Timeline
        </h2>

        <div className="space-y-3">
          {timelines.map((event) => (
            <div key={event.id} className="p-3 border border-border rounded flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{event.action}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
                <p className="text-xs mt-1">{event.details}</p>
                <p className="text-xs text-muted-foreground mt-1">By: {event.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Post-Incident Reviews
        </h2>

        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">Incident {review.incidentId}</p>
                <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded font-semibold">
                  {review.status}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                Review Date: {new Date(review.reviewDate).toLocaleDateString()}
              </p>

              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Key Findings:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {review.findings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendations:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {review.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              <Button size="sm" className="mt-3">
                <Zap className="h-3 w-3 mr-1" />
                Create Action Items
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
