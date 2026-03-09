#!/usr/bin/env node
/**
 * Manual GitHub Push Script
 * Run this directly to push changes to GitHub via GraphQL API.
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const REPO = "davecameron187-sys/curalive-platform";
const BRANCH = "main";
const STATE_FILE = resolve(".git/github-push-state.json");

const connectors = new ReplitConnectors();

async function graphql(query, variables) {
  const res = await connectors.proxy("github", "/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors, null, 2));
  return data.data;
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { return null; }
}

function writeState(localHead, githubHead) {
  writeFileSync(STATE_FILE, JSON.stringify({ localHead, githubHead }));
}

async function getRemoteHead() {
  const res = await connectors.proxy("github", `/repos/${REPO}/commits?per_page=1`, { method: "GET" });
  const commits = await res.json();
  return commits[0]?.sha;
}

async function pushBatch(additions, deletions, githubHead, message) {
  if (additions.length === 0 && deletions.length === 0) return githubHead;
  const fileChanges = {};
  if (additions.length > 0) fileChanges.additions = additions;
  if (deletions.length > 0) fileChanges.deletions = deletions;
  const result = await graphql(
    `mutation CreateCommit($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) { commit { oid } }
    }`,
    { input: { branch: { repositoryNameWithOwner: REPO, branchName: BRANCH }, message: { headline: message }, fileChanges, expectedHeadOid: githubHead } }
  );
  return result.createCommitOnBranch.commit.oid;
}

async function main() {
  const localHead = execSync("git rev-parse HEAD").toString().trim();
  const state = readState();

  if (state?.localHead === localHead) {
    console.log("[github-push] Already up to date — nothing to push.");
    return;
  }

  let githubHead = await getRemoteHead();
  const lastLocalHead = state?.localHead;
  const commitMsg = execSync("git log --format=%s -1").toString().trim();

  let changedFiles = [];
  if (lastLocalHead) {
    const diff = execSync(`git diff --name-status ${lastLocalHead} ${localHead}`).toString().trim();
    changedFiles = diff.split("\n").filter(Boolean).map(line => {
      const [status, ...parts] = line.split("\t");
      return { status, path: parts[parts.length - 1] };
    });
  } else {
    changedFiles = execSync("git ls-files").toString().trim().split("\n").filter(Boolean).map(path => ({ status: "A", path }));
  }

  if (changedFiles.length === 0) {
    console.log("[github-push] No file changes to push.");
    writeState(localHead, githubHead);
    return;
  }

  console.log(`[github-push] Pushing ${changedFiles.length} file(s): "${commitMsg}"`);

  const BATCH_SIZE = 800 * 1024;
  const toAdd = changedFiles.filter(f => f.status !== "D");
  const toDelete = changedFiles.filter(f => f.status === "D").map(f => ({ path: f.path }));

  let batch = [], batchSize = 0, batchNum = 1;
  for (const file of toAdd) {
    let content;
    try { content = readFileSync(file.path); } catch { console.log(`  [skip] ${file.path}`); continue; }
    const b64 = content.toString("base64");
    const entrySize = b64.length + file.path.length;
    if (batch.length > 0 && batchSize + entrySize > BATCH_SIZE) {
      githubHead = await pushBatch(batch, batchNum === 1 ? toDelete : [], githubHead, batchNum === 1 ? commitMsg : `${commitMsg} (part ${batchNum})`);
      console.log(`  ✓ Batch ${batchNum}: ${githubHead.substring(0, 7)}`);
      batchNum++; batch = []; batchSize = 0;
    }
    batch.push({ path: file.path, contents: b64 });
    batchSize += entrySize;
  }
  if (batch.length > 0 || (batchNum === 1 && toDelete.length > 0)) {
    githubHead = await pushBatch(batch, batchNum === 1 ? toDelete : [], githubHead, batchNum === 1 ? commitMsg : `${commitMsg} (part ${batchNum})`);
    console.log(`  ✓ Batch ${batchNum}: ${githubHead.substring(0, 7)}`);
  } else if (toDelete.length > 0) {
    githubHead = await pushBatch([], toDelete, githubHead, `${commitMsg} (deletions)`);
    console.log(`  ✓ Deletions: ${githubHead.substring(0, 7)}`);
  }

  writeState(localHead, githubHead);
  console.log(`[github-push] ✅ Done — GitHub HEAD: ${githubHead.substring(0, 7)}`);
}

main().catch(err => { console.error("[github-push] ❌ Failed:", err.message); process.exit(1); });
