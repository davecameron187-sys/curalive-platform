import {
  ArchiveTranscriptionResult,
  buildCompletedResult,
  buildFailedResult,
  buildQuotaExceededResult,
  isQuotaExceededError,
} from "./transcriptionResult";

async function tryGeminiTranscribe(buffer: Buffer, filename: string): Promise<ArchiveTranscriptionResult> {
  const geminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const geminiApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!geminiBaseUrl || !geminiApiKey) {
    return buildFailedResult(new Error("Gemini not configured"), "gemini");
  }

  const ext = (filename.split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "wav", "m4a", "ogg", "flac", "webm", "mp4"].includes(ext) ? ext : "mp3";
  const mimeType = safeExt === "mp4" ? "video/mp4" : `audio/${safeExt}`;
  const base64Audio = buffer.toString("base64");

  console.log(`[TranscribeArchive] Using Gemini for retry transcription (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);

  const url = `${geminiBaseUrl.replace(/\/+$/, "")}/models/gemini-2.5-flash:generateContent`;
  const body = {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: mimeType, data: base64Audio } },
        { text: "Transcribe this audio recording accurately and completely. This is an investor event recording (earnings call, AGM, webcast, etc.). Include all speech verbatim — every word spoken. Preserve speaker names/labels if identifiable. Output only the transcript text, no commentary or analysis. Use proper punctuation and paragraph breaks between different speakers or topics." },
      ],
    }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    if (response.status === 429) {
      return buildQuotaExceededResult(new Error(`Gemini quota exceeded: ${errText}`), "gemini");
    }
    return buildFailedResult(new Error(`Gemini API failed (${response.status}): ${errText}`), "gemini");
  }

  const result = await response.json();
  const text = (result.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  if (!text) {
    return buildFailedResult(new Error("Gemini returned empty transcript"), "gemini");
  }
  console.log(`[TranscribeArchive] Gemini transcription complete — ${text.split(/\s+/).filter(Boolean).length} words`);
  return buildCompletedResult(text, "gemini");
}

async function tryWhisperTranscribe(buffer: Buffer, filename: string): Promise<ArchiveTranscriptionResult> {
  const hasIntegrationKey = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim());
  const hasDirectKey = !!(process.env.OPENAI_API_KEY?.trim());

  let apiKey: string;
  let baseUrl: string;

  if (hasIntegrationKey) {
    apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY!.trim();
    baseUrl = (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com").replace(/\/+$/, "");
  } else if (hasDirectKey) {
    apiKey = process.env.OPENAI_API_KEY!.trim();
    baseUrl = "https://api.openai.com";
  } else if (process.env.BUILT_IN_FORGE_API_KEY && process.env.BUILT_IN_FORGE_API_URL) {
    apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    baseUrl = process.env.BUILT_IN_FORGE_API_URL.replace(/\/+$/, "");
  } else {
    return buildFailedResult(new Error("No OpenAI API key configured for transcription"), "whisper");
  }

  const ext = (filename.split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "wav", "m4a", "ogg", "flac", "webm", "mp4"].includes(ext) ? ext : "mp3";
  const mimeType = safeExt === "mp4" ? "video/mp4" : `audio/${safeExt}`;

  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, `audio.${safeExt}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("prompt", "Transcribe this investor event recording accurately, including speaker names and financial terminology.");

  const url = `${baseUrl}/v1/audio/transcriptions`;
  console.log(`[TranscribeArchive] Sending ${(buffer.length / 1024 / 1024).toFixed(1)}MB to Whisper API`);

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Accept-Encoding": "identity" },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    if (response.status === 429) {
      return buildQuotaExceededResult(new Error(`Whisper API quota exceeded (429): ${errText}`), "whisper");
    }
    return buildFailedResult(new Error(`Whisper API failed (${response.status}): ${errText}`), "whisper");
  }

  const result = await response.json();
  return buildCompletedResult((result.text ?? "").trim(), "whisper");
}

export async function transcribeArchiveAudio(
  savedRecordingPath: string
): Promise<ArchiveTranscriptionResult> {
  try {
    const path = await import("path");
    const { readFile } = await import("fs/promises");

    const fullPath = path.resolve(process.cwd(), "uploads", "recordings", path.basename(savedRecordingPath));
    const buffer = await readFile(fullPath);
    const filename = path.basename(savedRecordingPath);

    const geminiResult = await tryGeminiTranscribe(buffer, filename);
    if (geminiResult.ok) return geminiResult;

    console.warn(`[TranscribeArchive] Gemini failed (${geminiResult.errorMessage?.substring(0, 80)}), trying Whisper...`);
    return await tryWhisperTranscribe(buffer, filename);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return buildQuotaExceededResult(error, "unknown");
    }
    return buildFailedResult(error, "unknown");
  }
}
