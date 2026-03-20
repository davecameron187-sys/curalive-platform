/**
 * CuraLive Server Entry Point
 * GROK2 Live Q&A Intelligence Engine (Module 31)
 * Phase 1-2: Foundation & Intelligence Layer
 */

import express from "express";
import http from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isProd ? 120 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 20 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again later." },
  });

  app.use("/api/trpc", apiLimiter);
  app.use("/api/oauth", authLimiter);
  app.use("/api/auth", authLimiter);

  // ─────────────────────────────────────────────────────────────────────────────
  // GROK2 LIVE Q&A ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  // tRPC router
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // OAuth routes
  registerOAuthRoutes(app);

  // ─────────────────────────────────────────────────────────────────────────────
  // FRONTEND SERVING
  // ─────────────────────────────────────────────────────────────────────────────

  if (isProd) {
    // Serve static assets in production
    serveStatic(app);
  } else {
    // Setup Vite dev server in development
    await setupVite(app, server);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVER STARTUP
  // ─────────────────────────────────────────────────────────────────────────────

  const port = await findAvailablePort(process.env.PORT ? parseInt(process.env.PORT) : 3000);

  server.listen(port, "0.0.0.0", () => {
    console.log(`[OAuth] Initialized with baseURL: https://api.manus.im`);
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
