import { create } from 'zustand';

/**
 * sidebarStore — Estado global da sidebar.
 * Persiste no localStorage para manter a preferência entre sessões.
 */

interface SidebarState {
    collapsed: boolean;
    toggle: () => void;
}

const STORAGE_KEY = 'sidebar-collapsed';

function getInitialState(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export const useSidebarStore = create<SidebarState>((set) => ({
    collapsed: getInitialState(),

    toggle: () =>
        set((state) => {
            const next = !state.collapsed;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return { collapsed: next };
        }),
}));
