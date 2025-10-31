import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store';

export const useExtension = () => {
  const queryClient = useQueryClient();
  const { setIsPopup, setLoading } = useUIStore();
  const [isExtension, setIsExtension] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if running in Chrome extension context
    const checkExtensionContext = () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        setIsExtension(true);
        
        if (chrome.extension) {
          const popupViews = chrome.extension.getViews({ type: 'popup' });
          const tabViews = chrome.extension.getViews({ type: 'tab' });
          
          setIsPopup(popupViews.length > 0 && tabViews.length < 0);
          setIsExpanded(tabViews.length > 0);
        }
      } else {
        setIsExtension(false);
        setIsPopup(false); // Not a popup if not an extension
        setIsExpanded(true); // Always expanded in web app
      }
      setLoading(false);
    };

    checkExtensionContext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: Store functions intentionally omitted to prevent infinite re-renders

  const openInNewTab = () => {
    if (isExtension) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    }
  };

  const getStorageData = async (key: string) => {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(key, (result) => {
          resolve(result[key]);
        });
      });
    } else {
      return localStorage.getItem(key);
    }
  };

  const setStorageData = async ({ key, value }: { key: string; value: string }) => {
    if (isExtension) {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ [key]: value }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    }
  };

  const useGetStorageData = (key: string) => {
    return useQuery({
      queryKey: ['storageData', key],
      queryFn: () => getStorageData(key),
    });
  };

  const useSetStorageData = () => {
    return useMutation({
      mutationFn: setStorageData,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['storageData'] });
      },
    });
  };

  return {
    isExtension,
    isExpanded,
    openInNewTab,
    useGetStorageData,
    useSetStorageData,
  };
};