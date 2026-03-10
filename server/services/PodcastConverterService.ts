import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments, webcastEvents } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export interface PodcastChapter {
  index: number;
  title: string;
  startTimestamp: string;
  summary: string;
  keyQuote: string;
}

export interface PodcastData {
  title: string;
  description: string;
  episodeNumber: string;
  duration: string;
  chapters: PodcastChapter[];
  showNotes: string;
  tags: string[];
  callToAction: string;
  rssDescription: string;
}

export class PodcastConverterService {
  async convertToPodcast(eventId: string): Promise<PodcastData> {
    const db = getDb();

    const [segments, events] = await Promise.all([
      db
        .select()
        .from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.conferenceId, eventId))
        .orderBy(asc(occTranscriptionSegments.createdAt))
        .limit(200)
        .catch(() => []),
      db
        .select()
        .from(webcastEvents)
        .where(eq(webcastEvents.id, eventId as any))
        .limit(1)
        .catch(() => []),
    ]);

    const fullTranscript = segments.map((s: any) => s.content).join(" ");
    const eventTitle = (events[0] as any)?.title ?? "CuraLive Event";

    if (!fullTranscript) {
      return this.generatePlaceholderPodcast(eventTitle, eventId);
    }

    const prompt = `You are a professional podcast producer. Convert this investor event transcript into a structured podcast episode.

Event: "${eventTitle}"
Transcript (${fullTranscript.length} chars): "${fullTranscript.slice(0, 6000)}"

Return JSON:
{
  "title": "Engaging podcast episode title",
  "description": "2-3 sentence episode description for podcast platforms",
  "episodeNumber": "EP001",
  "duration": "estimated HH:MM",
  "chapters": [
    {
      "index": 1,
      "title": "Chapter title",
      "startTimestamp": "00:00",
      "summary": "What happened in this section",
      "keyQuote": "Best quote from this section"
    }
  ],
  "showNotes": "Full show notes in markdown with key topics, timestamps, and resources",
  "tags": ["tag1", "tag2"],
  "callToAction": "What listeners should do after listening",
  "rssDescription": "Plain-text RSS-safe description under 300 chars"
}

Create 4-6 logical chapters based on the conversation flow.`;

    try {
      const raw = await invokeLLM({
        prompt,
        systemPrompt: "You are a professional podcast producer specialising in investor relations content.",
        response_format: { type: "json_object" },
      });
      return JSON.parse(raw) as PodcastData;
    } catch {
      return this.generatePlaceholderPodcast(eventTitle, eventId);
    }
  }

  private generatePlaceholderPodcast(eventTitle: string, eventId: string): PodcastData {
    return {
      title: `${eventTitle} — Investor Podcast Episode`,
      description: `Full recording and highlights from ${eventTitle}, featuring Q&A, financial results discussion, and forward guidance.`,
      episodeNumber: "EP001",
      duration: "45:00",
      chapters: [
        { index: 1, title: "Opening & Welcome", startTimestamp: "00:00", summary: "Event introduction and housekeeping", keyQuote: "Welcome to our quarterly earnings webcast." },
        { index: 2, title: "Financial Results Overview", startTimestamp: "05:00", summary: "Key financial highlights and year-on-year comparison", keyQuote: "We delivered strong results this quarter." },
        { index: 3, title: "Strategic Outlook", startTimestamp: "20:00", summary: "Management outlook and guidance", keyQuote: "We remain confident in our strategic direction." },
        { index: 4, title: "Investor Q&A", startTimestamp: "35:00", summary: "Questions from analysts and investors", keyQuote: "Great question — let me address that directly." },
      ],
      showNotes: `## ${eventTitle}\n\nThis episode covers:\n- Financial results\n- Strategic outlook\n- Investor Q&A\n\n**Key Topics:** Earnings, guidance, investor relations\n\n**Resources:** Investor Relations website | Annual Report | Presentation Deck`,
      tags: ["earnings", "investor-relations", "quarterly-results", "webcast"],
      callToAction: "Subscribe to our investor podcast for automatic updates on future earnings calls and corporate announcements.",
      rssDescription: `${eventTitle} investor event podcast — financial results, strategic outlook, and live Q&A.`,
    };
  }
}

export const podcastConverterService = new PodcastConverterService();
