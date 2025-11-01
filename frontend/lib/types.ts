export interface EvidenceItem {
  article?: string;
  section?: string;
  quote: string;
  link?: string;
  documentTitle?: string;
}

export interface AskResponse {
  answerHtml: string;
  evidence: EvidenceItem[];
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
}
