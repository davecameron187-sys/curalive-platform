import { runAnchoredDeltaShadow } from "../server/services/AnchoredDeltaShadowService";

async function main() {
  console.log("=== Phase B Step 3B — Shadow Anchored Delta Runner ===\n");
  const sessionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
  await runAnchoredDeltaShadow(6, sessionId);
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("RUNNER_ERROR:", err);
  process.exit(1);
});
