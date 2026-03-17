/**
 * Smart Rate Router — compares Twilio vs Telnyx per-minute rates for each
 * destination and picks the cheapest carrier automatically.
 *
 * Rate data sourced from published Twilio/Telnyx pricing pages (March 2026).
 * Rates are approximate and should be updated periodically.
 *
 * Lookup order:
 *   1. Country code + number type (mobile vs landline)
 *   2. Country code only (fallback to generic rate)
 *   3. Default international rate
 */

export type Carrier = "twilio" | "telnyx";
export type NumberType = "mobile" | "landline" | "unknown";

export interface CarrierRate {
  carrier: Carrier;
  ratePerMinute: number;
  currency: "USD";
}

export interface RouteDecision {
  primary: Carrier;
  fallback: Carrier;
  primaryRate: number;
  fallbackRate: number;
  destination: string;
  countryCode: string;
  numberType: NumberType;
  savingsPercent: number;
}

interface RateEntry {
  twilio: { mobile: number; landline: number };
  telnyx: { mobile: number; landline: number };
}

const RATE_TABLE: Record<string, RateEntry> = {
  "27": {
    twilio: { mobile: 0.220, landline: 0.040 },
    telnyx: { mobile: 0.090, landline: 0.020 },
  },
  "1": {
    twilio: { mobile: 0.014, landline: 0.014 },
    telnyx: { mobile: 0.005, landline: 0.005 },
  },
  "44": {
    twilio: { mobile: 0.040, landline: 0.020 },
    telnyx: { mobile: 0.020, landline: 0.010 },
  },
  "61": {
    twilio: { mobile: 0.085, landline: 0.030 },
    telnyx: { mobile: 0.045, landline: 0.018 },
  },
  "49": {
    twilio: { mobile: 0.060, landline: 0.020 },
    telnyx: { mobile: 0.030, landline: 0.012 },
  },
  "33": {
    twilio: { mobile: 0.070, landline: 0.020 },
    telnyx: { mobile: 0.035, landline: 0.010 },
  },
  "91": {
    twilio: { mobile: 0.025, landline: 0.025 },
    telnyx: { mobile: 0.012, landline: 0.012 },
  },
  "86": {
    twilio: { mobile: 0.020, landline: 0.015 },
    telnyx: { mobile: 0.010, landline: 0.008 },
  },
  "81": {
    twilio: { mobile: 0.085, landline: 0.055 },
    telnyx: { mobile: 0.045, landline: 0.030 },
  },
  "971": {
    twilio: { mobile: 0.160, landline: 0.100 },
    telnyx: { mobile: 0.090, landline: 0.060 },
  },
  "65": {
    twilio: { mobile: 0.030, landline: 0.020 },
    telnyx: { mobile: 0.018, landline: 0.010 },
  },
  "852": {
    twilio: { mobile: 0.025, landline: 0.020 },
    telnyx: { mobile: 0.014, landline: 0.010 },
  },
  "55": {
    twilio: { mobile: 0.150, landline: 0.050 },
    telnyx: { mobile: 0.080, landline: 0.025 },
  },
  "234": {
    twilio: { mobile: 0.120, landline: 0.090 },
    telnyx: { mobile: 0.070, landline: 0.050 },
  },
  "254": {
    twilio: { mobile: 0.120, landline: 0.080 },
    telnyx: { mobile: 0.065, landline: 0.040 },
  },
  "255": {
    twilio: { mobile: 0.150, landline: 0.100 },
    telnyx: { mobile: 0.080, landline: 0.055 },
  },
  "256": {
    twilio: { mobile: 0.130, landline: 0.090 },
    telnyx: { mobile: 0.070, landline: 0.050 },
  },
  "263": {
    twilio: { mobile: 0.200, landline: 0.100 },
    telnyx: { mobile: 0.120, landline: 0.060 },
  },
  "267": {
    twilio: { mobile: 0.130, landline: 0.090 },
    telnyx: { mobile: 0.070, landline: 0.050 },
  },
  "260": {
    twilio: { mobile: 0.150, landline: 0.100 },
    telnyx: { mobile: 0.080, landline: 0.055 },
  },
  "258": {
    twilio: { mobile: 0.140, landline: 0.090 },
    telnyx: { mobile: 0.075, landline: 0.050 },
  },
};

const DEFAULT_RATES: RateEntry = {
  twilio: { mobile: 0.100, landline: 0.050 },
  telnyx: { mobile: 0.050, landline: 0.025 },
};

export function extractCountryCode(phoneNumber: string): string {
  const clean = phoneNumber.replace(/[\s\-\(\)]/g, "");
  const digits = clean.startsWith("+") ? clean.slice(1) : clean;

  const threeDig = digits.slice(0, 3);
  if (RATE_TABLE[threeDig]) return threeDig;

  const twoDig = digits.slice(0, 2);
  if (RATE_TABLE[twoDig]) return twoDig;

  const oneDig = digits.slice(0, 1);
  if (RATE_TABLE[oneDig]) return oneDig;

  return digits.slice(0, 2);
}

export function detectNumberType(phoneNumber: string, countryCode: string): NumberType {
  const clean = phoneNumber.replace(/[\s\-\(\)]/g, "");
  const digits = clean.startsWith("+") ? clean.slice(1) : clean;
  const local = digits.slice(countryCode.length);

  if (countryCode === "27") {
    if (local.startsWith("6") || local.startsWith("7") || local.startsWith("8")) return "mobile";
    return "landline";
  }
  if (countryCode === "1") {
    return "mobile";
  }
  if (countryCode === "44") {
    if (local.startsWith("7")) return "mobile";
    return "landline";
  }

  return "unknown";
}

export function routeCall(phoneNumber: string): RouteDecision {
  const countryCode = extractCountryCode(phoneNumber);
  const numberType = detectNumberType(phoneNumber, countryCode);
  const rates = RATE_TABLE[countryCode] ?? DEFAULT_RATES;

  const rateKey = numberType === "unknown" ? "mobile" : numberType;
  const twilioRate = rates.twilio[rateKey];
  const telnyxRate = rates.telnyx[rateKey];

  const hasTelnyx = !!process.env.TELNYX_API_KEY && !!process.env.TELNYX_PHONE_NUMBER;
  const hasTwilio = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;

  let primary: Carrier;
  let fallback: Carrier;
  let primaryRate: number;
  let fallbackRate: number;

  if (hasTelnyx && hasTwilio) {
    if (telnyxRate <= twilioRate) {
      primary = "telnyx";
      fallback = "twilio";
      primaryRate = telnyxRate;
      fallbackRate = twilioRate;
    } else {
      primary = "twilio";
      fallback = "telnyx";
      primaryRate = twilioRate;
      fallbackRate = telnyxRate;
    }
  } else if (hasTelnyx) {
    primary = "telnyx";
    fallback = "telnyx";
    primaryRate = telnyxRate;
    fallbackRate = telnyxRate;
  } else {
    primary = "twilio";
    fallback = "twilio";
    primaryRate = twilioRate;
    fallbackRate = twilioRate;
  }

  const expensiveRate = Math.max(twilioRate, telnyxRate);
  const savingsPercent = expensiveRate > 0
    ? Math.round(((expensiveRate - primaryRate) / expensiveRate) * 100)
    : 0;

  const decision: RouteDecision = {
    primary,
    fallback,
    primaryRate,
    fallbackRate,
    destination: phoneNumber,
    countryCode,
    numberType,
    savingsPercent,
  };

  console.log(
    `[RateRouter] ${phoneNumber} → CC:${countryCode} (${numberType}) → ` +
    `${primary} $${primaryRate.toFixed(3)}/min ` +
    `(fallback: ${fallback} $${fallbackRate.toFixed(3)}/min, saving ${savingsPercent}%)`
  );

  return decision;
}

export function getCountryName(countryCode: string): string {
  const COUNTRY_NAMES: Record<string, string> = {
    "1": "USA/Canada", "27": "South Africa", "44": "United Kingdom",
    "49": "Germany", "33": "France", "61": "Australia",
    "91": "India", "86": "China", "81": "Japan",
    "971": "UAE", "65": "Singapore", "852": "Hong Kong",
    "55": "Brazil", "234": "Nigeria", "254": "Kenya",
    "255": "Tanzania", "256": "Uganda", "258": "Mozambique",
    "260": "Zambia", "263": "Zimbabwe", "267": "Botswana",
  };
  return COUNTRY_NAMES[countryCode] ?? `CC:${countryCode}`;
}

export function getRateComparison(phoneNumber: string): {
  country: string;
  numberType: NumberType;
  twilio: number;
  telnyx: number;
  cheapest: Carrier;
  savings: string;
} {
  const countryCode = extractCountryCode(phoneNumber);
  const numberType = detectNumberType(phoneNumber, countryCode);
  const rates = RATE_TABLE[countryCode] ?? DEFAULT_RATES;
  const rateKey = numberType === "unknown" ? "mobile" : numberType;

  const tw = rates.twilio[rateKey];
  const tx = rates.telnyx[rateKey];
  const cheapest: Carrier = tx <= tw ? "telnyx" : "twilio";
  const expensiveRate = Math.max(tw, tx);
  const cheapRate = Math.min(tw, tx);
  const pct = expensiveRate > 0 ? Math.round(((expensiveRate - cheapRate) / expensiveRate) * 100) : 0;

  return {
    country: getCountryName(countryCode),
    numberType,
    twilio: tw,
    telnyx: tx,
    cheapest,
    savings: `${pct}% cheaper via ${cheapest}`,
  };
}
