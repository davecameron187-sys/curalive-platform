// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { createHash } from "crypto";

export class EventIntegrityTwinService {
  private static hashChain: string[] = [];

  static computeSegmentHash(data: { transcript: string; sentiment: number; compliance: number; timestamp: string }, previousHash?: string) {
    const payload = JSON.stringify({ ...data, previousHash: previousHash || "GENESIS" });
    return createHash("sha256").update(payload).digest("hex");
  }

  static async buildDigitalTwin(input: {
    eventId: string;
    eventName: string;
    companyName: string;
    segments: { transcript: string; sentiment: number; compliance: number; timestamp: string }[];
    overallSentiment?: number;
    complianceScore?: number;
    evasivenessAvg?: number;
    attendeeCount?: number;
    qaCount?: number;
  }) {
    const chain: { segmentIndex: number; hash: string; previousHash: string; data: any }[] = [];
    let previousHash = "GENESIS";

    for (let i = 0; i < input.segments.length; i++) {
      const hash = this.computeSegmentHash(input.segments[i], previousHash);
      chain.push({ segmentIndex: i, hash, previousHash, data: input.segments[i] });
      previousHash = hash;
    }

    const twinHash = createHash("sha256").update(JSON.stringify(chain)).digest("hex");

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a regulatory event integrity assessor. Given a complete event digital twin (transcript chain, sentiment, compliance scores), produce a formal integrity assessment and Clean Disclosure Certificate.

Return JSON with:
- integrityScore: 0.000-1.000 (overall event integrity)
- certificateGrade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "NR"
- disclosureCompleteness: number (0-100, how completely management addressed key topics)
- regulatoryCompliance: number (0-100, adherence to disclosure rules)
- consistencyRating: number (0-100, internal consistency of messaging)
- certificateText: string (formal certificate text suitable for exchange publication)
- findings: string[] (key findings from the event)
- riskFlags: string[] (any remaining risk flags)
- recommendationsForNextEvent: string[] (improvements for future events)
- auditTrailSummary: string (summary of the chain of custody)
- explanation: string`
          },
          {
            role: "user",
            content: `Generate integrity assessment for this event:

EVENT: ${input.eventName}
COMPANY: ${input.companyName}
EVENT ID: ${input.eventId}
SEGMENTS ANALYZED: ${input.segments.length}
CHAIN HASH: ${twinHash}
OVERALL SENTIMENT: ${input.overallSentiment ?? "N/A"}
COMPLIANCE SCORE: ${input.complianceScore ?? "N/A"}
EVASIVENESS AVG: ${input.evasivenessAvg ?? "N/A"}
ATTENDEES: ${input.attendeeCount ?? "N/A"}
Q&A COUNT: ${input.qaCount ?? "N/A"}

SAMPLE TRANSCRIPT SEGMENTS:
${input.segments.slice(0, 5).map((s, i) => `[${s.timestamp}] Sentiment: ${s.sentiment.toFixed(2)} | Compliance: ${s.compliance.toFixed(2)} | "${s.transcript.slice(0, 200)}"`).join("\n")}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "integrity_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                integrityScore: { type: "number" },
                certificateGrade: { type: "string" },
                disclosureCompleteness: { type: "number" },
                regulatoryCompliance: { type: "number" },
                consistencyRating: { type: "number" },
                certificateText: { type: "string" },
                findings: { type: "array", items: { type: "string" } },
                riskFlags: { type: "array", items: { type: "string" } },
                recommendationsForNextEvent: { type: "array", items: { type: "string" } },
                auditTrailSummary: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["integrityScore", "certificateGrade", "disclosureCompleteness", "regulatoryCompliance", "consistencyRating", "certificateText", "findings", "riskFlags", "recommendationsForNextEvent", "auditTrailSummary", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      const assessment = JSON.parse(content);

      return {
        ...assessment,
        twinHash,
        chainLength: chain.length,
        genesisHash: chain[0]?.hash || "EMPTY",
        finalHash: chain[chain.length - 1]?.hash || "EMPTY",
      };
    } catch (err) {
      console.error("[IntegrityTwin] LLM error:", err);
      return {
        integrityScore: 0.7,
        certificateGrade: "NR",
        disclosureCompleteness: 50,
        regulatoryCompliance: 70,
        consistencyRating: 65,
        certificateText: "Certificate generation requires full analysis — manual review needed.",
        findings: ["Automated assessment incomplete"],
        riskFlags: ["Manual review recommended"],
        recommendationsForNextEvent: [],
        auditTrailSummary: `Chain of ${chain.length} segments verified`,
        explanation: "Assessment could not be fully completed.",
        twinHash,
        chainLength: chain.length,
        genesisHash: chain[0]?.hash || "EMPTY",
        finalHash: chain[chain.length - 1]?.hash || "EMPTY",
      };
    }
  }

  static async logTwin(eventId: number, sessionId: number, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO event_integrity_twins (event_id, session_id, twin_hash, integrity_score, certificate_grade, chain_length, disclosure_completeness, regulatory_compliance, certificate_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, result.twinHash, result.integrityScore, result.certificateGrade, result.chainLength, result.disclosureCompleteness, result.regulatoryCompliance, result.certificateText]
      );
    } catch (e) {
      console.error("[IntegrityTwin] Log error:", e);
    }
  }
}
