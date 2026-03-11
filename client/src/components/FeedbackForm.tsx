import { useState } from "react";
import { Star, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function FeedbackForm() {
  const [rating, setRating] = useState<number>(0);
  const [suggestion, setSuggestion] = useState("");
  const [email, setEmail] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedbackMutation = (trpc as any).feedback.submit.useMutation();
  const isLoading = submitFeedbackMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        rating,
        suggestion: suggestion.trim() || undefined,
        email: email.trim() || undefined,
        pageUrl: window.location.pathname,
      });

      setSubmitted(true);
      setRating(0);
      setSuggestion("");
      setEmail("");

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 bg-card border border-border rounded-lg">
      <h3 className="text-xl font-semibold mb-2">Share Your Feedback</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Help us improve by sharing your experience and suggestions.
      </p>

      {submitted ? (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">
              Thank you for your feedback!
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              We appreciate your input and will use it to improve the platform.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium mb-3">
              How would you rate your experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Rating: {rating} out of 5 stars
              </p>
            )}
          </div>

          {/* Suggestion Section */}
          <div>
            <label htmlFor="suggestion" className="block text-sm font-medium mb-2">
              Any suggestions or comments? (Optional)
            </label>
            <textarea
              id="suggestion"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Tell us what we can improve..."
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {suggestion.length}/1000 characters
            </p>
          </div>

          {/* Email Section */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email (Optional - for follow-up)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading || rating === 0}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRating(0);
                setSuggestion("");
                setEmail("");
                setError(null);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
