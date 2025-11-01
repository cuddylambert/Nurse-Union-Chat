'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Loader2, Sparkles } from 'lucide-react';

import type { AskResponse } from '../lib/types';
import { cn } from '../lib/utils';
import { AnswerCard } from './answer-card';
import { ExampleQuestions } from './example-questions';

const STORAGE_KEY = 'unionexplain-history';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
}

interface HistoryEntry {
  id: string;
  question: string;
  askedAt: string;
  response: AskResponse;
}

export function AskPanel() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        setHistory(parsed);
      }
    } catch (storageError) {
      console.warn('Unable to load stored history', storageError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (storageError) {
      console.warn('Unable to persist history', storageError);
    }
  }, [history]);

  const submitQuestion = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setError('Please enter a question about the contract.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question: value })
        });

        const payload = (await res.json().catch(() => null)) as AskResponse | { error?: string } | null;

        if (!res.ok || !payload) {
          throw new Error((payload as { error?: string } | null)?.error ?? 'Request failed');
        }

        const data = payload as AskResponse;
        setResponse(data);
        setHistory((prev) => [
          {
            id: createId(),
            question: value.trim(),
            askedAt: new Date().toISOString(),
            response: data
          },
          ...prev
        ]);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const lastAsked = useMemo(() => history[0], [history]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand-light">
            <Sparkles className="h-3.5 w-3.5" /> Retrieval-augmented answers with citations
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            UC Nurse Contract Answers, in plain English
          </h1>
          <p className="max-w-2xl text-base text-slate-200">
            Ask a question about the UC Registered Nurses (NX Unit) collective bargaining agreement. You&apos;ll get a concise
            summary, direct quotes, and links back to the official PDF.
          </p>
        </header>

        <form
          className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-brand/10 backdrop-blur"
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuestion(question);
          }}
        >
          <label htmlFor="question" className="block text-sm font-medium text-slate-300">
            What do you need to know?
          </label>
          <textarea
            id="question"
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-white shadow-inner focus:border-brand focus:outline-none focus:ring focus:ring-brand/40"
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How much notice is required before changing a preceptor assignment?"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition',
                'hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light',
                isLoading && 'cursor-not-allowed opacity-70'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Generating answer…
                </>
              ) : (
                'Get Answer'
              )}
            </button>
            <ExampleQuestions onSelect={(value) => {
              setQuestion(value);
              void submitQuestion(value);
            }} />
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </form>

        {response && (
          <AnswerCard
            key={response.answerHtml + response.confidence}
            response={response}
            question={lastAsked?.question ?? question}
          />
        )}
      </div>

      <aside className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/40 p-5 text-sm text-slate-200">
        <div className="flex items-center gap-2 text-slate-300">
          <History className="h-4 w-4" />
          <span className="font-semibold">Recent questions</span>
        </div>
        <p className="text-xs text-slate-400">
          Saved locally so you can revisit previous contract answers. Sign in (coming soon) to sync across devices.
        </p>
        <ul className="space-y-3">
          {history.length === 0 && <li className="text-slate-500">No questions yet.</li>}
          {history.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="text-left text-slate-200 transition hover:text-white"
                onClick={() => {
                  setQuestion(entry.question);
                  setResponse(entry.response);
                }}
              >
                <div className="text-sm font-medium">{entry.question}</div>
                <div className="text-xs text-slate-500">{new Date(entry.askedAt).toLocaleString()}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
