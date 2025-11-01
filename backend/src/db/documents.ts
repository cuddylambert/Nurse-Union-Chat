import type { QueryResult } from 'pg';
import { toSql } from 'pgvector/pg';

import type { RetrievedChunk } from '../types.js';
import { chunkMetadataSchema } from '../types.js';
import { pool } from './pool.js';

interface SearchOptions {
  unionCode: string;
  question: string;
  limit: number;
  embedding?: number[];
}

function parseRows(result: QueryResult): RetrievedChunk[] {
  return result.rows.map((row) => {
    let rawMetadata = row.metadata;
    if (typeof rawMetadata === 'string') {
      try {
        rawMetadata = JSON.parse(rawMetadata);
      } catch (error) {
        rawMetadata = {};
      }
    }

    const metadata = chunkMetadataSchema.safeParse(rawMetadata);

    return {
      id: row.id,
      unionCode: row.union_code,
      content: row.chunk,
      metadata: metadata.success ? metadata.data : {},
      textScore: row.text_score ?? null,
      vectorDistance: row.vector_distance ?? null
    } satisfies RetrievedChunk;
  });
}

export async function searchContractChunks({
  unionCode,
  question,
  limit,
  embedding
}: SearchOptions): Promise<RetrievedChunk[]> {
  const textQuery = `
    SELECT
      id,
      union_code,
      chunk,
      metadata,
      ts_rank_cd(tsv, websearch_to_tsquery('english', $2)) AS text_score
    FROM contract_chunks
    WHERE union_code = $1
    ORDER BY text_score DESC NULLS LAST
    LIMIT $3
  `;

  const textResult = await pool.query(textQuery, [unionCode, question, limit]);
  const textRows = parseRows(textResult);

  if (!embedding) {
    return textRows;
  }

  const vectorQuery = `
    SELECT
      id,
      union_code,
      chunk,
      metadata,
      (embedding <=> $2::vector) AS vector_distance
    FROM contract_chunks
    WHERE union_code = $1
    ORDER BY embedding <=> $2::vector ASC
    LIMIT $3
  `;

  const vectorResult = await pool.query(vectorQuery, [
    unionCode,
    toSql(embedding),
    limit
  ]);
  const vectorRows = parseRows(vectorResult);

  const merged = new Map<string, RetrievedChunk>();

  for (const row of [...vectorRows, ...textRows]) {
    const existing = merged.get(row.id);
    if (!existing) {
      merged.set(row.id, row);
      continue;
    }

    merged.set(row.id, {
      ...existing,
      textScore: existing.textScore ?? row.textScore,
      vectorDistance: existing.vectorDistance ?? row.vectorDistance
    });
  }

  return Array.from(merged.values()).sort((a, b) => {
    const vectorScoreA = a.vectorDistance ?? Number.POSITIVE_INFINITY;
    const vectorScoreB = b.vectorDistance ?? Number.POSITIVE_INFINITY;
    const textScoreA = a.textScore ?? 0;
    const textScoreB = b.textScore ?? 0;

    if (Number.isFinite(vectorScoreA) || Number.isFinite(vectorScoreB)) {
      return vectorScoreA - vectorScoreB;
    }

    return textScoreB - textScoreA;
  });
}
