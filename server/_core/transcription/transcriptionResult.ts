export type ArchiveTranscriptionStatus =
  | "completed"
  | "pending"
  | "quota_exceeded"
  | "failed";

export type ArchiveTranscriptionResult = {
  ok: boolean;
  status: ArchiveTranscriptionStatus;
  transcriptText: string;
  errorCode?: string;
  errorMessage?: string;
  provider?: string;
};

export function isQuotaExceededError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("insufficient_quota") ||
    message.includes("QUOTA_EXCEEDED") ||
    message.includes("429")
  );
}

export function buildCompletedResult(
  transcriptText: string,
  provider = "whisper"
): ArchiveTranscriptionResult {
  return {
    ok: true,
    status: "completed",
    transcriptText,
    provider,
  };
}

export function buildQuotaExceededResult(
  error: unknown,
  provider = "whisper"
): ArchiveTranscriptionResult {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return {
    ok: false,
    status: "quota_exceeded",
    transcriptText: "",
    errorCode: "QUOTA_EXCEEDED",
    errorMessage: message,
    provider,
  };
}

export function buildFailedResult(
  error: unknown,
  provider = "whisper"
): ArchiveTranscriptionResult {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return {
    ok: false,
    status: "failed",
    transcriptText: "",
    errorCode: "TRANSCRIPTION_FAILED",
    errorMessage: message,
    provider,
  };
}
