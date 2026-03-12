// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export interface DubSegment {
  index: number;
  startTime: string;
  endTime: string;
  originalText: string;
  translatedText: string;
  phonetic?: string;
}

export interface DubResult {
  language: string;
  languageName: string;
  segmentCount: number;
  segments: DubSegment[];
  vttSubtitles: string;
  estimatedDubDurationMs: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  af: "Afrikaans", ar: "Arabic", zh: "Chinese (Mandarin)", nl: "Dutch",
  fr: "French", de: "German", hi: "Hindi", id: "Indonesian",
  it: "Italian", ja: "Japanese", ko: "Korean", pt: "Portuguese",
  ru: "Russian", es: "Spanish", sw: "Swahili", tr: "Turkish", zu: "Zulu",
};

export class LanguageDubber {
  async dubTranscript(eventId: string, targetLanguage: string): Promise<DubResult> {
    const db = getDb();

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, eventId))
      .orderBy(asc(occTranscriptionSegments.createdAt))
      .limit(100)
      .catch(() => []);

    const languageName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage.toUpperCase();

    if (!segments.length) {
      return {
        language: targetLanguage,
        languageName,
        segmentCount: 0,
        segments: [],
        vttSubtitles: "WEBVTT\n\n",
        estimatedDubDurationMs: 0,
      };
    }

    const texts = segments.map((s: any, i: number) => ({
      index: i,
      text: s.content?.slice(0, 300) ?? "",
    }));

    const prompt = `Translate these transcript segments from English to ${languageName}.

Segments: ${JSON.stringify(texts.slice(0, 30))}

Return JSON:
{
  "translations": [
    { "index": 0, "translated": "translated text here" }
  ]
}

Maintain the tone and formality of investor relations communications. Keep financial terms accurate.`;

    const translations: Record<number, string> = {};
    try {
      const raw = await invokeLLM({ prompt, systemPrompt: `You are a professional translator specialising in financial and investor relations content. Translate accurately to ${languageName}.`, response_format: { type: "json_object" } });
      const parsed = JSON.parse(raw);
      for (const t of parsed.translations ?? []) {
        translations[t.index] = t.translated;
      }
    } catch {}

    const dubSegments: DubSegment[] = segments.map((s: any, i: number) => {
      const startSec = i * 8;
      const endSec = startSec + 7;
      return {
        index: i,
        startTime: this.formatTime(startSec),
        endTime: this.formatTime(endSec),
        originalText: s.content?.slice(0, 300) ?? "",
        translatedText: translations[i] ?? s.content?.slice(0, 300) ?? "",
      };
    });

    const vtt = this.buildVTT(dubSegments);

    return {
      language: targetLanguage,
      languageName,
      segmentCount: dubSegments.length,
      segments: dubSegments,
      vttSubtitles: vtt,
      estimatedDubDurationMs: dubSegments.length * 8000,
    };
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}.000`;
  }

  private buildVTT(segments: DubSegment[]): string {
    const lines = ["WEBVTT", ""];
    for (const seg of segments) {
      lines.push(`${seg.startTime} --> ${seg.endTime}`);
      lines.push(seg.translatedText);
      lines.push("");
    }
    return lines.join("\n");
  }
}

export const languageDubber = new LanguageDubber();
