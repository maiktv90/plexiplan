import React from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToolCard } from './ToolCard';
import type { ToolDefinition, ConnectedTool } from '@/types/tool.types';

// Custom animation that provides smoother transitions
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  // Disable animation during sorting for smoother experience
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

interface SortableToolCardProps {
  id: string;
  tool: ToolDefinition;
  connectedTool?: ConnectedTool;
  isLoading?: boolean;
  onConnect: (tool: ToolDefinition) => void;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
  position?: number;
}

export const SortableToolCard: React.FC<SortableToolCardProps> = ({
  id,
  tool,
  connectedTool,
  isLoading,
  onConnect,
  onDisconnect,
  onSettings,
  position,
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

  // Use Translate to avoid scale transforms that cause visual jumps
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
        isOver && !isDragging
          ? 'ring-2 ring-primary-500 ring-offset-2 rounded-lg'
          : ''
      }`}
    >
      <ToolCard
        tool={tool}
        connectedTool={connectedTool}
        isLoading={isLoading}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onSettings={onSettings}
        isDraggable
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
        position={position}
      />
    </div>
  );
};
