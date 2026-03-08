import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Users, 
  BarChart3, 
  Plus,
  ArrowLeft,
  Zap,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function TrainingModeConsole() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("sessions");
  const [showNewSession, setShowNewSession] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access Training Mode</p>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  // Fetch training sessions
  const { data: trainingSessions, isLoading } = trpc.trainingMode.getMyTrainingSessions.useQuery();

  // Create session mutation
  const createSessionMutation = trpc.trainingMode.createSession.useMutation();

  const handleCreateSession = async () => {
    try {
      await createSessionMutation.mutateAsync({
        sessionName: "New Training Session",
        trainingScenario: "earnings-call",
      });
      setShowNewSession(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dev-tools")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dev Tools
            </Button>
            <h1 className="text-3xl font-bold">Training Mode Console</h1>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            Isolated Practice Environment
          </Badge>
        </div>

        {/* Training Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {trainingSessions?.filter(s => s.status === "active").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {trainingSessions?.filter(s => s.status === "completed").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Completed Sessions</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {trainingSessions?.reduce((sum, s) => sum + (s.callsHandled || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Practice Calls</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {trainingSessions && trainingSessions.length > 0
                ? (
                    trainingSessions.reduce((sum, s) => sum + (s.participantsSatisfaction || 0), 0) /
                    trainingSessions.length
                  ).toFixed(1)
                : "0.0"}
            </div>
            <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Training Sessions</h2>
              <Button onClick={() => setShowNewSession(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>

            {isLoading ? (
              <Card className="p-8 text-center text-muted-foreground">
                Loading sessions...
              </Card>
            ) : trainingSessions && trainingSessions.length > 0 ? (
              <div className="space-y-3">
                {trainingSessions.map((session) => (
                  <Card key={session.id} className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{session.sessionName}</h3>
                          <Badge
                            variant="outline"
                            className={
                              session.status === "active"
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : session.status === "paused"
                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                                : "bg-gray-500/10 text-gray-500 border-gray-500/30"
                            }
                          >
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario: <span className="capitalize">{session.trainingScenario}</span>
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Calls Handled</div>
                            <div className="font-semibold">{session.callsHandled || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Duration</div>
                            <div className="font-semibold">
                              {Math.floor((session.totalDuration || 0) / 60)}m
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg Call</div>
                            <div className="font-semibold">
                              {Math.floor((session.averageCallDuration || 0) / 60)}m
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Satisfaction</div>
                            <div className="font-semibold">
                              {session.participantsSatisfaction?.toFixed(1) || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          {session.status === "active" ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No training sessions yet</p>
                <Button onClick={() => setShowNewSession(true)}>
                  Create Your First Session
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Call Quality Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Call Duration</span>
                    <span className="font-medium">4m 32s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Call Quality Score</span>
                    <span className="font-medium">4.6/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Participant Satisfaction</span>
                    <span className="font-medium">4.7/5.0</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Skill Assessment</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Communication</span>
                    <span className="font-medium">4.5/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Problem Solving</span>
                    <span className="font-medium">4.6/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Professionalism</span>
                    <span className="font-medium">4.8/5.0</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Production Readiness</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                  <p className="text-3xl font-bold">4.6/5.0</p>
                </div>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30 border">
                  Ready for Production
                </Badge>
              </div>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Training Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                <Zap className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2">Quick Start Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn the basics of operating a training conference
                </p>
                <Button variant="outline" size="sm">View Guide</Button>
              </Card>

              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                <BarChart3 className="w-6 h-6 text-purple-400 mb-3" />
                <h3 className="font-semibold mb-2">Performance Benchmarks</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See how your metrics compare to other operators
                </p>
                <Button variant="outline" size="sm">View Benchmarks</Button>
              </Card>

              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                <Users className="w-6 h-6 text-emerald-400 mb-3" />
                <h3 className="font-semibold mb-2">Mentor Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with your assigned mentor for guidance
                </p>
                <Button variant="outline" size="sm">Contact Mentor</Button>
              </Card>

              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                <Clock className="w-6 h-6 text-yellow-400 mb-3" />
                <h3 className="font-semibold mb-2">Session History</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review recordings and feedback from past sessions
                </p>
                <Button variant="outline" size="sm">View History</Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
