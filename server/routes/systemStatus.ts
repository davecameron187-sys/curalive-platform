import { Router } from "express";
import { getServiceStatus } from "../_core/config/serviceStatus";
import { validateEnv } from "../_core/config/env";
import { getStorageHealth } from "../storageAdapter";

export const systemStatusRouter = Router();

systemStatusRouter.get("/health", async (_req, res) => {
  const validation = validateEnv();
  const services = getServiceStatus();
  const storage = getStorageHealth();

  return res.json({
    ok: validation.isCoreValid,
    environment: process.env.NODE_ENV ?? "development",
    coreReady: validation.isCoreValid,
    missingCore: validation.missing.map((m) => m.key),
    missingOptional: validation.warnings.map((w) => ({
      key: w.key,
      requiredFor: w.requiredFor,
    })),
    services,
    storage,
    timestamp: new Date().toISOString(),
  });
});
