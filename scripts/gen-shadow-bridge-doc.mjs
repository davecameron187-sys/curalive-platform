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
  title: "CuraLive \u2014 Shadow Bridge & External Bridge Intelligence Guide",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      // COVER
      fullBox("CuraLive\nShadow Bridge & External Bridge Intelligence Guide\nHow CuraLive Captures Intelligence from Any Conference Call", "1D4ED8"),
      spacer(60),
      plain("This document explains how CuraLive captures live intelligence from external conference calls hosted on third-party platforms. It covers the External Bridge concept, the Shadow Bot AI listener, the Shadow Bridge setup process, and the complete technical flow.", 20),

      spacer(200),

      // ============================================
      // SECTION 1: WHAT IS THE EXTERNAL BRIDGE?
      // ============================================
      fullBox("1.  What Is the External Bridge?", "991B1B"),
      spacer(80),

      heading("The Scenario"),
      plain("A bank or broker is hosting their own investor call on their own conference platform (e.g. Arkadin, InterCall, Chorus Call). CuraLive is not running that call \u2014 they are."),

      spacer(40),

      fullBox("The Problem\n\nCuraLive still needs to capture the audio, transcript and intelligence from\nthat call \u2014 but it has no direct access to the other platform.", "DC2626"),

      spacer(40),

      fullBox("The Solution\n\nCuraLive dials into the external bridge just like a normal caller would.\nIt uses the bridge\u2019s own dial-in number and conference access code to join the call.", "065F46"),

      spacer(60),

      heading("How It Works"),
      step("1", "Operator enters the bridge dial-in number + access code in the OCC"),
      step("2", "CuraLive calls that number automatically"),
      step("3", "It enters the access code using DTMF tones (the keypad beeps)"),
      step("4", "CuraLive is now silently inside the external call \u2014 listening and capturing"),

      spacer(60),

      fullBox("Result: AI captures the transcript, sentiment and compliance data\nfrom the external call \u2014 exactly as if it were a native CuraLive event", "5B21B6"),

      spacer(40),

      fullBox("This is called CCAudioOnly mode \u2014 CuraLive is audio-only on that bridge.\nIt listens and records but does not control the other platform.", "B45309"),

      spacer(200),

      // ============================================
      // SECTION 2: SHADOW MODE \u2014 THE AI BOT
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("2.  Shadow Mode \u2014 How the AI Bot Works", "065F46"),
      spacer(80),

      heading("What Is the Shadow Bot?"),
      plain("The Shadow Bot is CuraLive\u2019s AI listener. It joins any call silently \u2014 either a native CuraLive event or an external bridge \u2014 and captures everything in real time without participating in the conversation."),

      spacer(40),

      heading("The Components"),
      spacer(20),

      threeBoxes([
        { text: "\u2699\ufe0f  OCC\nOperator activates Shadow Mode\nfrom the console", bg: "065F46" },
        { text: "\ud83d\udcde  Twilio\nMakes the actual phone\nconnection to the call", bg: "1E40AF" },
        { text: "\ud83e\udd16  AI Bot\nListens, transcribes and\nanalyses in real time", bg: "5B21B6" },
      ]),

      spacer(60),

      heading("How It Runs"),
      step("1", "Operator opens Shadow Mode in the OCC"),
      step("2", "Twilio connects the bot to the live call as an audio-only participant"),
      step("3", "Bot listens \u2014 transcribing every word in real time"),
      step("4", "Sentiment scoring and compliance analysis run live alongside the transcript"),

      spacer(60),

      fullBox("All intelligence fed live into OCC and stored permanently\nin the Intelligence Database", "5B21B6"),

      spacer(200),

      // ============================================
      // SECTION 3: EXTERNAL BRIDGE \u2014 SETUP & OPERATION
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("3.  External Bridge \u2014 Setup & Operation", "B45309"),
      spacer(80),

      labelBox("ONE-TIME SETUP  (per bridge)", "B45309"),
      spacer(40),

      step("1", "Client or broker provides their bridge dial-in number and conference access code"),
      step("2", "Operator saves these credentials against the event inside the OCC"),
      step("3", "CuraLive stores them \u2014 ready to use automatically each time that event runs"),

      spacer(60),

      labelBox("ON EVENT DAY  (automatic)", "065F46"),
      spacer(40),

      step("1", "Operator clicks \u2018Connect to Bridge\u2019 in the OCC"),
      step("2", "Twilio automatically dials the bridge\u2019s phone number"),
      step("3", "DTMF tones enter the access code \u2014 no manual keypad needed"),
      step("4", "CuraLive is now silently inside the external call"),
      step("5", "Shadow Bot activates \u2014 recording and transcription begin immediately"),

      spacer(60),

      fullBox("From this point it works exactly like a native CuraLive event \u2014\nthe operator sees live transcript, sentiment scores and\ncompliance flags in the OCC", "5B21B6"),

      spacer(40),

      fullBox("The bank or broker running the external call does not need to do\nanything special \u2014 CuraLive joins as a regular dial-in participant,\njust like any other caller.", "B45309"),

      spacer(200),

      // ============================================
      // SECTION 4: SHADOW BRIDGE \u2014 STEP-BY-STEP SETUP GUIDE
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("4.  Shadow Bridge \u2014 Step-by-Step Setup Guide", "1E3A8A"),
      spacer(80),

      labelBox("WHAT YOU NEED BEFORE YOU START", "374151"),
      spacer(40),

      bullet("The external bridge dial-in number  (e.g. +27 11 123 4567)"),
      bullet("The bridge conference access code  (e.g. 84921#)"),
      bullet("An event already created in CuraLive to attach it to"),

      spacer(60),

      labelBox("SETUP IN THE OCC  (operator does this once)", "B45309"),
      spacer(40),

      step("1", "Open Shadow Mode tab inside the OCC"),
      step("2", "Select CCAudioOnly mode"),
      step("3", "Enter the bridge dial-in number"),
      step("4", "Enter the conference access code"),
      step("5", "Click \u2018Connect to Bridge\u2019"),
      spacer(20),
      plain("CuraLive saves these details \u2014 next time it pre-fills automatically"),

      spacer(60),

      labelBox("WHAT HAPPENS WHEN YOU CLICK CONNECT", "065F46"),
      spacer(40),

      step("1", "Twilio places an outbound call to the bridge number"),
      step("2", "The system waits for the call to answer"),
      step("3", "DTMF tones are sent automatically \u2014 entering the access code on the keypad"),
      step("4", "CuraLive is now inside the external conference as a silent participant"),
      step("5", "Shadow Bot activates \u2014 recording and transcription begin"),

      spacer(60),

      fullBox("Live transcript, sentiment scores and compliance flags\nappear in the OCC in real time", "5B21B6"),

      spacer(40),

      fullBox("To end: operator clicks \u2018Disconnect\u2019 in the OCC \u2014\nTwilio hangs up the bridge call and recording stops automatically.", "374151"),

      spacer(200),

      // ============================================
      // SECTION 5: THE COMPLETE FLOW \u2014 HOW IT ALL WORKS
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("5.  Shadow Bridge \u2014 The Complete Flow", "5B21B6"),
      spacer(80),

      heading("Inputs"),
      spacer(20),

      threeBoxes([
        { text: "\ud83d\udcde Bridge Number\nExternal conference\ndial-in number", bg: "B45309" },
        { text: "\ud83d\udd22 Access Code\nConference PIN /\npasscode", bg: "B45309" },
        { text: "\ud83d\uddd3\ufe0f CuraLive Event\nAlready created\nin the OCC", bg: "065F46" },
      ]),

      arrow("\u2193"),

      heading("Operator Control"),
      fullBox("\u2699\ufe0f   OCC \u2014 Shadow Mode (CCAudioOnly)\nOperator enters bridge number + access code, then clicks Connect\n\ud83e\udd16  AI embedded \u2014 live transcript \u00b7 sentiment scoring \u00b7 compliance flags visible to the operator", "065F46"),

      arrow("\u2193"),

      heading("Connection Sequence"),
      spacer(20),

      threeBoxes([
        { text: "\ud83d\udcde Twilio Dials\nOutbound call placed\nto the bridge number", bg: "1E40AF" },
        { text: "\ud83c\udfb9 DTMF Tones\nAccess code entered\nautomatically on\nthe keypad", bg: "B45309" },
        { text: "\ud83e\udd16 Bot Joins Silently\nCuraLive is inside\nthe external call", bg: "5B21B6" },
      ]),

      arrow("\u2193"),

      heading("Output"),
      spacer(20),

      twoBoxes([
        { text: "\ud83d\udcca Live in OCC\nOperator sees transcript &\nflags in real time", bg: "065F46" },
        { text: "\ud83d\udcce Intelligence Terminal\nFull report stored after\nevent for analysis", bg: "1E40AF" },
      ]),

      spacer(200),

      // ============================================
      // SECTION 6: WHY THIS MATTERS
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("6.  Why This Matters", "1E3A8A"),
      spacer(80),

      heading("For Enterprise Clients"),
      bullet("Banks and brokers can keep using their existing conference platforms"),
      bullet("CuraLive captures intelligence without requiring the client to change anything"),
      bullet("The external platform sees CuraLive as a normal dial-in participant \u2014 no integration required"),
      bullet("All AI intelligence (transcript, sentiment, compliance) works identically on external calls"),

      spacer(40),

      heading("For the Acquisition Story"),
      bullet("Cross-platform intelligence capture is a unique competitive advantage"),
      bullet("No other platform can silently join a competitor\u2019s conference bridge and extract intelligence"),
      bullet("This capability is covered by CuraLive\u2019s patent claims (Shadow Bridge Method, Cross-Platform Intelligence)"),
      bullet("It demonstrates platform-agnostic value \u2014 CuraLive\u2019s AI works regardless of whose telephony is being used"),

      spacer(40),

      heading("For Operators"),
      bullet("One-click connection to any external bridge \u2014 no manual dialling"),
      bullet("Access codes are saved and pre-filled for recurring events"),
      bullet("Live transcript, sentiment and compliance visible in the OCC in real time"),
      bullet("Disconnect with a single click \u2014 clean, automatic teardown"),

      spacer(80),

      fullBox("CuraLive doesn\u2019t just run its own events.\nIt captures intelligence from anyone\u2019s events.\n\nThat\u2019s the moat.", "1E3A8A"),

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
writeFileSync(join(__dirname, "../public/CuraLive_Shadow_Bridge_Guide.docx"), buf);
console.log("Done.");
