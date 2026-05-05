import { generateAnchoredDelta } from "../server/services/AnchoredDeltaService";

async function main() {
  console.log("=== Phase B Step 2 — Anchored Delta Validation ===");

  const result = await generateAnchoredDelta({
    topic: "DEBT_POSITION",
    speaker: "David Cameron",
    priorStatement: "a leverage ratio stands at 25 times flat on last quarter and significantly down from the 29 times at year end",
    priorCommitmentLevel: "explicit",
    currentStatement: "we are comfortable with our current debt levels and continue to monitor the position closely",
    currentCommitmentLevel: "hedged",
  });

  console.log("\nRESULT:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
