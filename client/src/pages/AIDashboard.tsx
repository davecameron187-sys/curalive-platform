/**
 * AI Dashboard — Shadow Mode
 * 
 * Select and run AI services on archived sessions
 * Monitor service execution and download results
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
  Settings,
  Zap,
  FileText,
  Mic,
  Video,
} from "lucide-react";

interface AIService {
  id: "whisper" | "recall";
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "completed" | "failed";
  output?: {
    type: "transcript" | "recording" | "analysis";
    url: string;
    size?: number;
  };
}

export default function AIDashboard({ params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  const [, navigate] = useLocation();
  const onBack = () => navigate("/shadow-mode");
  const [selectedServices, setSelectedServices] = useState<("whisper" | "recall")[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch service status
  const { data: serviceStatus } = trpc.archive.getServiceStatus.useQuery({ sessionId });

  // Run AI services mutation
  const runServices = trpc.archive.runAiServices.useMutation({
    onSuccess: () => {
      setIsRunning(false);
      setSelectedServices([]);
    },
  });

  const services: AIService[] = [
    {
      id: "whisper",
      name: "Whisper Transcription",
      description: "Convert audio to text with high accuracy",
      icon: <Mic className="w-6 h-6" />,
      status: (serviceStatus?.whisperStatus as "pending" | "processing" | "completed" | "failed") || "pending",
    },
    {
      id: "recall",
      name: "Recall Recording",
      description: "Access the full session recording from Recall.ai",
      icon: <Video className="w-6 h-6" />,
      status: (serviceStatus?.recallStatus as "pending" | "processing" | "completed" | "failed") || "pending",
    },
  ];

  const handleServiceToggle = (serviceId: "whisper" | "recall") => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    );
  };

  const handleRunServices = async () => {
    if (selectedServices.length === 0) return;

    setIsRunning(true);
    await runServices.mutateAsync({
      sessionId,
      services: selectedServices,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-600">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-600">Failed</Badge>;
      default:
        return <Badge className="bg-gray-600">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6" key={sessionId}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Archive
          </Button>
          <h1 className="text-3xl font-bold mb-2">AI Services Dashboard</h1>
          <p className="text-muted-foreground">
            Run AI services on archived session: <code className="bg-muted px-2 py-1 rounded">{sessionId}</code>
          </p>
        </div>

        {/* Service Selection Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`p-6 cursor-pointer transition-all ${
                selectedServices.includes(service.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">{service.icon}</div>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="w-5 h-5 rounded border-border"
                />
              </div>

              {/* Service Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="text-sm">{service.status}</span>
                </div>
                {getStatusBadge(service.status)}
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleRunServices}
            disabled={selectedServices.length === 0 || isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Services...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Selected Services
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
        </div>

        {/* Service Results */}
        {services.some((s) => s.status === "completed") && (
          <Card className="p-6 bg-card/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Available Outputs
            </h2>
            <div className="space-y-3">
              {services
                .filter((s) => s.status === "completed" && s.output)
                .map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium">{service.name} Output</p>
                      <p className="text-sm text-muted-foreground">
                        {service.output?.type} • {service.output?.size ? `${(service.output.size / 1024 / 1024).toFixed(2)} MB` : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (service.output?.url) {
                          window.open(service.output.url, "_blank");
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Status Messages */}
        {runServices.isError && (
          <Card className="p-4 bg-red-50 border-red-200 mb-4">
            <p className="text-red-800 text-sm">
              Error running services: {runServices.error?.message || "Unknown error"}
            </p>
          </Card>
        )}

        {runServices.isSuccess && (
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-green-800 text-sm">
              Services queued successfully. Check back in a few moments for results.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
