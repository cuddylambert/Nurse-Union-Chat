import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { cn } from '../lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UnionExplain — UC Nurse Contract Answers',
  description:
    'Ask questions about the UC Registered Nurses (NX Unit) contract and get concise, cited answers with direct links to the official PDF.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={cn(inter.className, 'min-h-screen bg-slate-950 text-slate-100')}>
        {children}
      </body>
    </html>
  );
}
