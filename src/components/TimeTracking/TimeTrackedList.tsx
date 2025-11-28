import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { TimeEntryItem, IconButtonStyled, ButtonWrapper } from './styles.tracking';
import { TimeTrackingService, TimeTrackingDto } from '@/api/services/TimeTrackingService';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { v4 as uuid } from 'uuid';

interface TimeTrackedListProps {
  trackings: TimeTrackingDto[];
  date?: string;
}

export const TimeTrackedList: React.FC<TimeTrackedListProps> = ({ trackings, date }) => {
  const { refreshTimeTrackings } = useBackendTimeTrackingStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    start: string;
    end: string;
    taskName: string;
  }>({ start: '', end: '', taskName: '' });

  const sorted = [...trackings].sort((a, b) => (a.start > b.start ? 1 : -1));

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
    setEditingId(tracking.uuid);
    setEditingValues({
      start: formatTimeForInput(tracking.start),
      end: tracking.end ? formatTimeForInput(tracking.end) : '',
      taskName: tracking.task?.name || ''
    });
  };

  const handleSaveEdit = async (tracking: TimeTrackingDto) => {
    try {
      const baseDate = DateTime.fromISO(tracking.start).toISODate();
      const request = {
        uuid: tracking.uuid,
        start: DateTime.fromISO(`${baseDate}T${editingValues.start}`).toISO()!,
        end: editingValues.end ? DateTime.fromISO(`${baseDate}T${editingValues.end}`).toISO() : undefined,
        task: editingValues.taskName ? { name: editingValues.taskName } : undefined
      };

      const response = await TimeTrackingService.createOrUpdateTimeTracking(request);
      if (response.success) {
        await refreshTimeTrackings();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update time tracking:', error);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    
    try {
      const response = await TimeTrackingService.deleteTimeTracking(uuid);
      if (response.success) {
        await refreshTimeTrackings();
      }
    } catch (error) {
      console.error('Failed to delete time tracking:', error);
    }
  };

  const handleAddNew = async () => {
    try {
      const now = DateTime.now();
      const trackingId = uuid();
      
      const request = {
        uuid: trackingId,
        start: now.set({ second: 0, millisecond: 0 }).toISO()!
      };

      const response = await TimeTrackingService.createOrUpdateTimeTracking(request);
      if (response.success) {
        await refreshTimeTrackings();
        if (response.data) {
          handleEdit(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to add new time tracking:', error);
    }
  };

  const isToday = date ? DateTime.fromISO(date).hasSame(DateTime.now(), 'day') : true;

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: 600, 
        marginBottom: '1rem',
        color: '#1f2937'
      }}>
        Time Entries
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sorted.map((tracking) => (
          <TimeEntryItem key={tracking.uuid}>
            {editingId === tracking.uuid ? (
              <>
                <input
                  type="time"
                  value={editingValues.start}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, start: e.target.value }))}
                  className="time-input"
                />
                <span style={{ margin: '0 0.5rem' }}>-</span>
                <input
                  type="time"
                  value={editingValues.end}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, end: e.target.value }))}
                  className="time-input"
                />
                <input
                  type="text"
                  value={editingValues.taskName}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, taskName: e.target.value }))}
                  placeholder="Task description"
                  style={{
                    flex: 1,
                    marginLeft: '1rem',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem'
                  }}
                />
                <IconButtonStyled
                  onClick={() => handleSaveEdit(tracking)}
                  style={{ color: '#10b981' }}
                >
                  <Check size={18} />
                </IconButtonStyled>
                <IconButtonStyled
                  onClick={() => setEditingId(null)}
                  style={{ color: '#ef4444' }}
                >
                  <X size={18} />
                </IconButtonStyled>
              </>
            ) : (
              <>
                <span style={{ 
                  fontFamily: 'Inria Sans, monospace',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {formatTimeForInput(tracking.start)}
                </span>
                <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>-</span>
                <span style={{ 
                  fontFamily: 'Inria Sans, monospace',
                  fontSize: '0.875rem',
                  color: tracking.end ? '#6b7280' : '#ef4444'
                }}>
                  {tracking.end ? formatTimeForInput(tracking.end) : 'Running'}
                </span>
                <span style={{ 
                  marginLeft: '1rem',
                  padding: '0.25rem 0.75rem',
                  background: '#f3f4f6',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  {calculateDuration(tracking.start, tracking.end)}
                </span>
                <span style={{ 
                  flex: 1, 
                  marginLeft: '1rem',
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}>
                  {tracking.task?.name || 'No description'}
                </span>
                <IconButtonStyled
                  onClick={() => handleEdit(tracking)}
                  style={{ opacity: 0.7 }}
                >
                  <Edit2 size={16} />
                </IconButtonStyled>
                <IconButtonStyled
                  onClick={() => handleDelete(tracking.uuid)}
                  className="delete-button"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </IconButtonStyled>
              </>
            )}
          </TimeEntryItem>
        ))}
      </div>

      {!isToday && (
        <ButtonWrapper style={{ marginTop: '1rem' }}>
          <IconButtonStyled onClick={handleAddNew}>
            <Plus size={20} />
            <span style={{ marginLeft: '0.5rem' }}>Add Entry</span>
          </IconButtonStyled>
        </ButtonWrapper>
      )}
    </div>
  );
};