import { generateNarrativeOutput } from "../server/services/NarrativeOutputService";

async function main() {
  const sessionId = parseInt(process.argv[2] || "197");
  const orgId = parseInt(process.argv[3] || "6");

  console.log("=== Narrative Output Validation ===");
  console.log("session=" + sessionId + " org=" + orgId + "\n");

  const result = await generateNarrativeOutput(sessionId, orgId);

  console.log("Input signals: " + result.inputSignals);
  console.log("Narratives generated: " + result.narratives.length + "\n");

  if (result.narratives.length === 0) {
    console.log("NO_NARRATIVE — insufficient input signals");
  } else {
    for (let i = 0; i < result.narratives.length; i++) {
      console.log("Narrative " + (i + 1) + ":");
      console.log("  " + result.narratives[i].statement);
      console.log("  source: " + result.narratives[i].source + "\n");
    }
  }

  console.log("=== Done ===");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
