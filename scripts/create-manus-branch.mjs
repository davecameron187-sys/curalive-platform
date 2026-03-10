#!/usr/bin/env node
/**
 * Creates a 'manus-demo' branch on GitHub from current main HEAD,
 * then ensures all current files are pushed to it.
 */
import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

const REPO = "davecameron187-sys/curalive-platform";
const BASE_BRANCH = "main";
const NEW_BRANCH = "manus-demo";

const connectors = new ReplitConnectors();

async function rest(path, options = {}) {
  const res = await connectors.proxy("github", path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

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

async function main() {
  // 1. Get current main HEAD SHA from GitHub
  const mainRef = await rest(`/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`);
  if (mainRef.status !== 200) throw new Error(`Could not get main ref: ${JSON.stringify(mainRef.data)}`);
  const mainSha = mainRef.data.object.sha;
  console.log(`[branch] main HEAD: ${mainSha.substring(0, 7)}`);

  // 2. Check if manus-demo branch already exists
  const existing = await rest(`/repos/${REPO}/git/ref/heads/${NEW_BRANCH}`);
  let branchSha;

  if (existing.status === 200) {
    branchSha = existing.data.object.sha;
    console.log(`[branch] '${NEW_BRANCH}' exists at ${branchSha.substring(0, 7)} — will fast-forward to main`);
    // Fast-forward: update the branch ref to main SHA
    const update = await rest(`/repos/${REPO}/git/refs/heads/${NEW_BRANCH}`, {
      method: "PATCH",
      body: { sha: mainSha, force: true },
    });
    if (update.status !== 200) throw new Error(`Failed to update branch: ${JSON.stringify(update.data)}`);
    console.log(`[branch] ✅ '${NEW_BRANCH}' fast-forwarded to ${mainSha.substring(0, 7)}`);
    branchSha = mainSha;
  } else {
    // Create the branch
    console.log(`[branch] Creating '${NEW_BRANCH}' from main...`);
    const create = await rest(`/repos/${REPO}/git/refs`, {
      method: "POST",
      body: { ref: `refs/heads/${NEW_BRANCH}`, sha: mainSha },
    });
    if (create.status !== 201) throw new Error(`Failed to create branch: ${JSON.stringify(create.data)}`);
    branchSha = mainSha;
    console.log(`[branch] ✅ '${NEW_BRANCH}' created at ${branchSha.substring(0, 7)}`);
  }

  // 3. Push all tracked files to the new branch as a single commit
  const allFiles = execSync("git ls-files").toString().trim().split("\n").filter(Boolean);
  console.log(`[branch] Pushing ${allFiles.length} files to '${NEW_BRANCH}'...`);

  const BATCH_SIZE = 800 * 1024;
  let batch = [], batchSize = 0, batchNum = 1;
  let currentSha = branchSha;

  const pushBatch = async (additions, sha, msg) => {
    if (additions.length === 0) return sha;
    const result = await graphql(
      `mutation CreateCommit($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) { commit { oid } }
      }`,
      {
        input: {
          branch: { repositoryNameWithOwner: REPO, branchName: NEW_BRANCH },
          message: { headline: msg },
          fileChanges: { additions },
          expectedHeadOid: sha,
        },
      }
    );
    return result.createCommitOnBranch.commit.oid;
  };

  for (const file of allFiles) {
    let content;
    try { content = readFileSync(file); } catch { console.log(`  [skip] ${file}`); continue; }
    const b64 = content.toString("base64");
    const entrySize = b64.length + file.length;
    if (batch.length > 0 && batchSize + entrySize > BATCH_SIZE) {
      currentSha = await pushBatch(batch, currentSha, batchNum === 1 ? "chore: manus-demo branch — full platform snapshot" : `chore: manus-demo branch (part ${batchNum})`);
      console.log(`  ✓ Batch ${batchNum}: ${currentSha.substring(0, 7)}`);
      batchNum++; batch = []; batchSize = 0;
    }
    batch.push({ path: file, contents: b64 });
    batchSize += entrySize;
  }
  if (batch.length > 0) {
    currentSha = await pushBatch(batch, currentSha, batchNum === 1 ? "chore: manus-demo branch — full platform snapshot" : `chore: manus-demo branch (part ${batchNum})`);
    console.log(`  ✓ Batch ${batchNum}: ${currentSha.substring(0, 7)}`);
  }

  console.log(`\n[branch] ✅ Done!`);
  console.log(`[branch] Branch URL: https://github.com/${REPO}/tree/${NEW_BRANCH}`);
  console.log(`[branch] Compare:    https://github.com/${REPO}/compare/${NEW_BRANCH}`);
}

main().catch(err => { console.error("[branch] ❌ Failed:", err.message); process.exit(1); });
