// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, MessageSquare, Clock, Shield, Save, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  notifyOnSeverity: ("low" | "medium" | "high" | "critical")[];
  notifyOnTypes: string[];
  quietHoursStart?: number;
  quietHoursEnd?: number;
  timezone?: string;
  dailyDigest: boolean;
  digestTime?: string;
}

const VIOLATION_TYPES = [
  { id: "abuse", label: "Abuse" },
  { id: "forward_looking", label: "Forward-Looking Statements" },
  { id: "price_sensitive", label: "Price-Sensitive Information" },
  { id: "insider_info", label: "Insider Information" },
  { id: "policy_breach", label: "Policy Breach" },
  { id: "profanity", label: "Profanity" },
  { id: "harassment", label: "Harassment" },
  { id: "misinformation", label: "Misinformation" },
];

const SEVERITY_LEVELS = [
  { id: "critical", label: "Critical", color: "text-red-600" },
  { id: "high", label: "High", color: "text-orange-600" },
  { id: "medium", label: "Medium", color: "text-yellow-600" },
  { id: "low", label: "Low", color: "text-blue-600" },
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function OperatorPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    notifyOnSeverity: ["critical", "high"],
    notifyOnTypes: [],
    timezone: "America/New_York",
    dailyDigest: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load preferences
  const { data: loadedPreferences } = trpc.aiAm.getOperatorPreferences.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (loadedPreferences) {
      setPreferences(loadedPreferences);
    }
  }, [loadedPreferences]);

  const savePreferencesMutation = trpc.aiAm.updateOperatorPreferences.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePreferencesMutation.mutateAsync({
        userId: user?.id || 0,
        preferences,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSeverity = (severity: "low" | "medium" | "high" | "critical") => {
    setPreferences((prev) => ({
      ...prev,
      notifyOnSeverity: prev.notifyOnSeverity.includes(severity)
        ? prev.notifyOnSeverity.filter((s) => s !== severity)
        : [...prev.notifyOnSeverity, severity],
    }));
  };

  const toggleViolationType = (typeId: string) => {
    setPreferences((prev) => ({
      ...prev,
      notifyOnTypes: prev.notifyOnTypes.includes(typeId)
        ? prev.notifyOnTypes.filter((t) => t !== typeId)
        : [...prev.notifyOnTypes, typeId],
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Configure how you receive compliance alerts and notifications
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Preferences saved successfully</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Channels</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="digest" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Digest</span>
            </TabsTrigger>
          </TabsList>

          {/* Notification Channels */}
          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Choose how you want to receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <Label className="text-base font-semibold">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive alerts via email
                      </p>
                    </div>
                    <Checkbox
                      checked={preferences.emailEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          emailEnabled: checked as boolean,
                        }))
                      }
                    />
                  </div>
                  {preferences.emailEnabled && (
                    <div className="ml-8 space-y-2">
                      <Label htmlFor="email" className="text-sm">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={preferences.emailAddress || ""}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            emailAddress: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* SMS */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <Label className="text-base font-semibold">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive critical alerts via SMS
                      </p>
                    </div>
                    <Checkbox
                      checked={preferences.smsEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          smsEnabled: checked as boolean,
                        }))
                      }
                    />
                  </div>
                  {preferences.smsEnabled && (
                    <div className="ml-8 space-y-2">
                      <Label htmlFor="phone" className="text-sm">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={preferences.phoneNumber || ""}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            phoneNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* In-App */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <Label className="text-base font-semibold">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive alerts in the dashboard
                      </p>
                    </div>
                    <Checkbox
                      checked={preferences.inAppEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          inAppEnabled: checked as boolean,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Severity & Type Filters */}
          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Filters</CardTitle>
                <CardDescription>Choose which violations to be notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Severity Filter */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Notify on Severity Levels
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {SEVERITY_LEVELS.map((severity) => (
                      <div key={severity.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`severity-${severity.id}`}
                          checked={preferences.notifyOnSeverity.includes(
                            severity.id as "low" | "medium" | "high" | "critical"
                          )}
                          onCheckedChange={() =>
                            toggleSeverity(severity.id as "low" | "medium" | "high" | "critical")
                          }
                        />
                        <Label
                          htmlFor={`severity-${severity.id}`}
                          className={`cursor-pointer font-medium ${severity.color}`}
                        >
                          {severity.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Violation Type Filter */}
                <div className="border-t pt-6">
                  <Label className="text-base font-semibold mb-4 block">
                    Violation Types (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Leave empty to receive all types. Select specific types to filter.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {VIOLATION_TYPES.map((type) => (
                      <div key={type.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={preferences.notifyOnTypes.includes(type.id)}
                          onCheckedChange={() => toggleViolationType(type.id)}
                        />
                        <Label htmlFor={`type-${type.id}`} className="cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiet Hours */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>
                  Pause notifications during specific times
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Critical violations will still be delivered during quiet hours
                  </p>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-base font-semibold">
                    Timezone
                  </Label>
                  <Select
                    value={preferences.timezone || "America/New_York"}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        timezone: value,
                      }))
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quiet Hours Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start" className="text-sm">
                      Start Time (24-hour)
                    </Label>
                    <Input
                      id="quiet-start"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="22"
                      value={preferences.quietHoursStart || ""}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quietHoursStart: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">e.g., 22 for 10 PM</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quiet-end" className="text-sm">
                      End Time (24-hour)
                    </Label>
                    <Input
                      id="quiet-end"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="6"
                      value={preferences.quietHoursEnd || ""}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quietHoursEnd: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">e.g., 6 for 6 AM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Digest */}
          <TabsContent value="digest" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Digest</CardTitle>
                <CardDescription>
                  Receive a summary of all violations from the previous day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="daily-digest"
                    checked={preferences.dailyDigest}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        dailyDigest: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="daily-digest" className="text-base font-semibold cursor-pointer">
                    Enable Daily Digest
                  </Label>
                </div>

                {preferences.dailyDigest && (
                  <div className="space-y-2 ml-8">
                    <Label htmlFor="digest-time" className="text-sm">
                      Delivery Time
                    </Label>
                    <Input
                      id="digest-time"
                      type="time"
                      value={preferences.digestTime || "09:00"}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          digestTime: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Digest will be sent daily at this time
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Digest Includes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Total violations detected</li>
                    <li>• Breakdown by severity</li>
                    <li>• Breakdown by violation type</li>
                    <li>• Top speakers with violations</li>
                    <li>• Trends and patterns</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || savePreferencesMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OperatorPreferences;
