// src/modules/tasks/components/task-item.tsx
"use client";

import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { useTranslations } from 'next-intl';
import Icon from "@mdi/react";
import { mdiCheck, mdiDelete, mdiPencil } from "@mdi/js";
import { cn } from '@/lib/utils';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function TaskItem({ task, onToggle, onClick, onDelete }: TaskItemProps) {
  const t = useTranslations('todos');
  const dueLabel = formatDueDate(task.due_date);
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.is_completed;

  const priorityLabels = {
    low: t('priority.low'),
    medium: t('priority.medium'),
    high: t('priority.high'),
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "bg-white/50 dark:bg-brand-black/20",
        "hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10",
        "border border-transparent hover:border-brand-blue/20",
        task.is_completed && "opacity-60 bg-transparent"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
          task.is_completed
            ? "bg-brand-blue border-brand-blue text-white"
            : "border-brand-deep-gray/30 hover:border-brand-blue"
        )}
      >
        {task.is_completed && <Icon path={mdiCheck} size={0.6} />}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClick(task)}
      >
        <p
          className={cn(
            "font-semibold truncate text-brand-black dark:text-brand-white",
            task.is_completed && "line-through text-brand-deep-gray"
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-brand-deep-gray truncate">{task.description}</p>
        )}
      </div>

      {/* Priority Badge */}
      <span
        className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0",
          priorityColors[task.priority]
        )}
      >
        {priorityLabels[task.priority]}
      </span>

      {/* Due Date */}
      {dueLabel && (
        <span
          className={cn(
            "text-xs font-medium shrink-0",
            isOverdue ? "text-red-500" : "text-brand-deep-gray"
          )}
        >
          {dueLabel}
        </span>
      )}

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onClick(task)}
          className="p-2 text-brand-deep-gray hover:text-brand-blue hover:bg-brand-blue/10 rounded-full transition-colors"
        >
          <Icon path={mdiPencil} size={0.67} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-brand-deep-gray hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <Icon path={mdiDelete} size={0.67} />
        </button>
      </div>
    </div>
  );
}
