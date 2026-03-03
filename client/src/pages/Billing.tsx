/**
 * Billing.tsx — Chorus.AI subscription plans and billing management page.
 *
 * Shows:
 *   - Current subscription status (if active)
 *   - Plan cards with pricing in ZAR and USD
 *   - Checkout button (redirects to Stripe Checkout in a new tab)
 *   - Cancel subscription option
 */
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2, Zap, Crown, Building2, ArrowLeft,
  Loader2, AlertCircle, ExternalLink, Calendar, XCircle,
} from "lucide-react";

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

function PlanCard({
  plan,
  currentPlanId,
  onSubscribe,
  isLoading,
}: {
  plan: any;
  currentPlanId: string | null | undefined;
  onSubscribe: (planId: string) => void;
  isLoading: boolean;
}) {
  const Icon = PLAN_ICONS[plan.id] ?? Zap;
  const isActive = currentPlanId === plan.id;

  return (
    <div
      className={`relative flex flex-col bg-card border rounded-2xl p-6 ${
        plan.highlighted
          ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
          : "border-border"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {isActive && (
        <div className="absolute -top-3 right-4">
          <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlighted ? "bg-primary/10" : "bg-secondary"}`}>
          <Icon className={`w-5 h-5 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">R {plan.priceZAR.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">≈ ${plan.priceUSD} USD · billed monthly</div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-8 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      {/* Limits */}
      <div className="flex gap-3 mb-6 text-xs text-muted-foreground">
        <span className="bg-secondary px-2 py-1 rounded">
          {plan.maxAttendees ? `${plan.maxAttendees.toLocaleString()} attendees` : "Unlimited attendees"}
        </span>
        <span className="bg-secondary px-2 py-1 rounded">
          {plan.maxEventsPerMonth ? `${plan.maxEventsPerMonth} events/mo` : "Unlimited events"}
        </span>
      </div>

      {/* CTA */}
      {isActive ? (
        <Button variant="outline" disabled className="w-full">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Current Plan
        </Button>
      ) : !plan.available ? (
        <Button variant="outline" className="w-full" onClick={() => window.open("mailto:sales@choruscall.ai", "_blank")}>
          Contact Sales
        </Button>
      ) : (
        <Button
          className={`w-full ${plan.highlighted ? "" : "variant-outline"}`}
          variant={plan.highlighted ? "default" : "outline"}
          onClick={() => onSubscribe(plan.id)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
          Subscribe
        </Button>
      )}
    </div>
  );
}

export default function Billing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: plans, isLoading: plansLoading } = trpc.billing.getPlans.useQuery();
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } = trpc.billing.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const checkoutMut = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to Stripe Checkout…", { description: "A new tab will open for payment." });
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => {
      toast.error("Checkout failed", { description: err.message });
    },
  });

  const cancelMut = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled", { description: "Your plan will remain active until the end of the billing period." });
      refetchSub();
    },
    onError: (err) => {
      toast.error("Cancellation failed", { description: err.message });
    },
  });

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMut.mutate({ planId, origin: window.location.origin });
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.")) return;
    cancelMut.mutate();
  };

  // Check for success/cancelled query params
  const params = new URLSearchParams(window.location.search);
  const justSubscribed = params.get("success") === "1";
  const wasCancelled = params.get("cancelled") === "1";

  if (authLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Chorus.AI — Billing</span>
          </div>
          <div />
        </div>
      </header>

      <div className="container py-16 max-w-5xl mx-auto">

        {/* Success / cancelled banners */}
        {justSubscribed && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-400">Subscription activated!</div>
              <div className="text-sm text-muted-foreground">Your plan is now active. Thank you for subscribing to Chorus.AI.</div>
            </div>
          </div>
        )}
        {wasCancelled && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-amber-400">Checkout cancelled</div>
              <div className="text-sm text-muted-foreground">No charge was made. You can subscribe at any time.</div>
            </div>
          </div>
        )}

        {/* Page heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Choose the plan that fits your event volume. All plans include real-time transcription, smart Q&A, and post-event AI summaries.
          </p>
        </div>

        {/* Current subscription status */}
        {isAuthenticated && !subLoading && subscription && (
          <div className="mb-10 bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold">
                  {subscription.planName} — Active
                  {subscription.cancelAtPeriodEnd && (
                    <span className="ml-2 text-xs text-amber-400 font-normal">(cancels at period end)</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMut.isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {cancelMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Cancel Subscription
              </Button>
            )}
          </div>
        )}

        {/* Stripe not configured notice */}
        {plans && plans.every((p: any) => !p.available) && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-amber-400">Stripe not yet configured</div>
              <div className="text-sm text-muted-foreground">
                To enable online payments, go to <strong>Settings → Payment</strong> in the Manus management panel and enter your Stripe API keys.
                Until then, you can still contact sales to arrange a manual subscription.
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription?.planId}
              onSubscribe={handleSubscribe}
              isLoading={checkoutMut.isPending && checkoutMut.variables?.planId === plan.id}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10" style={{ fontFamily: "'Inter', sans-serif" }}>
          All prices exclude VAT. Payments processed securely by Stripe. Cancel anytime.
          For custom enterprise contracts or invoicing, contact{" "}
          <a href="mailto:sales@choruscall.ai" className="text-primary hover:underline">sales@choruscall.ai</a>.
        </p>
      </div>
    </div>
  );
}
