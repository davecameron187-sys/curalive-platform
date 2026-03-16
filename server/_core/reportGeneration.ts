import { Resend } from "resend";
import { PDFDocument, rgb, PDFPage } from "pdf-lib";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReportData {
  conferenceTitle: string;
  eventDate: string;
  recipientEmail: string;
  recipientName: string;
  sentimentAnalysis: {
    overallSentiment: string;
    overallScore: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  summary: {
    summaryText: string;
    keyPoints: string[];
    actionItems: string[];
  };
  recordingDuration: number;
}

/**
 * Generate PDF report with sentiment analysis and summary
 */
async function generatePdfReport(data: ReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();
  let yPosition = height - 50;

  // Title
  page.drawText("Recording Analysis Report", {
    x: 50,
    y: yPosition,
    size: 24,
    color: rgb(0, 0, 0),
  });

  yPosition -= 40;

  // Conference info
  page.drawText(`Conference: ${data.conferenceTitle}`, {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 20;
  page.drawText(`Date: ${data.eventDate}`, {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 20;
  page.drawText(`Duration: ${Math.round(data.recordingDuration / 60)} minutes`, {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 40;

  // Sentiment Analysis Section
  page.drawText("Sentiment Analysis", {
    x: 50,
    y: yPosition,
    size: 16,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  const sentimentColor =
    data.sentimentAnalysis.overallSentiment === "positive"
      ? rgb(0.04, 0.74, 0.66)
      : data.sentimentAnalysis.overallSentiment === "negative"
        ? rgb(0.96, 0.26, 0.21)
        : rgb(0.42, 0.42, 0.42);

  page.drawText(`Overall Sentiment: ${data.sentimentAnalysis.overallSentiment.toUpperCase()}`, {
    x: 50,
    y: yPosition,
    size: 14,
    color: sentimentColor,
  });

  yPosition -= 20;
  page.drawText(`Sentiment Score: ${data.sentimentAnalysis.overallScore.toFixed(2)} / 1.0`, {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 20;
  page.drawText(
    `Positive: ${data.sentimentAnalysis.positiveCount} | Neutral: ${data.sentimentAnalysis.neutralCount} | Negative: ${data.sentimentAnalysis.negativeCount}`,
    {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    }
  );

  yPosition -= 40;

  // Summary Section
  page.drawText("Executive Summary", {
    x: 50,
    y: yPosition,
    size: 16,
    color: rgb(0, 0, 0),
  });

  yPosition -= 25;

  // Wrap summary text
  const summaryLines = wrapText(data.summary.summaryText, 80);
  for (const line of summaryLines.slice(0, 5)) {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 15;
  }

  if (summaryLines.length > 5) {
    page.drawText("...", {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  yPosition -= 20;

  // Key Points
  page.drawText("Key Points:", {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  for (const point of data.summary.keyPoints.slice(0, 3)) {
    page.drawText(`• ${point}`, {
      x: 60,
      y: yPosition,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 15;
  }

  yPosition -= 15;

  // Action Items
  page.drawText("Action Items:", {
    x: 50,
    y: yPosition,
    size: 12,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  for (const item of data.summary.actionItems.slice(0, 3)) {
    page.drawText(`• ${item}`, {
      x: 60,
      y: yPosition,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 15;
  }

  return Buffer.from(await pdfDoc.save());
}

/**
 * Wrap text to fit within character limit
 */
function wrapText(text: string, charLimit: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > charLimit) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Send email report with PDF attachment
 */
export async function sendReportEmail(data: ReportData): Promise<void> {
  try {
    const pdfBuffer = await generatePdfReport(data);

    await resend.emails.send({
      from: "noreply@chorus.ai",
      to: data.recipientEmail,
      subject: `Recording Analysis Report - ${data.conferenceTitle}`,
      html: `
        <h2>Recording Analysis Report</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Your recording analysis for <strong>${data.conferenceTitle}</strong> is ready.</p>
        <p><strong>Overall Sentiment:</strong> ${data.sentimentAnalysis.overallSentiment}</p>
        <p><strong>Sentiment Score:</strong> ${data.sentimentAnalysis.overallScore.toFixed(2)}/1.0</p>
        <p>Please see the attached PDF for the full report including sentiment analysis, executive summary, and action items.</p>
        <p>Best regards,<br/>Chorus.AI</p>
      `,
      attachments: [
        {
          filename: `report-${new Date().toISOString().split("T")[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log(`[ReportGeneration] Email sent to ${data.recipientEmail}`);
  } catch (error) {
    console.error(`[ReportGeneration] Error sending email:`, error);
    throw error;
  }
}

/**
 * Generate comparison report across multiple events
 */
export async function generateComparisonReport(
  conferenceTitle: string,
  recipientEmail: string,
  comparisonData: Array<{
    date: string;
    sentiment: string;
    score: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  }>
): Promise<void> {
  const avgScore = comparisonData.reduce((sum, d) => sum + d.score, 0) / comparisonData.length;
  const positiveCount = comparisonData.filter((d) => d.sentiment === "positive").length;

  await sendReportEmail({
    conferenceTitle,
    eventDate: new Date().toLocaleDateString(),
    recipientEmail,
    recipientName: "Stakeholder",
    sentimentAnalysis: {
      overallSentiment: avgScore > 0.2 ? "positive" : avgScore < -0.2 ? "negative" : "neutral",
      overallScore: avgScore,
      positiveCount,
      neutralCount: comparisonData.length - positiveCount,
      negativeCount: 0,
    },
    summary: {
      summaryText: `Comparison analysis across ${comparisonData.length} recordings. Average sentiment score: ${avgScore.toFixed(2)}`,
      keyPoints: [
        `${positiveCount} out of ${comparisonData.length} recordings had positive sentiment`,
        `Average sentiment score: ${avgScore.toFixed(2)}`,
        `Trend: ${avgScore > 0 ? "Positive" : "Negative"}`,
      ],
      actionItems: ["Review recordings with negative sentiment", "Share positive insights with team"],
    },
    recordingDuration: 0,
  });
}
