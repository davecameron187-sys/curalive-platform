import { getEnv } from "./env";

export type ServiceStatus = {
  configured: boolean;
  status: "enabled" | "disabled";
  reason: string;
};

export type AppServiceStatus = {
  core: {
    database: ServiceStatus;
    sessionAuth: ServiceStatus;
  };
  integrations: {
    openai: ServiceStatus;
    ably: ServiceStatus;
    resend: ServiceStatus;
    recall: ServiceStatus;
    telephony: ServiceStatus;
    mux: ServiceStatus;
    stripe: ServiceStatus;
    oauth: ServiceStatus;
  };
};

function enabled(reason: string): ServiceStatus {
  return { configured: true, status: "enabled", reason };
}

function disabled(reason: string): ServiceStatus {
  return { configured: false, status: "disabled", reason };
}

export function getServiceStatus(): AppServiceStatus {
  const env = getEnv();

  return {
    core: {
      database: env.DATABASE_URL
        ? enabled("PostgreSQL connected")
        : disabled("DATABASE_URL not set"),
      sessionAuth: env.SESSION_SECRET
        ? enabled("Session secret configured")
        : disabled("SESSION_SECRET / JWT_SECRET not set"),
    },
    integrations: {
      openai: env.OPENAI_API_KEY
        ? enabled("AI analysis and transcription available")
        : disabled("OPENAI_API_KEY not set — AI features disabled"),
      ably: env.ABLY_API_KEY
        ? enabled("Real-time streaming available")
        : disabled("ABLY_API_KEY not set — real-time features disabled"),
      resend: env.RESEND_API_KEY
        ? enabled("Email delivery available")
        : disabled("RESEND_API_KEY not set — email features disabled"),
      recall: env.RECALL_AI_WEBHOOK_SECRET
        ? enabled("Recall.ai bot integration available")
        : disabled("RECALL_AI_WEBHOOK_SECRET not set — bot joining disabled"),
      telephony: (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) || env.TELNYX_API_KEY
        ? enabled(
            env.TWILIO_ACCOUNT_SID
              ? "Twilio telephony available"
              : "Telnyx telephony available"
          )
        : disabled("No telephony provider configured (TWILIO or TELNYX)"),
      mux: env.MUX_TOKEN_ID && env.MUX_TOKEN_SECRET
        ? enabled("Mux video streaming available")
        : disabled("MUX_TOKEN_ID / MUX_TOKEN_SECRET not set — video streaming disabled"),
      stripe: env.STRIPE_SECRET_KEY
        ? enabled("Payment processing available")
        : disabled("STRIPE_SECRET_KEY not set — payments disabled"),
      oauth: env.OAUTH_SERVER_URL
        ? enabled("OAuth authentication available")
        : disabled("OAUTH_SERVER_URL not set — OAuth disabled"),
    },
  };
}
