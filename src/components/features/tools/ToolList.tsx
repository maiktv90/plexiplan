import React, { useMemo, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw, GripVertical, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ToolCard } from './ToolCard';
import { ConnectedToolListItem } from './ConnectedToolListItem';
import { SortableConnectedToolListItem } from './SortableConnectedToolListItem';
import { Button } from '@/components/ui/Button';
import { SUPPORTED_TOOLS, CATEGORY_LABELS, getToolsByCategory } from '@/config/tools.config';
import { trelloKeygenUrl, trelloClientRegistrationId } from '@/config/trello.config';
import type { ToolDefinition, ConnectedTool, AvailableTool, ToolCategory } from '@/types/tool.types';

/**
 * Generate a unique key for a connected tool (supports multi-account)
 */
const getToolUniqueKey = (tool: ConnectedTool): string => {
  return tool.externalAccountId
    ? `${tool.clientKey}:${tool.externalAccountId}`
    : tool.clientKey;
};

/**
 * Group connected tools by provider for multi-account display
 */
const groupToolsByProvider = (tools: ConnectedTool[]): Record<string, ConnectedTool[]> => {
  return tools.reduce((acc, tool) => {
    const key = tool.clientKey;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(tool);
    return acc;
  }, {} as Record<string, ConnectedTool[]>);
};

interface ToolListProps {
  connectedTools: ConnectedTool[];
  availableTools?: AvailableTool[];
  isLoading?: boolean;
  error?: string | null;
  loadingTools?: Record<string, boolean>;
  onConnect: (tool: ToolDefinition, connectUrl?: string) => void;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
  onRetry?: () => void;
  onReorder?: (reorderedTools: ConnectedTool[]) => void;
}

/**
 * Connected Tools List Section for a specific category
 * Flat list of connected tools sorted by order with drag-and-drop reordering
 * Supports multiple accounts per provider (multi-account)
 */
const ConnectedToolsList: React.FC<{
  title: string;
  connectedTools: ConnectedTool[];
  allConnectedTools: ConnectedTool[];
  loadingTools: Record<string, boolean>;
  onConnect: (tool: ToolDefinition, connectUrl?: string) => void;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
  onReorder?: (reorderedTools: ConnectedTool[]) => void;
}> = ({
  title,
  connectedTools,
  allConnectedTools,
  loadingTools,
  onConnect,
  onDisconnect,
  onSettings,
  onReorder,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort connected tools by order within this category
  const sortedTools = useMemo(() => {
    return [...connectedTools].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [connectedTools]);

  // Get unique sortable IDs for each connected account
  const sortableIds = useMemo(() => {
    return sortedTools.map(getToolUniqueKey);
  }, [sortedTools]);

  // Get tool definition for a connected tool
  const getToolDefinition = (connectedTool: ConnectedTool): ToolDefinition | undefined => {
    return SUPPORTED_TOOLS.find((t) => t.clientRegistrationId === connectedTool.clientKey);
  };

  // Get connected tool by unique key
  const getConnectedToolByKey = (uniqueKey: string): ConnectedTool | undefined => {
    return sortedTools.find((t) => getToolUniqueKey(t) === uniqueKey);
  };

  // Get active tool for overlay
  const activeConnectedTool = activeId ? getConnectedToolByKey(activeId) : null;
  const activeToolDef = activeConnectedTool ? getToolDefinition(activeConnectedTool) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder tools within this category, preserve other categories
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedTools.findIndex((t) => getToolUniqueKey(t) === active.id);
      const newIndex = sortedTools.findIndex((t) => getToolUniqueKey(t) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder within this category
        const reorderedCategoryTools = arrayMove(sortedTools, oldIndex, newIndex);

        // Get tools from other categories (preserve their order)
        const otherCategoryTools = allConnectedTools.filter(
          (t) => !connectedTools.some((ct) => getToolUniqueKey(ct) === getToolUniqueKey(t))
        );

        // Combine: reordered category tools + other category tools
        const allReordered = [...reorderedCategoryTools, ...otherCategoryTools];
        onReorder?.(allReordered);
      }
    }
  };

  // Check which providers have connected accounts (to show "Add another" option)
  const toolsByProvider = useMemo(() => groupToolsByProvider(connectedTools), [connectedTools]);

  if (sortedTools.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {sortedTools.length > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <GripVertical className="h-3 w-3" /> Drag to reorder
          </span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedTools.map((connectedTool) => {
              const toolDef = getToolDefinition(connectedTool);
              if (!toolDef) return null;

              const uniqueKey = getToolUniqueKey(connectedTool);

              return (
                <SortableConnectedToolListItem
                  key={uniqueKey}
                  id={uniqueKey}
                  tool={toolDef}
                  connectedTool={connectedTool}
                  isLoading={loadingTools[connectedTool.clientKey]}
                  onDisconnect={onDisconnect}
                  onSettings={onSettings}
                />
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && activeToolDef && activeConnectedTool ? (
            <div className="opacity-90 shadow-lg">
              <ConnectedToolListItem
                tool={activeToolDef}
                connectedTool={activeConnectedTool}
                isLoading={false}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* "Add another account" buttons for connected providers in this category */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(toolsByProvider).map(([clientKey, accounts]) => {
          const toolDef = SUPPORTED_TOOLS.find((t) => t.clientRegistrationId === clientKey);
          if (!toolDef) return null;
          // Show for OAuth2, CUSTOM auth (Trello), and PAT - multi-account makes sense for them
          if (toolDef.authMethod !== 'OAUTH2' && toolDef.authMethod !== 'CUSTOM' && toolDef.authMethod !== 'PAT') return null;

          // Get connectUrl from one of the connected accounts
          let connectUrl = accounts[0]?.connectUrl;
          if (!connectUrl && clientKey === trelloClientRegistrationId) {
            connectUrl = trelloKeygenUrl;
          }

          return (
            <button
              key={`add-${clientKey}`}
              onClick={() => onConnect(toolDef, connectUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add {toolDef.name}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export const ToolList: React.FC<ToolListProps> = ({
  connectedTools,
  availableTools = [],
  isLoading = false,
  error,
  loadingTools = {},
  onConnect,
  onDisconnect,
  onSettings,
  onRetry,
  onReorder,
}) => {
  // Find available tool from backend response by client key
  const getAvailableTool = (tool: ToolDefinition): AvailableTool | undefined => {
    return availableTools.find((at) => at.clientKey === tool.clientRegistrationId);
  };

  // Handle connect with connectUrl from backend
  // connectUrl can be passed directly (for "Add another account") or looked up from availableTools
  const handleConnect = (tool: ToolDefinition, connectUrl?: string) => {
    // Use provided connectUrl, or fall back to looking up from availableTools
    const url = connectUrl ?? getAvailableTool(tool)?.connectUrl;
    onConnect(tool, url);
  };

  // Categories in display order
  const categories: ToolCategory[] = ['project_management', 'code_management'];

  // Get connected tools by category
  const getConnectedToolsByCategory = (category: ToolCategory): ConnectedTool[] => {
    const categoryToolIds = getToolsByCategory(category).map((t) => t.clientRegistrationId);
    return connectedTools.filter((ct) => categoryToolIds.includes(ct.clientKey));
  };

  // Check if there are any connected tools
  const hasConnectedTools = connectedTools.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading tools...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4 text-center">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Get all available (unconnected) tools
  const availableToolsList = useMemo(() => {
    return SUPPORTED_TOOLS.filter(
      (tool) => !connectedTools.some((ct) => ct.clientKey === tool.clientRegistrationId)
    );
  }, [connectedTools]);

  return (
    <div className="space-y-8">
      {/* Connected Tools by Category - List view with drag-and-drop per category */}
      {hasConnectedTools && (
        <>
          {categories.map((category) => {
            const categoryConnectedTools = getConnectedToolsByCategory(category);
            if (categoryConnectedTools.length === 0) return null;

            return (
              <ConnectedToolsList
                key={`connected-${category}`}
                title={CATEGORY_LABELS[category]}
                connectedTools={categoryConnectedTools}
                allConnectedTools={connectedTools}
                loadingTools={loadingTools}
                onConnect={handleConnect}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
                onReorder={onReorder}
              />
            );
          })}
        </>
      )}

      {/* Available Tools - Grid view for discoverability */}
      {availableToolsList.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {hasConnectedTools ? 'Available Tools' : 'Connect Your Tools'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableToolsList.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isLoading={loadingTools[tool.clientRegistrationId]}
                onConnect={handleConnect}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
