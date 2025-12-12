import React from 'react';
import { ExternalLink, LogOut, ArrowRight } from 'lucide-react';
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
import type { ToolDefinition } from '@/types/tool.types';

interface AccountSwitchDialogProps {
  tool: ToolDefinition | null;
  logoutUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

/**
 * Dialog shown when user wants to connect another account from a provider
 * that doesn't support account selection (like Bitbucket, GitHub).
 *
 * Guides the user to:
 * 1. Open the provider's logout page in a new tab
 * 2. Log into the desired account
 * 3. Come back and proceed with the connection
 */
export const AccountSwitchDialog: React.FC<AccountSwitchDialogProps> = ({
  tool,
  logoutUrl,
  isOpen,
  onClose,
  onProceed,
}) => {
  if (!tool) return null;

  const handleOpenLogout = () => {
    if (logoutUrl) {
      window.open(logoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ToolIcon icon={tool.icon} size="lg" />
            <AlertDialogTitle className="text-xl">
              Add Another {tool.name} Account
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {tool.name} doesn't support selecting a different account during authorization.
                To connect a different account, please follow these steps:
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Sign out of {tool.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Click the button below to open {tool.name}'s sign out page in a new tab.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Sign in with the account you want to connect
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Log into the {tool.name} account you want to add.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Come back here and continue
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Click "Continue" below to authorize the connection.
                    </p>
                  </div>
                </li>
              </ol>

              {logoutUrl && (
                <Button
                  variant="outline"
                  onClick={handleOpenLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Open {tool.name} Sign Out Page
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="primary" onClick={onProceed}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
