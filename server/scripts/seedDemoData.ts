import { rawSql } from "../db";

const LOG = (msg: string) => console.log(`[DemoSeed] ${msg}`);

const DEMO_ORGS = [
  {
    id: "meridian-holdings",
    name: "Meridian Holdings",
    eventType: "earnings_call",
    eventName: "Q4 2025 Earnings Call",
    riskLevel: "medium",
    sessionId: 99901,
    transcript: [
      { speaker: "Sarah Chen", role: "CEO", text: "Thank you for joining us today. I'm pleased to report a strong quarter with revenue growth of 12% year-over-year, driven by our expansion into the European market.", time: 0 },
      { speaker: "Sarah Chen", role: "CEO", text: "Our gross margin improved by 150 basis points to 42.3%, reflecting ongoing operational discipline and cost optimisation efforts across the group.", time: 15 },
      { speaker: "James O'Brien", role: "CFO", text: "Total revenue reached 2.4 billion rand for the quarter, with earnings per share of 4.82 rand. We maintain our guidance of 8 to 10% annual revenue growth for the full year.", time: 30 },
      { speaker: "James O'Brien", role: "CFO", text: "Working capital management remains a priority. We expect to reduce days sales outstanding from 62 to below 55 days by the end of Q2 2026.", time: 45 },
      { speaker: "James O'Brien", role: "CFO", text: "Capital expenditure for the quarter was 180 million rand, in line with our previously communicated guidance. We anticipate capex intensity will normalise to 6% of revenue going forward.", time: 60 },
      { speaker: "Sarah Chen", role: "CEO", text: "We remain committed to our ESG targets. Carbon emissions per unit of production have decreased by 18% since 2023, and we are on track to achieve our 2027 science-based targets.", time: 75 },
      { speaker: "Analyst - David Lee", role: "Analyst", text: "Can you provide more colour on the European expansion timeline and the expected margin impact?", time: 90 },
      { speaker: "Sarah Chen", role: "CEO", text: "The European operations will reach breakeven by Q3 2026. We've committed to investing an additional 200 million rand in the region over the next 18 months.", time: 105 },
      { speaker: "Analyst - Priya Naidoo", role: "Analyst", text: "What is the status of the regulatory review in the Eastern Cape mining operation?", time: 120 },
      { speaker: "James O'Brien", role: "CFO", text: "The DMR review is ongoing. We expect a formal response by end of May 2026. Our legal counsel advises this is a routine matter, but we have provisioned 45 million rand as a precaution.", time: 135 },
    ],
    commitments: [
      { text: "Revenue growth of 8-10% for full year", type: "financial_target", deadline: "2026-12-31", confidence: 0.88, speaker: "James O'Brien" },
      { text: "Reduce DSO from 62 to below 55 days by end Q2 2026", type: "operational_target", deadline: "2026-06-30", confidence: 0.82, speaker: "James O'Brien" },
      { text: "European operations breakeven by Q3 2026", type: "strategic_milestone", deadline: "2026-09-30", confidence: 0.75, speaker: "Sarah Chen" },
      { text: "Additional 200M rand investment in European region over next 18 months", type: "investment_commitment", deadline: "2027-06-30", confidence: 0.90, speaker: "Sarah Chen" },
      { text: "Achieve 2027 science-based ESG targets", type: "esg_commitment", deadline: "2027-12-31", confidence: 0.70, speaker: "Sarah Chen" },
    ],
    complianceFlags: [
      { type: "forward_looking_statement", severity: "medium", speaker: "Sarah Chen", pattern: "European operations will reach breakeven by Q3 2026" },
      { type: "regulatory_disclosure", severity: "high", speaker: "James O'Brien", pattern: "DMR review is ongoing... provisioned 45 million rand" },
      { type: "hedging_language", severity: "low", speaker: "James O'Brien", pattern: "Our legal counsel advises this is a routine matter" },
    ],
    driftEvents: [
      { commitmentText: "Revenue growth of 8-10%", driftType: "numerical", severity: "low", explanation: "Previous quarter guidance was 10-12%; range has been lowered by 2 percentage points", confidence: 0.72 },
    ],
    profileSummary: {
      overall_risk_level: "medium",
      delivery_reliability: "strong",
      relationship_health: "positive",
      governance_quality: "strong",
      key_concerns: ["Regulatory review pending in Eastern Cape", "European expansion margin pressure", "Guidance range narrowed downward"],
      key_strengths: ["Consistent earnings delivery", "Strong ESG trajectory", "Transparent regulatory disclosure", "Detailed financial commitments with timelines"],
    },
  },
  {
    id: "atlas-energy",
    name: "Atlas Energy Group",
    eventType: "agm",
    eventName: "2026 Annual General Meeting",
    riskLevel: "high",
    sessionId: 99902,
    transcript: [
      { speaker: "Michael van der Merwe", role: "Chairman", text: "Welcome to the 2026 Annual General Meeting of Atlas Energy Group. This has been a challenging year for the energy sector globally, and Atlas has not been immune to these headwinds.", time: 0 },
      { speaker: "Michael van der Merwe", role: "Chairman", text: "I want to address the elephant in the room. Our share price has declined 28% over the past twelve months, and I understand the frustration of shareholders.", time: 15 },
      { speaker: "Rebecca Moloi", role: "CEO", text: "Revenue declined 15% to 8.2 billion rand, primarily due to lower commodity prices and the planned shutdown of our Mpumalanga facility for refurbishment.", time: 30 },
      { speaker: "Rebecca Moloi", role: "CEO", text: "We are implementing a comprehensive turnaround plan. Phase one involves reducing overhead costs by 800 million rand by the end of fiscal year 2027.", time: 45 },
      { speaker: "Rebecca Moloi", role: "CEO", text: "I must be transparent about a material matter. We have identified legacy environmental liabilities at three sites that were previously undisclosed. We are in discussion with the regulator.", time: 60 },
      { speaker: "Thomas Kruger", role: "CFO", text: "The environmental remediation provision is estimated at 1.2 billion rand over five years. This will be funded from operating cash flow and does not require additional equity raising at this stage.", time: 75 },
      { speaker: "Thomas Kruger", role: "CFO", text: "Net debt to EBITDA has increased to 3.2 times from 2.1 times last year. We are targeting a reduction to below 2.5 times by March 2027.", time: 90 },
      { speaker: "Shareholder - Ahmed Patel", role: "Shareholder", text: "How can the board assure us that there are no further undisclosed liabilities? What has been done to strengthen internal controls?", time: 105 },
      { speaker: "Michael van der Merwe", role: "Chairman", text: "We have commissioned an independent review by PwC of all environmental and compliance matters. The board has also strengthened the audit committee with two additional independent directors.", time: 120 },
      { speaker: "Shareholder - Lisa Ndlovu", role: "Shareholder", text: "Will the dividend be maintained given the financial pressures?", time: 135 },
      { speaker: "Thomas Kruger", role: "CFO", text: "We are suspending the interim dividend to preserve cash. The board will review the final dividend based on H2 performance, but shareholders should prepare for a reduced payout.", time: 150 },
      { speaker: "Rebecca Moloi", role: "CEO", text: "I want to assure all stakeholders that the management team is fully committed to restoring value. We expect the turnaround to show measurable results within 18 months.", time: 165 },
    ],
    commitments: [
      { text: "Reduce overhead costs by 800M rand by end FY2027", type: "cost_reduction", deadline: "2027-03-31", confidence: 0.65, speaker: "Rebecca Moloi" },
      { text: "Environmental remediation of 1.2B rand over five years", type: "regulatory_commitment", deadline: "2031-12-31", confidence: 0.80, speaker: "Thomas Kruger" },
      { text: "Reduce net debt to EBITDA below 2.5x by March 2027", type: "financial_target", deadline: "2027-03-31", confidence: 0.55, speaker: "Thomas Kruger" },
      { text: "Turnaround to show measurable results within 18 months", type: "strategic_milestone", deadline: "2027-10-31", confidence: 0.45, speaker: "Rebecca Moloi" },
      { text: "Independent PwC review of environmental and compliance matters", type: "governance_action", deadline: "2026-09-30", confidence: 0.90, speaker: "Michael van der Merwe" },
    ],
    complianceFlags: [
      { type: "material_disclosure", severity: "critical", speaker: "Rebecca Moloi", pattern: "legacy environmental liabilities at three sites that were previously undisclosed" },
      { type: "forward_looking_statement", severity: "high", speaker: "Rebecca Moloi", pattern: "turnaround to show measurable results within 18 months" },
      { type: "dividend_warning", severity: "high", speaker: "Thomas Kruger", pattern: "suspending the interim dividend... shareholders should prepare for a reduced payout" },
      { type: "leverage_risk", severity: "high", speaker: "Thomas Kruger", pattern: "Net debt to EBITDA has increased to 3.2 times" },
      { type: "hedging_language", severity: "medium", speaker: "Thomas Kruger", pattern: "does not require additional equity raising at this stage" },
    ],
    driftEvents: [
      { commitmentText: "Maintain annual dividend of 3.50 rand per share", driftType: "directional", severity: "high", explanation: "Prior year commitment to maintain dividend has been reversed; interim dividend suspended entirely", confidence: 0.92 },
      { commitmentText: "Net debt to EBITDA to remain below 2.5x", driftType: "numerical", severity: "high", explanation: "Previous target of below 2.5x has been breached; now at 3.2x with target to return to 2.5x by March 2027", confidence: 0.88 },
    ],
    profileSummary: {
      overall_risk_level: "high",
      delivery_reliability: "weak",
      relationship_health: "strained",
      governance_quality: "improving",
      key_concerns: ["Undisclosed environmental liabilities", "Dividend suspension", "Leverage breach at 3.2x", "Revenue decline of 15%", "Share price down 28%"],
      key_strengths: ["Transparent acknowledgement of issues", "Independent PwC review commissioned", "Board strengthened with independent directors", "Clear remediation timeline"],
    },
  },
];

export async function seedDemoData(): Promise<{ success: boolean; details: string[] }> {
  const details: string[] = [];

  try {
    for (const org of DEMO_ORGS) {
      LOG(`Seeding demo data for ${org.name} (${org.id})`);

      await rawSql(
        `DELETE FROM shadow_sessions WHERE id = $1`,
        [org.sessionId],
      );

      const transcriptJson = JSON.stringify(org.transcript.map(t => ({
        speaker_name: t.speaker,
        text: t.text,
        start_time: t.time * 1000,
        role: t.role,
      })));

      const aiCoreResults = {
        sentiment_analysis: {
          overall: org.riskLevel === "high" ? "negative" : "neutral",
          score: org.riskLevel === "high" ? -0.35 : 0.22,
          positive_signals: org.riskLevel === "high" ? 3 : 7,
          negative_signals: org.riskLevel === "high" ? 8 : 3,
          neutral_signals: org.transcript.length - (org.riskLevel === "high" ? 11 : 10),
          key_themes: org.riskLevel === "high"
            ? ["turnaround strategy", "environmental liabilities", "dividend suspension", "leverage", "governance reform"]
            : ["revenue growth", "margin expansion", "European market", "ESG commitment", "regulatory review"],
        },
        commitment_extraction: {
          commitments: org.commitments.map(c => ({
            commitment_text: c.text,
            speaker: c.speaker,
            commitment_type: c.type,
            confidence: c.confidence,
            deadline: c.deadline,
            drift_detected: false,
          })),
        },
        compliance_screening: {
          flags: org.complianceFlags.map(f => ({
            flag_type: f.type,
            severity: f.severity,
            speaker: f.speaker,
            matched_pattern: f.pattern,
          })),
        },
      };

      const driftResults = {
        commitments_evaluated: org.commitments.length,
        statements_processed: org.transcript.length,
        drift_events_created: org.driftEvents.length,
        drift_events: org.driftEvents.map((d, i) => ({
          drift_event_id: `demo-drift-${org.id}-${i}`,
          commitment_text: d.commitmentText,
          drift_type: d.driftType,
          severity: d.severity,
          explanation: d.explanation,
          confidence: d.confidence,
        })),
      };

      const govExecutiveSummary = org.riskLevel === "high"
        ? "Atlas Energy faces elevated governance risk following disclosure of previously unreported environmental liabilities across three sites. The board has suspended interim dividends to preserve cash and has commissioned an independent PwC review. Net debt to EBITDA has breached the 2.5x target at 3.2x. A comprehensive turnaround plan targeting 800M rand in cost reductions has been announced, with measurable results expected within 18 months. Board composition has been strengthened with two additional independent directors."
        : "Meridian Holdings demonstrates strong governance discipline with transparent financial reporting and clear commitment tracking. The company delivered 12% revenue growth with margin expansion to 42.3%. European expansion is progressing with breakeven targeted by Q3 2026. One area requiring monitoring is the pending DMR regulatory review in Eastern Cape, for which a 45M rand provision has been prudently established. ESG commitments remain on track.";

      const govSummary = {
        governance_record_id: `demo-gov-${org.id}`,
        record_type: org.eventType === "agm" ? "agm_minutes" : "event_governance",
        commitments: org.commitments.length,
        compliance_flags: org.complianceFlags.length,
        matters_arising: org.driftEvents.length,
        overall_risk_level: org.riskLevel,
        confidence: org.riskLevel === "high" ? 0.72 : 0.85,
        duration_ms: 450,
        executive_summary: govExecutiveSummary,
      };

      const profileSummary = {
        profile_id: `demo-profile-${org.id}`,
        version: 3,
        overall_risk_level: org.profileSummary.overall_risk_level,
        delivery_reliability: org.profileSummary.delivery_reliability,
        relationship_health: org.profileSummary.relationship_health,
        governance_quality: org.profileSummary.governance_quality,
        events_incorporated: org.riskLevel === "high" ? 4 : 6,
        confidence: org.riskLevel === "high" ? 0.68 : 0.82,
        key_concerns: org.profileSummary.key_concerns,
        key_strengths: org.profileSummary.key_strengths,
      };

      const pipelineBase = Date.now() - 120000;
      const pipelineTrace = {
        session_id: org.sessionId,
        started_at: new Date(pipelineBase).toISOString(),
        completed_at: new Date(pipelineBase + 4850).toISOString(),
        total_duration_ms: 4850,
        steps: [
          { step: "compliance_email", status: "ok", started_at: new Date(pipelineBase).toISOString(), duration_ms: 320, detail: { recipients: 2, flags: org.complianceFlags.length } },
          { step: "ai_core_analysis", status: "ok", started_at: new Date(pipelineBase + 320).toISOString(), duration_ms: 1850, detail: { job_id: `demo-job-${org.id}`, status: "complete", modules: 4 } },
          { step: "drift_detection", status: "ok", started_at: new Date(pipelineBase + 2170).toISOString(), duration_ms: 920, detail: { drifts: org.driftEvents.length } },
          { step: "governance_record", status: "ok", started_at: new Date(pipelineBase + 3090).toISOString(), duration_ms: 680, detail: { commitments: org.commitments.length } },
          { step: "profile_update", status: "ok", started_at: new Date(pipelineBase + 3770).toISOString(), duration_ms: 450, detail: { version: 3, risk: org.riskLevel } },
          { step: "ai_report", status: "ok", started_at: new Date(pipelineBase + 4220).toISOString(), duration_ms: 580, detail: { modules: 10 } },
          { step: "report_delivery", status: "ok", started_at: new Date(pipelineBase + 4800).toISOString(), duration_ms: 50, detail: { recipients: 3 } },
          { step: "board_intelligence", status: "skipped", started_at: new Date(pipelineBase + 4850).toISOString(), duration_ms: 0, detail: { reason: "async_deferred" } },
          { step: "briefing_accuracy", status: "skipped", started_at: new Date(pipelineBase + 4850).toISOString(), duration_ms: 0, detail: { reason: "async_deferred" } },
        ],
        overall_status: "complete",
      };

      await rawSql(
        `INSERT INTO shadow_sessions (
          id, client_name, company, event_name, event_type, platform, meeting_url, status,
          local_transcript_json,
          ai_core_job_id, ai_core_status, ai_core_results,
          ai_drift_status, ai_drift_results,
          ai_governance_id, ai_governance_results,
          ai_profile_version, ai_profile_summary,
          ai_pipeline_trace,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'demo', 'https://demo.curalive.com', 'completed',
          $6,
          $7, 'complete', $8,
          $9, $10,
          $11, $12,
          $13, $14,
          $15,
          NOW() - interval '2 hours'
        )
        ON CONFLICT (id) DO UPDATE SET
          client_name = EXCLUDED.client_name,
          company = EXCLUDED.company,
          event_name = EXCLUDED.event_name,
          event_type = EXCLUDED.event_type,
          status = EXCLUDED.status,
          local_transcript_json = EXCLUDED.local_transcript_json,
          ai_core_job_id = EXCLUDED.ai_core_job_id,
          ai_core_status = EXCLUDED.ai_core_status,
          ai_core_results = EXCLUDED.ai_core_results,
          ai_drift_status = EXCLUDED.ai_drift_status,
          ai_drift_results = EXCLUDED.ai_drift_results,
          ai_governance_id = EXCLUDED.ai_governance_id,
          ai_governance_results = EXCLUDED.ai_governance_results,
          ai_profile_version = EXCLUDED.ai_profile_version,
          ai_profile_summary = EXCLUDED.ai_profile_summary,
          ai_pipeline_trace = EXCLUDED.ai_pipeline_trace`,
        [
          org.sessionId,
          org.name,
          org.name,
          org.eventName,
          org.eventType,
          transcriptJson,
          `demo-job-${org.id}`,
          JSON.stringify(aiCoreResults),
          org.driftEvents.length > 0 ? "drift_detected" : "no_drift",
          JSON.stringify(driftResults),
          `demo-gov-${org.id}`,
          JSON.stringify(govSummary),
          3,
          JSON.stringify(profileSummary),
          JSON.stringify(pipelineTrace),
        ],
      );

      details.push(`Session ${org.sessionId} (${org.name}) seeded with ${org.commitments.length} commitments, ${org.complianceFlags.length} flags, ${org.driftEvents.length} drifts`);
      LOG(details[details.length - 1]);
    }

    LOG("Demo seed complete");
    return { success: true, details };
  } catch (e) {
    LOG(`Demo seed failed: ${(e as Error).message}`);
    return { success: false, details: [...details, `Error: ${(e as Error).message}`] };
  }
}

if (process.argv[1]?.includes("seedDemoData")) {
  import("../_core/index").then(() => {
    setTimeout(() => {
      seedDemoData().then(r => {
        console.log(JSON.stringify(r, null, 2));
        process.exit(r.success ? 0 : 1);
      });
    }, 3000);
  });
}
