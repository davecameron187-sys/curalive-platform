#!/usr/bin/env node
/**
 * github-pull.mjs
 * Pulls changes from a GitHub branch (default: "manus") into Replit.
 *
 * Usage:
 *   node scripts/github-pull.mjs            (pulls from "manus" branch)
 *   node scripts/github-pull.mjs main       (pulls from "main" branch)
 *   node scripts/github-pull.mjs --dry-run  (show what would change, don't write)
 *
 * Workflow:
 *   1. Manus pushes changes to the "manus" branch on GitHub
 *   2. You run this script on Replit to apply those changes locally
 *   3. This script records the last-pulled SHA so next time it only fetches the diff
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";

const REPO = "davecameron187-sys/curalive-platform";
const STATE_FILE = resolve(".git/github-push-state.json");

// Files/directories to never overwrite when pulling (Replit-managed)
const PULL_IGNORE = new Set([
  ".git/github-push-state.json",
  ".replit",
  "replit.nix",
  ".local/",
]);

function shouldIgnore(path) {
  return [...PULL_IGNORE].some(p => path === p || path.startsWith(p));
}

const connectors = new ReplitConnectors();
const args = process.argv.slice(2);
const branch = args.find(a => !a.startsWith("--")) ?? "manus";
const dryRun = args.includes("--dry-run");

function readState() {
  if (!existsSync(STATE_FILE)) return {};
  try { return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}

function writeState(update) {
  const current = readState();
  writeFileSync(STATE_FILE, JSON.stringify({ ...current, ...update }, null, 2));
}

async function getBranchTip(branch) {
  const res = await connectors.proxy("github", `/repos/${REPO}/commits?sha=${branch}&per_page=1`, { method: "GET" });
  const commits = await res.json();
  if (!Array.isArray(commits) || !commits[0]) throw new Error(`Branch "${branch}" not found on GitHub`);
  return {
    sha: commits[0].sha,
    shortSha: commits[0].sha.substring(0, 7),
    message: commits[0].commit.message.split("\n")[0],
    date: new Date(commits[0].commit.committer.date),
  };
}

async function getChangedFiles(base, head) {
  // GitHub compare API: returns files changed between base..head
  const res = await connectors.proxy("github", `/repos/${REPO}/compare/${base}...${head}`, { method: "GET" });
  const data = await res.json();
  if (data.message) throw new Error(`GitHub compare error: ${data.message}`);
  return data.files ?? [];
}

async function getAllFiles(branch) {
  // Get the full file tree for a fresh pull (no prior state)
  const tipRes = await connectors.proxy("github", `/repos/${REPO}/git/ref/heads/${branch}`, { method: "GET" });
  const tipData = await tipRes.json();
  const treeSha = tipData?.object?.sha;
  if (!treeSha) throw new Error(`Could not get tree SHA for branch "${branch}"`);

  // Get commit to find tree
  const commitRes = await connectors.proxy("github", `/repos/${REPO}/git/commits/${treeSha}`, { method: "GET" });
  const commitData = await commitRes.json();
  const rootTreeSha = commitData?.tree?.sha;
  if (!rootTreeSha) throw new Error("Could not find root tree SHA");

  const treeRes = await connectors.proxy("github", `/repos/${REPO}/git/trees/${rootTreeSha}?recursive=1`, { method: "GET" });
  const treeData = await treeRes.json();
  return (treeData.tree ?? []).filter(f => f.type === "blob").map(f => ({
    filename: f.path,
    status: "added",
    sha: f.sha,
  }));
}

async function getFileContent(path, ref) {
  const res = await connectors.proxy("github", `/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${ref}`, { method: "GET" });
  const data = await res.json();
  if (data.message) return null;
  if (data.encoding === "base64") {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64");
  }
  return null;
}

function line(char = "─", width = 60) { return char.repeat(width); }

function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_LABEL = { added: "A", modified: "M", renamed: "R", removed: "D", changed: "M" };

async function main() {
  console.log("\n" + line("━"));
  console.log(`  CuraLive · Pull from GitHub (${branch}${dryRun ? " — DRY RUN" : ""})`);
  console.log(line("━"));

  const tip = await getBranchTip(branch);
  console.log(`\n  Branch tip:   ${tip.shortSha}  "${tip.message}"  ${timeAgo(tip.date)}`);

  const state = readState();
  const stateKey = `lastPulled_${branch}`;
  const lastPulledSha = state[stateKey];

  if (lastPulledSha === tip.sha) {
    console.log("\n  ✅  Already up to date — nothing to pull.\n" + line("━") + "\n");
    return;
  }

  let files;
  if (lastPulledSha) {
    console.log(`  Last pulled:  ${lastPulledSha.substring(0, 7)}`);
    console.log(`\n  Fetching diff...`);
    files = await getChangedFiles(lastPulledSha, tip.sha);
  } else {
    // First-time pull: compare manus vs main so we only fetch what Manus actually changed,
    // not the entire repo tree (which is already present in Replit from main).
    console.log(`  Last pulled:  (never — first pull)`);
    console.log(`\n  Fetching diff vs main branch...`);
    const mainRes = await connectors.proxy("github", `/repos/${REPO}/commits?sha=main&per_page=1`, { method: "GET" });
    const mainCommits = await mainRes.json();
    const mainSha = mainCommits[0]?.sha;
    if (!mainSha) throw new Error("Could not get main branch HEAD to compute diff");
    files = await getChangedFiles(mainSha, tip.sha);
  }

  const filteredFiles = files.filter(f => !shouldIgnore(f.filename));

  if (filteredFiles.length === 0) {
    console.log("\n  ✅  No applicable file changes to apply.\n" + line("━") + "\n");
    if (!dryRun) writeState({ [stateKey]: tip.sha });
    return;
  }

  console.log(`\n  Changed files (${filteredFiles.length}):`);
  for (const f of filteredFiles) {
    const label = STATUS_LABEL[f.status] ?? "?";
    console.log(`     ${label}  ${f.filename}`);
  }

  if (dryRun) {
    console.log("\n  ℹ️  Dry run — no files written.");
    console.log(line("━") + "\n");
    return;
  }

  console.log("\n  Applying changes...");
  let applied = 0, skipped = 0, removed = 0;

  for (const f of filteredFiles) {
    if (f.status === "removed") {
      // We don't auto-delete — just warn
      console.log(`     ⚠️  Skipping deletion: ${f.filename} (delete manually if needed)`);
      skipped++;
      continue;
    }

    const content = await getFileContent(f.filename, tip.sha);
    if (!content) {
      console.log(`     ⚠️  Could not fetch: ${f.filename}`);
      skipped++;
      continue;
    }

    const fullPath = resolve(f.filename);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content);
    applied++;
  }

  if (!dryRun) writeState({ [stateKey]: tip.sha });

  console.log("\n" + line("─"));
  console.log(`  ✅  Applied ${applied} file(s)${skipped > 0 ? `, skipped ${skipped}` : ""}${removed > 0 ? `, removed ${removed}` : ""}`);
  console.log(`  ℹ️  Restart the server to pick up backend changes`);
  console.log(line("━") + "\n");
}

main().catch(err => {
  console.error("\n[github-pull] ❌ Error:", err.message);
  process.exit(1);
});
