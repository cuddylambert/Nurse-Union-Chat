import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '../env.js';
import { logger } from '../logger.js';
import type {
  AskResponsePayload,
  EvidenceItem,
  RetrievedChunk
} from '../types.js';
import { renderAnswerTemplate } from '../utils/html.js';
import { ContractRetriever } from '../retrieval/retriever.js';

const responseSchema = z.object({
  answer: z.string(),
  assumptions: z.array(z.string()).default([]),
  confidence: z.enum(['high', 'medium', 'low']),
  citations: z
    .array(
      z.object({
        id: z.string(),
        quote: z.string().min(1)
      })
    )
    .min(1)
});

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const metadata = chunk.metadata;
      const location = [metadata.article, metadata.section, metadata.heading]
        .filter(Boolean)
        .join(' ');
      const pages = metadata.pages?.length ? `Pages: ${metadata.pages.join(', ')}` : 'Pages: n/a';
      return `Document ${index + 1} (id: ${chunk.id})\nLocation: ${location || 'Unknown'}\n${pages}\nText: ${chunk.content}`;
    })
    .join('\n---\n');
}

function enforceWordLimit(answer: string, limit = 120): string {
  const words = answer.trim().split(/\s+/);
  if (words.length <= limit) {
    return answer.trim();
  }

  return `${words.slice(0, limit).join(' ')}…`;
}

function buildEvidence(
  citations: Array<{ id: string; quote: string }>,
  chunks: RetrievedChunk[]
): EvidenceItem[] {
  return citations
    .map((citation) => {
      const chunk = chunks.find((item) => item.id === citation.id);
      if (!chunk) {
        return null;
      }

      const { metadata } = chunk;
      const link = metadata.url
        ? metadata.url
        : metadata.source && metadata.pages?.length
        ? `${metadata.source}#page=${metadata.pages[0]}`
        : metadata.source;

      return {
        article: metadata.article,
        section: metadata.section,
        quote: citation.quote,
        link: link ?? undefined,
        documentTitle: metadata.documentTitle ?? metadata.source ?? 'Contract'
      } satisfies EvidenceItem;
    })
    .filter((item): item is EvidenceItem => Boolean(item));
}

export class AnswerService {
  private readonly client: OpenAI | null;

  constructor(private readonly retriever: ContractRetriever) {
    this.client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
  }

  async ask(question: string, unionCode: string): Promise<AskResponsePayload> {
    const chunks = await this.retriever.retrieve({ question, unionCode });

    if (chunks.length === 0) {
      const fallback: AskResponsePayload = {
        answerHtml:
          '<p>No matching contract language was found. Please try rephrasing your question or review the table of contents for the contract.</p>',
        evidence: [],
        assumptions: [],
        confidence: 'low'
      };
      return fallback;
    }

    if (!this.client) {
      const evidence = buildEvidence(
        chunks.slice(0, 3).map((chunk) => ({ id: chunk.id, quote: chunk.content.slice(0, 200) + '…' })),
        chunks
      );

      return {
        answerHtml: renderAnswerTemplate({
          answer:
            'Unable to contact the language model. Review the cited contract excerpts manually for details.',
          evidence,
          assumptions: [],
          confidence: 'low'
        }),
        evidence,
        assumptions: [],
        confidence: 'low'
      };
    }

    const context = buildContext(chunks.slice(0, 7));

    const responseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'contract_answer',
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string', description: 'Plain-language answer under 120 words.' },
            assumptions: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of explicit assumptions made.'
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Confidence rating based on source clarity.'
            },
            citations: {
              type: 'array',
              description: 'Citations referencing document ids and relevant quotes.',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Document id from the provided context.' },
                  quote: { type: 'string', description: 'Short quote supporting the answer.' }
                },
                required: ['id', 'quote']
              },
              minItems: 1
            }
          },
          required: ['answer', 'confidence', 'citations']
        }
      }
    } as const;

    const completion = await this.client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content:
            'You are UnionExplain, an AI that answers questions about union contracts using only the provided context. Respond in JSON following the supplied schema. Keep the answer under 120 words, cite only document ids from the context, and never fabricate clauses. Mention any assumptions explicitly and avoid legal advice.'
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${context}`
        }
      ],
      response_format: responseFormat
    });

    const raw = completion.output_text;

    let parsed;

    try {
      parsed = responseSchema.parse(JSON.parse(raw));
    } catch (error) {
      logger.error({ err: error, raw }, 'Failed to parse model response');
      const evidence = buildEvidence(
        chunks.slice(0, 3).map((chunk) => ({ id: chunk.id, quote: chunk.content.slice(0, 200) + '…' })),
        chunks
      );

      return {
        answerHtml: renderAnswerTemplate({
          answer: 'The language model returned an unexpected response. Please review the cited passages directly.',
          evidence,
          assumptions: [],
          confidence: 'low'
        }),
        evidence,
        assumptions: [],
        confidence: 'low'
      };
    }

    const evidence = buildEvidence(parsed.citations, chunks);

    const payload: AskResponsePayload = {
      answerHtml: renderAnswerTemplate({
        answer: enforceWordLimit(parsed.answer),
        evidence,
        assumptions: parsed.assumptions,
        confidence: parsed.confidence
      }),
      evidence,
      assumptions: parsed.assumptions,
      confidence: parsed.confidence
    };

    return payload;
  }
}
