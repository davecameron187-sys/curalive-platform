import { Request, Response, NextFunction } from "express";
import { rawSql } from "../db";

interface BrandConfig {
  partnerId: number | null;
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  isWhiteLabel: boolean;
}

const DEFAULT_BRAND: BrandConfig = {
  partnerId: null,
  displayName: "CuraLive",
  logoUrl: null,
  primaryColor: "#1a1a2e",
  accentColor: "#6b21a8",
  fontFamily: "Inter, system-ui, sans-serif",
  isWhiteLabel: false,
};

const brandCache = new Map<string, { brand: BrandConfig; cachedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function lookupBrandByDomain(hostname: string): Promise<BrandConfig> {
  const cached = brandCache.get(hostname);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.brand;
  }

  try {
    const [rows] = await rawSql(
      `SELECT id, display_name, logo_url, primary_color, accent_color, font_family
       FROM partners
       WHERE custom_domain = $1 AND custom_domain_verified = true AND active = true
       LIMIT 1`,
      [hostname]
    );

    if (rows.length > 0) {
      const p = rows[0];
      const brand: BrandConfig = {
        partnerId: p.id,
        displayName: p.display_name || "Intelligence Platform",
        logoUrl: p.logo_url || null,
        primaryColor: p.primary_color || "#1a1a2e",
        accentColor: p.accent_color || "#6b21a8",
        fontFamily: p.font_family || "Inter, system-ui, sans-serif",
        isWhiteLabel: true,
      };
      brandCache.set(hostname, { brand, cachedAt: Date.now() });
      return brand;
    }
  } catch {}

  brandCache.set(hostname, { brand: DEFAULT_BRAND, cachedAt: Date.now() });
  return DEFAULT_BRAND;
}

export async function brandConfigMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const hostname = req.hostname || req.headers.host?.split(":")[0] || "";
    const brand = await lookupBrandByDomain(hostname);
    (req as any).brandConfig = brand;
  } catch {
    (req as any).brandConfig = DEFAULT_BRAND;
  }
  next();
}

export function getBrandConfig(req: Request): BrandConfig {
  return (req as any).brandConfig || DEFAULT_BRAND;
}
