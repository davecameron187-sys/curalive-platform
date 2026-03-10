import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Zap } from "lucide-react";

interface FeatureNode {
  id: string;
  label: string;
  bundle: string;
  bundleColor: string;
  x: number;
  y: number;
  description: string;
}

interface FeatureEdge {
  from: string;
  to: string;
  label: string;
}

const BUNDLE_COLORS: Record<string, string> = {
  A: "#3b82f6",
  B: "#ef4444",
  C: "#10b981",
  D: "#f59e0b",
  E: "#8b5cf6",
  F: "#ec4899",
};

const NODES: FeatureNode[] = [
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

const EDGES: FeatureEdge[] = [
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

const NODE_W = 130;
const NODE_H = 52;
const CANVAS_W = 730;
const CANVAS_H = 470;

function getCenter(node: FeatureNode) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

const bundleLegend = [
  { bundle: "A", label: "Investor Relations" },
  { bundle: "B", label: "Compliance & Risk" },
  { bundle: "C", label: "Operations" },
  { bundle: "D", label: "Content & Marketing" },
  { bundle: "E", label: "Premium / New Features" },
  { bundle: "F", label: "Social Amplification" },
];

export default function FeatureMap() {
  const [, navigate] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

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

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          {bundleLegend.map(({ bundle, label }) => (
            <div key={bundle} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BUNDLE_COLORS[bundle] }} />
              <span className="text-slate-400">Bundle {bundle}: {label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 overflow-x-auto">
          <svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="min-w-[730px]">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#475569" />
              </marker>
            </defs>

            {EDGES.map((edge, i) => {
              const fromNode = NODES.find(n => n.id === edge.from);
              const toNode = NODES.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const from = getCenter(fromNode);
              const to = getCenter(toNode);
              const isActive = hovered === edge.from || hovered === edge.to;
              return (
                <g key={i}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isActive ? "#8b5cf6" : "#334155"}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? "none" : "4,4"}
                    markerEnd="url(#arrow)"
                    opacity={isActive ? 1 : 0.5}
                  />
                  {isActive && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 4}
                      textAnchor="middle"
                      fill="#a78bfa"
                      fontSize="9"
                      className="pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {NODES.map((node) => {
              const isActive = hovered === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill={isActive ? `${node.bundleColor}25` : "#1e293b"}
                    stroke={node.bundleColor}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={isActive ? 1 : 0.85}
                  />
                  <rect
                    width={4}
                    height={NODE_H}
                    rx={2}
                    fill={node.bundleColor}
                    opacity={0.8}
                  />
                  <text x={14} y={22} fill="#e2e8f0" fontSize="11" fontWeight={isActive ? "bold" : "normal"}>
                    {node.label}
                  </text>
                  <text x={14} y={38} fill="#64748b" fontSize="9">
                    {node.description}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 text-xs text-slate-500 text-center">
          Hover over any feature to see its connections. Dashed lines show data flow between features.
        </div>
      </div>
    </div>
  );
}
