import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const isStaging = process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const bypassEnabled = process.env.AUTH_BYPASS === 'true';
  const DEV_BYPASS = (isStaging || isDev) && bypassEnabled;

  if (!user && DEV_BYPASS) {
    user = { id: 1, name: "Dev Operator", email: "dev@curalive.local", role: "admin" } as any;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
