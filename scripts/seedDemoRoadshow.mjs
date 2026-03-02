/**
 * Seed script: Pre-populated Aggreko Capital Raise demo roadshow
 * Run with: node scripts/seedDemoRoadshow.mjs
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { randomBytes } from "crypto";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Cannot parse DATABASE_URL: " + url);
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5].split("?")[0],
    ssl: { rejectUnauthorized: false },
  };
}

function token() {
  return randomBytes(16).toString("hex");
}

const ROADSHOW_ID = "aggreko-series-b-2026";

async function main() {
  const conn = await createConnection(parseDbUrl(DB_URL));

  // ── 1. Check if demo roadshow already exists ──────────────────────────────
  const [existing] = await conn.execute(
    "SELECT id FROM live_roadshows WHERE roadshowId = ? LIMIT 1",
    [ROADSHOW_ID]
  );
  if (existing.length > 0) {
    console.log("Demo roadshow already exists (id=" + existing[0].id + "). Skipping seed.");
    await conn.end();
    return;
  }

  // ── 2. Insert roadshow ────────────────────────────────────────────────────
  const [rs] = await conn.execute(
    `INSERT INTO live_roadshows
       (roadshowId, title, issuer, bank, serviceType, platform, status, startDate, endDate, notes, createdByUserId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ROADSHOW_ID,
      "Aggreko PLC — Series B Capital Raise 2026",
      "Aggreko PLC",
      "BofA Securities",
      "capital_raising_1x1",
      "mixed",
      "active",
      "2026-03-10",
      "2026-03-14",
      "Five-day pan-African and EMEA roadshow for Aggreko PLC's USD 150M Series B equity raise. Targeting institutional investors across Johannesburg, London, Dubai, and Nairobi.",
      1,
    ]
  );
  console.log("Created roadshow: " + ROADSHOW_ID);

  // ── 3. Insert meeting slots ───────────────────────────────────────────────
  const meetings = [
    { date: "2026-03-10", start: "08:30", end: "09:15", platform: "zoom", link: "https://zoom.us/j/91234567890?pwd=demo1", meetingId: "912 3456 7890", passcode: "GS2026" },
    { date: "2026-03-10", start: "09:30", end: "10:15", platform: "zoom", link: "https://zoom.us/j/91234567891?pwd=demo2", meetingId: "912 3456 7891", passcode: "BR2026" },
    { date: "2026-03-10", start: "10:30", end: "11:15", platform: "teams", link: "https://teams.microsoft.com/l/meetup-join/demo3", meetingId: "teams-actis", passcode: "AC2026" },
    { date: "2026-03-10", start: "11:30", end: "12:15", platform: "zoom", link: "https://zoom.us/j/91234567893?pwd=demo4", meetingId: "912 3456 7893", passcode: "NI2026" },
    { date: "2026-03-10", start: "13:30", end: "14:15", platform: "zoom", link: "https://zoom.us/j/91234567894?pwd=demo5", meetingId: "912 3456 7894", passcode: "CF2026" },
    { date: "2026-03-10", start: "14:30", end: "15:15", platform: "webex", link: "https://sanlam.webex.com/meet/demo6", meetingId: "webex-sanlam", passcode: "SL2026" },
    { date: "2026-03-11", start: "08:30", end: "09:15", platform: "zoom", link: "https://zoom.us/j/91234567895?pwd=demo7", meetingId: "912 3456 7895", passcode: "JP2026" },
    { date: "2026-03-11", start: "09:30", end: "10:15", platform: "teams", link: "https://teams.microsoft.com/l/meetup-join/demo8", meetingId: "teams-barclays", passcode: "BA2026" },
    { date: "2026-03-11", start: "10:30", end: "11:15", platform: "zoom", link: "https://zoom.us/j/91234567897?pwd=demo9", meetingId: "912 3456 7897", passcode: "OM2026" },
  ];

  const meetingDbIds = [];
  for (const m of meetings) {
    const [mr] = await conn.execute(
      `INSERT INTO live_roadshow_meetings
         (roadshowId, meetingDate, startTime, endTime, platform, videoLink, meetingId, passcode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ROADSHOW_ID, m.date, m.start, m.end, m.platform, m.link, m.meetingId, m.passcode, "scheduled"]
    );
    meetingDbIds.push(mr.insertId);
    console.log("  Meeting: " + m.date + " " + m.start + " — " + m.platform);
  }

  // ── 4. Insert investors ───────────────────────────────────────────────────
  const investors = [
    { idx: 0, name: "Sarah Chen", institution: "Goldman Sachs Asset Management", email: "s.chen@gsam.demo", phone: "+44 20 7774 1000", jobTitle: "Managing Director, Infrastructure", status: "admitted" },
    { idx: 1, name: "James Okafor", institution: "BlackRock Infrastructure", email: "j.okafor@blackrock.demo", phone: "+44 20 7743 3000", jobTitle: "Portfolio Manager, Real Assets", status: "in_waiting_room" },
    { idx: 2, name: "Amara Diallo", institution: "Actis Capital", email: "a.diallo@actis.demo", phone: "+27 11 384 2000", jobTitle: "Partner, Energy Infrastructure", status: "not_arrived" },
    { idx: 3, name: "Pieter van der Berg", institution: "Ninety One", email: "p.vdberg@ninetyone.demo", phone: "+27 21 416 2000", jobTitle: "Head of Listed Infrastructure", status: "not_arrived" },
    { idx: 4, name: "Fatima Al-Rashid", institution: "Coronation Fund Managers", email: "f.alrashid@coronation.demo", phone: "+27 21 680 2000", jobTitle: "Senior Portfolio Manager", status: "not_arrived" },
    { idx: 5, name: "David Nkosi", institution: "Sanlam Investments", email: "d.nkosi@sanlam.demo", phone: "+27 21 947 9111", jobTitle: "CIO, Alternative Investments", status: "not_arrived" },
    { idx: 6, name: "Emily Thornton", institution: "JP Morgan Asset Management", email: "e.thornton@jpmorgan.demo", phone: "+44 20 7742 4000", jobTitle: "Executive Director, Infrastructure Equity", status: "not_arrived" },
    { idx: 7, name: "Kwame Mensah", institution: "Barclays Africa", email: "k.mensah@barclays.demo", phone: "+27 11 895 6000", jobTitle: "Director, Corporate Finance", status: "not_arrived" },
    { idx: 8, name: "Nomvula Dlamini", institution: "Old Mutual Investment Group", email: "n.dlamini@oldmutual.demo", phone: "+27 21 509 5022", jobTitle: "Head of Infrastructure Debt", status: "not_arrived" },
  ];

  const investorDbIds = [];
  for (const inv of investors) {
    const inviteToken = token();
    const [ir] = await conn.execute(
      `INSERT INTO live_roadshow_investors
         (roadshowId, meetingId, name, institution, email, phone, jobTitle, waitingRoomStatus, inviteToken)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ROADSHOW_ID, meetingDbIds[inv.idx], inv.name, inv.institution, inv.email, inv.phone, inv.jobTitle, inv.status, inviteToken]
    );
    investorDbIds.push({ id: ir.insertId, meetingDbId: meetingDbIds[inv.idx] });
    console.log("  Investor: " + inv.name + " @ " + inv.institution);
  }

  // ── 5. Insert commitment signals ─────────────────────────────────────────
  // Check if commitment_signals table exists
  const [tables] = await conn.execute(
    "SHOW TABLES LIKE 'commitment_signals'"
  );
  if (tables.length > 0) {
    const signals = [
      { invIdx: 0, type: "soft_commit", confidence: 85, text: "We're very interested in the infrastructure play here — this aligns well with our emerging markets mandate.", amount: "$15m" },
      { invIdx: 0, type: "interest", confidence: 72, text: "The power generation angle in Sub-Saharan Africa is exactly what we've been looking for.", amount: null },
      { invIdx: 1, type: "soft_commit", confidence: 78, text: "Subject to our IC approval next week, I'd expect us to come in at around $20 million.", amount: "$20m" },
      { invIdx: 1, type: "pricing_discussion", confidence: 65, text: "We'd need to see the valuation come down slightly — the current multiple feels stretched versus peers.", amount: null },
    ];
    for (const sig of signals) {
      const inv = investorDbIds[sig.invIdx];
      await conn.execute(
        `INSERT INTO commitment_signals
           (roadshowId, meetingDbId, investorId, investorName, institution, quote, signalType, confidenceScore, indicatedAmount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ROADSHOW_ID, inv.meetingDbId, inv.id, investors[sig.invIdx].name, investors[sig.invIdx].institution, sig.text, sig.type, sig.confidence, sig.amount]
      );
      console.log("  Signal: " + sig.type + " (" + sig.confidence + "%)");
    }
  } else {
    console.log("  (commitment_signals table not found — skipping signals)");
  }

  // ── 6. Insert briefing pack ───────────────────────────────────────────────
  const [bpTables] = await conn.execute("SHOW TABLES LIKE 'investor_briefing_packs'");
  if (bpTables.length > 0) {
    const inv = investorDbIds[0];
    await conn.execute(
      `INSERT INTO investor_briefing_packs
         (roadshowId, meetingDbId, investorId, investorProfile, recentActivity, suggestedTalkingPoints, knownConcerns)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ROADSHOW_ID,
        inv.meetingDbId,
        inv.id,
        "Goldman Sachs Asset Management manages over $2.5 trillion in AUM globally. Sarah Chen leads the infrastructure equity team with a focus on emerging markets power and utilities. GSAM has been an active investor in African infrastructure since 2018, with notable positions in Eskom bonds, Globeleq, and ContourGlobal.",
        "GSAM increased its emerging markets infrastructure allocation by 12% in Q3 2025. Sarah Chen presented at the Africa Energy Forum in June 2025, highlighting power generation as a key theme. The fund recently exited a position in a South African solar IPP at a 2.8x return.",
        JSON.stringify(["Lead with the Sub-Saharan Africa power generation pipeline — GSAM has stated this is a priority sector.", "Emphasise the USD-denominated revenue streams — reduces FX risk concern.", "Reference the ContourGlobal exit multiple as a comparable — Sarah Chen will know it.", "Highlight the management team's track record in Nigeria and Kenya specifically."]),
        JSON.stringify(["Valuation multiple vs. listed peers — prepare a detailed bridge to justify the premium.", "FX risk on local currency contracts — have the hedging strategy ready.", "Political risk in Nigeria operations — reference the Dangote partnership as a mitigant."]),
      ]
    );
    console.log("  Briefing pack created for Goldman Sachs meeting.");
  } else {
    console.log("  (briefing_packs table not found — skipping briefing pack)");
  }

  console.log("\n✅ Demo roadshow seeded successfully!");
  console.log("   Roadshow slug: " + ROADSHOW_ID);
  console.log("   Visit: https://chorusai-mdu4k2ib.manus.space/live-video");
  console.log("   Then open the 'Aggreko PLC' roadshow to see all meetings, investors, and AI data.");

  await conn.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
