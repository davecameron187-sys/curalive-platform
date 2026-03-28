/**
 * Production Deployment Configuration
 * Centralized settings for production environment
 */

export const productionConfig = {
  // Server
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "0.0.0.0",
    nodeEnv: "production",
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || "",
    maxConnections: 20,
    connectionTimeout: 10000,
    idleTimeout: 30000,
    enableLogging: false,
  },

  // Security
  security: {
    corsOrigins: (process.env.CORS_ORIGIN || "").split(","),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
    enableHttpsRedirect: true,
    enableCsrfProtection: true,
    enableHelmet: true,
  },

  // Caching
  cache: {
    ttlSpeakers: parseInt(process.env.CACHE_TTL_SPEAKERS || "600000", 10),
    ttlAnalytics: parseInt(process.env.CACHE_TTL_ANALYTICS || "300000", 10),
    ttlSessions: parseInt(process.env.CACHE_TTL_SESSIONS || "60000", 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || "1000", 10),
  },

  // API Keys
  apiKeys: {
    forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
    forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
    recallAiKey: process.env.RECALL_AI_API_KEY || "",
    recallAiUrl: process.env.RECALL_AI_BASE_URL || "",
    ablyKey: process.env.ABLY_API_KEY || "",
    resendKey: process.env.RESEND_API_KEY || "",
    telnyxKey: process.env.TELNYX_API_KEY || "",
  },

  // Billing
  billing: {
    apiUrl: process.env.BILLING_API_URL || "",
    apiKey: process.env.BILLING_API_KEY || "",
    enabled: !!(process.env.BILLING_API_URL && process.env.BILLING_API_KEY),
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || "",
    analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT || "",
    analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID || "",
    logLevel: process.env.LOG_LEVEL || "info",
    logFormat: process.env.LOG_FORMAT || "json",
  },

  // Features
  features: {
    enableBilling: !!(process.env.BILLING_API_URL && process.env.BILLING_API_KEY),
    enableAnalytics: !!process.env.VITE_ANALYTICS_ENDPOINT,
    enableSentry: !!process.env.SENTRY_DSN,
    enableRecallAi: !!process.env.RECALL_AI_API_KEY,
    enableTelnyx: !!process.env.TELNYX_API_KEY,
    enableTwilio: !!process.env.TWILIO_ACCOUNT_SID,
  },

  // Deployment
  deployment: {
    environment: "production",
    region: process.env.AWS_REGION || "us-east-1",
    version: process.env.APP_VERSION || "1.0.0",
    buildTime: new Date().toISOString(),
  },
};

/**
 * Validate production configuration
 */
export function validateProductionConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (!process.env.BUILT_IN_FORGE_API_KEY) {
    errors.push("BUILT_IN_FORGE_API_KEY is required");
  }

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required");
  }

  if (!process.env.VITE_APP_ID) {
    errors.push("VITE_APP_ID is required");
  }

  // Optional but recommended
  if (!process.env.SENTRY_DSN) {
    console.warn("[Config] SENTRY_DSN not configured - error tracking disabled");
  }

  if (!process.env.BILLING_API_URL) {
    console.warn("[Config] BILLING_API_URL not configured - billing disabled");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log production configuration (sanitized)
 */
export function logProductionConfig(): void {
  console.log("[Config] Production Configuration:");
  console.log(`  Server: ${productionConfig.server.host}:${productionConfig.server.port}`);
  console.log(`  Database: ${productionConfig.database.url?.substring(0, 30)}...`);
  console.log(`  Security: CORS=${productionConfig.security.corsOrigins.length} origins`);
  console.log(`  Caching: Enabled (max ${productionConfig.cache.maxSize} items)`);
  console.log(`  Features:`);
  console.log(`    - Billing: ${productionConfig.features.enableBilling ? "✓" : "✗"}`);
  console.log(`    - Analytics: ${productionConfig.features.enableAnalytics ? "✓" : "✗"}`);
  console.log(`    - Sentry: ${productionConfig.features.enableSentry ? "✓" : "✗"}`);
  console.log(`    - Recall.ai: ${productionConfig.features.enableRecallAi ? "✓" : "✗"}`);
  console.log(`    - Telnyx: ${productionConfig.features.enableTelnyx ? "✓" : "✗"}`);
  console.log(`    - Twilio: ${productionConfig.features.enableTwilio ? "✓" : "✗"}`);
}

export default productionConfig;
