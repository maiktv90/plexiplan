import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolIcon } from './ToolIcon';
import { JiraService, type JiraProject } from '@/providers/tools/jira/JiraService';

interface JiraProjectConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedProjectIds: string[]) => Promise<void>;
  initialSelectedIds?: string[];
}

export const JiraProjectConfigDialog: React.FC<JiraProjectConfigDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSelectedIds = [],
}) => {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await JiraService.getProjects();
      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.key.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleToggleProject = (projectId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(Array.from(selectedIds));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setSearchQuery('');
      setError(null);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-lg bg-white dark:bg-gray-800">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ToolIcon icon="jira" size="lg" />
            <AlertDialogTitle className="text-xl">
              Configure Jira Projects
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Select which projects to display in your planner.
              </p>

              {/* Search Input */}
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4 text-gray-400" />}
                fullWidth
                disabled={isLoading}
              />

              {/* Select All / Deselect All */}
              {!isLoading && projects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isSaving}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isSaving}
                  >
                    Deselect All
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading projects...
                  </p>
                </div>
              )}

              {/* Project List */}
              {!isLoading && projects.length > 0 && (
                <ScrollArea className="h-64 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredProjects.map((project) => {
                      const isSelected = selectedIds.has(project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleToggleProject(project.id)}
                          disabled={isSaving}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                            ${isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                            }
                            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {/* Checkbox */}
                          <div
                            className={`
                              w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                              ${isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-gray-300 dark:border-gray-600'
                              }
                            `}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>

                          {/* Avatar */}
                          {project.avatarUrl ? (
                            <img
                              src={project.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                          )}

                          {/* Project Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {project.key}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                                {project.name}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {filteredProjects.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No projects found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Empty State */}
              {!isLoading && projects.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No projects found in your Jira account.
                </div>
              )}

              {/* Selection Count */}
              {!isLoading && projects.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedIds.size} of {projects.length} projects selected
                </p>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
