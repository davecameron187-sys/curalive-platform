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

function box(text, bg, textColor = "FFFFFF", width = 9000) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 160, bottom: 160, left: 260, right: 260 },
        borders: noBorders,
        children: text.split("\n").map((line, i) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: i === 0 ? 0 : 40, after: 0 },
            children: [new TextRun({
              text: line,
              size: i === 0 ? 24 : 19,
              bold: i === 0,
              color: textColor,
            })],
          })
        ),
      }),
    ]})]
  });
}

function threeBoxes(items) {
  // items: [{text, bg, textColor}]
  const w = 2900;
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: items.map((item, idx) => {
      const cells = [];
      if (idx > 0) {
        cells.push(new TableCell({
          width: { size: 120, type: WidthType.DXA },
          borders: noBorders,
          children: [new Paragraph({ children: [] })],
        }));
      }
      cells.push(new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: item.bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        borders: noBorders,
        children: item.text.split("\n").map((line, i) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: i === 0 ? 0 : 30, after: 0 },
            children: [new TextRun({
              text: line,
              size: i === 0 ? 21 : 17,
              bold: i === 0,
              color: item.textColor ?? "FFFFFF",
            })],
          })
        ),
      }));
      return cells;
    }).flat() })]
  });
}

function twoBoxes(items) {
  const w = 4380;
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: items.map((item, idx) => {
      const cells = [];
      if (idx > 0) {
        cells.push(new TableCell({
          width: { size: 240, type: WidthType.DXA },
          borders: noBorders,
          children: [new Paragraph({ children: [] })],
        }));
      }
      cells.push(new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: item.bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 220, right: 220 },
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: item.border ?? item.bg }, bottom: { style: BorderStyle.SINGLE, size: 6, color: item.border ?? item.bg }, left: { style: BorderStyle.SINGLE, size: 6, color: item.border ?? item.bg }, right: { style: BorderStyle.SINGLE, size: 6, color: item.border ?? item.bg } },
        children: item.text.split("\n").map((line, i) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: i === 0 ? 0 : 30, after: 0 },
            children: [new TextRun({
              text: line,
              size: i === 0 ? 21 : 17,
              bold: i === 0,
              color: item.textColor ?? "374151",
            })],
          })
        ),
      }));
      return cells;
    }).flat() })]
  });
}

function arrowRow(text = "↓") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 28, bold: true, color: "6B7280" })],
  });
}

function spacer(size = 100) {
  return new Paragraph({ spacing: { before: size, after: 0 }, children: [] });
}

function noteRow(leftText, leftBg, rightText, rightBg) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 4380, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: leftBg },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        borders: noBorders,
        children: leftText.split("\n").map((line, i) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: line, size: i === 0 ? 19 : 17, bold: i === 0, color: "FFFFFF", italics: i > 0 })],
            spacing: { before: 0, after: 20 },
          })
        ),
      }),
      new TableCell({
        width: { size: 240, type: WidthType.DXA },
        borders: noBorders,
        children: [new Paragraph({ children: [] })],
      }),
      new TableCell({
        width: { size: 4380, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: rightBg },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        borders: noBorders,
        children: rightText.split("\n").map((line, i) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: line, size: i === 0 ? 19 : 17, bold: i === 0, color: "FFFFFF", italics: i > 0 })],
            spacing: { before: 0, after: 20 },
          })
        ),
      }),
    ]})]
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive Flow Map",
  sections: [{
    properties: {
      page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
    },
    children: [
      // Title
      box("CuraLive — How It All Works", "1D4ED8"),
      spacer(120),

      // Row 1 — Inputs
      threeBoxes([
        { text: "📋  Booking Form\nOperator sets up the event", bg: "C05621" },
        { text: "📝  Registration\nAttendees sign up & get PIN", bg: "5B21B6" },
        { text: "📞  External Bridge\nThird-party conference", bg: "1E40AF" },
      ]),

      arrowRow("↓          ↓          ↓"),

      // Row 2 — OCC with AI embedded
      box("⚙️   OCC — OPERATOR CONSOLE\nCentral control room. All events, calls and participants managed here.", "065F46"),
      spacer(40),
      box("🤖   AI Intelligence  —  embedded within OCC\nLive transcription  ·  Sentiment scoring  ·  Compliance flags  —  all visible to the operator in real time", "1B4332"),

      arrowRow("↓          ↓          ↓"),

      // Row 3 — Three channels
      threeBoxes([
        { text: "📲  Dial-In\nAttendee calls → enters PIN\n→ OCC admits them", bg: "1D4ED8" },
        { text: "🎙️  Live Conference\nAll participants together\nin real time", bg: "047857" },
        { text: "📡  Dial-Out\nOCC calls participant\ndirect to their phone", bg: "92400E" },
      ]),

      arrowRow("↓"),

      // Outputs
      twoBoxes([
        { text: "📊  Intelligence Terminal\nTrends, risks & investor signals", bg: "F5F3FF", textColor: "5B21B6", border: "5B21B6" },
        { text: "📄  Reports & Analytics\nPost-event insights & recordings", bg: "F5F3FF", textColor: "5B21B6", border: "5B21B6" },
      ]),

      spacer(200),

      // Storage notes
      noteRow(
        "Booking Forms — Stored & Accessed\nEvents database. OCC reads them to load the daily event.",
        "B45309",
        "Registrations — Stored & Accessed\nRegistrations database. OCC shows them in the participant list.",
        "6D28D9"
      ),

      spacer(400),

      // Footer
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  —  Confidential  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Platform_Architecture.docx"), buf);
console.log("Done.");
