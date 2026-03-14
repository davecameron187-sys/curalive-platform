import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Globe, Zap, Target, BarChart3 } from "lucide-react";

interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  type: string;
  iocCount: number;
  lastUpdated: string;
  quality: number;
  status: "active" | "inactive" | "degraded";
}

interface IOCEntry {
  id: string;
  type: "ip" | "domain" | "hash" | "url" | "email";
  value: string;
  threat: string;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  firstSeen: string;
  lastSeen: string;
  blocked: boolean;
  sources: number;
}

interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  motivation: string;
  origin: string;
  targetSectors: string[];
  ttps: string[];
  iocCount: number;
  lastActivity: string;
}

interface BlockingRule {
  id: string;
  ioc: string;
  type: string;
  target: string;
  createdAt: string;
  status: "active" | "pending" | "expired";
  triggeredCount: number;
}

export default function ThreatIntelligenceIOC() {
  const feeds: ThreatFeed[] = [
    { id: "TF-001", name: "MISP Community Feed", provider: "MISP", type: "Multi-type", iocCount: 48320, lastUpdated: "2026-03-14 15:00", quality: 94, status: "active" },
    { id: "TF-002", name: "AlienVault OTX", provider: "AlienVault", type: "Multi-type", iocCount: 125400, lastUpdated: "2026-03-14 14:30", quality: 91, status: "active" },
    { id: "TF-003", name: "Emerging Threats", provider: "Proofpoint", type: "Network", iocCount: 32100, lastUpdated: "2026-03-14 13:00", quality: 96, status: "active" },
    { id: "TF-004", name: "VirusTotal Intelligence", provider: "VirusTotal", type: "File Hashes", iocCount: 89200, lastUpdated: "2026-03-14 12:45", quality: 98, status: "active" },
    { id: "TF-005", name: "Abuse.ch URLhaus", provider: "Abuse.ch", type: "URLs/Domains", iocCount: 15600, lastUpdated: "2026-03-14 10:00", quality: 88, status: "degraded" },
  ];

  const iocs: IOCEntry[] = [
    { id: "IOC-001", type: "ip", value: "185.220.101.45", threat: "C2 Server - APT28", confidence: 98, severity: "critical", firstSeen: "2026-03-10", lastSeen: "2026-03-14", blocked: true, sources: 12 },
    { id: "IOC-002", type: "domain", value: "malware-cdn.evil.com", threat: "Malware Distribution", confidence: 95, severity: "critical", firstSeen: "2026-03-12", lastSeen: "2026-03-14", blocked: true, sources: 8 },
    { id: "IOC-003", type: "hash", value: "a3f4b2c1d5e6f7a8b9c0d1e2f3a4b5c6", threat: "Ransomware - LockBit", confidence: 99, severity: "critical", firstSeen: "2026-03-13", lastSeen: "2026-03-14", blocked: true, sources: 15 },
    { id: "IOC-004", type: "url", value: "http://phish-kit.ru/login.php", threat: "Credential Phishing", confidence: 92, severity: "high", firstSeen: "2026-03-11", lastSeen: "2026-03-14", blocked: true, sources: 6 },
    { id: "IOC-005", type: "email", value: "ceo-spoof@legit-corp.ru", threat: "BEC / Spear Phishing", confidence: 87, severity: "high", firstSeen: "2026-03-14", lastSeen: "2026-03-14", blocked: false, sources: 3 },
    { id: "IOC-006", type: "ip", value: "91.108.4.200", threat: "Tor Exit Node", confidence: 82, severity: "medium", firstSeen: "2026-03-08", lastSeen: "2026-03-14", blocked: false, sources: 5 },
  ];

  const actors: ThreatActor[] = [
    {
      id: "TA-001",
      name: "APT28",
      aliases: ["Fancy Bear", "Sofacy", "Pawn Storm"],
      motivation: "Espionage",
      origin: "Russia",
      targetSectors: ["Government", "Defense", "Energy", "Finance"],
      ttps: ["Spear Phishing", "Zero-Day Exploits", "Credential Theft", "Lateral Movement"],
      iocCount: 342,
      lastActivity: "2026-03-14",
    },
    {
      id: "TA-002",
      name: "Lazarus Group",
      aliases: ["Hidden Cobra", "Zinc"],
      motivation: "Financial / Espionage",
      origin: "North Korea",
      targetSectors: ["Finance", "Crypto", "Defense", "Healthcare"],
      ttps: ["Supply Chain Attacks", "Watering Hole", "Ransomware", "Data Theft"],
      iocCount: 218,
      lastActivity: "2026-03-12",
    },
    {
      id: "TA-003",
      name: "FIN7",
      aliases: ["Carbanak", "Navigator Group"],
      motivation: "Financial",
      origin: "Eastern Europe",
      targetSectors: ["Retail", "Hospitality", "Finance"],
      ttps: ["Spear Phishing", "POS Malware", "Backdoors", "Credential Theft"],
      iocCount: 156,
      lastActivity: "2026-03-10",
    },
  ];

  const blockingRules: BlockingRule[] = [
    { id: "BR-001", ioc: "185.220.101.45", type: "IP Block", target: "Firewall + EDR", createdAt: "2026-03-14 15:05", status: "active", triggeredCount: 47 },
    { id: "BR-002", ioc: "malware-cdn.evil.com", type: "DNS Block", target: "DNS Resolver + Proxy", createdAt: "2026-03-14 14:22", status: "active", triggeredCount: 23 },
    { id: "BR-003", ioc: "a3f4b2c1d5e6f7a8b9c0d1e2f3a4b5c6", type: "Hash Block", target: "EDR + AV", createdAt: "2026-03-14 13:45", status: "active", triggeredCount: 8 },
    { id: "BR-004", ioc: "http://phish-kit.ru/login.php", type: "URL Block", target: "Web Proxy + Email Gateway", createdAt: "2026-03-14 12:30", status: "active", triggeredCount: 15 },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ip": return "bg-red-500/20 text-red-300";
      case "domain": return "bg-orange-500/20 text-orange-300";
      case "hash": return "bg-purple-500/20 text-purple-300";
      case "url": return "bg-blue-500/20 text-blue-300";
      case "email": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-300";
      case "high": return "bg-orange-500/20 text-orange-300";
      case "medium": return "bg-yellow-500/20 text-yellow-300";
      case "low": return "bg-blue-500/20 text-blue-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getFeedStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-300";
      case "inactive": return "bg-gray-500/20 text-gray-300";
      case "degraded": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const totalIOCs = feeds.reduce((s, f) => s + f.iocCount, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Globe className="w-10 h-10 text-primary" />
            Threat Intelligence & IOC Management
          </h1>
          <p className="text-muted-foreground">Real-time threat feed integration with IOC enrichment, correlation, and automated blocking</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total IOCs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{(totalIOCs / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground mt-1">Across all feeds</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Feeds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{feeds.filter(f => f.status === "active").length}</div>
              <p className="text-xs text-muted-foreground mt-1">Of {feeds.length} total</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked IOCs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{iocs.filter(i => i.blocked).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Auto-blocked</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Threat Actors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{actors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Tracked profiles</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocking Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{blockingRules.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Threat Feeds */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Threat Intelligence Feeds
            </CardTitle>
            <CardDescription>Real-time threat data from external intelligence providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div key={feed.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{feed.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{feed.provider} • {feed.type} • Updated: {feed.lastUpdated}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getFeedStatusColor(feed.status)}>{feed.status}</Badge>
                      <Badge variant="outline">Quality: {feed.quality}%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{feed.iocCount.toLocaleString()} IOCs</span>
                    <div className="flex items-center gap-2 w-48">
                      <div className="flex-1 bg-border rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${feed.quality}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* IOC List */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Active IOC Indicators
            </CardTitle>
            <CardDescription>Enriched indicators of compromise with blocking status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Value</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Threat</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Confidence</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Severity</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Sources</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {iocs.map((ioc) => (
                    <tr key={ioc.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3"><Badge className={getTypeColor(ioc.type)}>{ioc.type}</Badge></td>
                      <td className="py-2 px-3 font-mono text-xs">{ioc.value}</td>
                      <td className="py-2 px-3 text-xs">{ioc.threat}</td>
                      <td className="py-2 px-3 font-semibold text-green-400">{ioc.confidence}%</td>
                      <td className="py-2 px-3"><Badge className={getSeverityColor(ioc.severity)}>{ioc.severity}</Badge></td>
                      <td className="py-2 px-3">{ioc.sources}</td>
                      <td className="py-2 px-3">
                        {ioc.blocked
                          ? <Badge className="bg-green-500/20 text-green-300">Blocked</Badge>
                          : <Button size="sm" variant="outline" className="text-xs h-6">Block</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Threat Actor Profiles */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Threat Actor Profiles
            </CardTitle>
            <CardDescription>Tracked advanced persistent threat groups and their TTPs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actors.map((actor) => (
                <div key={actor.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{actor.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aliases: {actor.aliases.join(", ")} • Origin: {actor.origin} • Motivation: {actor.motivation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{actor.iocCount}</p>
                      <p className="text-xs text-muted-foreground">IOCs</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Target Sectors</p>
                      <div className="flex flex-wrap gap-1">
                        {actor.targetSectors.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">TTPs</p>
                      <div className="flex flex-wrap gap-1">
                        {actor.ttps.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Last activity: {actor.lastActivity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blocking Rules */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Automated Blocking Rules
            </CardTitle>
            <CardDescription>IOC-driven blocking rules deployed across security controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">IOC</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Rule Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Target</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Created</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Triggered</th>
                  </tr>
                </thead>
                <tbody>
                  {blockingRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 font-mono text-xs">{rule.ioc}</td>
                      <td className="py-2 px-3"><Badge variant="outline">{rule.type}</Badge></td>
                      <td className="py-2 px-3 text-xs">{rule.target}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{rule.createdAt}</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-300">{rule.status}</Badge></td>
                      <td className="py-2 px-3 font-semibold text-red-400">{rule.triggeredCount}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Intelligence Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full gap-2">
              <Globe className="w-4 h-4" />
              Add New Threat Feed
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Shield className="w-4 h-4" />
              Export Blocking Rules
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
