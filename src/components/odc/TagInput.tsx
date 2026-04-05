'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

export default function TagInput({
  value: tags,
  onChange,
  placeholder = 'Type a name and press Enter…',
  error,
}: TagInputProps) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInputVal('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex flex-wrap gap-2 items-center min-h-[44px] px-3 py-2 rounded-md border bg-white cursor-text
          ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-input focus-within:border-[var(--brand-brass)] focus-within:ring-1 focus-within:ring-[var(--brand-brass)]'}
          transition-all duration-150`}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(184,150,78,0.12)',
              color: 'var(--brand-navy)',
              border: '1px solid rgba(184,150,78,0.3)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="ml-0.5 hover:text-red-500 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {tags.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--brand-slate)' }}>
          {tags.length} candidate{tags.length !== 1 ? 's' : ''} added
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
