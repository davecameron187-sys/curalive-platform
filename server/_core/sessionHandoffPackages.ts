/**
 * Session Handoff Package Service — Post-Session Deliverables
 * 
 * Task 1.7: Generate post-session deliverables
 * - Aggregate transcript from state transitions
 * - Generate AI summary using LLM
 * - Create action history export
 * - Build compliance flag report
 * - Package and deliver to S3
 */

import { getDb } from "../db";
import { operatorSessions, sessionStateTransitions, operatorActions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./llm";
// Storage will be implemented via tRPC procedure
import { notifyOwner } from "./notification";

interface SessionHandoffPackage {
  sessionId: string;
  eventId: string;
  operatorId: number;
  generatedAt: Date;
  transcript: string;
  aiSummary: string;
  actionHistory: Array<{
    timestamp: string;
    actionType: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }>;
  complianceFlags: Array<{
    timestamp: string;
    flagType: string;
    details?: string;
  }>;
  sessionMetrics: {
    totalDuration: number;
    pausedDuration: number;
    totalActions: number;
    complianceFlagCount: number;
  };
  recordingUrls: string[];
}

/**
 * Generate transcript from session state transitions
 */
async function generateTranscript(sessionId: string): Promise<string> {
  const database = await getDb();
  if (!database) {
    return "Transcript unavailable (database error)";
  }

  try {
    const transitions = await database
      .select()
      .from(sessionStateTransitions)
      .where(eq(sessionStateTransitions.sessionId, sessionId));

    if (!transitions.length) {
      return "No transcript available for this session";
    }

    // Build transcript from state transitions
    const transcriptLines = transitions.map((t) => {
      const timestamp = new Date(t.createdAt).toLocaleTimeString();
      const metadata = t.metadata as Record<string, any> || {};

      if (metadata.transcriptSegment) {
        return `[${timestamp}] ${metadata.transcriptSegment}`;
      }

      return `[${timestamp}] Session transitioned from ${t.fromState} to ${t.toState}`;
    });

    return transcriptLines.join("\n");
  } catch (error) {
    console.error("[SessionHandoff] Transcript generation error:", error);
    return "Transcript generation failed";
  }
}

/**
 * Generate AI summary using LLM
 */
async function generateAISummary(
  transcript: string,
  actionHistory: SessionHandoffPackage["actionHistory"]
): Promise<string> {
  try {
    // Prepare context for LLM
    const actionSummary = actionHistory
      .slice(0, 20) // Limit to recent actions
      .map((a) => `- ${a.actionType} at ${a.timestamp}`)
      .join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert analyst for investor relations events. Generate a concise, professional summary of the session highlighting key moments, questions, and outcomes.",
        },
        {
          role: "user",
          content: `Session Transcript:\n${transcript.substring(0, 5000)}\n\nOperator Actions:\n${actionSummary}\n\nProvide a 2-3 paragraph summary of the session.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Summary generation failed";
  } catch (error) {
    console.error("[SessionHandoff] AI summary generation error:", error);
    return "AI summary generation failed";
  }
}

/**
 * Extract compliance flags from action history
 */
async function extractComplianceFlags(
  sessionId: string
): Promise<SessionHandoffPackage["complianceFlags"]> {
  const database = await getDb();
  if (!database) {
    return [];
  }

  try {
    const actions = await database
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.sessionId, sessionId));

    const flags: SessionHandoffPackage["complianceFlags"] = [];

    for (const action of actions) {
      if (action.actionType === "compliance_flag_raised") {
        const metadata = action.metadata as Record<string, any> || {};
        flags.push({
          timestamp: action.createdAt.toISOString(),
          flagType: metadata.flagType || "general",
          details: metadata.details,
        });
      }
    }

    return flags;
  } catch (error) {
    console.error("[SessionHandoff] Compliance flag extraction error:", error);
    return [];
  }
}

/**
 * Generate handoff package for a session
 */
export async function generateHandoffPackage(
  sessionId: string
): Promise<SessionHandoffPackage | null> {
  const database = await getDb();
  if (!database) {
    console.error("[SessionHandoff] Database connection unavailable");
    return null;
  }

  try {
    // Get session data
    const sessions = await database
      .select()
      .from(operatorSessions)
      .where(eq(operatorSessions.id, parseInt(sessionId, 10)))
      .limit(1);

    if (!sessions.length) {
      console.error(`[SessionHandoff] Session ${sessionId} not found`);
      return null;
    }

    const session = sessions[0];

    // Get action history
    const actions = await database
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.sessionId, sessionId));

    const actionHistory = actions.map((a) => ({
      timestamp: a.createdAt.toISOString(),
      actionType: a.actionType,
      targetId: a.targetId || undefined,
      metadata: (a.metadata as Record<string, any>) || undefined,
    }));

    // Generate transcript
    const transcript = await generateTranscript(sessionId);

    // Generate AI summary
    const aiSummary = await generateAISummary(transcript, actionHistory);

    // Extract compliance flags
    const complianceFlags = await extractComplianceFlags(sessionId);

    // Calculate metrics
    const totalDuration = session.endedAt && session.startedAt
      ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    const package_: SessionHandoffPackage = {
      sessionId,
      eventId: session.eventId,
      operatorId: session.operatorId,
      generatedAt: new Date(),
      transcript,
      aiSummary,
      actionHistory,
      complianceFlags,
      sessionMetrics: {
        totalDuration,
        pausedDuration: session.totalPausedDuration,
        totalActions: actions.length,
        complianceFlagCount: complianceFlags.length,
      },
      recordingUrls: [], // TODO: Fetch from recording service
    };

    return package_;
  } catch (error) {
    console.error("[SessionHandoff] Package generation error:", error);
    return null;
  }
}

/**
 * Create handoff package as JSON (for S3 storage)
 */
export async function createHandoffPackageJson(
  package_: SessionHandoffPackage
): Promise<Buffer> {
  const packageData = {
    sessionId: package_.sessionId,
    eventId: package_.eventId,
    operatorId: package_.operatorId,
    generatedAt: package_.generatedAt.toISOString(),
    transcript: package_.transcript,
    aiSummary: package_.aiSummary,
    actionHistory: package_.actionHistory,
    complianceFlags: package_.complianceFlags,
    sessionMetrics: package_.sessionMetrics,
    recordingUrls: package_.recordingUrls,
  };

  return Buffer.from(JSON.stringify(packageData, null, 2));
}

/**
 * Generate S3 upload URL for handoff package
 * (Actual upload will be handled by tRPC procedure)
 */
export async function generateHandoffPackageUploadUrl(
  package_: SessionHandoffPackage
): Promise<{ key: string; uploadUrl: string } | null> {
  try {
    const key = `handoff-packages/${package_.eventId}/${package_.sessionId}/package-${Date.now()}.json`;

    // In production, this would generate a presigned S3 URL
    // For now, return the key for tRPC to handle upload
    console.log(`[SessionHandoff] Generated upload key: ${key}`);

    return {
      key,
      uploadUrl: `https://s3.example.com/${key}`, // Placeholder
    };
  } catch (error) {
    console.error("[SessionHandoff] Upload URL generation error:", error);
    return null;
  }
}

/**
 * Send handoff package notification
 */
export async function notifySessionHandoff(
  package_: SessionHandoffPackage,
  packageUrl: string
): Promise<boolean> {
  try {
    const success = await notifyOwner({
      title: `Session Handoff Package Ready: ${package_.sessionId}`,
      content: `
Event: ${package_.eventId}
Session Duration: ${Math.floor(package_.sessionMetrics.totalDuration / 60)} minutes
Total Actions: ${package_.sessionMetrics.totalActions}
Compliance Flags: ${package_.sessionMetrics.complianceFlagCount}

Download Package: ${packageUrl}

Key Highlights:
${package_.aiSummary.substring(0, 200)}...
      `,
    });

    if (success) {
      console.log(`[SessionHandoff] Notification sent for session ${package_.sessionId}`);
    }

    return success;
  } catch (error) {
    console.error("[SessionHandoff] Notification error:", error);
    return false;
  }
}

/**
 * Complete handoff workflow (generate, package, upload, notify)
 */
export async function completeSessionHandoff(sessionId: string): Promise<{
  success: boolean;
  packageUrl?: string;
  error?: string;
}> {
  try {
    console.log(`[SessionHandoff] Starting handoff workflow for session ${sessionId}`);

    // Generate package
    const package_ = await generateHandoffPackage(sessionId);
    if (!package_) {
      return { success: false, error: "Failed to generate package" };
    }

    // Create JSON package
    const packageBuffer = await createHandoffPackageJson(package_);

    // Generate upload info
    const uploadInfo = await generateHandoffPackageUploadUrl(package_);
    if (!uploadInfo) {
      return { success: false, error: "Failed to generate upload URL" };
    }

    // In production, upload would happen here
    const packageUrl = uploadInfo.uploadUrl;

    // Send notification
    await notifySessionHandoff(package_, packageUrl);

    console.log(`[SessionHandoff] Handoff workflow completed for session ${sessionId}`);

    return {
      success: true,
      packageUrl,
    };
  } catch (error) {
    console.error("[SessionHandoff] Handoff workflow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get handoff package (tRPC-callable)
 */
export async function getSessionHandoffPackage(
  sessionId: string
): Promise<SessionHandoffPackage | null> {
  return generateHandoffPackage(sessionId);
}
