import { useConfigStore } from '@/stores/useConfigStore';

export const useConfig = () => {
  return useConfigStore();
};