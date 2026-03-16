/**
 * i18n Configuration
 * Multi-language support with RTL support for Arabic and Hebrew
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";
import frTranslations from "./locales/fr.json";
import deTranslations from "./locales/de.json";
import zhTranslations from "./locales/zh.json";
import jaTranslations from "./locales/ja.json";
import arTranslations from "./locales/ar.json";
import heTranslations from "./locales/he.json";

export type LanguageCode = "en" | "es" | "fr" | "de" | "zh" | "ja" | "ar" | "he";

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: { code: "en", name: "English", nativeName: "English", rtl: false },
  es: { code: "es", name: "Spanish", nativeName: "Español", rtl: false },
  fr: { code: "fr", name: "French", nativeName: "Français", rtl: false },
  de: { code: "de", name: "German", nativeName: "Deutsch", rtl: false },
  zh: { code: "zh", name: "Chinese", nativeName: "中文", rtl: false },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語", rtl: false },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  he: { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },
};

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  zh: { translation: zhTranslations },
  ja: { translation: jaTranslations },
  ar: { translation: arTranslations },
  he: { translation: heTranslations },
};

// Get default language from localStorage or browser
function getDefaultLanguage(): LanguageCode {
  // Check localStorage
  const stored = localStorage.getItem("kiosk-language");
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as LanguageCode;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as LanguageCode;
  }

  // Default to English
  return "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDefaultLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
  },
});

// Apply RTL when language changes
i18n.on("languageChanged", (lng) => {
  const config = SUPPORTED_LANGUAGES[lng as LanguageCode];
  if (config.rtl) {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = lng;
  } else {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = lng;
  }

  // Save language preference
  localStorage.setItem("kiosk-language", lng);
});

// Set initial direction
const initialLang = i18n.language as LanguageCode;
const initialConfig = SUPPORTED_LANGUAGES[initialLang];
if (initialConfig.rtl) {
  document.documentElement.dir = "rtl";
} else {
  document.documentElement.dir = "ltr";
}

export default i18n;
