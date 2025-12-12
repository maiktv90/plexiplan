import React from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConnectedToolListItem } from './ConnectedToolListItem';
import type { ToolDefinition, ConnectedTool } from '@/types/tool.types';

// Custom animation that provides smoother transitions
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

interface SortableConnectedToolListItemProps {
  id: string;
  tool: ToolDefinition;
  connectedTool: ConnectedTool;
  isLoading?: boolean;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
}

export const SortableConnectedToolListItem: React.FC<SortableConnectedToolListItemProps> = ({
  id,
  tool,
  connectedTool,
  isLoading,
  onDisconnect,
  onSettings,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, animateLayoutChanges });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        isOver && !isDragging ? 'ring-2 ring-primary-500 ring-offset-2 rounded-lg' : ''
      }`}
    >
      <ConnectedToolListItem
        tool={tool}
        connectedTool={connectedTool}
        isLoading={isLoading}
        onDisconnect={onDisconnect}
        onSettings={onSettings}
        isDraggable
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};
