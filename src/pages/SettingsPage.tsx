import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { SettingsSidebar, type SettingsSection } from '@/components/features/settings';
import {
  ToolList,
  ToolConnectionDialog,
  ToolDisconnectDialog,
} from '@/components/features/tools';
import {
  useIntegrationsQuery,
  useRegisterPATMutation,
  useDisconnectToolMutation,
  useInitiateOAuthMutation,
} from '@/api/hooks/useTools';
import { useToolStore } from '@/stores/useToolStore';
import { useOAuthCallback } from '@/hooks/useOAuthCallback';
import { ToolService } from '@/api/services/ToolService';
import type { ToolDefinition, ConnectedTool, PATCredentials } from '@/types/tool.types';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('tools');

  // API hooks
  const { data: integrations, isLoading, error, refetch } = useIntegrationsQuery();

  // Handle OAuth callback - refetch integrations on success
  const handleOAuthSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  useOAuthCallback({
    onSuccess: handleOAuthSuccess,
  });
  const registerPATMutation = useRegisterPATMutation();
  const disconnectMutation = useDisconnectToolMutation();
  const initiateOAuthMutation = useInitiateOAuthMutation();

  // Store for dialog state
  const {
    connectingTool,
    connectingToolUrl,
    isConnectionDialogOpen,
    disconnectingTool,
    isDisconnectDialogOpen,
    toolLoadingStates,
    openConnectionDialog,
    closeConnectionDialog,
    openDisconnectDialog,
    closeDisconnectDialog,
    setToolLoading,
    setToolError,
    toolErrors,
  } = useToolStore();

  // Handlers
  const handleConnect = (tool: ToolDefinition, connectUrl?: string) => {
    openConnectionDialog(tool, connectUrl);
  };

  const handleDisconnect = (tool: ConnectedTool) => {
    openDisconnectDialog(tool);
  };

  const handleToolConnect = async () => {
    if (!connectingTool) return;

    // For OAuth2 tools, use the new initiate endpoint that includes encrypted state
    if (connectingTool.authMethod === 'OAUTH2') {
      setToolLoading(connectingTool.clientRegistrationId, true);
      try {
        // This will redirect to the OAuth provider
        await initiateOAuthMutation.mutateAsync(connectingTool.clientRegistrationId);
      } catch (err) {
        setToolError(
          connectingTool.clientRegistrationId,
          err instanceof Error ? err.message : 'Failed to initiate OAuth'
        );
        setToolLoading(connectingTool.clientRegistrationId, false);
      }
      // Note: Loading state will persist until page redirects - that's ok
    } else if (connectingToolUrl) {
      // For CUSTOM auth (like Trello), use the connectUrl from backend
      ToolService.initiateConnection(connectingToolUrl);
    }
  };

  const handlePATConnect = async (tool: ToolDefinition, credentials: PATCredentials) => {
    setToolLoading(tool.clientRegistrationId, true);
    try {
      await registerPATMutation.mutateAsync({
        client: tool.clientRegistrationId,
        token: credentials.token,
        domain: credentials.domain,
      });
      closeConnectionDialog();
    } catch (err) {
      setToolError(
        tool.clientRegistrationId,
        err instanceof Error ? err.message : 'Failed to connect'
      );
    } finally {
      setToolLoading(tool.clientRegistrationId, false);
    }
  };

  const handleConfirmDisconnect = async (clientKey: string) => {
    setToolLoading(clientKey, true);
    try {
      await disconnectMutation.mutateAsync(clientKey);
      closeDisconnectDialog();
    } catch (err) {
      setToolError(
        clientKey,
        err instanceof Error ? err.message : 'Failed to disconnect'
      );
    } finally {
      setToolLoading(clientKey, false);
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'tools':
        return (
          <ToolList
            connectedTools={integrations?.connectedTools ?? []}
            availableTools={integrations?.availableTools ?? []}
            isLoading={isLoading}
            error={error ? 'Failed to load integrations' : null}
            loadingTools={toolLoadingStates}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRetry={() => refetch()}
          />
        );
      case 'account':
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Account settings coming soon
          </div>
        );
      case 'preferences':
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Preferences coming soon
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <ToolConnectionDialog
        tool={connectingTool}
        connectUrl={connectingToolUrl}
        isOpen={isConnectionDialogOpen}
        onClose={closeConnectionDialog}
        onConnectOAuth={handleToolConnect}
        onConnectPAT={handlePATConnect}
        isConnecting={
          connectingTool ? toolLoadingStates[connectingTool.clientRegistrationId] : false
        }
        error={connectingTool ? toolErrors[connectingTool.clientRegistrationId] : null}
      />

      <ToolDisconnectDialog
        tool={disconnectingTool}
        isOpen={isDisconnectDialogOpen}
        onClose={closeDisconnectDialog}
        onDisconnect={handleConfirmDisconnect}
        isDisconnecting={
          disconnectingTool ? toolLoadingStates[disconnectingTool.clientKey] : false
        }
      />
    </div>
  );
};
