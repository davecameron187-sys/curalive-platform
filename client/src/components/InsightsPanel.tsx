import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Brain,
  Target,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Insight {
  type: "takeaway" | "risk" | "guidance_change" | "sentiment_alert";
  title: string;
  description: string;
  confidence: number;
  timestamp: number;
  relatedKeywords?: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

/**
 * InsightsPanel Component
 * 
 * AI-powered analysis of event transcripts and sentiment data.
 * Extracts key takeaways, identifies risks, tracks guidance changes,
 * and generates executive summaries.
 */
export function InsightsPanel({ conferenceId }: { conferenceId: number }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Mock AI analysis - in production, this would call your LLM endpoint
  const generateInsights = async () => {
    setIsLoading(true);

    try {
      // Simulate LLM processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockInsights: Insight[] = [
        {
          type: "takeaway",
          title: "Strong Revenue Growth Guidance",
          description:
            "Company provided optimistic revenue guidance for Q2, projecting 15-18% YoY growth, driven by enterprise segment expansion and international market penetration.",
          confidence: 0.95,
          timestamp: Date.now(),
          relatedKeywords: ["revenue", "guidance", "growth", "enterprise"],
          sentiment: "positive",
        },
        {
          type: "risk",
          title: "Supply Chain Headwinds",
          description:
            "Management acknowledged ongoing supply chain challenges that could impact gross margins in the near term, though they expect normalization by Q3.",
          confidence: 0.88,
          timestamp: Date.now(),
          relatedKeywords: ["supply chain", "margins", "risk", "headwinds"],
          sentiment: "negative",
        },
        {
          type: "guidance_change",
          title: "Increased R&D Investment",
          description:
            "Company announced increased R&D spending of $50M for AI/ML initiatives, representing a 20% increase from prior guidance.",
          confidence: 0.92,
          timestamp: Date.now(),
          relatedKeywords: ["R&D", "AI", "investment", "guidance change"],
          sentiment: "positive",
        },
        {
          type: "sentiment_alert",
          title: "Cautious Tone on Macro Environment",
          description:
            "Management expressed caution regarding macroeconomic headwinds, particularly in European markets, despite strong US performance.",
          confidence: 0.85,
          timestamp: Date.now(),
          relatedKeywords: ["macro", "Europe", "caution", "risk"],
          sentiment: "neutral",
        },
      ];

      setInsights(mockInsights);

      const mockSummary = `## Executive Summary

**Event:** Q1 2026 Earnings Call
**Duration:** 45 minutes
**Participants:** 2,847

### Key Highlights

1. **Revenue Performance**: Company exceeded Q1 guidance by 12%, with strong performance across all segments.

2. **Strategic Initiatives**: Announced $50M investment in AI/ML R&D, representing a strategic shift toward automation and intelligence.

3. **Guidance**: Provided optimistic Q2 guidance (15-18% YoY growth), though cautious on macro environment.

### Risk Factors

- Supply chain challenges may impact Q2 margins
- European market softness could pressure growth
- Competitive pressure in core segments

### Sentiment Analysis

- **Overall Tone**: Optimistic (78% positive)
- **Key Concerns**: Supply chain, macro headwinds
- **Growth Drivers**: Enterprise expansion, international markets

### Compliance Notes

- All disclosures compliant with Reg FD
- No material non-public information disclosed
- Fair disclosure maintained throughout event`;

      setSummary(mockSummary);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "takeaway":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "risk":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "guidance_change":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "sentiment_alert":
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "takeaway":
        return "border-yellow-500/20 bg-yellow-500/5";
      case "risk":
        return "border-red-500/20 bg-red-500/5";
      case "guidance_change":
        return "border-blue-500/20 bg-blue-500/5";
      case "sentiment_alert":
        return "border-purple-500/20 bg-purple-500/5";
      default:
        return "border-border bg-background";
    }
  };

  const filteredInsights = selectedType
    ? insights.filter((i) => i.type === selectedType)
    : insights;

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex gap-2">
        <Button
          onClick={generateInsights}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {isLoading ? "Analyzing..." : "Generate AI Insights"}
        </Button>
      </div>

      {/* Insights Summary */}
      {summary && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Executive Summary</h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{summary}</Streamdown>
          </div>
        </Card>
      )}

      {/* Insight Type Filter */}
      {insights.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
          >
            All ({insights.length})
          </Button>
          {[
            { type: "takeaway", label: "Takeaways" },
            { type: "risk", label: "Risks" },
            { type: "guidance_change", label: "Guidance Changes" },
            { type: "sentiment_alert", label: "Sentiment" },
          ].map(({ type, label }) => {
            const count = insights.filter((i) => i.type === type).length;
            return (
              <Button
                key={type}
                size="sm"
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => setSelectedType(type)}
              >
                {label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Insights List */}
      {filteredInsights.length > 0 && (
        <div className="space-y-3">
          {filteredInsights.map((insight, idx) => (
            <Card key={idx} className={`p-4 border-l-4 ${getInsightColor(insight.type)}`}>
              <div className="flex items-start gap-3 mb-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </p>
                </div>
                {insight.sentiment && (
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      insight.sentiment === "positive"
                        ? "bg-green-500/20 text-green-600"
                        : insight.sentiment === "negative"
                          ? "bg-red-500/20 text-red-600"
                          : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {insight.sentiment}
                  </span>
                )}
              </div>

              <p className="text-sm text-foreground mb-3">{insight.description}</p>

              {insight.relatedKeywords && insight.relatedKeywords.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {insight.relatedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-1 bg-secondary rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            Click "Generate AI Insights" to analyze the event transcript and extract key takeaways, risks, and guidance changes.
          </p>
        </Card>
      )}
    </div>
  );
}
