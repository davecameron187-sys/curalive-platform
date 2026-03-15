import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
    
    // Check if user's role has expired and auto-revert to 'user'
    if (user && user.roleExpiresAt) {
      const expiresAt = typeof user.roleExpiresAt === 'number' 
        ? user.roleExpiresAt 
        : user.roleExpiresAt.getTime();
      
      if (expiresAt < Date.now()) {
        // Role has expired, revert to 'user'
        const db = await getDb();
        if (db) {
          await db.update(users)
            .set({ role: 'user', roleExpiresAt: null })
            .where(eq(users.id, user.id));
          
          // Update the user object in context
          user.role = 'user';
          user.roleExpiresAt = null;
          
          console.log(`[Auth] Role expired for user ${user.id}, reverted to 'user'`);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
