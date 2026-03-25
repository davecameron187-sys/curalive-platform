# Interconnection Visualization UI Components — Replit Implementation Spec

**Status:** spec-ready  
**Priority:** High  
**Estimated Effort:** 30 hours (2 weeks)  
**Target Launch:** Q2 2026

---

## REPLIT SUMMARY

Build interactive React components to visualize feature interconnections using Radix UI and D3.js. Create graph visualization, workflow steps, ROI badges, and modal dialogs that help users understand feature relationships.

**What to Build:**
1. InterconnectionGraph component (D3.js force-directed graph)
2. WorkflowSteps component (timeline visualization)
3. InterconnectionModal component (detailed interconnection view)
4. ROI badges and dependency indicators
5. "See Connections" button integration

**Key Features:**
- Interactive graph with zoom/pan
- Node color-coding by dependency level
- Edge thickness by ROI multiplier
- Hover tooltips with feature details
- Click to activate interconnections
- Responsive design for mobile/tablet

**Success Criteria:**
- Graph renders in <500ms
- Smooth interactions (60fps)
- Mobile responsive
- Accessibility compliant (WCAG 2.1 AA)
- >40% click-through on "See Connections"

---

## Phase 3: UI Components (Week 1-2)

### Component 1: InterconnectionGraph

**File:** `client/src/components/InterconnectionGraph.tsx`

```typescript
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';

interface Node {
  id: string;
  name: string;
  type: 'feature';
  dependencyLevel: 'required' | 'recommended' | 'optional';
  roiBase: number;
}

interface Link {
  source: string;
  target: string;
  roiMultiplier: number;
  dependencyLevel: 'required' | 'recommended' | 'optional';
}

interface InterconnectionGraphProps {
  nodes: Node[];
  links: Link[];
  onNodeClick: (nodeId: string) => void;
  width?: number;
  height?: number;
}

export function InterconnectionGraph({
  nodes,
  links,
  onNodeClick,
  width = 800,
  height = 600
}: InterconnectionGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // SVG setup
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Clear previous
    svg.selectAll('*').remove();

    // Add zoom
    const g = svg.append('g');
    const zoom = d3.zoom().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom as any);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#ccc')
      .attr('stroke-width', (d: any) => d.roiMultiplier * 2)
      .attr('opacity', 0.6);

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 30)
      .attr('fill', (d: any) => {
        if (d.dependencyLevel === 'required') return '#ef4444';
        if (d.dependencyLevel === 'recommended') return '#f59e0b';
        return '#10b981';
      })
      .attr('cursor', 'pointer')
      .on('click', (_, d: any) => onNodeClick(d.id));

    // Labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .text((d: any) => d.name.substring(0, 15));

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    return () => simulation.stop();
  }, [nodes, links, width, height, onNodeClick]);

  return (
    <Card className="w-full">
      <svg ref={svgRef} className="w-full border rounded-lg" />
    </Card>
  );
}
```

---

### Component 2: WorkflowSteps

**File:** `client/src/components/WorkflowSteps.tsx`

```typescript
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkflowStep {
  featureId: string;
  featureName: string;
  roiMultiplier: number;
  completed: boolean;
  current: boolean;
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  onStepClick: (featureId: string) => void;
}

export function WorkflowSteps({ steps, onStepClick }: WorkflowStepsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Recommended Workflow</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.featureId}>
            <div
              className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => onStepClick(step.featureId)}
            >
              {step.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : step.current ? (
                <Circle className="w-6 h-6 text-blue-500 flex-shrink-0 animate-pulse" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className="font-medium">{step.featureName}</p>
                <p className="text-sm text-muted-foreground">
                  Step {index + 1} of {steps.length}
                </p>
              </div>

              <Badge variant="outline">
                {step.roiMultiplier.toFixed(1)}x ROI
              </Badge>
            </div>

            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

---

### Component 3: InterconnectionModal

**File:** `client/src/components/InterconnectionModal.tsx`

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Interconnection {
  sourceFeatureId: string;
  sourceFeatureName: string;
  targetFeatureId: string;
  targetFeatureName: string;
  type: 'sequential' | 'dependent' | 'synergistic' | 'cross-bundle';
  description: string;
  roiMultiplier: number;
  dependencyLevel: 'required' | 'recommended' | 'optional';
}

interface InterconnectionModalProps {
  open: boolean;
  interconnections: Interconnection[];
  onClose: () => void;
  onActivate: (interconnection: Interconnection) => void;
}

export function InterconnectionModal({
  open,
  interconnections,
  onClose,
  onActivate
}: InterconnectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feature Interconnections</DialogTitle>
          <DialogDescription>
            Discover how features work together to maximize ROI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {interconnections.map((ic) => (
            <div
              key={`${ic.sourceFeatureId}-${ic.targetFeatureId}`}
              className="p-4 border rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <p className="font-medium">{ic.sourceFeatureName}</p>
                  <p className="text-sm text-muted-foreground">{ic.type}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex-1 text-right">
                  <p className="font-medium">{ic.targetFeatureName}</p>
                  <p className="text-sm text-muted-foreground">
                    {ic.roiMultiplier.toFixed(1)}x ROI boost
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {ic.description}
              </p>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ic.dependencyLevel === 'required'
                      ? 'default'
                      : ic.dependencyLevel === 'recommended'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {ic.dependencyLevel}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onActivate(ic)}
                  className="ml-auto"
                >
                  Activate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Component 4: FeatureCardWithConnections

**File:** `client/src/components/FeatureCardWithConnections.tsx`

Update existing `FeatureCard.tsx` to include "See Connections" button:

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { InterconnectionModal } from './InterconnectionModal';

interface FeatureCardProps {
  featureId: string;
  name: string;
  description: string;
  category: string;
  roiBase: number;
  interconnectionCount: number;
  onActivate: (featureId: string) => void;
  onSeeConnections: (featureId: string) => Promise<any[]>;
}

export function FeatureCard({
  featureId,
  name,
  description,
  category,
  roiBase,
  interconnectionCount,
  onActivate,
  onSeeConnections
}: FeatureCardProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [interconnections, setInterconnections] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSeeConnections = async () => {
    setLoading(true);
    const data = await onSeeConnections(featureId);
    setInterconnections(data);
    setShowConnections(true);
    setLoading(false);
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <Badge variant="outline" className="mt-2">
              {category}
            </Badge>
          </div>
          {interconnectionCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              {interconnectionCount}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{roiBase}% Base ROI</span>
          <div className="flex gap-2">
            {interconnectionCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeeConnections}
                disabled={loading}
              >
                <LinkIcon className="w-3 h-3 mr-1" />
                See Connections
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onActivate(featureId)}
            >
              Activate
            </Button>
          </div>
        </div>
      </Card>

      <InterconnectionModal
        open={showConnections}
        interconnections={interconnections}
        onClose={() => setShowConnections(false)}
        onActivate={(ic) => {
          onActivate(ic.targetFeatureId);
          setShowConnections(false);
        }}
      />
    </>
  );
}
```

---

## Testing Requirements

**Unit Tests:**
- InterconnectionGraph renders correctly
- WorkflowSteps displays steps in order
- InterconnectionModal shows correct data
- Badge styling based on dependency level

**Integration Tests:**
- "See Connections" button fetches data
- Clicking node activates feature
- Modal closes on activation
- Real-time updates via Ably

**Visual Tests:**
- Graph renders in <500ms
- Smooth animations (60fps)
- Mobile responsive layout
- Dark/light theme support

---

## Acceptance Criteria

**Functional:**
- [ ] Graph renders with all nodes and links
- [ ] Zoom/pan working smoothly
- [ ] Click to activate working
- [ ] Modal displays interconnections
- [ ] "See Connections" button visible

**Performance:**
- [ ] Graph renders in <500ms
- [ ] Smooth interactions (60fps)
- [ ] Mobile responsive
- [ ] Accessibility compliant

---

## Files to Create

- `client/src/components/InterconnectionGraph.tsx`
- `client/src/components/WorkflowSteps.tsx`
- `client/src/components/InterconnectionModal.tsx`
- Update `client/src/components/FeatureCard.tsx`

---

**Status:** Ready for Implementation  
**Owner:** Replit
