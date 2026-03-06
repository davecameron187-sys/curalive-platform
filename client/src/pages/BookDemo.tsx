import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, ArrowLeft, Zap, Video, Mic, BarChart3, Globe, MessageSquare } from "lucide-react";

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services — Full Platform Overview" },
  { value: "capital_raising", label: "Capital Raising 1:1 Meetings & Roadshows" },
  { value: "earnings_call", label: "Earnings Calls & Investor Updates" },
  { value: "research", label: "Research Presentations" },
  { value: "hybrid_conference", label: "Hybrid Investor Conferences" },
];

const FEATURES = [
  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text with <1s latency" },
  { icon: BarChart3, label: "Commitment Signal AI", desc: "Detect soft commits and interest signals automatically" },
  { icon: MessageSquare, label: "Smart Q&A", desc: "Moderated investor Q&A with sentiment scoring" },
  { icon: Globe, label: "Auto-Translation", desc: "8 languages, translated in real-time" },
  { icon: Video, label: "Platform Neutral", desc: "Zoom, Teams, Webex, RTMP, PSTN" },
  { icon: Zap, label: "AI Briefing Packs", desc: "Pre-meeting investor profiles and talking points" },
];

export default function BookDemo() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    phone: "",
    serviceInterest: "all" as "capital_raising" | "earnings_call" | "research" | "hybrid_conference" | "all",
    preferredDate: "",
    message: "",
  });

  const submitMutation = trpc.bookDemo.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      role: form.role,
      email: form.email,
      phone: form.phone || undefined,
      serviceInterest: form.serviceInterest,
      preferredDate: form.preferredDate || undefined,
      message: form.message || undefined,
    });
  };

  const update = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-lg text-center px-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Request Received</h1>
          <p className="text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            Thank you, <strong className="text-foreground">{form.name}</strong>. Our team will be in touch within one business day to schedule your personalised walkthrough.
          </p>
          <p className="text-muted-foreground text-sm mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            A confirmation has been sent to <strong className="text-foreground">{form.email}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
            <Button onClick={() => navigate("/live-video")} className="gap-2">
              <Video className="w-4 h-4" /> Explore Live Video
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">Chorus<span className="text-primary">.AI</span></span>
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </header>

      <div className="container py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-5xl mx-auto">

          {/* Left — value prop */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> Book a Live Demo
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
              See CuraLive in Action
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a personalised walkthrough of the full platform — from live event intelligence and real-time transcription to AI-powered roadshow management and investor commitment signal detection.
            </p>

            <div className="space-y-4 mb-8">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Trusted by Capital Markets Teams</p>
              <div className="flex flex-wrap gap-3">
                {["Goldman Sachs", "BlackRock", "Actis Capital", "JP Morgan", "Barclays Africa", "Old Mutual"].map(name => (
                  <span key={name} className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">{name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6">Request a Demo</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Sarah Chen"
                    value={form.name}
                    onChange={e => update("name", e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="Goldman Sachs AM"
                    value={form.company}
                    onChange={e => update("company", e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Job Title *</Label>
                  <Input
                    id="role"
                    placeholder="Head of IR / MD"
                    value={form.role}
                    onChange={e => update("role", e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@gsam.com"
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 20 7000 0000"
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Preferred Date (optional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.preferredDate}
                    onChange={e => update("preferredDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service">Primary Interest</Label>
                <Select
                  value={form.serviceInterest}
                  onValueChange={v => update("serviceInterest", v)}
                >
                  <SelectTrigger id="service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Anything specific you'd like to see? (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="e.g. We run 3 roadshows per quarter and need AI briefing packs for each investor meeting..."
                  value={form.message}
                  onChange={e => update("message", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {submitMutation.error && (
                <p className="text-sm text-destructive">{submitMutation.error.message}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Request Demo →"}
              </Button>

              <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                We respond within one business day. No spam, no automated sequences.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
