import { runAnchoredDeltaShadow } from "../server/services/AnchoredDeltaShadowService";

async function main() {
  console.log("=== Phase B Step 3B — Shadow Anchored Delta Runner ===\n");
  await runAnchoredDeltaShadow(6);
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("RUNNER_ERROR:", err);
  process.exit(1);
});
