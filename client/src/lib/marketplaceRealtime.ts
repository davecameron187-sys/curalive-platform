import { useEffect, useRef, useCallback } from 'react';
import { trpc } from './trpc';

/**
 * Ably Real-Time Integration for Marketplace
 * Provides real-time updates for recommendations and moderation events
 */

export interface RecommendationUpdate {
  type: 'personalized' | 'trending' | 'similar' | 'collaborative';
  templateId: number;
  templateName: string;
  score: number;
  reason: string;
  timestamp: number;
}

export interface ModerationUpdate {
  type: 'flagged' | 'approved' | 'rejected' | 'removed';
  templateId: number;
  templateName: string;
  action: string;
  moderatorId: number;
  reason?: string;
  timestamp: number;
}

/**
 * Hook to subscribe to recommendation updates via Ably
 */
export function useRecommendationUpdates(
  onUpdate: (update: RecommendationUpdate) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const setupChannel = async () => {
      try {
        // Subscribe to recommendations channel
        if (channelRef.current) {
          channelRef.current.subscribe('recommendation-update', (message: any) => {
            onUpdate(message.data as RecommendationUpdate);
          });
        }
      } catch (error) {
        console.error('[Marketplace Realtime] Error setting up Ably channel:', error);
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe('recommendation-update');
      }
    };
  }, [enabled, onUpdate]);
}

/**
 * Hook to subscribe to moderation updates via Ably
 */
export function useModerationUpdates(
  onUpdate: (update: ModerationUpdate) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const setupChannel = async () => {
      try {
        // Subscribe to moderation channel
        if (channelRef.current) {
          channelRef.current.subscribe('moderation-update', (message: any) => {
            onUpdate(message.data as ModerationUpdate);
          });
        }
      } catch (error) {
        console.error('[Marketplace Realtime] Error setting up moderation channel:', error);
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe('moderation-update');
      }
    };
  }, [enabled, onUpdate]);
}

/**
 * Hook to publish recommendation impression to Ably
 */
export function usePublishRecommendationImpression() {
  const trackMutation = trpc.marketplaceRound69.trackRecommendationImpression.useMutation();

  const publish = useCallback(
    async (templateId: number, type: 'personalized' | 'trending' | 'similar' | 'collaborative') => {
      try {
        await trackMutation.mutateAsync({ templateId, type });
      } catch (error) {
        console.error('[Marketplace Realtime] Error tracking impression:', error);
      }
    },
    [trackMutation]
  );

  return { publish, isLoading: trackMutation.isPending };
}

/**
 * Hook to publish moderation action to Ably
 */
export function usePublishModerationAction() {
  const approveMutation = trpc.marketplaceRound69.approveTemplate.useMutation();
  const rejectMutation = trpc.marketplaceRound69.rejectTemplate.useMutation();
  const removeMutation = trpc.marketplaceRound69.removeTemplate.useMutation();

  const publishApprove = useCallback(
    async (templateId: number, reason?: string) => {
      try {
        await approveMutation.mutateAsync({ templateId, reason });
      } catch (error) {
        console.error('[Marketplace Realtime] Error approving template:', error);
      }
    },
    [approveMutation]
  );

  const publishReject = useCallback(
    async (templateId: number, reason: string) => {
      try {
        await rejectMutation.mutateAsync({ templateId, reason });
      } catch (error) {
        console.error('[Marketplace Realtime] Error rejecting template:', error);
      }
    },
    [rejectMutation]
  );

  const publishRemove = useCallback(
    async (templateId: number, reason: string) => {
      try {
        await removeMutation.mutateAsync({ templateId, reason });
      } catch (error) {
        console.error('[Marketplace Realtime] Error removing template:', error);
      }
    },
    [removeMutation]
  );

  return {
    publishApprove,
    publishReject,
    publishRemove,
    isLoading:
      approveMutation.isPending || rejectMutation.isPending || removeMutation.isPending,
  };
}
