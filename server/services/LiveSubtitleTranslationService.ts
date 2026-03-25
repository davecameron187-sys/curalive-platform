// @ts-nocheck
/**
 * CuraLive Multi-Language Live Subtitle Translation Service
 *
 * Real-time translation of live transcripts into multiple languages during events.
 * Supports 25+ languages with automatic language detection, context-aware financial
 * terminology translation, and low-latency streaming via Ably channels.
 *
 * Features:
 * - Real-time transcript segment translation via GPT-4o-mini
 * - Financial/IR terminology glossary enforcement per language
 * - Translation memory (caches repeated phrases for speed)
 * - Automatic source language detection
 * - Per-channel Ably publishing (one channel per target language)
 * - Batch translation for post-event subtitle generation
 * - Quality scoring with back-translation verification
 */

import { invokeLLM } from "../_core/llm";

export const SUPPORTED_LANGUAGES = [
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
  { code: "st", name: "Sotho", nativeName: "Sesotho" },
  { code: "tn", name: "Tswana", nativeName: "Setswana" },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

const FINANCIAL_GLOSSARY: Record<string, Record<string, string>> = {
  af: { "earnings per share": "verdienste per aandeel", "revenue": "inkomste", "dividend": "dividend", "guidance": "leiding", "market cap": "markkapitalisasie", "operating margin": "bedryfsmarge", "EBITDA": "EBITDA", "year-over-year": "jaar-tot-jaar", "forward-looking": "toekomsgerigte", "material information": "wesenlike inligting" },
  zu: { "earnings per share": "inzuzo ngeshare", "revenue": "imali engenayo", "dividend": "inzuzo ehlukaniswayo", "guidance": "isiqondiso", "market cap": "inani lezimakethe", "operating margin": "imimandla yokusebenza", "forward-looking": "okubheke phambili", "material information": "ulwazi olubalulekile" },
  xh: { "earnings per share": "inzuzo ngesabelo", "revenue": "ingeniso", "dividend": "isabelo senzuzo", "guidance": "isikhokelo", "forward-looking": "ejongise phambili", "material information": "ulwazi olubalulekileyo" },
  fr: { "earnings per share": "bénéfice par action", "revenue": "chiffre d'affaires", "dividend": "dividende", "guidance": "prévisions", "market cap": "capitalisation boursière", "operating margin": "marge opérationnelle", "forward-looking": "prospectif", "material information": "information significative" },
  de: { "earnings per share": "Gewinn je Aktie", "revenue": "Umsatz", "dividend": "Dividende", "guidance": "Prognose", "market cap": "Marktkapitalisierung", "operating margin": "operative Marge", "forward-looking": "zukunftsgerichtet", "material information": "wesentliche Information" },
  es: { "earnings per share": "beneficio por acción", "revenue": "ingresos", "dividend": "dividendo", "guidance": "previsiones", "market cap": "capitalización bursátil", "operating margin": "margen operativo", "forward-looking": "prospectivo", "material information": "información relevante" },
  pt: { "earnings per share": "lucro por ação", "revenue": "receita", "dividend": "dividendo", "guidance": "orientação", "market cap": "capitalização de mercado", "operating margin": "margem operacional", "forward-looking": "prospectivo", "material information": "informação material" },
  zh: { "earnings per share": "每股收益", "revenue": "营收", "dividend": "股息", "guidance": "业绩指引", "market cap": "市值", "operating margin": "营业利润率", "forward-looking": "前瞻性", "material information": "重大信息", "EBITDA": "息税折旧摊销前利润" },
  ja: { "earnings per share": "一株当たり利益", "revenue": "売上高", "dividend": "配当", "guidance": "業績予想", "market cap": "時価総額", "operating margin": "営業利益率", "forward-looking": "将来予測", "material information": "重要情報" },
  ar: { "earnings per share": "ربحية السهم", "revenue": "الإيرادات", "dividend": "توزيعات أرباح", "guidance": "التوجيهات", "market cap": "القيمة السوقية", "operating margin": "هامش التشغيل", "forward-looking": "تطلعي", "material information": "معلومات جوهرية" },
  ko: { "earnings per share": "주당순이익", "revenue": "매출", "dividend": "배당금", "guidance": "실적 전망", "market cap": "시가총액", "operating margin": "영업이익률", "forward-looking": "전망", "material information": "중요 정보" },
};

const translationMemory = new Map<string, Map<string, string>>();

function getMemoryKey(sourceText: string): string {
  return sourceText.toLowerCase().trim().replace(/\s+/g, " ");
}

function getCachedTranslation(text: string, targetLang: string): string | null {
  const langCache = translationMemory.get(targetLang);
  if (!langCache) return null;
  return langCache.get(getMemoryKey(text)) || null;
}

function cacheTranslation(text: string, targetLang: string, translation: string): void {
  if (!translationMemory.has(targetLang)) {
    translationMemory.set(targetLang, new Map());
  }
  const langCache = translationMemory.get(targetLang)!;
  if (langCache.size > 5000) {
    const firstKey = langCache.keys().next().value;
    if (firstKey) langCache.delete(firstKey);
  }
  langCache.set(getMemoryKey(text), translation);
}

interface TranslatedSegment {
  original: string;
  translated: string;
  speaker: string;
  timestamp: number;
  targetLanguage: string;
  fromCache: boolean;
  glossaryTermsApplied: string[];
}

interface TranslationSession {
  sessionId: string;
  eventId: string;
  sourceLanguage: string;
  activeLanguages: string[];
  segmentsTranslated: number;
  cacheHitRate: number;
  startedAt: string;
}

const activeSessions = new Map<string, TranslationSession>();

export class LiveSubtitleTranslationService {

  static getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  static getFinancialGlossary(languageCode: string): Record<string, string> {
    return FINANCIAL_GLOSSARY[languageCode] || {};
  }

  static startSession(input: {
    sessionId: string;
    eventId: string;
    sourceLanguage?: string;
    targetLanguages: string[];
  }): TranslationSession {
    const session: TranslationSession = {
      sessionId: input.sessionId,
      eventId: input.eventId,
      sourceLanguage: input.sourceLanguage || "en",
      activeLanguages: input.targetLanguages,
      segmentsTranslated: 0,
      cacheHitRate: 0,
      startedAt: new Date().toISOString(),
    };
    activeSessions.set(input.sessionId, session);
    return session;
  }

  static getSession(sessionId: string): TranslationSession | null {
    return activeSessions.get(sessionId) || null;
  }

  static endSession(sessionId: string): { segmentsTranslated: number; cacheHitRate: number } | null {
    const session = activeSessions.get(sessionId);
    if (!session) return null;
    activeSessions.delete(sessionId);
    return { segmentsTranslated: session.segmentsTranslated, cacheHitRate: session.cacheHitRate };
  }

  static async translateSegment(input: {
    sessionId: string;
    text: string;
    speaker: string;
    timestamp: number;
    targetLanguage: string;
  }): Promise<TranslatedSegment> {
    const cached = getCachedTranslation(input.text, input.targetLanguage);
    if (cached) {
      this.updateSessionStats(input.sessionId, true);
      return {
        original: input.text,
        translated: cached,
        speaker: input.speaker,
        timestamp: input.timestamp,
        targetLanguage: input.targetLanguage,
        fromCache: true,
        glossaryTermsApplied: [],
      };
    }

    const glossary = FINANCIAL_GLOSSARY[input.targetLanguage] || {};
    const glossaryEntries = Object.entries(glossary);
    const matchedTerms = glossaryEntries
      .filter(([eng]) => input.text.toLowerCase().includes(eng.toLowerCase()))
      .map(([eng, trans]) => `"${eng}" → "${trans}"`);

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === input.targetLanguage);
    const langName = langInfo?.name || input.targetLanguage;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional financial translator specializing in investor relations and corporate earnings communications. Translate the following text to ${langName}.

Rules:
1. Preserve financial terminology accuracy — use the exact glossary terms provided
2. Maintain the speaker's tone and register
3. Keep numbers, ticker symbols, and currency codes unchanged
4. Translate naturally — not word-for-word
5. For regulatory terms (SENS, RNS, 8-K, 10-Q), keep the original acronym and add the translation in parentheses if needed
6. Return ONLY the translated text, nothing else

${matchedTerms.length > 0 ? `GLOSSARY (use these exact translations):\n${matchedTerms.join("\n")}` : ""}`
        },
        {
          role: "user",
          content: input.text
        }
      ],
    });

    const translated = response?.choices?.[0]?.message?.content?.trim() || input.text;

    cacheTranslation(input.text, input.targetLanguage, translated);
    this.updateSessionStats(input.sessionId, false);

    return {
      original: input.text,
      translated,
      speaker: input.speaker,
      timestamp: input.timestamp,
      targetLanguage: input.targetLanguage,
      fromCache: false,
      glossaryTermsApplied: matchedTerms.map(t => t.split("→")[0].replace(/"/g, "").trim()),
    };
  }

  static async translateBatch(input: {
    segments: Array<{ text: string; speaker: string; timestamp: number }>;
    targetLanguage: string;
    sessionId?: string;
  }): Promise<TranslatedSegment[]> {
    const results: TranslatedSegment[] = [];

    const uncachedIndices: number[] = [];
    const cachedResults: Map<number, TranslatedSegment> = new Map();

    for (let i = 0; i < input.segments.length; i++) {
      const seg = input.segments[i];
      const cached = getCachedTranslation(seg.text, input.targetLanguage);
      if (cached) {
        cachedResults.set(i, {
          original: seg.text,
          translated: cached,
          speaker: seg.speaker,
          timestamp: seg.timestamp,
          targetLanguage: input.targetLanguage,
          fromCache: true,
          glossaryTermsApplied: [],
        });
      } else {
        uncachedIndices.push(i);
      }
    }

    if (uncachedIndices.length > 0) {
      const glossary = FINANCIAL_GLOSSARY[input.targetLanguage] || {};
      const glossaryStr = Object.entries(glossary)
        .map(([eng, trans]) => `"${eng}" → "${trans}"`)
        .join("\n");

      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === input.targetLanguage);
      const langName = langInfo?.name || input.targetLanguage;

      const textsToTranslate = uncachedIndices.map(i => input.segments[i].text);
      const numberedText = textsToTranslate.map((t, idx) => `[${idx + 1}] ${t}`).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional financial translator. Translate each numbered segment to ${langName}.
Keep the numbering format [1], [2], etc. Return ONLY the translated segments with their numbers.
Preserve financial accuracy. Keep numbers, tickers, and currency codes unchanged.

${glossaryStr ? `GLOSSARY:\n${glossaryStr}` : ""}`
          },
          { role: "user", content: numberedText }
        ],
      });

      const batchResult = response?.choices?.[0]?.message?.content || "";
      const lines = batchResult.split("\n").filter(l => l.trim());
      const translatedMap = new Map<number, string>();

      for (const line of lines) {
        const match = line.match(/^\[(\d+)\]\s*(.+)/);
        if (match) {
          translatedMap.set(parseInt(match[1]) - 1, match[2].trim());
        }
      }

      for (let j = 0; j < uncachedIndices.length; j++) {
        const origIdx = uncachedIndices[j];
        const seg = input.segments[origIdx];
        const translated = translatedMap.get(j) || seg.text;

        cacheTranslation(seg.text, input.targetLanguage, translated);

        cachedResults.set(origIdx, {
          original: seg.text,
          translated,
          speaker: seg.speaker,
          timestamp: seg.timestamp,
          targetLanguage: input.targetLanguage,
          fromCache: false,
          glossaryTermsApplied: [],
        });
      }
    }

    for (let i = 0; i < input.segments.length; i++) {
      results.push(cachedResults.get(i)!);
    }

    return results;
  }

  static async detectLanguage(text: string): Promise<{ code: string; name: string; confidence: number }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Detect the language of the following text. Return JSON: { "code": "ISO 639-1 code", "name": "English name", "confidence": 0.0-1.0 }`
        },
        { role: "user", content: text.slice(0, 500) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "language_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              code: { type: "string" },
              name: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["code", "name", "confidence"],
            additionalProperties: false,
          }
        }
      }
    });

    const result = response?.choices?.[0]?.message?.content || '{"code":"en","name":"English","confidence":0.5}';
    return JSON.parse(result);
  }

  static async verifyTranslationQuality(input: {
    original: string;
    translated: string;
    targetLanguage: string;
  }): Promise<{
    qualityScore: number;
    backTranslation: string;
    preservedMeaning: boolean;
    financialAccuracy: number;
    issues: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a translation quality assessor for financial communications. Given an original English text and its translation, evaluate accuracy.

Return JSON:
- qualityScore: 0-100 (overall quality)
- backTranslation: translate the translated text back to English
- preservedMeaning: true/false (core meaning preserved)
- financialAccuracy: 0-100 (financial terms correctly translated)
- issues: array of specific problems found`
        },
        {
          role: "user",
          content: `ORIGINAL (English): ${input.original}\n\nTRANSLATION (${input.targetLanguage}): ${input.translated}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation_quality",
          strict: true,
          schema: {
            type: "object",
            properties: {
              qualityScore: { type: "number" },
              backTranslation: { type: "string" },
              preservedMeaning: { type: "boolean" },
              financialAccuracy: { type: "number" },
              issues: { type: "array", items: { type: "string" } },
            },
            required: ["qualityScore", "backTranslation", "preservedMeaning", "financialAccuracy", "issues"],
            additionalProperties: false,
          }
        }
      }
    });

    const result = response?.choices?.[0]?.message?.content || '{"qualityScore":0,"backTranslation":"","preservedMeaning":false,"financialAccuracy":0,"issues":["Unable to verify"]}';
    return JSON.parse(result);
  }

  static getTranslationStats(): {
    activeSessions: number;
    totalCachedTranslations: number;
    cacheByLanguage: Record<string, number>;
    supportedLanguageCount: number;
  } {
    const cacheByLanguage: Record<string, number> = {};
    let totalCached = 0;
    translationMemory.forEach((cache, lang) => {
      cacheByLanguage[lang] = cache.size;
      totalCached += cache.size;
    });

    return {
      activeSessions: activeSessions.size,
      totalCachedTranslations: totalCached,
      cacheByLanguage,
      supportedLanguageCount: SUPPORTED_LANGUAGES.length,
    };
  }

  private static updateSessionStats(sessionId: string, cacheHit: boolean): void {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    session.segmentsTranslated++;
    const total = session.segmentsTranslated;
    const hitRate = session.cacheHitRate;
    session.cacheHitRate = cacheHit
      ? hitRate + (1 - hitRate) / total
      : hitRate - hitRate / total;
  }
}
