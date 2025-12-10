import React, { useState, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { SettingsSidebar, type SettingsSection } from '@/components/features/settings';
import { useTheme } from '@/hooks/useTheme';
import {
  ToolList,
  ToolConnectionDialog,
  ToolDisconnectDialog,
  AccountSwitchDialog,
  JiraProjectConfigDialog,
  BitbucketRepoConfigDialog,
} from '@/components/features/tools';
import {
  useIntegrationsQuery,
  useRegisterPATMutation,
  useDisconnectToolMutation,
  useInitiateOAuthMutation,
  useUpdateToolOrderMutation,
} from '@/api/hooks/useTools';
import { useToolStore } from '@/stores/useToolStore';
import { useOAuthCallback } from '@/hooks/useOAuthCallback';
import { ToolService } from '@/api/services/ToolService';
import { JiraService } from '@/providers/tools/jira/JiraService';
import { BitbucketService } from '@/providers/tools/bitbucket/BitbucketService';
import type { ToolDefinition, ConnectedTool, PATCredentials } from '@/types/tool.types';
import { jiraClientRegistrationId, jiraServerClientRegistrationId } from '@/config/jira.config';

const BITBUCKET_CLIENT_REGISTRATION_ID = 'bitbucket';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('tools');
  const { theme, setTheme } = useTheme();
  const [isJiraConfigOpen, setIsJiraConfigOpen] = useState(false);
  const [jiraSelectedProjectIds, setJiraSelectedProjectIds] = useState<string[]>([]);
  const [isBitbucketConfigOpen, setIsBitbucketConfigOpen] = useState(false);
  const [bitbucketSelectedRepoIds, setBitbucketSelectedRepoIds] = useState<string[]>([]);

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
  const updateToolOrderMutation = useUpdateToolOrderMutation();

  // Store for dialog state
  const {
    connectingTool,
    connectingToolUrl,
    isConnectionDialogOpen,
    isAccountSwitchDialogOpen,
    accountSwitchTool,
    accountSwitchLogoutUrl,
    disconnectingTool,
    isDisconnectDialogOpen,
    toolLoadingStates,
    openConnectionDialog,
    closeConnectionDialog,
    openAccountSwitchDialog,
    closeAccountSwitchDialog,
    proceedAfterAccountSwitch,
    openDisconnectDialog,
    closeDisconnectDialog,
    setToolLoading,
    setToolError,
    toolErrors,
  } = useToolStore();

  // Providers that don't support account selection during OAuth
  // These require the user to sign out first to connect a different account
  const PROVIDERS_REQUIRING_SIGNOUT: Record<string, string> = {
    bitbucket: 'https://bitbucket.org/account/signout/',
    github: 'https://github.com/logout',
  };

  // Handlers
  const handleConnect = (tool: ToolDefinition, connectUrl?: string) => {
    // Check if user already has an account connected for this provider
    const existingAccounts = integrations?.connectedTools.filter(
      (ct) => ct.clientKey === tool.clientRegistrationId
    ) ?? [];

    // If adding another account for a provider that doesn't support account selection
    const logoutUrl = PROVIDERS_REQUIRING_SIGNOUT[tool.clientRegistrationId];
    if (existingAccounts.length > 0 && logoutUrl && tool.authMethod === 'OAUTH2') {
      // Show account switch dialog instead of direct connection
      openAccountSwitchDialog(tool, logoutUrl);
    } else {
      // Normal connection flow
      openConnectionDialog(tool, connectUrl);
    }
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
      // For Bitbucket App Password, combine username and token into "username:token" format
      let token = credentials.token;
      if (tool.clientRegistrationId === 'bitbucket-pat' && credentials.username) {
        token = `${credentials.username}:${credentials.token}`;
      }

      await registerPATMutation.mutateAsync({
        client: tool.clientRegistrationId,
        token,
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

  const handleConfirmDisconnect = async (clientKey: string, externalAccountId?: string) => {
    setToolLoading(clientKey, true);
    try {
      await disconnectMutation.mutateAsync({ clientRegistrationId: clientKey, externalAccountId });
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

  // Handle opening tool settings
  const handleSettings = async (tool: ToolDefinition) => {
    // Check if it's a Jira tool (Cloud or Server)
    if (tool.clientRegistrationId === jiraClientRegistrationId ||
        tool.clientRegistrationId === jiraServerClientRegistrationId) {
      // Fetch current configuration before opening dialog
      try {
        const result = await JiraService.getConfiguration();
        if (result.success && result.data) {
          setJiraSelectedProjectIds(result.data.selectedProjectIds);
        } else {
          setJiraSelectedProjectIds([]);
        }
      } catch {
        setJiraSelectedProjectIds([]);
      }
      setIsJiraConfigOpen(true);
    }
    // Check if it's Bitbucket
    else if (tool.clientRegistrationId === BITBUCKET_CLIENT_REGISTRATION_ID) {
      // Fetch current configuration before opening dialog
      try {
        const result = await BitbucketService.getConfiguration();
        if (result.success && result.data) {
          setBitbucketSelectedRepoIds(result.data.selectedRepositoryIds);
        } else {
          setBitbucketSelectedRepoIds([]);
        }
      } catch {
        setBitbucketSelectedRepoIds([]);
      }
      setIsBitbucketConfigOpen(true);
    }
  };

  // Handle saving Jira configuration
  const handleSaveJiraConfig = async (selectedProjectIds: string[]) => {
    await JiraService.updateConfiguration({ selectedProjectIds });
    setJiraSelectedProjectIds(selectedProjectIds);
  };

  // Handle saving Bitbucket configuration
  const handleSaveBitbucketConfig = async (selectedRepositoryIds: string[]) => {
    await BitbucketService.updateConfiguration({ selectedRepositoryIds });
    setBitbucketSelectedRepoIds(selectedRepositoryIds);
  };

  // Handle tool reordering
  const handleToolReorder = async (reorderedTools: ConnectedTool[]) => {
    const toolOrders = reorderedTools.map((tool, index) => ({
      clientKey: tool.clientKey,
      order: index,
      externalAccountId: tool.externalAccountId, // Include for multi-account support
    }));

    try {
      await updateToolOrderMutation.mutateAsync({ toolOrders });
    } catch (err) {
      console.error('Failed to update tool order:', err);
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
            onSettings={handleSettings}
            onRetry={() => refetch()}
            onReorder={handleToolReorder}
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
          <div className="space-y-6">
            {/* Theme Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Appearance
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Light
                    </span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Dark
                    </span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'system'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Monitor className={`h-6 w-6 ${theme === 'system' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`text-sm font-medium ${theme === 'system' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      System
                    </span>
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Choose how Plexify Planner looks to you. Select a single theme, or sync with your system settings.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 lg:gap-8">
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

      <AccountSwitchDialog
        tool={accountSwitchTool}
        logoutUrl={accountSwitchLogoutUrl}
        isOpen={isAccountSwitchDialogOpen}
        onClose={closeAccountSwitchDialog}
        onProceed={proceedAfterAccountSwitch}
      />

      <JiraProjectConfigDialog
        isOpen={isJiraConfigOpen}
        onClose={() => setIsJiraConfigOpen(false)}
        onSave={handleSaveJiraConfig}
        initialSelectedIds={jiraSelectedProjectIds}
      />

      <BitbucketRepoConfigDialog
        isOpen={isBitbucketConfigOpen}
        onClose={() => setIsBitbucketConfigOpen(false)}
        onSave={handleSaveBitbucketConfig}
        initialSelectedIds={bitbucketSelectedRepoIds}
      />
    </div>
  );
};
