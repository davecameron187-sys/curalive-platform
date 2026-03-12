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
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, size: 20, bold: true, color: "FFFFFF" })],
      })],
    })] })]
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
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: item.border }, bottom: { style: BorderStyle.SINGLE, size: 6, color: item.border }, left: { style: BorderStyle.SINGLE, size: 6, color: item.border }, right: { style: BorderStyle.SINGLE, size: 6, color: item.border } },
        shading: { type: ShadingType.SOLID, color: item.bg },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        children: item.text.split("\n").map((line, i) => new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [new TextRun({ text: line, size: i === 0 ? 21 : 17, bold: i === 0, color: item.textColor ?? "374151" })],
        })),
      }));
      return cells;
    }) })]
  });
}

function arrow(text = "↓") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 70, after: 70 },
    children: [new TextRun({ text, size: 28, bold: true, color: "6B7280" })],
  });
}

function spacer(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

const doc = new Document({
  creator: "CuraLive",
  title: "Shadow Bridge — How It All Works",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [
      fullBox("Shadow Bridge — How It All Works", "1D4ED8"),
      spacer(120),

      // Row 1 — Inputs
      threeBoxes([
        { text: "📞  Bridge Number\nExternal conference dial-in", bg: "C05621" },
        { text: "🔢  Access Code\nConference PIN / passcode", bg: "B45309" },
        { text: "🗓️  CuraLive Event\nAlready created in the OCC", bg: "065F46" },
      ]),

      arrow("↓          ↓          ↓"),

      // Row 2 — OCC
      fullBox("⚙️   OCC — Shadow Mode (CCAudioOnly)\nOperator enters bridge number + access code, then clicks Connect", "065F46"),

      arrow("↓          ↓          ↓"),

      // Row 3 — Three auto steps
      threeBoxes([
        { text: "📞  Twilio Dials\nOutbound call placed to the bridge number", bg: "1E40AF" },
        { text: "🎹  DTMF Tones\nAccess code entered automatically on the keypad", bg: "92400E" },
        { text: "🤖  Bot Joins Silently\nCuraLive is inside the external call", bg: "5B21B6" },
      ]),

      arrow("↓"),

      // Row 4 — AI capture
      fullBox("🎙️   AI Captures Everything\nTranscript  ·  Sentiment per speaker  ·  Compliance flags  ·  Full recording", "4C1D95"),

      arrow("↓"),

      // Row 5 — Outputs
      twoBoxes([
        { text: "📊  Live in OCC\nOperator sees transcript & flags in real time", bg: "F0FDF4", textColor: "065F46", border: "065F46" },
        { text: "📄  Intelligence Terminal\nFull report stored after the call ends", bg: "F5F3FF", textColor: "5B21B6", border: "5B21B6" },
      ]),

      spacer(300),

      labelBox("HOW TO SET IT UP", "374151"),
      spacer(80),

      ...["1.  Get the bridge dial-in number and access code from the client or broker.",
         "2.  Open the OCC and go to the Shadow Mode tab.",
         "3.  Select CCAudioOnly mode.",
         "4.  Enter the bridge number and access code — CuraLive saves them for next time.",
         "5.  On event day, click Connect. Everything from this point is automatic.",
         "6.  When the event ends, click Disconnect. The recording stops and the report is saved."].map(line =>
        new Paragraph({
          spacing: { before: 100, after: 0 },
          indent: { left: 360 },
          children: [new TextRun({ text: line, size: 21, color: "1F2937" })],
        })
      ),

      spacer(400),

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
writeFileSync(join(__dirname, "../public/CuraLive_ShadowBridge.docx"), buf);
console.log("Done.");
