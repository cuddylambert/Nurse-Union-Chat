'use client';

import { ChevronRight } from 'lucide-react';

const EXAMPLES = [
  'How much notice must management give before changing a preceptor assignment?',
  'What are the overtime rules for a 12-hour nurse on a holiday?',
  'Can a nurse refuse mandatory overtime after working three consecutive shifts?',
  'How is charge nurse pay determined for NX unit nurses?'
];

interface Props {
  onSelect: (question: string) => void;
}

export function ExampleQuestions({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
      <span className="font-semibold text-slate-300">Examples:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-brand hover:text-white"
          onClick={() => onSelect(example)}
        >
          <ChevronRight className="h-3 w-3" /> {example}
        </button>
      ))}
    </div>
  );
}
