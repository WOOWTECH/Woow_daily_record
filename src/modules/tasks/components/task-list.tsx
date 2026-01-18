// src/modules/tasks/components/task-list.tsx
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Icon from "@mdi/react";
import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
import { TaskItem } from './task-item';
import type { Task } from '../types';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/core/components/glass-card';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  const t = useTranslations('todos');
  const [showCompleted, setShowCompleted] = useState(true);

  const activeTasks = tasks.filter((task) => !task.is_completed);
  const completedTasks = tasks.filter((task) => task.is_completed);

  return (
    <GlassCard className="p-4 min-h-[500px]">
      {/* Active Tasks */}
      <div className="space-y-2">
        {activeTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onClick={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Empty State */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-brand-deep-gray/70">
          <p className="text-lg font-medium">{t('noTasks')}</p>
          <p className="text-sm">{t('addFirstTask')}</p>
        </div>
      )}

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-brand-gray dark:border-white/10">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-brand-deep-gray hover:text-brand-blue transition-colors mb-4"
          >
            {showCompleted ? <Icon path={mdiChevronUp} size={0.67} /> : <Icon path={mdiChevronDown} size={0.67} />}
            {t('filters.completed')} ({completedTasks.length})
          </button>

          {showCompleted && (
            <div className="space-y-2 opacity-75">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onClick={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
