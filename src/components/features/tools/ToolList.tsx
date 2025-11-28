import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ToolCard } from './ToolCard';
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
}

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
}) => {
  // Find connected tool by client registration ID
  const getConnectedTool = (tool: ToolDefinition): ConnectedTool | undefined => {
    return connectedTools.find((ct) => ct.clientKey === tool.clientRegistrationId);
  };

  // Find available tool from backend response by client key
  const getAvailableTool = (tool: ToolDefinition): AvailableTool | undefined => {
    return availableTools.find((at) => at.clientKey === tool.clientRegistrationId);
  };

  // Handle connect with connectUrl from backend
  const handleConnect = (tool: ToolDefinition) => {
    const availableTool = getAvailableTool(tool);
    onConnect(tool, availableTool?.connectUrl);
  };

  // Group tools by category
  const categories: ToolCategory[] = ['code_management', 'project_management'];

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

  // Connected tools section
  const connectedToolDefinitions = SUPPORTED_TOOLS.filter((tool) =>
    connectedTools.some((ct) => ct.clientKey === tool.clientRegistrationId)
  );

  return (
    <div className="space-y-8">
      {/* Connected Tools Section */}
      {connectedToolDefinitions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Connected Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedToolDefinitions.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                connectedTool={getConnectedTool(tool)}
                isLoading={loadingTools[tool.clientRegistrationId]}
                onConnect={handleConnect}
                onDisconnect={onDisconnect}
                onSettings={onSettings}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available Tools by Category */}
      {categories.map((category) => {
        const categoryTools = getToolsByCategory(category).filter(
          (tool) => !connectedTools.some((ct) => ct.clientKey === tool.clientRegistrationId)
        );

        if (categoryTools.length === 0) return null;

        return (
          <section key={category}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  connectedTool={getConnectedTool(tool)}
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
