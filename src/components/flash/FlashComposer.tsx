import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import { createFlash } from '@/lib/flashService';
import { toast } from 'sonner';

interface FlashComposerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function FlashComposer({ open, onClose, onSuccess }: FlashComposerProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    // Crop state
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Flash Stories ideal output is 9:16 vertical video equivalent
    const CROP_WIDTH = 225; // 9 * 25
    const CROP_HEIGHT = 400; // 16 * 25
    const OUTPUT_WIDTH = 1080;
    const OUTPUT_HEIGHT = 1920;

    const resetState = () => {
        if (imgSrc) URL.revokeObjectURL(imgSrc);
        setImgSrc(null);
        setImg(null);
        setCaption('');
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleClose = () => {
        if (loading) return;
        resetState();
        onClose();
    };

    const handleFile = (f: File) => {
        if (!f.type.startsWith('image/')) {
            toast.error('Apenas imagens são suportadas no momento.');
            return;
        }

        const url = URL.createObjectURL(f);
        setImgSrc(url);

        const image = new Image();
        image.onload = () => {
            setImg(image);
            const scaleX = CROP_WIDTH / image.width;
            const scaleY = CROP_HEIGHT / image.height;
            const fitScale = Math.max(scaleX, scaleY);

            setScale(fitScale);
            setOffset({
                x: (CROP_WIDTH - image.width * fitScale) / 2,
                y: (CROP_HEIGHT - image.height * fitScale) / 2,
            });
        };
        image.src = url;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

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
        setScale((s) => Math.max(0.1, Math.min(10, s + delta)));
    };

    const handleSubmit = async () => {
        if (!img) return;
        setLoading(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT_WIDTH;
            canvas.height = OUTPUT_HEIGHT;
            const ctx = canvas.getContext('2d')!;

            const srcX = -offset.x / scale;
            const srcY = -offset.y / scale;
            const srcSizeW = CROP_WIDTH / scale;
            const srcSizeH = CROP_HEIGHT / scale;

            ctx.drawImage(img, srcX, srcY, srcSizeW, srcSizeH, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Falha ao processar imagem recortada'));
                }, 'image/webp', 1.0); // O flashService já faz sua re-compressão de envio usando 0.82 de default no processo
            });

            await createFlash(blob, caption);
            toast.success('Flash publicado! ⚡');
            onSuccess();
            resetState();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao publicar Flash.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="glass-heavy rounded-[var(--radius-xl)] border border-white/15 w-full max-w-sm overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2">
                                <Zap size={18} className="text-[#007AFF]" />
                                <span className="text-white font-semibold text-base">Novo Flash</span>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Upload area / Preview */}
                        <div className="px-5">
                            {imgSrc ? (
                                <div className="flex flex-col items-center">
                                    <div
                                        ref={containerRef}
                                        className="relative rounded-[var(--radius-md)] overflow-hidden bg-black/40 border border-white/10 cursor-grab active:cursor-grabbing w-[225px] h-[400px]"
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt="preview"
                                            draggable={false}
                                            className="absolute pointer-events-none select-none"
                                            style={{
                                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                                transformOrigin: '0 0',
                                                maxWidth: 'none',
                                            }}
                                        />
                                        {/* Grid overlay */}
                                        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-[var(--radius-md)]">
                                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i} className="border border-white/[0.06]" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div className="flex items-center justify-center gap-3 mt-4 w-full px-4">
                                        <button
                                            onClick={() => adjustZoom(-0.1)}
                                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                                        >
                                            <ZoomOut size={16} />
                                        </button>
                                        <div className="text-xs text-white/30 w-12 text-center">
                                            {Math.round(scale * 100)}%
                                        </div>
                                        <button
                                            onClick={() => adjustZoom(0.1)}
                                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                                        >
                                            <ZoomIn size={16} />
                                        </button>
                                        <div className="flex-1" />
                                        {/* Cancel Select Button */}
                                        <button
                                            onClick={resetState}
                                            className="px-3 py-1.5 rounded-full bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10 text-xs transition-colors"
                                        >
                                            Trocar foto
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={e => e.preventDefault()}
                                    className="w-full aspect-[9/16] max-h-[300px] rounded-[var(--radius-md)] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-white/40 hover:bg-white/[0.03] transition-all cursor-pointer"
                                >
                                    <Upload size={28} className="text-white/30" />
                                    <span className="text-sm text-white/40">Clique ou arraste uma imagem</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                            />
                        </div>

                        {/* Caption */}
                        <div className="px-5 pt-3">
                            <textarea
                                value={caption}
                                onChange={e => setCaption(e.target.value.slice(0, 150))}
                                placeholder="Adicione uma legenda... (opcional)"
                                rows={2}
                                className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/30 resize-none outline-none border-none leading-relaxed"
                            />
                            <div className="text-right text-[10px] text-white/25 -mt-1">
                                {caption.length}/150
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 pb-5 pt-2 flex gap-2">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!imgSrc || loading}
                                className="flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                                style={{ background: imgSrc && !loading ? 'linear-gradient(135deg, #007AFF, #AF52DE)' : undefined, backgroundColor: !imgSrc ? 'rgba(255,255,255,0.08)' : undefined }}
                            >
                                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                                {loading ? 'Publicando...' : 'Publicar Flash'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
