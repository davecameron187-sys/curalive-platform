import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle,
  Download,
  Plus,
  Eye,
  Tag,
  Search,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  timestamp: number;
  type: "detection" | "investigation" | "response" | "resolution" | "evidence";
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  evidence: string[];
  investigator: string;
  tags: string[];
}

interface ForensicEvidence {
  id: string;
  name: string;
  type: string;
  size: string;
  collected: number;
  hash: string;
  chain_of_custody: string[];
  status: "collected" | "analyzed" | "archived";
  tags: string[];
}

interface RootCauseAnalysis {
  id: string;
  incidentId: string;
  rootCause: string;
  contributingFactors: string[];
  timeline: string;
  recommendations: string[];
  priority: "critical" | "high" | "medium" | "low";
  status: "draft" | "review" | "approved";
}

interface PostIncidentReview {
  id: string;
  incidentId: string;
  date: number;
  attendees: string[];
  findings: string[];
  actionItems: string[];
  status: "scheduled" | "completed" | "pending";
}

export default function IncidentTimeline() {
  const [timelineEvents] = useState<TimelineEvent[]>([
    {
      id: "EVT-001",
      timestamp: Date.now() - 86400000,
      type: "detection",
      title: "Suspicious Login Detected",
      description: "Unusual login from IP 203.0.113.45 detected at 14:23 UTC",
      severity: "high",
      evidence: ["EVD-001", "EVD-002"],
      investigator: "John Smith",
      tags: ["authentication", "suspicious-login"],
    },
    {
      id: "EVT-002",
      timestamp: Date.now() - 82800000,
      type: "investigation",
      title: "Forensic Analysis Started",
      description: "Security team began forensic analysis of the suspicious login",
      severity: "high",
      evidence: ["EVD-003", "EVD-004"],
      investigator: "Jane Doe",
      tags: ["forensics", "investigation"],
    },
    {
      id: "EVT-003",
      timestamp: Date.now() - 79200000,
      type: "response",
      title: "Account Locked",
      description: "Compromised account locked and password reset initiated",
      severity: "high",
      evidence: ["EVD-005"],
      investigator: "John Smith",
      tags: ["containment", "response"],
    },
    {
      id: "EVT-004",
      timestamp: Date.now() - 75600000,
      type: "resolution",
      title: "Incident Resolved",
      description: "All systems verified secure, incident closed",
      severity: "medium",
      evidence: ["EVD-006"],
      investigator: "Security Team",
      tags: ["resolution", "closure"],
    },
  ]);

  const [forensicEvidence] = useState<ForensicEvidence[]>([
    {
      id: "EVD-001",
      name: "Login Audit Log",
      type: "Log File",
      size: "2.4 MB",
      collected: Date.now() - 86400000,
      hash: "sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      chain_of_custody: ["John Smith", "Jane Doe", "Security Archive"],
      status: "archived",
      tags: ["authentication", "audit"],
    },
    {
      id: "EVD-002",
      name: "Network Traffic Capture",
      type: "PCAP",
      size: "15.8 MB",
      collected: Date.now() - 86400000,
      hash: "sha256:q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
      chain_of_custody: ["Jane Doe", "Security Archive"],
      status: "archived",
      tags: ["network", "traffic"],
    },
    {
      id: "EVD-003",
      name: "System Memory Dump",
      type: "Memory Image",
      size: "32.0 GB",
      collected: Date.now() - 82800000,
      hash: "sha256:g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6",
      chain_of_custody: ["John Smith", "Forensic Lab"],
      status: "analyzed",
      tags: ["memory", "forensics"],
    },
    {
      id: "EVD-004",
      name: "Disk Image",
      type: "Disk Image",
      size: "256.0 GB",
      collected: Date.now() - 82800000,
      hash: "sha256:w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6",
      chain_of_custody: ["Jane Doe", "Forensic Lab"],
      status: "analyzed",
      tags: ["disk", "forensics"],
    },
  ]);

  const [rootCauseAnalyses] = useState<RootCauseAnalysis[]>([
    {
      id: "RCA-001",
      incidentId: "INC-001",
      rootCause: "Weak password policy allowed brute force attack",
      contributingFactors: [
        "MFA not enforced",
        "No rate limiting on login attempts",
        "Outdated security baseline",
      ],
      timeline: "Attack occurred over 2-hour window",
      recommendations: [
        "Enforce strong password policy",
        "Implement MFA for all accounts",
        "Add rate limiting to authentication",
      ],
      priority: "critical",
      status: "approved",
    },
  ]);

  const [postIncidentReviews] = useState<PostIncidentReview[]>([
    {
      id: "PIR-001",
      incidentId: "INC-001",
      date: Date.now() - 3600000,
      attendees: ["John Smith", "Jane Doe", "CISO", "Security Lead"],
      findings: [
        "Response time was 45 minutes",
        "Forensic collection was thorough",
        "Communication could be improved",
      ],
      actionItems: [
        "Update incident response playbook",
        "Conduct security awareness training",
        "Implement additional monitoring",
      ],
      status: "completed",
    },
  ]);

  const handleDownloadForensics = (evidenceId: string) => {
    toast.success(`Downloading forensic evidence ${evidenceId}`);
  };

  const handleGenerateReport = () => {
    toast.success("Forensic report generated successfully");
  };

  const handleAddEvent = () => {
    toast.success("Timeline event added");
  };

  const handleTagEvidence = (evidenceId: string) => {
    toast.success(`Tagged evidence ${evidenceId}`);
  };

  const severityColors = {
    critical: "text-red-600 bg-red-500/20",
    high: "text-orange-600 bg-orange-500/20",
    medium: "text-yellow-600 bg-yellow-500/20",
    low: "text-green-600 bg-green-500/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident Timeline & Forensics</h1>
        <p className="text-muted-foreground mt-1">
          Detailed incident timeline with forensic evidence collection and chain of custody
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Timeline Events</p>
          <p className="text-3xl font-bold text-blue-600">{timelineEvents.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Evidence Items</p>
          <p className="text-3xl font-bold">{forensicEvidence.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">RCA Documents</p>
          <p className="text-3xl font-bold text-green-600">
            {rootCauseAnalyses.length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">PIR Completed</p>
          <p className="text-3xl font-bold">
            {postIncidentReviews.filter((p) => p.status === "completed").length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Incident Timeline
          </h2>
          <Button onClick={handleAddEvent} size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Add Event
          </Button>
        </div>

        <div className="space-y-4">
          {timelineEvents.map((event, idx) => (
            <div key={event.id} className="relative">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.type === "detection"
                        ? "bg-red-600"
                        : event.type === "investigation"
                          ? "bg-yellow-600"
                          : event.type === "response"
                            ? "bg-orange-600"
                            : "bg-green-600"
                    }`}
                  />
                  {idx < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {event.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            severityColors[event.severity]
                          }`}
                        >
                          {event.severity}
                        </span>
                      </div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {event.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Investigator: {event.investigator}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Forensic Evidence
          </h2>
          <Button onClick={handleGenerateReport} size="sm">
            <Download className="h-3 w-3 mr-1" />
            Generate Report
          </Button>
        </div>

        <div className="space-y-3">
          {forensicEvidence.map((evidence) => (
            <div
              key={evidence.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {evidence.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        evidence.status === "collected"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : evidence.status === "analyzed"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-green-500/20 text-green-600"
                      }`}
                    >
                      {evidence.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{evidence.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {evidence.type} • Size: {evidence.size}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTagEvidence(evidence.id)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    Tag
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadForensics(evidence.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <p className="text-muted-foreground">Hash</p>
                  <p className="font-mono text-xs break-all">{evidence.hash}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Collected</p>
                  <p className="font-semibold">
                    {new Date(evidence.collected).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Chain of Custody</p>
                <div className="flex flex-wrap gap-1">
                  {evidence.chain_of_custody.map((custodian, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                    >
                      {custodian}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {evidence.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Root Cause Analysis
        </h2>

        <div className="space-y-3">
          {rootCauseAnalyses.map((rca) => (
            <div
              key={rca.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {rca.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        severityColors[rca.priority]
                      }`}
                    >
                      {rca.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        rca.status === "approved"
                          ? "bg-green-500/20 text-green-600"
                          : rca.status === "review"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {rca.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{rca.rootCause}</h4>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Contributing Factors</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {rca.contributingFactors.map((factor, idx) => (
                      <li key={idx} className="text-xs">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs">Recommendations</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {rca.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Post-Incident Reviews
        </h2>

        <div className="space-y-3">
          {postIncidentReviews.map((pir) => (
            <div
              key={pir.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {pir.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        pir.status === "completed"
                          ? "bg-green-500/20 text-green-600"
                          : pir.status === "scheduled"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {pir.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">
                    Post-Incident Review for {pir.incidentId}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(pir.date).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Attendees</p>
                  <div className="flex flex-wrap gap-1">
                    {pir.attendees.map((attendee, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs mb-1">Action Items</p>
                  <p className="font-semibold">{pir.actionItems.length} items</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
