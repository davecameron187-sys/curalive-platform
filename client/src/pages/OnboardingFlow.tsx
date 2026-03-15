// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, ChevronRight, Lock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function OnboardingFlow() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Setup complete! Welcome to CuraLive.");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save configuration");
      setIsSubmitting(false);
    },
  });
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    eventType: "",
    operatorName: "",
    operatorEmail: "",
    recallBotId: "",
    alertChannels: {
      email: true,
      sms: false,
      inApp: true,
    },
    violationTypes: {
      abuse: true,
      forwardLooking: true,
      priceSensitive: true,
      insiderInfo: true,
      profanity: true,
      harassment: true,
      misinformation: true,
    },
    quietHours: {
      enabled: false,
      startTime: "18:00",
      endTime: "09:00",
    },
  });

  const steps: OnboardingStep[] = [
    {
      id: "company",
      title: "Company Information",
      description: "Tell us about your organization",
      completed: !!formData.companyName,
    },
    {
      id: "event",
      title: "Event Configuration",
      description: "Set up your event type and industry",
      completed: !!formData.eventType && !!formData.industry,
    },
    {
      id: "operator",
      title: "Operator Setup",
      description: "Add your first operator account",
      completed: !!formData.operatorName && !!formData.operatorEmail,
    },
    {
      id: "recall",
      title: "Recall.ai Integration",
      description: "Connect your Recall.ai bot",
      completed: !!formData.recallBotId,
    },
    {
      id: "preferences",
      title: "Alert Preferences",
      description: "Configure notification settings",
      completed: true,
    },
    {
      id: "review",
      title: "Review & Launch",
      description: "Review and activate AI-AM",
      completed: false,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., Goldman Sachs"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                <SelectTrigger id="industry" className="mt-2">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Services</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                <SelectTrigger id="eventType" className="mt-2">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earnings">Earnings Call</SelectItem>
                  <SelectItem value="investor">Investor Day</SelectItem>
                  <SelectItem value="board">Board Meeting</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> AI-AM will recommend compliance rules based on your event type and industry.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                placeholder="e.g., John Smith"
                value={formData.operatorName}
                onChange={(e) => handleInputChange("operatorName", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="operatorEmail">Operator Email</Label>
              <Input
                id="operatorEmail"
                type="email"
                placeholder="john@company.com"
                value={formData.operatorEmail}
                onChange={(e) => handleInputChange("operatorEmail", e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="recallBotId">Recall.ai Bot ID</Label>
              <Input
                id="recallBotId"
                placeholder="bot_xxxxx"
                value={formData.recallBotId}
                onChange={(e) => handleInputChange("recallBotId", e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                ⚠️ <strong>Note:</strong> You can add your Recall.ai bot ID later in Operator Preferences.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Alert Channels</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={formData.alertChannels.email}
                    onCheckedChange={(checked) => handleNestedChange("alertChannels", "email", checked)}
                  />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={formData.alertChannels.sms}
                    onCheckedChange={(checked) => handleNestedChange("alertChannels", "sms", checked)}
                  />
                  <Label htmlFor="sms" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inApp"
                    checked={formData.alertChannels.inApp}
                    onCheckedChange={(checked) => handleNestedChange("alertChannels", "inApp", checked)}
                  />
                  <Label htmlFor="inApp" className="cursor-pointer">
                    In-App Notifications
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Violation Types to Monitor</h3>
              <div className="space-y-3">
                {Object.entries(formData.violationTypes).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => handleNestedChange("violationTypes", key, checked)}
                    />
                    <Label htmlFor={key} className="cursor-pointer capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quiet Hours</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quietHours"
                    checked={formData.quietHours.enabled}
                    onCheckedChange={(checked) => handleNestedChange("quietHours", "enabled", checked)}
                  />
                  <Label htmlFor="quietHours" className="cursor-pointer">
                    Enable Quiet Hours
                  </Label>
                </div>
                {formData.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.quietHours.startTime}
                        onChange={(e) => handleNestedChange("quietHours", "startTime", e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.quietHours.endTime}
                        onChange={(e) => handleNestedChange("quietHours", "endTime", e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Ready to Launch</h3>
                  <p className="text-sm text-green-800 mt-1">
                    Your AI Automated Moderator (Alert-Only Mode) is configured and ready to go.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold">Configuration Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{formData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="font-medium capitalize">{formData.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Type:</span>
                  <span className="font-medium capitalize">{formData.eventType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Operator:</span>
                  <span className="font-medium">{formData.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Alert Channels:</span>
                  <span className="font-medium">
                    {Object.entries(formData.alertChannels)
                      .filter(([, v]) => v)
                      .map(([k]) => k)
                      .join(", ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ✅ <strong>Next Steps:</strong> Your first event will enable AI-AM automatically. Alerts will appear in
                the Operator Console during the event.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Automated Moderator Setup</h1>
          <p className="text-lg text-gray-600">Configure your compliance monitoring in 6 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <button
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                        ? "bg-blue-500 text-white ring-4 ring-blue-200"
                        : "bg-gray-300 text-gray-600"
                  } ${index <= currentStep ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  {index < currentStep ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                </button>
                <p className="text-xs text-gray-600 mt-2 text-center font-medium">{step.title}</p>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mb-8">{steps[currentStep].description}</p>
          {renderStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6"
          >
            ← Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={() => {
                setIsSubmitting(true);
                updateProfile.mutate({
                  name: formData.operatorName || user?.name || undefined,
                  organisation: formData.companyName || undefined,
                });
              }}
              disabled={isSubmitting || updateProfile.isPending}
              className="px-8 bg-green-600 hover:bg-green-700 gap-2"
            >
              {isSubmitting || updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Activate AI-AM
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!steps[currentStep].completed}
              className="px-6"
            >
              Next →
            </Button>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
          <p className="text-sm text-blue-800 mb-4">
            Our support team is available 24/7 to help you set up AI-AM. Contact us at{" "}
            <a href="mailto:support@curalive.ai" className="font-semibold underline">
              support@curalive.ai
            </a>
            {" "}or call <a href="tel:+1-XXX-XXX-XXXX" className="font-semibold underline">+1-XXX-XXX-XXXX</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
