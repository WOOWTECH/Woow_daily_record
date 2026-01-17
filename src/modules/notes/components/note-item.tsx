// src/modules/notes/components/note-item.tsx
"use client";

import { format } from 'date-fns';
import Icon from "@mdi/react";
import { mdiPin, mdiDelete, mdiPencil } from "@mdi/js";
import { cn } from '@/lib/utils';
import type { Note } from '../types';

interface NoteItemProps {
  note: Note;
  onTogglePin: (id: string) => void;
  onClick: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteItem({ note, onTogglePin, onClick, onDelete }: NoteItemProps) {
  const updatedAt = format(new Date(note.updated_at), 'MMM d, yyyy');

  // Get preview of content (first 100 chars)
  const preview = note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '');

  return (
    <div
      className={cn(
        "group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
        "bg-white/60 dark:bg-brand-black/20 backdrop-blur-sm",
        "hover:shadow-lg hover:shadow-brand-blue/5 hover:-translate-y-1",
        "border-white/50 dark:border-white/5",
        "hover:border-brand-blue/20",
        note.is_pinned && "border-brand-yellow/50 bg-brand-yellow/5"
      )}
      onClick={() => onClick(note)}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <Icon
          path={mdiPin}
          size={0.67}
          className="absolute top-4 right-4 text-brand-soft-yellow fill-brand-soft-yellow rotate-45"
        />
      )}

      {/* Title */}
      <h3 className="font-bold text-lg mb-2 pr-8 truncate text-brand-black dark:text-brand-white">
        {note.title}
      </h3>

      {/* Preview */}
      {preview && (
        <p className="text-sm text-brand-deep-gray leading-relaxed line-clamp-3 mb-4">
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-gray/50 dark:border-white/5">
        <span className="text-xs font-medium text-brand-deep-gray/60">
          {updatedAt}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={cn(
              "p-2 rounded-full transition-all duration-200 hover:scale-110",
              note.is_pinned
                ? "text-brand-soft-yellow bg-brand-soft-yellow/10"
                : "text-brand-deep-gray hover:text-brand-blue hover:bg-brand-blue/10"
            )}
            title={note.is_pinned ? "Unpin" : "Pin"}
          >
            <Icon path={mdiPin} size={0.6} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(note);
            }}
            className="p-2 rounded-full text-brand-deep-gray hover:text-brand-blue hover:bg-brand-blue/10 transition-all duration-200 hover:scale-110"
            title="Edit"
          >
            <Icon path={mdiPencil} size={0.6} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-2 rounded-full text-brand-deep-gray hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
            title="Delete"
          >
            <Icon path={mdiDelete} size={0.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
