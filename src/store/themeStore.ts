import { create } from 'zustand';
import { calculateComplements, HarmonyAlgo, DotState } from '@/lib/zenTheme/HarmonyEngine';

export interface ZenThemeConfig {
    enabled: boolean;        // Turn on/off the gradient effect altogether
    dots: DotState[];
    lightness: number;       // 0-100 base background brightness
    noiseAmount: number;     // 0-100 intensity of SVGTurbulence overlay
    algo: HarmonyAlgo;
}

export const DEFAULT_ZEN_THEME: ZenThemeConfig = {
    enabled: true,
    lightness: 5,            // Default dark AMOLED-like
    noiseAmount: 30,         // Slight noise
    algo: 'complement',
    dots: [
        { id: 1, x: 0.65, y: 0.35, hsl: [230, 60, 50], isPrimary: true }, // Deep blue
        { id: 2, x: 0.3, y: 0.6, hsl: [50, 60, 50], isPrimary: false } // Gold complement
    ]
};

const ALGOS: HarmonyAlgo[] = ['complement', 'triadic', 'analogous', 'split', 'tetradic'];

/** Normalizes raw JSON from DB (profile.zen_background) into ZenThemeConfig */
export function normalizeZenThemeConfig(raw: unknown): ZenThemeConfig {
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_ZEN_THEME };
    const o = raw as Record<string, unknown>;
    const dots = Array.isArray(o.dots)
        ? (o.dots as unknown[]).map((d, i) => {
            const dot = d as Record<string, unknown>;
            const hsl = Array.isArray(dot.hsl) && dot.hsl.length === 3
                ? (dot.hsl as [number, number, number])
                : DEFAULT_ZEN_THEME.dots[i]?.hsl ?? [230, 60, 50];
            return {
                id: typeof dot.id === 'number' ? dot.id : i + 1,
                x: typeof dot.x === 'number' ? dot.x : 0.5,
                y: typeof dot.y === 'number' ? dot.y : 0.5,
                hsl,
                isPrimary: dot.isPrimary === true,
            } as DotState;
        })
        : DEFAULT_ZEN_THEME.dots;
    return {
        enabled: o.enabled !== false,
        dots: dots.length ? dots : DEFAULT_ZEN_THEME.dots,
        lightness: typeof o.lightness === 'number' ? Math.max(0, Math.min(100, o.lightness)) : DEFAULT_ZEN_THEME.lightness,
        noiseAmount: typeof o.noiseAmount === 'number' ? Math.max(0, Math.min(100, o.noiseAmount)) : DEFAULT_ZEN_THEME.noiseAmount,
        algo: typeof o.algo === 'string' && ALGOS.includes(o.algo as HarmonyAlgo) ? (o.algo as HarmonyAlgo) : 'complement',
    };
}

interface ThemeStoreState {
    theme: ZenThemeConfig;

    // Actions
    setTheme: (config: ZenThemeConfig) => void;
    updateLightness: (val: number) => void;
    updateNoise: (val: number) => void;
    updatePrimaryColor: (hsl: [number, number, number]) => void;
    updateAlgo: (algo: HarmonyAlgo) => void;
    setDots: (dots: DotState[]) => void;
    resetTheme: () => void;

    // We update DB externally when the save button in settings is clicked,
    // to avoid overloading the Supabase RPC with active slider changes.
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
    theme: { ...DEFAULT_ZEN_THEME },

    setTheme: (config) => set({ theme: config }),

    updateLightness: (val) => set((state) => ({
        theme: { ...state.theme, lightness: val }
    })),

    updateNoise: (val) => set((state) => ({
        theme: { ...state.theme, noiseAmount: val }
    })),

    updatePrimaryColor: (hsl) => {
        const { theme } = get();
        const newDots = [...theme.dots];
        const pIndex = newDots.findIndex(d => d.isPrimary);

        if (pIndex === -1) return;

        // Update Primary
        newDots[pIndex] = { ...newDots[pIndex], hsl };

        // Auto-recalc secondary dots
        const secondaryDots = newDots.filter(d => !d.isPrimary);
        const complements = calculateComplements(newDots[pIndex], theme.algo);

        let subIndex = 0;
        for (let i = 0; i < newDots.length; i++) {
            if (!newDots[i].isPrimary && complements[subIndex]) {
                newDots[i] = {
                    ...newDots[i],
                    x: complements[subIndex].x,
                    y: complements[subIndex].y,
                    hsl: complements[subIndex].hsl
                };
                subIndex++;
            }
        }

        set({ theme: { ...theme, dots: newDots } });
    },

    updateAlgo: (algo) => {
        set((state) => ({ theme: { ...state.theme, algo } }));
        // Recalculate dots given the new algorithm based on the current primary dot
        const { theme } = get();
        const primary = theme.dots.find(d => d.isPrimary);
        if (primary) {
            get().updatePrimaryColor(primary.hsl);
        }
    },

    setDots: (dots) => set((state) => ({ theme: { ...state.theme, dots } })),

    resetTheme: () => set({ theme: { ...DEFAULT_ZEN_THEME } })
}));
