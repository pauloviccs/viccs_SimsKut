import { useThemeStore } from '@/store/themeStore';
import { useEffect, useLayoutEffect, useState, useMemo } from 'react';

/** Build gradient string only when inputs change (stable deps to avoid redundant work). */
function buildCompositeBackground(
    enabled: boolean,
    lightness: number,
    dots: Array<{ x: number; y: number; hsl: [number, number, number] }>
): string {
    if (!enabled) return '#050508';
    const radialGradients = dots.map(dot => {
        const [h, s, l] = dot.hsl;
        const xPercent = (dot.x * 100).toFixed(1) + '%';
        const yPercent = (dot.y * 100).toFixed(1) + '%';
        return `radial-gradient(ellipse at ${xPercent} ${yPercent}, hsla(${h}, ${s}%, ${l}%, 0.8) 0%, transparent 70%)`;
    });
    const baseColor = `hsl(0, 0%, ${lightness}%)`;
    return [...radialGradients, baseColor].join(', ');
}

/**
 * ZenBackground — Replaces the previous static FluidBackground.
 * Optimized: store updates only on drag end (picker), memoized gradient, throttled DOM write, debounced noise.
 */
export function ZenBackground() {
    const theme = useThemeStore((s) => s.theme);
    const [noiseDataUrl, setNoiseDataUrl] = useState<string>('');
    const compositeBackground = useMemo(
        () => buildCompositeBackground(theme.enabled, theme.lightness, theme.dots),
        [theme.enabled, theme.lightness, theme.dots]
    );

    // Debounce noise texture update (avoids heavy btoa/setState on every slider tick)
    useEffect(() => {
        if (theme.noiseAmount <= 0) {
            setNoiseDataUrl('');
            return;
        }
        const t = setTimeout(() => {
            const svg = `
            <svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'>
                <filter id='noise'>
                    <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
                </filter>
                <rect width='100%' height='100%' filter='url(#noise)' opacity='0.${Math.max(1, Math.floor(theme.noiseAmount / 2))}'/>
            </svg>
        `;
            setNoiseDataUrl(`url("data:image/svg+xml;base64,${btoa(svg)}")`);
        }, 120);
        return () => clearTimeout(t);
    }, [theme.noiseAmount]);

    // Set --gradient-bg on :root so AppShell container (and any consumer) shows the gradient.
    // useLayoutEffect so it runs before paint and the container never flashes default bg.
    useLayoutEffect(() => {
        document.documentElement.style.setProperty('--gradient-bg', compositeBackground);
        return () => {
            document.documentElement.style.removeProperty('--gradient-bg');
        };
    }, [compositeBackground]);

    if (!theme.enabled) {
        return (
            <div className="fixed inset-0 -z-10 bg-[#050508]" aria-hidden="true" />
        );
    }

    const isLightMode = theme.lightness > 40;

    return (
        <div
            className="fixed inset-0 -z-10 overflow-hidden md:block hidden transition-colors duration-500 ease-in-out"
            style={{ background: compositeBackground }}
            aria-hidden="true"
        >
            {/* Protective Contrast Layer — If the user sets a very bright background, 
                we add a subtle dark wash to ensure GlassCards and Text remain readable 
                since the app layout assumes a dark theme. */}
            <div
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{
                    backgroundColor: 'black',
                    opacity: isLightMode ? 0.35 : 0
                }}
            />

            {/* Noise Layer */}
            {noiseDataUrl && (
                <div
                    className="absolute inset-0 pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: noiseDataUrl, opacity: 0.8 }}
                />
            )}
        </div>
    );
}
