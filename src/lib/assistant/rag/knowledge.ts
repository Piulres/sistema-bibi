import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type KnowledgeChunk = {
  id: string;
  title: string;
  content: string;
  source: string;
};

let cache: KnowledgeChunk[] | null = null;

function loadMarkdown(relativePath: string, source: string): KnowledgeChunk[] {
  const fullPath = join(process.cwd(), relativePath);
  let raw: string;
  try {
    raw = readFileSync(fullPath, "utf8");
  } catch {
    return [];
  }

  const sections = raw.split(/\n(?=## )/);
  return sections
    .map((section, index) => {
      const titleMatch = section.match(/^##\s+(.+)/m);
      const title = titleMatch?.[1]?.trim() ?? `Seção ${index + 1}`;
      const content = section.trim();
      if (content.length < 80) return null;
      return {
        id: `${source}-${index}`,
        title,
        content: content.slice(0, 1200),
        source,
      };
    })
    .filter((chunk): chunk is KnowledgeChunk => chunk !== null);
}

export function getKnowledgeChunks(): KnowledgeChunk[] {
  if (cache) return cache;
  cache = [
    ...loadMarkdown("docs/plataforma/NOTEBOOKLM.md", "notebooklm"),
    ...loadMarkdown("docs/produto/FLUXOS.md", "fluxos"),
    ...loadMarkdown("src/lib/crud-operations-map.ts", "crud-map"),
  ];
  return cache;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9à-ú]+/i)
    .filter((t) => t.length > 2);
}

/** Busca simples por sobreposição de tokens (RAG leve, sem embeddings). */
export function searchKnowledge(query: string, limit = 3): KnowledgeChunk[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = getKnowledgeChunks()
    .map((chunk) => {
      const hay = tokenize(`${chunk.title} ${chunk.content}`);
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0);
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.chunk);
}

export function formatKnowledgeAnswer(query: string, chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) {
    return `Não encontrei documentação específica sobre "${query}". Consulte o menu do portal ou pergunte de outra forma.`;
  }

  const lines = [`Encontrei **${chunks.length}** trecho(s) relevante(s) sobre "${query}":`, ""];
  for (const chunk of chunks) {
    lines.push(`**${chunk.title}** (${chunk.source})`);
    lines.push(chunk.content.split("\n").slice(0, 6).join("\n"));
    lines.push("");
  }
  return lines.join("\n").trim();
}
