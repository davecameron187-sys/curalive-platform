import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Search, Settings, LogOut } from "lucide-react";

/**
 * Corrected Operator Console (OCC) - Matching reference layout
 * Layout: Conference table (top-left) + Right sidebar (actions) + Participant details (bottom)
 */

interface Conference {
  idx: number;
  name: string;
  summit: string;
  active: number;
  idle: number;
  hold: number;
  info?: string;
  type: "ASSISTED" | "UNASSISTED";
}

interface Participant {
  name: string;
  phone: string;
  dnis: string;
  addlInfo?: string;
  mode: string;
  status: string;
  port: string;
  hd: boolean;
}

// Mock data
const MOCK_CONFERENCES: Conference[] = [
  {
    idx: 28,
    name: "MUSIC MOUNTAIN",
    summit: "Virgilio",
    active: 1,
    idle: 74,
    hold: 1,
    type: "ASSISTED",
  },
  {
    idx: 3177,
    name: "GER...",
    summit: "Virgilio",
    active: 0,
    idle: 0,
    hold: 0,
    type: "ASSISTED",
  },
  {
    idx: 3473,
    name: "GER 10:00 Henkel TEST",
    summit: "Virgilio",
    active: 2,
    idle: 0,
    hold: 0,
    type: "ASSISTED",
  },
  {
    idx: 1013,
    name: "GER DEMO View QA",
    summit: "Virgilio",
    active: 0,
    idle: 2,
    hold: 0,
    type: "UNASSISTED",
  },
  {
    idx: 32,
    name: "GER Switchboard",
    summit: "Virgilio",
    active: 0,
    idle: 3,
    hold: 0,
    type: "ASSISTED",
  },
];

const MOCK_PARTICIPANT: Participant = {
  name: "Irene du Plessis",
  phone: "SIP:irene_sip@sip.linphone.org",
  dnis: "WS04:PC:6772",
  addlInfo: "—",
  mode: "Hold",
  status: "Hold",
  port: "1-3-1-465",
  hd: true,
};

const QUICK_ACTIONS = [
  { key: "F3", label: "Call", color: "bg-blue-600" },
  { key: "F4", label: "Op Join", color: "bg-green-600" },
  { key: "F5", label: "Join", color: "bg-purple-600" },
  { key: "F6", label: "Hold", color: "bg-yellow-600" },
  { key: "F7", label: "TL/Mon", color: "bg-orange-600" },
  { key: "F8", label: "Disconnect", color: "bg-red-600" },
  { key: "F9", label: "Voting", color: "bg-indigo-600" },
  { key: "F10", label: "Q&A", color: "bg-pink-600" },
];

export default function OCCCorrected() {
  const { user, logout } = useAuth();
  const [selectedConference, setSelectedConference] = useState<Conference | null>(
    MOCK_CONFERENCES[0]
  );
  const [filterType, setFilterType] = useState<"ALL" | "ASSISTED" | "UNASSISTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("console");

  // Filter conferences
  const filteredConferences = MOCK_CONFERENCES.filter((conf) => {
    const matchesType =
      filterType === "ALL" || conf.type === filterType;
    const matchesSearch =
      conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.summit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleQuickAction = (action: string) => {
    console.log(`Action: ${action}`);
    // TODO: Connect to backend tRPC procedures
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Operator Console</h1>
            <span className="text-sm text-muted-foreground">
              {user?.name || "Operator"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="console">Running Calls</TabsTrigger>
            <TabsTrigger value="post-event">Post Event</TabsTrigger>
            <TabsTrigger value="simulate">Simulate Call</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="operator-settings">Operator Settings</TabsTrigger>
          </TabsList>

          {/* Running Calls Tab */}
          <TabsContent value="console" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Section: Conference Table + Participant Details */}
              <div className="lg:col-span-3 space-y-6">
                {/* Conference Overview Section */}
                <Card className="p-6">
                  <div className="space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                      <button
                        onClick={() => setFilterType("ALL")}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          filterType === "ALL"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        ALL
                      </button>
                      <button
                        onClick={() => setFilterType("ASSISTED")}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          filterType === "ASSISTED"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        ASSISTED
                      </button>
                      <button
                        onClick={() => setFilterType("UNASSISTED")}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          filterType === "UNASSISTED"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        UNASSISTED
                      </button>
                      <div className="ml-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search conferences..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Conference Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-semibold">Idx</th>
                            <th className="text-left py-3 px-4 font-semibold">
                              Conference Name
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">Summit</th>
                            <th className="text-center py-3 px-4 font-semibold">Act</th>
                            <th className="text-center py-3 px-4 font-semibold">Idle</th>
                            <th className="text-center py-3 px-4 font-semibold">Hold</th>
                            <th className="text-left py-3 px-4 font-semibold">Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredConferences.map((conf) => (
                            <tr
                              key={conf.idx}
                              onClick={() => setSelectedConference(conf)}
                              className={`border-b border-border cursor-pointer transition-colors ${
                                selectedConference?.idx === conf.idx
                                  ? "bg-primary/20"
                                  : "hover:bg-secondary/50"
                              }`}
                            >
                              <td className="py-3 px-4 font-mono">{conf.idx}</td>
                              <td className="py-3 px-4 font-medium">{conf.name}</td>
                              <td className="py-3 px-4">{conf.summit}</td>
                              <td className="py-3 px-4 text-center">{conf.active}</td>
                              <td className="py-3 px-4 text-center">{conf.idle}</td>
                              <td className="py-3 px-4 text-center">{conf.hold}</td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {conf.info || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>

                {/* Participant Details Section */}
                {selectedConference && (
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Tabs defaultValue="parties" className="w-full">
                        <TabsList>
                          <TabsTrigger value="parties">Parties</TabsTrigger>
                          <TabsTrigger value="operators">Operators</TabsTrigger>
                        </TabsList>

                        <TabsContent value="parties" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <Input
                                value={MOCK_PARTICIPANT.name}
                                readOnly
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Phone</label>
                              <Input
                                value={MOCK_PARTICIPANT.phone}
                                readOnly
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">DNIS</label>
                              <Input
                                value={MOCK_PARTICIPANT.dnis}
                                readOnly
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Input
                                value={MOCK_PARTICIPANT.status}
                                readOnly
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4">
                            <Button variant="outline" size="sm">
                              Find
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Gain
                            </Button>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                            <Button variant="outline" size="sm">
                              Play
                            </Button>
                            <Button variant="outline" size="sm">
                              Record
                            </Button>
                            <Button variant="outline" size="sm">
                              Remove
                            </Button>
                            <Button variant="outline" size="sm">
                              Dir
                            </Button>
                            <Button variant="outline" size="sm">
                              Xfer
                            </Button>
                            <Button variant="outline" size="sm">
                              Transcribe
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="operators" className="mt-4">
                          <p className="text-muted-foreground">No operators assigned</p>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Section: Quick Action Buttons */}
              <div className="lg:col-span-1">
                <Card className="p-4 sticky top-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.key}
                        onClick={() => handleQuickAction(action.label)}
                        className={`w-full py-3 px-4 rounded font-medium text-white transition-all hover:opacity-90 active:scale-95 ${action.color}`}
                      >
                        <div className="text-xs opacity-75">{action.key}</div>
                        <div className="text-sm">{action.label}</div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Post Event Tab */}
          <TabsContent value="post-event" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Post Event</h2>
              <p className="text-muted-foreground">Post event features coming soon...</p>
            </Card>
          </TabsContent>

          {/* Simulate Call Tab */}
          <TabsContent value="simulate" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Simulate Call</h2>
              <p className="text-muted-foreground">Call simulation features coming soon...</p>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <p className="text-muted-foreground">System settings coming soon...</p>
            </Card>
          </TabsContent>

          {/* Operator Settings Tab */}
          <TabsContent value="operator-settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Operator Settings</h2>
              <p className="text-muted-foreground">Personal preferences coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
