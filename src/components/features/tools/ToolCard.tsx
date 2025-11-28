import React from 'react';
import { ExternalLink, Settings, Unlink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ToolIcon } from './ToolIcon';
import { ToolStatusBadge } from './ToolStatusBadge';
import type { ToolDefinition, ConnectedTool, ConnectionStatus } from '@/types/tool.types';

interface ToolCardProps {
  tool: ToolDefinition;
  connectedTool?: ConnectedTool;
  isLoading?: boolean;
  onConnect: (tool: ToolDefinition) => void;
  onDisconnect: (tool: ConnectedTool) => void;
  onSettings?: (tool: ToolDefinition) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  connectedTool,
  isLoading = false,
  onConnect,
  onDisconnect,
  onSettings,
}) => {
  const isConnected = !!connectedTool;
  const status: ConnectionStatus = isLoading ? 'pending' : isConnected ? 'connected' : 'disconnected';

  return (
    <Card className="flex flex-col h-full" padding="md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <ToolIcon icon={tool.icon} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {tool.name}
            </h3>
            <ToolStatusBadge status={status} size="sm" />
          </div>
        </div>
        {tool.docsUrl && (
          <a
            href={tool.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Documentation"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
        {tool.description}
      </p>

      {/* Connected info */}
      {isConnected && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
          {connectedTool.domain && (
            <div className="truncate">{connectedTool.domain}</div>
          )}
          {connectedTool.connectedAt && (
            <div>
              Connected {new Date(connectedTool.connectedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
        {isConnected ? (
          <>
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSettings(tool)}
                disabled={isLoading}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDisconnect(connectedTool)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <Unlink className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConnect(tool)}
            loading={isLoading}
            className="w-full"
          >
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
};
