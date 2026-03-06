/**
 * PulseLive Supported Languages
 * Coverage: Sub-Saharan Africa, North Africa, Mauritius, UAE/Dubai
 */

export interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  region: string;
  rtl?: boolean;
  whisperCode: string; // Whisper API language code
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    region: "Pan-Africa · UAE",
    whisperCode: "en",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    region: "West & Central Africa · Mauritius",
    whisperCode: "fr",
  },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    region: "North Africa · UAE",
    rtl: true,
    whisperCode: "ar",
  },
  {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    region: "Angola · Mozambique",
    whisperCode: "pt",
  },
  {
    code: "sw",
    label: "Swahili",
    nativeLabel: "Kiswahili",
    region: "East Africa",
    whisperCode: "sw",
  },
  {
    code: "zu",
    label: "Zulu",
    nativeLabel: "isiZulu",
    region: "South Africa",
    whisperCode: "zu",
  },
  {
    code: "af",
    label: "Afrikaans",
    nativeLabel: "Afrikaans",
    region: "South Africa · Namibia",
    whisperCode: "af",
  },
  {
    code: "ha",
    label: "Hausa",
    nativeLabel: "Hausa",
    region: "Nigeria · West Africa",
    whisperCode: "ha",
  },
  {
    code: "am",
    label: "Amharic",
    nativeLabel: "አማርኛ",
    region: "Ethiopia",
    whisperCode: "am",
  },
  {
    code: "zh",
    label: "Mandarin",
    nativeLabel: "中文",
    region: "China · Pan-Africa",
    whisperCode: "zh",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    region: "Mauritius · South Africa · UAE",
    whisperCode: "hi",
  },
  {
    code: "mfe",
    label: "Creole",
    nativeLabel: "Kreol Morisyen",
    region: "Mauritius",
    whisperCode: "fr", // Whisper falls back to French for Mauritian Creole
  },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English

export const LANGUAGE_MAP = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l])
) as Record<string, Language>;

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code) as [
  string,
  ...string[]
];
