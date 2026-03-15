// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType
} from "docx";
import fs from "fs";

const BLUE = "1a1a2e";
const GREY = "555555";
const DARK = "333333";
const ACCENT = "2563eb";

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, color: BLUE, font: "Calibri" })] });
}

function para(text: string, spacing = 120) {
  return new Paragraph({
    spacing: { after: spacing },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })],
  });
}

function boldPara(text: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: BLUE })],
  });
}

function bullet(text: string, bold_prefix = "") {
  const children: TextRun[] = [];
  if (bold_prefix) {
    children.push(new TextRun({ text: bold_prefix, bold: true, font: "Calibri", size: 22, color: DARK }));
  }
  children.push(new TextRun({ text, font: "Calibri", size: 22, color: DARK }));
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children });
}

function subBullet(text: string) {
  return new Paragraph({
    bullet: { level: 1 }, spacing: { after: 60 },
    children: [new TextRun({ text, font: "Calibri", size: 21, color: GREY })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
    children: [new TextRun({ text: "" })],
  });
}

function tableCell(text: string, bold = false, shading?: string) {
  const opts: any = {
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Calibri", size: 20, color: bold ? "ffffff" : DARK })] })],
    width: { size: 100, type: WidthType.AUTO },
  };
  if (shading) {
    opts.shading = { type: ShadingType.SOLID, color: shading, fill: shading };
  }
  return new TableCell(opts);
}

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } },
    },
    children: [

      // TITLE
      new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "AI AntiHijack", bold: true, font: "Calibri", size: 48, color: BLUE }),
      ]}),
      new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Market Traction & Acquisition Value Playbook", font: "Calibri", size: 26, color: GREY }),
      ]}),
      new Paragraph({ spacing: { after: 100 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Confidential — David Cameron — 2026", font: "Calibri", size: 20, color: GREY, italics: true }),
      ]}),

      divider(),

      // ============================================================
      // PHASE 1
      // ============================================================
      heading("Phase 1: Validate (0–6 months)", HeadingLevel.HEADING_1),
      para("Low cost, high signal. The goal is to prove the concept works with real vehicles and real partners before investing in scale."),

      boldPara("Partner with 1–2 insurance companies"),
      para("Approach Discovery Insure, OUTsurance, or MiWay. The pitch: \"We reduce your hijacking claims by detecting incidents faster and preserving forensic evidence for claims processing.\" Insurers lose billions annually on vehicle crime — they are motivated buyers and co-development partners."),
      bullet("Discovery Insure already has telematics via their Vitality Drive programme — position AI AntiHijack as a premium intelligence layer on top of existing hardware"),
      bullet("Offer a revenue-share model rather than upfront licensing — this lowers their risk and gets you to market faster"),
      bullet("The forensic evidence module is a unique differentiator — no competitor provides court-admissible evidence packages from multi-source sensor data"),

      boldPara("Run a pilot with a small fleet operator"),
      para("Target courier companies, school transport operators, or executive protection firms. Even 20–50 vehicles generating real data proves the concept and gives you case studies."),
      bullet("School transport is especially compelling — parents will pay for child safety, and schools face liability pressure"),
      bullet("Executive protection firms (VIP drivers) operate in high-risk environments and will pay premium pricing"),
      bullet("Courier/logistics companies face direct financial loss from hijacked vehicles and cargo"),

      boldPara("Publish the data"),
      para("After even a small pilot, publish findings in industry press and social media. Example headlines:"),
      bullet("\"AI system detected 87% of route anomalies an average of 4.2 minutes before incident escalation\""),
      bullet("\"Predictive threat intelligence identified high-risk corridor, enabling route adjustment that avoided 3 potential incidents\""),
      bullet("\"Forensic evidence module provided complete incident reconstruction for 100% of insurance claims filed\""),

      divider(),

      // ============================================================
      // PHASE 2
      // ============================================================
      heading("Phase 2: Prove (6–18 months)", HeadingLevel.HEADING_1),
      para("Build the moat. The goal is to create defensible advantages that make the platform increasingly difficult to replicate."),

      boldPara("Get the forensic evidence module certified"),
      bullet("Work with SAPS (South African Police Service) or private forensic investigators to validate that evidence packages meet evidentiary standards"),
      bullet("Obtain a legal opinion confirming cryptographic hash integrity satisfies chain-of-custody requirements"),
      bullet("This becomes a unique selling point that no competitor currently offers"),
      bullet("Insurance companies will actively promote the product if it reduces disputed claims"),

      boldPara("Build the community intelligence network"),
      para("The fleet/community claims in the patent describe a network effect — each vehicle makes the system smarter for all users."),
      bullet("Start with a concentrated geographic area (Johannesburg, Pretoria, Cape Town) where hijacking density is high"),
      bullet("Even 200–500 vehicles in a concentrated area create meaningful hotspot intelligence"),
      bullet("As the network grows, the data becomes exponentially more valuable — this is the core moat"),
      bullet("Community intelligence feeds back into the predictive module, improving route recommendations for everyone"),

      boldPara("Sign licensing agreements"),
      bullet("Approach Cartrack/Karooooo (JSE-listed, 1.8M+ subscribers), Netstar, or Tracker SA"),
      bullet("Offer non-exclusive licenses initially — this proves revenue and validates demand without giving up control"),
      bullet("Licensing revenue demonstrates that the patent has commercial value, which directly increases acquisition price"),
      bullet("Target 3–5 licensees to demonstrate broad market applicability"),

      boldPara("Integrate with existing hardware"),
      para("Do not build your own in-vehicle device initially. Partner with existing telematics hardware providers and layer the AI on top of their data streams."),
      bullet("Cartrack, Netstar, and Tracker all have installed hardware in millions of vehicles — your AI layer adds value to their existing infrastructure"),
      bullet("This dramatically reduces go-to-market cost and time"),
      bullet("Hardware-agnostic positioning also increases acquisition attractiveness — the acquirer can deploy on any platform"),

      divider(),

      // ============================================================
      // PHASE 3
      // ============================================================
      heading("Phase 3: Scale (18–36 months)", HeadingLevel.HEADING_1),
      para("Become acquisition-ready. The goal is to build recurring revenue, geographic reach, and a dataset that creates an unreplicable competitive advantage."),

      boldPara("Expand geographically"),
      bullet("Brazil — over 40,000 vehicle thefts per year in São Paulo alone"),
      bullet("Mexico — vehicle theft and carjacking are endemic in major cities"),
      bullet("Nigeria and Kenya — rapidly growing vehicle markets with significant security challenges"),
      bullet("Southeast Asia — emerging markets with increasing vehicle crime"),
      bullet("File PCT international patent protection in target markets before expanding"),

      boldPara("Build recurring revenue"),
      para("Monthly subscription per vehicle creates predictable revenue that acquirers pay premium multiples for:"),
      bullet("Consumer: R99–R299/month per vehicle"),
      bullet("Fleet: R199–R499/month per vehicle"),
      bullet("Premium/Executive: R499–R999/month per vehicle"),
      bullet("Insurance integration: revenue-share on claim reduction savings"),
      para("Even 5,000 vehicles at R200/month = R1M MRR = R12M ARR. At a 10x revenue multiple, that's R120M valuation from revenue alone."),

      boldPara("Generate the benchmarking dataset"),
      para("The patent claims covering aggregated anonymised threat intelligence become exponentially more valuable as data volume grows."),
      bullet("Real-time crime hotspot maps generated from live vehicle data"),
      bullet("Temporal risk patterns (time-of-day, day-of-week hijacking probability by area)"),
      bullet("Insurance risk pricing data — insurers will pay for this independently of the security product"),
      bullet("This dataset is the ultimate moat — competitors cannot replicate years of aggregated intelligence"),

      divider(),

      // ============================================================
      // ACQUIRER TABLE
      // ============================================================
      heading("Potential Acquirers", HeadingLevel.HEADING_1),
      para("The following companies represent realistic acquisition targets based on strategic fit, market position, and financial capacity:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            tableCell("Potential Acquirer", true, "1a1a2e"),
            tableCell("Strategic Rationale", true, "1a1a2e"),
            tableCell("Estimated Range", true, "1a1a2e"),
          ]}),
          new TableRow({ children: [
            tableCell("Cartrack / Karooooo (JSE)"),
            tableCell("Add AI differentiation to 1.8M subscriber base"),
            tableCell("R100M – R500M"),
          ]}),
          new TableRow({ children: [
            tableCell("MiX Telematics"),
            tableCell("Fleet intelligence expansion across Africa and globally"),
            tableCell("R50M – R300M"),
          ]}),
          new TableRow({ children: [
            tableCell("Discovery Insure"),
            tableCell("Reduce hijacking claims, improve risk pricing models"),
            tableCell("R100M – R500M+"),
          ]}),
          new TableRow({ children: [
            tableCell("Bosch / Continental"),
            tableCell("OEM integration for factory-fitted vehicle security"),
            tableCell("R200M – R1B+"),
          ]}),
          new TableRow({ children: [
            tableCell("Qualcomm / Intel"),
            tableCell("Edge AI automotive portfolio, connected vehicle IP"),
            tableCell("$10M – $50M+ USD"),
          ]}),
          new TableRow({ children: [
            tableCell("Vodacom / MTN"),
            tableCell("IoT and connected vehicle play for African markets"),
            tableCell("R100M – R500M"),
          ]}),
        ],
      }),

      divider(),

      // ============================================================
      // KEY METRICS
      // ============================================================
      heading("Key Metrics That Drive Acquisition Value", HeadingLevel.HEADING_1),
      para("Acquirers evaluate based on these measurable indicators. Each metric should be tracked and reported from day one:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            tableCell("Metric", true, "1a1a2e"),
            tableCell("Why It Matters", true, "1a1a2e"),
            tableCell("Target (18 months)", true, "1a1a2e"),
          ]}),
          new TableRow({ children: [
            tableCell("Monthly Recurring Revenue"),
            tableCell("Proves commercial viability and pricing power"),
            tableCell("R500K+/month MRR"),
          ]}),
          new TableRow({ children: [
            tableCell("Active Vehicles"),
            tableCell("Proves scalability and network intelligence value"),
            tableCell("2,000–5,000 vehicles"),
          ]}),
          new TableRow({ children: [
            tableCell("Detection Accuracy Rate"),
            tableCell("Proves the AI works — the core technical claim"),
            tableCell(">85% true positive rate"),
          ]}),
          new TableRow({ children: [
            tableCell("Insurance Claim Reduction"),
            tableCell("Proves ROI for insurers (the biggest potential partners)"),
            tableCell("15–30% reduction in pilot"),
          ]}),
          new TableRow({ children: [
            tableCell("False Positive Rate"),
            tableCell("Low false positives = usable product that people keep"),
            tableCell("<5% false positive rate"),
          ]}),
          new TableRow({ children: [
            tableCell("Patent Breadth"),
            tableCell("48 claims across 6 categories = strong defensibility"),
            tableCell("Full patent granted"),
          ]}),
          new TableRow({ children: [
            tableCell("Geographic Coverage"),
            tableCell("Multi-country presence increases strategic value"),
            tableCell("2–3 countries"),
          ]}),
          new TableRow({ children: [
            tableCell("Licensing Revenue"),
            tableCell("Proves IP has independent commercial value"),
            tableCell("3–5 active licensees"),
          ]}),
        ],
      }),

      divider(),

      // ============================================================
      // VALUATION PROGRESSION
      // ============================================================
      heading("Valuation Progression", HeadingLevel.HEADING_1),
      para("How the patent and platform value grows through each phase:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            tableCell("Stage", true, "1a1a2e"),
            tableCell("Status", true, "1a1a2e"),
            tableCell("Estimated Value", true, "1a1a2e"),
          ]}),
          new TableRow({ children: [
            tableCell("Provisional patent filed"),
            tableCell("Idea on paper, no traction"),
            tableCell("R500K – R5M"),
          ]}),
          new TableRow({ children: [
            tableCell("Working prototype"),
            tableCell("Technology demonstrated, no revenue"),
            tableCell("R5M – R50M"),
          ]}),
          new TableRow({ children: [
            tableCell("Pilot with real vehicles"),
            tableCell("Data proves detection works"),
            tableCell("R20M – R100M"),
          ]}),
          new TableRow({ children: [
            tableCell("Revenue + licensees"),
            tableCell("Commercial traction, recurring revenue"),
            tableCell("R50M – R500M"),
          ]}),
          new TableRow({ children: [
            tableCell("Scale + multi-country"),
            tableCell("Network effect, data moat, strong MRR"),
            tableCell("R200M – R1B+"),
          ]}),
        ],
      }),

      divider(),

      // ============================================================
      // CRITICAL PATH
      // ============================================================
      heading("The Single Most Important Thing", HeadingLevel.HEADING_1),
      para("Get real vehicles generating real data. A patent with 500 active vehicles and proven detection rates is worth 10–50x more than a patent sitting on paper."),
      para("Every other activity — licensing conversations, insurer partnerships, geographic expansion, dataset building — flows from having real vehicles producing real results."),
      para("The recommended first step: identify one fleet operator or insurer willing to run a 30–50 vehicle pilot for 90 days. That single pilot, if successful, unlocks everything that follows."),

      divider(),

      // ============================================================
      // IMMEDIATE NEXT STEPS
      // ============================================================
      heading("Immediate Next Steps", HeadingLevel.HEADING_1),

      bullet("", "1. "),
      para("Convert provisional patent to full patent application (within 12 months of filing date)"),
      bullet("", "2. "),
      para("Prepare a 10-slide investor/partner pitch deck covering the problem, solution, patent claims, market size, and pilot proposal"),
      bullet("", "3. "),
      para("Identify and approach 3 potential pilot partners (1 insurer, 1 fleet operator, 1 school transport company)"),
      bullet("", "4. "),
      para("Build a minimum viable prototype that can run on existing telematics hardware (software layer only)"),
      bullet("", "5. "),
      para("Engage a patent attorney to review claims and advise on PCT international filing strategy"),
      bullet("", "6. "),
      para("Set up a company structure for IP holding and commercial operations (Pty Ltd with IP assignment)"),

      divider(),

      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "AI AntiHijack — Confidential", font: "Calibri", size: 18, color: GREY, italics: true }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "David Cameron — 2026", font: "Calibri", size: 18, color: GREY, italics: true }),
      ]}),
    ],
  }],
});

async function generate() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("docs/AI_AntiHijack_Market_Traction_Playbook.docx", buffer);
  const stats = fs.statSync("docs/AI_AntiHijack_Market_Traction_Playbook.docx");
  console.log(`DOCX saved: docs/AI_AntiHijack_Market_Traction_Playbook.docx`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
}

generate().catch(console.error);
