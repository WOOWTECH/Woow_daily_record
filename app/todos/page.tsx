// app/todos/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { TaskList } from '@/modules/tasks/components/task-list';
import { TaskDialog } from '@/modules/tasks/components/task-dialog';
import { TaskFilters } from '@/modules/tasks/components/task-filters';
import { useTasksStore, useFilteredTasks } from '@/modules/tasks/store';
import { useCurrentSite, useSitesStore } from '@/core/stores/sites-store';
import type { Task } from '@/modules/tasks/types';

export default function TodosPage() {
  const t = useTranslations('todos');
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const currentSite = useCurrentSite();
  const { fetchSites, sites, isLoading: sitesLoading } = useSitesStore();
  const previousSiteIdRef = useRef<string | null>(null);

  const {
    isLoading,
    error,
    filter,
    setHouseholdId,
    reset,
    fetchTasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    setFilter,
  } = useTasksStore();

  const filteredTasks = useFilteredTasks();

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Initialize tasks when current site is available or changes
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
        fetchTasks(currentSite.id);
      }
    }
  }, [currentSite, sites, sitesLoading, setHouseholdId, reset, fetchTasks, router]);

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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">{t('title')}</h1>
          <p className="text-brand-deep-gray mt-1">{t('subtitle')}</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-brand-blue/20"
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
