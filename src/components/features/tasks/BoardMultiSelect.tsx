/**
 * Board Multi-Select Component
 *
 * A dropdown component that allows selecting multiple boards,
 * grouped by their source tool (Trello, Jira, GitHub, etc.)
 */
import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/Button';
import { getTaskSourceColor } from '@/api/hooks/useUnifiedTasks';
import type { UnifiedBoard, TaskSource } from '@/types/task.types';

interface BoardMultiSelectProps {
  boards: UnifiedBoard[];
  selectedBoardIds: string[];
  onSelectionChange: (boardIds: string[]) => void;
  /** Optional: task counts per board for display */
  taskCountByBoard?: Map<string, number>;
  className?: string;
}

/** Group boards by their source tool */
function groupBoardsBySource(boards: UnifiedBoard[]): Map<TaskSource, UnifiedBoard[]> {
  const grouped = new Map<TaskSource, UnifiedBoard[]>();

  for (const board of boards) {
    const existing = grouped.get(board.source) || [];
    existing.push(board);
    grouped.set(board.source, existing);
  }

  return grouped;
}

/** Get display name for source */
function getSourceDisplayName(source: TaskSource): string {
  switch (source) {
    case 'trello':
      return 'Trello';
    case 'jira':
      return 'Jira';
    case 'github':
      return 'GitHub';
    case 'bitbucket':
      return 'Bitbucket';
    default:
      return source.charAt(0).toUpperCase() + source.slice(1);
  }
}

export const BoardMultiSelect: React.FC<BoardMultiSelectProps> = ({
  boards,
  selectedBoardIds,
  onSelectionChange,
  taskCountByBoard,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group boards by source
  const groupedBoards = useMemo(() => groupBoardsBySource(boards), [boards]);

  // Get sorted sources for consistent ordering
  const sortedSources = useMemo(() => {
    const sourceOrder: TaskSource[] = ['jira', 'trello', 'github', 'bitbucket'];
    return Array.from(groupedBoards.keys()).sort((a, b) => {
      const aIndex = sourceOrder.indexOf(a);
      const bIndex = sourceOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }, [groupedBoards]);

  // Track selection state
  // Special marker '__none__' means explicitly no boards selected
  const isNoneSelected = selectedBoardIds.length === 1 && selectedBoardIds[0] === '__none__';
  const isAllSelected = selectedBoardIds.length === 0; // Empty selection means "all"
  const selectedSet = useMemo(
    () => new Set(isNoneSelected ? [] : selectedBoardIds),
    [selectedBoardIds, isNoneSelected]
  );

  // Toggle a single board
  const handleToggleBoard = (boardId: string) => {
    if (isAllSelected) {
      // If "all" is selected, select all except this one
      const allExceptThis = boards.map((b) => b.id).filter((id) => id !== boardId);
      onSelectionChange(allExceptThis.length > 0 ? allExceptThis : ['__none__']);
    } else if (isNoneSelected) {
      // If none selected, select just this board
      onSelectionChange([boardId]);
    } else if (selectedSet.has(boardId)) {
      // Remove this board from selection
      const newSelection = selectedBoardIds.filter((id) => id !== boardId);
      // If no boards left, use __none__ marker
      onSelectionChange(newSelection.length > 0 ? newSelection : ['__none__']);
    } else {
      // Add this board to selection
      onSelectionChange([...selectedBoardIds, boardId]);
    }
  };

  // Toggle all boards for a source
  const handleToggleSource = (source: TaskSource) => {
    const sourceBoards = groupedBoards.get(source) || [];
    const sourceBoardIds = sourceBoards.map((b) => b.id);

    if (isAllSelected) {
      // If "all" is selected, deselect this source (select all others)
      const allOtherBoards = boards.filter((b) => b.source !== source).map((b) => b.id);
      onSelectionChange(allOtherBoards.length > 0 ? allOtherBoards : ['__none__']);
    } else if (isNoneSelected) {
      // If none selected, select this source's boards
      onSelectionChange(sourceBoardIds);
    } else {
      // Check if all boards of this source are selected
      const allSourceSelected = sourceBoardIds.every((id) => selectedSet.has(id));

      if (allSourceSelected) {
        // Deselect all boards of this source
        const newSelection = selectedBoardIds.filter((id) => !sourceBoardIds.includes(id));
        onSelectionChange(newSelection.length > 0 ? newSelection : ['__none__']);
      } else {
        // Select all boards of this source (add missing ones)
        const newSelection = [...selectedBoardIds];
        for (const id of sourceBoardIds) {
          if (!selectedSet.has(id)) {
            newSelection.push(id);
          }
        }
        onSelectionChange(newSelection);
      }
    }
  };

  // Toggle all boards
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Currently all selected -> deselect all (use special marker)
      onSelectionChange(['__none__']);
    } else {
      // Select all (empty array = all)
      onSelectionChange([]);
    }
  };

  // Check if all boards of a source are selected
  const isSourceFullySelected = (source: TaskSource): boolean => {
    if (isAllSelected) return true;
    if (isNoneSelected) return false;
    const sourceBoards = groupedBoards.get(source) || [];
    return sourceBoards.every((b) => selectedSet.has(b.id));
  };

  // Check if some (but not all) boards of a source are selected
  const isSourcePartiallySelected = (source: TaskSource): boolean => {
    if (isAllSelected || isNoneSelected) return false;
    const sourceBoards = groupedBoards.get(source) || [];
    const selectedCount = sourceBoards.filter((b) => selectedSet.has(b.id)).length;
    return selectedCount > 0 && selectedCount < sourceBoards.length;
  };

  // Get display text for trigger button
  const triggerText = useMemo(() => {
    if (isAllSelected) {
      return 'All Boards';
    }
    if (isNoneSelected) {
      return 'No Boards';
    }
    if (selectedBoardIds.length === 1) {
      const board = boards.find((b) => b.id === selectedBoardIds[0]);
      return board?.name || '1 Board';
    }
    return `${selectedBoardIds.length} Boards`;
  }, [isAllSelected, isNoneSelected, selectedBoardIds, boards]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[180px] ${className || ''}`}
        >
          <span className="truncate">{triggerText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b border-border">
          <button
            onClick={handleSelectAll}
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors
              ${isAllSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-muted'}
            `}
          >
            <div
              className={`
                w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${isAllSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'}
              `}
            >
              {isAllSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="font-medium">All Boards</span>
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          <div className="p-2 space-y-3">
            {sortedSources.map((source) => {
              const sourceBoards = groupedBoards.get(source) || [];
              const sourceColor = getTaskSourceColor(source);
              const isFullySelected = isSourceFullySelected(source);
              const isPartiallySelected = isSourcePartiallySelected(source);

              return (
                <div key={source}>
                  {/* Source Group Header */}
                  <button
                    onClick={() => handleToggleSource(source)}
                    className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-muted rounded-md transition-colors"
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${isFullySelected
                          ? 'bg-primary-500 border-primary-500'
                          : isPartiallySelected
                            ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }
                      `}
                    >
                      {isFullySelected && <Check className="h-3 w-3 text-white" />}
                      {isPartiallySelected && (
                        <div className="w-2 h-2 bg-primary-500 rounded-sm" />
                      )}
                    </div>
                    <span
                      className="px-1.5 py-0.5 text-xs font-medium rounded text-white"
                      style={{ backgroundColor: sourceColor }}
                    >
                      {getSourceDisplayName(source)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({sourceBoards.length})
                    </span>
                  </button>

                  {/* Board Items */}
                  <div className="ml-4 mt-1 space-y-0.5">
                    {sourceBoards.map((board) => {
                      const isSelected = isAllSelected || selectedSet.has(board.id);
                      const taskCount = taskCountByBoard?.get(board.id);

                      return (
                        <button
                          key={board.id}
                          onClick={() => handleToggleBoard(board.id)}
                          className={`
                            w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors
                            ${isSelected && !isAllSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-muted'
                            }
                          `}
                        >
                          <div
                            className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                              ${isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-gray-300 dark:border-gray-600'
                              }
                            `}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="truncate flex-1">{board.name}</span>
                          {taskCount !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {taskCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {boards.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No boards available
              </div>
            )}
          </div>
        </div>

        {/* Footer with clear selection */}
        {!isAllSelected && selectedBoardIds.length > 0 && (
          <div className="p-2 border-t border-border">
            <button
              onClick={handleSelectAll}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
