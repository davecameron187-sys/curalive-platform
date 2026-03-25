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

function fullBox(text, bg, tc = "FFFFFF") {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: bg },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 180, bottom: 180, left: 300, right: 300 },
      borders: noBorders,
      children: text.split("\n").map((line, i) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 0 : 60, after: 0 },
        children: [new TextRun({ text: line, size: i === 0 ? 28 : 20, bold: i === 0, color: tc })],
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
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 22, bold: true, color: "FFFFFF" })] })],
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

function sH(text) {
  return new Paragraph({ spacing: { before: 400, after: 160 }, children: [new TextRun({ text, size: 26, bold: true, color: "1E3A8A" })] });
}

function sH2(text) {
  return new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text, size: 22, bold: true, color: "374151" })] });
}

function p(text) {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun({ text, size: 21, color: "1F2937" })] });
}

function pBold(text) {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun({ text, size: 21, color: "1F2937", bold: true })] });
}

function b(text) {
  return new Paragraph({ spacing: { before: 60, after: 60 }, indent: { left: 400 }, children: [new TextRun({ text: `\u2022  ${text}`, size: 20, color: "1F2937" })] });
}

function sp(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

function pb() {
  return new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] });
}

function tableRow(cells, header = false) {
  return new TableRow({
    children: cells.map((cell, i) => new TableCell({
      width: { size: i === 0 ? 3000 : (9000 - 3000) / (cells.length - 1), type: WidthType.DXA },
      shading: header ? { type: ShadingType.SOLID, color: "1E3A8A" } : (i % 2 === 0 ? undefined : undefined),
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [new TextRun({ text: cell, size: 19, bold: header || i === 0, color: header ? "FFFFFF" : "1F2937" })],
      })],
    })),
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      tableRow(headers, true),
      ...rows.map(r => tableRow(r)),
    ],
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive \u2014 Founder Transition Strategy, Shareholding & Patent Timeline",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      // COVER
      fullBox("CuraLive\nFounder Transition Strategy\nShareholding, Patent Timeline & Exit Plan", "1E3A8A"),
      sp(60),
      p("Prepared for David Cameron \u2014 Founder & Creator of CuraLive"),
      p("This document outlines the complete strategy for transitioning from current employment to full-time CuraLive ownership, partner shareholding structure, intellectual property protection timeline, and exit scenarios."),
      sp(40),
      fullBox("CONFIDENTIAL \u2014 FOR LEGAL REVIEW", "991B1B"),

      pb(),

      // ============ SECTION 1: SITUATION ============
      sH("1. Current Situation"),
      sp(40),

      p("David Cameron is the creator and sole builder of CuraLive, an AI-powered investor communications intelligence platform. The platform is fully functional with proprietary features including:"),
      b("Autonomous AI intelligence engine (transcription, sentiment, compliance)"),
      b("Shadow Bridge cross-platform capture method (patentable)"),
      b("Embedded real-time AI within the Operator Control Console"),
      b("Self-evolving intelligence models that improve with every event"),
      b("Anonymised industry benchmarking dataset"),
      sp(40),

      p("David is currently employed as General Manager at Chorus Call South Africa. He cannot immediately transition to CuraLive full-time as his salary is required to cover living expenses."),
      sp(40),

      p("A potential partner has been identified who would serve as the public face of CuraLive during the transition period. This partner would bring business development and client relationship management capabilities. No capital injection is proposed."),
      sp(40),

      fullBox("Key constraint: David must maintain income continuity throughout the transition.\nCuraLive revenue must match or exceed current salary before full-time transition.", "374151"),

      pb(),

      // ============ SECTION 2: TRANSITION PHASES ============
      sH("2. Three-Phase Transition Plan"),
      sp(40),

      // PHASE 1
      labelBox("PHASE 1 \u2014 STEALTH BUILD", "065F46"),
      sp(40),
      p("Duration: Months 1\u201312"),
      p("David remains at Chorus Call. Partner becomes the public face of CuraLive."),
      sp(20),

      sH2("What happens in this phase:"),
      b("Partner handles all client-facing activity \u2014 proposals, meetings, pitches, event coordination"),
      b("David continues platform development on his own time, using his own equipment"),
      b("CuraLive begins processing its first events and generating revenue"),
      b("David receives a founder\u2019s consulting fee from CuraLive revenue for technical work"),
      b("Partner receives a business development fee for client management work"),
      b("Patent filed with CIPC to establish priority date"),
      sp(20),

      sH2("Critical rules for Phase 1:"),
      b("All CuraLive work must be done on personal time and personal equipment \u2014 never on Chorus Call resources"),
      b("David\u2019s name does not appear publicly in CuraLive client-facing materials"),
      b("CuraLive and Chorus Call operations remain completely separate"),
      b("David\u2019s employment contract must be reviewed by a lawyer before any CuraLive activity begins"),
      sp(20),

      fullBox("Priority action: Have a lawyer review the Chorus Call employment contract\nfor restraint of trade and IP assignment clauses.", "991B1B"),

      sp(80),

      // PHASE 2
      labelBox("PHASE 2 \u2014 REVENUE RAMP", "B45309"),
      sp(40),
      p("Duration: Months 6\u201318 (overlaps with Phase 1)"),
      p("CuraLive revenue is growing. David\u2019s income from CuraLive increases month by month."),
      sp(20),

      sH2("What happens in this phase:"),
      b("CuraLive processes increasing numbers of events"),
      b("The AI models improve with each event (self-evolving capability)"),
      b("The benchmarking dataset grows and becomes statistically meaningful"),
      b("David\u2019s founder consulting fee grows in line with revenue"),
      b("David begins planning exit timeline from Chorus Call"),
      sp(20),

      sH2("Transition trigger:"),
      p("David transitions to Phase 3 when CuraLive revenue consistently covers his monthly living expenses for at least 3 consecutive months."),
      sp(20),

      fullBox("Do not rush this. The transition trigger is financial readiness, not impatience.\nThree consecutive months of sufficient income = green light.", "374151"),

      sp(80),

      // PHASE 3
      labelBox("PHASE 3 \u2014 FULL TRANSITION", "1E3A8A"),
      sp(40),
      p("Duration: Month 12\u201324 onwards"),
      p("David resigns from Chorus Call, becomes full-time CEO of CuraLive."),
      sp(20),

      sH2("What happens in this phase:"),
      b("David becomes the public face and CEO of CuraLive"),
      b("Partner continues in business development and client management role"),
      b("Founder consulting fee converts to a formal CEO salary"),
      b("Chorus Call partnership may be formalised (see Section 5)"),
      b("PCT patent filing (international) completed within 12 months of CIPC filing"),
      b("Company targets 500+ events to reach key valuation milestones"),

      pb(),

      // ============ SECTION 3: SHAREHOLDING ============
      sH("3. Shareholding Structure"),
      sp(40),

      sH2("Equity Ownership (determines sale proceeds):"),
      sp(20),

      simpleTable(
        ["Shareholder", "Equity", "Rationale"],
        [
          ["David Cameron", "75%", "Creator, IP owner, patent holder, technical founder"],
          ["Partner", "20%", "Business face, client relationships, BD during transition"],
          ["Option Pool", "5%", "Reserved for future key hires"],
        ]
      ),

      sp(60),

      sH2("Operating Profit Distribution (during business operations):"),
      sp(20),

      simpleTable(
        ["Shareholder", "Profit Share", "Notes"],
        [
          ["David Cameron", "60%", "Reflects IP creation + ongoing technical work"],
          ["Partner", "40%", "Reflects active client-facing role during transition"],
        ]
      ),

      sp(40),

      p("The operating profit split of 60/40 applies during the transition period while the partner is serving as the primary face of the business. This split may be reviewed once David transitions full-time, at which point a 65/35 or 70/30 split may be more appropriate to reflect the equity position more closely."),

      sp(60),

      sH2("On a Capital Event (sale, acquisition, or IPO):"),
      sp(20),

      p("All proceeds from a capital event are distributed according to equity ownership:"),
      sp(20),

      simpleTable(
        ["Shareholder", "Equity", "At $50M Sale", "At $150M Sale", "At $300M Sale"],
        [
          ["David Cameron", "75%", "$37.5M", "$112.5M", "$225M"],
          ["Partner", "20%", "$10M", "$30M", "$60M"],
          ["Option Pool", "5%", "$2.5M", "$7.5M", "$15M"],
        ]
      ),

      sp(60),

      fullBox("Operating profits = 60/40 (generous to partner during active operations)\nSale proceeds = 75/20/5 (reflects IP creation and founding contribution)", "065F46"),

      pb(),

      // ============ SECTION 4: PARTNER VESTING ============
      sH("4. Partner Equity Vesting Schedule"),
      sp(40),

      p("The partner\u2019s 20% equity allocation should not be granted in full on day one. The following performance-based vesting schedule protects both parties:"),
      sp(20),

      simpleTable(
        ["Tranche", "Equity", "Trigger", "Rationale"],
        [
          ["Tranche 1", "7%", "On signing shareholders' agreement", "Good faith commitment"],
          ["Tranche 2", "7%", "First revenue milestone reached", "Proves business delivery"],
          ["Tranche 3", "6%", "After 2 years active involvement", "Ensures long-term commitment"],
        ]
      ),

      sp(40),

      p("If the partner leaves before all tranches vest, they retain only the vested portions. Unvested equity returns to David\u2019s allocation."),
      sp(20),

      p("The revenue milestone for Tranche 2 should be agreed between both parties and documented in the shareholders\u2019 agreement. A suggested milestone is R500,000 in cumulative confirmed revenue."),

      pb(),

      // ============ SECTION 5: CHORUS CALL EXIT ============
      sH("5. Chorus Call Exit Strategy"),
      sp(40),

      sH2("The opportunity:"),
      p("CuraLive does not compete with Chorus Call. Chorus Call provides conferencing infrastructure \u2014 the bridge, the operator, the broadcast capability. CuraLive adds an AI intelligence layer on top of that infrastructure. CuraLive makes Chorus Call\u2019s service more valuable, not less."),
      sp(20),

      sH2("Positioning CuraLive to Chorus Call:"),
      p("CuraLive should be positioned as a technology partner, not a competitor. The pitch:"),
      sp(20),
      b("Chorus Call offers CuraLive as a premium AI intelligence add-on to their existing conferencing service"),
      b("Chorus Call clients receive AI-generated intelligence reports (sentiment, compliance, key moments) for every event"),
      b("Chorus Call charges a premium for events that include the CuraLive intelligence layer"),
      b("CuraLive receives a technology fee for processing each event"),
      b("All Chorus Call offices globally could adopt CuraLive \u2014 generating hundreds of events per year"),
      sp(20),

      fullBox("If all Chorus Call offices globally use CuraLive, that could deliver\n500\u20131,000 events per year \u2014 hitting the key valuation milestones within 12\u201324 months.", "065F46"),

      sp(40),

      sH2("How to approach the conversation:"),
      b("Do not pitch this as \u201CI\u2019m leaving to start a competitor\u201D"),
      b("Pitch it as \u201CI\u2019ve developed an AI platform that adds significant value to Chorus Call\u2019s offering\u201D"),
      b("Propose a reseller or technology partnership agreement"),
      b("Demonstrate the platform with a live event to show the intelligence output"),
      b("Negotiate a licensing or per-event fee structure"),
      sp(20),

      sH2("Risk mitigation:"),
      p("If Chorus Call attempts to build their own intelligence layer:"),
      b("The CIPC patent (and subsequent PCT filing) protects the Shadow Bridge method, autonomous AI intelligence, and self-evolving platform capabilities"),
      b("CuraLive\u2019s head start in data (benchmarking dataset) cannot be replicated \u2014 it requires hundreds of processed events"),
      b("Building from scratch would take 18\u201324 months of engineering \u2014 licensing CuraLive is faster and cheaper"),

      pb(),

      // ============ SECTION 6: PATENT TIMELINE ============
      sH("6. Patent Protection Timeline"),
      sp(40),

      p("A CIPC provisional patent covers South Africa only. International protection requires additional filings within specific timeframes."),
      sp(20),

      simpleTable(
        ["Step", "Action", "Deadline", "Estimated Cost"],
        [
          ["Step 1", "File provisional patent with CIPC", "Now", "R590 filing fee"],
          ["Step 2", "File PCT application (international)", "Within 12 months of CIPC", "$3,000\u2013$5,000 USD"],
          ["Step 3", "Enter national phase \u2014 United States", "Within 30 months of CIPC", "$3,000\u2013$5,000 USD"],
          ["Step 4", "Enter national phase \u2014 EPO (Europe/UK)", "Within 31 months of CIPC", "$3,000\u2013$5,000 USD"],
          ["Step 5", "CIPC complete specification (SA)", "Within 12 months of provisional", "R1,000\u2013R3,000"],
        ]
      ),

      sp(40),

      sH2("Priority countries for CuraLive:"),
      b("United States \u2014 Microsoft, Zoom, Bloomberg are US-based. Most important jurisdiction for acquisition."),
      b("United Kingdom \u2014 Major financial market. London is a key investor communications hub."),
      b("European Union (via EPO) \u2014 Covers multiple EU countries with one filing."),
      b("South Africa \u2014 Already covered by CIPC filing."),
      sp(20),

      fullBox("File CIPC now to lock in priority date.\nFile PCT in month 10\u201311 to maximise time before spending PCT fees.\nPCT buys another 18\u201319 months to choose specific countries.", "1E3A8A"),

      pb(),

      // ============ SECTION 7: IP PROTECTION ============
      sH("7. Intellectual Property Protection"),
      sp(40),

      sH2("Patent ownership:"),
      p("The patent is filed in David Cameron\u2019s personal name. It is licensed to CuraLive (Pty) Ltd under a formal IP licence agreement. This structure ensures that:"),
      b("If the partnership fails, David retains full ownership of the IP"),
      b("If the company is sold, the IP licence is included in the sale (increasing company value)"),
      b("The partner cannot claim co-ownership of the patent"),
      sp(20),

      sH2("What the patent protects (25 claims):"),
      b("System claims (1\u201315): AI monitoring, cross-platform capture, embedded OCC intelligence, anonymised benchmarking, self-improving models, compliance intervention, agentic orchestration"),
      b("Method claims (16\u201320): Shadow Bridge process, anonymised benchmark generation, human-AI collaborative management, self-improving model pipeline"),
      b("Autonomous evolution claims (21\u201325): Self-evolving platform, autonomous pattern discovery, predictive pre-event briefings, autonomous benchmark recalculation"),
      sp(20),

      fullBox("The IP stays in David\u2019s name until a shareholders\u2019 agreement is signed.\nOnly then is a formal licence granted to the company.", "991B1B"),

      pb(),

      // ============ SECTION 8: INCOME ============
      sH("8. Income Structure During Transition"),
      sp(40),

      sH2("Phase 1 & 2 (while David is at Chorus Call):"),
      sp(20),

      simpleTable(
        ["Income Source", "David", "Partner"],
        [
          ["Chorus Call salary", "Yes (primary income)", "N/A"],
          ["CuraLive founder consulting fee", "60% of net profit", "N/A"],
          ["CuraLive BD fee", "N/A", "40% of net profit"],
        ]
      ),

      sp(40),

      sH2("Phase 3 (David full-time at CuraLive):"),
      sp(20),

      simpleTable(
        ["Income Source", "David", "Partner"],
        [
          ["CuraLive CEO salary", "Fixed monthly salary", "N/A"],
          ["CuraLive BD salary/fee", "N/A", "Fixed monthly or % of revenue"],
          ["Profit distribution", "60% of remaining profit", "40% of remaining profit"],
        ]
      ),

      sp(40),

      p("Both consulting/BD fees come from revenue only. If there is no revenue, there are no fees. No one draws money that doesn\u2019t exist."),

      pb(),

      // ============ SECTION 9: LEGAL CHECKLIST ============
      sH("9. Legal Checklist \u2014 Before Anything Starts"),
      sp(40),

      fullBox("All items below must be completed before any shares are issued\nor any CuraLive revenue is generated.", "991B1B"),
      sp(40),

      sH2("Employment contract review:"),
      b("Have a lawyer review the Chorus Call employment contract"),
      b("Check for restraint of trade clauses \u2014 do they prevent starting a similar business?"),
      b("Check for IP assignment clauses \u2014 does Chorus Call own anything David creates while employed?"),
      b("Check for non-compete clauses \u2014 is CuraLive considered competitive?"),
      b("Get written legal opinion on whether CuraLive activity is permissible while employed"),

      sp(40),

      sH2("Shareholders\u2019 agreement (must cover):"),
      b("Equity allocation: 75% David / 20% Partner / 5% Option Pool"),
      b("Profit distribution: 60% David / 40% Partner during operations"),
      b("Vesting schedule for partner\u2019s equity (3 tranches as per Section 4)"),
      b("IP licence: Patent owned by David, licensed to company"),
      b("Decision-making: David has board control (majority shareholder)"),
      b("Exit provisions: What happens if one partner wants to leave"),
      b("Tag-along and drag-along rights: Neither can block or be excluded from a sale"),
      b("Anti-dilution protection for David as majority shareholder"),
      b("Restraint of trade for both parties (if one leaves, they can\u2019t start a competitor)"),

      sp(40),

      sH2("Company registration:"),
      b("Register CuraLive (Pty) Ltd with CIPC"),
      b("Appoint David and Partner as directors"),
      b("Issue shares according to the agreed allocation"),

      sp(40),

      sH2("Patent filing:"),
      b("File provisional patent with CIPC (in David\u2019s personal name)"),
      b("Execute IP licence agreement between David and CuraLive (Pty) Ltd"),
      b("Calendar reminder: PCT filing deadline = 12 months from CIPC filing date"),

      pb(),

      // ============ SECTION 10: VALUATION ============
      sH("10. Projected Company Valuation"),
      sp(40),

      simpleTable(
        ["Milestone", "Base Value", "Strategic Acquisition", "Competitive Bid"],
        [
          ["Pre-scale (today)", "$3M\u2013$8M", "$8M\u2013$15M", "\u2014"],
          ["200+ events, 2\u20133 clients", "$8M\u2013$20M", "$20M\u2013$40M", "\u2014"],
          ["500 events, patent granted", "$38M\u2013$88M", "$75M\u2013$150M", "$120M\u2013$250M"],
          ["1,000 events, patent granted", "$78M\u2013$160M", "$150M\u2013$280M", "$250M\u2013$400M+"],
        ]
      ),

      sp(40),

      sH2("What drives the valuation:"),
      b("Patent portfolio \u2014 Shadow Bridge method, autonomous evolution, 25 claims"),
      b("AI intelligence engine \u2014 proven, battle-tested across hundreds of events"),
      b("Benchmarking dataset \u2014 the most valuable single asset, grows with every event"),
      b("Client revenue \u2014 recurring revenue multiplied at 8\u201315x ARR"),
      b("Predictive capability \u2014 becomes a standalone product at 1,000+ events"),

      sp(60),

      sH2("What David\u2019s 75% is worth at key milestones:"),
      sp(20),

      simpleTable(
        ["Milestone", "Company Value", "David (75%)", "Partner (20%)"],
        [
          ["500 events (base)", "$38M\u2013$88M", "$28M\u2013$66M", "$7.6M\u2013$17.6M"],
          ["500 events (strategic)", "$75M\u2013$150M", "$56M\u2013$112M", "$15M\u2013$30M"],
          ["1,000 events (base)", "$78M\u2013$160M", "$58M\u2013$120M", "$15.6M\u2013$32M"],
          ["1,000 events (strategic)", "$150M\u2013$280M", "$112M\u2013$210M", "$30M\u2013$56M"],
          ["1,000 events (competitive bid)", "$250M\u2013$400M", "$187M\u2013$300M", "$50M\u2013$80M"],
        ]
      ),

      sp(60),

      fullBox("Both partners are well looked after in every scenario.\nDavid\u2019s retirement is secured. Partner\u2019s contribution is generously rewarded.", "065F46"),

      pb(),

      // ============ SECTION 11: TIMELINE ============
      sH("11. Action Timeline"),
      sp(40),

      simpleTable(
        ["When", "Action", "Who"],
        [
          ["Immediately", "Lawyer reviews Chorus Call employment contract", "David"],
          ["Week 1\u20132", "File provisional patent with CIPC", "David"],
          ["Week 2\u20134", "Shareholders\u2019 agreement drafted by lawyer", "David + Partner"],
          ["Week 4", "Register CuraLive (Pty) Ltd", "David + Partner"],
          ["Week 4", "Execute IP licence agreement", "David"],
          ["Month 1\u20133", "Partner begins client outreach as CuraLive face", "Partner"],
          ["Month 3\u20136", "First events processed, first revenue generated", "Both"],
          ["Month 6\u201312", "Revenue ramp, David\u2019s CuraLive income grows", "Both"],
          ["Month 10\u201311", "File PCT patent application (international)", "David"],
          ["Month 12\u201318", "Evaluate Chorus Call partnership opportunity", "David"],
          ["When ready", "David transitions full-time to CuraLive", "David"],
          ["Month 30\u201331", "Enter national phase (US, EPO) for patent", "David"],
        ]
      ),

      sp(200),

      // FOOTER
      fullBox("This document is for planning and legal review purposes.\nAll terms should be formalised in a shareholders\u2019 agreement drafted by a qualified commercial lawyer.", "374151"),
      sp(100),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  \u2014  Confidential  |  Founder Transition Strategy  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Transition_Strategy.docx"), buf);
console.log("Done.");
