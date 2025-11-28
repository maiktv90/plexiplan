import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ToolDefinition, ConnectedTool } from '@/types/tool.types';

interface ToolState {
  // Connection dialog state
  connectingTool: ToolDefinition | null;
  connectingToolUrl: string | null; // URL from backend to initiate connection
  isConnectionDialogOpen: boolean;

  // Disconnect dialog state
  disconnectingTool: ConnectedTool | null;
  isDisconnectDialogOpen: boolean;

  // Loading states for individual tools
  toolLoadingStates: Record<string, boolean>;

  // Error states for individual tools
  toolErrors: Record<string, string | null>;

  // Actions - Connection dialog
  openConnectionDialog: (tool: ToolDefinition, connectUrl?: string) => void;
  closeConnectionDialog: () => void;

  // Actions - Disconnect dialog
  openDisconnectDialog: (tool: ConnectedTool) => void;
  closeDisconnectDialog: () => void;

  // Actions - Loading states
  setToolLoading: (clientKey: string, isLoading: boolean) => void;
  setToolError: (clientKey: string, error: string | null) => void;
  clearToolError: (clientKey: string) => void;
  clearAllErrors: () => void;
}

export const useToolStore = create<ToolState>()(
  devtools(
    (set) => ({
      // Initial state
      connectingTool: null,
      connectingToolUrl: null,
      isConnectionDialogOpen: false,
      disconnectingTool: null,
      isDisconnectDialogOpen: false,
      toolLoadingStates: {},
      toolErrors: {},

      // Connection dialog actions
      openConnectionDialog: (tool, connectUrl) =>
        set({
          connectingTool: tool,
          connectingToolUrl: connectUrl ?? null,
          isConnectionDialogOpen: true,
        }),

      closeConnectionDialog: () =>
        set({
          connectingTool: null,
          connectingToolUrl: null,
          isConnectionDialogOpen: false,
        }),

      // Disconnect dialog actions
      openDisconnectDialog: (tool) =>
        set({
          disconnectingTool: tool,
          isDisconnectDialogOpen: true,
        }),

      closeDisconnectDialog: () =>
        set({
          disconnectingTool: null,
          isDisconnectDialogOpen: false,
        }),

      // Loading state actions
      setToolLoading: (clientKey, isLoading) =>
        set((state) => ({
          toolLoadingStates: {
            ...state.toolLoadingStates,
            [clientKey]: isLoading,
          },
        })),

      // Error state actions
      setToolError: (clientKey, error) =>
        set((state) => ({
          toolErrors: {
            ...state.toolErrors,
            [clientKey]: error,
          },
        })),

      clearToolError: (clientKey) =>
        set((state) => ({
          toolErrors: {
            ...state.toolErrors,
            [clientKey]: null,
          },
        })),

      clearAllErrors: () => set({ toolErrors: {} }),
    }),
    { name: 'tool-store' }
  )
);
