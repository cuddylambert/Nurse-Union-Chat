'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';

import type { AskResponse } from '../lib/types';
import { cn } from '../lib/utils';

interface Props {
  response: AskResponse;
  question: string;
}

export function AnswerCard({ response, question }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Question</p>
          <h2 className="text-lg font-semibold text-white">{question}</h2>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
            response.confidence === 'high' && 'bg-emerald-500/20 text-emerald-200',
            response.confidence === 'medium' && 'bg-amber-500/20 text-amber-200',
            response.confidence === 'low' && 'bg-rose-500/20 text-rose-200'
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> {response.confidence.toUpperCase()} confidence
        </span>
      </header>

      <article
        className="space-y-4 text-base leading-relaxed text-slate-100 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_blockquote]:text-slate-300"
        dangerouslySetInnerHTML={{ __html: response.answerHtml }}
      />

      {response.evidence.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clickable citations</p>
          <ul className="space-y-2 text-sm text-slate-200">
            {response.evidence.map((item, index) => (
              <li key={`${item.link ?? item.quote}-${index}`} className="rounded-lg bg-slate-900/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {item.article || item.documentTitle || 'Contract'} {item.section ?? ''}
                    </p>
                    <p className="text-xs text-slate-400">“{item.quote}”</p>
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-light"
                    >
                      Open PDF <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
