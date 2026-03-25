import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, ShadingType, WidthType, BorderStyle, VerticalAlign,
  PageBreak,
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

function arrow(text = "\u2193") {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 70, after: 70 }, children: [new TextRun({ text, size: 28, bold: true, color: "6B7280" })] });
}

function spacer(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

function bullet(text, bold = false) {
  return new Paragraph({
    spacing: { before: 80, after: 0 },
    indent: { left: 360 },
    children: [new TextRun({ text: `\u2022  ${text}`, size: 21, color: "1F2937", bold })],
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

function plain(text, size = 21) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 200 },
    children: [new TextRun({ text, size, color: "374151" })],
  });
}

function heading(text) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, size: 24, bold: true, color: "1E3A8A" })],
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive \u2014 AI Reports: Storage, Access & Delivery",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      fullBox("CuraLive\nAI Reports \u2014 Where They Live & How to Access Them", "1D4ED8"),
      spacer(60),
      plain("This document explains how CuraLive captures, processes, stores, and delivers intelligence from every event. It covers what happens automatically, what the operator can do manually, and what delivery features are still to be built."),

      spacer(200),

      // STEP 1: LIVE CAPTURE
      fullBox("Step 1 \u2014 Live Capture  (automatic, during the call)", "065F46"),
      spacer(80),

      plain("The moment a call begins, three AI systems activate simultaneously inside the OCC. No one needs to press a button \u2014 they run automatically:"),
      spacer(40),

      threeBoxes([
        { text: "\ud83c\udf99\ufe0f  Live Transcription\n\nEvery word captured in real time\nTimestamped per speaker\nStored segment by segment", bg: "065F46" },
        { text: "\ud83d\ude00  Sentiment Scoring\n\nEach speaker scored live\nPositive / negative / neutral\nVisible to operator in OCC", bg: "047857" },
        { text: "\u26a0\ufe0f  Compliance Monitoring\n\nSensitive language detected\nFlagged automatically\nOperator sees alerts in real time", bg: "1B4332" },
      ]),

      spacer(60),
      plain("All three of these run on every call \u2014 whether it\u2019s a native CuraLive event, a dial-out call, or a Shadow Bridge connection to an external conference."),

      spacer(200),

      // STEP 2: AI ANALYSIS
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("Step 2 \u2014 AI Analysis  (automatic, after the call ends)", "B45309"),
      spacer(80),

      plain("Once the call ends, the AI reads through everything it captured and generates a full intelligence report. This happens automatically \u2014 the operator does not need to trigger it."),
      spacer(40),

      plain("The AI produces:"),
      bullet("Full event summary \u2014 what was discussed, the key topics covered"),
      bullet("Key moments \u2014 the most important statements, turning points, or decisions"),
      bullet("Sentiment summary \u2014 overall tone per speaker across the entire call"),
      bullet("Q&A analysis \u2014 what investors asked and how management responded"),
      bullet("Compliance summary \u2014 anything that was flagged during the event"),
      spacer(40),

      fullBox("This is the core intelligence product.\nEvery event produces a complete report without any human effort.", "065F46"),

      spacer(200),

      // STEP 3: WHERE IT'S STORED
      fullBox("Step 3 \u2014 Where It\u2019s Stored  (database)", "5B21B6"),
      spacer(80),

      plain("The intelligence data is stored permanently across several database tables:"),
      spacer(40),

      twoBoxes([
        { text: "\ud83d\udcbe  intelligence_reports\n\nThe main report \u2014 summary, key moments,\nsentiment breakdown, Q&A analysis.\nOne record per event.", bg: "5B21B6" },
        { text: "\ud83d\udcbe  aggregate_intelligence\n\nAnonymised data across all events \u2014\ntrends, patterns, industry benchmarks.\nFeeds the Intelligence Terminal.", bg: "4C1D95" },
      ]),

      spacer(60),

      twoBoxes([
        { text: "\ud83d\udcbe  occ_transcription_segments\n\nRaw transcript \u2014 every word,\ntimestamped, per speaker.\nSearchable and editable after the call.", bg: "6D28D9" },
        { text: "\ud83d\udcbe  investor_questions +\nmarket_reaction_correlations\n\nQ&A data and market signals\ncaptured during the event.", bg: "7C3AED" },
      ]),

      spacer(60),
      plain("All of this data is linked to the event. It stays in the database permanently and can be accessed at any time, months or years later."),

      spacer(200),

      // STEP 4: HOW YOU ACCESS IT
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("Step 4 \u2014 How You Access It  (three pages in the platform)", "1E40AF"),
      spacer(80),

      threeBoxes([
        { text: "\ud83d\udcca  Intelligence Terminal\n/intelligence-terminal\n\nBloomberg-style dashboard\nshowing trends across\nALL events over time", bg: "1E40AF" },
        { text: "\ud83d\udcc4  Intelligence Report\n/intelligence-report\n\nPer-event report with\nfull summary, key moments\nand sentiment breakdown", bg: "1D4ED8" },
        { text: "\ud83d\uddd2\ufe0f  Transcript Page\n/transcript\n\nFull word-for-word transcript\nSearchable and editable\nby operators", bg: "2563EB" },
      ]),

      spacer(80),

      heading("Intelligence Terminal \u2014 the big picture"),
      plain("This is the dashboard that shows patterns across all your events. It answers questions like: are investor concerns getting worse? Is sentiment trending down in a sector? What topics are coming up more often? This is where the anonymised benchmarking dataset lives \u2014 one of CuraLive\u2019s most valuable assets for acquisition."),

      heading("Intelligence Report \u2014 per-event deep dive"),
      plain("After each event, this page shows the complete report: what was discussed, the key moments AI identified, how each speaker\u2019s sentiment tracked, what the Q&A revealed, and what was flagged for compliance. This is what would be sent to the client."),

      heading("Transcript Page \u2014 the raw record"),
      plain("The full word-for-word transcript, timestamped and attributed to each speaker. Operators can search it, edit errors, and add annotations. This is the evidence trail \u2014 it proves what was said and when."),

      spacer(200),

      // STEP 5: AUTO vs MANUAL
      fullBox("Automatic vs Manual  \u2014 What Runs by Itself", "374151"),
      spacer(80),

      twoBoxes([
        { text: "\u2705  AUTOMATIC (built & working)\n\nLive transcription during every call\nLive sentiment scoring per speaker\nLive compliance flag detection\nAI report generated after call ends\nData stored to all tables automatically\nIntelligence Terminal updates itself\nAggregate benchmarks recalculated", bg: "065F46" },
        { text: "\u270f\ufe0f  MANUAL (available to operators)\n\nRe-trigger AI report for any event\nEdit transcript after the call\nAdd notes and annotations\nSearch across all transcripts\nView historical reports at any time\nCompare events side by side\nin the Intelligence Terminal", bg: "1E40AF" },
      ]),

      spacer(120),

      labelBox("WHAT\u2019S NOT YET BUILT  (delivery to the client)", "991B1B"),
      spacer(60),

      twoBoxes([
        { text: "\ud83d\udd32  PDF Export\n\nOperator generates a formatted PDF\nof the Intelligence Report and\nforwards it to the client by email", bg: "991B1B" },
        { text: "\ud83d\udd32  Auto Email\n\nThe platform automatically emails\nthe completed report to the client\nwhen the event ends \u2014 no operator needed", bg: "7F1D1D" },
      ]),

      spacer(60),
      plain("Right now, clients must log into CuraLive to view their reports. PDF export and auto-email are the next two delivery features to build. Once these are in place, the full lifecycle is complete: capture \u2192 analyse \u2192 store \u2192 deliver."),

      spacer(200),

      // SUMMARY
      fullBox("Summary \u2014 The Full Lifecycle", "1E3A8A"),
      spacer(80),

      step("1", "Call begins \u2192 AI captures transcript, sentiment and compliance flags in real time"),
      step("2", "Call ends \u2192 AI generates the full intelligence report automatically"),
      step("3", "Report stored \u2192 linked to the event permanently in the database"),
      step("4", "Operator and client access reports via Intelligence Terminal, Intelligence Report, or Transcript pages"),
      step("5", "Aggregate data feeds the anonymised benchmarking dataset across all events"),
      spacer(40),

      fullBox("Everything from capture to storage is fully automatic.\nThe only gap is the final delivery step \u2014 getting the report out to the client via PDF or email.", "065F46"),

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
writeFileSync(join(__dirname, "../public/CuraLive_AI_Reports.docx"), buf);
console.log("Done.");
