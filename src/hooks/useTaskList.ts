import { useUIStore } from '@/stores/useUIStore';

export const useTaskList = () => {
  const { listView, expanded, setListView, setExpanded } = useUIStore();

  // Adapter to match old API if needed, or just expose store values
  return {
    listView,
    expanded,
    setListView,
    setExpanded: ({ toolKey, expanded }: { toolKey: string; expanded: boolean }) => setExpanded(toolKey, expanded),
  };
};