import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  Key,
  Settings,
  LogBook,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Mock user data
  const users = [
    { id: "1", name: "Alice Johnson", email: "alice@curalive.com", role: "admin", status: "active", joinedDate: "2026-01-15" },
    { id: "2", name: "Bob Smith", email: "bob@curalive.com", role: "operator", status: "active", joinedDate: "2026-02-01" },
    { id: "3", name: "Carol Davis", email: "carol@curalive.com", role: "operator", status: "active", joinedDate: "2026-02-15" },
    { id: "4", name: "David Wilson", email: "david@curalive.com", role: "trainer", status: "inactive", joinedDate: "2026-01-20" },
    { id: "5", name: "Eve Martinez", email: "eve@curalive.com", role: "developer", status: "active", joinedDate: "2026-03-01" },
  ];

  // Mock API keys
  const apiKeys = [
    { id: "key_1", name: "Production API Key", key: "sk_live_51234567890abcdef", created: "2026-01-10", lastUsed: "2 hours ago", status: "active" },
    { id: "key_2", name: "Development API Key", key: "sk_test_9876543210fedcba", created: "2026-02-01", lastUsed: "30 minutes ago", status: "active" },
    { id: "key_3", name: "Staging API Key", key: "sk_stage_abcdef1234567890", created: "2026-02-15", lastUsed: "1 day ago", status: "active" },
  ];

  // Mock audit logs
  const auditLogs = [
    { id: "1", user: "Alice Johnson", action: "Created user: Bob Smith", timestamp: "2 hours ago", type: "user_created" },
    { id: "2", user: "Bob Smith", action: "Toggled feature: Redaction Workflow", timestamp: "1 hour ago", type: "feature_toggle" },
    { id: "3", user: "Alice Johnson", action: "Updated system settings", timestamp: "30 minutes ago", type: "settings_updated" },
    { id: "4", user: "Eve Martinez", action: "Generated API key", timestamp: "15 minutes ago", type: "api_key_created" },
    { id: "5", user: "Carol Davis", action: "Exported audit logs", timestamp: "5 minutes ago", type: "export" },
  ];

  // Mock system settings
  const systemSettings = [
    { key: "feature_flags_enabled", label: "Feature Flags", value: true, description: "Enable/disable features per environment" },
    { key: "ab_testing_enabled", label: "A/B Testing", value: true, description: "Allow A/B testing for new features" },
    { key: "analytics_enabled", label: "Analytics Tracking", value: true, description: "Track user analytics and usage" },
    { key: "email_notifications", label: "Email Notifications", value: true, description: "Send email alerts for system events" },
    { key: "audit_logging", label: "Audit Logging", value: true, description: "Log all admin actions for compliance" },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, API keys, settings, and audit logs</p>
        </div>

        {/* Admin Info Alert */}
        {user?.role === "admin" && (
          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-400">Admin Access Granted</div>
                <div className="text-sm text-blue-300">You have full access to all admin functions. Use this power responsibly.</div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            variant="outline"
                            className={u.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{u.joinedDate}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">API Keys</h3>
                <p className="text-sm text-muted-foreground">Manage API keys for integrations</p>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Generate Key
              </Button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{key.name}</div>
                      <div className="text-sm text-muted-foreground">Created {key.created}</div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {key.status}
                    </Badge>
                  </div>

                  <div className="bg-secondary rounded p-3 mb-3 flex items-center justify-between">
                    <code className="text-sm font-mono">
                      {showApiKey ? key.key : "•".repeat(key.key.length)}
                    </code>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>Last used: {key.lastUsed}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Rotate
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-4">System Settings</h3>
              <div className="space-y-3">
                {systemSettings.map((setting) => (
                  <Card key={setting.key} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{setting.label}</div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-6 rounded-full transition-colors ${setting.value ? "bg-emerald-500" : "bg-slate-500"}`}></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="p-4 bg-amber-500/10 border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-400">Danger Zone</div>
                  <div className="text-sm text-amber-300 mb-3">These actions cannot be undone. Proceed with caution.</div>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filter logs..." className="max-w-xs bg-secondary border-border" />
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">{log.user}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{log.action}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {log.type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="text-sm text-muted-foreground">
              Showing latest 5 audit log entries. <a href="#" className="text-primary hover:underline">View all</a>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
