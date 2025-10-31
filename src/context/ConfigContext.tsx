import React, { useState, type ReactNode } from 'react';
import { ConfigContext, type ToolStateParams, type ToolState } from './configContextDef';

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [toolStates, setToolStates] = useState<Record<string, ToolState>>({});

  const setToolState = (params: ToolStateParams) => {
    setToolStates(prev => ({
      ...prev,
      [params.clientRegistrationId]: {
        isLoading: params.isLoading,
        hasError: params.hasError,
        error: params.error,
        user: params.user,
      }
    }));
  };

  return (
    <ConfigContext.Provider
      value={{
        isLoading,
        toolStates,
        setIsLoading,
        setToolState,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};