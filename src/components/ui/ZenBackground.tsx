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
    const temporaryOverride = useThemeStore((s) => s.temporaryOverride);
    const effectiveTheme = temporaryOverride ?? theme;
    const [noiseDataUrl, setNoiseDataUrl] = useState<string>('');
    const compositeBackground = useMemo(
        () => buildCompositeBackground(effectiveTheme.enabled, effectiveTheme.lightness, effectiveTheme.dots),
        [effectiveTheme.enabled, effectiveTheme.lightness, effectiveTheme.dots]
    );

    // Noise texture: opacity scales with theme.noiseAmount so the slider has clear effect.
    useEffect(() => {
        if (effectiveTheme.noiseAmount <= 0) {
            setNoiseDataUrl('');
            return;
        }
        const t = setTimeout(() => {
            // Opacity 0.15–0.85 so the "Ruído" slider has a clearly visible effect
            const opacity = (effectiveTheme.noiseAmount / 100) * 0.7 + 0.15;
            const svg = `
            <svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'>
                <filter id='n'>
                    <feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/>
                </filter>
                <rect width='100%' height='100%' filter='url(#n)' opacity='${opacity.toFixed(2)}'/>
            </svg>
        `;
            setNoiseDataUrl(`url("data:image/svg+xml;base64,${btoa(svg)}")`);
        }, 80);
        return () => clearTimeout(t);
    }, [effectiveTheme.noiseAmount]);

    // Set --gradient-bg on :root so AppShell container (and any consumer) shows the gradient.
    // Set --zen-noise-bg so the same container can show noise on top (fix: noise was only in ZenBackground div and not visible).
    useLayoutEffect(() => {
        document.documentElement.style.setProperty('--gradient-bg', compositeBackground);
        if (effectiveTheme.enabled && effectiveTheme.noiseAmount > 0 && noiseDataUrl) {
            const opacity = (effectiveTheme.noiseAmount / 100) * 0.7 + 0.15;
            document.documentElement.style.setProperty('--zen-noise-bg', noiseDataUrl);
            document.documentElement.style.setProperty('--zen-noise-opacity', String(opacity * 0.9));
        } else {
            document.documentElement.style.removeProperty('--zen-noise-bg');
            document.documentElement.style.removeProperty('--zen-noise-opacity');
        }
        return () => {
            document.documentElement.style.removeProperty('--gradient-bg');
            document.documentElement.style.removeProperty('--zen-noise-bg');
            document.documentElement.style.removeProperty('--zen-noise-opacity');
        };
    }, [compositeBackground, effectiveTheme.enabled, effectiveTheme.noiseAmount, noiseDataUrl]);

    if (!effectiveTheme.enabled) {
        return (
            <div className="fixed inset-0 -z-10 bg-[#050508]" aria-hidden="true" />
        );
    }

    const isLightMode = effectiveTheme.lightness > 40;

    // Gradient + noise are applied on the AppShell container via CSS vars (--gradient-bg, --zen-noise-bg).
    // Here we only render the optional contrast overlay for light mode.
    return (
        <>
            {isLightMode && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500"
                    style={{
                        backgroundColor: 'black',
                        opacity: 0.35
                    }}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
