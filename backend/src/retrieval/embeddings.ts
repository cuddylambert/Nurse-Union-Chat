import OpenAI from 'openai';

import { env } from '../env.js';
import { logger } from '../logger.js';

export interface EmbeddingsProvider {
  isEnabled: boolean;
  embed(text: string): Promise<number[] | null>;
}

export class OpenAiEmbeddingsProvider implements EmbeddingsProvider {
  private client: OpenAI | null;

  constructor() {
    this.client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
  }

  get isEnabled(): boolean {
    return Boolean(this.client);
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.client) {
      return null;
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return response.data[0]?.embedding ?? null;
    } catch (error) {
      logger.error({ err: error }, 'Failed to generate embedding');
      return null;
    }
  }
}
