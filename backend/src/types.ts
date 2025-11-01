import { z } from 'zod';

export const chunkMetadataSchema = z
  .object({
    unionCode: z.string().optional(),
    article: z.string().optional(),
    section: z.string().optional(),
    heading: z.string().optional(),
    pages: z.array(z.number()).optional(),
    url: z.string().optional(),
    source: z.string().optional(),
    sha256: z.string().optional(),
    documentTitle: z.string().optional()
  })
  .passthrough();

export type ContractChunkMetadata = z.infer<typeof chunkMetadataSchema>;

export interface RetrievedChunk {
  id: string;
  unionCode: string;
  content: string;
  metadata: ContractChunkMetadata;
  textScore?: number | null;
  vectorDistance?: number | null;
}

export interface ContractSource {
  unionCode: string;
  displayName: string;
  seedUrls: string[];
  parsers: ParserSpec[];
  schemaVersion: string;
}

export interface ParserSpec {
  name: string;
  match: RegExp;
  type: 'contract' | 'appendix' | 'sideLetter' | 'mou' | 'other';
}

export interface AskRequestBody {
  question: string;
  unionCode?: string;
  documentIds?: string[];
}

export interface EvidenceItem {
  article?: string;
  section?: string;
  quote: string;
  link?: string;
  documentTitle?: string;
}

export interface AskResponsePayload {
  answerHtml: string;
  evidence: EvidenceItem[];
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
}
