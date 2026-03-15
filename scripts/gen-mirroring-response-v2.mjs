import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, ShadingType, TabStopPosition, TabStopType, PageBreak } from "docx";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, color: "1a1a2e" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 26, color: "1a1a2e" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 250, after: 100 }, children: [new TextRun({ text, bold: true, size: 22, color: "333366" })] });
}
function p(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 21 })] });
}
function b(text) {
  return new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: "•  " + text, size: 21 })] });
}
function nb(num, text) {
  return new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: num + ".  " + text, size: 21 })] });
}
function sp(val) {
  return new Paragraph({ spacing: { after: val }, children: [] });
}
function steveBox(text) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: "E6A817" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E6A817" }, left: { style: BorderStyle.SINGLE, size: 6, color: "E6A817" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E6A817" } },
    shading: { type: ShadingType.SOLID, color: "FFF8E1" },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "STEVE'S COMMENT:\n", bold: true, size: 20, color: "B8860B" }),
      new TextRun({ text, size: 20, color: "5D4E37" }),
    ],
  });
}
function davidBox(text) {
  return new Paragraph({
    spacing: { before: 100, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: "2196F3" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "2196F3" }, left: { style: BorderStyle.SINGLE, size: 6, color: "2196F3" }, right: { style: BorderStyle.SINGLE, size: 1, color: "2196F3" } },
    shading: { type: ShadingType.SOLID, color: "E3F2FD" },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: "DAVID'S RESPONSE:\n", bold: true, size: 20, color: "1565C0" }),
      new TextRun({ text, size: 20, color: "1A237E" }),
    ],
  });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    children: [
      // TITLE
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "CuraLive", bold: true, size: 44, color: "1a1a2e" }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [
        new TextRun({ text: "Multi-Region Mirroring & Infrastructure Brief", size: 28, color: "555555" }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [
        new TextRun({ text: "Response to Steve's Comments", size: 24, color: "2196F3", italics: true }),
      ] }),

      // ============ SECTION 1 ============
      h1("1.  Why Multi-Region Mirroring Matters"),
      sp(20),
      p("CuraLive is a real-time investor events platform. When an earnings call or investor presentation is live, any interruption — even 30 seconds of downtime — can damage credibility and lose critical intelligence data."),
      sp(20),
      p("Mirroring the platform in a second region means:"),
      b("If the primary server goes down, a backup takes over automatically"),
      b("No data is lost — the database is replicated in real time"),
      b("Telephony (phone calls) continues uninterrupted — Twilio already operates globally"),
      b("Clients in different geographies get faster, lower-latency connections"),
      b("Regulatory compliance — some jurisdictions require data to stay within their borders"),
      sp(20),

      steveBox("This is really good and Customers will love it, esp big banks."),
      davidBox("Agreed — this is one of CuraLive's strongest selling points for enterprise. The key message for sales conversations: active phone calls are managed entirely by Twilio's global infrastructure and are completely independent of CuraLive's application servers. A CuraLive server failover does not interrupt any call in progress.\n\nBank IT teams will specifically ask about this during vendor assessment. I'd recommend making this even more prominent in client-facing materials — perhaps a dedicated callout box rather than a bullet point. This is the sentence their procurement team will want to read."),

      // ============ SECTION 2 ============
      h1("2.  What CuraLive Runs On"),
      sp(20),
      p("CuraLive is a lightweight, modern web application. It does not need heavy infrastructure:"),
      sp(20),
      h3("Application Server"),
      b("Node.js + Express + React"),
      b("Runs on any cloud VM or container"),
      b("Small footprint — 1–2 CPU cores, 2–4 GB RAM"),
      sp(20),
      h3("Database"),
      b("PostgreSQL"),
      b("Managed by cloud provider (RDS, Cloud SQL, etc.)"),
      b("Full replication support built in"),
      sp(20),
      h3("Telephony"),
      b("Twilio (global by default)"),
      b("No extra setup for multi-region"),
      b("Calls route through Twilio's global network"),
      sp(20),
      h3("AI & Intelligence"),
      b("OpenAI API (cloud-based)"),
      b("No infrastructure needed"),
      b("Works identically from any region"),
      sp(20),
      p("This architecture is cloud-agnostic. CuraLive can run on AWS, Azure, GCP, or any VPS provider. Nothing is locked to a single vendor."),

      // ============ SECTION 3 ============
      pb(),
      h1("3.  How Multi-Region Mirroring Works"),
      sp(20),
      h3("PRIMARY REGION — e.g. South Africa or EU (London)"),
      b("Main application server"),
      b("Primary database"),
      b("Handles all live traffic"),
      b("This is where operators and clients connect"),
      sp(20),
      h3("SECONDARY REGION — e.g. US East or UK"),
      b("Standby application server"),
      b("Replica database (real-time sync)"),
      b("Ready to take over within 60 seconds"),
      b("Takes no traffic until failover"),
      sp(20),
      p("↔️  Continuous sync between regions"),
      sp(20),
      p("What happens during a failover:"),
      nb("1", "Primary region goes down (server crash, network outage, data centre issue)"),
      nb("2", "Health check detects the failure within 30–60 seconds"),
      sp(20),

      steveBox("Is this done via a polling app/function? If so, can it be configured to carry out the check at shorter intervals? We could build our own AI agent to perform the task?"),
      davidBox("Yes — health checks are performed by the cloud provider's DNS failover service (e.g. AWS Route 53, Cloudflare). These are polling-based checks that send a request to the application server at configurable intervals.\n\nDefault interval: every 10–30 seconds. This can be reduced to as low as every 5 seconds for faster detection. Checks run from multiple geographic locations simultaneously — failure is only confirmed when multiple locations agree, which prevents false positives.\n\nSteve's idea about building an AI agent for this is creative. Standard cloud health checks are reliable for basic \"is the server up\" monitoring, but where an AI agent would add real value is at the application level — checking not just server availability but:\n\n•  Is the database connected and responsive?\n•  Is the Twilio API reachable and authenticated?\n•  Is the OpenAI API responding?\n•  Are active events still streaming correctly?\n\nThis kind of intelligent health monitoring goes beyond a simple HTTP ping. It's the level of monitoring that enterprise IT and audit teams expect to see.\n\nUPDATE: This has now been built. The AI Infrastructure Guardian is live and running in production. It performs deep application-level health checks every 30 seconds across 6 services (Database, Twilio, OpenAI, Ably, Recall.ai, Active Events). It includes adaptive baseline learning for anomaly detection, AI-powered root cause attribution (categorising issues as Platform / Participant / Presenter / Network / Third-party), and automated customer incident report generation. Steve's idea was spot-on — this is exactly the kind of monitoring that enterprise clients need to see."),

      sp(20),
      nb("3", "DNS automatically routes all traffic to the secondary region"),
      nb("4", "Database replica is promoted to primary — all data is intact, no loss"),
      nb("5", "Telephony continues uninterrupted — Twilio is completely independent of our servers"),
      nb("6", "Users reconnect within 1–2 minutes without any manual intervention"),
      sp(20),
      p("Important: phone calls already in progress will not drop. Twilio manages call audio independently. Only the OCC dashboard reconnects."),
      sp(20),
      h3("Can it be mirrored across countries?"),
      p("Yes. The two regions can be in different countries entirely. Common setups:"),
      b("Primary in South Africa (AWS Cape Town) + Secondary in the UK (AWS London)"),
      b("Primary in the EU (London or Frankfurt) + Secondary in the US (Virginia)"),
      b("Primary in the US + Secondary in Asia-Pacific (Singapore or Sydney)"),
      sp(20),
      p("The choice depends on where your clients and operators are located, and what data residency rules apply to your industry."),

      // ============ SECTION 4 ============
      pb(),
      h1("4.  Cost Breakdown"),
      sp(20),
      p("These are cloud infrastructure costs only. CuraLive itself has no per-region licensing fee — you are paying for the servers and phone lines, not the software."),
      sp(20),
      h3("STARTER — $200 – $500 / month"),
      b("1 small cloud server"),
      b("Managed database replica"),
      b("Basic health checks"),
      b("Manual failover"),
      sp(20),
      h3("PRODUCTION — $500 – $1,500 / month"),
      b("Auto-scaling servers"),
      b("Real-time DB sync"),
      b("Automatic DNS failover"),
      b("Monitoring & alerts"),
      b("Daily backups"),
      sp(20),
      h3("ENTERPRISE — $1,500 – $5,000 / month"),
      b("Multi-region active-active"),
      b("Zero-downtime failover"),
      b("Dedicated DB clusters"),
      b("24/7 monitoring"),
      b("SLA guarantees"),
      sp(20),
      h3("Example: SA Primary + UK Secondary + 3 Countries"),
      b("Primary region (AWS Cape Town — application + database): $200 – $400/mo"),
      b("Secondary region (AWS London — standby + replica DB): $150 – $300/mo"),
      b("Database replication (continuous sync between regions): $50 – $150/mo"),
      b("DNS failover service (Route 53 health checks): $50/mo"),
      b("SSL certificates (Let's Encrypt): Free"),
      b("Monitoring & alerting (CloudWatch / Datadog basic): $0 – $50/mo"),
      b("Local phone numbers — SA, UK, US (3 numbers): $10/mo"),
      b("Twilio call minutes (~2,000 minutes/month): $40 – $80/mo"),
      sp(20),
      p("ESTIMATED MONTHLY TOTAL: $500 – $1,000"),
      p("At enterprise tier with SLA guarantees and active-active: $2,000 – $5,000/month. This is still very competitive compared to legacy conferencing platforms which charge $10,000–$50,000/month for equivalent setups."),
      sp(20),

      steveBox("I agree — actually it's remarkably low and IMO will ultimately be needed when we get contracts and come under scrutiny from Customer' internal IT/audit teams."),
      davidBox("Exactly right. Multi-region mirroring is not a future nice-to-have — it is a requirement for enterprise client acquisition. Financial institutions will require documented disaster recovery and business continuity capabilities during their vendor due diligence process.\n\nThe fact that CuraLive can deliver global resilience for $500–$1,000/month versus $10,000–$50,000 for legacy platforms is a major competitive advantage. This cost comparison should be front and centre in sales presentations.\n\nWhen enterprise clients' internal IT and audit teams scrutinise the platform, they will specifically ask for:\n\n•  Documented disaster recovery procedures\n•  Business continuity plan with defined RTO/RPO targets\n•  Evidence of failover testing\n•  Data residency and jurisdiction documentation\n\nHaving these ready before the first enterprise pitch will accelerate the sales cycle significantly."),

      // ============ SECTION 5 ============
      pb(),
      h1("5.  Telephony & Bring Your Own Carrier"),
      sp(20),
      p("CuraLive currently uses Twilio for all telephony — dial-in, dial-out, bridge connections, and call recording. Twilio is a global carrier that operates in 180+ countries."),
      sp(20),
      p("However, you are not locked in. CuraLive's telephony layer supports:"),
      sp(20),
      h3("Lower Costs"),
      b("Bring your own SIP trunks from a local carrier"),
      b("Typically 30–70% cheaper at volume"),
      sp(20),
      h3("Local Numbers"),
      b("Get local numbers in SA, UK, US, EU, Asia"),
      b("Attendees dial local, not international"),
      sp(20),
      h3("Redundancy"),
      b("Run multiple carriers"),
      b("If one goes down, calls route through the other automatically"),
      sp(20),
      h3("How BYOC works:"),
      nb("1", "You contract with a local carrier (e.g. Vodacom, BT, AT&T, or any SIP provider)"),
      nb("2", "They provide SIP trunk credentials and local phone numbers"),
      nb("3", "These are configured in CuraLive's telephony settings"),
      nb("4", "All calls now route through your carrier instead of (or alongside) Twilio"),
      nb("5", "Twilio can remain as a backup for automatic failover between carriers"),
      sp(20),
      p("Twilio also supports BYOC natively — you can connect your own SIP trunks through Twilio's platform and keep all existing integrations while benefiting from your own carrier's rates."),
      sp(20),

      steveBox("I think this would be worth investigating when the time's right. It's probably a feature of most carriers now, but when we used Bandwidth they had a real-time call performance dashboard that we always had up on a large screen. It showed all kinds of quality metrics at the network level but also allowed us to drill down to the routing that an individual participant used. It showed latency rates, buffering, packet loss etc and was very useful when investigating complaints about call quality."),
      davidBox("This is excellent operational insight. Steve is right — when running events for banks and financial institutions, having visibility into call quality at the network level is essential for investigating complaints and maintaining SLA compliance.\n\nGood news: Twilio already offers something equivalent. Twilio Insights provides per-call quality metrics including:\n\n•  MOS scores (Mean Opinion Score) — the industry standard for call quality\n•  Jitter — variation in packet arrival time\n•  Packet loss — percentage of audio packets lost in transit\n•  Latency — round-trip delay per participant\n•  Per-participant breakdown — drill down to individual caller quality\n\nThis data can be surfaced directly inside the CuraLive OCC, giving operators real-time visibility into call quality alongside the live transcript, sentiment scores, and compliance flags. Operators could identify and respond to quality issues during the event, not after.\n\nWhen BYOC is implemented, equivalent dashboards from the carrier (like the Bandwidth real-time performance dashboard Steve describes) can be integrated alongside Twilio's metrics. This gives comprehensive quality monitoring across all telephony paths.\n\nRecommendation: Building call quality monitoring into the OCC should be prioritised alongside the BYOC investigation. Enterprise clients will expect it."),

      // ============ SECTION 6 ============
      pb(),
      h1("6.  What's Already in Place"),
      sp(20),
      b("Cloud-agnostic architecture — Node.js + PostgreSQL, runs anywhere"),
      b("Twilio telephony with global reach — already multi-region by default"),
      b("Stateless application design — any server instance can handle any request"),
      b("Database schema supports replication — PostgreSQL streaming replication ready"),
      b("AI/Intelligence via cloud APIs (OpenAI) — no region-specific infrastructure needed"),
      b("Telnyx already referenced as alternative carrier in the codebase"),
      sp(20),
      h3("What needs to be done to go live with mirroring:"),
      nb("1", "Choose a cloud provider and two regions (e.g. AWS Cape Town + London)"),
      nb("2", "Deploy the application to both regions using containers or VMs"),
      nb("3", "Set up managed PostgreSQL with cross-region read replicas"),
      nb("4", "Configure DNS failover (Route 53 or Cloudflare)"),
      nb("5", "Set up monitoring and health check alerts"),
      nb("6", "Test failover with a simulated outage"),
      sp(20),
      p("Timeline: 2–4 weeks for a production-grade deployment with testing. No code changes required — this is purely infrastructure configuration."),

      // ============ SECTION 7 ============
      sp(40),
      h1("7.  Why This Matters for Enterprise Sales"),
      sp(20),
      b("Enterprise readiness — multi-region shows the platform is production-grade, not a prototype"),
      b("Global scalability — can serve clients in any geography without rebuilding"),
      b("Regulatory flexibility — data can stay within required jurisdictions"),
      b("Cost efficiency — $500–$1,000/month for global resilience vs $10,000–$50,000 for legacy platforms"),
      b("Carrier independence — not locked to any single vendor, can negotiate rates at scale"),
      b("Zero-code migration — no application changes needed to move between clouds"),
      sp(20),
      p("CuraLive is designed to be acquired. The infrastructure story is as strong as the product story."),

      // ============ NEW SECTION 8 — PIN & REGISTRATION ============
      pb(),
      h1("8.  Automated PIN Generation & One-Click Registration"),
      sp(20),

      steveBox("I've added a comment in the Word doc but can you help me understand how the system would allocate a Personal PIN for a participant joining an operator-managed audio only call. One of the developments I was seeing more from big Customers was a way of preventing invited participants from having to visit a website to enter their details and register for a call. Could CuraLive be developed so a Customer could send out a generic invitation to a mailing list of theirs with a \"Click here to Register for the Event button\"? Our system/App knows who the email has been sent to (data from mailing list) and creates a unique joining PIN and activates it on CuraLive. For mixed events the Click to Register button could offer options for participating via Teams Zoom etc as well as phone. We would then need to back-end this to those other applications and send the appropriate link/number to the participant via a \"Click here to join the event\" button. Data from the registration process can be sent back to the Customer's own system via APIs and in fact....the whole registration process could be run from the Customer's own CRM system with it sending PIN/link requests to CuraLive via APIs.\n\nMake sense?...doable??"),
      davidBox("This makes complete sense and is absolutely doable. In fact, this is exactly how modern enterprise event platforms should work. Steve is describing three distinct capabilities that CuraLive can support — let me break them down."),
      sp(20),

      h2("8.1  How Personal PINs Work Today"),
      sp(20),
      p("CuraLive already generates unique PINs for participants during the registration process. Here's the current flow:"),
      sp(20),
      nb("1", "An event is created in the booking system with a dial-in number assigned"),
      nb("2", "Participants register via the registration page (or are added by the operator)"),
      nb("3", "CuraLive generates a unique numeric PIN for each participant (e.g. 847291)"),
      nb("4", "The PIN is stored against the participant's record — name, email, company, role"),
      nb("5", "On event day, the participant dials the event number and enters their PIN"),
      nb("6", "CuraLive validates the PIN, identifies who they are, and admits them to the correct event"),
      nb("7", "The operator sees the participant appear in the OCC with their full identity — not just a phone number"),
      sp(20),
      p("This PIN-based identification is critical for the AI intelligence features. Because CuraLive knows exactly who is on the call, it can track individual sentiment, attribute questions to named participants, and generate post-event reports that reference real people rather than anonymous callers."),

      sp(40),
      h2("8.2  One-Click Registration from Email (Steve's Scenario)"),
      sp(20),
      p("Steve's proposal eliminates the manual registration step entirely. Here's how it would work:"),
      sp(20),
      h3("The Customer's Workflow:"),
      nb("1", "Customer (e.g. a bank's IR team) uploads their mailing list to CuraLive — or sends it via API from their CRM"),
      nb("2", "CuraLive automatically creates a participant record for each person on the list"),
      nb("3", "CuraLive generates a unique PIN for each participant and activates it"),
      nb("4", "CuraLive generates a personalised email for each participant containing a \"Click here to Register\" button"),
      nb("5", "The button links to a pre-filled registration page — the participant's name and email are already populated"),
      nb("6", "The participant clicks, confirms their details (or just clicks \"Confirm\"), and they're registered"),
      nb("7", "They receive a confirmation email with their personal PIN and dial-in number"),
      sp(20),

      h3("The Zero-Click Variant:"),
      p("For customers who want even less friction, CuraLive can skip the confirmation step entirely:"),
      sp(20),
      nb("1", "Customer uploads mailing list"),
      nb("2", "CuraLive auto-generates PINs for everyone on the list"),
      nb("3", "Each person receives an email: \"You are registered for [Event Name]. Your personal PIN is [PIN]. Dial [number] to join.\""),
      nb("4", "No website visit required. No registration form. Just dial and enter PIN."),
      sp(20),
      p("This is ideal for large-scale calls where the customer already knows exactly who should attend — quarterly earnings calls, board updates, analyst briefings."),

      sp(40),
      h2("8.3  Mixed-Mode Events (Phone + Teams + Zoom)"),
      sp(20),
      p("Steve raises a critical enterprise requirement: participants choosing how they want to join. CuraLive can support this with a multi-mode registration flow:"),
      sp(20),
      h3("How It Works:"),
      nb("1", "Participant receives the email invitation with a \"Click here to Register\" button"),
      nb("2", "The registration page shows joining options:"),
      b("Join by Phone — shows the dial-in number and their personal PIN"),
      b("Join via Microsoft Teams — generates and displays a Teams meeting link"),
      b("Join via Zoom — generates and displays a Zoom meeting link"),
      b("Join via Web Browser — provides a link to the CuraLive web attendee room"),
      nb("3", "Participant selects their preferred method"),
      nb("4", "CuraLive stores their choice and sends a personalised \"Click here to Join\" email on event day with the correct link/number for their chosen method"),
      sp(20),

      h3("Behind the Scenes:"),
      p("When a participant chooses Teams or Zoom, CuraLive needs to:"),
      b("Create the meeting in the chosen platform via its API (Teams Graph API or Zoom API)"),
      b("Store the meeting link against the participant record"),
      b("On event day, the Shadow Bridge or bot connects CuraLive to that platform to capture audio/transcript"),
      b("All intelligence features (sentiment, compliance, Q&A) work regardless of which platform the participant chose"),
      sp(20),
      p("The key insight: from CuraLive's perspective, it doesn't matter how the participant joins. The AI intelligence layer processes the audio the same way whether it comes from a phone call, a Teams meeting, or a Zoom session. The participant gets their preferred experience; the operator gets full intelligence."),

      sp(40),
      h2("8.4  CRM API Integration"),
      sp(20),
      p("Steve's most powerful suggestion: running the entire registration process from the customer's own CRM. This is not just doable — it's the enterprise integration model that large financial institutions prefer."),
      sp(20),

      h3("CuraLive Registration API:"),
      p("CuraLive would expose a set of REST/tRPC API endpoints that the customer's CRM can call directly:"),
      sp(20),
      b("POST /api/registration/create-event — Create an event and get back the event ID + dial-in number"),
      b("POST /api/registration/add-participant — Add a participant by name/email, get back their unique PIN"),
      b("POST /api/registration/bulk-add — Upload an entire mailing list, get back all PINs in one response"),
      b("GET /api/registration/participant-status — Check if a participant has joined/is active"),
      b("POST /api/registration/generate-join-link — Get a personalised join link for any platform (phone/Teams/Zoom/web)"),
      b("GET /api/registration/event-summary — Get real-time event stats (registered, joined, active)"),
      b("POST /api/registration/webhook — Register a webhook URL to receive real-time updates (participant joined, left, sentiment alerts)"),
      sp(20),

      h3("The CRM-Driven Flow:"),
      nb("1", "Bank's CRM system calls CuraLive API to create an event"),
      nb("2", "CRM sends participant list — CuraLive returns PINs for each"),
      nb("3", "CRM sends invitations using its own email templates and branding"),
      nb("4", "Participant clicks \"Register\" in the CRM email — CRM calls CuraLive API to confirm registration"),
      nb("5", "CRM receives the PIN/join link and sends confirmation to participant"),
      nb("6", "During the event, CRM receives real-time webhook updates (who joined, sentiment, compliance alerts)"),
      nb("7", "After the event, CRM pulls the intelligence report via API and stores it against the customer record"),
      sp(20),
      p("This model means the bank's IR team never needs to log into CuraLive directly. They manage everything from their existing CRM (Salesforce, HubSpot, or custom). CuraLive becomes the invisible intelligence engine behind their existing workflow."),
      sp(20),
      p("This is also a significant competitive moat. Legacy conferencing platforms typically force customers to use their portal. CuraLive's API-first approach lets enterprises embed event intelligence into their existing tools — exactly what their IT teams want to see."),

      sp(40),
      h2("8.5  Technical Feasibility Assessment"),
      sp(20),
      p("All of the above is architecturally sound and buildable within CuraLive's existing stack:"),
      sp(20),
      b("PIN generation — already implemented. CuraLive generates unique numeric PINs and validates them on dial-in via Twilio webhooks"),
      b("Mailing list import — straightforward CSV/API ingestion into the existing participant database"),
      b("Email delivery — can use existing Twilio SendGrid integration or customer's own email service via API"),
      b("Teams/Zoom integration — requires API credentials from the customer's Microsoft 365 / Zoom account. Meeting creation is well-documented via Microsoft Graph API and Zoom REST API"),
      b("CRM API — CuraLive already uses tRPC for its API layer. Exposing registration endpoints externally requires adding API key authentication and rate limiting"),
      b("Webhook notifications — standard implementation pattern. CuraLive would POST JSON payloads to the customer's registered webhook URL on key events"),
      sp(20),

      h3("Development Priority:"),
      nb("1", "Phase 1 — Mailing list import + auto-PIN generation + email with \"Click to Register\" (2–3 weeks)"),
      nb("2", "Phase 2 — Multi-mode registration (phone + Teams + Zoom choice) (3–4 weeks)"),
      nb("3", "Phase 3 — External CRM API with authentication + webhooks (3–4 weeks)"),
      nb("4", "Phase 4 — Zero-click registration + CRM-driven flow (2 weeks)"),
      sp(20),
      p("Total estimated build time: 10–13 weeks for the full capability. Phase 1 alone delivers the core \"one-click registration\" that Steve describes and could be prioritised for early customer demos."),

      // ============ SUMMARY ============
      pb(),
      h1("Summary — Steve's Comments & Agreed Actions"),
      sp(20),

      h3("Comment 1: Telephony Independence (Section 1)"),
      p("Steve's point: Customers — especially big banks — will love the fact that phone calls don't drop during a failover."),
      p("Action: Make call independence the lead selling point in client presentations. Add a dedicated callout in all enterprise materials: \"Active calls are managed by Twilio's global infrastructure, completely independent of CuraLive servers. Server failover does not interrupt calls in progress.\""),
      sp(20),

      h3("Comment 2: Health Check Intervals (Section 3)"),
      p("Steve's point: Can health checks run at shorter intervals? Could we build an AI agent for monitoring?"),
      p("Action: Health checks are configurable down to 5-second intervals via the cloud provider. For application-level monitoring (DB, Twilio, AI API, active events), the AI Infrastructure Guardian has now been built and is live — performing deep health checks every 30 seconds with AI root cause attribution and automated customer incident reports."),
      sp(20),

      h3("Comment 3: Cost Positioning (Section 4)"),
      p("Steve's point: The cost is remarkably low and will be needed when under IT/audit scrutiny from enterprise clients."),
      p("Action: Position the $500–$1,000/month cost comparison against legacy platforms ($10,000–$50,000) as a headline in all sales materials. Prepare disaster recovery documentation, business continuity plan, and RTO/RPO targets before the first enterprise pitch."),
      sp(20),

      h3("Comment 4: Call Quality Monitoring (Section 5)"),
      p("Steve's point: Bandwidth had a real-time call performance dashboard showing per-participant quality metrics. This was invaluable for investigating complaints."),
      p("Action: Twilio Insights already provides equivalent metrics (MOS, jitter, packet loss, latency per participant). Surface this data inside the CuraLive OCC. When BYOC is implemented, integrate carrier-level quality dashboards alongside Twilio's. Prioritise this as an enterprise readiness feature."),
      sp(20),

      h3("Comment 5: Automated PIN & One-Click Registration (Section 8 — NEW)"),
      p("Steve's point: Can CuraLive auto-generate PINs from a mailing list and offer one-click registration with multi-platform joining options? Can the whole flow be driven from the customer's CRM via API?"),
      p("Action: Fully doable within CuraLive's existing architecture. PIN generation already works. Build in 4 phases: (1) mailing list import + auto-PIN + email registration, (2) multi-mode joining (phone/Teams/Zoom), (3) external CRM API with webhooks, (4) zero-click registration. Phase 1 delivers the core capability in 2–3 weeks."),

      sp(40),

      h2("Overall Assessment"),
      sp(20),
      p("Steve is thinking like an enterprise buyer — exactly the right lens."),
      p("Every comment aligns with what bank IT teams and procurement departments will ask during vendor assessment."),
      sp(20),
      p("His operational experience (the Bandwidth dashboard reference) is particularly valuable and should inform how the OCC evolves."),
      sp(20),
      p("The PIN/registration API suggestion is strategically important — it positions CuraLive as an embeddable intelligence engine rather than a standalone portal, which is exactly the integration model that enterprise buyers prefer."),

      sp(200),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  —  Confidential  |  Response to Partner Comments  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Mirroring_Response_v2.docx"), buf);
console.log("Done.");
