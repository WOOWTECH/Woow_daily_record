// src/modules/notes/components/note-dialog.tsx
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import Icon from "@mdi/react";
import { mdiPin } from "@mdi/js";
import { cn } from '@/lib/utils';
import type { Note, NewNote } from '../types';

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
  onSave: (note: NewNote) => void;
  onUpdate?: (id: string, updates: Partial<Note>) => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSave,
  onUpdate,
}: NoteDialogProps) {
  const t = useTranslations('notes');
  const tCommon = useTranslations('common');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const isEditing = !!note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setIsPinned(note.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
    }
  }, [note, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && onUpdate) {
      onUpdate(note.id, {
        title: title.trim(),
        content: content,
        is_pinned: isPinned,
      });
    } else {
      onSave({
        title: title.trim(),
        content: content,
        is_pinned: isPinned,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? t('editNote') : t('newNote')}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "p-1.5 rounded-lg transition-colors ml-auto",
                isPinned
                  ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={isPinned ? t('form.unpin') : t('form.pin')}
            >
              <Icon path={mdiPin} size={0.67} className={isPinned ? "fill-yellow-500" : ""} />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('form.title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              {t('form.content')}
              <span className="text-xs text-gray-400 ml-2">{t('form.markdownSupported')}</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('form.contentPlaceholder')}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? tCommon('save') : t('createNote')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
