import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface MediaLightboxProps {
    /** Lista de URLs de mídia (imagens/GIFs) */
    urls: string[];
    /** Índice inicial (0-based) */
    initialIndex?: number;
    onClose: () => void;
}

/**
 * Lightbox genérico para visualização em tela cheia de mídias (feed, etc.).
 * Mesmo padrão visual do PhotoLightbox: overlay escuro, blur, botão fechar.
 */
export function MediaLightbox({ urls, initialIndex = 0, onClose }: MediaLightboxProps) {
    const [index, setIndex] = useState(Math.min(Math.max(0, initialIndex), urls.length - 1));
    const hasMultiple = urls.length > 1;

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (hasMultiple && e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : urls.length - 1));
            if (hasMultiple && e.key === 'ArrowRight') setIndex((i) => (i < urls.length - 1 ? i + 1 : 0));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, hasMultiple, urls.length]);

    if (urls.length === 0) return null;

    const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : urls.length - 1));
    const goNext = () => setIndex((i) => (i < urls.length - 1 ? i + 1 : 0));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-6xl w-full h-full flex flex-col bg-[#08080b] md:rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute z-[60] top-3 right-3 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 cursor-pointer transition-colors"
                        title="Fechar (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center bg-black/60 relative min-h-0 p-4">
                    {hasMultiple && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                className="absolute left-2 md:left-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 cursor-pointer transition-colors"
                                title="Anterior"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goNext(); }}
                                className="absolute right-2 md:right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 cursor-pointer transition-colors"
                                title="Próximo"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <img
                                src={urls[index]}
                                alt=""
                                className="max-w-full max-h-full object-contain md:rounded-[var(--radius-md)] select-none"
                                draggable={false}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {hasMultiple && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white/70">
                        {index + 1} / {urls.length}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
