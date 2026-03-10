import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Zap, Filter } from "lucide-react";
import InterconnectionGraph, { GraphNode, GraphEdge } from "@/components/InterconnectionGraph";
import InterconnectionModal from "@/components/InterconnectionModal";
import WorkflowSteps, { WorkflowStep } from "@/components/WorkflowSteps";

const BUNDLE_COLORS: Record<string, string> = {
  A: "#3b82f6",
  B: "#ef4444",
  C: "#10b981",
  D: "#f59e0b",
  E: "#8b5cf6",
  F: "#ec4899",
};

const BUNDLE_LEGEND = [
  { bundle: "A", label: "Investor Relations" },
  { bundle: "B", label: "Compliance & Risk" },
  { bundle: "C", label: "Operations" },
  { bundle: "D", label: "Content & Marketing" },
  { bundle: "E", label: "Premium / New" },
  { bundle: "F", label: "Social Amplification" },
];

const NODES: GraphNode[] = [
  { id: "transcription", label: "Live Transcription", bundle: "C", bundleColor: BUNDLE_COLORS.C, x: 50, y: 50, description: "Real-time speech-to-text" },
  { id: "sentiment", label: "Sentiment Analysis", bundle: "A", bundleColor: BUNDLE_COLORS.A, x: 220, y: 50, description: "Live investor mood tracking" },
  { id: "qa-triage", label: "Q&A Auto-Triage", bundle: "C", bundleColor: BUNDLE_COLORS.C, x: 50, y: 160, description: "Smart question categorisation" },
  { id: "toxicity", label: "Toxicity Filter", bundle: "B", bundleColor: BUNDLE_COLORS.B, x: 220, y: 160, description: "Content safety layer" },
  { id: "compliance", label: "Compliance Check", bundle: "B", bundleColor: BUNDLE_COLORS.B, x: 390, y: 50, description: "Regulatory risk scoring" },
  { id: "pace-coach", label: "Pace Coach", bundle: "C", bundleColor: BUNDLE_COLORS.C, x: 390, y: 160, description: "Speaking pace + filler words" },
  { id: "rolling-summary", label: "Rolling Summary", bundle: "D", bundleColor: BUNDLE_COLORS.D, x: 560, y: 50, description: "Live 60s summaries" },
  { id: "event-brief", label: "Event Brief", bundle: "A", bundleColor: BUNDLE_COLORS.A, x: 560, y: 160, description: "Pre-event AI briefing pack" },
  { id: "press-release", label: "Press Release", bundle: "D", bundleColor: BUNDLE_COLORS.D, x: 50, y: 270, description: "AI-generated SENS/RNS drafts" },
  { id: "follow-ups", label: "Investor Follow-Ups", bundle: "A", bundleColor: BUNDLE_COLORS.A, x: 220, y: 270, description: "Personalised outreach" },
  { id: "social-echo", label: "Event Echo", bundle: "F", bundleColor: BUNDLE_COLORS.F, x: 390, y: 270, description: "AI social post generation" },
  { id: "broadcaster", label: "Intelligent Broadcaster", bundle: "E", bundleColor: BUNDLE_COLORS.E, x: 560, y: 270, description: "Unified AI alert panel" },
  { id: "podcast", label: "Podcast Converter", bundle: "D", bundleColor: BUNDLE_COLORS.D, x: 50, y: 380, description: "Webcast → investor podcast" },
  { id: "sustainability", label: "Sustainability", bundle: "E", bundleColor: BUNDLE_COLORS.E, x: 220, y: 380, description: "Carbon footprint + ESG cert" },
  { id: "recap", label: "AI Video Recap", bundle: "D", bundleColor: BUNDLE_COLORS.D, x: 390, y: 380, description: "Post-event video brief" },
  { id: "lead-scoring", label: "Lead Scoring", bundle: "A", bundleColor: BUNDLE_COLORS.A, x: 560, y: 380, description: "Hot/Warm/Cold investor signals" },
];

const EDGES: GraphEdge[] = [
  { from: "transcription", to: "sentiment", label: "feeds" },
  { from: "transcription", to: "qa-triage", label: "filters" },
  { from: "transcription", to: "toxicity", label: "screens" },
  { from: "transcription", to: "rolling-summary", label: "summarises" },
  { from: "transcription", to: "podcast", label: "converts" },
  { from: "sentiment", to: "compliance", label: "flags risk" },
  { from: "sentiment", to: "broadcaster", label: "triggers alert" },
  { from: "sentiment", to: "follow-ups", label: "personalises" },
  { from: "qa-triage", to: "compliance", label: "risk check" },
  { from: "toxicity", to: "compliance", label: "escalates" },
  { from: "pace-coach", to: "broadcaster", label: "coach alert" },
  { from: "rolling-summary", to: "social-echo", label: "generates posts" },
  { from: "rolling-summary", to: "press-release", label: "drafts" },
  { from: "rolling-summary", to: "recap", label: "highlights" },
  { from: "event-brief", to: "broadcaster", label: "pre-loads" },
  { from: "press-release", to: "follow-ups", label: "distributes" },
  { from: "social-echo", to: "lead-scoring", label: "engagement" },
  { from: "follow-ups", to: "lead-scoring", label: "signals" },
  { from: "recap", to: "social-echo", label: "content" },
  { from: "sustainability", to: "broadcaster", label: "ESG insight" },
];

const RECOMMENDED_WORKFLOWS: Record<string, WorkflowStep[]> = {
  A: [
    { id: "1", label: "Event Brief", description: "Prepare AI briefing pack before event", status: "completed", duration: "T-2h" },
    { id: "2", label: "Sentiment Analysis", description: "Monitor live investor mood", status: "active", duration: "Live", roiNote: "2.1× ROI" },
    { id: "3", label: "Investor Follow-Ups", description: "Personalised post-event outreach", status: "locked", duration: "T+1h", roiNote: "2.6× ROI" },
    { id: "4", label: "Lead Scoring", description: "Hot/Warm/Cold investor signals", status: "locked", duration: "T+24h", roiNote: "2.8× ROI" },
  ],
  B: [
    { id: "1", label: "Toxicity Filter", description: "Screen all Q&A and chat content", status: "completed", duration: "Always on" },
    { id: "2", label: "Compliance Check", description: "Flag regulatory risk statements", status: "active", duration: "Live", roiNote: "2.9× ROI" },
    { id: "3", label: "Q&A Auto-Triage", description: "Route sensitive questions for review", status: "locked", duration: "Live", roiNote: "1.6× ROI" },
  ],
  C: [
    { id: "1", label: "Live Transcription", description: "Foundation for all AI features", status: "completed", duration: "Always on" },
    { id: "2", label: "Pace Coach", description: "Real-time presenter coaching", status: "active", duration: "Live" },
    { id: "3", label: "Q&A Auto-Triage", description: "Smart question routing", status: "locked", duration: "Live" },
  ],
  D: [
    { id: "1", label: "Rolling Summary", description: "Live 60s summaries from transcript", status: "completed", duration: "Live" },
    { id: "2", label: "Press Release", description: "AI-drafted SENS/RNS from summaries", status: "active", duration: "T+30min", roiNote: "2.2× ROI" },
    { id: "3", label: "Podcast Converter", description: "Full episode from event transcript", status: "locked", duration: "T+1h" },
    { id: "4", label: "AI Video Recap", description: "Top moments highlight reel", status: "locked", duration: "T+2h", roiNote: "2.1× ROI" },
  ],
};

export default function FeatureMap() {
  const [, navigate] = useLocation();
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = NODES.find(n => n.id === selectedNodeId);
  const workflow = RECOMMENDED_WORKFLOWS[selectedBundle ?? "A"];

  return (
    <div className="min-h-screen bg-[#0a0d1a] text-white">
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/ai-shop")} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">Feature Interconnection Map</h1>
          <p className="text-xs text-slate-400">See how CuraLive's AI features work together across bundles</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <button
            onClick={() => setSelectedBundle(null)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!selectedBundle ? "bg-slate-700 border-slate-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}
          >
            All Bundles
          </button>
          {BUNDLE_LEGEND.map(({ bundle, label }) => (
            <button
              key={bundle}
              onClick={() => setSelectedBundle(selectedBundle === bundle ? null : bundle)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                selectedBundle === bundle ? "text-white border-current" : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
              style={selectedBundle === bundle ? { borderColor: BUNDLE_COLORS[bundle], backgroundColor: `${BUNDLE_COLORS[bundle]}15` } : {}}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: BUNDLE_COLORS[bundle] }} />
              {bundle}: {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <InterconnectionGraph
              nodes={NODES}
              edges={EDGES}
              onNodeClick={id => setSelectedNodeId(id)}
              highlightBundle={selectedBundle}
              width={760}
              height={480}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Click any feature to see its connections and activation sequence.{" "}
          {selectedBundle && (
            <span style={{ color: BUNDLE_COLORS[selectedBundle] }}>
              Showing Bundle {selectedBundle} only.
            </span>
          )}
        </div>

        {workflow && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">
              Recommended Activation Sequence —{" "}
              <span style={{ color: BUNDLE_COLORS[selectedBundle ?? "A"] }}>
                Bundle {selectedBundle ?? "A"}: {BUNDLE_LEGEND.find(b => b.bundle === (selectedBundle ?? "A"))?.label}
              </span>
            </h3>
            <WorkflowSteps steps={workflow} orientation="horizontal" />
          </div>
        )}
      </div>

      {selectedNodeId && selectedNode && (
        <InterconnectionModal
          featureId={selectedNodeId}
          featureLabel={selectedNode.label}
          nodes={NODES}
          edges={EDGES}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
