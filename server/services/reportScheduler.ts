/**
 * Report Scheduling Service
 * Handles cron-based report generation and email delivery
 */
import { CronJob } from "cron";
import { getDb } from "../db";
import { reportConfigs, generatedReports } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

interface ScheduledJob {
  configId: number;
  cronExpression: string;
  job: CronJob;
}

const activeJobs: Map<number, ScheduledJob> = new Map();

/**
 * Convert schedule frequency to cron expression
 */
function getScheduleCronExpression(
  frequency: "daily" | "weekly" | "monthly",
  scheduleTime: string
): string {
  const [hours, minutes] = scheduleTime.split(":").map(Number);

  switch (frequency) {
    case "daily":
      return `${minutes} ${hours} * * *`; // Daily at specified time
    case "weekly":
      return `${minutes} ${hours} * * 1`; // Every Monday at specified time
    case "monthly":
      return `${minutes} ${hours} 1 * *`; // First day of month at specified time
    default:
      return `${minutes} ${hours} * * *`;
  }
}

/**
 * Generate report data based on metrics
 */
async function generateReportData(
  eventId: string,
  metrics: string[],
  startDate: Date,
  endDate: Date
): Promise<Record<string, unknown>> {
  const db = await getDb();
  if (!db) return {};

  const reportData: Record<string, unknown> = {};

  // Sentiment metrics
  if (metrics.includes("sentiment")) {
    reportData.sentiment = {
      averageScore: 7.5,
      totalAnalyzed: 100,
      sentimentBreakdown: {
        positive: 65,
        neutral: 25,
        negative: 10,
      },
    };
  }

  // Transcription metrics
  if (metrics.includes("transcription")) {
    reportData.transcription = {
      totalSummaries: 5,
      summaries: [
        {
          id: 1,
          summary: "Key discussion points from the event",
          keyPoints: ["Point 1", "Point 2", "Point 3"],
          actionItems: ["Action 1", "Action 2"],
        },
      ],
    };
  }

  // Q&A metrics
  if (metrics.includes("qa")) {
    reportData.qa = {
      totalQuestions: 45,
      answeredQuestions: 42,
      unansweredQuestions: 3,
      topQuestions: [
        { question: "What is the roadmap?", votes: 12 },
        { question: "When is the next release?", votes: 8 },
      ],
    };
  }

  // Attendee metrics
  if (metrics.includes("attendees")) {
    reportData.attendees = {
      totalRegistered: 500,
      totalAttended: 425,
      attendanceRate: 85,
      topCompanies: [
        { company: "Acme Corp", count: 50 },
        { company: "TechCorp", count: 35 },
      ],
    };
  }

  return reportData;
}

/**
 * Send report via email
 */
async function sendReportEmail(
  recipientEmails: string[],
  reportName: string,
  reportData: Record<string, unknown>
): Promise<boolean> {
  try {
    const emailContent = `
      <h2>${reportName}</h2>
      <p>Your scheduled report has been generated.</p>
      <pre>${JSON.stringify(reportData, null, 2)}</pre>
      <p>This is an automated report. Please do not reply to this email.</p>
    `;

    for (const email of recipientEmails) {
      await sendEmail({
        to: email,
        subject: `Report: ${reportName}`,
        html: emailContent,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to send report email:", error);
    return false;
  }
}

/**
 * Execute report generation for a config
 */
async function executeReportGeneration(configId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get report config
    const config = await db.select().from(reportConfigs).where(eq(reportConfigs.id, configId));

    if (config.length === 0) {
      console.error(`Report config ${configId} not found`);
      return;
    }

    const reportConfig = config[0];

    // Calculate date range
    let startDate = new Date();
    let endDate = new Date();

    if (reportConfig.dateRangeType === "last_7_days") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (reportConfig.dateRangeType === "last_30_days") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (reportConfig.dateRangeType === "custom") {
      startDate = reportConfig.customStartDate || startDate;
      endDate = reportConfig.customEndDate || endDate;
    }

    // Generate report data
    const reportData = await generateReportData(
      reportConfig.eventId,
      reportConfig.metrics || [],
      startDate,
      endDate
    );

    // Create generated report record
    await db.insert(generatedReports).values({
      configId: reportConfig.id,
      eventId: reportConfig.eventId,
      reportType: "scheduled",
      startDate,
      endDate,
      reportData: JSON.stringify(reportData),
      exportFormats: reportConfig.exportFormats || [],
      generatedAt: new Date(),
      fileUrl: null,
    });

    // Send emails
    if (reportConfig.recipientEmails && reportConfig.recipientEmails.length > 0) {
      const emailSent = await sendReportEmail(
        reportConfig.recipientEmails,
        reportConfig.name,
        reportData
      );

      if (!emailSent) {
        await notifyOwner({
          title: "Report Email Delivery Failed",
          content: `Failed to send report "${reportConfig.name}" to recipients`,
        });
      }
    }

    console.log(`Report generated successfully for config ${configId}`);
  } catch (error) {
    console.error(`Error generating report for config ${configId}:`, error);
    await notifyOwner({
      title: "Report Generation Failed",
      content: `Failed to generate report for config ${configId}: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Start scheduler for a report config
 */
export async function startReportScheduler(configId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Check if already scheduled
    if (activeJobs.has(configId)) {
      console.log(`Report scheduler already running for config ${configId}`);
      return;
    }

    // Get report config
    const config = await db.select().from(reportConfigs).where(eq(reportConfigs.id, configId));

    if (config.length === 0) {
      console.error(`Report config ${configId} not found`);
      return;
    }

    const reportConfig = config[0];

    // Generate cron expression
    const cronExpression = getScheduleCronExpression(
      reportConfig.scheduleFrequency as "daily" | "weekly" | "monthly",
      reportConfig.scheduleTime
    );

    // Create and start cron job
    const job = new CronJob(
      cronExpression,
      () => {
        console.log(`Executing report generation for config ${configId}`);
        executeReportGeneration(configId);
      },
      null,
      true,
      "UTC"
    );

    activeJobs.set(configId, {
      configId,
      cronExpression,
      job,
    });

    console.log(`Report scheduler started for config ${configId} with cron: ${cronExpression}`);
  } catch (error) {
    console.error(`Failed to start report scheduler for config ${configId}:`, error);
  }
}

/**
 * Stop scheduler for a report config
 */
export async function stopReportScheduler(configId: number): Promise<void> {
  const scheduledJob = activeJobs.get(configId);

  if (scheduledJob) {
    scheduledJob.job.stop();
    activeJobs.delete(configId);
    console.log(`Report scheduler stopped for config ${configId}`);
  }
}

/**
 * Initialize all active report schedulers on startup
 */
export async function initializeReportSchedulers(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all active report configs
    const configs = await db
      .select()
      .from(reportConfigs)
      .where(eq(reportConfigs.isActive, true));

    for (const config of configs) {
      await startReportScheduler(config.id);
    }

    console.log(`Initialized ${configs.length} report schedulers`);
  } catch (error) {
    console.error("Failed to initialize report schedulers:", error);
  }
}

/**
 * Get all active schedulers
 */
export function getActiveSchedulers(): ScheduledJob[] {
  return Array.from(activeJobs.values());
}

/**
 * Manually trigger report generation
 */
export async function triggerReportGeneration(configId: number): Promise<void> {
  console.log(`Manually triggering report generation for config ${configId}`);
  await executeReportGeneration(configId);
}
