import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type TimeTrackingTab = 'day' | 'week' | 'month';

interface UIState {
    theme: Theme;
    currentTheme: 'light' | 'dark';
    isPopup: boolean;
    isLoading: boolean;
    hasError: boolean;
    listView: boolean;
    expanded: Record<string, boolean>;
    timeTrackingTab: TimeTrackingTab;

    // Actions
    setTheme: (theme: Theme) => void;
    setIsPopup: (isPopup: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (hasError: boolean) => void;
    setListView: (listView: boolean) => void;
    setExpanded: (toolKey: string, expanded: boolean) => void;
    setTimeTrackingTab: (tab: TimeTrackingTab) => void;

    // Helper to initialize theme
    initTheme: () => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        persist(
            (set, get) => ({
                theme: 'system',
                currentTheme: 'light',
                isPopup: false,
                isLoading: true,
                hasError: false,
                listView: false,
                expanded: {},
                timeTrackingTab: 'day',

                setTheme: (theme) => {
                    set({ theme });

                    // Apply theme logic
                    let effectiveTheme: 'light' | 'dark';
                    if (theme === 'system') {
                        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    } else {
                        effectiveTheme = theme;
                    }

                    set({ currentTheme: effectiveTheme });

                    if (effectiveTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                },

                setIsPopup: (isPopup) => set({ isPopup }),
                setLoading: (isLoading) => set({ isLoading }),
                setError: (hasError) => set({ hasError }),
                setListView: (listView) => set({ listView }),
                setExpanded: (toolKey, expanded) =>
                    set((state) => ({
                        expanded: {
                            ...state.expanded,
                            [toolKey]: expanded,
                        },
                    })),
                setTimeTrackingTab: (tab) => set({ timeTrackingTab: tab }),

                initTheme: () => {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

                    const applyTheme = () => {
                        const currentThemeSetting = get().theme;
                        let effectiveTheme: 'light' | 'dark';

                        if (currentThemeSetting === 'system') {
                            effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
                        } else {
                            effectiveTheme = currentThemeSetting as 'light' | 'dark';
                        }

                        set({ currentTheme: effectiveTheme });

                        if (effectiveTheme === 'dark') {
                            document.documentElement.classList.add('dark');
                        } else {
                            document.documentElement.classList.remove('dark');
                        }
                    };

                    // Apply initially
                    applyTheme();

                    // Listen for system changes
                    const handleChange = () => {
                        if (get().theme === 'system') {
                            applyTheme();
                        }
                    };

                    mediaQuery.addEventListener('change', handleChange);
                    // Note: We can't easily return a cleanup function here since it's a store method.
                    // In a real app, we might want to handle this differently or in a component effect.
                },
            }),
            {
                name: 'ui-storage',
                partialize: (state) => ({
                    theme: state.theme,
                    listView: state.listView,
                    expanded: state.expanded,
                    timeTrackingTab: state.timeTrackingTab,
                }),
            }
        )
    )
);
