import { ComplianceViolation } from "../../drizzle/schema";

/**
 * Advanced Alert Filtering & Search for AI-AM
 * Provides sophisticated filtering, sorting, and search capabilities
 */

export type SortBy = "severity" | "timestamp" | "confidence" | "speaker";
export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  severity?: ("low" | "medium" | "high" | "critical")[];
  violationType?: string[];
  acknowledged?: boolean;
  speakerRole?: string[];
  confidenceScoreMin?: number;
  confidenceScoreMax?: number;
  timeRangeStart?: Date;
  timeRangeEnd?: Date;
  searchText?: string;
}

export interface SortOptions {
  sortBy: SortBy;
  order: SortOrder;
}

/**
 * Filter violations based on multiple criteria
 */
export function filterViolations(
  violations: ComplianceViolation[],
  options: FilterOptions
): ComplianceViolation[] {
  return violations.filter((v) => {
    // Severity filter
    if (options.severity && !options.severity.includes(v.severity)) {
      return false;
    }

    // Violation type filter
    if (options.violationType && !options.violationType.includes(v.violationType)) {
      return false;
    }

    // Acknowledgment filter
    if (options.acknowledged !== undefined && v.acknowledged !== options.acknowledged) {
      return false;
    }

    // Speaker role filter
    if (options.speakerRole && v.speakerRole && !options.speakerRole.includes(v.speakerRole)) {
      return false;
    }

    // Confidence score range filter
    if (options.confidenceScoreMin !== undefined && v.confidenceScore < options.confidenceScoreMin) {
      return false;
    }

    if (options.confidenceScoreMax !== undefined && v.confidenceScore > options.confidenceScoreMax) {
      return false;
    }

    // Time range filter
    if (options.timeRangeStart && v.createdAt < options.timeRangeStart) {
      return false;
    }

    if (options.timeRangeEnd && v.createdAt > options.timeRangeEnd) {
      return false;
    }

    // Text search filter
    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      const matchesTranscript = v.transcriptExcerpt.toLowerCase().includes(searchLower);
      const matchesSpeaker = v.speakerName?.toLowerCase().includes(searchLower);
      const matchesRole = v.speakerRole?.toLowerCase().includes(searchLower);

      if (!matchesTranscript && !matchesSpeaker && !matchesRole) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort violations by specified criteria
 */
export function sortViolations(
  violations: ComplianceViolation[],
  options: SortOptions
): ComplianceViolation[] {
  const sorted = [...violations];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (options.sortBy) {
      case "severity":
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;

      case "timestamp":
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;

      case "confidence":
        comparison = a.confidenceScore - b.confidenceScore;
        break;

      case "speaker":
        comparison = (a.speakerName || "").localeCompare(b.speakerName || "");
        break;
    }

    return options.order === "desc" ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Get severity level statistics
 */
export function getSeverityStats(violations: ComplianceViolation[]) {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  violations.forEach((v) => {
    stats[v.severity]++;
  });

  return stats;
}

/**
 * Get violation type statistics
 */
export function getViolationTypeStats(violations: ComplianceViolation[]) {
  const stats: Record<string, number> = {};

  violations.forEach((v) => {
    stats[v.violationType] = (stats[v.violationType] || 0) + 1;
  });

  return stats;
}

/**
 * Get speaker role statistics
 */
export function getSpeakerRoleStats(violations: ComplianceViolation[]) {
  const stats: Record<string, number> = {};

  violations.forEach((v) => {
    if (v.speakerRole) {
      stats[v.speakerRole] = (stats[v.speakerRole] || 0) + 1;
    }
  });

  return stats;
}

/**
 * Get acknowledgment statistics
 */
export function getAcknowledgmentStats(violations: ComplianceViolation[]) {
  const acknowledged = violations.filter((v) => v.acknowledged).length;
  const unacknowledged = violations.length - acknowledged;

  return {
    acknowledged,
    unacknowledged,
    acknowledgmentRate: violations.length > 0 ? (acknowledged / violations.length) * 100 : 0,
  };
}

/**
 * Get average confidence score by violation type
 */
export function getConfidenceScoreByType(violations: ComplianceViolation[]) {
  const typeScores: Record<string, { total: number; count: number; avg: number }> = {};

  violations.forEach((v) => {
    if (!typeScores[v.violationType]) {
      typeScores[v.violationType] = { total: 0, count: 0, avg: 0 };
    }

    typeScores[v.violationType].total += v.confidenceScore;
    typeScores[v.violationType].count++;
  });

  // Calculate averages
  for (const type in typeScores) {
    const data = typeScores[type];
    data.avg = data.count > 0 ? data.total / data.count : 0;
  }

  return typeScores;
}

/**
 * Get violations by time bucket (for trending)
 */
export function getViolationsByTimeBucket(
  violations: ComplianceViolation[],
  bucketSizeMs: number = 60000 // 1 minute by default
) {
  const buckets: Record<number, number> = {};

  violations.forEach((v) => {
    const bucketKey = Math.floor(v.createdAt.getTime() / bucketSizeMs) * bucketSizeMs;
    buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
  });

  return buckets;
}

/**
 * Get high-priority violations (critical + unacknowledged)
 */
export function getHighPriorityViolations(violations: ComplianceViolation[]) {
  return violations.filter((v) => (v.severity === "critical" || v.severity === "high") && !v.acknowledged);
}

/**
 * Get violations requiring immediate action
 */
export function getActionRequiredViolations(violations: ComplianceViolation[]) {
  return violations.filter((v) => v.actionTaken === "none" && !v.acknowledged);
}

/**
 * Paginate violations
 */
export function paginateViolations(
  violations: ComplianceViolation[],
  page: number,
  pageSize: number
) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: violations.slice(start, end),
    total: violations.length,
    page,
    pageSize,
    totalPages: Math.ceil(violations.length / pageSize),
  };
}

/**
 * Build a comprehensive violation report
 */
export function generateViolationReport(violations: ComplianceViolation[]) {
  return {
    summary: {
      totalViolations: violations.length,
      unacknowledged: violations.filter((v) => !v.acknowledged).length,
      actionRequired: violations.filter((v) => v.actionTaken === "none").length,
    },
    severityStats: getSeverityStats(violations),
    typeStats: getViolationTypeStats(violations),
    speakerStats: getSpeakerRoleStats(violations),
    acknowledgmentStats: getAcknowledgmentStats(violations),
    confidenceStats: getConfidenceScoreByType(violations),
    highPriority: getHighPriorityViolations(violations),
    actionRequired: getActionRequiredViolations(violations),
  };
}
