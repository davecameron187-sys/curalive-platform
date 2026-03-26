type AppEnv = {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL: string;
  SESSION_SECRET: string;
  OPENAI_API_KEY?: string;
  ABLY_API_KEY?: string;
  MUX_TOKEN_ID?: string;
  MUX_TOKEN_SECRET?: string;
  RECALL_AI_WEBHOOK_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TELNYX_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  OAUTH_SERVER_URL?: string;
};

type MissingVar = {
  key: keyof AppEnv | string;
  requiredFor: string;
  critical: boolean;
};

export function validateEnv(): {
  isCoreValid: boolean;
  missing: MissingVar[];
  warnings: MissingVar[];
} {
  const missing: MissingVar[] = [];
  const warnings: MissingVar[] = [];

  if (!process.env.DATABASE_URL) {
    missing.push({ key: "DATABASE_URL", requiredFor: "Database connection", critical: true });
  }

  const hasAiKey = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY);

  const optionalKeys: { key: string; requiredFor: string; skip?: boolean }[] = [
    { key: "OPENAI_API_KEY", requiredFor: "AI analysis and transcription", skip: hasAiKey },
    { key: "ABLY_API_KEY", requiredFor: "Real-time event streaming" },
    { key: "RESEND_API_KEY", requiredFor: "Email delivery" },
    { key: "RECALL_AI_WEBHOOK_SECRET", requiredFor: "Recall.ai bot webhooks" },
    { key: "TWILIO_ACCOUNT_SID", requiredFor: "Telephony (Twilio)" },
    { key: "TWILIO_AUTH_TOKEN", requiredFor: "Telephony (Twilio)" },
    { key: "TELNYX_API_KEY", requiredFor: "Telephony (Telnyx)" },
    { key: "MUX_TOKEN_ID", requiredFor: "Video streaming (Mux)" },
    { key: "MUX_TOKEN_SECRET", requiredFor: "Video streaming (Mux)" },
    { key: "STRIPE_SECRET_KEY", requiredFor: "Payment processing" },
    { key: "OAUTH_SERVER_URL", requiredFor: "OAuth authentication" },
  ];

  for (const { key, requiredFor, skip } of optionalKeys) {
    if (skip) continue;
    if (!process.env[key]) {
      warnings.push({ key, requiredFor, critical: false });
    }
  }

  const isCoreValid = missing.length === 0;

  return { isCoreValid, missing, warnings };
}

export function getEnv(): Partial<AppEnv> {
  return {
    NODE_ENV: (process.env.NODE_ENV as AppEnv["NODE_ENV"]) ?? "development",
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "dev-fallback-secret",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ABLY_API_KEY: process.env.ABLY_API_KEY,
    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
    RECALL_AI_WEBHOOK_SECRET: process.env.RECALL_AI_WEBHOOK_SECRET,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TELNYX_API_KEY: process.env.TELNYX_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL,
  };
}

export function enforceEnvOrExit(): void {
  const { isCoreValid, missing, warnings } = validateEnv();

  if (warnings.length > 0) {
    console.log(`\n⚠  CuraLive — ${warnings.length} optional service(s) not configured:`);
    for (const w of warnings) {
      console.log(`   · ${w.key} → ${w.requiredFor} (disabled)`);
    }
    console.log("");
  }

  if (!isCoreValid) {
    console.error("\n✖  CuraLive — cannot start, missing critical environment variables:");
    for (const m of missing) {
      console.error(`   · ${m.key} → ${m.requiredFor}`);
    }
    console.error("\nSet these variables and restart.\n");
    process.exit(1);
  }

  console.log("✓  CuraLive environment validated — core services ready");
}
