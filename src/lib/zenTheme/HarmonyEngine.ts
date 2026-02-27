/**
 * HarmonyEngine.ts - Core math for Zen Gradient colors
 * Transpiled from the original Zen Browser implementation to pure TypeScript.
 */

export const COLOR_HARMONIES = {
    complement: { angles: [180] },
    triadic: { angles: [120, 240] },
    analogous: { angles: [30, -30] },
    split: { angles: [150, 210] },
    tetradic: { angles: [90, 180, 270] },
};

export type HarmonyAlgo = keyof typeof COLOR_HARMONIES;

export interface DotState {
    id: number;
    x: number;
    y: number;
    hsl: [number, number, number];
    isPrimary: boolean;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Calculates the secondary dots positions and colors based on a primary dot
 */
export function calculateComplements(
    primaryDot: Pick<DotState, 'hsl'>,
    algo: HarmonyAlgo = 'complement',
    radiusScale: number = 0.4
): Array<{ x: number; y: number; hsl: [number, number, number] }> {
    const harmony = COLOR_HARMONIES[algo] || COLOR_HARMONIES.complement;
    const [primaryH, primaryS, primaryL] = primaryDot.hsl;

    const centerX = 0.5;
    const centerY = 0.5;

    return harmony.angles.map((angle) => {
        const newHue = (primaryH + angle + 360) % 360;

        // Position on a circle around center, radius depends on saturation
        const rad = (newHue / 360) * 2 * Math.PI;
        const satRatio = primaryS / 100;

        const x = centerX + radiusScale * satRatio * Math.cos(rad);
        const y = centerY + radiusScale * satRatio * Math.sin(rad);

        return {
            x: Math.max(0.05, Math.min(0.95, x)), // clamp to bounds
            y: Math.max(0.05, Math.min(0.95, y)),
            hsl: [newHue, primaryS, primaryL],
        };
    });
}
