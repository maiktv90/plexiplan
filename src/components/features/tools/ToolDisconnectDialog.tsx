import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import { ToolIcon } from './ToolIcon';
import { getToolByClientId } from '@/config/tools.config';
import type { ConnectedTool } from '@/types/tool.types';

interface ToolDisconnectDialogProps {
  tool: ConnectedTool | null;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (clientKey: string) => void;
  isDisconnecting?: boolean;
}

export const ToolDisconnectDialog: React.FC<ToolDisconnectDialogProps> = ({
  tool,
  isOpen,
  onClose,
  onDisconnect,
  isDisconnecting = false,
}) => {
  if (!tool) return null;

  const toolDefinition = getToolByClientId(tool.clientKey);

  const handleDisconnect = () => {
    onDisconnect(tool.clientKey);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {toolDefinition && <ToolIcon icon={toolDefinition.icon} size="lg" />}
            <AlertDialogTitle className="text-xl">
              Disconnect {tool.label}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to disconnect {tool.label}?
              </p>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  <p className="font-medium mb-1">This will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Remove the connection to {tool.label}</li>
                    <li>Revoke access tokens stored for this tool</li>
                    <li>Stop syncing data from {tool.label}</li>
                  </ul>
                </div>
              </div>

              {tool.domain && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connected instance: <span className="font-mono">{tool.domain}</span>
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            loading={isDisconnecting}
          >
            Disconnect
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
