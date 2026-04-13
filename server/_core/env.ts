import { z } from "zod";

const appEnvSchema = z.enum(["production", "staging", "development"]);
const appEnv = appEnvSchema.parse(process.env.APP_ENV || process.env.NODE_ENV);

export const ENV = {
  appEnv,
  isStaging: appEnv === "staging",
  stagingSafeEmailRecipient: appEnv === "staging" ? z.string().email().parse(process.env.STAGING_SAFE_EMAIL_RECIPIENT) : undefined,
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: appEnv === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.OPENAI_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
