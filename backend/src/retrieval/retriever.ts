import { searchContractChunks } from '../db/documents.js';
import type { RetrievedChunk } from '../types.js';
import { logger } from '../logger.js';
import type { EmbeddingsProvider } from './embeddings.js';

export interface RetrieveParams {
  question: string;
  unionCode: string;
  limit?: number;
}

export class ContractRetriever {
  constructor(private readonly embeddings: EmbeddingsProvider) {}

  async retrieve({ question, unionCode, limit = 7 }: RetrieveParams): Promise<RetrievedChunk[]> {
    let embedding: number[] | null = null;

    if (this.embeddings.isEnabled) {
      embedding = await this.embeddings.embed(question);
    }

    try {
      return await searchContractChunks({
        unionCode,
        question,
        limit,
        embedding: embedding ?? undefined
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to query contract chunks');
      return [];
    }
  }
}
