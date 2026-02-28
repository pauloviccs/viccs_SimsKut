import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Moon, Sun, Sparkles, Plus, Minus } from 'lucide-react';
import { HarmonyAlgo, DotState } from '@/lib/zenTheme/HarmonyEngine';

const PALETTE_COLORS: [number, number, number][] = [
    [0, 0, 90],    // branco
    [350, 55, 72], // rosa
    [280, 45, 72], // lilás
    [0, 60, 65],   // vermelho
    [20, 70, 65],  // coral
    [50, 55, 70],  // amarelo
    [155, 55, 60], // verde
    [230, 35, 62], // slate
];

/** During drag we only update local state; store updates once on drag end to avoid freezing. */
type DragState = { id: number; x: number; y: number } | null;

export function ZenGradientPicker({ onSave }: { onSave: () => void }) {
    const { theme, updateLightness, updateNoise, updatePrimaryColor, updateAlgo, setDots } = useThemeStore();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<DragState>(null);

    // Desktop restrict note
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <GlassCard className="p-6">
                <p className="text-white/60 text-sm text-center">
                    A customização do Fundo Zen está disponível apenas na versão Desktop do aplicativo para garantir a melhor performance.
                </p>
            </GlassCard>
        );
    }

    const primaryDot = theme.dots.find(d => d.isPrimary);

    // Adds a random new secondary dot (max 3 total)
    const handleAddDot = () => {
        if (theme.dots.length >= 3) return;
        const newDot: DotState = {
            id: Date.now(),
            x: Math.random() * 0.6 + 0.2,
            y: Math.random() * 0.6 + 0.2,
            hsl: [Math.floor(Math.random() * 360), 60, 60],
            isPrimary: false
        };
        setDots([...theme.dots, newDot]);
    };

    // Removes the last secondary dot
    const handleRemoveDot = () => {
        const secondary = theme.dots.filter(d => !d.isPrimary);
        if (secondary.length === 0) return;
        const lastSecondaryId = secondary[secondary.length - 1].id;
        setDots(theme.dots.filter(d => d.id !== lastSecondaryId));
    };

    // Display dots: use dragging position while dragging, otherwise theme.dots (avoids store updates during drag)
    const displayDots = dragging
        ? theme.dots.map(d => (d.id === dragging.id ? { ...d, x: dragging.x, y: dragging.y } : d))
        : theme.dots;

    const gradientStops = displayDots.map(dot => {
        const xPercent = (dot.x * 100).toFixed(1) + '%';
        const yPercent = (dot.y * 100).toFixed(1) + '%';
        const [h, s, l] = dot.hsl;
        return `radial-gradient(ellipse at ${xPercent} ${yPercent}, hsla(${h}, ${s}%, ${l}%, 0.8) 0%, transparent 70%)`;
    });
    const boxBackground = [...gradientStops, `hsl(0, 0%, ${theme.lightness}%)`].join(', ');

    return (
        <GlassCard className="overflow-hidden flex flex-col items-center max-w-sm mx-auto p-4 gap-4">

            {/* Header / Mode Buttons */}
            <div className="flex gap-4 mb-2">
                <button
                    onClick={() => updateLightness(12)}
                    className={`p-2 rounded-lg transition-colors ${theme.lightness < 20 && theme.lightness > 8 ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title="Padrão Escuro (Sparks)"
                >
                    <Sparkles size={18} className="text-white" />
                </button>
                <button
                    onClick={() => updateLightness(58)}
                    className={`p-2 rounded-lg transition-colors ${theme.lightness > 40 ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title="Modo Claro"
                >
                    <Sun size={18} className="text-white" />
                </button>
                <button
                    onClick={() => updateLightness(5)}
                    className={`p-2 rounded-lg transition-colors ${theme.lightness <= 8 ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title="Modo Noturno Extremo (AMOLED)"
                >
                    <Moon size={18} className="text-white" />
                </button>
            </div>

            {/* Interactive Canvas Box */}
            <div
                ref={canvasRef}
                className="relative w-full aspect-square rounded-xl border border-white/10 cursor-crosshair overflow-hidden"
                style={{
                    background: boxBackground,
                    /* Pure CSS Dot Grid Pattern Overlay */
                    backgroundImage: `radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), ${boxBackground}`,
                    backgroundSize: '20px 20px, 100% 100%'
                }}
            >
                {/* Noise preview so "Ruído" slider has visible feedback */}
                {theme.noiseAmount > 0 && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml;base64,${btoa(
                                `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='np'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#np)' opacity='${((theme.noiseAmount / 100) * 0.7 + 0.15).toFixed(2)}'/></svg>`
                            )}")`,
                            mixBlendMode: 'overlay',
                            opacity: 0.9
                        }}
                    />
                )}
                {displayDots.map(dot => (
                    <motion.div
                        key={dot.id}
                        drag
                        dragMomentum={false}
                        dragConstraints={canvasRef}
                        onDragStart={() => setDragging({ id: dot.id, x: dot.x, y: dot.y })}
                        onDrag={(_, info) => {
                            const rect = canvasRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            const x = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width));
                            const y = Math.max(0, Math.min(1, (info.point.y - rect.top) / rect.height));
                            setDragging(prev => prev && prev.id === dot.id ? { ...prev, x, y } : prev);
                        }}
                        onDragEnd={(_, info) => {
                            const rect = canvasRef.current?.getBoundingClientRect();
                            if (!rect) {
                                setDragging(null);
                                return;
                            }
                            const x = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width));
                            const y = Math.max(0, Math.min(1, (info.point.y - rect.top) / rect.height));
                            const newDots = theme.dots.map(d =>
                                d.id === dot.id ? { ...d, x, y } : d
                            );
                            setDots(newDots);
                            setDragging(null);
                        }}
                        style={{
                            left: `${dot.x * 100}%`,
                            top: `${dot.y * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: `hsl(${dot.hsl[0]}, ${dot.hsl[1]}%, ${dot.hsl[2]}%)`,
                        }}
                        className={`absolute rounded-full border-[3px] border-white/90 cursor-grab active:cursor-grabbing transition-shadow ${dot.isPrimary ? 'w-11 h-11 shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.5)]' : 'w-7 h-7'}`}
                    />
                ))}
            </div>

            {/* Dot Controls */}
            <div className="flex items-center gap-4 text-white/70">
                <button onClick={handleAddDot} disabled={theme.dots.length >= 3} className="p-2 hover:bg-white/10 rounded disabled:opacity-30">
                    <Plus size={16} />
                </button>
                <button onClick={handleRemoveDot} disabled={theme.dots.length <= 1} className="p-2 hover:bg-white/10 rounded disabled:opacity-30">
                    <Minus size={16} />
                </button>
                <div className="w-px h-6 bg-white/20 mx-2" />
                <select
                    value={theme.algo}
                    onChange={(e) => updateAlgo(e.target.value as HarmonyAlgo)}
                    className="bg-transparent border border-white/20 rounded p-1 text-sm outline-none cursor-pointer"
                >
                    <option value="complement" className="text-black">Complementar</option>
                    <option value="triadic" className="text-black">Triádica</option>
                    <option value="analogous" className="text-black">Análoga</option>
                    <option value="split" className="text-black">Secante</option>
                    <option value="tetradic" className="text-black">Tetrádica</option>
                </select>
            </div>

            {/* Colors Palette (Changes Primary Dot) */}
            <div className="flex gap-2 p-2 overflow-x-auto w-full justify-center">
                {PALETTE_COLORS.map((hsl, i) => (
                    <button
                        key={i}
                        className={`w-8 h-8 rounded-full shrink-0 flex-none border-2 transition-all ${primaryDot && Math.abs(primaryDot.hsl[0] - hsl[0]) < 10 ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` }}
                        onClick={() => updatePrimaryColor(hsl)}
                    />
                ))}
            </div>

            {/* Sliders */}
            <div className="w-full space-y-4 px-2 mt-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-12">Brilho</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={theme.lightness}
                        onChange={(e) => updateLightness(Number(e.target.value))}
                        className="flex-1 accent-white/50 h-1 bg-white/10 rounded-full appearance-none outline-none"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-12">Ruído</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={theme.noiseAmount}
                        onChange={(e) => updateNoise(Number(e.target.value))}
                        className="flex-1 accent-white/50 h-1 bg-white/10 rounded-full appearance-none outline-none"
                    />
                </div>
            </div>

            {/* Save Button for Database Storage */}
            <div className="mt-4 w-full">
                <GlassButton variant="primary" onClick={onSave} className="w-full">
                    Aplicar Fundo Zen
                </GlassButton>
            </div>

        </GlassCard>
    );
}
