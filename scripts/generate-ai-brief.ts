import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import * as fs from "fs";

function spacer() {
  return new Paragraph({ text: "", spacing: { after: 100 } });
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: "1a1a2e", font: "Calibri" })],
  });
}

function body(text: string, opts?: { bold?: boolean; italic?: boolean }) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Calibri", bold: opts?.bold, italics: opts?.italic })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
  });
}

function mixedParagraph(...parts: { text: string; bold?: boolean; italic?: boolean }[]) {
  return new Paragraph({
    spacing: { after: 120 },
    children: parts.map(p => new TextRun({ text: p.text, size: 22, font: "Calibri", bold: p.bold, italics: p.italic })),
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
        children: [new TextRun({ text: "CuraLive", size: 36, bold: true, color: "6366f1", font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
        children: [new TextRun({ text: "Self-Improving AI — Executive Brief", size: 28, bold: true, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: "March 2026 — Plain Language Overview", size: 20, color: "666666", font: "Calibri" })],
      }),

      // Section 1
      heading("What Is This?"),
      body("CuraLive's AI watches live investor events (earnings calls, AGMs, webcasts) and automatically scores sentiment, flags compliance risks, and measures engagement — all in real time, without anyone seeing it running."),
      body("Until now, those AI scores were fixed. If the AI got something wrong, there was no way for it to learn from that mistake."),
      mixedParagraph(
        { text: "The Self-Improving AI feature changes that. ", bold: true },
        { text: "Now, when an operator spots something the AI got wrong, they correct it — and the AI actually learns from that correction. Over time, the AI gets smarter and more accurate for each client and each type of event." },
      ),

      spacer(),
      heading("How It Works (The Simple Version)"),
      body("Think of it like training a new employee:"),
      spacer(),
      mixedParagraph(
        { text: "Step 1 — AI Does Its Job: ", bold: true },
        { text: "The AI watches an event and scores everything automatically. \"This segment sounded positive (72/100).\" \"I spotted a compliance keyword: 'forward-looking.'\"" },
      ),
      mixedParagraph(
        { text: "Step 2 — Operator Reviews: ", bold: true },
        { text: "The operator looks at the AI's work and says: \"Actually, that wasn't positive — the CEO was being cautious. I'd score it 45.\" Or: \"That 'forward-looking' flag was a false alarm — they were talking about the company's forward-looking camera product, not a financial projection.\"" },
      ),
      mixedParagraph(
        { text: "Step 3 — AI Remembers: ", bold: true },
        { text: "Every correction gets stored. The system tracks how many times operators have corrected a particular type of call, and gradually shifts its scoring to match what experienced operators actually think." },
      ),
      mixedParagraph(
        { text: "Step 4 — AI Improves: ", bold: true },
        { text: "Next time a similar event runs, the AI uses its updated thresholds. Keywords that kept getting dismissed become less sensitive. Sentiment boundaries adjust to reflect real operator judgement." },
      ),

      spacer(),
      heading("What Can Operators Actually Do?"),
      body("On any archived event, operators now see a \"Correct AI Analysis\" panel with three actions:"),
      spacer(),
      bullet("Override Sentiment — Slide the score from what the AI said to what it should be. The AI uses this to recalibrate its positive/neutral/negative boundaries for that type of event."),
      bullet("Dismiss Compliance Flags — If the AI flagged a keyword that wasn't actually a compliance concern, dismiss it. The keyword's sensitivity automatically decreases so it triggers fewer false alarms in future."),
      bullet("Add New Keywords — If the AI missed a compliance term it should have caught, add it. It immediately joins the scanning vocabulary for all future events."),

      spacer(),
      heading("The AI Learning Dashboard"),
      body("A new \"AI Learning\" tab on the Shadow Mode page shows:"),
      spacer(),
      bullet("Maturity Level — How trained the AI is, from \"Initialising\" (brand new, no corrections yet) all the way to \"Self-Evolving\" (200+ corrections, deeply calibrated). This gives you a clear sense of how much the AI has learned."),
      bullet("Adaptive Thresholds — A table showing the AI's original default scores vs. what it's learned from operators. For example: \"Positive sentiment was set at 70, but based on 15 corrections, it's now calibrated to 62 for earnings calls.\""),
      bullet("Compliance Vocabulary — The full list of keywords the AI scans for, showing which ones operators added, which ones have been dismissed a lot (lower weight), and which are still highly active."),
      bullet("Correction History — A log of every correction an operator has made, so you can see exactly what the AI has been taught."),

      spacer(),
      heading("Why This Matters"),
      spacer(),
      mixedParagraph(
        { text: "For Clients: ", bold: true },
        { text: "The AI becomes more accurate the more you use it. An AI that's been calibrated across 200 events is dramatically better than a generic out-of-the-box model. This is a competitive moat — the longer a client uses CuraLive, the better it gets for them specifically." },
      ),
      mixedParagraph(
        { text: "For Acquisition: ", bold: true },
        { text: "This is patented technology (Claims 13, 20, 21, 25, 33 in our CIPC filing). Acquirers value proprietary AI that improves with use because it creates lock-in and a data advantage that competitors can't replicate overnight." },
      ),
      mixedParagraph(
        { text: "For Operators: ", bold: true },
        { text: "Instead of just watching the AI and accepting whatever it says, operators are now active participants. Their expertise directly shapes the AI's behaviour, making their role more valuable and the output more trustworthy." },
      ),

      spacer(),
      heading("The Maths (Kept Simple)"),
      body("The AI blends its default settings with what operators have taught it:"),
      spacer(),
      body("New threshold = (Default × safety weight) + (Average operator corrections × experience weight)", { italic: true }),
      spacer(),
      body("The \"experience weight\" starts at zero (AI trusts its defaults) and gradually increases as more corrections come in, capping at 80%. So the AI never fully abandons its baseline — it always keeps 20% of the original setting as a safety net."),
      body("For compliance keywords, each dismissal slightly reduces a keyword's sensitivity using a simple formula. A keyword that gets dismissed 8 out of 10 times will have very low sensitivity, while one that's flagged correctly every time stays at full strength."),

      spacer(),
      heading("Where to Find It"),
      spacer(),
      bullet("Shadow Mode page → any archived event → \"Correct AI Analysis\" panel at the bottom"),
      bullet("Shadow Mode page → \"AI Learning\" tab (rightmost tab)"),
      bullet("All corrections and learned data are stored in three dedicated database tables"),

      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "— End of Brief —", size: 20, color: "999999", italics: true, font: "Calibri" })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("CuraLive_Self_Improving_AI_Brief.docx", buffer);
  console.log("Generated: CuraLive_Self_Improving_AI_Brief.docx");
});
