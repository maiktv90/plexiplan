import React, { useState, type ReactNode } from 'react';
import { PopupContext } from './popupContextDef';

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [isPopup, setIsPopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <PopupContext.Provider
      value={{
        isPopup,
        isLoading,
        hasError,
        setIsLoading,
        setIsPopup,
        setHasError,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
};