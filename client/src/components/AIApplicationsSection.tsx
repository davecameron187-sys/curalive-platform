/**
 * AI Applications Section Component
 * Displays recommended AI applications for event booking with benefits and stats
 */

import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Zap, TrendingUp, Clock } from 'lucide-react';

interface AIApplicationsSectionProps {
  sector: string;
  eventType: string;
  selectedApplications?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  readOnly?: boolean;
}

export function AIApplicationsSection({
  sector,
  eventType,
  selectedApplications = [],
  onSelectionChange,
  readOnly = false,
}: AIApplicationsSectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedApplications));
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended');

  // Fetch recommended applications
  const { data: recommendedApps, isLoading: recommendedLoading } = trpc.aiApplications.getRecommended.useQuery(
    { sector: sector as any, eventType: eventType as any },
    { enabled: !!sector && !!eventType && viewMode === 'recommended' }
  );

  // Fetch all applications
  const { data: allApps, isLoading: allLoading } = trpc.aiApplications.getAll.useQuery(
    undefined,
    { enabled: viewMode === 'all' }
  );

  const applications = viewMode === 'recommended' ? recommendedApps : allApps;
  const isLoading = viewMode === 'recommended' ? recommendedLoading : allLoading;

  const handleToggleApp = (appId: string) => {
    if (readOnly) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const toggleExpanded = (appId: string) => {
    const newExpanded = new Set(expandedApps);
    if (newExpanded.has(appId)) {
      newExpanded.delete(appId);
    } else {
      newExpanded.add(appId);
    }
    setExpandedApps(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!sector || !eventType) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Select a sector and event type to see recommended AI applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI Applications</h3>
        <p className="text-sm text-gray-600">
          Select AI applications to enhance your event. We recommend the top features for {sector} {eventType}s.
        </p>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended">
            Recommended ({recommendedApps?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Applications ({allApps?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {recommendedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : recommendedApps && recommendedApps.length > 0 ? (
            <div className="space-y-3">
              {recommendedApps.map((app) => (
                <AIApplicationCard
                  key={app.id}
                  app={app}
                  isSelected={selectedIds.has(app.id)}
                  isExpanded={expandedApps.has(app.id)}
                  onToggle={() => handleToggleApp(app.id)}
                  onToggleExpand={() => toggleExpanded(app.id)}
                  readOnly={readOnly}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No recommended applications for this combination.
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : allApps && allApps.length > 0 ? (
            <div className="space-y-3">
              {allApps.map((app) => (
                <AIApplicationCard
                  key={app.id}
                  app={app}
                  isSelected={selectedIds.has(app.id)}
                  isExpanded={expandedApps.has(app.id)}
                  onToggle={() => handleToggleApp(app.id)}
                  onToggleExpand={() => toggleExpanded(app.id)}
                  readOnly={readOnly}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No applications available.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Selection Summary */}
      {selectedIds.size > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900">
            {selectedIds.size} AI application{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-green-700 mt-1">
            These applications will be enabled for your event.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual AI Application Card Component
 */
interface AIApplicationCardProps {
  app: any;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  readOnly: boolean;
  getPriorityColor: (priority: string) => string;
}

function AIApplicationCard({
  app,
  isSelected,
  isExpanded,
  onToggle,
  onToggleExpand,
  readOnly,
  getPriorityColor,
}: AIApplicationCardProps) {
  return (
    <Card className={`p-4 transition-all ${isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {!readOnly && (
              <Checkbox
                checked={isSelected}
                onChange={onToggle}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{app.name}</h4>
                <Badge className={getPriorityColor(app.priority)}>
                  {app.priority}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{app.category}</p>
            </div>
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700">{app.description}</p>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            <span>{app.timeToValue}</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
            <TrendingUp className="w-3 h-3" />
            <span>{app.estimatedROI}</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t space-y-3">
            {/* Benefits */}
            <div>
              <h5 className="text-xs font-semibold text-gray-900 mb-2">Key Benefits</h5>
              <ul className="space-y-1">
                {app.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Statistics */}
            <div>
              <h5 className="text-xs font-semibold text-gray-900 mb-2">Key Metrics</h5>
              <div className="grid grid-cols-2 gap-2">
                {app.stats.slice(0, 4).map((stat: any, idx: number) => (
                  <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">{stat.metric}</p>
                    <p className="font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
