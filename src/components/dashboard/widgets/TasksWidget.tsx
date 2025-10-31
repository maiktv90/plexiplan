import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Check, X, RotateCcw } from 'lucide-react';
import type { Task } from '@/types';

export const TasksWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('plexify_tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing saved tasks:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save tasks to localStorage whenever tasks change
    localStorage.setItem('plexify_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'todo' : 'completed', updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-amber-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-gray-400" />
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {activeTasks.length}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No tasks yet. Add your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 ${getPriorityColor(task.priority)} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {task.title}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                  title="Mark as complete"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete task"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 ${getPriorityColor(task.priority)} opacity-60`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through truncate">
                  {task.title}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Mark as incomplete"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete task"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingTask ? (
        <form onSubmit={addTask} className="flex gap-2 mt-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingTask(false);
              setNewTaskTitle('');
            }}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors text-sm"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      )}
    </div>
  );
};