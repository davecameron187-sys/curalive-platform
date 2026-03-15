// @ts-nocheck
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, MessageSquare, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  criticalOnly: boolean;
  violationTypes: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  timezone: string;
  emailAddress?: string;
  phoneNumber?: string;
  notificationDelay: number; // seconds
  batchNotifications: boolean;
  batchInterval: number; // minutes
}

const VIOLATION_TYPES = [
  { id: "forward_looking", label: "Forward-Looking Statements" },
  { id: "price_sensitive", label: "Price-Sensitive Information" },
  { id: "insider_info", label: "Insider Information" },
  { id: "abuse", label: "Abuse/Harassment" },
  { id: "policy_breach", label: "Policy Violations" },
  { id: "profanity", label: "Profanity" },
  { id: "misinformation", label: "Misinformation" },
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

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    criticalOnly: false,
    violationTypes: ["forward_looking", "price_sensitive", "insider_info"],
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    timezone: "America/New_York",
    emailAddress: "",
    phoneNumber: "",
    notificationDelay: 0,
    batchNotifications: false,
    batchInterval: 5,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch current preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        // In production, fetch from tRPC
        // const prefs = await trpc.operators.getNotificationPreferences.useQuery();
        // setPreferences(prefs);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        });
      }
    };

    fetchPreferences();
  }, []);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // In production, save via tRPC
      // await trpc.operators.updateNotificationPreferences.useMutation(preferences);

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async (channel: "email" | "sms" | "inApp") => {
    try {
      // In production, call tRPC to send test notification
      // await trpc.operators.sendTestNotification.useMutation({ channel });

      setTestResult({
        success: true,
        message: `Test ${channel} notification sent successfully`,
      });

      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to send test ${channel} notification`,
      });
    }
  };

  const handleViolationTypeToggle = (typeId: string) => {
    setPreferences((prev) => ({
      ...prev,
      violationTypes: prev.violationTypes.includes(typeId)
        ? prev.violationTypes.filter((t) => t !== typeId)
        : [...prev.violationTypes, typeId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Configure how you receive alerts and notifications for compliance violations
          </p>
        </div>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Notification Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Channels
                </CardTitle>
                <CardDescription>Choose how you want to receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <Label className="text-base font-semibold">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  {preferences.emailNotifications && (
                    <div className="ml-8 space-y-3">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@company.com"
                          value={preferences.emailAddress || ""}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              emailAddress: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestNotification("email")}
                      >
                        Send Test Email
                      </Button>
                    </div>
                  )}
                </div>

                {/* SMS Notifications */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      <div>
                        <Label className="text-base font-semibold">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          smsNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  {preferences.smsNotifications && (
                    <div className="ml-8 space-y-3">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={preferences.phoneNumber || ""}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestNotification("sms")}
                      >
                        Send Test SMS
                      </Button>
                    </div>
                  )}
                </div>

                {/* In-App Notifications */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-purple-500" />
                      <div>
                        <Label className="text-base font-semibold">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive real-time alerts in the dashboard
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.inAppNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          inAppNotifications: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Critical Only */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <Label className="text-base font-semibold">Critical Alerts Only</Label>
                        <p className="text-sm text-muted-foreground">
                          Only receive notifications for critical violations
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.criticalOnly}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          criticalOnly: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-2 ${
                      testResult.success
                        ? "bg-green-50 text-green-900 border border-green-200"
                        : "bg-red-50 text-red-900 border border-red-200"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Violation Types Tab */}
          <TabsContent value="violations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Violation Types to Monitor</CardTitle>
                <CardDescription>Select which violation types trigger notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VIOLATION_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={preferences.violationTypes.includes(type.id)}
                        onCheckedChange={() => handleViolationTypeToggle(type.id)}
                      />
                      <Label htmlFor={type.id} className="cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>Set times when you don't want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Enable Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause notifications during specified times
                    </p>
                  </div>
                  <Switch
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quietHoursEnabled: checked,
                      }))
                    }
                  />
                </div>

                {preferences.quietHoursEnabled && (
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={preferences.timezone} onValueChange={(value) =>
                        setPreferences((prev) => ({
                          ...prev,
                          timezone: value,
                        }))
                      }>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quietStart">Quiet Hours Start</Label>
                        <Input
                          id="quietStart"
                          type="time"
                          value={preferences.quietHoursStart}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              quietHoursStart: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="quietEnd">Quiet Hours End</Label>
                        <Input
                          id="quietEnd"
                          type="time"
                          value={preferences.quietHoursEnd}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              quietHoursEnd: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                      Quiet hours: {preferences.quietHoursStart} - {preferences.quietHoursEnd}{" "}
                      {preferences.timezone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Fine-tune notification behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="delay">Notification Delay (seconds)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Wait before sending notification (allows for deduplication)
                  </p>
                  <Input
                    id="delay"
                    type="number"
                    min="0"
                    max="60"
                    value={preferences.notificationDelay}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notificationDelay: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold">Batch Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Group multiple alerts into single notification
                      </p>
                    </div>
                    <Switch
                      checked={preferences.batchNotifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          batchNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  {preferences.batchNotifications && (
                    <div>
                      <Label htmlFor="batchInterval">Batch Interval (minutes)</Label>
                      <Input
                        id="batchInterval"
                        type="number"
                        min="1"
                        max="60"
                        value={preferences.batchInterval}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            batchInterval: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSavePreferences} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
