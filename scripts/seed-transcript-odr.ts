import { rawSql } from "../server/db";
import { extractDisclosureFeatures } from "../server/services/AnchorLookupService";

const WRITE_ELIGIBLE = ["CONFIRMED", "INDICATED", "QUALIFIED"];

interface SeedInput {
  orgId: number;
  sessionLabel: string;
  eventDate: string;
  speakerName: string;
  transcriptText: string;
}

function segmentTranscript(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 40)
    .reduce((acc: string[], sentence) => {
      const last = acc[acc.length - 1];
      if (last && (last + " " + sentence).length < 300) {
        acc[acc.length - 1] = last + ". " + sentence;
      } else {
        acc.push(sentence);
      }
      return acc;
    }, []);
}

async function seedTranscriptOdr(input: SeedInput): Promise<void> {
  const { orgId, sessionLabel, eventDate, speakerName, transcriptText } = input;

  console.log("=== Seeded Anchor Ingestion ===");
  console.log("org_id:    " + orgId);
  console.log("event:     " + sessionLabel);
  console.log("date:      " + eventDate);
  console.log("speaker:   " + speakerName);
  console.log("");

  const segments = segmentTranscript(transcriptText);
  console.log("Segments to process: " + segments.length + "\n");

  let written = 0;
  let skipped = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    let features: any;
    try {
      features = await extractDisclosureFeatures(segment);
    } catch (err: any) {
      console.log("SKIP [" + i + "] extractDisclosureFeatures failed: " + err?.message);
      skipped++;
      continue;
    }

    if (!features.topic) {
      console.log("SKIP [" + i + "] no topic detected: " + segment.slice(0, 60));
      skipped++;
      continue;
    }

    if (!features.commitmentLevel || !WRITE_ELIGIBLE.includes(features.commitmentLevel)) {
      console.log("SKIP [" + i + "] commitment=" + (features.commitmentLevel || "null") + " not write-eligible: " + segment.slice(0, 60));
      skipped++;
      continue;
    }

    if (!features.statementVerbatim || features.statementVerbatim.length < 20) {
      console.log("SKIP [" + i + "] statement too short");
      skipped++;
      continue;
    }

    try {
      await rawSql(`
        INSERT INTO organisation_disclosure_record
          (org_id, session_id, speaker_id, topic, statement, commitment_level,
           source_event, source_date, segment_ref, source_type)
        VALUES ($1, 0, $2, $3, $4, $5, $6, $7, $8, 'seeded')
        ON CONFLICT DO NOTHING
      `, [
        orgId,
        speakerName,
        features.topic,
        features.statementVerbatim,
        features.commitmentLevel,
        sessionLabel,
        eventDate,
        i,
      ]);

      console.log("WRITE [" + i + "] topic=" + features.topic + " level=" + features.commitmentLevel);
      console.log("       statement: " + features.statementVerbatim.slice(0, 80));
      written++;
    } catch (err: any) {
      console.log("SKIP [" + i + "] DB write failed: " + err?.message);
      skipped++;
    }
  }

  console.log("\n=== Complete ===");
  console.log("Written: " + written);
  console.log("Skipped: " + skipped);
}

// ── SEED INPUT — replace transcript text with real historical transcript ──
const input: SeedInput = {
  orgId: 6,
  sessionLabel: "Cell C Q3 2025 Results",
  eventDate: "2025-11-15",
  speakerName: "David Cameron",
  transcriptText: `
    Our leverage ratio stands at 2.9 times, which is within our target range of 2.5 to 3 times.
    We are committed to maintaining our dividend at current levels through the next financial year.
    Revenue grew 8 percent year on year, reaching 16.2 billion rand for the quarter.
    We expect EBITDA margins to expand by 50 to 100 basis points in the second half of the financial year.
    Capital expenditure guidance remains at 2.8 billion rand for the full year.
    Our net debt position is 8.4 billion rand, down from 9.1 billion rand at year end.
    We are targeting free cash flow conversion of 70 percent for the full financial year.
    The board has approved a share buyback programme of up to 500 million rand.
    We expect subscriber growth to return to positive territory in the first half of the next financial year.
    Our cost reduction programme is on track to deliver 400 million rand in savings by year end.
  `,
};

seedTranscriptOdr(input).catch((err) => {
  console.error("SEED_ERROR:", err);
  process.exit(1);
});
