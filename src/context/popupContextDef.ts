import { createContext } from 'react';

interface PopupState {
  isPopup: boolean;
  isLoading: boolean;
  hasError: boolean;
}

interface PopupContextType extends PopupState {
  setIsLoading: (isLoading: boolean) => void;
  setIsPopup: (isPopup: boolean) => void;
  setHasError: (hasError: boolean) => void;
}

export const PopupContext = createContext<PopupContextType | undefined>(undefined);