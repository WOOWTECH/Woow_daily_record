// app/notes/page.tsx
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
import { GlassCard } from '@/core/components/glass-card';
import { useNotesStore, useFilteredNotes } from '@/modules/notes/store';
import { getUserHousehold, createHousehold } from '@/core/lib/supabase/households';
import type { Note } from '@/modules/notes/types';

export default function NotesPage() {
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
    async function init() {
      try {
        let household = await getUserHousehold();

        if (!household) {
          household = await createHousehold('My Family');
        }

        if (household) {
          setHouseholdId(household.id);
          fetchNotes();
        } else {
          toast.error('Could not initialize workspace');
        }
      } catch (err) {
        console.error('[Notes] Error initializing:', err);
      }
    }
    init();
  }, [setHouseholdId, fetchNotes]);

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
    // TODO: Add proper confirmation dialog
    deleteNote(id);
    toast.success(t('toast.deleted'));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <GlassCard className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">{t('title')}</h1>
          <p className="text-brand-deep-gray mt-1">{t('subtitle')}</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-105"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          {t('newNote')}
        </Button>
      </GlassCard>

      {/* Filters */}
      <div className="flex justify-start">
        <NoteFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-brand-deep-gray animate-pulse">{t('loading')}</div>
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
