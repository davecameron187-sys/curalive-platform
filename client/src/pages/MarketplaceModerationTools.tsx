import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, XCircle, Flag, Trash2 } from "lucide-react";

export default function MarketplaceModerationTools() {
  const [selectedTab, setSelectedTab] = useState<"flagged" | "reports" | "guidelines" | "log">("flagged");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: flaggedTemplates, isLoading: isFlaggedLoading } = trpc.marketplace.getFlaggedTemplates.useQuery({
    search: searchQuery,
  });

  const { data: userReports, isLoading: isReportsLoading } = trpc.marketplace.getUserReports.useQuery({
    search: searchQuery,
  });

  const approveMutation = trpc.marketplace.approveTemplate.useMutation();
  const rejectMutation = trpc.marketplace.rejectTemplate.useMutation();
  const removeMutation = trpc.marketplace.removeTemplate.useMutation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2">Marketplace Moderation</h1>
          <p className="opacity-90">Review flagged content and manage community guidelines</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search templates or reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flagged">Flagged Templates</TabsTrigger>
            <TabsTrigger value="reports">User Reports</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            <TabsTrigger value="log">Moderation Log</TabsTrigger>
          </TabsList>

          {/* Flagged Templates Tab */}
          <TabsContent value="flagged" className="space-y-4">
            {isFlaggedLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : flaggedTemplates && flaggedTemplates.length > 0 ? (
              flaggedTemplates.map((template: any) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {template.flagCount} flags
                    </Badge>
                  </div>

                  {/* Flags Details */}
                  <div className="bg-muted p-3 rounded mb-4 text-sm">
                    <p className="font-semibold mb-2">Reasons:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {template.flagReasons?.map((reason: string, i: number) => (
                        <li key={i}>• {reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => approveMutation.mutate({ templateId: template.id })}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectMutation.mutate({ templateId: template.id, reason: "Violates guidelines" })}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMutation.mutate({ templateId: template.id, reason: "Removed by moderator" })}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">No flagged templates</p>
                <p className="text-muted-foreground">All templates are compliant</p>
              </div>
            )}
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {isReportsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : userReports && userReports.length > 0 ? (
              userReports.map((report: any) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="w-4 h-4 text-destructive" />
                        <span className="font-semibold">Report #{report.id}</span>
                        <Badge variant={report.status === "open" ? "destructive" : "secondary"}>{report.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reported by: <span className="font-medium">{report.reporterName}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Template: <span className="font-medium">{report.templateName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="bg-muted p-3 rounded mb-4 text-sm">
                    <p className="font-semibold mb-2">Reason:</p>
                    <p className="text-muted-foreground">{report.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Template
                    </Button>
                    <Button variant="destructive" size="sm">
                      Remove Template
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">No pending reports</p>
                <p className="text-muted-foreground">All reports have been addressed</p>
              </div>
            )}
          </TabsContent>

          {/* Guidelines Tab */}
          <TabsContent value="guidelines" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Community Guidelines</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Prohibited Content
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• Malicious code or security exploits</li>
                    <li>• Personally identifiable information (PII)</li>
                    <li>• Hate speech or discriminatory content</li>
                    <li>• Copyright or intellectual property violations</li>
                    <li>• Spam or misleading information</li>
                    <li>• Adult or explicit content</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Quality Standards</h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• Templates must be functional and well-documented</li>
                    <li>• Descriptions should be clear and accurate</li>
                    <li>• Category selection must be appropriate</li>
                    <li>• No duplicate or near-duplicate templates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Enforcement</h3>
                  <p className="text-muted-foreground">
                    Violations may result in template removal, account suspension, or permanent ban. Users can appeal moderation decisions within 30 days.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Moderation Log Tab */}
          <TabsContent value="log" className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Recent Moderation Actions</h2>
              <div className="space-y-3">
                {[
                  {
                    action: "Approved",
                    template: "Network Failover Alert",
                    moderator: "You",
                    time: "2 hours ago",
                  },
                  {
                    action: "Rejected",
                    template: "Spam Template",
                    moderator: "Admin",
                    time: "1 day ago",
                  },
                  {
                    action: "Removed",
                    template: "Malicious Content",
                    moderator: "System",
                    time: "3 days ago",
                  },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium">{log.template}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.action} by {log.moderator}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          log.action === "Approved"
                            ? "secondary"
                            : log.action === "Rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {log.action}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
