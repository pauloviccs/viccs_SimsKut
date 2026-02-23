import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isInitialized: boolean;
    isAdmin: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
    isAdmin: false,

    setUser: (user) => set({ user }),

    setProfile: (profile) =>
        set({
            profile,
            isAdmin: profile?.is_admin ?? false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    setInitialized: (isInitialized) => set({ isInitialized }),

    logout: () =>
        set({
            user: null,
            profile: null,
            isAdmin: false,
        }),
}));
