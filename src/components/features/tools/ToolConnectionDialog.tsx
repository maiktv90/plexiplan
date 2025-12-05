import React, { useState } from 'react';
import { ExternalLink, Shield, AlertCircle } from 'lucide-react';
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
import { Input } from '@/components/ui/Input';
import { ToolIcon } from './ToolIcon';
import type { ToolDefinition, PATCredentials } from '@/types/tool.types';

interface ToolConnectionDialogProps {
  tool: ToolDefinition | null;
  connectUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConnectOAuth: () => void;
  onConnectPAT: (tool: ToolDefinition, credentials: PATCredentials) => void;
  isConnecting?: boolean;
  error?: string | null;
}

export const ToolConnectionDialog: React.FC<ToolConnectionDialogProps> = ({
  tool,
  connectUrl,
  isOpen,
  onClose,
  onConnectOAuth,
  onConnectPAT,
  isConnecting = false,
  error,
}) => {
  const [patCredentials, setPatCredentials] = useState<PATCredentials>({
    token: '',
    domain: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!tool) return null;

  const isOAuth = tool.authMethod === 'OAUTH2';
  const isPAT = tool.authMethod === 'PAT';
  const isCustom = tool.authMethod === 'CUSTOM';

  const handleConnect = () => {
    if (isOAuth) {
      // Standard OAuth2 - redirect to auth provider
      onConnectOAuth();
    } else if (isCustom) {
      console.log({connectUrl})
      // Custom flow (Trello) - redirect to auth page
      // Trello uses fragment callback which redirects back to /auth/trello/callback#token=xxx
      // Full page navigation is required (not popup) for fragment callback to work
      if (connectUrl) {
        window.location.href = connectUrl;
      }
    } else if (isPAT) {
      // PAT flow - validate and save token
      const missingFields = tool.configFields
        ?.filter((field) => field.required && !patCredentials[field.key as keyof PATCredentials])
        .map((field) => field.label);

      if (missingFields && missingFields.length > 0) {
        setValidationError(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      setValidationError(null);
      onConnectPAT(tool, patCredentials);
    }
  };

  const handleClose = () => {
    setPatCredentials({ token: '', domain: '' });
    setValidationError(null);
    onClose();
  };

  const handleInputChange = (key: string, value: string) => {
    setPatCredentials((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ToolIcon icon={tool.icon} size="lg" />
            <AlertDialogTitle className="text-xl">
              Connect {tool.name}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {tool.description}
              </p>

              {/* OAuth2 Flow (GitHub, Bitbucket, Jira Cloud) */}
              {isOAuth && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>
                      You'll be securely redirected to {tool.name} to authorize access.
                      We only request the minimum permissions needed.
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Flow (Trello) - Redirect authorization */}
              {isCustom && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>
                      You'll be redirected to {tool.name} to authorize access.
                      Once authorized, you'll be automatically returned here.
                    </span>
                  </div>
                </div>
              )}

              {/* PAT Flow (Jira Server) */}
              {isPAT && tool.configFields && (
                <div className="space-y-4">
                  {tool.configFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input
                        type={field.type === 'password' ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={patCredentials[field.key as keyof PATCredentials] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        disabled={isConnecting}
                      />
                      {field.helpText && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  ))}

                  {tool.docsUrl && (
                    <a
                      href={tool.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                      How to generate a Personal Access Token
                    </a>
                  )}
                </div>
              )}

              {/* Error Display */}
              {(error || validationError) && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error || validationError}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isConnecting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="primary"
            onClick={handleConnect}
            loading={isConnecting}
          >
            {isOAuth || isCustom
              ? `Connect with ${tool.name}`
              : 'Save & Connect'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
