import { runBackfillOnce } from "../services/SessionMemoryBackfillService";

async function main() {
  console.log("[runSessionMemoryBackfill] Running once");
  await runBackfillOnce();
  console.log("[runSessionMemoryBackfill] Complete");
  process.exit(0);
}

main().catch((error) => {
  console.error("[runSessionMemoryBackfill] Failed", error);
  process.exit(1);
});
