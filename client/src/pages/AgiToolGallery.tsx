/**
 * AGI Tool Gallery
 * GROK2 Phase 4 — Display and manage autonomously generated Q&A tools
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ToolStats {
  totalTools: number;
  byStatus: Record<string, number>;
  byDomain: Record<string, number>;
  averageReadiness: number;
  averageAccuracy: number;
}

export default function AgiToolGallery() {
  const [sessionId, setSessionId] = useState<string>("");
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const { data: toolStats } = trpc.agiToolGenerator.getToolStats.useQuery();
  const { data: productionTools } = trpc.agiToolGenerator.getProductionTools.useQuery();
  const { data: toolsByDomain } = trpc.agiToolGenerator.getToolsByDomain.useQuery(
    { domain: selectedDomain || "" },
    { enabled: !!selectedDomain }
  );

  // Mutations
  const generateToolsMutation = trpc.agiToolGenerator.generateToolsForSession.useMutation();

  useEffect(() => {
    if (toolStats) {
      setStats(toolStats);
    }
  }, [toolStats]);

  const handleGenerateTools = async () => {
    if (!sessionId) {
      alert("Please enter a session ID");
      return;
    }

    setIsGenerating(true);
    try {
      await generateToolsMutation.mutateAsync({ sessionId });
      setSessionId("");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Failed to generate tools:", error);
      alert("Failed to generate tools");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "production":
        return "bg-green-100 text-green-800";
      case "staging":
        return "bg-blue-100 text-blue-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "deprecated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "production":
        return <CheckCircle className="w-4 h-4" />;
      case "staging":
        return <TrendingUp className="w-4 h-4" />;
      case "testing":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AGI Tool Gallery</h1>
          <p className="text-muted-foreground">
            Autonomously generated Q&A tools for specialized communication domains
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tools</p>
                  <p className="text-2xl font-bold">{stats.totalTools}</p>
                </div>
                <Zap className="w-8 h-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Production</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.production || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Readiness</p>
                  <p className="text-2xl font-bold">
                    {(stats.averageReadiness * 100).toFixed(0)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                  <p className="text-2xl font-bold">
                    {(stats.averageAccuracy * 100).toFixed(0)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">
                  {Object.keys(stats.byDomain).length}
                </p>
              </div>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Generate New Tools</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="e.g., session-123456"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <Button
                  onClick={handleGenerateTools}
                  disabled={isGenerating || !sessionId}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Tools
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  The AGI Tool Generator will analyze Q&A patterns from the session
                  and autonomously create specialized tools for emerging domains.
                </p>
              </div>
            </Card>
          </div>

          {/* Tools Display */}
          <div className="lg:col-span-2">
            {/* Domain Filter */}
            {stats && Object.keys(stats.byDomain).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Filter by Domain</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedDomain === null ? "default" : "outline"}
                    onClick={() => setSelectedDomain(null)}
                    size="sm"
                  >
                    All Domains
                  </Button>
                  {Object.entries(stats.byDomain).map(([domain, count]) => (
                    <Button
                      key={domain}
                      variant={selectedDomain === domain ? "default" : "outline"}
                      onClick={() => setSelectedDomain(domain)}
                      size="sm"
                    >
                      {domain} ({count})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Production Tools */}
            {!selectedDomain && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Production Tools</h2>
                {productionTools && productionTools.length > 0 ? (
                  <div className="space-y-4">
                    {productionTools.map((tool) => (
                      <Card key={tool.id} className="p-4 border-green-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{tool.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(tool.status)} flex gap-1`}>
                            {getStatusIcon(tool.status)}
                            {tool.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.accuracy as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Coverage</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.coverage as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Readiness</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.readinessScore as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>No production tools yet</p>
                  </Card>
                )}
              </div>
            )}

            {/* Tools by Domain */}
            {selectedDomain && toolsByDomain && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {selectedDomain} Tools
                </h2>
                {toolsByDomain.length > 0 ? (
                  <div className="space-y-4">
                    {toolsByDomain.map((tool) => (
                      <Card key={tool.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{tool.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                          <Badge className={getStatusColor(tool.status)}>
                            {tool.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.accuracy as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Coverage</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.coverage as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Readiness</p>
                            <p className="font-semibold">
                              {(parseFloat(tool.readinessScore as any) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>No tools in this domain</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
