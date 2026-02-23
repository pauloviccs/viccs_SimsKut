import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

interface AvatarCropperProps {
    file: File;
    onCrop: (blob: Blob) => void;
    onCancel: () => void;
}

/**
 * AvatarCropper — Modal liquid glass para recortar foto de perfil.
 * Imagina como um estúdio fotográfico: você posiciona a moldura sobre a foto.
 * O resultado é sempre um quadrado 300×300.
 */
export function AvatarCropper({ file, onCrop, onCancel }: AvatarCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imgSrc, setImgSrc] = useState('');
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);

    const CROP_SIZE = 260; // px visible crop area
    const OUTPUT_SIZE = 300;

    // Carrega a imagem
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImgSrc(url);

        const image = new Image();
        image.onload = () => {
            setImg(image);
            // Centraliza a imagem para que o menor lado preencha o crop
            const fitScale = CROP_SIZE / Math.min(image.width, image.height);
            setScale(fitScale);
            setOffset({
                x: (CROP_SIZE - image.width * fitScale) / 2,
                y: (CROP_SIZE - image.height * fitScale) / 2,
            });
        };
        image.src = url;

        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Drag handlers
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

    const handlePointerUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Zoom
    const adjustZoom = (delta: number) => {
        setScale((s) => Math.max(0.1, Math.min(5, s + delta)));
    };

    // Crop final
    const handleCrop = async () => {
        if (!img) return;
        setProcessing(true);

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d')!;

        // Calcula a área da imagem original que corresponde ao crop visível
        const srcX = -offset.x / scale;
        const srcY = -offset.y / scale;
        const srcSize = CROP_SIZE / scale;

        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

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
                    className="relative w-[360px] max-w-[90vw] glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-white/90">Recortar Foto</h3>
                        <button
                            onClick={onCancel}
                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Crop Area */}
                    <div
                        ref={containerRef}
                        className="relative mx-auto rounded-[var(--radius-md)] overflow-hidden bg-black/40 border border-white/10 cursor-grab active:cursor-grabbing"
                        style={{ width: CROP_SIZE, height: CROP_SIZE }}
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
                        {/* Grid overlay */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-[var(--radius-md)]">
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="border border-white/[0.06]" />
                                ))}
                            </div>
                        </div>
                        {/* Corner circles */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br-sm" />
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            onClick={() => adjustZoom(-0.1)}
                            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <div className="text-xs text-white/30 w-12 text-center">
                            {Math.round(scale * 100)}%
                        </div>
                        <button
                            onClick={() => adjustZoom(0.1)}
                            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-5">
                        <GlassButton
                            variant="secondary"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Cancelar
                        </GlassButton>
                        <GlassButton
                            onClick={handleCrop}
                            isLoading={processing}
                            className="flex-1"
                        >
                            <span className="flex items-center gap-2">
                                <Check size={16} />
                                Salvar
                            </span>
                        </GlassButton>
                    </div>
                </motion.div>
            </motion.div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
        </AnimatePresence>
    );
}
