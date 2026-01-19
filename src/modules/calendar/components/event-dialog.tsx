// src/modules/calendar/components/event-dialog.tsx
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
import { mdiDelete, mdiPlus } from "@mdi/js";
import { DEFAULT_CATEGORY_COLORS } from '../types';
import type { Event, NewEvent, EventOccurrence, Category } from '../types';
import { useCalendarStore } from '../store';
import { createEventCategory } from '@/app/actions/categories';
import { toast } from 'sonner';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventOccurrence | null;
  initialDate?: Date;
  onSave: (event: NewEvent) => void;
  onUpdate?: (id: string, updates: Partial<Event>) => void;
  onDelete?: (id: string) => void;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  initialDate,
  onSave,
  onUpdate,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const { categories, householdId, fetchCategories } = useCalendarStore();
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');

  const REMINDER_OPTIONS = [
    { value: 0, label: t('event.reminderAtTime') },
    { value: 15, label: t('event.reminder15min') },
    { value: 30, label: t('event.reminder30min') },
    { value: 60, label: t('event.reminder1hour') },
    { value: 1440, label: t('event.reminder1day') },
  ];

  const RECURRENCE_OPTIONS = [
    { value: '', label: t('event.noRepeat') },
    { value: 'FREQ=DAILY', label: t('event.daily') },
    { value: 'FREQ=WEEKLY', label: t('event.weekly') },
    { value: 'FREQ=MONTHLY', label: t('event.monthly') },
    { value: 'FREQ=YEARLY', label: t('event.yearly') },
  ];

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(event.occurrence_start, 'yyyy-MM-dd'));
      setStartTime(format(event.occurrence_start, 'HH:mm'));
      setEndDate(format(event.occurrence_end, 'yyyy-MM-dd'));
      setEndTime(format(event.occurrence_end, 'HH:mm'));
      setIsAllDay(event.is_all_day);
      setCategoryId(event.category_id);
      setRecurrenceRule(event.recurrence_rule || '');
      setReminderMinutes(event.reminder_minutes || []);
    } else {
      // Reset for new event - use first category as default
      const date = initialDate || new Date();
      setTitle('');
      setDescription('');
      setStartDate(format(date, 'yyyy-MM-dd'));
      setStartTime('09:00');
      setEndDate(format(date, 'yyyy-MM-dd'));
      setEndTime('10:00');
      setIsAllDay(false);
      setCategoryId(categories[0]?.id || null);
      setRecurrenceRule('');
      setReminderMinutes([]);
    }
  }, [event, initialDate, open, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endDateTime = isAllDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime}:00`;

    if (new Date(endDateTime) < new Date(startDateTime)) {
      toast.error(t('error.endBeforeStart'));
      return;
    }

    const eventData: NewEvent = {
      title: title.trim(),
      description,
      start_time: new Date(startDateTime).toISOString(),
      end_time: new Date(endDateTime).toISOString(),
      is_all_day: isAllDay,
      category_id: categoryId || undefined,
      recurrence_rule: recurrenceRule || undefined,
      reminder_minutes: reminderMinutes.length > 0 ? reminderMinutes : undefined,
    };

    if (isEditing && onUpdate) {
      onUpdate(event.original_event_id, eventData);
    } else {
      onSave(eventData);
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.original_event_id);
      onOpenChange(false);
    }
  };

  const toggleReminder = (minutes: number) => {
    if (reminderMinutes.includes(minutes)) {
      setReminderMinutes(reminderMinutes.filter((m) => m !== minutes));
    } else {
      setReminderMinutes([...reminderMinutes, minutes]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('event.edit') : t('event.new')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('event.title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              {t('event.allDay')}
            </Label>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('event.start')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!isAllDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('event.end')}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!isAllDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('event.category')}</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoryId === cat.id
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                    }`}
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                    ...(categoryId === cat.id && { ringColor: cat.color }),
                  }}
                >
                  {cat.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon path={mdiPlus} size={0.6} className="inline mr-1" />
                {t('event.addCategory')}
              </button>
            </div>
            {isAddingCategory && (
              <div className="mt-2 p-3 border rounded-lg space-y-2">
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${newCategoryColor === color ? 'scale-125 ring-2 ring-offset-2' : ''
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                      setNewCategoryColor('#3B82F6');
                    }}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!newCategoryName.trim() || !householdId) return;
                      try {
                        await createEventCategory(householdId, newCategoryName.trim(), newCategoryColor);
                        await fetchCategories();
                        toast.success(t('event.addCategory'));
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                        setNewCategoryColor('#3B82F6');
                      } catch (error) {
                        toast.error(t('error.initFailed'));
                      }
                    }}
                    disabled={!newCategoryName.trim()}
                    className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm"
                  >
                    {tCommon('add')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">{t('event.repeat')}</Label>
            <select
              id="recurrence"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reminders */}
          <div className="space-y-2">
            <Label>{t('event.reminders')}</Label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${reminderMinutes.includes(opt.value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('event.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Icon path={mdiDelete} size={0.67} className="mr-1" />
                {tCommon('delete')}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={!title.trim()} className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm">
                {isEditing ? t('event.save') : t('event.create')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
