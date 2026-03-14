import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Target,
  Zap,
  Users,
  Medal,
} from "lucide-react";
import { toast } from "sonner";

interface Champion {
  id: string;
  name: string;
  department: string;
  points: number;
  level: string;
  badges: string[];
  completedModules: number;
  rank: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: number;
}

export default function SecurityChampionsProgram() {
  const [champions, setChampions] = useState<Champion[]>([
    {
      id: "champ-001",
      name: "Sarah Chen",
      department: "Engineering",
      points: 4850,
      level: "Gold",
      badges: ["phishing-master", "secure-coder", "incident-responder"],
      completedModules: 12,
      rank: 1,
    },
    {
      id: "champ-002",
      name: "Marcus Johnson",
      department: "Operations",
      points: 4320,
      level: "Silver",
      badges: ["compliance-expert", "data-protector"],
      completedModules: 10,
      rank: 2,
    },
    {
      id: "champ-003",
      name: "Elena Rodriguez",
      department: "Product",
      points: 3890,
      level: "Silver",
      badges: ["threat-hunter", "secure-coder"],
      completedModules: 9,
      rank: 3,
    },
    {
      id: "champ-004",
      name: "David Park",
      department: "Security",
      points: 3450,
      level: "Bronze",
      badges: ["incident-responder"],
      completedModules: 8,
      rank: 4,
    },
    {
      id: "champ-005",
      name: "Lisa Thompson",
      department: "HR",
      points: 2980,
      level: "Bronze",
      badges: ["phishing-master"],
      completedModules: 7,
      rank: 5,
    },
  ]);

  const [badges] = useState<Badge[]>([
    {
      id: "phishing-master",
      name: "Phishing Master",
      description: "Complete phishing simulation with 95%+ accuracy",
      icon: "🎣",
      earned: 12,
    },
    {
      id: "secure-coder",
      name: "Secure Coder",
      description: "Complete secure coding course",
      icon: "💻",
      earned: 8,
    },
    {
      id: "incident-responder",
      name: "Incident Responder",
      description: "Complete incident response training",
      icon: "🚨",
      earned: 6,
    },
    {
      id: "compliance-expert",
      name: "Compliance Expert",
      description: "Master compliance training modules",
      icon: "✅",
      earned: 5,
    },
    {
      id: "data-protector",
      name: "Data Protector",
      description: "Complete data protection course",
      icon: "🔐",
      earned: 4,
    },
    {
      id: "threat-hunter",
      name: "Threat Hunter",
      description: "Complete threat detection training",
      icon: "🔍",
      earned: 3,
    },
  ]);

  const handleStartChallenge = () => {
    toast.success("Challenge started! Complete it to earn points");
  };

  const handleViewLeaderboard = () => {
    toast.success("Leaderboard updated");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Gold":
        return "text-yellow-600";
      case "Silver":
        return "text-gray-400";
      case "Bronze":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const topChampion = champions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Champions Program</h1>
        <p className="text-muted-foreground mt-1">
          Gamified training with leaderboards, badges, and rewards
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Champions</p>
          <p className="text-3xl font-bold">{champions.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Modules Completed
          </p>
          <p className="text-3xl font-bold">
            {champions.reduce((sum, c) => sum + c.completedModules, 0)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Badges Earned</p>
          <p className="text-3xl font-bold">
            {badges.reduce((sum, b) => sum + b.earned, 0)}
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Champion
            </h2>
            <p className="text-2xl font-bold">{topChampion.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {topChampion.department}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <strong>Points:</strong> {topChampion.points.toLocaleString()}
              </p>
              <p>
                <strong>Level:</strong>{" "}
                <span className={getLevelColor(topChampion.level)}>
                  {topChampion.level}
                </span>
              </p>
              <p>
                <strong>Modules Completed:</strong>{" "}
                {topChampion.completedModules}
              </p>
            </div>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Medal className="h-4 w-4" />
          Leaderboard
        </h2>

        <div className="space-y-2">
          {champions.map((champion) => (
            <div
              key={champion.id}
              className="p-3 border border-border rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                  {champion.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{champion.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {champion.department}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {champion.points.toLocaleString()} pts
                </p>
                <p className={`text-xs font-semibold ${getLevelColor(champion.level)}`}>
                  {champion.level}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full mt-4" onClick={handleViewLeaderboard}>
          View Full Leaderboard
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Available Badges
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="p-3 border border-border rounded-lg text-center"
            >
              <p className="text-3xl mb-1">{badge.icon}</p>
              <p className="font-semibold text-xs">{badge.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {badge.earned} earned
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Active Challenges
        </h2>

        <div className="space-y-3">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">Phishing Simulation</h3>
              <span className="bg-blue-500/20 text-blue-600 text-xs px-2 py-1 rounded">
                +250 pts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Identify phishing emails with 95%+ accuracy
            </p>
            <Button size="sm" onClick={handleStartChallenge}>
              Start Challenge
            </Button>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">Secure Code Review</h3>
              <span className="bg-green-500/20 text-green-600 text-xs px-2 py-1 rounded">
                +300 pts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Review code snippets and identify security vulnerabilities
            </p>
            <Button size="sm" onClick={handleStartChallenge}>
              Start Challenge
            </Button>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">Incident Response</h3>
              <span className="bg-red-500/20 text-red-600 text-xs px-2 py-1 rounded">
                +400 pts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Respond to a simulated security incident
            </p>
            <Button size="sm" onClick={handleStartChallenge}>
              Start Challenge
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Competitions
        </h2>

        <div className="space-y-3">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Engineering vs Security</p>
              <span className="text-xs font-semibold">Engineering +240</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "55%" }} />
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Q1 2026 Challenge</p>
              <span className="text-xs font-semibold">Operations +180</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "42%" }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
