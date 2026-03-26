// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { disclosureCertificates } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { createHash } from "crypto";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function generateDisclosureCertificate(opts: {
  eventId: string;
  sessionId?: number;
  clientName: string;
  eventName: string;
  eventType: string;
  transcriptText: string;
  aiReportJson: string;
  complianceFlags: number;
  jurisdictions: string[];
}) {
  const db = await getDb();

  const transcriptHash = sha256(opts.transcriptText);
  const reportHash = sha256(opts.aiReportJson);

  const [lastCert] = await db.select({ certificateHash: disclosureCertificates.certificateHash })
    .from(disclosureCertificates).orderBy(desc(disclosureCertificates.issuedAt)).limit(1);

  const previousCertHash = lastCert?.certificateHash ?? "GENESIS";

  const hashChain = [
    { step: "transcript_capture", hash: transcriptHash, timestamp: new Date().toISOString() },
    { step: "ai_analysis", hash: reportHash, timestamp: new Date().toISOString() },
    { step: "compliance_check", hash: sha256(`${opts.complianceFlags}-${opts.jurisdictions.join(",")}`), timestamp: new Date().toISOString() },
    { step: "chain_link", hash: sha256(`${previousCertHash}-${transcriptHash}-${reportHash}`), timestamp: new Date().toISOString() },
  ];

  const complianceStatus = opts.complianceFlags === 0 ? "clean"
    : opts.complianceFlags <= 3 ? "flagged" : "review_required";

  const certificateHash = sha256(JSON.stringify(hashChain) + previousCertHash);

  const [result] = await db.insert(disclosureCertificates).values({
    eventId: opts.eventId,
    sessionId: opts.sessionId ?? null,
    clientName: opts.clientName,
    eventName: opts.eventName,
    eventType: opts.eventType,
    transcriptHash,
    reportHash,
    complianceStatus,
    complianceFlags: opts.complianceFlags,
    jurisdictions: opts.jurisdictions,
    hashChain,
    previousCertHash,
    certificateHash,
  }).returning();

  return {
    certificateId: result.id,
    certificateHash,
    complianceStatus,
    transcriptHash,
    reportHash,
    hashChain,
    previousCertHash,
    jurisdictions: opts.jurisdictions,
    issuedAt: new Date().toISOString(),
  };
}

export const disclosureCertificateRouter = router({
  generate: operatorProcedure
    .input(z.object({
      eventId: z.string(),
      sessionId: z.number().optional(),
      clientName: z.string(),
      eventName: z.string(),
      eventType: z.string(),
      transcriptText: z.string(),
      aiReportJson: z.string(),
      complianceFlags: z.number(),
      jurisdictions: z.array(z.string()).default(["JSE"]),
    }))
    .mutation(async ({ input }) => {
      return generateDisclosureCertificate(input);
    }),

  verify: protectedProcedure
    .input(z.object({ certificateHash: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [cert] = await db.select().from(disclosureCertificates)
        .where(eq(disclosureCertificates.certificateHash, input.certificateHash)).limit(1);
      if (!cert) return { valid: false, message: "Certificate not found" };

      const chain = cert.hashChain as any[];
      const recomputedHash = sha256(JSON.stringify(chain) + (cert.previousCertHash ?? "GENESIS"));
      const valid = recomputedHash === cert.certificateHash;

      return {
        valid,
        certificate: cert,
        integrityCheck: valid ? "PASSED — hash chain intact" : "FAILED — certificate may have been tampered with",
      };
    }),

  list: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(disclosureCertificates).orderBy(desc(disclosureCertificates.issuedAt)).limit(50);
  }),

  getByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [cert] = await db.select().from(disclosureCertificates)
        .where(eq(disclosureCertificates.eventId, input.eventId)).limit(1);
      return cert ?? null;
    }),
});
