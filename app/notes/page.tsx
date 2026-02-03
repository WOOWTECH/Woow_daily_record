// app/notes/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { NoteList } from '@/modules/notes/components/note-list';
import { NoteDialog } from '@/modules/notes/components/note-dialog';
import { NoteFilters } from '@/modules/notes/components/note-filters';
import { GlassCard } from '@/core/components/glass-card';
import { useNotesStore, useFilteredNotes } from '@/modules/notes/store';
import { useCurrentSite, useSitesStore } from '@/core/stores/sites-store';
import type { Note } from '@/modules/notes/types';

export default function NotesPage() {
  const t = useTranslations('notes');
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const currentSite = useCurrentSite();
  const { fetchSites, sites, isLoading: sitesLoading } = useSitesStore();
  const previousSiteIdRef = useRef<string | null>(null);

  const {
    isLoading,
    error,
    filter,
    setHouseholdId,
    reset,
    fetchNotes,
    addNote,
    updateNote,
    togglePin,
    deleteNote,
    setFilter,
  } = useNotesStore();

  const filteredNotes = useFilteredNotes();

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Initialize notes when current site is available or changes
  useEffect(() => {
    if (sitesLoading) return;

    // If no sites exist, redirect to onboarding
    if (sites.length === 0) {
      router.push('/onboarding');
      return;
    }

    if (currentSite) {
      // Only reload data if site actually changed
      if (previousSiteIdRef.current !== currentSite.id) {
        // Reset old data first
        if (previousSiteIdRef.current !== null) {
          reset();
        }
        previousSiteIdRef.current = currentSite.id;

        // Set new household ID and fetch with the new ID directly
        setHouseholdId(currentSite.id);
        fetchNotes(currentSite.id);
      }
    }
  }, [currentSite, sites, sitesLoading, setHouseholdId, reset, fetchNotes, router]);

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
