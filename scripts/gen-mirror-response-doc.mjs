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

function steveComment(text) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "F59E0B" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "F59E0B" }, left: { style: BorderStyle.SINGLE, size: 3, color: "F59E0B" }, right: { style: BorderStyle.SINGLE, size: 1, color: "F59E0B" }, insideH: noBorder, insideV: noBorder },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: "FEF3C7" },
      margins: { top: 120, bottom: 120, left: 280, right: 280 },
      borders: noBorders,
      children: [
        new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "STEVE\u2019S COMMENT:", size: 18, bold: true, color: "92400E" })] }),
        ...text.split("\n").map(line => new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: line, size: 20, italics: true, color: "78350F" })] })),
      ],
    })] })]
  });
}

function davidResponse(text) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "3B82F6" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "3B82F6" }, left: { style: BorderStyle.SINGLE, size: 3, color: "3B82F6" }, right: { style: BorderStyle.SINGLE, size: 1, color: "3B82F6" }, insideH: noBorder, insideV: noBorder },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: "EFF6FF" },
      margins: { top: 120, bottom: 120, left: 280, right: 280 },
      borders: noBorders,
      children: [
        new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "DAVID\u2019S RESPONSE:", size: 18, bold: true, color: "1E3A8A" })] }),
        ...text.split("\n").map(line => new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: line, size: 20, color: "1E3A8A" })] })),
      ],
    })] })]
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

function costLine(label, amount) {
  return new Table({
    width: { size: 8400, type: WidthType.DXA },
    borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }, top: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 5800, type: WidthType.DXA },
        borders: noBorders,
        margins: { top: 60, bottom: 60, left: 360, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 20, color: "374151" })] })],
      }),
      new TableCell({
        width: { size: 2600, type: WidthType.DXA },
        borders: noBorders,
        margins: { top: 60, bottom: 60, left: 100, right: 200 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amount, size: 20, bold: true, color: "1F2937" })] })],
      }),
    ] })]
  });
}

function costTotal(label, amount) {
  return new Table({
    width: { size: 8400, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 5800, type: WidthType.DXA },
        borders: noBorders,
        shading: { type: ShadingType.SOLID, color: "065F46" },
        margins: { top: 80, bottom: 80, left: 360, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 22, bold: true, color: "FFFFFF" })] })],
      }),
      new TableCell({
        width: { size: 2600, type: WidthType.DXA },
        borders: noBorders,
        shading: { type: ShadingType.SOLID, color: "065F46" },
        margins: { top: 80, bottom: 80, left: 100, right: 200 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amount, size: 22, bold: true, color: "FFFFFF" })] })],
      }),
    ] })]
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive \u2014 Mirroring Brief \u2014 Response to Steve\u2019s Comments",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      fullBox("CuraLive\nMulti-Region Mirroring & Infrastructure Brief\nResponse to Steve\u2019s Comments", "1D4ED8"),
      spacer(60),
      plain("This document preserves the original brief with Steve\u2019s comments (yellow boxes) and David\u2019s responses (blue boxes) inline. Each of Steve\u2019s four highlighted points is addressed directly.", 20),

      spacer(200),

      // ============================================
      // SECTION 1
      // ============================================
      fullBox("1.  Why Multi-Region Mirroring Matters", "1E3A8A"),
      spacer(80),

      plain("CuraLive is a real-time investor events platform. When an earnings call or investor presentation is live, any interruption \u2014 even 30 seconds of downtime \u2014 can damage credibility and lose critical intelligence data."),
      spacer(40),
      plain("Mirroring the platform in a second region means:"),
      bullet("If the primary server goes down, a backup takes over automatically"),
      bullet("No data is lost \u2014 the database is replicated in real time"),
      bullet("Telephony (phone calls) continues uninterrupted \u2014 Twilio already operates globally"),

      spacer(40),

      // STEVE COMMENT 1
      steveComment("This is really good and Customers will love it, esp big banks."),

      spacer(20),

      davidResponse("Agreed \u2014 this is one of CuraLive\u2019s strongest selling points for enterprise. The key message for sales conversations: active phone calls are managed entirely by Twilio\u2019s global infrastructure and are completely independent of CuraLive\u2019s application servers. A CuraLive server failover does not interrupt any call in progress.\n\nBank IT teams will specifically ask about this during vendor assessment. I\u2019d recommend making this even more prominent in client-facing materials \u2014 perhaps a dedicated callout box rather than a bullet point. This is the sentence their procurement team will want to read."),

      spacer(40),
      bullet("Clients in different geographies get faster, lower-latency connections"),
      bullet("Regulatory compliance \u2014 some jurisdictions require data to stay within their borders"),

      spacer(200),

      // ============================================
      // SECTION 2
      // ============================================
      fullBox("2.  What CuraLive Runs On", "065F46"),
      spacer(80),

      plain("CuraLive is a lightweight, modern web application. It does not need heavy infrastructure:"),
      spacer(40),

      twoBoxes([
        { text: "Application Server\nNode.js + Express + React\nRuns on any cloud VM or container\nSmall footprint \u2014 1\u20132 CPU cores, 2\u20134 GB RAM", bg: "065F46" },
        { text: "Database\nPostgreSQL\nManaged by cloud provider (RDS, Cloud SQL, etc.)\nFull replication support built in", bg: "1E40AF" },
      ]),

      spacer(80),

      twoBoxes([
        { text: "Telephony\nTwilio (global by default)\nNo extra setup for multi-region\nCalls route through Twilio\u2019s global network", bg: "5B21B6" },
        { text: "AI & Intelligence\nOpenAI API (cloud-based)\nNo infrastructure needed\nWorks identically from any region", bg: "B45309" },
      ]),

      spacer(60),
      plain("This architecture is cloud-agnostic. CuraLive can run on AWS, Azure, GCP, or any VPS provider. Nothing is locked to a single vendor."),

      spacer(100),

      // ============================================
      // SECTION 3
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("3.  How Multi-Region Mirroring Works", "B45309"),
      spacer(80),

      twoBoxes([
        { text: "\ud83c\uddf1\ud83c\udde6  PRIMARY REGION\ne.g. South Africa or EU (London)\n\nMain application server\nPrimary database\nHandles all live traffic\nThis is where operators and clients connect", bg: "065F46" },
        { text: "\ud83c\uddfa\ud83c\uddf8  SECONDARY REGION\ne.g. US East or UK\n\nStandby application server\nReplica database (real-time sync)\nReady to take over within 60 seconds\nTakes no traffic until failover", bg: "1E40AF" },
      ]),

      arrow("\u2194\ufe0f  Continuous sync between regions"),

      heading("What happens during a failover:"),
      step("1", "Primary region goes down (server crash, network outage, data centre issue)"),
      step("2", "Health check detects the failure within 30\u201360 seconds"),

      spacer(40),

      // STEVE COMMENT 2
      steveComment("Is this done via a polling app/function? If so, can it be configured to carry out the check at shorter intervals? We could build our own AI agent to perform the task?"),

      spacer(20),

      davidResponse("Yes \u2014 health checks are performed by the cloud provider\u2019s DNS failover service (e.g. AWS Route 53, Cloudflare). These are polling-based checks that send a request to the application server at configurable intervals.\n\nDefault interval: every 10\u201330 seconds. This can be reduced to as low as every 5 seconds for faster detection. Checks run from multiple geographic locations simultaneously \u2014 failure is only confirmed when multiple locations agree, which prevents false positives.\n\nSteve\u2019s idea about building an AI agent for this is creative. Standard cloud health checks are reliable for basic \u201Cis the server up\u201D monitoring, but where an AI agent would add real value is at the application level \u2014 checking not just server availability but:\n\n\u2022  Is the database connected and responsive?\n\u2022  Is the Twilio API reachable and authenticated?\n\u2022  Is the OpenAI API responding?\n\u2022  Are active events still streaming correctly?\n\nThis kind of intelligent health monitoring goes beyond a simple HTTP ping. It\u2019s the level of monitoring that enterprise IT and audit teams expect to see. Worth building as a future feature \u2014 and it\u2019s a patentable capability."),

      spacer(40),

      step("3", "DNS automatically routes all traffic to the secondary region"),
      step("4", "Database replica is promoted to primary \u2014 all data is intact, no loss"),
      step("5", "Telephony continues uninterrupted \u2014 Twilio is completely independent of our servers"),
      step("6", "Users reconnect within 1\u20132 minutes without any manual intervention"),
      spacer(60),

      fullBox("Important: phone calls already in progress will not drop.\nTwilio manages call audio independently. Only the OCC dashboard reconnects.", "065F46"),

      spacer(100),

      heading("Can it be mirrored across countries?"),
      plain("Yes. The two regions can be in different countries entirely. Common setups:"),
      bullet("Primary in South Africa (AWS Cape Town) + Secondary in the UK (AWS London)"),
      bullet("Primary in the EU (London or Frankfurt) + Secondary in the US (Virginia)"),
      bullet("Primary in the US + Secondary in Asia-Pacific (Singapore or Sydney)"),
      spacer(40),
      plain("The choice depends on where your clients and operators are located, and what data residency rules apply to your industry."),

      spacer(200),

      // ============================================
      // SECTION 4
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("4.  Cost Breakdown", "991B1B"),
      spacer(80),

      plain("These are cloud infrastructure costs only. CuraLive itself has no per-region licensing fee \u2014 you are paying for the servers and phone lines, not the software."),
      spacer(40),

      labelBox("THREE TIERS", "374151"),
      spacer(60),

      threeBoxes([
        { text: "\ud83d\udfe2  STARTER\n$200 \u2013 $500 / month\n\n1 small cloud server\nManaged database replica\nBasic health checks\nManual failover", bg: "065F46" },
        { text: "\ud83d\udfe0  PRODUCTION\n$500 \u2013 $1,500 / month\n\nAuto-scaling servers\nReal-time DB sync\nAutomatic DNS failover\nMonitoring & alerts\nDaily backups", bg: "B45309" },
        { text: "\ud83d\udfe3  ENTERPRISE\n$1,500 \u2013 $5,000 / month\n\nMulti-region active-active\nZero-downtime failover\nDedicated DB clusters\n24/7 monitoring\nSLA guarantees", bg: "5B21B6" },
      ]),

      spacer(120),

      labelBox("EXAMPLE: SA PRIMARY + UK SECONDARY + 3 COUNTRIES", "1E3A8A"),
      spacer(60),

      costLine("Primary region (AWS Cape Town \u2014 application + database)", "$200 \u2013 $400/mo"),
      costLine("Secondary region (AWS London \u2014 standby + replica DB)", "$150 \u2013 $300/mo"),
      costLine("Database replication (continuous sync between regions)", "$50 \u2013 $150/mo"),
      costLine("DNS failover service (Route 53 health checks)", "$50/mo"),
      costLine("SSL certificates (Let\u2019s Encrypt)", "Free"),
      costLine("Monitoring & alerting (CloudWatch / Datadog basic)", "$0 \u2013 $50/mo"),
      costLine("Local phone numbers \u2014 SA, UK, US (3 numbers)", "$10/mo"),
      costLine("Twilio call minutes (~2,000 minutes/month)", "$40 \u2013 $80/mo"),

      spacer(40),
      costTotal("ESTIMATED MONTHLY TOTAL", "$500 \u2013 $1,000"),

      spacer(80),
      plain("At enterprise tier with SLA guarantees and active-active: $2,000 \u2013 $5,000/month. This is still very competitive compared to legacy conferencing platforms which charge $10,000\u2013$50,000/month for equivalent setups."),

      spacer(40),

      // STEVE COMMENT 3
      steveComment("I agree \u2014 actually it\u2019s remarkably low and IMO will ultimately be needed when we get contracts and come under scrutiny from Customer\u2019 internal IT/audit teams."),

      spacer(20),

      davidResponse("Exactly right. Multi-region mirroring is not a future nice-to-have \u2014 it is a requirement for enterprise client acquisition. Financial institutions will require documented disaster recovery and business continuity capabilities during their vendor due diligence process.\n\nThe fact that CuraLive can deliver global resilience for $500\u2013$1,000/month versus $10,000\u2013$50,000 for legacy platforms is a major competitive advantage. This cost comparison should be front and centre in sales presentations.\n\nWhen enterprise clients\u2019 internal IT and audit teams scrutinise the platform, they will specifically ask for:\n\n\u2022  Documented disaster recovery procedures\n\u2022  Business continuity plan with defined RTO/RPO targets\n\u2022  Evidence of failover testing\n\u2022  Data residency and jurisdiction documentation\n\nHaving these ready before the first enterprise pitch will accelerate the sales cycle significantly."),

      spacer(200),

      // ============================================
      // SECTION 5
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("5.  Telephony & Bring Your Own Carrier", "5B21B6"),
      spacer(80),

      plain("CuraLive currently uses Twilio for all telephony \u2014 dial-in, dial-out, bridge connections, and call recording. Twilio is a global carrier that operates in 180+ countries."),
      spacer(40),
      plain("However, you are not locked in. CuraLive\u2019s telephony layer supports:"),
      spacer(40),

      threeBoxes([
        { text: "\ud83d\udcb0  Lower Costs\nBring your own SIP trunks\nfrom a local carrier\nTypically 30\u201370% cheaper\nat volume", bg: "065F46" },
        { text: "\ud83c\uddf1\ud83c\udde6  Local Numbers\nGet local numbers in SA,\nUK, US, EU, Asia\nAttendees dial local,\nnot international", bg: "1E40AF" },
        { text: "\ud83d\udee1\ufe0f  Redundancy\nRun multiple carriers\nIf one goes down, calls\nroute through the other\nautomatically", bg: "5B21B6" },
      ]),

      spacer(80),

      heading("How BYOC works:"),
      step("1", "You contract with a local carrier (e.g. Vodacom, BT, AT&T, or any SIP provider)"),
      step("2", "They provide SIP trunk credentials and local phone numbers"),
      step("3", "These are configured in CuraLive\u2019s telephony settings"),
      step("4", "All calls now route through your carrier instead of (or alongside) Twilio"),
      step("5", "Twilio can remain as a backup for automatic failover between carriers"),

      spacer(60),
      fullBox("Twilio also supports BYOC natively \u2014 you can connect your own SIP trunks through Twilio\u2019s platform and keep all existing integrations while benefiting from your own carrier\u2019s rates.", "4C1D95"),

      spacer(40),

      // STEVE COMMENT 4
      steveComment("I think this would be worth investigating when the time\u2019s right. It\u2019s probably a feature of most carriers now, but when we used Bandwidth they had a real-time call performance dashboard that we always had up on a large screen. It showed all kinds of quality metrics at the network level but also allowed us to drill down to the routing that an individual participant used. It showed latency rates, buffering, packet loss etc and was very useful when investigating complaints about call quality."),

      spacer(20),

      davidResponse("This is excellent operational insight. Steve is right \u2014 when running events for banks and financial institutions, having visibility into call quality at the network level is essential for investigating complaints and maintaining SLA compliance.\n\nGood news: Twilio already offers something equivalent. Twilio Insights provides per-call quality metrics including:\n\n\u2022  MOS scores (Mean Opinion Score) \u2014 the industry standard for call quality\n\u2022  Jitter \u2014 variation in packet arrival time\n\u2022  Packet loss \u2014 percentage of audio packets lost in transit\n\u2022  Latency \u2014 round-trip delay per participant\n\u2022  Per-participant breakdown \u2014 drill down to individual caller quality\n\nThis data can be surfaced directly inside the CuraLive OCC, giving operators real-time visibility into call quality alongside the live transcript, sentiment scores, and compliance flags. Operators could identify and respond to quality issues during the event, not after.\n\nWhen BYOC is implemented, equivalent dashboards from the carrier (like the Bandwidth real-time performance dashboard Steve describes) can be integrated alongside Twilio\u2019s metrics. This gives comprehensive quality monitoring across all telephony paths.\n\nRecommendation: Building call quality monitoring into the OCC should be prioritised alongside the BYOC investigation. Enterprise clients will expect it."),

      spacer(200),

      // ============================================
      // SECTION 6
      // ============================================
      fullBox("6.  What\u2019s Already in Place", "065F46"),
      spacer(80),

      bullet("Cloud-agnostic architecture \u2014 Node.js + PostgreSQL, runs anywhere", true),
      bullet("Twilio telephony with global reach \u2014 already multi-region by default", true),
      bullet("Stateless application design \u2014 any server instance can handle any request", true),
      bullet("Database schema supports replication \u2014 PostgreSQL streaming replication ready", true),
      bullet("AI/Intelligence via cloud APIs (OpenAI) \u2014 no region-specific infrastructure needed", true),
      bullet("Telnyx already referenced as alternative carrier in the codebase", true),

      spacer(80),
      heading("What needs to be done to go live with mirroring:"),
      step("1", "Choose a cloud provider and two regions (e.g. AWS Cape Town + London)"),
      step("2", "Deploy the application to both regions using containers or VMs"),
      step("3", "Set up managed PostgreSQL with cross-region read replicas"),
      step("4", "Configure DNS failover (Route 53 or Cloudflare)"),
      step("5", "Set up monitoring and health check alerts"),
      step("6", "Test failover with a simulated outage"),
      spacer(40),
      plain("Timeline: 2\u20134 weeks for a production-grade deployment with testing. No code changes required \u2014 this is purely infrastructure configuration."),

      spacer(200),

      // ============================================
      // SECTION 7
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("7.  Why This Matters for Enterprise Sales", "1E3A8A"),
      spacer(80),

      bullet("Enterprise readiness \u2014 multi-region shows the platform is production-grade, not a prototype"),
      bullet("Global scalability \u2014 can serve clients in any geography without rebuilding"),
      bullet("Regulatory flexibility \u2014 data can stay within required jurisdictions"),
      bullet("Cost efficiency \u2014 $500\u2013$1,000/month for global resilience vs $10,000\u2013$50,000 for legacy platforms"),
      bullet("Carrier independence \u2014 not locked to any single vendor, can negotiate rates at scale"),
      bullet("Zero-code migration \u2014 no application changes needed to move between clouds"),

      spacer(80),
      fullBox("CuraLive is designed to be acquired.\nThe infrastructure story is as strong as the product story.", "1E3A8A"),

      spacer(200),

      // ============================================
      // SUMMARY OF STEVE'S COMMENTS
      // ============================================
      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),
      fullBox("Summary \u2014 Steve\u2019s Comments & Agreed Actions", "374151"),
      spacer(80),

      heading("Comment 1: Telephony Independence (Section 1)"),
      plain("Steve\u2019s point: Customers \u2014 especially big banks \u2014 will love the fact that phone calls don\u2019t drop during a failover."),
      plain("Action: Make call independence the lead selling point in client presentations. Add a dedicated callout in all enterprise materials: \u201CActive calls are managed by Twilio\u2019s global infrastructure, completely independent of CuraLive servers. Server failover does not interrupt calls in progress.\u201D"),

      spacer(60),

      heading("Comment 2: Health Check Intervals (Section 3)"),
      plain("Steve\u2019s point: Can health checks run at shorter intervals? Could we build an AI agent for monitoring?"),
      plain("Action: Health checks are configurable down to 5-second intervals via the cloud provider. For application-level monitoring (DB, Twilio, AI API, active events), an intelligent health agent is worth building \u2014 and is a patentable capability. Add this to the product roadmap."),

      spacer(60),

      heading("Comment 3: Cost Positioning (Section 4)"),
      plain("Steve\u2019s point: The cost is remarkably low and will be needed when under IT/audit scrutiny from enterprise clients."),
      plain("Action: Position the $500\u2013$1,000/month cost comparison against legacy platforms ($10,000\u2013$50,000) as a headline in all sales materials. Prepare disaster recovery documentation, business continuity plan, and RTO/RPO targets before the first enterprise pitch."),

      spacer(60),

      heading("Comment 4: Call Quality Monitoring (Section 5)"),
      plain("Steve\u2019s point: Bandwidth had a real-time call performance dashboard showing per-participant quality metrics. This was invaluable for investigating complaints."),
      plain("Action: Twilio Insights already provides equivalent metrics (MOS, jitter, packet loss, latency per participant). Surface this data inside the CuraLive OCC. When BYOC is implemented, integrate carrier-level quality dashboards alongside Twilio\u2019s. Prioritise this as an enterprise readiness feature."),

      spacer(200),

      fullBox("Overall Assessment\n\nSteve is thinking like an enterprise buyer \u2014 exactly the right lens.\nEvery comment aligns with what bank IT teams and procurement\ndepartments will ask during vendor assessment.\n\nHis operational experience (the Bandwidth dashboard reference)\nis particularly valuable and should inform how the OCC evolves.", "1E3A8A"),

      spacer(400),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  \u2014  Confidential  |  Response to Partner Comments  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Mirroring_Response.docx"), buf);
console.log("Done.");
