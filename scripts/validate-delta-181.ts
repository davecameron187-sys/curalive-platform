import * as fs from "fs";
import * as path from "path";
import { evaluateSessionDeltas, FeedItem } from "../server/services/NarrativeDeltaService";

const fixtureFile = path.join(process.cwd(), "fixtures/session-181-feed.json");
const raw = fs.readFileSync(fixtureFile, "utf-8");
const items: FeedItem[] = JSON.parse(raw);

console.log("[Validation] Starting Stage 1A validation against session 181");
console.log("[Validation] Items loaded:", items.length);

const results = evaluateSessionDeltas(items);
const surfaced = results.filter(r => !r.suppressed);
const suppressed = results.filter(r => r.suppressed);

console.log("\n[Validation] RESULT SUMMARY");
console.log("Total items:", results.length);
console.log("Surfaced:", surfaced.length);
console.log("Suppressed:", suppressed.length);
console.log("\nSurfaced deltas:");
surfaced.forEach(d => {
  console.log(" [" + d.priority + "] feedItemId=" + d.feedItemId + " — " + d.deltaText);
});
