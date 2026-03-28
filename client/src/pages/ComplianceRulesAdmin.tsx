/**
 * Compliance Rules Admin Page
 * Manage custom compliance rules for live events
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type RuleType = "keyword" | "pattern" | "sentiment" | "custom";
type RuleSeverity = "low" | "medium" | "high" | "critical";

interface RuleFormData {
  name: string;
  description: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  config: Record<string, any>;
  actions: Record<string, any>;
  jurisdiction?: string;
}

export default function ComplianceRulesAdmin() {
  const { toast } = useToast();
  const [eventId, setEventId] = useState<string>("");
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    ruleType: "keyword",
    severity: "medium",
    config: {},
    actions: {},
  });

  const rulesQuery = trpc.complianceRules.getRulesForEvent.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const createRuleMutation = trpc.complianceRules.createRule.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Compliance rule created successfully",
      });
      rulesQuery.refetch();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testRuleMutation = trpc.complianceRules.testRule.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.matched ? "Rule Matched" : "Rule Did Not Match",
        description: result.matched
          ? `Matched: ${result.result.ruleMatches[0]?.matchedContent}`
          : "Test text did not trigger this rule",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      ruleType: "keyword",
      severity: "medium",
      config: {},
      actions: {},
    });
  };

  const handleCreateRule = async () => {
    if (!eventId || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    await createRuleMutation.mutateAsync({
      eventId,
      name: formData.name,
      description: formData.description,
      ruleType: formData.ruleType,
      severity: formData.severity,
      config: formData.config,
      actions: formData.actions,
      jurisdiction: formData.jurisdiction,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Rules Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage custom compliance rules for live events
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Event ID</label>
            <Input
              placeholder="e.g., q4-earnings-2026"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Create Rule</TabsTrigger>
          <TabsTrigger value="manage">Manage Rules</TabsTrigger>
          <TabsTrigger value="test">Test Rule</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                placeholder="e.g., Insider Trading Keywords"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe what this rule detects..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select
                  value={formData.ruleType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      ruleType: value as RuleType,
                      config: {},
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword Matching</SelectItem>
                    <SelectItem value="pattern">Pattern (Regex)</SelectItem>
                    <SelectItem value="sentiment">Sentiment Score</SelectItem>
                    <SelectItem value="custom">Custom Logic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      severity: value as RuleSeverity,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rule Type Specific Config */}
            {formData.ruleType === "keyword" && (
              <div>
                <label className="text-sm font-medium">Keywords (comma-separated)</label>
                <Textarea
                  placeholder="insider, confidential, material information"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        keywords: e.target.value.split(",").map((k) => k.trim()),
                      },
                    })
                  }
                />
              </div>
            )}

            {formData.ruleType === "pattern" && (
              <div>
                <label className="text-sm font-medium">Regex Pattern</label>
                <Input
                  placeholder="e.g., \\b(insider|confidential)\\b"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, pattern: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {formData.ruleType === "sentiment" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Sentiment</label>
                  <Input
                    type="number"
                    min="-1"
                    max="1"
                    step="0.1"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          minSentiment: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Sentiment</label>
                  <Input
                    type="number"
                    min="-1"
                    max="1"
                    step="0.1"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          maxSentiment: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        autoHold: e.target.checked,
                      },
                    })
                  }
                />
                <span className="text-sm">Auto-Hold</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        autoReject: e.target.checked,
                      },
                    })
                  }
                />
                <span className="text-sm">Auto-Reject</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        flagForReview: e.target.checked,
                      },
                    })
                  }
                />
                <span className="text-sm">Flag for Review</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        notifyModerator: e.target.checked,
                      },
                    })
                  }
                />
                <span className="text-sm">Notify Moderator</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateRule}
                disabled={createRuleMutation.isPending}
              >
                {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {rulesQuery.isLoading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : rulesQuery.data?.rules && rulesQuery.data.rules.length > 0 ? (
            <div className="space-y-2">
              {rulesQuery.data.rules.map((rule: any) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {rule.ruleType}
                        </span>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {rule.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No rules created yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Test Text</label>
              <Textarea
                placeholder="Enter sample question text to test..."
              />
            </div>
            <Button onClick={() => testRuleMutation.mutate({} as any)}>
              Test Rule
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
