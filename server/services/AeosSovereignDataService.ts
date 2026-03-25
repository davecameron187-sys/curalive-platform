// @ts-nocheck
/**
 * AEOS Sovereign Data Architecture
 * CIPC Patent App ID 1773575338868 | CIP6 | Claim 74
 *
 * Implements:
 *   1. Isolated Learning — per-client Knowledge Graph isolation with no cross-contamination
 *   2. Zero-Trust Identity Validation — cryptographic verification on every AEOS API call
 *   3. Data Residency Compliance — configurable POPIA, GDPR, SOX jurisdictional requirements
 */
import { createHash, randomBytes } from "crypto";

export type DataResidencyPolicy = {
  jurisdiction: "POPIA" | "GDPR" | "SOX" | "POPIA_GDPR" | "ALL";
  dataRegion: string;
  retentionDays: number;
  encryptionRequired: boolean;
  crossBorderTransferAllowed: boolean;
  auditFrequencyDays: number;
};

export type ClientIsolationContext = {
  clientId: string;
  isolationToken: string;
  residencyPolicy: DataResidencyPolicy;
  createdAt: number;
  lastAccessAt: number;
  accessCount: number;
};

export type ZeroTrustToken = {
  tokenId: string;
  clientId: string;
  issuedAt: number;
  expiresAt: number;
  permissions: string[];
  hash: string;
};

const RESIDENCY_POLICIES: Record<string, DataResidencyPolicy> = {
  POPIA: {
    jurisdiction: "POPIA",
    dataRegion: "ZA",
    retentionDays: 365 * 5,
    encryptionRequired: true,
    crossBorderTransferAllowed: false,
    auditFrequencyDays: 90,
  },
  GDPR: {
    jurisdiction: "GDPR",
    dataRegion: "EU",
    retentionDays: 365 * 3,
    encryptionRequired: true,
    crossBorderTransferAllowed: false,
    auditFrequencyDays: 30,
  },
  SOX: {
    jurisdiction: "SOX",
    dataRegion: "US",
    retentionDays: 365 * 7,
    encryptionRequired: true,
    crossBorderTransferAllowed: true,
    auditFrequencyDays: 90,
  },
};

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const clientIsolationContexts = new Map<string, ClientIsolationContext>();
const activeTokens = new Map<string, ZeroTrustToken>();

function generateIsolationToken(clientId: string): string {
  const payload = `${clientId}:${Date.now()}:${randomBytes(16).toString("hex")}`;
  return createHash("sha256").update(payload).digest("hex");
}

function computeTokenHash(token: Omit<ZeroTrustToken, "hash">): string {
  return createHash("sha256").update(JSON.stringify({
    tokenId: token.tokenId,
    clientId: token.clientId,
    issuedAt: token.issuedAt,
    expiresAt: token.expiresAt,
    permissions: token.permissions,
  })).digest("hex");
}

export function initializeClientIsolation(clientId: string, jurisdiction: string): ClientIsolationContext {
  const policy = RESIDENCY_POLICIES[jurisdiction] ?? RESIDENCY_POLICIES.POPIA;
  const isolationToken = generateIsolationToken(clientId);

  const ctx: ClientIsolationContext = {
    clientId,
    isolationToken,
    residencyPolicy: policy,
    createdAt: Date.now(),
    lastAccessAt: Date.now(),
    accessCount: 0,
  };

  clientIsolationContexts.set(clientId, ctx);
  console.log(`[AEOS-Sovereign] Initialized isolation context for client: ${clientId} | jurisdiction: ${jurisdiction} | region: ${policy.dataRegion}`);
  return ctx;
}

export function issueZeroTrustToken(clientId: string, permissions: string[]): ZeroTrustToken | null {
  const ctx = clientIsolationContexts.get(clientId);
  if (!ctx) {
    console.warn(`[AEOS-Sovereign] Cannot issue token — no isolation context for client: ${clientId}`);
    return null;
  }

  const now = Date.now();
  const tokenId = `ztt-${randomBytes(8).toString("hex")}`;
  const partial: Omit<ZeroTrustToken, "hash"> = {
    tokenId,
    clientId,
    issuedAt: now,
    expiresAt: now + TOKEN_EXPIRY_MS,
    permissions,
  };

  const hash = computeTokenHash(partial);
  const token: ZeroTrustToken = { ...partial, hash };

  activeTokens.set(tokenId, token);
  ctx.accessCount++;
  ctx.lastAccessAt = now;

  console.log(`[AEOS-Sovereign] Issued zero-trust token: ${tokenId} for client: ${clientId} | permissions: ${permissions.join(", ")}`);
  return token;
}

export function validateZeroTrustToken(tokenId: string, requiredPermission: string): {
  valid: boolean;
  clientId: string | null;
  reason: string;
} {
  const token = activeTokens.get(tokenId);
  if (!token) {
    return { valid: false, clientId: null, reason: "Token not found — no implicit trust granted" };
  }

  if (Date.now() > token.expiresAt) {
    activeTokens.delete(tokenId);
    return { valid: false, clientId: token.clientId, reason: "Token expired — re-authentication required" };
  }

  const recomputedHash = computeTokenHash({
    tokenId: token.tokenId,
    clientId: token.clientId,
    issuedAt: token.issuedAt,
    expiresAt: token.expiresAt,
    permissions: token.permissions,
  });

  if (recomputedHash !== token.hash) {
    activeTokens.delete(tokenId);
    return { valid: false, clientId: token.clientId, reason: "Token integrity check failed — possible tampering" };
  }

  if (!token.permissions.includes(requiredPermission) && !token.permissions.includes("*")) {
    return { valid: false, clientId: token.clientId, reason: `Permission denied: "${requiredPermission}" not in token permissions` };
  }

  return { valid: true, clientId: token.clientId, reason: "Zero-trust validation passed" };
}

export function enforceClientIsolation(requestingClientId: string, targetClientId: string): {
  allowed: boolean;
  reason: string;
} {
  if (requestingClientId === targetClientId) {
    return { allowed: true, reason: "Same-client access — isolation maintained" };
  }

  return {
    allowed: false,
    reason: `Cross-client access denied: client "${requestingClientId}" cannot access data belonging to client "${targetClientId}". Per-client Knowledge Graphs are logically isolated.`,
  };
}

export function checkDataResidencyCompliance(clientId: string, targetRegion: string): {
  compliant: boolean;
  policy: DataResidencyPolicy | null;
  reason: string;
} {
  const ctx = clientIsolationContexts.get(clientId);
  if (!ctx) {
    return { compliant: false, policy: null, reason: "No isolation context — client not initialized" };
  }

  const policy = ctx.residencyPolicy;

  if (policy.dataRegion === targetRegion) {
    return { compliant: true, policy, reason: `Data remains in ${targetRegion} — compliant with ${policy.jurisdiction}` };
  }

  if (policy.crossBorderTransferAllowed) {
    return { compliant: true, policy, reason: `Cross-border transfer to ${targetRegion} allowed under ${policy.jurisdiction}` };
  }

  return {
    compliant: false,
    policy,
    reason: `Cross-border transfer to ${targetRegion} blocked — ${policy.jurisdiction} requires data to remain in ${policy.dataRegion}`,
  };
}

export function revokeToken(tokenId: string): boolean {
  return activeTokens.delete(tokenId);
}

export function cleanupExpiredTokens(): number {
  const now = Date.now();
  let removed = 0;
  for (const [tokenId, token] of activeTokens.entries()) {
    if (now > token.expiresAt) {
      activeTokens.delete(tokenId);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[AEOS-Sovereign] Cleaned up ${removed} expired zero-trust tokens`);
  }
  return removed;
}

export function getIsolationStatus(clientId: string): {
  initialized: boolean;
  jurisdiction: string | null;
  dataRegion: string | null;
  accessCount: number;
  activeTokens: number;
} {
  const ctx = clientIsolationContexts.get(clientId);
  if (!ctx) {
    return { initialized: false, jurisdiction: null, dataRegion: null, accessCount: 0, activeTokens: 0 };
  }

  const clientTokenCount = [...activeTokens.values()].filter(t => t.clientId === clientId && Date.now() <= t.expiresAt).length;

  return {
    initialized: true,
    jurisdiction: ctx.residencyPolicy.jurisdiction,
    dataRegion: ctx.residencyPolicy.dataRegion,
    accessCount: ctx.accessCount,
    activeTokens: clientTokenCount,
  };
}
