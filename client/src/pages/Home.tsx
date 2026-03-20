/**
 * Home Page
 * GROK2 Module 31 — Live Q&A Intelligence Engine
 * Landing page with feature overview and demo access
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Mic, BarChart3, MessageSquare, Globe, Zap, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";

const FEATURES = [
  {
    icon: Mic,
    label: "Live Transcription",
    desc: "Real-time speech-to-text powered by OpenAI Whisper with <1s latency.",
  },
  {
    icon: BarChart3,
    label: "Sentiment Analysis",
    desc: "AI monitors tone and audience reaction in real-time throughout the event.",
  },
  {
    icon: MessageSquare,
    label: "Smart Q&A",
    desc: "Attendees submit, upvote, and categorize questions — moderated by the operator.",
  },
  {
    icon: Globe,
    label: "Auto-Translation",
    desc: "Participants choose their language; transcripts translate instantly.",
  },
  {
    icon: Zap,
    label: "Real-Time Delivery",
    desc: "Sub-100ms message delivery via Ably's global edge network.",
  },
  {
    icon: MessageSquare,
    label: "Compliance Monitoring",
    desc: "Automated risk detection and legal review workflow for regulated industries.",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold">
              Cura<span className="text-primary">Live</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.name}
                </span>
                <Button
                  variant="outline"
                  onClick={() => navigate("/live-qa/demo-session")}
                >
                  Enter Live Q&A
                </Button>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> GROK2 Intelligence Layer
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              The Intelligence Layer
              <br />
              <span className="text-primary">for Every Meeting</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              CuraLive sits on top of Zoom, Microsoft Teams, Webex, and any RTMP source — delivering real-time transcription, sentiment analysis, smart Q&A, and AI summaries to every investor event, earnings call, and board briefing.
            </p>

            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate("/live-qa/demo-session")}
                  className="flex items-center gap-2"
                >
                  Enter Live Event Room <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="flex items-center gap-2"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-3">Intelligence Features</h2>
            <p className="text-muted-foreground">
              Everything your team needs for world-class meetings, delivered in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Meetings?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading enterprises using CuraLive to deliver world-class intelligence at every meeting.
          </p>

          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Start Free Trial
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CuraLive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
