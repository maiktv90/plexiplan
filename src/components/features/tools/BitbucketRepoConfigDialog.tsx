import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Check, Lock, Globe } from 'lucide-react';
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
import { BitbucketService, type BitbucketRepo } from '@/providers/tools/bitbucket/BitbucketService';

interface BitbucketRepoConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedRepoIds: string[]) => Promise<void>;
  initialSelectedIds?: string[];
}

export const BitbucketRepoConfigDialog: React.FC<BitbucketRepoConfigDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSelectedIds = [],
}) => {
  const [repos, setRepos] = useState<BitbucketRepo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create repo ID from workspace and slug: "workspace/repo-slug"
  const getRepoId = (repo: BitbucketRepo): string => {
    return `${repo.workspace}/${repo.slug}`;
  };

  // Fetch repos when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchRepos();
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const fetchRepos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await BitbucketService.getRepos();
      if (result.success && result.data) {
        setRepos(result.data);
      } else {
        setError(result.error || 'Failed to fetch repositories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter repos by search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;
    const query = searchQuery.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.fullName?.toLowerCase().includes(query) ||
        repo.workspace?.toLowerCase().includes(query)
    );
  }, [repos, searchQuery]);

  const handleToggleRepo = (repoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredRepos.map((r) => getRepoId(r))));
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
            <ToolIcon icon="bitbucket" size="lg" />
            <AlertDialogTitle className="text-xl">
              Configure Bitbucket Repositories
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Select which repositories to display pull requests from.
              </p>

              {/* Search Input */}
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4 text-gray-400" />}
                fullWidth
                disabled={isLoading}
              />

              {/* Select All / Deselect All */}
              {!isLoading && repos.length > 0 && (
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
                    Loading repositories...
                  </p>
                </div>
              )}

              {/* Repository List */}
              {!isLoading && repos.length > 0 && (
                <ScrollArea className="h-64 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredRepos.map((repo) => {
                      const repoId = getRepoId(repo);
                      const isSelected = selectedIds.has(repoId);
                      return (
                        <button
                          key={repoId}
                          onClick={() => handleToggleRepo(repoId)}
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

                          {/* Private/Public Icon */}
                          <div className="flex-shrink-0">
                            {repo.isPrivate ? (
                              <Lock className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Globe className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Repo Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {repo.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                              {repo.workspace}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {filteredRepos.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No repositories found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Empty State */}
              {!isLoading && repos.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No repositories found in your Bitbucket account.
                </div>
              )}

              {/* Selection Count */}
              {!isLoading && repos.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedIds.size} of {repos.length} repositories selected
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
