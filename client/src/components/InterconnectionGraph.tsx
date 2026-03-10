import { useState } from "react";

export interface GraphNode {
  id: string;
  label: string;
  description: string;
  bundle: string;
  bundleColor: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface InterconnectionGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  highlightBundle?: string | null;
  width?: number;
  height?: number;
}

const NODE_W = 140;
const NODE_H = 54;
const PAD = 16;

export default function InterconnectionGraph({
  nodes,
  edges,
  onNodeClick,
  highlightBundle = null,
  width = 760,
  height = 480,
}: InterconnectionGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const connectedTo = (nodeId: string) =>
    new Set([
      ...edges.filter(e => e.from === nodeId).map(e => e.to),
      ...edges.filter(e => e.to === nodeId).map(e => e.from),
    ]);

  const getNodeOpacity = (node: GraphNode) => {
    if (highlightBundle && node.bundle !== highlightBundle) return 0.25;
    if (!hoveredNode) return 1;
    if (hoveredNode === node.id) return 1;
    if (connectedTo(hoveredNode).has(node.id)) return 1;
    return 0.3;
  };

  const getEdgeOpacity = (edge: GraphEdge) => {
    if (!hoveredNode) return 0.35;
    if (edge.from === hoveredNode || edge.to === hoveredNode) return 1;
    return 0.08;
  };

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const cx = (n: GraphNode) => n.x + NODE_W / 2 + PAD;
  const cy = (n: GraphNode) => n.y + NODE_H / 2 + PAD;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ overflow: "visible" }}
      className="rounded-xl"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map((edge, i) => {
        const src = nodeMap[edge.from];
        const dst = nodeMap[edge.to];
        if (!src || !dst) return null;
        const x1 = cx(src);
        const y1 = cy(src);
        const x2 = cx(dst);
        const y2 = cy(dst);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const opacity = getEdgeOpacity(edge);
        const isActive = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
        return (
          <g key={i} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isActive ? "#818cf8" : "#334155"}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray="5 4"
              markerEnd="url(#arrow)"
              style={{ transition: "stroke 0.2s" }}
            />
            {isActive && (
              <text x={mx} y={my - 4} textAnchor="middle" fontSize={9} fill="#a5b4fc">
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map(node => {
        const x = node.x + PAD;
        const y = node.y + PAD;
        const opacity = getNodeOpacity(node);
        const isHovered = hoveredNode === node.id;
        const isConnected = hoveredNode ? connectedTo(hoveredNode).has(node.id) : false;

        return (
          <g
            key={node.id}
            opacity={opacity}
            style={{ transition: "opacity 0.2s", cursor: "pointer" }}
            onClick={() => onNodeClick?.(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            filter={isHovered ? "url(#glow)" : undefined}
          >
            <rect
              x={x} y={y}
              width={NODE_W} height={NODE_H}
              rx={8}
              fill="#0f172a"
              stroke={isHovered ? node.bundleColor : isConnected ? `${node.bundleColor}88` : `${node.bundleColor}44`}
              strokeWidth={isHovered ? 2.5 : 1.5}
              style={{ transition: "stroke 0.2s" }}
            />
            <rect
              x={x} y={y}
              width={4} height={NODE_H}
              rx={2}
              fill={node.bundleColor}
            />
            <text x={x + 14} y={y + 20} fontSize={11} fontWeight="600" fill="#f1f5f9">
              {node.label.length > 18 ? node.label.slice(0, 17) + "…" : node.label}
            </text>
            <text x={x + 14} y={y + 35} fontSize={9} fill="#94a3b8">
              {node.description.length > 26 ? node.description.slice(0, 25) + "…" : node.description}
            </text>
            <text x={x + NODE_W - 8} y={y + 14} fontSize={8} fill={node.bundleColor} textAnchor="end" fontWeight="700">
              {node.bundle}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
