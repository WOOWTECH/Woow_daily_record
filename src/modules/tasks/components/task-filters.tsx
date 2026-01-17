// src/modules/tasks/components/task-filters.tsx
"use client";

import type { TaskFilter, Priority } from '../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  onChange: (filter: Partial<TaskFilter>) => void;
}

export function TaskFilters({ filter, onChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-2">
      <select
        value={filter.status}
        onChange={(e) => onChange({ status: e.target.value as TaskFilter['status'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">All Tasks</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={filter.priority}
        onChange={(e) => onChange({ priority: e.target.value as TaskFilter['priority'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
