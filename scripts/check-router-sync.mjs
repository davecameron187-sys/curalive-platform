import fs from "node:fs";

const eagerPath = "./server/routers.eager.ts";
const normalPath = "./server/routers.ts";

function extractRouterNames(content) {
  const matches = content.match(/[A-Za-z0-9_]+Router/g) || [];
  return [...new Set(matches)].sort();
}

const eagerContent = fs.readFileSync(eagerPath, "utf8");
const normalContent = fs.readFileSync(normalPath, "utf8");

const eagerRouters = extractRouterNames(eagerContent);
const normalRouters = extractRouterNames(normalContent);

const onlyInEager = eagerRouters.filter((r) => !normalRouters.includes(r));
const onlyInNormal = normalRouters.filter((r) => !eagerRouters.includes(r));

let exitCode = 0;

if (onlyInEager.length > 0) {
  console.error("Routers only in routers.eager.ts (missing from routers.ts):");
  onlyInEager.forEach((r) => console.error(`  - ${r}`));
  exitCode = 1;
}

if (onlyInNormal.length > 0) {
  console.error("Routers only in routers.ts (missing from routers.eager.ts):");
  onlyInNormal.forEach((r) => console.error(`  - ${r}`));
  exitCode = 1;
}

if (exitCode === 0) {
  console.log(`✓ Router sync OK — ${eagerRouters.length} routers matched in both files`);
} else {
  console.error("\n✖ Router files are out of sync. Fix before deploying.");
}

process.exit(exitCode);
