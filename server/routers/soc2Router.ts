// @ts-nocheck
import { z } from "zod";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { soc2Controls, complianceEvidenceFiles } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";

const SOC2_SEED = [
  { controlId: "CC1.1", category: "CC1 - Control Environment", name: "COSO Principles and Integrity", description: "The entity demonstrates a commitment to integrity and ethical values.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC1.2", category: "CC1 - Control Environment", name: "Board Independence and Oversight", description: "The board of directors demonstrates independence from management.", status: "partial" as const, ownerName: "CEO", testingFrequency: "Annual" },
  { controlId: "CC1.3", category: "CC1 - Control Environment", name: "Organisational Structure", description: "Management establishes structure, reporting lines, and appropriate authorities.", status: "compliant" as const, ownerName: "COO", testingFrequency: "Annual" },
  { controlId: "CC1.4", category: "CC1 - Control Environment", name: "Commitment to Competence", description: "The entity demonstrates a commitment to attract, develop, and retain competent individuals.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Annual" },
  { controlId: "CC1.5", category: "CC1 - Control Environment", name: "Accountability and Performance", description: "The entity holds individuals accountable for their internal control responsibilities.", status: "partial" as const, ownerName: "HR Director", testingFrequency: "Annual" },
  { controlId: "CC2.1", category: "CC2 - Communication and Information", name: "Information Quality", description: "The entity obtains or generates and uses relevant, quality information to support internal control.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "CC2.2", category: "CC2 - Communication and Information", name: "Internal Communication", description: "The entity internally communicates information, including objectives and responsibilities for internal control.", status: "compliant" as const, ownerName: "COO", testingFrequency: "Quarterly" },
  { controlId: "CC2.3", category: "CC2 - Communication and Information", name: "External Communication", description: "The entity communicates with external parties regarding matters affecting internal control.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "CC3.1", category: "CC3 - Risk Assessment", name: "Objective Specification", description: "The entity specifies objectives with sufficient clarity to enable identification and assessment of risks.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC3.2", category: "CC3 - Risk Assessment", name: "Risk Identification and Analysis", description: "The entity identifies risks to the achievement of its objectives across the entity.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Semi-Annual" },
  { controlId: "CC3.3", category: "CC3 - Risk Assessment", name: "Fraud Risk Assessment", description: "The entity considers the potential for fraud in assessing risks to the achievement of objectives.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC3.4", category: "CC3 - Risk Assessment", name: "Change Risk Identification", description: "The entity identifies and assesses changes that could significantly impact the system of internal control.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "CC4.1", category: "CC4 - Monitoring Activities", name: "Ongoing and Separate Evaluations", description: "The entity selects, develops, and performs ongoing evaluations to ascertain whether components of internal control are present and functioning.", status: "compliant" as const, ownerName: "Internal Audit", testingFrequency: "Quarterly" },
  { controlId: "CC4.2", category: "CC4 - Monitoring Activities", name: "Deficiency Evaluation and Communication", description: "The entity evaluates and communicates internal control deficiencies in a timely manner.", status: "partial" as const, ownerName: "Internal Audit", testingFrequency: "Quarterly" },
  { controlId: "CC5.1", category: "CC5 - Control Activities", name: "Control Selection and Development", description: "The entity selects and develops control activities that contribute to the mitigation of risks.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC5.2", category: "CC5 - Control Activities", name: "Technology Controls", description: "The entity selects and develops general control activities over technology to support the achievement of objectives.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "CC5.3", category: "CC5 - Control Activities", name: "Policy Deployment", description: "The entity deploys control activities through policies that establish what is expected and procedures that put policies into action.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC6.1", category: "CC6 - Logical and Physical Access", name: "Logical Access Security", description: "The entity implements logical access security software, infrastructure, and architectures over protected information assets.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "CC6.2", category: "CC6 - Logical and Physical Access", name: "Access Provisioning", description: "Prior to issuing system credentials, the entity registers and authorizes new internal and external users.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Monthly" },
  { controlId: "CC6.3", category: "CC6 - Logical and Physical Access", name: "Access Removal", description: "The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets.", status: "partial" as const, ownerName: "IT Manager", testingFrequency: "Monthly" },
  { controlId: "CC6.4", category: "CC6 - Logical and Physical Access", name: "Physical Access Restrictions", description: "The entity restricts physical access to facilities and protected information assets to authorized personnel.", status: "compliant" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "CC6.6", category: "CC6 - Logical and Physical Access", name: "External Threat Protection", description: "The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "CC6.7", category: "CC6 - Logical and Physical Access", name: "Transmission Integrity and Confidentiality", description: "The entity restricts the transmission, movement, and removal of information to authorized users and processes.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "CC6.8", category: "CC6 - Logical and Physical Access", name: "Malware Protection", description: "The entity implements controls to prevent or detect and act upon the introduction of malicious software.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "CC7.1", category: "CC7 - System Operations", name: "Vulnerability Detection", description: "The entity uses detection and monitoring procedures to identify changes to configurations or new vulnerabilities.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "CC7.2", category: "CC7 - System Operations", name: "Anomaly Monitoring", description: "The entity monitors system components and the operation of those components for anomalies indicative of malicious acts.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "CC7.3", category: "CC7 - System Operations", name: "Security Event Evaluation", description: "The entity evaluates security events to determine whether they could or have resulted in a failure to meet its objectives.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Monthly" },
  { controlId: "CC7.4", category: "CC7 - System Operations", name: "Incident Response", description: "The entity responds to identified security incidents by executing a defined incident response program.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC7.5", category: "CC7 - System Operations", name: "Incident Recovery", description: "The entity identifies, develops, and implements activities to recover from identified security incidents.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC8.1", category: "CC8 - Change Management", name: "Change Management Process", description: "The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "CC9.1", category: "CC9 - Risk Mitigation", name: "Risk Mitigation Activities", description: "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "CC9.2", category: "CC9 - Risk Mitigation", name: "Vendor Risk Management", description: "The entity assesses and manages risks associated with vendors and business partners.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "A1.1", category: "A1 - Availability", name: "Availability Capacity Planning", description: "The entity maintains, monitors, and evaluates current processing capacity and use of system components.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "A1.2", category: "A1 - Availability", name: "Environmental Threats", description: "The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "A1.3", category: "A1 - Availability", name: "Recovery Plan Testing", description: "The entity tests recovery plan procedures supporting system recovery to meet its objectives.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "C1.1", category: "C1 - Confidentiality", name: "Confidential Information Identification", description: "The entity identifies and maintains confidential information to meet the entity objectives related to confidentiality.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "C1.2", category: "C1 - Confidentiality", name: "Confidential Information Disposal", description: "The entity disposes of confidential information to meet the entity objectives related to confidentiality.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "PI1.1", category: "PI1 - Processing Integrity", name: "Processing Completeness and Accuracy", description: "The entity obtains or generates, uses, and communicates relevant, quality information to support the functioning of internal control.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "PI1.2", category: "PI1 - Processing Integrity", name: "System Input Controls", description: "The entity implements policies and procedures over system inputs, including controls over completeness and accuracy.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "PI1.3", category: "PI1 - Processing Integrity", name: "System Processing Controls", description: "The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity objectives.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "P1.1", category: "P - Privacy", name: "Privacy Notice", description: "The entity provides notice to data subjects about its privacy practices.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "P2.1", category: "P - Privacy", name: "Consent and Choice", description: "The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "P3.1", category: "P - Privacy", name: "Collection Limitation", description: "The entity limits the collection of personal information to that necessary to meet its objectives.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "P4.1", category: "P - Privacy", name: "Use, Retention and Disposal", description: "The entity limits the use of personal information to the purposes identified in the notice.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "P5.1", category: "P - Privacy", name: "Access and Correction", description: "The entity grants identified and authenticated data subjects the ability to access their stored personal information.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "P8.1", category: "P - Privacy", name: "Privacy Monitoring and Enforcement", description: "The entity monitors compliance with its privacy objectives and addresses any privacy-related inquiries, complaints, and disputes.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
];

export const soc2Router = router({
  seedIfEmpty: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await db.select({ id: soc2Controls.id }).from(soc2Controls).limit(1);
    if (existing.length > 0) return { seeded: false, count: 0 };
    await db.insert(soc2Controls).values(SOC2_SEED);
    return { seeded: true, count: SOC2_SEED.length };
  }),

  getControls: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(soc2Controls);
      if (input?.category) return rows.filter(r => r.category === input.category);
      return rows;
    }),

  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, compliant: 0, partial: 0, nonCompliant: 0, notApplicable: 0, score: 0 };
    const rows = await db.select().from(soc2Controls);
    const total = rows.length;
    const compliant = rows.filter(r => r.status === "compliant").length;
    const partial = rows.filter(r => r.status === "partial").length;
    const nonCompliant = rows.filter(r => r.status === "non_compliant").length;
    const notApplicable = rows.filter(r => r.status === "not_applicable").length;
    const applicable = total - notApplicable;
    const score = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    return { total, compliant, partial, nonCompliant, notApplicable, score };
  }),

  getCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(soc2Controls);
    const map = new Map<string, { category: string; total: number; compliant: number; partial: number; nonCompliant: number }>();
    for (const r of rows) {
      if (!map.has(r.category)) map.set(r.category, { category: r.category, total: 0, compliant: 0, partial: 0, nonCompliant: 0 });
      const entry = map.get(r.category)!;
      entry.total++;
      if (r.status === "compliant") entry.compliant++;
      else if (r.status === "partial") entry.partial++;
      else if (r.status === "non_compliant") entry.nonCompliant++;
    }
    return Array.from(map.values());
  }),

  updateControl: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["compliant", "partial", "non_compliant", "not_applicable"]).optional(),
      ownerName: z.string().optional(),
      notes: z.string().optional(),
      testingFrequency: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length === 0) return { updated: false };
      await db.update(soc2Controls).set(filtered).where(eq(soc2Controls.id, id));
      return { updated: true };
    }),

  assignOwner: protectedProcedure
    .input(z.object({
      id: z.number(),
      ownerName: z.string().min(1).max(100),
      testingFrequency: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(soc2Controls)
        .set({ ownerName: input.ownerName, testingFrequency: input.testingFrequency ?? null })
        .where(eq(soc2Controls.id, input.id));
      return { assigned: true, ownerName: input.ownerName };
    }),

  uploadEvidence: protectedProcedure
    .input(z.object({
      controlId: z.number(),
      fileName: z.string().min(1).max(255),
      fileBase64: z.string(),
      mimeType: z.string().default("application/octet-stream"),
      expiresAt: z.number().optional(), // Unix ms
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const buf = Buffer.from(input.fileBase64, "base64");
      if (buf.byteLength > 16 * 1024 * 1024) throw new Error("File too large (max 16 MB)");
      const suffix = Date.now().toString(36);
      const fileKey = `compliance/soc2/${input.controlId}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buf, input.mimeType);
      await db.insert(complianceEvidenceFiles).values({
        controlType: "soc2",
        controlId: input.controlId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        uploadedAt: Date.now(),
        expiresAt: input.expiresAt ?? null,
      });
      return { uploaded: true, url, fileName: input.fileName };
    }),

  bulkImportCSV: protectedProcedure
    .input(z.object({
      csvBase64: z.string(), // base64-encoded CSV content
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const csv = Buffer.from(input.csvBase64, "base64").toString("utf-8");
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
      const controlIdIdx = headers.indexOf("control_id");
      const statusIdx = headers.indexOf("status");
      const ownerIdx = headers.indexOf("owner_name");
      const notesIdx = headers.indexOf("notes");
      if (controlIdIdx === -1 || statusIdx === -1) throw new Error("CSV must have 'control_id' and 'status' columns");
      const VALID_STATUSES = ["compliant", "partial", "non_compliant", "not_applicable"];
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        const controlIdVal = cols[controlIdIdx];
        const statusVal = cols[statusIdx]?.toLowerCase().replace(/ /g, "_");
        if (!controlIdVal || !statusVal) { skipped++; continue; }
        if (!VALID_STATUSES.includes(statusVal)) { errors.push(`Row ${i + 1}: invalid status '${statusVal}'`); skipped++; continue; }
        const existing = await db.select({ id: soc2Controls.id }).from(soc2Controls).where(eq(soc2Controls.controlId, controlIdVal)).limit(1);
        if (existing.length === 0) { errors.push(`Row ${i + 1}: control_id '${controlIdVal}' not found`); skipped++; continue; }
        const updateData: Record<string, string> = { status: statusVal };
        if (ownerIdx !== -1 && cols[ownerIdx]) updateData.ownerName = cols[ownerIdx];
        if (notesIdx !== -1 && cols[notesIdx]) updateData.notes = cols[notesIdx];
        await db.update(soc2Controls).set(updateData).where(eq(soc2Controls.id, existing[0].id));
        updated++;
      }
      return { updated, skipped, errors, total: lines.length - 1 };
    }),

  exportAuditZip: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const archiver = _require("archiver");
      const { Readable, PassThrough } = _require("stream");
      // Fetch all controls and evidence
      const controls = await db.select().from(soc2Controls);
      const evidence = await db.select().from(complianceEvidenceFiles).where(eq(complianceEvidenceFiles.controlType, "soc2"));
      // Build CSV
      const csvHeader = "control_id,category,name,status,owner_name,testing_frequency,notes\n";
      const csvRows = controls.map(c =>
        [c.controlId, c.category, `"${c.name}"`, c.status, c.ownerName ?? "", c.testingFrequency ?? "", `"${(c.notes ?? "").replace(/"/g, "'")}"` ].join(",")
      ).join("\n");
      const csvContent = csvHeader + csvRows;
      // Build evidence manifest
      const manifestLines = ["id,control_id,file_name,file_url,uploaded_at,expires_at"];
      for (const e of evidence) {
        manifestLines.push([e.id, e.controlId, e.fileName, e.fileUrl, new Date(e.uploadedAt).toISOString(), e.expiresAt ? new Date(e.expiresAt).toISOString() : ""].join(","));
      }
      const manifestContent = manifestLines.join("\n");
      // Build zip in memory
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        const archive = archiver("zip", { zlib: { level: 6 } });
        archive.on("data", (chunk: Buffer) => chunks.push(chunk));
        archive.on("end", resolve);
        archive.on("error", reject);
        archive.append(csvContent, { name: "soc2_controls.csv" });
        archive.append(manifestContent, { name: "evidence_manifest.csv" });
        archive.append(JSON.stringify({ framework: "SOC 2", exportedAt: new Date().toISOString(), controlCount: controls.length, evidenceCount: evidence.length }, null, 2), { name: "audit_summary.json" });
        archive.finalize();
      });
      const zipBuffer = Buffer.concat(chunks);
      const suffix = Date.now().toString(36);
      const fileKey = `compliance/exports/soc2-audit-pack-${suffix}.zip`;
      const { url } = await storagePut(fileKey, zipBuffer, "application/zip");
      return { url, fileName: `soc2-audit-pack-${new Date().toISOString().slice(0, 10)}.zip`, controlCount: controls.length, evidenceCount: evidence.length };
    }),

  getEvidenceFiles: protectedProcedure
    .input(z.object({ controlId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(complianceEvidenceFiles)
        .where(and(
          eq(complianceEvidenceFiles.controlType, "soc2"),
          eq(complianceEvidenceFiles.controlId, input.controlId)
        ))
        .orderBy(complianceEvidenceFiles.uploadedAt);
    }),

  deleteEvidence: protectedProcedure
    .input(z.object({ evidenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(complianceEvidenceFiles).where(eq(complianceEvidenceFiles.id, input.evidenceId));
      return { deleted: true };
    }),
});
