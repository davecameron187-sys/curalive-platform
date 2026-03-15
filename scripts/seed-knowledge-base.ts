import "dotenv/config";
import { getDb } from "../server/db";

const entries = [
  // ── Platform Overview ──
  {
    category: "platform",
    question: "What is CuraLive?",
    answer: "CuraLive is a real-time AI intelligence platform for investor events — earnings calls, AGMs, analyst briefings, and investor days. It provides AI-powered tools for the full investor communication lifecycle: preparing for calls, monitoring them live, generating post-event intelligence reports, building a question database, and benchmarking communication quality across sectors.",
    source: "Platform overview",
    keywords: "curalive platform overview what is investor events earnings calls"
  },
  {
    category: "platform",
    question: "What features does CuraLive offer?",
    answer: "CuraLive offers five core intelligence features: (1) Earnings Call Preparation Intelligence — AI briefings that predict investor questions before they're asked. (2) Real-Time AI Co-Pilot (Shadow Mode) — live event monitoring with sentiment analysis and Q&A intelligence. (3) Investor Intelligence Reports — AI-generated post-event reports with communication grades. (4) Investor Question Intelligence — a structured database of investor questions scored for difficulty and avoidance. (5) Investor Communication Benchmarking — sector-level benchmarks and the CICI index. Plus the Intelligence Terminal for financial professionals.",
    source: "Feature overview",
    keywords: "features capabilities shadow mode intelligence reports benchmarks ECPI IIR IQI CICI"
  },
  // ── Shadow Mode / Live Co-Pilot ──
  {
    category: "shadow_mode",
    question: "How does Shadow Mode work?",
    answer: "Shadow Mode is CuraLive's real-time AI co-pilot that runs alongside live investor events. It captures audio transcription via Recall.ai, performs live sentiment analysis, tracks investor question patterns, detects compliance risks, and provides the operator with real-time intelligence on the call — all without participants knowing the system is active. Access it at /shadow-mode.",
    source: "Shadow Mode feature",
    keywords: "shadow mode co-pilot live real-time monitoring transcription sentiment analysis"
  },
  {
    category: "shadow_mode",
    question: "Can participants see that Shadow Mode is running?",
    answer: "No. Shadow Mode operates silently in the background. Participants on the call are not aware the system is monitoring or analysing the event. Only the operator running Shadow Mode can see the intelligence dashboard.",
    source: "Shadow Mode feature",
    keywords: "shadow mode participants hidden silent invisible"
  },
  // ── Earnings Call Preparation ──
  {
    category: "ecpi",
    question: "What is Earnings Call Preparation Intelligence?",
    answer: "Earnings Call Preparation Intelligence (ECPI) generates a pre-event AI briefing that predicts the investor questions most likely to be asked, assigns difficulty scores to each, identifies high-risk disclosure areas with suggested talking points, and provides executive communication tips. It uses GPT-4o trained on your event history and sector data. Access it at /call-preparation.",
    source: "ECPI feature",
    keywords: "call preparation ECPI earnings briefing predicted questions difficulty talking points"
  },
  // ── Investor Intelligence Reports ──
  {
    category: "iir",
    question: "What is an Investor Intelligence Report?",
    answer: "An Investor Intelligence Report (IIR) is an AI-generated post-event report that assigns a communication grade (A to D), identifies five key insights from the event, flags compliance and disclosure risks, scores executive communication quality, and provides IR team recommendations. Reports are branded 'Powered by CuraLive' and designed to circulate to boards and executives. Access at /intelligence-report.",
    source: "IIR feature",
    keywords: "intelligence report IIR post-event communication grade insights risk flags"
  },
  // ── Investor Question Intelligence ──
  {
    category: "iqi",
    question: "What is the Investor Question Intelligence database?",
    answer: "The Investor Question Intelligence (IQI) database is a structured log of investor questions captured across events. Each question is scored by GPT-4o for difficulty (1-10), topic category, investor sentiment, and avoidance detection (whether the executive deflected or avoided the question). The Global Concern Tracker shows the most common investor concerns across all captured events. Access at /investor-questions.",
    source: "IQI feature",
    keywords: "investor questions IQI database difficulty avoidance sentiment global concern tracker"
  },
  // ── Benchmarking / CICI ──
  {
    category: "benchmarks",
    question: "What is the CICI?",
    answer: "The CuraLive Investor Communication Index (CICI) is a proprietary composite index that scores global investor communication quality on a 0-100 scale. It is calculated across four sub-indices: communication quality, investor engagement, compliance quality, and market confidence. It is published quarterly and designed to become the industry benchmark referenced by boards, analysts, and regulators.",
    source: "CICI feature",
    keywords: "CICI index communication quality benchmark quarterly score composite"
  },
  {
    category: "benchmarks",
    question: "How are sector benchmarks calculated?",
    answer: "Sector benchmarks are calculated from anonymised aggregate data across all CuraLive events in a given sector. They include average investor sentiment scores, Q&A difficulty ratings, executive communication quality, and engagement levels. The more companies use CuraLive, the more accurate and comprehensive the benchmarks become — this is the platform's data flywheel.",
    source: "Benchmarks feature",
    keywords: "sector benchmarks anonymised aggregate data flywheel communication quality"
  },
  // ── Intelligence Terminal ──
  {
    category: "intelligence_terminal",
    question: "What is the Intelligence Terminal?",
    answer: "The Intelligence Terminal is a Bloomberg-style dashboard for financial professionals — hedge funds, asset managers, equity analysts, and investment banks. It aggregates all CuraLive intelligence datasets in one place: global investor concern rankings, market reaction correlation signals, executive communication benchmarks by sector, and CICI historical trend data. Access at /intelligence-terminal.",
    source: "Intelligence Terminal feature",
    keywords: "intelligence terminal bloomberg financial professional hedge fund analyst market reaction"
  },
  // ── Partners ──
  {
    category: "partnerships",
    question: "Who is Bastion Capital?",
    answer: "Bastion Capital is one of CuraLive's strategic investment partners. The Bastion integration page at /bastion provides Bastion-specific access to the platform's intelligence features. For detailed partnership terms or commercial questions, please escalate to the CuraLive team.",
    source: "Partnerships",
    keywords: "bastion capital partner investment"
  },
  {
    category: "partnerships",
    question: "Who is Lumi Global?",
    answer: "Lumi Global is an audience engagement technology partner integrated into CuraLive. The Lumi integration at /lumi enables enhanced attendee interaction features for investor events. For integration specifics or commercial queries, please contact the CuraLive team.",
    source: "Partnerships",
    keywords: "lumi global partner audience engagement integration"
  },
  {
    category: "partnerships",
    question: "Does CuraLive work with stock exchanges?",
    answer: "Yes. CuraLive is actively piloting with major exchanges including the JSE (Johannesburg Stock Exchange) and Nasdaq Africa, among others. The platform is designed to serve exchange operators, listed companies, and financial regulators who need structured intelligence on investor communication quality.",
    source: "Partnerships",
    keywords: "JSE Nasdaq Africa stock exchange pilot listed companies"
  },
  // ── Compliance & Disclosure ──
  {
    category: "compliance",
    question: "How does CuraLive handle disclosure risk?",
    answer: "CuraLive's AI monitors live events and post-event transcripts for compliance and disclosure risks. It flags instances where executives may have made selective disclosures, avoided material questions, or used language that could create regulatory exposure. These risks appear in the Investor Intelligence Report and Shadow Mode's live compliance panel. CuraLive is designed to align with POPIA, GDPR, and JSE Listings Requirements principles.",
    source: "Compliance feature",
    keywords: "compliance disclosure risk POPIA GDPR JSE listings requirements regulatory"
  },
  {
    category: "compliance",
    question: "Is CuraLive GDPR compliant?",
    answer: "CuraLive is designed with GDPR and POPIA principles in mind. No personally identifiable information from investors is logged without consent. Event data is anonymised for benchmarking purposes. For full compliance documentation or data processing agreements, please escalate to the CuraLive team.",
    source: "Compliance",
    keywords: "GDPR POPIA compliance data protection privacy"
  },
  // ── Technical / Setup ──
  {
    category: "technical",
    question: "What technology does CuraLive use?",
    answer: "CuraLive is built on React 19 + Vite (frontend), Express + tRPC (backend), MySQL with Drizzle ORM (database), and GPT-4o via OpenAI for AI features. Real-time capabilities use Ably. Transcription is powered by Recall.ai. The platform runs as a single monorepo on Node.js with TypeScript throughout.",
    source: "Tech stack brief",
    keywords: "technology stack React Express tRPC MySQL OpenAI Ably Recall typescript"
  },
  {
    category: "technical",
    question: "What integrations does CuraLive support?",
    answer: "CuraLive integrates with: OpenAI GPT-4o (AI analysis), Ably (real-time events), Recall.ai (audio transcription), Mux (video hosting), Twilio and Telnyx (telephony/conference calls), Resend (email), AWS S3 (document storage), and Lumi Global (audience engagement). Partner integrations include Bastion Capital and exchange-specific configurations.",
    source: "Integrations overview",
    keywords: "integrations OpenAI Ably Recall Mux Twilio Telnyx Lumi Bastion S3"
  },
  // ── Pricing / Escalation ──
  {
    category: "pricing",
    question: "How much does CuraLive cost?",
    answer: "Pricing information for CuraLive is handled directly by the commercial team and varies based on event volume, features required, and the type of organisation. Please escalate this query and a member of the team will follow up with you directly.",
    source: "Commercial",
    keywords: "price cost pricing subscription plan commercial"
  },
  {
    category: "pricing",
    question: "How do I get access to CuraLive?",
    answer: "Access to CuraLive is currently available through direct partnership and pilot programmes. If you represent an exchange, listed company, or financial institution interested in accessing the platform, please escalate this query and the team will reach out.",
    source: "Commercial",
    keywords: "access sign up onboarding pilot programme get started"
  },
  // ── Market Reaction ──
  {
    category: "market_reaction",
    question: "What is Market Reaction Intelligence?",
    answer: "Market Reaction Intelligence is a CuraLive feature that correlates investor event communication patterns with post-event market outcomes. It tracks which communication topics (revenue guidance, margin pressure, avoidance behaviour, etc.) are statistically linked to positive or negative stock price reactions. Over time it builds a predictive model of communication → market outcome. Access at /market-reaction.",
    source: "Market Reaction feature",
    keywords: "market reaction correlation stock price communication patterns prediction"
  },
];

async function seedKnowledgeBase() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  console.log(`Seeding ${entries.length} knowledge base entries...`);

  for (const entry of entries) {
    await conn.execute(
      `INSERT INTO knowledge_entries (category, question, answer, source, keywords)
       VALUES (?, ?, ?, ?, ?)`,
      [entry.category, entry.question, entry.answer, entry.source, entry.keywords]
    );
  }

  console.log("Knowledge base seeded successfully.");
  process.exit(0);
}

seedKnowledgeBase().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
