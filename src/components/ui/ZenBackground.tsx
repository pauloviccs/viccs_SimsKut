import { useThemeStore } from '@/store/themeStore';
import { useEffect, useState } from 'react';

/**
 * ZenBackground — Replaces the previous static FluidBackground.
 * It strictly renders on desktop (`md:block hidden`) 
 * and applies the dynamic HSL dots managed by the `themeStore`.
 */
export function ZenBackground() {
    const { theme } = useThemeStore();
    const [noiseDataUrl, setNoiseDataUrl] = useState<string>('');

    // Generate lightweight SVG noise dynamically based on the noiseAmount
    useEffect(() => {
        if (theme.noiseAmount <= 0) {
            setNoiseDataUrl('');
            return;
        }
        const svg = `
            <svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'>
                <filter id='noise'>
                    <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
                </filter>
                <rect width='100%' height='100%' filter='url(#noise)' opacity='0.${Math.max(1, Math.floor(theme.noiseAmount / 2))}'/>
            </svg>
        `;
        const encoded = btoa(svg);
        setNoiseDataUrl(`url("data:image/svg+xml;base64,${encoded}")`);
    }, [theme.noiseAmount]);

    // Resolve dots into gradient string (used for CSS variable and for render when enabled)
    const radialGradients = theme.dots.map(dot => {
        const [h, s, l] = dot.hsl;
        const xPercent = (dot.x * 100).toFixed(1) + '%';
        const yPercent = (dot.y * 100).toFixed(1) + '%';
        return `radial-gradient(ellipse at ${xPercent} ${yPercent}, hsla(${h}, ${s}%, ${l}%, 0.8) 0%, transparent 70%)`;
    });
    const baseColor = `hsl(0, 0%, ${theme.lightness}%)`;
    const compositeBackground = theme.enabled ? [...radialGradients, baseColor].join(', ') : '#050508';

    // Expose gradient as CSS variable (so it's set even when disabled, for consistency)
    useEffect(() => {
        document.documentElement.style.setProperty('--gradient-bg', compositeBackground);
        return () => document.documentElement.style.removeProperty('--gradient-bg');
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
