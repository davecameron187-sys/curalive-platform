import { getDb } from "../db";

export interface KnowledgeEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
  source: string | null;
  keywords: string | null;
}

async function rawQuery(sql: string, params: any[] = []) {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(sql, params);
  return rows as any[];
}

function scoreEntry(entry: KnowledgeEntry, terms: string[]): number {
  const haystack = [
    entry.question,
    entry.answer,
    entry.keywords ?? "",
    entry.category,
  ].join(" ").toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += haystack.split(term).length - 1;
      if (entry.question.toLowerCase().includes(term)) score += 3;
      if ((entry.keywords ?? "").toLowerCase().includes(term)) score += 2;
    }
  }
  return score;
}

export async function retrieveRelevantEntries(
  query: string,
  topK = 4
): Promise<KnowledgeEntry[]> {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (terms.length === 0) return [];

  const all = await rawQuery(
    `SELECT id, category, question, answer, source, keywords FROM knowledge_entries LIMIT 200`
  );

  const scored = all
    .map((entry: KnowledgeEntry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ entry }) => entry);

  return scored;
}

export function buildContextBlock(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "";
  return entries
    .map(e => `Q: ${e.question}\nA: ${e.answer}`)
    .join("\n\n");
}
