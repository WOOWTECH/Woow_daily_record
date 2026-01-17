// src/modules/notes/components/note-filters.tsx
"use client";

import { cn } from '@/lib/utils';
import type { NoteFilter } from '../types';

interface NoteFiltersProps {
  filter: NoteFilter;
  onChange: (filter: NoteFilter) => void;
}

const filters: { value: NoteFilter; label: string }[] = [
  { value: 'all', label: 'All Notes' },
  { value: 'pinned', label: 'Pinned' },
];

export function NoteFilters({ filter, onChange }: NoteFiltersProps) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
            filter === f.value
              ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
              : "bg-white/50 text-brand-deep-gray hover:bg-white hover:text-brand-blue dark:bg-brand-black/20 dark:hover:bg-brand-black/40"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
