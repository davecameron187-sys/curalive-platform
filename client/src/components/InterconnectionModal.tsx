import { X, Zap, TrendingUp, ArrowRight, Link2 } from "lucide-react";
import WorkflowSteps, { WorkflowStep } from "./WorkflowSteps";

export interface ModalFeatureNode {
  id: string;
  label: string;
  description: string;
  bundle: string;
  bundleColor: string;
}

export interface ModalEdge {
  from: string;
  to: string;
  label: string;
}

interface InterconnectionModalProps {
  featureId: string;
  featureLabel: string;
  nodes: ModalFeatureNode[];
  edges: ModalEdge[];
  onClose: () => void;
}

const BUNDLE_NAMES: Record<string, string> = {
  A: "Investor Relations",
  B: "Compliance & Risk",
  C: "Operations",
  D: "Content Marketing",
  E: "Premium",
  F: "Social Amplification",
};

const ROI_MULTIPLIERS: Record<string, string> = {
  transcription: "1.8×",
  sentiment: "2.1×",
  "qa-triage": "1.6×",
  toxicity: "2.4×",
  compliance: "2.9×",
  "pace-coach": "1.5×",
  "rolling-summary": "1.9×",
  "event-brief": "1.7×",
  "press-release": "2.2×",
  "follow-ups": "2.6×",
  "social-echo": "2.3×",
  broadcaster: "3.1×",
  podcast: "2.0×",
  sustainability: "1.8×",
  recap: "2.1×",
  "lead-scoring": "2.8×",
};

export default function InterconnectionModal({
  featureId,
  featureLabel,
  nodes,
  edges,
  onClose,
}: InterconnectionModalProps) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const thisNode = nodeMap[featureId];

  const outgoing = edges.filter(e => e.from === featureId).map(e => ({ node: nodeMap[e.to], edge: e, direction: "out" as const }));
  const incoming = edges.filter(e => e.to === featureId).map(e => ({ node: nodeMap[e.from], edge: e, direction: "in" as const }));
  const allConnections = [...incoming, ...outgoing].filter(c => c.node);

  const workflowSteps: WorkflowStep[] = [
    {
      id: "activate",
      label: `Activate ${featureLabel}`,
      description: "Core feature live — start collecting data",
      status: "active",
      duration: "Day 1",
      roiNote: `Base ROI: ${ROI_MULTIPLIERS[featureId] ?? "2.0×"}`,
    },
    ...outgoing.slice(0, 3).map((c, i) => ({
      id: c.node?.id ?? `step-${i}`,
      label: `Unlock ${c.node?.label ?? "Next Feature"}`,
      description: `Data flows: ${c.edge.label}`,
      status: "locked" as const,
      duration: `Week ${i + 1}`,
      roiNote: `+${((Math.random() * 0.4 + 0.3) * 100).toFixed(0)}% uplift`,
    })),
    {
      id: "roi",
      label: "Full ROI Realised",
      description: "All connected features driving compounding returns",
      status: "locked" as const,
      duration: "Month 1",
      roiNote: `Combined: ${ROI_MULTIPLIERS[featureId] ?? "2.0×"} → 4.2×`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: thisNode?.bundleColor ?? "#6366f1" }} />
              <span className="text-xs text-slate-400">Bundle {thisNode?.bundle} · {BUNDLE_NAMES[thisNode?.bundle ?? ""] ?? ""}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{featureLabel}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{thisNode?.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-indigo-400">{allConnections.length}</div>
              <div className="text-[10px] text-slate-400">Connections</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{ROI_MULTIPLIERS[featureId] ?? "2.0×"}</div>
              <div className="text-[10px] text-slate-400">ROI Multiplier</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">4.2×</div>
              <div className="text-[10px] text-slate-400">With Network</div>
            </div>
          </div>

          {allConnections.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Feature Connections
              </h3>
              <div className="space-y-2">
                {allConnections.map(({ node, edge, direction }, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: node?.bundleColor ?? "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{node?.label}</div>
                      <div className="text-[10px] text-slate-500">{node?.description}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {direction === "in" ? (
                        <span className="text-[9px] text-slate-400 italic">feeds →</span>
                      ) : (
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                      )}
                      <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {edge.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" /> Recommended Activation Sequence
            </h3>
            <WorkflowSteps steps={workflowSteps} />
          </div>

          <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">Network Effect ROI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When {featureLabel} is activated alongside its {outgoing.length} downstream feature{outgoing.length !== 1 ? "s" : ""}, 
              the compounding data flow increases your ROI from {ROI_MULTIPLIERS[featureId] ?? "2.0×"} to an estimated 
              <span className="text-amber-400 font-semibold"> 4.2×</span> — a {" "}
              <span className="text-emerald-400 font-semibold">+{Math.round((4.2 / parseFloat(ROI_MULTIPLIERS[featureId] ?? "2.0") - 1) * 100)}% uplift</span> from interconnection alone.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 text-sm py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors">
              Activate Together
            </button>
            <button onClick={onClose} className="px-4 text-sm py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
