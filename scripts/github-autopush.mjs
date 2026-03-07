#!/usr/bin/env node
/**
 * GitHub Auto-Push Script
 * Pushes changed files to GitHub via GraphQL API using the Replit OAuth connector.
 * Called automatically by .git/hooks/post-commit on every commit.
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
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeState(localHead, githubHead) {
  writeFileSync(STATE_FILE, JSON.stringify({ localHead, githubHead }));
}

async function getRemoteHead() {
  const res = await connectors.proxy(
    "github",
    `/repos/${REPO}/commits?per_page=1`,
    { method: "GET" }
  );
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
      createCommitOnBranch(input: $input) {
        commit { oid }
      }
    }`,
    {
      input: {
        branch: { repositoryNameWithOwner: REPO, branchName: BRANCH },
        message: { headline: message },
        fileChanges,
        expectedHeadOid: githubHead,
      },
    }
  );

  return result.createCommitOnBranch.commit.oid;
}

async function main() {
  const localHead = execSync("git rev-parse HEAD").toString().trim();
  const state = readState();

  if (state?.localHead === localHead) {
    console.log("[github-autopush] Already up to date.");
    return;
  }

  const lastLocalHead = state?.localHead;
  let githubHead = state?.githubHead;

  if (!githubHead) {
    console.log("[github-autopush] No state found, fetching remote HEAD...");
    githubHead = await getRemoteHead();
  }

  const commitMsg = execSync("git log --format=%s -1").toString().trim();

  let changedFiles = [];
  if (lastLocalHead) {
    const diff = execSync(`git diff --name-status ${lastLocalHead} ${localHead}`)
      .toString()
      .trim();
    changedFiles = diff
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [status, ...parts] = line.split("\t");
        return { status, path: parts[parts.length - 1] };
      });
  } else {
    const tracked = execSync("git ls-files").toString().trim();
    changedFiles = tracked
      .split("\n")
      .filter(Boolean)
      .map((path) => ({ status: "A", path }));
  }

  if (changedFiles.length === 0) {
    console.log("[github-autopush] No file changes to push.");
    writeState(localHead, githubHead);
    return;
  }

  console.log(`[github-autopush] Pushing ${changedFiles.length} file(s): ${commitMsg}`);

  const BATCH_SIZE_BYTES = 800 * 1024;

  const toAdd = changedFiles.filter((f) => f.status !== "D");
  const toDelete = changedFiles
    .filter((f) => f.status === "D")
    .map((f) => ({ path: f.path }));

  let currentBatch = [];
  let currentBatchSize = 0;
  let batchNum = 1;

  for (const file of toAdd) {
    let content;
    try {
      content = readFileSync(file.path);
    } catch {
      console.log(`  [skip] ${file.path} (unreadable)`);
      continue;
    }
    const b64 = content.toString("base64");
    const entrySize = b64.length + file.path.length;

    if (currentBatch.length > 0 && currentBatchSize + entrySize > BATCH_SIZE_BYTES) {
      const batchMsg =
        batchNum === 1
          ? commitMsg
          : `${commitMsg} (part ${batchNum})`;
      githubHead = await pushBatch(currentBatch, batchNum === 1 ? toDelete : [], githubHead, batchMsg);
      console.log(`  ✓ Batch ${batchNum} committed: ${githubHead.substring(0, 7)}`);
      batchNum++;
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push({ path: file.path, contents: b64 });
    currentBatchSize += entrySize;
  }

  if (currentBatch.length > 0 || (batchNum === 1 && toDelete.length > 0)) {
    const batchMsg =
      batchNum === 1 ? commitMsg : `${commitMsg} (part ${batchNum})`;
    githubHead = await pushBatch(
      currentBatch,
      batchNum === 1 ? toDelete : [],
      githubHead,
      batchMsg
    );
    console.log(`  ✓ Batch ${batchNum} committed: ${githubHead.substring(0, 7)}`);
  } else if (toDelete.length > 0 && batchNum > 1) {
    githubHead = await pushBatch([], toDelete, githubHead, `${commitMsg} (deletions)`);
    console.log(`  ✓ Deletions committed: ${githubHead.substring(0, 7)}`);
  }

  writeState(localHead, githubHead);
  console.log(`[github-autopush] ✅ Done — GitHub HEAD: ${githubHead.substring(0, 7)}`);
}

main().catch((err) => {
  console.error("[github-autopush] ❌ Push failed:", err.message);
  process.exit(0);
});
