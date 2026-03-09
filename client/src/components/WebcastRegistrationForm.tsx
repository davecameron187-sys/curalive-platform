import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface WebcastRegistrationFormProps {
  eventId: number;
  eventTitle?: string;
  onSuccess?: () => void;
}

export function WebcastRegistrationForm({
  eventId,
  eventTitle = "Webcast Event",
  onSuccess,
}: WebcastRegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    phone: "",
    country: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.registrations.registerForWebcast.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        eventId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim() || undefined,
        jobTitle: formData.jobTitle.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        country: formData.country.trim() || undefined,
      });

      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        jobTitle: "",
        phone: "",
        country: "",
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <h3 className="text-lg font-semibold">Registration Successful!</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for registering for {eventTitle}. A confirmation email has been sent to{" "}
              <span className="font-medium">{formData.email}</span>.
            </p>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="mt-4"
            >
              Register Another Attendee
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register for {eventTitle}</CardTitle>
        <CardDescription>
          Please provide your information to join this webcast event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company
              </label>
              <Input
                id="company"
                name="company"
                type="text"
                placeholder="Your Company"
                value={formData.company}
                onChange={handleChange}
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <label htmlFor="jobTitle" className="text-sm font-medium">
                Job Title
              </label>
              <Input
                id="jobTitle"
                name="jobTitle"
                type="text"
                placeholder="Director of Marketing"
                value={formData.jobTitle}
                onChange={handleChange}
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <Input
                id="country"
                name="country"
                type="text"
                placeholder="United States"
                value={formData.country}
                onChange={handleChange}
                disabled={registerMutation.isPending}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex-1"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            <span className="text-red-500">*</span> Required fields
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
