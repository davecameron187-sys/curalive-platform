import React from "react";
import { Route, Router } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Loader2 } from "lucide-react";

// Pages
import Home from "@/pages/Home";
import BookingsEnhanced from "@/pages/BookingsEnhanced";
import PostEventAnalytics from "@/pages/PostEventAnalytics";

// Components
import { RealtimeQaModeration } from "@/components/RealtimeQaModeration";
import { SentimentTrendChart } from "@/components/SentimentTrendChart";
import { ParticipantStatusDashboard } from "@/components/ParticipantStatusDashboard";
import { OccRealtimeUpdates } from "@/components/OccRealtimeUpdates";

/**
 * AppEnhanced Component
 * 
 * Main application router with integrated components and routes for:
 * - Event bookings with database persistence
 * - Real-time Q&A moderation
 * - Sentiment analysis dashboard
 * - Participant status tracking
 * - Post-event analytics
 */
export default function AppEnhanced() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // Operator Console Page
  const OperatorConsole = ({ params }: { params: { conferenceId: string } }) => {
    const conferenceId = parseInt(params.conferenceId, 10);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Operator Console</h1>
            <p className="text-muted-foreground mt-1">Conference ID: {conferenceId}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column: Participant Status */}
            <div className="col-span-2">
              <ParticipantStatusDashboard conferenceId={conferenceId} />
            </div>

            {/* Right Column: Sentiment & Q&A */}
            <div className="space-y-6">
              <SentimentTrendChart conferenceId={conferenceId} />
              <OccRealtimeUpdates conferenceId={conferenceId} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  };

  // Moderator Console Page
  const ModeratorConsole = ({ params }: { params: { conferenceId: string } }) => {
    const conferenceId = parseInt(params.conferenceId, 10);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Moderator Console</h1>
            <p className="text-muted-foreground mt-1">Manage Q&A and participant interactions</p>
          </div>

          <RealtimeQaModeration conferenceId={conferenceId} />
        </div>
      </DashboardLayout>
    );
  };

  // Post-Event Analytics Page
  const PostEventPage = ({ params }: { params: { eventId: string } }) => {
    return (
      <DashboardLayout>
        <PostEventAnalytics eventId={params.eventId} />
      </DashboardLayout>
    );
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <Router>
      {/* Public Routes */}
      <Route path="/" component={Home} />

      {/* Protected Routes */}
      <Route path="/bookings">
        <ProtectedRoute>
          <DashboardLayout>
            <BookingsEnhanced />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/operator/:conferenceId">
        <ProtectedRoute>
          <OperatorConsole params={{ conferenceId: "" }} />
        </ProtectedRoute>
      </Route>

      <Route path="/moderator/:conferenceId">
        <ProtectedRoute>
          <ModeratorConsole params={{ conferenceId: "" }} />
        </ProtectedRoute>
      </Route>

      <Route path="/occ/:conferenceId">
        <ProtectedRoute>
          <OperatorConsole params={{ conferenceId: "" }} />
        </ProtectedRoute>
      </Route>

      <Route path="/post-event/:eventId">
        <ProtectedRoute>
          <PostEventPage params={{ eventId: "" }} />
        </ProtectedRoute>
      </Route>

      {/* Catch-all for 404 */}
      <Route>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">404</h1>
              <p className="text-muted-foreground">Page not found</p>
            </div>
          </div>
        </DashboardLayout>
      </Route>
    </Router>
  );
}
