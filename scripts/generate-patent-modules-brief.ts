import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
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

function mixed(...parts: { text: string; bold?: boolean; italic?: boolean }[]) {
  return new Paragraph({
    spacing: { after: 120 },
    children: parts.map(p => new TextRun({ text: p.text, size: 22, font: "Calibri", bold: p.bold, italics: p.italic })),
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 50 },
        children: [new TextRun({ text: "CuraLive", size: 36, bold: true, color: "6366f1", font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 50 },
        children: [new TextRun({ text: "Patent-Strengthening Modules — Executive Brief", size: 28, bold: true, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 300 },
        children: [new TextRun({ text: "March 2026 — Plain Language Overview of 6 New Builds", size: 20, color: "666666", font: "Calibri" })],
      }),

      // Intro
      heading("Why These Were Built"),
      body("Your CIPC patent filing covers 12 modules with Claims 38-52. The stronger each claim is, the harder it is for a competitor (or an examiner) to challenge it. The gold standard is \"reduced to practice\" — meaning the invention isn't just described on paper, it's actually built and working."),
      body("These six modules were chosen because they had the biggest gap between what the patent claims and what was actually running in the platform. Now every one of them has real, working code behind it."),

      spacer(),
      // Module F
      heading("1. Sustainability Calculator", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 46", bold: true }, { text: " — Environmental Sustainability Quantification for Virtual Events" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "When you run a virtual event instead of flying everyone to a physical venue, there's a real environmental saving. This module calculates exactly how much." }),
      body("You tell it: how many attendees, how many would have flown domestically vs internationally, how many hotel nights they'd have needed, how much catering, printed materials, and venue time would have been required."),
      body("It calculates:"),
      bullet("Carbon saved (in tonnes of CO\u2082) — using the same emission factors that ESG auditors and the Carbon Disclosure Project use"),
      bullet("Cost avoided (in USD) — flights, hotels, meals, venue hire, printing, ground transport"),
      bullet("A sustainability grade from A+ to F"),
      bullet("Equivalents that make it tangible: \"This is like taking 12 cars off the road for a day\" or \"equivalent to planting 340 trees\""),
      body("It can also generate an AI-written ESG narrative suitable for an annual sustainability report or CDP submission."),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 46 describes a system that quantifies environmental impact of virtual events. Now there's a working calculator with real emission factors, not just a concept." }),

      spacer(),
      // Module K
      heading("2. Communication Index — Peer Benchmarking", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 51", bold: true }, { text: " — Communication Index: Composite IR Performance Scoring" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "CuraLive already had a \"CICI\" score — a single number that measures how well a company communicates with investors, based on sentiment, engagement, compliance, and market confidence." }),
      body("What's new is peer benchmarking. The system now compares your score against 9 industry sectors:"),
      bullet("Financial Services, Technology, Mining & Resources, Healthcare, Retail & Consumer, Industrials, Telecommunications, Energy, Real Estate"),
      body("For each sector, it tells you:"),
      bullet("Where you rank (percentile: \"You're in the top quartile for your sector\")"),
      bullet("Which dimensions you're outperforming vs underperforming (e.g., \"Your compliance quality is 12 points above the Technology sector average, but investor engagement is 5 points below\")"),
      bullet("Quarter-over-quarter trend — is your score improving, stable, or declining?"),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 51 specifically describes \"sector-peer benchmarking and historical trend analysis.\" That's now implemented, not just described." }),

      spacer(),
      // Module G
      heading("3. Market Reaction Correlation Engine", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 47", bold: true }, { text: " — Market Reaction Correlation and Prediction Engine" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "After an investor event, does the share price go up or down? And can we predict that from the communication signals during the call?" }),
      body("The module already tracked sentiment scores alongside market reactions. What's new is a real statistical engine that computes Pearson correlation coefficients — the same maths used in financial research."),
      body("It answers questions like:"),
      bullet("\"Is there a strong correlation between executive confidence scores and positive market reactions?\" (e.g., coefficient of 0.72 = strong positive)"),
      bullet("\"Do compliance flags predict negative market reactions?\" (e.g., coefficient of -0.45 = moderate negative)"),
      bullet("\"Which signal is the single strongest predictor of what the market will do?\""),
      bullet("\"What's the average 24-hour price change after events with high vs low sentiment?\""),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 47 describes a \"correlation and prediction engine.\" Having actual statistical correlation maths — not just an AI guess — makes this claim much more defensible." }),

      spacer(),
      // Module I
      heading("4. Intelligent Broadcaster + Recap Generation", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 49", bold: true }, { text: " — Intelligent Broadcaster and Automated Webcast Recap Generation" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "Two capabilities in one:" }),
      spacer(),
      mixed({ text: "Real-time presenter coaching: ", bold: true }, { text: "While someone is presenting, the system analyses their speaking pace in words per minute (WPM). The optimal range for investor communications is 130-160 WPM. If the presenter is speaking too fast or too slow, the system flags it. It also detects filler words (\"um\", \"uh\", \"like\", \"you know\", \"sort of\", \"basically\") and counts them." }),
      spacer(),
      mixed({ text: "Automatic key moment detection: ", bold: true }, { text: "The system scans the transcript in real time and flags:" }),
      bullet("Significant announcements (\"pleased to report\", \"delighted to announce\")"),
      bullet("Financial disclosures (any sentence mentioning revenue, margins, EPS with actual numbers)"),
      bullet("Forward guidance (\"guidance\", \"outlook\", \"forecast\" + specific periods)"),
      bullet("Risk warnings (\"concern\", \"headwind\", \"uncertainty\")"),
      bullet("Quotable phrases (strategic vision statements from executives)"),
      spacer(),
      mixed({ text: "Post-event recap: ", bold: true }, { text: "After the event, it generates a structured recap with an executive summary, key takeaways, notable quotes, financial figures mentioned, and recommended follow-up actions. This is ready to distribute to investors who missed the call." }),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 49 describes all three of these: pace analysis, key moment detection, and structured recap generation. All three now have working code." }),

      spacer(),
      // Module L
      heading("5. Virtual Production Studio", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 52", bold: true }, { text: " — Browser-Based Virtual Production Studio for Live Event Broadcasting" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "Think of it as a TV studio control room, but in a web browser. The system manages:" }),
      bullet("8 broadcast layout templates — single presenter, dual presenter, presenter + slides, panel discussion (up to 6 people), interview, picture-in-picture, slides only, and three-up"),
      bullet("Multiple video feed sources — presenter cameras, screen shares, pre-recorded segments, and remote guests. You can add, remove, and switch between them in real time"),
      bullet("Lower-third graphic overlays — the text banners you see at the bottom of professional broadcasts. These can show presenter name and title, company logo, and — uniquely — live data like the current sentiment score and participant count, updated in real time"),
      bullet("A broadcast preview endpoint — so you can see exactly what the audience sees before going live"),
      bullet("Recording controls — start and stop recording of the broadcast output"),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 52 specifically lists four things: (a) multiple feed management with real-time switching, (b) lower-third overlays with live data, (c) selectable layout templates, and (d) real-time preview. All four are now implemented." }),

      spacer(),
      // Module H
      heading("6. Zero-Click Registration", HeadingLevel.HEADING_2),
      mixed({ text: "Patent Claim 48", bold: true }, { text: " — Intelligent Mailing List and Zero-Click Registration System" }),
      spacer(),
      mixed({ text: "What it does: ", bold: true }, { text: "The mailing list system already supported CSV import, segmentation, and personalised invitations. What's new is true zero-click registration." }),
      body("Here's the flow:"),
      bullet("Step 1: An operator imports investor contacts via CSV (names, emails, companies, job titles)"),
      bullet("Step 2: The system generates a unique tokenised link for each person — a URL containing a secure, one-time-use code"),
      bullet("Step 3: Personalised invitations are emailed with that link"),
      bullet("Step 4: When the recipient clicks the link, they are instantly registered for the event — no form to fill out, no password to create, no confirmation page. One click and they're in."),
      body("The system uses the contact data already on file to complete the registration automatically. It's idempotent — clicking the link twice won't create a duplicate registration. And a confirmation email goes out immediately."),
      spacer(),
      mixed({ text: "Why it matters for the patent: ", bold: true }, { text: "Claim 48 describes \"tokenised registration links\" that \"automatically register recipients upon clicking without requiring any form submission.\" That's now exactly what the code does." }),

      spacer(),
      heading("Summary"),
      body("All six modules are now live, working code — not mockups or placeholders. Each one directly implements the specific technical claims in your CIPC patent filing. This significantly strengthens your \"reduced to practice\" position if the claims are ever challenged.", { italic: true }),
      spacer(),

      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 400 },
        children: [new TextRun({ text: "— End of Brief —", size: 20, color: "999999", italics: true, font: "Calibri" })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("CuraLive_Patent_Modules_Brief.docx", buffer);
  console.log("Generated: CuraLive_Patent_Modules_Brief.docx");
});
