import type { EvidenceItem } from '../types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface AnswerTemplateInput {
  answer: string;
  evidence: EvidenceItem[];
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
}

export function renderAnswerTemplate({
  answer,
  evidence,
  assumptions,
  confidence
}: AnswerTemplateInput): string {
  const formattedEvidence = evidence
    .map((item) => {
      const labelParts = [item.article, item.section].filter(Boolean);
      const label = labelParts.length > 0 ? labelParts.join(' ') : item.documentTitle ?? 'Contract';
      const quote = escapeHtml(item.quote.trim());
      const link = item.link
        ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
        : escapeHtml(label);
      return `<li><blockquote>“${quote}”</blockquote><div class="citation">${link}</div></li>`;
    })
    .join('');

  const formattedAssumptions = assumptions.length
    ? assumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join('')
    : '<li>None.</li>';

  return `
    <section class="answer">
      <h2>✅ Answer</h2>
      <p>${escapeHtml(answer)}</p>
    </section>
    <section class="evidence">
      <h3>🔎 What the Contract Says</h3>
      <ul>${formattedEvidence}</ul>
    </section>
    <section class="assumptions">
      <h3>🧭 Assumptions</h3>
      <ul>${formattedAssumptions}</ul>
    </section>
    <section class="confidence">
      <p><strong>📈 Confidence:</strong> ${escapeHtml(capitalize(confidence))}</p>
      <p><strong>⚠️ Informational only — not legal advice.</strong></p>
    </section>
  `
    .replace(/\n\s+/g, '\n')
    .trim();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
