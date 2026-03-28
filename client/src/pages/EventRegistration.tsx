/**
 * Event Registration Page
 * Public-facing registration for investor events and earnings calls
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Users, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
}

export default function EventRegistration() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    phone: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get event ID from URL params
  const eventId = new URLSearchParams(window.location.search).get("eventId") || "default-event";

  // Mock event details (replace with tRPC query when backend ready)
  const eventDetails = {
    eventId,
    eventName: "Q4 2025 Earnings Call",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    registeredCount: 1247,
    description: "Join us for our Q4 2025 earnings call and investor Q&A session.",
  };
  const eventLoading = false;

  // Register attendee mutation (mock for now)
  const registerMutation = {
    mutate: (data: any) => {
      // Mock registration
      setTimeout(() => {
        setSubmitted(true);
        setError(null);
        setTimeout(() => navigate(`/attendee-dashboard?eventId=${eventId}`), 2000);
      }, 500);
    },
    isPending: false,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.company) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    registerMutation.mutate({
      eventId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      company: formData.company,
      title: formData.title,
      phone: formData.phone,
    });
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Confirmed!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for registering. You'll be redirected to the attendee dashboard shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to {formData.email}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Event Registration</h1>
              <p className="text-muted-foreground mt-1">
                {eventDetails?.eventName || "Investor Event"}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="md:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Event Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {eventDetails?.eventDate
                        ? new Date(eventDetails.eventDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "TBD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Registered Attendees</p>
                    <p className="font-medium">{eventDetails?.registeredCount || 0} attendees</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Features</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>✓ Live Q&A</li>
                      <li>✓ Real-time Transcript</li>
                      <li>✓ Sentiment Analysis</li>
                      <li>✓ Event Recording</li>
                    </ul>
                  </div>
                </div>
              </div>

              {eventDetails?.description && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">About this event</p>
                  <p className="text-sm">{eventDetails.description}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Registration Form */}
          <div className="md:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Register Now</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corp"
                    required
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title</label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Senior Analyst"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <input type="checkbox" id="terms" className="mt-1" required />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to receive updates about this event and future investor events
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering..." : "Complete Registration"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By registering, you agree to our Privacy Policy and Terms of Service
                </p>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
