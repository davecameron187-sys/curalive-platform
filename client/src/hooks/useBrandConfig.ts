import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";

interface BrandConfig {
  displayName: string;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily?: string;
  isWhiteLabel: boolean;
}

const DEFAULT_BRAND: BrandConfig = {
  displayName: "CuraLive",
  primaryColor: "#1a1a2e",
  accentColor: "#6b21a8",
  isWhiteLabel: false,
};

export function useBrandConfig(partnerId?: number | null) {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);

  const { data } = trpc.partners.getBrandConfig.useQuery(
    { partnerId: partnerId ?? undefined },
    { enabled: !!partnerId }
  );

  useEffect(() => {
    if (data) {
      const config: BrandConfig = {
        displayName: data.displayName || "CuraLive",
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || "#1a1a2e",
        accentColor: data.accentColor || "#6b21a8",
        fontFamily: data.fontFamily,
        isWhiteLabel: data.isWhiteLabel || false,
      };
      setBrand(config);

      document.documentElement.style.setProperty("--brand-primary", config.primaryColor);
      document.documentElement.style.setProperty("--brand-accent", config.accentColor);
      if (config.fontFamily) {
        document.documentElement.style.setProperty("--brand-font", config.fontFamily);
      }
    }
  }, [data]);

  return brand;
}
