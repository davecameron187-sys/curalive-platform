import { db } from "../db";
import { alertTemplates } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export interface TemplateVersion {
  versionId: string;
  templateId: number;
  content: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: number;
  message: string; // Commit message
  hash: string; // SHA-256 hash of content
}

// In-memory version history (in production, use database)
const versionHistory: Map<number, TemplateVersion[]> = new Map();

/**
 * Create a new version of a template
 */
export async function createTemplateVersion(
  templateId: number,
  content: string,
  userId: number,
  message: string,
  name: string,
  description?: string
): Promise<TemplateVersion> {
  const hash = crypto.createHash("sha256").update(content).digest("hex");

  const version: TemplateVersion = {
    versionId: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    templateId,
    content,
    name,
    description,
    createdAt: new Date(),
    createdBy: userId,
    message,
    hash,
  };

  // Store in version history
  if (!versionHistory.has(templateId)) {
    versionHistory.set(templateId, []);
  }
  versionHistory.get(templateId)!.push(version);

  // Update main template
  await db
    .update(alertTemplates)
    .set({
      content,
      name,
      description,
      updatedAt: new Date(),
    })
    .where(eq(alertTemplates.id, templateId));

  return version;
}

/**
 * Get version history for a template
 */
export function getVersionHistory(templateId: number): TemplateVersion[] {
  const history = versionHistory.get(templateId) || [];
  return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get specific version of a template
 */
export function getTemplateVersion(
  templateId: number,
  versionId: string
): TemplateVersion | undefined {
  const history = versionHistory.get(templateId) || [];
  return history.find((v) => v.versionId === versionId);
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  templateId: number,
  versionId: string,
  userId: number,
  rollbackMessage?: string
): Promise<TemplateVersion> {
  const version = getTemplateVersion(templateId, versionId);
  if (!version) {
    throw new Error(`Version ${versionId} not found`);
  }

  // Create new version with rolled-back content
  return createTemplateVersion(
    templateId,
    version.content,
    userId,
    rollbackMessage || `Rolled back to version ${versionId}`,
    version.name,
    version.description
  );
}

/**
 * Compare two versions
 */
export function compareVersions(
  templateId: number,
  versionId1: string,
  versionId2: string
): {
  version1: TemplateVersion | undefined;
  version2: TemplateVersion | undefined;
  differences: string[];
} {
  const v1 = getTemplateVersion(templateId, versionId1);
  const v2 = getTemplateVersion(templateId, versionId2);

  const differences: string[] = [];

  if (!v1 || !v2) {
    differences.push("One or both versions not found");
    return { version1: v1, version2: v2, differences };
  }

  if (v1.name !== v2.name) {
    differences.push(`Name changed: "${v1.name}" → "${v2.name}"`);
  }

  if (v1.description !== v2.description) {
    differences.push(
      `Description changed: "${v1.description}" → "${v2.description}"`
    );
  }

  if (v1.content !== v2.content) {
    differences.push("Content changed");
  }

  return { version1: v1, version2: v2, differences };
}

/**
 * Get diff between two versions (simplified)
 */
export function getDiff(
  templateId: number,
  versionId1: string,
  versionId2: string
): {
  added: string[];
  removed: string[];
  modified: string[];
} {
  const v1 = getTemplateVersion(templateId, versionId1);
  const v2 = getTemplateVersion(templateId, versionId2);

  if (!v1 || !v2) {
    return { added: [], removed: [], modified: [] };
  }

  const lines1 = v1.content.split("\n");
  const lines2 = v2.content.split("\n");

  const added = lines2.filter((line) => !lines1.includes(line));
  const removed = lines1.filter((line) => !lines2.includes(line));
  const modified = lines1.filter(
    (line) => lines2.includes(line) && lines1.indexOf(line) !== lines2.indexOf(line)
  );

  return { added, removed, modified };
}

/**
 * Prune old versions (keep only last N versions)
 */
export function pruneVersions(templateId: number, keepCount: number = 10): void {
  const history = versionHistory.get(templateId) || [];
  if (history.length > keepCount) {
    const sorted = history.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const toKeep = sorted.slice(0, keepCount);
    versionHistory.set(templateId, toKeep);
  }
}

/**
 * Export version history as JSON
 */
export function exportVersionHistory(templateId: number): string {
  const history = getVersionHistory(templateId);
  return JSON.stringify(history, null, 2);
}

/**
 * Import version history from JSON
 */
export function importVersionHistory(
  templateId: number,
  jsonData: string
): TemplateVersion[] {
  try {
    const versions = JSON.parse(jsonData) as TemplateVersion[];
    versionHistory.set(templateId, versions);
    return versions;
  } catch (error) {
    throw new Error("Invalid version history JSON");
  }
}

/**
 * Get latest version
 */
export function getLatestVersion(templateId: number): TemplateVersion | undefined {
  const history = getVersionHistory(templateId);
  return history[0]; // Already sorted by date descending
}

/**
 * Create a branch from a version (copy as new template)
 */
export async function createBranchFromVersion(
  templateId: number,
  versionId: string,
  userId: number,
  branchName: string
): Promise<{ templateId: number; versionId: string }> {
  const version = getTemplateVersion(templateId, versionId);
  if (!version) {
    throw new Error(`Version ${versionId} not found`);
  }

  // Create new template with branched content
  const newTemplate = await db.insert(alertTemplates).values({
    name: branchName,
    description: `Branch from template ${templateId} version ${versionId}`,
    content: version.content,
    userId,
  });

  // Create initial version for new template
  const newVersion = await createTemplateVersion(
    newTemplate[0].id,
    version.content,
    userId,
    `Branched from template ${templateId}`,
    branchName,
    `Branch from template ${templateId} version ${versionId}`
  );

  return { templateId: newTemplate[0].id, versionId: newVersion.versionId };
}
