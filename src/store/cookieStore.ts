import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
}

interface CookieState {
    hasAnswered: boolean;
    preferences: CookiePreferences;
    acceptAll: () => void;
    declineOptional: () => void;
    savePreferences: (prefs: Partial<CookiePreferences>) => void;
}

export const useCookieStore = create<CookieState>()(
    persist(
        (set) => ({
            hasAnswered: false,
            preferences: {
                essential: true,
                analytics: false,
                marketing: false,
            },
            acceptAll: () => set({
                hasAnswered: true,
                preferences: { essential: true, analytics: true, marketing: true }
            }),
            declineOptional: () => set({
                hasAnswered: true,
                preferences: { essential: true, analytics: false, marketing: false }
            }),
            savePreferences: (prefs) => set((state) => ({
                hasAnswered: true,
                preferences: { ...state.preferences, ...prefs }
            }))
        }),
        {
            name: 'simskut-cookie-storage',
        }
    )
);
