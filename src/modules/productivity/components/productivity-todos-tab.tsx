// src/modules/productivity/components/productivity-todos-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { TaskList } from '@/modules/tasks/components/task-list';
import { TaskDialog } from '@/modules/tasks/components/task-dialog';
import { TaskFilters } from '@/modules/tasks/components/task-filters';
import { useTasksStore, useFilteredTasks } from '@/modules/tasks/store';
import type { Task } from '@/modules/tasks/types';

interface ProductivityTodosTabProps {
  householdId: string;
}

export function ProductivityTodosTab({ householdId }: ProductivityTodosTabProps) {
  const t = useTranslations('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    isLoading,
    error,
    filter,
    setHouseholdId,
    fetchTasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    setFilter,
  } = useTasksStore();

  const filteredTasks = useFilteredTasks();

  useEffect(() => {
    if (householdId) {
      setHouseholdId(householdId);
      fetchTasks();
    }
  }, [householdId, setHouseholdId, fetchTasks]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteTask(id);
      toast.success(t('toast.deleted'));
    }
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
          {t('addTask')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex justify-start">
        <TaskFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">{t('loading')}</div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onToggle={toggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={addTask}
        onUpdate={updateTask}
      />
    </div>
  );
}
