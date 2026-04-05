'use client';

import { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SQL_MIGRATION_STEPS = `Run this in Supabase Dashboard → SQL Editor → New Query:

1. Go to: https://supabase.com/dashboard/project/ddizibujqipeukatmlwe/sql/new
2. Paste and run the file: supabase/migrations/001_init.sql
3. Then go to Storage → New Bucket → name it "odc-documents" → Public: ON`;

interface SetupBannerProps {
  tableExists: boolean;
}

export default function SetupBanner({ tableExists }: SetupBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (tableExists || dismissed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SQL_MIGRATION_STEPS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="rounded-xl border p-4 animate-fade-slide-up"
      style={{
        background: 'rgba(234,179,8,0.06)',
        borderColor: 'rgba(234,179,8,0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(234,179,8,0.15)' }}
        >
          <AlertTriangle size={15} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-700">
            Supabase Setup Required
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            The database table and storage bucket need to be created before you can save records.
          </p>
          <div className="mt-3 space-y-2">
            <div
              className="flex items-center gap-2 flex-wrap"
            >
              <a
                href="https://supabase.com/dashboard/project/ddizibujqipeukatmlwe/sql/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <ExternalLink size={11} />
                  Open SQL Editor
                </Button>
              </a>
              <a
                href="https://supabase.com/dashboard/project/ddizibujqipeukatmlwe/storage/buckets"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <ExternalLink size={11} />
                  Create Storage Bucket
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 text-xs gap-1.5 text-amber-700 hover:bg-amber-50"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy Instructions'}
              </Button>
            </div>
            <p className="text-xs text-amber-600 opacity-75">
              Steps: 1) Run <code className="px-1 rounded bg-amber-100">supabase/migrations/001_init.sql</code> in SQL Editor
              → 2) Create bucket <code className="px-1 rounded bg-amber-100">odc-documents</code> (Public) in Storage
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
