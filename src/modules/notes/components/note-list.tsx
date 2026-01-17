// src/modules/notes/components/note-list.tsx
"use client";

import Icon from "@mdi/react";
import { mdiFileDocument } from "@mdi/js";
import { NoteItem } from './note-item';
import type { Note } from '../types';

interface NoteListProps {
  notes: Note[];
  onTogglePin: (id: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteList({ notes, onTogglePin, onEdit, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon path={mdiFileDocument} size={2} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No notes yet</p>
        <p className="text-sm">Create a note to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onTogglePin={onTogglePin}
          onClick={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
