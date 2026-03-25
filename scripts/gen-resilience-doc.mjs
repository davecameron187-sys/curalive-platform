import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, ShadingType, WidthType, BorderStyle, VerticalAlign,
} from "docx";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, "../public"), { recursive: true });

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };

function fullBox(text, bg, textColor = "FFFFFF") {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: bg },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 160, bottom: 160, left: 280, right: 280 },
      borders: noBorders,
      children: text.split("\n").map((line, i) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 0 : 50, after: 0 },
        children: [new TextRun({ text: line, size: i === 0 ? 26 : 20, bold: i === 0, color: textColor })],
      })),
    })] })]
  });
}

function labelBox(text, bg) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: bg },
      margins: { top: 80, bottom: 80, left: 280, right: 280 },
      borders: noBorders,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 20, bold: true, color: "FFFFFF" })] })],
    })] })]
  });
}

function twoBoxes(items) {
  const w = 4380;
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: items.flatMap((item, idx) => {
      const cells = [];
      if (idx > 0) cells.push(new TableCell({ width: { size: 240, type: WidthType.DXA }, borders: noBorders, children: [new Paragraph({ children: [] })] }));
      cells.push(new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: item.bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        borders: noBorders,
        children: item.text.split("\n").map((line, i) => new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [new TextRun({ text: line, size: i === 0 ? 21 : 17, bold: i === 0, color: "FFFFFF" })],
        })),
      }));
      return cells;
    }) })]
  });
}

function threeBoxes(items) {
  const w = 2900;
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: items.flatMap((item, idx) => {
      const cells = [];
      if (idx > 0) cells.push(new TableCell({ width: { size: 100, type: WidthType.DXA }, borders: noBorders, children: [new Paragraph({ children: [] })] }));
      cells.push(new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: item.bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 180, right: 180 },
        borders: noBorders,
        children: item.text.split("\n").map((line, i) => new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [new TextRun({ text: line, size: i === 0 ? 21 : 17, bold: i === 0, color: "FFFFFF" })],
        })),
      }));
      return cells;
    }) })]
  });
}

function arrow(text = "\u2193") {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 70, after: 70 }, children: [new TextRun({ text, size: 28, bold: true, color: "6B7280" })] });
}

function spacer(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 100, after: 0 },
    indent: { left: 360 },
    children: [new TextRun({ text: `\u2022  ${text}`, size: 21, color: "1F2937" })],
  });
}

function step(num, text) {
  return new Paragraph({
    spacing: { before: 100, after: 0 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${num}.  `, bold: true, size: 21, color: "374151" }),
      new TextRun({ text, size: 21, color: "1F2937" }),
    ],
  });
}

function plain(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 200 },
    children: [new TextRun({ text, size: 21, color: "374151" })],
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive \u2014 Resilience, DR & BYOC Briefing",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [
      fullBox("CuraLive \u2014 Resilience & Disaster Recovery", "1D4ED8"),
      spacer(120),

      // CURRENT STATE
      labelBox("CURRENT STATE \u2014 WHAT WE HAVE TODAY", "991B1B"),
      spacer(60),
      bullet("Single cloud region (Replit \u2014 US-based infrastructure)"),
      bullet("Single PostgreSQL database instance"),
      bullet("Twilio handles all telephony \u2014 already operates globally across multiple data centres"),
      bullet("No automatic failover if the application server goes down"),
      bullet("If the server crashes, calls in progress through Twilio remain connected but the OCC interface is temporarily unavailable"),
      spacer(80),

      plain("This is normal for a platform at this stage. The architecture is ready for multi-region \u2014 it just hasn\u2019t been deployed that way yet."),

      arrow("\u2193"),

      // WHAT CAN BE PUT IN PLACE
      labelBox("WHAT CAN BE PUT IN PLACE", "065F46"),
      spacer(80),

      twoBoxes([
        { text: "\ud83c\uddf1\ud83c\udde6  PRIMARY REGION\nEU / London or South Africa\nMain application server\nPrimary database\nHandles all live traffic", bg: "065F46" },
        { text: "\ud83c\uddfa\ud83c\uddf8  SECONDARY REGION\nUS East or alternative country\nStandby application server\nReplica database\nTakes over if primary fails", bg: "1E40AF" },
      ]),

      spacer(60),
      plain("The two regions sync continuously. The secondary is a hot standby \u2014 always running, always ready, always up to date."),

      arrow("\u2193"),

      // HOW FAILOVER WORKS
      labelBox("HOW FAILOVER WORKS", "B45309"),
      spacer(60),
      step("1", "Primary region goes down (server crash, network outage, data centre issue)"),
      step("2", "Health check detects the failure within 30\u201360 seconds"),
      step("3", "DNS automatically switches all traffic to the secondary region"),
      step("4", "Replica database is promoted to primary \u2014 no data loss"),
      step("5", "Telephony continues uninterrupted \u2014 Twilio is independent and already global"),
      step("6", "Users reconnect within 1\u20132 minutes with no manual intervention"),
      spacer(60),

      fullBox("Key point: Twilio telephony has built-in global redundancy\nCalls will not drop during a server failover \u2014 only the OCC dashboard reconnects", "065F46"),

      arrow("\u2193"),

      // CLOUD OPTIONS
      labelBox("CLOUD OPTIONS FOR PRODUCTION", "5B21B6"),
      spacer(60),
      bullet("AWS \u2014 multi-region with RDS replication, Route 53 failover. Used by most financial platforms globally."),
      bullet("Azure \u2014 Microsoft\u2019s cloud. Natural fit if acquired by Microsoft. Seamless Teams integration path."),
      bullet("GCP \u2014 Google Cloud. Strong AI/ML infrastructure for the intelligence layer."),
      bullet("Any combination \u2014 CuraLive is cloud-agnostic. It runs anywhere Node.js and PostgreSQL are available."),
      spacer(60),
      plain("The platform can be mirrored across countries \u2014 for example, primary in London and secondary in Johannesburg, or primary in the EU and secondary in the US. The choice depends on where your clients are and what regulatory requirements apply."),

      spacer(200),

      // PAGE BREAK - BYOC
      fullBox("Bring Your Own Carrier (BYOC)", "1D4ED8"),
      spacer(120),

      plain("CuraLive currently uses Twilio for all telephony \u2014 dial-in, dial-out, bridge connections, and recordings. But the platform is designed so you can plug in your own carrier if you choose to."),

      arrow("\u2193"),

      labelBox("HOW IT WORKS", "B45309"),
      spacer(60),
      step("1", "You contract with a local carrier (e.g. Vodacom, BT, AT&T, or any SIP provider)"),
      step("2", "They provide SIP trunk credentials and local phone numbers"),
      step("3", "These are configured in CuraLive\u2019s telephony layer"),
      step("4", "All dial-in and dial-out calls now route through your carrier instead of Twilio"),
      step("5", "Twilio can remain as a backup / fallback carrier for redundancy"),

      arrow("\u2193"),

      labelBox("WHY YOU WOULD DO THIS", "065F46"),
      spacer(60),

      threeBoxes([
        { text: "\ud83d\udcb0  Lower Costs\nLocal carriers are often cheaper per minute than Twilio, especially at high volume", bg: "065F46" },
        { text: "\ud83c\uddf1\ud83c\udde6  Local Numbers\nGet numbers in SA, UK, US, EU \u2014 attendees dial a local number, not international", bg: "1E40AF" },
        { text: "\ud83d\udee1\ufe0f  Redundancy\nMultiple carriers means if one goes down, calls route through the other automatically", bg: "5B21B6" },
      ]),

      spacer(80),

      fullBox("Twilio also supports BYOC natively\nYou can connect your own SIP trunks through Twilio\u2019s platform and keep all the existing CuraLive integrations", "4C1D95"),

      spacer(80),

      plain("Additional carrier options already referenced in the CuraLive codebase: Telnyx (alternative to Twilio, often lower cost), Bandwidth, and Vonage. Any of these can be configured as primary or fallback carriers."),

      spacer(80),

      fullBox("Bottom line: CuraLive\u2019s telephony is not locked to any single carrier.\nYou can bring your own, use multiple for redundancy, and run local numbers in every country you operate in.", "1B4332"),

      spacer(400),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  \u2014  Confidential  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Resilience_BYOC.docx"), buf);
console.log("Done.");
