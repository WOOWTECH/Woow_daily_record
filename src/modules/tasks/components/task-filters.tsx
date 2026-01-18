// src/modules/tasks/components/task-filters.tsx
"use client";

import { useTranslations } from 'next-intl';
import type { TaskFilter, Priority } from '../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  onChange: (filter: Partial<TaskFilter>) => void;
}

export function TaskFilters({ filter, onChange }: TaskFiltersProps) {
  const t = useTranslations('todos');

  return (
    <div className="flex gap-2">
      <select
        value={filter.status}
        onChange={(e) => onChange({ status: e.target.value as TaskFilter['status'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">{t('filters.all')}</option>
        <option value="active">{t('filters.active')}</option>
        <option value="completed">{t('filters.completed')}</option>
      </select>

      <select
        value={filter.priority}
        onChange={(e) => onChange({ priority: e.target.value as TaskFilter['priority'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">{t('priority.all')}</option>
        <option value="high">{t('priority.high')}</option>
        <option value="medium">{t('priority.medium')}</option>
        <option value="low">{t('priority.low')}</option>
      </select>
    </div>
  );
}
