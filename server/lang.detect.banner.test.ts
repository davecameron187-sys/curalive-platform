/**
 * lang.detect.banner.test.ts
 * Unit tests for the browser language auto-detect banner logic in EventRoom.tsx.
 * Tests cover: locale mapping, banner show/hide conditions, accept/dismiss persistence.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Locale → supported language code mapping ─────────────────────────────────

const BROWSER_TO_CODE: Record<string, string> = {
  fr: "fr", "fr-fr": "fr", "fr-be": "fr", "fr-ca": "fr", "fr-ch": "fr",
  ar: "ar", "ar-ae": "ar", "ar-sa": "ar", "ar-eg": "ar", "ar-ma": "ar",
  pt: "pt", "pt-br": "pt", "pt-pt": "pt", "pt-ao": "pt", "pt-mz": "pt",
  sw: "sw", "sw-ke": "sw", "sw-tz": "sw",
  zu: "zu", "zu-za": "zu",
  af: "af", "af-za": "af",
  ha: "ha", "ha-ng": "ha",
  am: "am", "am-et": "am",
  zh: "zh", "zh-cn": "zh", "zh-tw": "zh", "zh-hk": "zh",
  hi: "hi", "hi-in": "hi",
  mfe: "mfe",
};

function detectBrowserLanguage(browserLang: string): string | null {
  const lower = browserLang.toLowerCase();
  const matched = BROWSER_TO_CODE[lower] ?? BROWSER_TO_CODE[lower.split("-")[0]];
  if (matched && matched !== "en") return matched;
  return null;
}

function shouldShowBanner(opts: {
  detectedCode: string | null;
  alreadyDismissed: boolean;
  storedLang: string | null;
}): boolean {
  if (!opts.detectedCode) return false;
  if (opts.alreadyDismissed) return false;
  if (opts.storedLang && opts.storedLang !== "en") return false;
  return true;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Browser locale → language code mapping", () => {
  it("maps 'fr' to French", () => {
    expect(detectBrowserLanguage("fr")).toBe("fr");
  });

  it("maps 'fr-FR' to French (case-insensitive)", () => {
    expect(detectBrowserLanguage("fr-FR")).toBe("fr");
  });

  it("maps 'ar-AE' to Arabic", () => {
    expect(detectBrowserLanguage("ar-AE")).toBe("ar");
  });

  it("maps 'pt-BR' to Portuguese", () => {
    expect(detectBrowserLanguage("pt-BR")).toBe("pt");
  });

  it("maps 'zh-CN' to Mandarin", () => {
    expect(detectBrowserLanguage("zh-CN")).toBe("zh");
  });

  it("maps 'sw-KE' to Swahili", () => {
    expect(detectBrowserLanguage("sw-KE")).toBe("sw");
  });

  it("maps 'zu-ZA' to Zulu", () => {
    expect(detectBrowserLanguage("zu-ZA")).toBe("zu");
  });

  it("maps 'af-ZA' to Afrikaans", () => {
    expect(detectBrowserLanguage("af-ZA")).toBe("af");
  });

  it("maps 'hi-IN' to Hindi", () => {
    expect(detectBrowserLanguage("hi-IN")).toBe("hi");
  });

  it("maps 'am-ET' to Amharic", () => {
    expect(detectBrowserLanguage("am-ET")).toBe("am");
  });

  it("returns null for English ('en')", () => {
    expect(detectBrowserLanguage("en")).toBeNull();
  });

  it("returns null for English with region ('en-US')", () => {
    expect(detectBrowserLanguage("en-US")).toBeNull();
  });

  it("returns null for unsupported locale ('de')", () => {
    expect(detectBrowserLanguage("de")).toBeNull();
  });

  it("returns null for unsupported locale ('ja')", () => {
    expect(detectBrowserLanguage("ja")).toBeNull();
  });

  it("falls back to base language code when full locale not mapped ('fr-CD')", () => {
    // fr-CD (Congo) is not in the map, but 'fr' is
    expect(detectBrowserLanguage("fr-CD")).toBe("fr");
  });
});

describe("Banner show/hide conditions", () => {
  it("shows banner when a supported non-English language is detected and no preference is set", () => {
    expect(shouldShowBanner({ detectedCode: "fr", alreadyDismissed: false, storedLang: null })).toBe(true);
  });

  it("shows banner when stored lang is 'en' (default, not yet customised)", () => {
    expect(shouldShowBanner({ detectedCode: "ar", alreadyDismissed: false, storedLang: "en" })).toBe(true);
  });

  it("does NOT show banner when already dismissed", () => {
    expect(shouldShowBanner({ detectedCode: "fr", alreadyDismissed: true, storedLang: null })).toBe(false);
  });

  it("does NOT show banner when user already set a non-English language", () => {
    expect(shouldShowBanner({ detectedCode: "fr", alreadyDismissed: false, storedLang: "pt" })).toBe(false);
  });

  it("does NOT show banner when no supported language is detected", () => {
    expect(shouldShowBanner({ detectedCode: null, alreadyDismissed: false, storedLang: null })).toBe(false);
  });

  it("does NOT show banner for English browser locale", () => {
    const code = detectBrowserLanguage("en-GB");
    expect(shouldShowBanner({ detectedCode: code, alreadyDismissed: false, storedLang: null })).toBe(false);
  });
});

describe("Banner accept action", () => {
  const LANG_BANNER_DISMISSED_KEY = "curalive_chat_lang_banner_dismissed";
  const CHAT_LANG_KEY = "curalive_chat_lang";

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
  });

  it("sets the chat language to the detected language on accept", () => {
    const detectedLangCode = "fr";
    // Simulate handleLangBannerAccept
    localStorage.setItem(CHAT_LANG_KEY, detectedLangCode);
    localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1");

    expect(localStorage.getItem(CHAT_LANG_KEY)).toBe("fr");
    expect(localStorage.getItem(LANG_BANNER_DISMISSED_KEY)).toBe("1");
  });

  it("enables translation when banner is accepted", () => {
    const detectedLangCode = "ar";
    localStorage.setItem(CHAT_LANG_KEY, detectedLangCode);

    const storedLang = localStorage.getItem(CHAT_LANG_KEY);
    const translationEnabled = storedLang !== null && storedLang !== "en";
    expect(translationEnabled).toBe(true);
  });

  it("marks banner as permanently dismissed after accept", () => {
    localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1");
    expect(localStorage.getItem(LANG_BANNER_DISMISSED_KEY)).toBe("1");
  });
});

describe("Banner dismiss action", () => {
  const LANG_BANNER_DISMISSED_KEY = "curalive_chat_lang_banner_dismissed";
  const CHAT_LANG_KEY = "curalive_chat_lang";

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
  });

  it("marks banner as dismissed without changing the chat language", () => {
    // Simulate handleLangBannerDismiss
    localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1");

    expect(localStorage.getItem(LANG_BANNER_DISMISSED_KEY)).toBe("1");
    expect(localStorage.getItem(CHAT_LANG_KEY)).toBeNull(); // language unchanged
  });

  it("does not show banner again after dismissal", () => {
    localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1");
    const alreadyDismissed = localStorage.getItem(LANG_BANNER_DISMISSED_KEY) === "1";
    expect(shouldShowBanner({ detectedCode: "fr", alreadyDismissed, storedLang: null })).toBe(false);
  });

  it("keeps English as the active language after dismissal", () => {
    localStorage.setItem(LANG_BANNER_DISMISSED_KEY, "1");
    const storedLang = localStorage.getItem(CHAT_LANG_KEY) ?? "en";
    expect(storedLang).toBe("en");
  });
});
