import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Linkedin,
  Mail,
  MapPin,
  Briefcase,
  Plus,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  company: string;
  title: string;
  interests: string[];
  linkedinUrl?: string;
  email: string;
  location: string;
  avatar?: string;
  matchScore?: number;
}

interface BreakoutRoom {
  id: string;
  name: string;
  topic: string;
  capacity: number;
  participants: string[];
  scheduledTime: string;
}

/**
 * ParticipantNetworking Component
 * 
 * Networking features including participant directory,
 * LinkedIn integration, breakout room scheduling,
 * and networking matching.
 */
export function ParticipantNetworking({ conferenceId }: { conferenceId: number }) {
  const [view, setView] = useState<"directory" | "matching" | "breakouts">(
    "directory"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      company: "Goldman Sachs",
      title: "VP, Equity Research",
      interests: ["AI", "Technology", "Healthcare"],
      linkedinUrl: "https://linkedin.com/in/sarahjohnson",
      email: "sarah.johnson@gs.com",
      location: "New York, NY",
      matchScore: 92,
    },
    {
      id: "2",
      name: "Michael Chen",
      company: "Morgan Stanley",
      title: "Senior Analyst",
      interests: ["Technology", "SaaS", "Cloud"],
      linkedinUrl: "https://linkedin.com/in/michaelchen",
      email: "m.chen@ms.com",
      location: "San Francisco, CA",
      matchScore: 85,
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      company: "JP Morgan",
      title: "Portfolio Manager",
      interests: ["Healthcare", "Biotech", "AI"],
      linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
      email: "emily.r@jpmorgan.com",
      location: "Boston, MA",
      matchScore: 78,
    },
  ]);

  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([
    {
      id: "1",
      name: "AI & Machine Learning",
      topic: "Opportunities and risks in AI adoption",
      capacity: 20,
      participants: ["1", "2"],
      scheduledTime: "2026-03-14T15:30:00",
    },
    {
      id: "2",
      name: "Healthcare Innovation",
      topic: "Digital health transformation",
      capacity: 15,
      participants: ["3"],
      scheduledTime: "2026-03-14T15:30:00",
    },
  ]);

  const allInterests = Array.from(
    new Set(participants.flatMap((p) => p.interests))
  );

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInterest =
      selectedInterest === null || p.interests.includes(selectedInterest);

    return matchesSearch && matchesInterest;
  });

  const handleConnectLinkedIn = (participant: Participant) => {
    if (participant.linkedinUrl) {
      window.open(participant.linkedinUrl, "_blank");
    }
  };

  const handleSendMessage = (participant: Participant) => {
    toast.success(`Message sent to ${participant.name}`);
  };

  const handleScheduleBreakout = () => {
    toast.success("Breakout room scheduled");
  };

  const handleJoinBreakout = (roomId: string) => {
    toast.success("Joined breakout room");
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "directory", label: "Directory" },
          { id: "matching", label: "Smart Matching" },
          { id: "breakouts", label: "Breakout Rooms" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              view === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Directory View */}
      {view === "directory" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedInterest || ""}
              onChange={(e) =>
                setSelectedInterest(e.target.value === "" ? null : e.target.value)
              }
              className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
            >
              <option value="">All Interests</option>
              {allInterests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
          </div>

          {/* Participants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParticipants.map((participant) => (
              <Card key={participant.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                      {participant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{participant.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {participant.title}
                      </p>
                    </div>
                  </div>
                  {participant.matchScore && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded font-bold">
                      {participant.matchScore}%
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{participant.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{participant.location}</span>
                  </div>
                </div>

                {/* Interests */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {participant.interests.slice(0, 2).map((interest) => (
                    <span
                      key={interest}
                      className="text-xs px-2 py-1 bg-secondary rounded"
                    >
                      {interest}
                    </span>
                  ))}
                  {participant.interests.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-secondary rounded">
                      +{participant.interests.length - 2}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {participant.linkedinUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnectLinkedIn(participant)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <Linkedin className="h-3 w-3" />
                      Connect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendMessage(participant)}
                    className="flex-1 flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Matching View */}
      {view === "matching" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recommended Connections
            </h3>

            <div className="space-y-3">
              {participants
                .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                .map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{participant.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {participant.title} at {participant.company}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {participant.matchScore}%
                      </span>
                    </div>

                    <p className="text-sm mb-3">
                      Shared interests: {participant.interests.join(", ")}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(participant)}
                      >
                        Reach Out
                      </Button>
                      {participant.linkedinUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectLinkedIn(participant)}
                        >
                          View Profile
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Breakout Rooms View */}
      {view === "breakouts" && (
        <div className="space-y-4">
          <Button onClick={handleScheduleBreakout} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule Breakout Room
          </Button>

          <div className="grid gap-4">
            {breakoutRooms.map((room) => (
              <Card key={room.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{room.name}</h4>
                    <p className="text-sm text-muted-foreground">{room.topic}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {room.participants.length}/{room.capacity}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(room.scheduledTime).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {room.participants.length} joined
                  </div>
                </div>

                <Button
                  onClick={() => handleJoinBreakout(room.id)}
                  className="w-full"
                >
                  Join Room
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
