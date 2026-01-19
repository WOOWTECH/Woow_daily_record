// src/modules/productivity/components/productivity-notes-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { NoteList } from '@/modules/notes/components/note-list';
import { NoteDialog } from '@/modules/notes/components/note-dialog';
import { NoteFilters } from '@/modules/notes/components/note-filters';
import { useNotesStore, useFilteredNotes } from '@/modules/notes/store';
import type { Note } from '@/modules/notes/types';

interface ProductivityNotesTabProps {
  householdId: string;
}

export function ProductivityNotesTab({ householdId }: ProductivityNotesTabProps) {
  const t = useTranslations('notes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const {
    isLoading,
    error,
    filter,
    setHouseholdId,
    fetchNotes,
    addNote,
    updateNote,
    togglePin,
    deleteNote,
    setFilter,
  } = useNotesStore();

  const filteredNotes = useFilteredNotes();

  useEffect(() => {
    if (householdId) {
      setHouseholdId(householdId);
      fetchNotes();
    }
  }, [householdId, setHouseholdId, fetchNotes]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingNote(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    toast.success(t('toast.deleted'));
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t('title')}
        </h2>
        <Button
          onClick={handleAdd}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          {t('newNote')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex justify-start">
        <NoteFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-brand-deep-gray animate-pulse">{t('loading')}</div>
      ) : (
        <NoteList
          notes={filteredNotes}
          onTogglePin={togglePin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Dialog */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={editingNote}
        onSave={addNote}
        onUpdate={updateNote}
      />
    </div>
  );
}
