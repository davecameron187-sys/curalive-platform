import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, Eye, EyeOff, Copy, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RedactionPreview {
  originalText: string;
  redactedText: string;
  redactionType: string;
  confidence: number;
  redactedSegments: Array<{
    original: string;
    redacted: string;
    start: number;
    end: number;
  }>;
}

export default function RedactionWorkflow() {
  const { user } = useAuth();
  const [conferenceId, setConferenceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("detect");
  const [inputText, setInputText] = useState("");
  const [redactionPreview, setRedactionPreview] = useState<RedactionPreview | null>(null);
  const [selectedRedactionType, setSelectedRedactionType] = useState<string>("financial");
  const [showRedacted, setShowRedacted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<Array<{ id: number; text: string; type: string }>>([]);

  const redactionTypes = [
    { value: "financial", label: "Financial Data", color: "bg-red-100 text-red-800" },
    { value: "personal", label: "Personal Information", color: "bg-orange-100 text-orange-800" },
    { value: "confidential", label: "Confidential Business", color: "bg-purple-100 text-purple-800" },
    { value: "legal", label: "Legal Information", color: "bg-blue-100 text-blue-800" },
    { value: "medical", label: "Medical Information", color: "bg-pink-100 text-pink-800" },
  ];

  const handleDetectSensitiveContent = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to analyze");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulated redaction preview - in production, call tRPC endpoint
      const preview: RedactionPreview = {
        originalText: inputText,
        redactedText: inputText.replace(/\$[\d,]+/g, "[FINANCIAL]").replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE]"),
        redactionType: selectedRedactionType,
        confidence: 0.95,
        redactedSegments: [
          {
            original: "$1,000,000",
            redacted: "[FINANCIAL]",
            start: 0,
            end: 11,
          },
        ],
      };
      setRedactionPreview(preview);
      toast.success("Sensitive content detected");
    } catch (error) {
      toast.error("Failed to detect sensitive content");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyRedaction = async () => {
    if (!redactionPreview) {
      toast.error("No redaction preview available");
      return;
    }

    setIsProcessing(true);
    try {
      // In production, call tRPC endpoint to create redaction edit
      toast.success("Redaction applied successfully");
      setInputText("");
      setRedactionPreview(null);
    } catch (error) {
      toast.error("Failed to apply redaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchRedact = async () => {
    if (batchItems.length === 0) {
      toast.error("No items to redact");
      return;
    }

    setIsProcessing(true);
    try {
      // In production, call tRPC endpoint for batch redaction
      toast.success(`Redacted ${batchItems.length} items`);
      setBatchItems([]);
    } catch (error) {
      toast.error("Failed to batch redact items");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportAudit = async () => {
    try {
      // In production, call tRPC endpoint to export audit trail
      const auditData = {
        conferenceId,
        generatedAt: new Date().toISOString(),
        items: [],
      };

      const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redaction-audit-${conferenceId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit trail exported");
    } catch (error) {
      toast.error("Failed to export audit trail");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Redaction Workflow</h1>
          <p className="text-muted-foreground">
            Detect, redact, and manage sensitive content with compliance tracking
          </p>
        </div>

        {/* Conference Selection */}
        <div className="mb-6 flex gap-4">
          <Input
            type="number"
            placeholder="Conference ID"
            value={conferenceId}
            onChange={(e) => setConferenceId(Number(e.target.value))}
            className="w-32"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detect">Detect</TabsTrigger>
            <TabsTrigger value="batch">Batch</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Detect Tab */}
          <TabsContent value="detect" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detect & Redact Sensitive Content</h2>

              {/* Redaction Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Redaction Type</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {redactionTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedRedactionType === type.value ? "default" : "outline"}
                      onClick={() => setSelectedRedactionType(type.value)}
                      className="text-sm"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Text to Analyze</label>
                <Textarea
                  placeholder="Paste text containing sensitive information..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-32"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {inputText.length} characters
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleDetectSensitiveContent}
                disabled={isProcessing || !inputText.trim()}
                className="w-full mb-6"
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Detect Sensitive Content
              </Button>

              {/* Preview */}
              {redactionPreview && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Found {redactionPreview.redactedSegments.length} sensitive segments with{" "}
                      {Math.round(redactionPreview.confidence * 100)}% confidence
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Original */}
                    <div>
                      <div className="text-sm font-medium mb-2">Original Text</div>
                      <div className="bg-red-50 p-4 rounded-lg text-sm max-h-48 overflow-y-auto border border-red-200">
                        {redactionPreview.originalText}
                      </div>
                    </div>

                    {/* Redacted */}
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        Redacted Text
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRedacted(!showRedacted)}
                        >
                          {showRedacted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-sm max-h-48 overflow-y-auto border border-green-200">
                        {showRedacted ? redactionPreview.redactedText : "••••••••••••••••"}
                      </div>
                    </div>
                  </div>

                  {/* Redacted Segments */}
                  <div>
                    <div className="text-sm font-medium mb-2">Redacted Segments</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {redactionPreview.redactedSegments.map((segment, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <div className="flex-1">
                            <span className="line-through text-red-600">{segment.original}</span>
                            <span className="ml-2 text-green-600">{segment.redacted}</span>
                          </div>
                          <Badge variant="outline">{selectedRedactionType}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApplyRedaction}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply Redaction
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(redactionPreview.redactedText);
                        toast.success("Copied to clipboard");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Batch Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Redaction</h2>

              <Alert className="mb-4">
                <AlertDescription>
                  Process multiple text segments at once. Add items below and select redaction types.
                </AlertDescription>
              </Alert>

              {/* Add Batch Item */}
              <div className="mb-6 p-4 border rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Text</label>
                  <Textarea
                    placeholder="Enter text to redact..."
                    className="min-h-20"
                    id="batch-text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm">
                      {redactionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      onClick={() => {
                        const textInput = document.getElementById("batch-text") as HTMLTextAreaElement;
                        const typeSelect = document.querySelector("select") as HTMLSelectElement;
                        if (textInput?.value && typeSelect?.value) {
                          setBatchItems([
                            ...batchItems,
                            {
                              id: Date.now(),
                              text: textInput.value,
                              type: typeSelect.value,
                            },
                          ]);
                          textInput.value = "";
                          toast.success("Item added to batch");
                        }
                      }}
                    >
                      Add to Batch
                    </Button>
                  </div>
                </div>
              </div>

              {/* Batch Items */}
              {batchItems.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium">Items to Redact ({batchItems.length})</h3>
                  {batchItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-muted p-3 rounded">
                      <div className="flex-1">
                        <div className="text-sm truncate">{item.text}</div>
                        <Badge variant="outline" className="mt-1">
                          {redactionTypes.find((t) => t.value === item.type)?.label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBatchItems(batchItems.filter((i) => i.id !== item.id))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    onClick={handleBatchRedact}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Process {batchItems.length} Items
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Redaction History</h2>
                <Button variant="outline" size="sm" onClick={handleExportAudit}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Audit
                </Button>
              </div>

              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    No redactions yet. Start by detecting and applying redactions above.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Compliance Dashboard</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-muted">
                  <div className="text-sm text-muted-foreground">Total Redactions</div>
                  <div className="text-3xl font-bold">0</div>
                </Card>
                <Card className="p-4 bg-muted">
                  <div className="text-sm text-muted-foreground">Approved</div>
                  <div className="text-3xl font-bold text-green-600">0</div>
                </Card>
                <Card className="p-4 bg-muted">
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                  <div className="text-3xl font-bold text-amber-600">0</div>
                </Card>
                <Card className="p-4 bg-muted">
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                  <div className="text-3xl font-bold">0%</div>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  Compliance metrics will appear here as redactions are processed and approved.
                </AlertDescription>
              </Alert>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
