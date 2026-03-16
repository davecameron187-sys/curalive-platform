/**
 * Template Preview & Testing Component
 * Live rendering with sample data and webhook testing
 */
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Copy, Play, RefreshCw } from "lucide-react";

interface TemplateVariable {
  name: string;
  value: string;
  type: "string" | "number" | "boolean";
}

interface TemplatePreviewProps {
  templateId: string;
  templateName: string;
  subject?: string;
  body: string;
  variables: string[];
  onPreviewUpdate?: (preview: RenderedTemplate) => void;
}

interface RenderedTemplate {
  subject?: string;
  body: string;
  renderedAt: Date;
  variables: TemplateVariable[];
}

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  responseBody?: string;
}

export const TemplatePreviewTester: React.FC<TemplatePreviewProps> = ({
  templateId,
  templateName,
  subject,
  body,
  variables: initialVariables,
  onPreviewUpdate,
}) => {
  const [variables, setVariables] = useState<TemplateVariable[]>(
    initialVariables.map((v) => ({
      name: v,
      value: getSampleValue(v),
      type: "string",
    }))
  );

  const [renderedTemplate, setRenderedTemplate] =
    useState<RenderedTemplate | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [webhookTestResult, setWebhookTestResult] =
    useState<WebhookTestResult | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Render template with current variables
  const handleRenderPreview = useCallback(() => {
    const variableMap = Object.fromEntries(
      variables.map((v) => [v.name, v.value])
    );

    let renderedSubject = subject || "";
    let renderedBody = body;

    // Replace variables in template
    variables.forEach((v) => {
      const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, "g");
      renderedSubject = renderedSubject.replace(regex, v.value);
      renderedBody = renderedBody.replace(regex, v.value);
    });

    const preview: RenderedTemplate = {
      subject: subject ? renderedSubject : undefined,
      body: renderedBody,
      renderedAt: new Date(),
      variables,
    };

    setRenderedTemplate(preview);
    onPreviewUpdate?.(preview);
  }, [variables, subject, body, onPreviewUpdate]);

  // Test webhook delivery
  const handleTestWebhook = useCallback(async () => {
    if (!webhookUrl) {
      setWebhookTestResult({
        success: false,
        responseTime: 0,
        error: "Webhook URL is required",
      });
      return;
    }

    if (!renderedTemplate) {
      setWebhookTestResult({
        success: false,
        responseTime: 0,
        error: "Please render template preview first",
      });
      return;
    }

    setIsTestingWebhook(true);
    const startTime = performance.now();

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          templateName,
          ...renderedTemplate,
        }),
      });

      const responseTime = performance.now() - startTime;
      const responseBody = await response.text();

      setWebhookTestResult({
        success: response.ok,
        statusCode: response.status,
        responseTime: Math.round(responseTime),
        responseBody,
      });
    } catch (error) {
      const responseTime = performance.now() - startTime;
      setWebhookTestResult({
        success: false,
        responseTime: Math.round(responseTime),
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  }, [webhookUrl, renderedTemplate, templateId, templateName]);

  // Update variable value
  const handleVariableChange = (name: string, value: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v))
    );
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Reset to sample values
  const handleResetVariables = () => {
    setVariables((prev) =>
      prev.map((v) => ({
        ...v,
        value: getSampleValue(v.name),
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Template Variables Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Template Variables</h3>
        <div className="space-y-3 mb-4">
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variables in this template
            </p>
          ) : (
            variables.map((variable) => (
              <div key={variable.name} className="flex gap-2">
                <label className="min-w-32 text-sm font-medium pt-2">
                  {variable.name}
                </label>
                <Input
                  value={variable.value}
                  onChange={(e) =>
                    handleVariableChange(variable.name, e.target.value)
                  }
                  placeholder={`Enter ${variable.name}`}
                  className="flex-1"
                />
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRenderPreview} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Render Preview
          </Button>
          <Button
            onClick={handleResetVariables}
            variant="outline"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>
      </Card>

      {/* Preview Section */}
      {renderedTemplate && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="space-y-4">
            {renderedTemplate.subject && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Subject
                </label>
                <div className="mt-2 p-3 bg-secondary rounded-md flex justify-between items-center">
                  <code className="text-sm break-words">
                    {renderedTemplate.subject}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleCopyToClipboard(
                        renderedTemplate.subject || "",
                        "subject"
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {copiedField === "subject" && (
                  <p className="text-xs text-green-600 mt-1">Copied!</p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Body
              </label>
              <div className="mt-2 p-3 bg-secondary rounded-md">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {renderedTemplate.body}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopyToClipboard(renderedTemplate.body, "body")
                }
                className="mt-2"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Body
              </Button>
              {copiedField === "body" && (
                <p className="text-xs text-green-600 mt-1">Copied!</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Rendered at {renderedTemplate.renderedAt.toLocaleTimeString()}
            </div>
          </div>
        </Card>
      )}

      {/* Webhook Testing Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Webhook Test</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Webhook URL</label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleTestWebhook}
            disabled={isTestingWebhook || !renderedTemplate}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isTestingWebhook ? "Testing..." : "Test Webhook"}
          </Button>

          {webhookTestResult && (
            <div
              className={`p-4 rounded-md border ${
                webhookTestResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {webhookTestResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-semibold ${
                      webhookTestResult.success
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {webhookTestResult.success
                      ? "Webhook Delivered Successfully"
                      : "Webhook Delivery Failed"}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm">
                    {webhookTestResult.statusCode && (
                      <p>
                        <span className="font-medium">Status Code:</span>{" "}
                        {webhookTestResult.statusCode}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Response Time:</span>{" "}
                      {webhookTestResult.responseTime}ms
                    </p>
                    {webhookTestResult.error && (
                      <p>
                        <span className="font-medium">Error:</span>{" "}
                        {webhookTestResult.error}
                      </p>
                    )}
                    {webhookTestResult.responseBody && (
                      <div className="mt-2">
                        <p className="font-medium">Response:</p>
                        <code className="block bg-black bg-opacity-10 p-2 rounded text-xs mt-1 overflow-auto max-h-32">
                          {webhookTestResult.responseBody}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Helper function to generate sample values for variables
function getSampleValue(variableName: string): string {
  const samples: Record<string, string> = {
    title: "High Latency Detected",
    severity: "critical",
    description: "Kiosk latency exceeded threshold of 1000ms",
    eventId: "event-2026-03-16-001",
    affectedCount: "5",
    confidence: "87",
    actionUrl: "https://app.example.com/alerts/event-001",
    timestamp: new Date().toISOString(),
    location: "Venue A - Hall 1",
    networkType: "WiFi",
    signalStrength: "-45 dBm",
    bandwidth: "45 Mbps",
  };

  return samples[variableName] || `Sample ${variableName}`;
}
