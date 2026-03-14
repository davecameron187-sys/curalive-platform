import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, Play, Copy, Settings } from "lucide-react";

interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: number;
  estimatedTime: string;
  successRate: number;
  executions: number;
  lastExecuted: string;
  tags: string[];
}

export default function PlaybookLibrary() {
  const playbooks: Playbook[] = [
    {
      id: "PB-001",
      name: "Ransomware Response",
      category: "Malware",
      description: "Comprehensive response playbook for ransomware attacks including isolation, forensics, and recovery",
      steps: 12,
      estimatedTime: "45 minutes",
      successRate: 94,
      executions: 23,
      lastExecuted: "2026-03-12 14:32:15",
      tags: ["critical", "malware", "ransomware"],
    },
    {
      id: "PB-002",
      name: "DDoS Mitigation",
      category: "Network",
      description: "Automated DDoS attack mitigation with traffic filtering and service restoration",
      steps: 8,
      estimatedTime: "15 minutes",
      successRate: 98,
      executions: 156,
      lastExecuted: "2026-03-14 10:15:42",
      tags: ["network", "ddos", "mitigation"],
    },
    {
      id: "PB-003",
      name: "Insider Threat Response",
      category: "Access Control",
      description: "Response procedures for detected insider threats including account suspension and forensic investigation",
      steps: 10,
      estimatedTime: "30 minutes",
      successRate: 89,
      executions: 12,
      lastExecuted: "2026-03-11 09:22:08",
      tags: ["insider", "access", "investigation"],
    },
    {
      id: "PB-004",
      name: "Data Breach Response",
      category: "Data Protection",
      description: "Incident response for data breaches including containment, notification, and compliance reporting",
      steps: 15,
      estimatedTime: "60 minutes",
      successRate: 91,
      executions: 8,
      lastExecuted: "2026-03-10 16:45:33",
      tags: ["data", "breach", "compliance"],
    },
    {
      id: "PB-005",
      name: "Credential Compromise",
      category: "Identity",
      description: "Response procedures for compromised credentials including password resets and access reviews",
      steps: 7,
      estimatedTime: "20 minutes",
      successRate: 96,
      executions: 34,
      lastExecuted: "2026-03-13 11:18:22",
      tags: ["identity", "credentials", "access"],
    },
    {
      id: "PB-006",
      name: "Malware Containment",
      category: "Malware",
      description: "Automated malware detection and containment with system quarantine and cleanup procedures",
      steps: 9,
      estimatedTime: "25 minutes",
      successRate: 93,
      executions: 45,
      lastExecuted: "2026-03-14 08:30:15",
      tags: ["malware", "containment", "cleanup"],
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Malware":
        return "bg-red-500/20 text-red-300";
      case "Network":
        return "bg-blue-500/20 text-blue-300";
      case "Access Control":
        return "bg-purple-500/20 text-purple-300";
      case "Data Protection":
        return "bg-orange-500/20 text-orange-300";
      case "Identity":
        return "bg-green-500/20 text-green-300";
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
            Security Playbook Library
          </h1>
          <p className="text-muted-foreground">Pre-built incident response playbooks with one-click execution</p>
        </div>

        {/* Library Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Playbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{playbooks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to execute</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {playbooks.reduce((sum, p) => sum + p.executions, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {Math.round(playbooks.reduce((sum, p) => sum + p.successRate, 0) / playbooks.length)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all playbooks</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">33 min</div>
              <p className="text-xs text-muted-foreground mt-1">Average execution</p>
            </CardContent>
          </Card>
        </div>

        {/* Playbooks Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Available Playbooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playbooks.map((playbook) => (
              <Card key={playbook.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg">{playbook.name}</CardTitle>
                      <Badge className={getCategoryColor(playbook.category)}>{playbook.category}</Badge>
                    </div>
                    <Badge variant="outline">{playbook.id}</Badge>
                  </div>
                  <CardDescription>{playbook.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Playbook Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Steps</p>
                      <p className="font-semibold text-foreground">{playbook.steps}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Est. Time</p>
                      <p className="font-semibold text-foreground">{playbook.estimatedTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Success Rate</p>
                      <p className="font-semibold text-green-400">{playbook.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Executions</p>
                      <p className="font-semibold text-foreground">{playbook.executions}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {playbook.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Last Executed */}
                  <p className="text-xs text-muted-foreground">Last executed: {playbook.lastExecuted}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 gap-2">
                      <Play className="w-4 h-4" />
                      Execute
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Playbook Creation */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Create Custom Playbook
            </CardTitle>
            <CardDescription>Build your own incident response playbooks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define custom playbooks with conditional logic, automated actions, and manual approval gates. Tailor response procedures to your organization's specific needs.
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Playbook
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
