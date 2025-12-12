import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { DateTime } from 'luxon';
import { TimeEntryItem, IconButtonStyled } from '@/components';
import { type TimeTrackingDto } from '@/api/services/TimeTrackingService';
import { useCreateTimeTrackingMutation, useDeleteTimeTrackingMutation, useDeleteMultipleTimeTrackingsMutation } from '@/api/hooks/useTimeTracking';
import { v4 as uuid } from 'uuid';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Draft entry type for unsaved new entries
interface DraftEntry {
  uuid: string;
  date: Date;
  start: string; // HH:mm format
  end: string;   // HH:mm format
  taskName: string;
}

interface TimeTrackedListProps {
  trackings: TimeTrackingDto[];
  date?: string;
  groupByDay?: boolean;
}

export const TimeTrackedList: React.FC<TimeTrackedListProps> = ({ trackings, groupByDay = false }) => {
  const createTimeTrackingMutation = useCreateTimeTrackingMutation();
  const deleteTimeTrackingMutation = useDeleteTimeTrackingMutation();
  const deleteMultipleTimeTrackingsMutation = useDeleteMultipleTimeTrackingsMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    start: string;
    end: string;
    taskName: string;
  }>({ start: '', end: '', taskName: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Draft entry state for new unsaved entries
  const [draftEntry, setDraftEntry] = useState<DraftEntry | null>(null);
  const [draftValidationError, setDraftValidationError] = useState<string | null>(null);

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Collapsed days state (stores day keys that are collapsed)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const toggleDayCollapse = (dayKey: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  // Sort by start time descending (most recent first), with running entries (no end time) at the top
  const sorted = [...trackings].sort((a, b) => {
    // Running entries (no end time) should appear first
    if (!a.end && b.end) return -1;
    if (a.end && !b.end) return 1;
    // Then sort by start time descending
    return b.start > a.start ? 1 : -1;
  });

  // Group trackings by day
  const groupedByDay = React.useMemo(() => {
    if (!groupByDay) return null;

    const groups: Record<string, TimeTrackingDto[]> = {};
    sorted.forEach(tracking => {
      const dayKey = DateTime.fromISO(tracking.start).toISODate() ?? '';
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(tracking);
    });

    // Sort days in descending order (most recent first)
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [sorted, groupByDay]);

  // Calculate total duration for a day
  const calculateDayTotal = (dayTrackings: TimeTrackingDto[]) => {
    const totalMinutes = dayTrackings.reduce((total, tracking) => {
      if (!tracking.end) return total;
      const start = DateTime.fromISO(tracking.start);
      const end = DateTime.fromISO(tracking.end);
      return total + end.diff(start, 'minutes').minutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  // Format day header
  const formatDayHeader = (isoDate: string) => {
    const dt = DateTime.fromISO(isoDate);
    const today = DateTime.now();

    if (dt.hasSame(today, 'day')) {
      return `Today (${dt.toFormat('EEEE, MMM dd')})`;
    }
    /*else if (dt.hasSame(yesterday, 'day')) {
      return 'Yesterday';
    }*/
    return dt.toFormat('EEEE, MMM dd');
  };

  const formatTimeForInput = (isoString: string) => {
    return DateTime.fromISO(isoString).toFormat('HH:mm');
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return '--:--';
    const startDt = DateTime.fromISO(start);
    const endDt = DateTime.fromISO(end);
    const diff = endDt.diff(startDt, ['hours', 'minutes']);
    const hours = Math.floor(diff.hours);
    const minutes = Math.floor(diff.minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleEdit = (tracking: TimeTrackingDto) => {
    // Exit multi-select mode when editing
    if (isMultiSelectMode) {
      exitMultiSelectMode();
    }

    setEditingId(tracking.uuid);
    setValidationError(null);
    setEditingValues({
      start: formatTimeForInput(tracking.start),
      end: tracking.end ? formatTimeForInput(tracking.end) : '',
      taskName: tracking.task?.name || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setValidationError(null);
  };

  const handleSaveEdit = async (tracking: TimeTrackingDto) => {
    // Validate that end time is provided
    if (!editingValues.end) {
      setValidationError('End time is required');
      return;
    }

    // Validate that start time < end time
    if (editingValues.start >= editingValues.end) {
      setValidationError('Start time must be before end time');
      return;
    }

    setValidationError(null);

    try {
      const baseDate = DateTime.fromISO(tracking.start).toISODate();
      const startDateTime = DateTime.fromISO(`${baseDate}T${editingValues.start}`);
      const endDateTime = DateTime.fromISO(`${baseDate}T${editingValues.end}`);

      const request = {
        uuid: tracking.uuid,
        start: startDateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"),
        end: endDateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"),
        task: {
          name: editingValues.taskName.trim() || 'Untitled Task'
        }
      };

      createTimeTrackingMutation.mutate(request, {
        onSuccess: () => {
          setEditingId(null);
        }
      });
    } catch (error) {
      console.error('Failed to update time tracking:', error);
    }
  };

  const handleDelete = (uuid: string) => {
    setDeleteTargetId(uuid);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteTimeTrackingMutation.mutate(deleteTargetId);
    }
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleAddNew = () => {
    // Exit multi-select mode and cancel any editing
    if (isMultiSelectMode) {
      exitMultiSelectMode();
    }
    if (editingId) {
      setEditingId(null);
    }

    // Create a draft entry with default values (today, current hour rounded)
    const now = DateTime.now().set({ second: 0, millisecond: 0 });
    const roundedStart = now.set({ minute: 0 });
    const roundedEnd = roundedStart.plus({ hour: 1 });

    setDraftEntry({
      uuid: uuid(),
      date: now.toJSDate(),
      start: roundedStart.toFormat('HH:mm'),
      end: roundedEnd.toFormat('HH:mm'),
      taskName: '',
    });
    setDraftValidationError(null);
  };

  const handleSaveDraft = () => {
    if (!draftEntry) return;

    // Validate that end time is provided
    if (!draftEntry.end) {
      setDraftValidationError('End time is required');
      return;
    }

    // Validate that start time < end time
    if (draftEntry.start >= draftEntry.end) {
      setDraftValidationError('Start time must be before end time');
      return;
    }

    setDraftValidationError(null);

    // Build the request with the selected date and times
    const baseDate = DateTime.fromJSDate(draftEntry.date).toISODate();
    const startDateTime = DateTime.fromISO(`${baseDate}T${draftEntry.start}`);
    const endDateTime = DateTime.fromISO(`${baseDate}T${draftEntry.end}`);

    const formatForBackend = (dt: DateTime) => dt.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");

    const request = {
      uuid: draftEntry.uuid,
      start: formatForBackend(startDateTime),
      end: formatForBackend(endDateTime),
      task: {
        name: draftEntry.taskName.trim() || 'Untitled Task'
      }
    };

    createTimeTrackingMutation.mutate(request, {
      onSuccess: () => {
        setDraftEntry(null);
        setDraftValidationError(null);
      }
    });
  };

  const handleCancelDraft = () => {
    setDraftEntry(null);
    setDraftValidationError(null);
  };

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(t => t.uuid)));
    }
  };

  const toggleSelectItem = (uuid: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteDialogOpen(false);
    setIsBulkDeleting(true);

    try {
      await deleteMultipleTimeTrackingsMutation.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedIds(new Set());
  };

  // Render a single time entry row
  const renderTimeEntry = (tracking: TimeTrackingDto) => (
    <TimeEntryItem key={tracking.uuid}>
      {/* Multi-select checkbox */}
      {isMultiSelectMode && (
        <input
          type="checkbox"
          checked={selectedIds.has(tracking.uuid)}
          onChange={() => toggleSelectItem(tracking.uuid)}
          style={{
            marginRight: '0.75rem',
            width: '1rem',
            height: '1rem',
            cursor: 'pointer'
          }}
        />
      )}

      {editingId === tracking.uuid ? (
        <div className="flex flex-col w-full gap-1">
          <div className="flex items-center w-full">
            <TimePicker
              value={editingValues.start}
              onChange={(value) => {
                setEditingValues(prev => ({ ...prev, start: value }));
                setValidationError(null);
              }}
            />
            <span className="mx-2 text-gray-400">-</span>
            <TimePicker
              value={editingValues.end}
              onChange={(value) => {
                setEditingValues(prev => ({ ...prev, end: value }));
                setValidationError(null);
              }}
            />
            <input
              type="text"
              value={editingValues.taskName}
              onChange={(e) => setEditingValues(prev => ({ ...prev, taskName: e.target.value }))}
              placeholder="Task description"
              className="flex-1 ml-4 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <IconButtonStyled
              onClick={() => handleSaveEdit(tracking)}
              style={{ color: '#10b981' }}
            >
              <Check size={18} />
            </IconButtonStyled>
            <IconButtonStyled
              onClick={handleCancelEdit}
              style={{ color: '#ef4444' }}
            >
              <X size={18} />
            </IconButtonStyled>
          </div>
          {validationError && (
            <span className="text-xs text-red-500 dark:text-red-400 ml-1">
              {validationError}
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Time range: fixed width for alignment */}
          <span style={{
            fontFamily: 'Inria Sans, monospace',
            fontSize: '0.875rem',
            color: '#6b7280',
            width: '3rem',
            textAlign: 'right'
          }}>
            {formatTimeForInput(tracking.start)}
          </span>
          <span style={{ margin: '0 0.25rem', color: '#9ca3af' }}>-</span>
          <span style={{
            fontFamily: 'Inria Sans, monospace',
            fontSize: '0.875rem',
            color: tracking.end ? '#6b7280' : '#ef4444',
            width: '3.5rem'
          }}>
            {tracking.end ? formatTimeForInput(tracking.end) : 'Running'}
          </span>
          {/* Duration: fixed width */}
          <span style={{
            width: '4rem',
            marginLeft: '0.75rem',
            padding: '0.25rem 0.5rem',
            background: '#f3f4f6',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'center'
          }}>
            {calculateDuration(tracking.start, tracking.end)}
          </span>
          {/* Description: flex to fill remaining space */}
          <span style={{
            flex: 1,
            marginLeft: '1rem',
            fontSize: '0.875rem',
            color: '#4b5563',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {tracking.task?.name || 'No description'}
          </span>
          {!isMultiSelectMode && (
            <>
              <IconButtonStyled
                onClick={() => handleEdit(tracking)}
                style={{ opacity: 0.7 }}
              >
                <Edit2 size={16} />
              </IconButtonStyled>
              <IconButtonStyled
                onClick={() => handleDelete(tracking.uuid)}
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={16} />
              </IconButtonStyled>
            </>
          )}
        </>
      )}
    </TimeEntryItem>
  );

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
          Time Entries
        </h3>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '200px', justifyContent: 'flex-end', height: '36px' }}>
          {!isMultiSelectMode ? (
            <>
              <button
                onClick={handleAddNew}
                disabled={draftEntry !== null}
                className="px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded cursor-pointer text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
              <button
                onClick={() => setIsMultiSelectMode(true)}
                disabled={editingId !== null || draftEntry !== null}
                className="px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded cursor-pointer text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded cursor-pointer text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                style={{ minWidth: '80px' }}
              >
                {selectedIds.size === sorted.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isBulkDeleting}
                className="px-3 py-1.5 text-sm bg-transparent border border-red-300 dark:border-red-600 rounded cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ minWidth: '60px' }}
              >
                <Trash2 size={16} />
                <span style={{ minWidth: '1.5rem', textAlign: 'left' }}>
                  {isBulkDeleting ? '...' : selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </span>
              </button>
              <button
                onClick={exitMultiSelectMode}
                className="p-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded cursor-pointer text-gray-700 dark:text-gray-300 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Draft Entry - Always displayed at the top when present */}
      {draftEntry && (
        <div className="mb-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2">
                <Plus size={16} />
                New Entry (Unsaved)
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {/* First row: Date picker */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                <DatePicker
                  value={draftEntry.date}
                  onChange={(date) => {
                    if (date) {
                      setDraftEntry(prev => prev ? { ...prev, date } : null);
                      setDraftValidationError(null);
                    }
                  }}
                  className="h-9"
                />
              </div>
              {/* Second row: Time pickers and task name */}
              <div className="flex items-center gap-2">
                <TimePicker
                  value={draftEntry.start}
                  onChange={(value) => {
                    setDraftEntry(prev => prev ? { ...prev, start: value } : null);
                    setDraftValidationError(null);
                  }}
                />
                <span className="text-gray-400">-</span>
                <TimePicker
                  value={draftEntry.end}
                  onChange={(value) => {
                    setDraftEntry(prev => prev ? { ...prev, end: value } : null);
                    setDraftValidationError(null);
                  }}
                />
                <input
                  type="text"
                  value={draftEntry.taskName}
                  onChange={(e) => setDraftEntry(prev => prev ? { ...prev, taskName: e.target.value } : null)}
                  placeholder="Task description"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <IconButtonStyled
                  onClick={handleSaveDraft}
                  style={{ color: '#10b981' }}
                  disabled={createTimeTrackingMutation.isPending}
                >
                  {createTimeTrackingMutation.isPending ? (
                    <span className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
                  ) : (
                    <Check size={18} />
                  )}
                </IconButtonStyled>
                <IconButtonStyled
                  onClick={handleCancelDraft}
                  style={{ color: '#ef4444' }}
                >
                  <X size={18} />
                </IconButtonStyled>
              </div>
              {draftValidationError && (
                <span className="text-xs text-red-500 dark:text-red-400">
                  {draftValidationError}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grouped by day view */}
      {groupByDay && groupedByDay ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedByDay.map(([dayKey, dayTrackings]) => {
            const isCollapsed = collapsedDays.has(dayKey);
            return (
              <div key={dayKey}>
                {/* Day header - clickable to collapse */}
                <button
                  onClick={() => toggleDayCollapse(dayKey)}
                  className="w-full flex items-center justify-between py-2 px-1 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatDayHeader(dayKey)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {calculateDayTotal(dayTrackings)} • {dayTrackings.length} {dayTrackings.length === 1 ? 'entry' : 'entries'}
                  </span>
                </button>
                {/* Day entries - collapsible */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {dayTrackings.map(renderTimeEntry)}
                  </div>
                )}
              </div>
            );
          })}
          {groupedByDay.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No time entries for this period
            </p>
          )}
        </div>
      ) : (
        /* Flat list view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sorted.map(renderTimeEntry)}
          {sorted.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No time entries for this day
            </p>
          )}
        </div>
      )}

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="!bg-red-500 hover:!bg-red-500/90 !text-white !border-none !shadow-none !ring-0 focus:!ring-red-500/50 hover:!shadow-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Time {selectedIds.size === 1 ? 'Entry' : 'Entries'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} time {selectedIds.size === 1 ? 'entry' : 'entries'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="!bg-red-500 hover:!bg-red-500/90 !text-white !border-none !shadow-none !ring-0 focus:!ring-red-500/50 hover:!shadow-none"
            >
              Delete {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};