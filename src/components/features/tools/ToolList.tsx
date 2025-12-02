import React, { useMemo, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw, GripVertical } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { ToolCard } from './ToolCard';
import { SortableToolCard } from './SortableToolCard';
import { Button } from '@/components/ui/Button';
import { SUPPORTED_TOOLS, CATEGORY_LABELS, getToolsByCategory } from '@/config/tools.config';
import type { ToolDefinition, ConnectedTool, AvailableTool, ToolCategory } from '@/types/tool.types';

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
 * Connected Tools Section for a specific category
 * Each category has its own DndContext for independent drag-and-drop
 */
const ConnectedToolsSection: React.FC<{
  category: ToolCategory;
  connectedTools: ConnectedTool[];
  allConnectedTools: ConnectedTool[];
  loadingTools: Record<string, boolean>;
  onConnect: (tool: ToolDefinition) => void;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
  onReorder?: (reorderedTools: ConnectedTool[]) => void;
}> = ({
  category,
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

  // Sort connected tools by order
  const sortedTools = useMemo(() => {
    return [...connectedTools].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [connectedTools]);

  // Get tool definitions sorted by order
  const sortedToolDefinitions = useMemo(() => {
    return sortedTools
      .map((ct) => SUPPORTED_TOOLS.find((t) => t.clientRegistrationId === ct.clientKey))
      .filter((t): t is ToolDefinition => t !== undefined);
  }, [sortedTools]);

  // Find connected tool by client registration ID
  const getConnectedTool = (tool: ToolDefinition): ConnectedTool | undefined => {
    return connectedTools.find((ct) => ct.clientKey === tool.clientRegistrationId);
  };

  // Get active tool definition for overlay
  const activeToolDef = activeId
    ? SUPPORTED_TOOLS.find((t) => t.clientRegistrationId === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder tools within this category
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedTools.findIndex((t) => t.clientKey === active.id);
      const newIndex = sortedTools.findIndex((t) => t.clientKey === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder within this category
        const reorderedCategoryTools = arrayMove(sortedTools, oldIndex, newIndex);

        // Merge with tools from other categories (preserve their order)
        const otherTools = allConnectedTools.filter(
          (t) => !connectedTools.some((ct) => ct.clientKey === t.clientKey)
        );

        // Combine: other category tools first, then reordered category tools
        const allReordered = [...otherTools, ...reorderedCategoryTools];
        onReorder?.(allReordered);
      }
    }
  };

  if (sortedToolDefinitions.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {CATEGORY_LABELS[category]}
        </h2>
        {sortedToolDefinitions.length > 1 && (
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
          items={sortedTools.map((t) => t.clientKey)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedToolDefinitions.map((tool, index) => (
              <SortableToolCard
                key={tool.clientRegistrationId}
                id={tool.clientRegistrationId}
                tool={tool}
                connectedTool={getConnectedTool(tool)}
                isLoading={loadingTools[tool.clientRegistrationId]}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
                position={index + 1}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && activeToolDef ? (
            <div className="opacity-90 shadow-2xl">
              <ToolCard
                tool={activeToolDef}
                connectedTool={getConnectedTool(activeToolDef)}
                isLoading={false}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
  // Categories in display order
  const categories: ToolCategory[] = ['code_management', 'project_management'];

  // Find available tool from backend response by client key
  const getAvailableTool = (tool: ToolDefinition): AvailableTool | undefined => {
    return availableTools.find((at) => at.clientKey === tool.clientRegistrationId);
  };

  // Handle connect with connectUrl from backend
  const handleConnect = (tool: ToolDefinition) => {
    const availableTool = getAvailableTool(tool);
    onConnect(tool, availableTool?.connectUrl);
  };

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

  return (
    <div className="space-y-8">
      {/* Connected Tools by Category */}
      {hasConnectedTools && (
        <>
          {categories.map((category) => {
            const categoryConnectedTools = getConnectedToolsByCategory(category);
            if (categoryConnectedTools.length === 0) return null;

            return (
              <ConnectedToolsSection
                key={`connected-${category}`}
                category={category}
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

      {/* Available Tools by Category */}
      {categories.map((category) => {
        const categoryTools = getToolsByCategory(category).filter(
          (tool) => !connectedTools.some((ct) => ct.clientKey === tool.clientRegistrationId)
        );

        if (categoryTools.length === 0) return null;

        return (
          <section key={`available-${category}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {hasConnectedTools ? `More ${CATEGORY_LABELS[category]}` : CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTools.map((tool) => (
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
        );
      })}
    </div>
  );
};
