import React from 'react';
import { GripVertical, Settings, Unlink } from 'lucide-react';
import { ToolIcon } from './ToolIcon';
import { ToolStatusBadge } from './ToolStatusBadge';
import { Button } from '@/components/ui/Button';
import type { ToolDefinition, ConnectedTool, ConnectionStatus } from '@/types/tool.types';

interface ConnectedToolListItemProps {
  tool: ToolDefinition;
  connectedTool: ConnectedTool;
  isLoading?: boolean;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
  isDraggable?: boolean;
  dragHandleRef?: (node: HTMLElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

/**
 * Compact list item for connected tools
 * Shows: drag handle, tool icon (with tooltip), account label/username, connected badge, date, actions
 */
export const ConnectedToolListItem: React.FC<ConnectedToolListItemProps> = ({
  tool,
  connectedTool,
  isLoading = false,
  onDisconnect,
  onSettings,
  isDraggable = false,
  dragHandleRef,
  dragHandleProps,
  isDragging = false,
}) => {
  const status: ConnectionStatus = isLoading ? 'pending' : 'connected';

  // Display label: prefer accountLabel, fall back to provider label
  const displayLabel = connectedTool.accountLabel || connectedTool.label || tool.name;

  // Format connected date
  const connectedDate = connectedTool.connectedAt
    ? new Date(connectedTool.connectedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700 rounded-lg
        transition-all
        ${isDragging ? 'shadow-lg ring-2 ring-primary-500/50 opacity-90' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}
      `}
    >
      {/* Drag Handle */}
      {isDraggable && (
        <div
          ref={dragHandleRef}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none select-none transition-colors"
          title="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Tool Icon with tooltip */}
      <div className="flex-shrink-0" title={tool.name}>
        <ToolIcon icon={tool.icon} size="sm" />
      </div>

      {/* Account Label / Username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {displayLabel}
          </span>
        </div>
        {/* Domain for self-hosted tools */}
        {connectedTool.domain && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {connectedTool.domain}
          </div>
        )}
      </div>

      {/* Connected Badge */}
      <div className="flex-shrink-0 hidden sm:block">
        <ToolStatusBadge status={status} size="sm" />
      </div>

      {/* Connected Date */}
      {connectedDate && (
        <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 hidden md:block">
          {connectedDate}
        </div>
      )}

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {onSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSettings(tool)}
            disabled={isLoading}
            title={`${tool.name} settings`}
            className="p-1.5"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDisconnect(connectedTool)}
          disabled={isLoading}
          title="Disconnect"
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
