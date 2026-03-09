#!/usr/bin/env node
/**
 * sync-status.mjs
 * Instantly shows whether Replit and GitHub are in sync.
 * Run: node scripts/sync-status.mjs
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const REPO = "davecameron187-sys/curalive-platform";
const MAIN_BRANCH = "main";
const MANUS_BRANCH = "manus";
const STATE_FILE = resolve(".git/github-push-state.json");

const connectors = new ReplitConnectors();

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { return null; }
}

async function getBranchHead(branch) {
  try {
    const res = await connectors.proxy("github", `/repos/${REPO}/commits?sha=${branch}&per_page=1`, { method: "GET" });
    const commits = await res.json();
    if (!Array.isArray(commits) || !commits[0]) return null;
    return {
      sha: commits[0].sha,
      shortSha: commits[0].sha.substring(0, 7),
      message: commits[0].commit.message.split("\n")[0],
      date: new Date(commits[0].commit.committer.date),
    };
  } catch {
    return null;
  }
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function line(char = "─", width = 60) {
  return char.repeat(width);
}

async function main() {
  const localSha = execSync("git rev-parse HEAD").toString().trim();
  const localShort = localSha.substring(0, 7);
  const localMsg = execSync("git log --format=%s -1").toString().trim();
  const localDate = new Date(execSync("git log --format=%cd --date=iso -1").toString().trim());

  console.log("\n" + line("━"));
  console.log("  CuraLive · GitHub Sync Status");
  console.log(line("━"));

  // Replit local
  console.log(`\n  📍 Replit (local)`);
  console.log(`     ${localShort}  "${localMsg}"  ${timeAgo(localDate)}`);

  // GitHub main
  console.log(`\n  🐙 GitHub (${MAIN_BRANCH})`);
  const mainHead = await getBranchHead(MAIN_BRANCH);
  if (!mainHead) {
    console.log("     ⚠️  Could not reach GitHub — check connection");
  } else {
    console.log(`     ${mainHead.shortSha}  "${mainHead.message}"  ${timeAgo(mainHead.date)}`);
  }

  // GitHub manus branch (if exists)
  const manusHead = await getBranchHead(MANUS_BRANCH);
  if (manusHead) {
    console.log(`\n  🤖 GitHub (${MANUS_BRANCH} branch)`);
    console.log(`     ${manusHead.shortSha}  "${manusHead.message}"  ${timeAgo(manusHead.date)}`);
  }

  // Status summary — the push script maps localHead↔githubHead in the state file
  // since local git SHAs and GitHub API commit SHAs are always different numbers.
  console.log("\n" + line("─"));

  const state = readState();
  if (mainHead) {
    const stateSynced = state?.localHead === localSha && state?.githubHead === mainHead.sha;
    if (stateSynced) {
      console.log("  ✅  Replit and GitHub (main) are IN SYNC");
    } else if (state?.githubHead !== mainHead.sha) {
      // GitHub has moved ahead (e.g. someone else pushed)
      console.log("  📥  GitHub (main) has commits not yet in Replit");
      console.log(`       Remote: ${mainHead.shortSha}  |  Last pushed: ${(state?.githubHead ?? "unknown").substring(0, 7)}`);
    } else {
      // Replit has local commits not yet pushed
      let aheadCount = 0;
      try {
        const log = execSync(`git log --oneline ${state.localHead}..HEAD 2>/dev/null`).toString().trim();
        aheadCount = log ? log.split("\n").length : 1;
      } catch { aheadCount = 1; }
      console.log(`  ⚠️   Replit is ${aheadCount} commit(s) AHEAD of GitHub (main)`);
      console.log(`       → Push:  node scripts/github-push-manual.mjs`);
    }
  }

  if (manusHead) {
    const lastPulledSha = state?.lastPulled_manus;
    if (lastPulledSha === manusHead.sha) {
      console.log(`  ✅  Manus branch is up to date (already pulled)`);
    } else {
      console.log(`  📥  Manus branch has unpulled changes`);
      console.log(`       → Pull:  node scripts/github-pull.mjs`);
    }
  } else {
    console.log(`  ℹ️   No "${MANUS_BRANCH}" branch found on GitHub`);
    console.log(`       (Manus pushes to this branch when sharing changes)`);
  }

  console.log("\n" + line("─"));
  console.log("  Commands:");
  console.log("  · Check status:     node scripts/sync-status.mjs");
  console.log("  · Push to GitHub:   node scripts/github-push-manual.mjs");
  console.log("  · Pull from Manus:  node scripts/github-pull.mjs");
  console.log(line("━") + "\n");
}

main().catch(err => {
  console.error("\n[sync-status] Error:", err.message);
  process.exit(1);
});
