import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

/**
 * tRPC React client for mobile app
 * Provides type-safe API calls to backend
 */
export const trpc = createTRPCReact<AppRouter>();
