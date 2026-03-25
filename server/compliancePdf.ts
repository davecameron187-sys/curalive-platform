/**
 * compliancePdf.ts
 * Server-side compliance certificate PDF generator using pdfmake 0.3.x.
 * Returns a Buffer containing the PDF bytes.
 */
import { createRequire } from "module";

const _require = createRequire(import.meta.url);

// pdfmake 0.3.x server-side API (CommonJS modules)
const PdfPrinter = _require("pdfmake/js/Printer.js").default;
const URLResolver = _require("pdfmake/js/URLResolver.js").default;
const vfs = _require("pdfmake/js/virtual-fs.js").default;
const helveticaFonts = _require("pdfmake/standard-fonts/Helvetica.js");

export interface CertificateData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  companyName: string;
  certType: "SOC2" | "ISO27001" | "REGULATORY";
  certId: string;
  issuedAt: string;
  reviewedBy: string;
  totalControls?: number;
  compliantControls?: number;
  flaggedStatements?: number;
  approvedStatements?: number;
}

function buildDocDefinition(data: CertificateData) {
  const typeLabel =
    data.certType === "SOC2"
      ? "SOC 2 Type II Readiness"
      : data.certType === "ISO27001"
      ? "ISO 27001 Annex A Compliance"
      : "Regulatory Compliance Review";

  const complianceScore =
    data.totalControls && data.compliantControls
      ? Math.round((data.compliantControls / data.totalControls) * 100)
      : null;

  return {
    defaultStyle: { font: "Helvetica", fontSize: 11, lineHeight: 1.4 },
    pageMargins: [60, 60, 60, 60],
    content: [
      // Header accent bar
      {
        canvas: [{ type: "rect", x: 0, y: 0, w: 475, h: 8, color: "#6366f1" }],
        margin: [0, 0, 0, 24],
      },

      // Title
      { text: "COMPLIANCE CERTIFICATE", fontSize: 22, bold: true, color: "#1e1b4b", margin: [0, 0, 0, 4] },
      { text: typeLabel, fontSize: 14, color: "#6366f1", margin: [0, 0, 0, 32] },

      // Intro
      {
        text: "This certificate confirms that the following event has undergone a structured compliance review in accordance with applicable frameworks and standards.",
        color: "#374151",
        margin: [0, 0, 0, 24],
      },

      // Details table
      {
        table: {
          widths: [160, "*"],
          body: [
            [{ text: "Certificate ID", bold: true, color: "#374151" }, { text: data.certId, color: "#111827" }],
            [{ text: "Event", bold: true, color: "#374151" }, { text: data.eventTitle, color: "#111827" }],
            [{ text: "Event ID", bold: true, color: "#374151" }, { text: data.eventId, color: "#111827" }],
            [{ text: "Organisation", bold: true, color: "#374151" }, { text: data.companyName, color: "#111827" }],
            [{ text: "Event Date", bold: true, color: "#374151" }, { text: data.eventDate, color: "#111827" }],
            [{ text: "Issued", bold: true, color: "#374151" }, { text: data.issuedAt, color: "#111827" }],
            [{ text: "Reviewed By", bold: true, color: "#374151" }, { text: data.reviewedBy, color: "#111827" }],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#e5e7eb",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 24],
      },

      // Metrics (if available)
      ...(complianceScore !== null
        ? [
            { text: "Compliance Metrics", fontSize: 13, bold: true, color: "#1e1b4b", margin: [0, 0, 0, 8] },
            {
              table: {
                widths: [140, "*"],
                body: [
                  [
                    { text: "Readiness Score", bold: true, color: "#374151" },
                    { text: `${complianceScore}%`, color: complianceScore >= 80 ? "#16a34a" : complianceScore >= 60 ? "#d97706" : "#dc2626", bold: true },
                  ],
                  [
                    { text: "Controls Assessed", bold: true, color: "#374151" },
                    { text: String(data.totalControls), color: "#111827" },
                  ],
                  [
                    { text: "Controls Compliant", bold: true, color: "#374151" },
                    { text: String(data.compliantControls), color: "#111827" },
                  ],
                  ...(data.flaggedStatements !== undefined
                    ? [
                        [
                          { text: "Statements Reviewed", bold: true, color: "#374151" },
                          { text: String(data.flaggedStatements), color: "#111827" },
                        ],
                        [
                          { text: "Statements Approved", bold: true, color: "#374151" },
                          { text: String(data.approvedStatements ?? 0), color: "#111827" },
                        ],
                      ]
                    : []),
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0,
                hLineColor: () => "#e5e7eb",
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 6,
                paddingBottom: () => 6,
              },
              margin: [0, 0, 0, 24],
            },
          ]
        : []),

      // Divider
      { canvas: [{ type: "rect", x: 0, y: 0, w: 475, h: 1, color: "#e5e7eb" }], margin: [0, 0, 0, 16] },

      // Disclaimer
      { text: "DISCLAIMER", fontSize: 9, bold: true, color: "#6b7280", margin: [0, 0, 0, 4] },
      {
        text: "This certificate is generated by the CuraLive compliance platform based on data available at the time of issuance. It does not constitute a formal audit opinion and should not be used as a substitute for an independent third-party audit.",
        fontSize: 9,
        color: "#9ca3af",
        lineHeight: 1.5,
      },

      // Footer bar
      { canvas: [{ type: "rect", x: 0, y: 0, w: 475, h: 4, color: "#6366f1" }], margin: [0, 24, 0, 0] },
    ],
  };
}

export async function generateComplianceCertificatePdf(data: CertificateData): Promise<Buffer> {
  const urlResolver = new URLResolver(vfs);
  const printer = new PdfPrinter(helveticaFonts, vfs, urlResolver);
  const docDef = buildDocDefinition(data);

  const pdfDoc = await printer.createPdfKitDocument(docDef as any);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}
