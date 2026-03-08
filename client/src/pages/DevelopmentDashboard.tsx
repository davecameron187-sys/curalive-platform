import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Code2, 
  Zap, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  GitBranch,
  Cpu,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  LogIn,
  User,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function DevelopmentDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPlatformTest, setSelectedPlatformTest] = useState("audio-bridge");
  const [trainingModeEnabled, setTrainingModeEnabled] = useState(false);
  const [showOperatorAnalytics, setShowOperatorAnalytics] = useState(false);

  // Development Metrics
  const metrics = [
    { label: "Features Deployed", value: "16", change: "+3 this week", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Tests Passing", value: "287/290", change: "99.0%", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "API Uptime", value: "99.98%", change: "Last 30d", icon: Cpu, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Active Users", value: "24", change: "+8 today", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  // Feature Status Data
  const featureStatus = {
    completed: 16,
    inProgress: 1,
    planned: 8,
    total: 25,
  };

  // Recent Activity
  const recentActivity = [
    { id: 1, type: "deployment", title: "Event Brief Generator UI deployed", time: "2 hours ago", status: "success" },
    { id: 2, type: "test", title: "Transcript Editor tests passing (70/70)", time: "4 hours ago", status: "success" },
    { id: 3, type: "toggle", title: "Redaction Workflow feature enabled for beta users", time: "1 day ago", status: "info" },
    { id: 4, type: "alert", title: "3 TypeScript errors in AblyRealtimeService", time: "1 day ago", status: "warning" },
    { id: 5, type: "deployment", title: "AI Features Status page updated", time: "2 days ago", status: "success" },
  ];

  // Team Stats
  const teamStats = [
    { label: "Operators Trained", value: "12", target: "20" },
    { label: "Certification Pass Rate", value: "92%", target: "95%" },
    { label: "Feature Adoption", value: "78%", target: "85%" },
    { label: "API Calls/Day", value: "45.2K", target: "50K" },
  ];

  // Quick Actions
  const quickActions = [
    { label: "Create Event", icon: Zap, path: "/event/q4-earnings-2026", color: "bg-primary" },
    { label: "View API Docs", icon: Code2, path: "/partner-api", color: "bg-blue-600" },
    { label: "Feature Status", icon: BarChart3, path: "/ai-features-status", color: "bg-emerald-600" },
    { label: "Training Hub", icon: BookOpen, path: "/training", color: "bg-violet-600" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} border-r border-border bg-card/50 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <span className="text-lg font-bold">Cura<span className="text-primary">Live</span></span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-secondary rounded">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {[
            { icon: BarChart3, label: "Dashboard", path: "/" },
            { icon: Zap, label: "Features", path: "/ai-features-status" },
            { icon: Code2, label: "Dev Tools", path: "/partner-api" },
            { icon: BookOpen, label: "Training", path: "/training" },
            { icon: Settings, label: "Admin", path: "/admin/users" },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
              title={label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border space-y-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                {sidebarOpen && <span className="truncate">{user?.name?.split(' ')[0]}</span>}
              </button>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                {sidebarOpen && <span>Sign Out</span>}
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-primary"
            >
              <LogIn className="w-4 h-4" />
              {sidebarOpen && <span>Login</span>}
            </a>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Development Dashboard</h1>
            <p className="text-sm text-muted-foreground">CuraLive Platform Status & Management</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block"></span>
              All Systems Operational
            </Badge>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Metrics Grid */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Development Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map(({ label, value, change, icon: Icon, color, bg }) => (
                <Card key={label} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xs text-emerald-400 mt-2">{change}</div>
                </Card>
              ))}
            </div>
          </section>

          {/* Feature Status & Quick Actions */}
          <section className="grid lg:grid-cols-3 gap-6">
            {/* Feature Status */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-semibold mb-4">Feature Status Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold">{featureStatus.completed} Completed</div>
                    <div className="text-xs text-muted-foreground">{Math.round((featureStatus.completed / featureStatus.total) * 100)}% of total</div>
                  </div>
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${(featureStatus.completed / featureStatus.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{featureStatus.completed}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{featureStatus.inProgress}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">{featureStatus.planned}</div>
                    <div className="text-xs text-muted-foreground">Planned</div>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate("/ai-features-status")}
                  variant="outline" 
                  className="w-full mt-4"
                >
                  View Detailed Status
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map(({ label, icon: Icon, path, color }) => (
                  <Button
                    key={label}
                    onClick={() => navigate(path)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </Card>
          </section>

          {/* Recent Activity & Team Stats */}
          <section className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map(({ id, type, title, time, status }) => (
                  <div key={id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      status === 'success' ? 'bg-emerald-500/10' :
                      status === 'warning' ? 'bg-amber-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                       status === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                       <Clock className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">{time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Team Stats */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Team Stats</h2>
              <div className="space-y-4">
                {teamStats.map(({ label, value, target }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">{value}</div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(parseInt(value) / parseInt(target)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Target: {target}</div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Tabs Section */}
          <section>
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="deployments">Deployments</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
                <TabsTrigger value="platform-testing">Platform Testing</TabsTrigger>
                <TabsTrigger value="operator-console">Operator Console</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">AI Features (16 Completed)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Live Transcription",
                      "Sentiment Analysis",
                      "Q&A Auto-Triage",
                      "Toxicity Filter",
                      "Speaking-Pace Coach",
                      "Event Brief Generator",
                      "Transcript Editing",
                      "Redaction Workflow",
                      "Compliance Dashboard",
                      "Real-Time Collaboration",
                      "Live Rolling Summary",
                      "Audience Sentiment Feed",
                      "Press Release Draft",
                      "Follow-Up Email Draft",
                      "Silence Detector",
                      "Content Analytics",
                    ].map((feature) => (
                      <Badge key={feature} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 justify-center py-2">
                        ✓ {feature}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="deployments" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Recent Deployments</h3>
                  <div className="space-y-3">
                    {[
                      { version: "v2.4.0", date: "Mar 8, 2026", changes: "Event Brief Generator UI, Redaction Workflow, Compliance Dashboard" },
                      { version: "v2.3.5", date: "Mar 5, 2026", changes: "Transcript Editor, Real-Time Collaboration, Ably Integration" },
                      { version: "v2.3.0", date: "Feb 28, 2026", changes: "Q&A Auto-Triage, Toxicity Filter, Speaking-Pace Coach" },
                    ].map(({ version, date, changes }) => (
                      <div key={version} className="pb-3 border-b border-border last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold">{version}</div>
                          <div className="text-xs text-muted-foreground">{date}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{changes}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="docs" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Documentation</h3>
                  <div className="space-y-2">
                    {[
                      { title: "Operator Training Guide", path: "/training" },
                      { title: "API Reference", path: "/partner-api" },
                      { title: "Integration Hub", path: "/integrations" },
                      { title: "Tech Handover", path: "/tech-handover" },
                    ].map(({ title, path }) => (
                      <Button
                        key={title}
                        onClick={() => navigate(path)}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {title}
                      </Button>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="platform-testing" className="mt-4">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Platform Testing</h3>
                  <div className="space-y-4">
                    {/* Platform Test Selector */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "audio-bridge", label: "Audio Bridge" },
                        { id: "video", label: "Video" },
                        { id: "roadshow", label: "Roadshow" },
                        { id: "video-webcast", label: "Video Webcast" },
                        { id: "audio-webcast", label: "Audio Webcast" },
                      ].map(({ id, label }) => (
                        <Button
                          key={id}
                          onClick={() => setSelectedPlatformTest(id)}
                          variant={selectedPlatformTest === id ? "default" : "outline"}
                          className="text-sm"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    {/* Test Content */}
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-border">
                      {selectedPlatformTest === "audio-bridge" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Audio Bridge Testing</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>• Test PSTN dial-in functionality across regions</p>
                            <p>• Verify audio quality and latency metrics</p>
                            <p>• Check transcription accuracy for various accents</p>
                            <p>• Test conference bridge capacity limits</p>
                            <p>• Validate call recording and playback</p>
                          </div>
                          <Button className="mt-4" size="sm">Start Audio Bridge Test</Button>
                        </div>
                      )}
                      {selectedPlatformTest === "video" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Video Platform Testing</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>• Test video stream ingestion and encoding</p>
                            <p>• Verify multi-bitrate adaptive streaming</p>
                            <p>• Check video quality at various bandwidth levels</p>
                            <p>• Test camera switching and presenter detection</p>
                            <p>• Validate video recording and replay functionality</p>
                          </div>
                          <Button className="mt-4" size="sm">Start Video Test</Button>
                        </div>
                      )}
                      {selectedPlatformTest === "roadshow" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Roadshow Testing</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>• Test multi-location simultaneous broadcasts</p>
                            <p>• Verify synchronization across venues</p>
                            <p>• Check local and remote Q&A integration</p>
                            <p>• Test audience polling and engagement features</p>
                            <p>• Validate post-event analytics collection</p>
                          </div>
                          <Button className="mt-4" size="sm">Start Roadshow Test</Button>
                        </div>
                      )}
                      {selectedPlatformTest === "video-webcast" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Video Webcast Testing</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>• Test live video broadcast to large audiences</p>
                            <p>• Verify CDN distribution and edge caching</p>
                            <p>• Check viewer engagement metrics (watch time, drop-off)</p>
                            <p>• Test interactive features (chat, polls, Q&A)</p>
                            <p>• Validate VOD (video-on-demand) generation and playback</p>
                          </div>
                          <Button className="mt-4" size="sm">Start Video Webcast Test</Button>
                        </div>
                      )}
                      {selectedPlatformTest === "audio-webcast" && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Audio Webcast Testing</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>• Test audio-only broadcast infrastructure</p>
                            <p>• Verify codec compatibility and bitrate optimization</p>
                            <p>• Check listener connection and reconnection handling</p>
                            <p>• Test real-time transcription accuracy</p>
                            <p>• Validate podcast/archive generation and distribution</p>
                          </div>
                          <Button className="mt-4" size="sm">Start Audio Webcast Test</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="operator-console" className="mt-4">
                <div className="space-y-4">
                  {/* Real-time Operator Status */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Real-Time Operator Status</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">Live</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Active Operators</div>
                        <div className="text-2xl font-bold">3</div>
                        <div className="text-xs text-green-500 mt-1">+1 this hour</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Active Calls</div>
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-xs text-muted-foreground mt-1">Avg 4 min</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground mb-1">System Health</div>
                        <div className="text-2xl font-bold">99.8%</div>
                        <div className="text-xs text-green-500 mt-1">Optimal</div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Avg Response Time</div>
                        <div className="text-2xl font-bold">1.2s</div>
                        <div className="text-xs text-green-500 mt-1">Within SLA</div>
                      </div>
                    </div>
                  </Card>

                  {/* Training Mode & Controls */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Operator Console Controls</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                          <div>
                            <div className="font-medium text-sm">Training Mode</div>
                            <div className="text-xs text-muted-foreground">Practice environment for operators</div>
                          </div>
                          <button 
                            onClick={() => setTrainingModeEnabled(!trainingModeEnabled)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              trainingModeEnabled 
                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}
                          >
                            {trainingModeEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                          <div>
                            <div className="font-medium text-sm">Operator Performance</div>
                            <div className="text-xs text-muted-foreground">View analytics dashboard</div>
                          </div>
                          <button onClick={() => navigate('/operator/analytics')} className="px-3 py-1 text-xs rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                            View
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => window.open('https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/occ', '_blank')}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Open Operator Console
                        </Button>
                        <Button 
                          onClick={() => navigate('/operator/q4-earnings-2026')}
                          variant="outline"
                          className="w-full"
                        >
                          Open in Manus
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Console Features */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Console Features</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="space-y-2">
                        <p><strong>Conference Management:</strong> Control active calls, manage participants, record sessions</p>
                        <p><strong>Participant Control:</strong> Mute/unmute, park, disconnect, transfer participants</p>
                        <p><strong>Q&A Management:</strong> Monitor and manage participant questions in real-time</p>
                      </div>
                      <div className="space-y-2">
                        <p><strong>Audio Monitoring:</strong> Track bandwidth, latency, jitter, and packet loss metrics</p>
                        <p><strong>Multi-Dial:</strong> Dial multiple participants simultaneously into the conference</p>
                        <p><strong>Green Room:</strong> Pre-event speaker preparation and coordination space</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}
