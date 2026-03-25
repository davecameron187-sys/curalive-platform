#!/usr/bin/env node
/**
 * GitHub Sync Check
 * Run at the start of each Replit session to compare GitHub's file tree with local files.
 * Highlights: files only on GitHub, files only local, files with differing content.
 *
 * Usage: node scripts/github-sync-check.mjs
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import { createHash } from "crypto";

const REPO = "davecameron187-sys/curalive-platform";
const BRANCH = "main";
const STATE_FILE = resolve(".git/github-push-state.json");

const connectors = new ReplitConnectors();

const IGNORE_PATTERNS = [
  /^\.git\//,
  /^node_modules\//,
  /^dist\//,
  /^\.local\//,
  /^\.cache\//,
  /^\.upm\//,
  /^\.pnpm-store\//,
  /^\.replit$/,
  /^replit\.nix$/,
  /\.log$/,
  /^pnpm-lock\.yaml$/,
];

function shouldIgnore(path) {
  return IGNORE_PATTERNS.some(p => p.test(path));
}

function sha1(content) {
  // GitHub uses git blob SHA: "blob <size>\0<content>"
  const header = `blob ${content.length}\0`;
  return createHash("sha1").update(header).update(content).digest("hex");
}

async function getGitHubTree() {
  const res = await connectors.proxy(
    "github",
    `/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
    { method: "GET" }
  );
  const data = await res.json();
  if (data.message) {
    throw new Error(`GitHub API error: ${data.message}`);
  }
  const map = new Map();
  for (const item of data.tree) {
    if (item.type === "blob") {
      map.set(item.path, item.sha);
    }
  }
  return map;
}

async function getGitHubCommits(n = 10) {
  const res = await connectors.proxy(
    "github",
    `/repos/${REPO}/commits?per_page=${n}`,
    { method: "GET" }
  );
  return res.json();
}

async function getSpecFiles() {
  const res = await connectors.proxy(
    "github",
    `/repos/${REPO}/contents/docs/specs`,
    { method: "GET" }
  );
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(f => ({ name: f.name, path: f.path, downloadUrl: f.download_url }));
}

function walkLocal(dir = ".", base = "") {
  const files = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relPath = base ? `${base}/${entry}` : entry;
    if (shouldIgnore(relPath + "/") || shouldIgnore(relPath)) continue;
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }
    if (stat.isDirectory()) {
      files.push(...walkLocal(fullPath, relPath));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CuraLive — GitHub Sync Check");
  console.log(`  Repo: ${REPO} / branch: ${BRANCH}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const state = existsSync(STATE_FILE)
    ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
    : null;

  if (state) {
    console.log(`📌 Last push state:`);
    console.log(`   Local HEAD : ${state.localHead?.slice(0, 12) ?? "unknown"}`);
    console.log(`   GitHub HEAD: ${state.githubHead?.slice(0, 12) ?? "unknown"}\n`);
  }

  // ── Recent GitHub commits ──────────────────────────────────────────────────
  console.log("📋 Last 10 GitHub commits:");
  try {
    const commits = await getGitHubCommits(10);
    if (Array.isArray(commits)) {
      for (const c of commits) {
        const date = new Date(c.commit.author.date).toLocaleDateString();
        const author = c.commit.author.name;
        const msg = c.commit.message.split("\n")[0].slice(0, 60);
        console.log(`   ${c.sha.slice(0, 7)}  [${author}]  ${date}  ${msg}`);
      }
    }
  } catch (e) {
    console.log(`   ⚠ Could not fetch commits: ${e.message}`);
  }

  // ── Spec files from Manus ──────────────────────────────────────────────────
  console.log("\n📄 Manus spec files (docs/specs/):");
  try {
    const specs = await getSpecFiles();
    if (specs.length === 0) {
      console.log("   (none yet — docs/specs/ folder does not exist or is empty)");
    } else {
      for (const s of specs) {
        console.log(`   ${s.name}`);
      }
    }
  } catch {
    console.log("   (docs/specs/ not found on GitHub)");
  }

  // ── File diff: GitHub vs Local ─────────────────────────────────────────────
  console.log("\n🔍 Comparing GitHub file tree with local files...");
  let githubTree;
  try {
    githubTree = await getGitHubTree();
  } catch (e) {
    console.log(`   ⚠ Could not fetch GitHub tree: ${e.message}`);
    process.exit(1);
  }

  const localFiles = new Set(walkLocal());

  const onlyOnGitHub = [];
  const onlyLocal = [];
  const diffContent = [];

  for (const [ghPath, ghSha] of githubTree) {
    if (shouldIgnore(ghPath)) continue;
    if (!localFiles.has(ghPath)) {
      onlyOnGitHub.push(ghPath);
    } else {
      let content;
      try { content = readFileSync(ghPath); } catch { continue; }
      const localSha = sha1(content);
      if (localSha !== ghSha) {
        diffContent.push(ghPath);
      }
    }
  }

  for (const localPath of localFiles) {
    if (!githubTree.has(localPath)) {
      onlyLocal.push(localPath);
    }
  }

  if (onlyOnGitHub.length === 0 && onlyLocal.length === 0 && diffContent.length === 0) {
    console.log("\n✅ Replit and GitHub are in sync — no differences found.\n");
  } else {
    if (onlyOnGitHub.length > 0) {
      console.log(`\n⬇  Files on GitHub NOT in Replit (${onlyOnGitHub.length}):`);
      for (const f of onlyOnGitHub.slice(0, 30)) console.log(`     ${f}`);
      if (onlyOnGitHub.length > 30) console.log(`     ... and ${onlyOnGitHub.length - 30} more`);
    }
    if (diffContent.length > 0) {
      console.log(`\n📝 Files that DIFFER between GitHub and Replit (${diffContent.length}):`);
      for (const f of diffContent.slice(0, 30)) console.log(`     ${f}`);
      if (diffContent.length > 30) console.log(`     ... and ${diffContent.length - 30} more`);
    }
    if (onlyLocal.length > 0) {
      console.log(`\n⬆  Files in Replit NOT on GitHub (${onlyLocal.length}) — these need pushing:`);
      for (const f of onlyLocal.slice(0, 30)) console.log(`     ${f}`);
      if (onlyLocal.length > 30) console.log(`     ... and ${onlyLocal.length - 30} more`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Done. To push Replit → GitHub: node scripts/github-push-manual.mjs");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(err => {
  console.error("\n❌ Sync check failed:", err.message);
  process.exit(1);
});
