import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

interface BannerCropperProps {
    file: File;
    onCrop: (blob: Blob) => void;
    onCancel: () => void;
}

/** Proporção 3:1 do banner de perfil */
const CROP_WIDTH = 360;
const CROP_HEIGHT = 120;
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 300;

/**
 * BannerCropper — Modal liquid glass para recortar banner (3:1).
 * Mesmo padrão visual do AvatarCropper; resultado 900×300.
 */
export function BannerCropper({ file, onCrop, onCancel }: BannerCropperProps) {
    const [imgSrc, setImgSrc] = useState('');
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImgSrc(url);

        const image = new Image();
        image.onload = () => {
            setImg(image);
            // Preenche a área 3:1 (cover): escala para cobrir o retângulo
            const scaleW = CROP_WIDTH / image.width;
            const scaleH = CROP_HEIGHT / image.height;
            const fitScale = Math.max(scaleW, scaleH);
            setScale(fitScale);
            setOffset({
                x: (CROP_WIDTH - image.width * fitScale) / 2,
                y: (CROP_HEIGHT - image.height * fitScale) / 2,
            });
        };
        image.src = url;

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }, [offset]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [dragging, dragStart]);

    const handlePointerUp = useCallback(() => setDragging(false), []);

    const adjustZoom = (delta: number) => {
        setScale((s) => Math.max(0.1, Math.min(5, s + delta)));
    };

    const handleCrop = async () => {
        if (!img) return;
        setProcessing(true);

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;
        const ctx = canvas.getContext('2d')!;

        const srcX = -offset.x / scale;
        const srcY = -offset.y / scale;
        const srcW = CROP_WIDTH / scale;
        const srcH = CROP_HEIGHT / scale;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        canvas.toBlob(
            (blob) => {
                setProcessing(false);
                if (blob) onCrop(blob);
            },
            'image/jpeg',
            0.85
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-[400px] max-w-[90vw] glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-white/90">Recortar banner</h3>
                        <button
                            onClick={onCancel}
                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div
                        className="relative mx-auto rounded-[var(--radius-md)] overflow-hidden bg-black/40 border border-white/10 cursor-grab active:cursor-grabbing"
                        style={{ width: CROP_WIDTH, height: CROP_HEIGHT }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {imgSrc && (
                            <img
                                src={imgSrc}
                                alt="Crop preview"
                                draggable={false}
                                className="absolute pointer-events-none select-none"
                                style={{
                                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                    transformOrigin: '0 0',
                                    maxWidth: 'none',
                                }}
                            />
                        )}
                        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-[var(--radius-md)]">
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-1">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="border border-white/[0.06]" />
                                ))}
                            </div>
                        </div>
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br-sm" />
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => adjustZoom(-0.1)}
                            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <div className="text-xs text-white/30 w-12 text-center">
                            {Math.round(scale * 100)}%
                        </div>
                        <button
                            type="button"
                            onClick={() => adjustZoom(0.1)}
                            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <div className="flex gap-3 mt-5">
                        <GlassButton variant="secondary" onClick={onCancel} className="flex-1">
                            Cancelar
                        </GlassButton>
                        <GlassButton onClick={handleCrop} isLoading={processing} className="flex-1">
                            <span className="flex items-center gap-2">
                                <Check size={16} />
                                Salvar
                            </span>
                        </GlassButton>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
