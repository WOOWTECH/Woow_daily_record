// app/todos/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { TaskList } from '@/modules/tasks/components/task-list';
import { TaskDialog } from '@/modules/tasks/components/task-dialog';
import { TaskFilters } from '@/modules/tasks/components/task-filters';
import { useTasksStore, useFilteredTasks } from '@/modules/tasks/store';
import { getUserHousehold } from '@/core/lib/supabase/households';
import type { Task } from '@/modules/tasks/types';

export default function TodosPage() {
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
    async function init() {
      try {
        let household = await getUserHousehold();

        if (!household) {
          // Auto-create household if missing
          const { createHousehold } = await import('@/core/lib/supabase/households');
          household = await createHousehold('My Family');
        }

        if (household) {
          setHouseholdId(household.id);
          fetchTasks();
        } else {
          toast.error('Could not initialize workspace');
        }
      } catch (err) {
        console.error('[Tasks] Error initializing:', err);
      }
    }
    init();
  }, [setHouseholdId, fetchTasks]);

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
    if (confirm('Delete this task?')) {
      deleteTask(id);
      toast.success('Task deleted');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Tasks</h1>
          <p className="text-brand-deep-gray mt-1">Manage your daily to-dos</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-brand-blue/20"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex justify-start">
        <TaskFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
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
