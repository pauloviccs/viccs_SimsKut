import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader2, Heart, MessageSquare, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { getPublicPhotos } from '@/lib/galleryService';
import { PhotoLightbox } from './PhotoLightbox';
import type { Photo } from '@/types';
import { useNavigate } from 'react-router-dom';

export function GlobalGallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        getPublicPhotos(30, 0) // Limit to top 30 recent
            .then((data) => {
                if (mounted) {
                    setPhotos(data);
                }
            })
            .catch(console.error)
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    // Auto-advance logic
    useEffect(() => {
        if (photos.length <= 1 || isPaused || selectedPhoto) return;

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [photos.length, isPaused, selectedPhoto]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setIsPaused(true); // pause explicitly on manual nav
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
        setIsPaused(true);
    };

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight text-center lg:text-left w-full">
                Galeria Global
            </h2>

            {loading ? (
                <div className="flex justify-center p-20 w-full glass-heavy rounded-[var(--radius-xl)] border border-white/5 shadow-2xl">
                    <Loader2 size={32} className="animate-spin text-white/30" />
                </div>
            ) : photos.length === 0 ? (
                <GlassCard className="text-center py-12 w-full">
                    <Image size={40} className="mx-auto mb-4 text-white/30" />
                    <h2 className="text-lg font-semibold text-white/70 mb-2">Galeria vazia</h2>
                    <p className="text-sm text-white/40">
                        Nenhuma foto pública compartilhada ainda. Que tal ser o primeiro? 📸
                    </p>
                </GlassCard>
            ) : (
                <div
                    className="relative w-full max-w-2xl aspect-[4/5] sm:aspect-square md:aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group bg-black/50"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Carousel Rendering */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.5 } }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => setSelectedPhoto(photos[currentIndex])}
                        >
                            <img
                                src={photos[currentIndex].url}
                                alt={photos[currentIndex].title || 'Global Gallery Image'}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Gradient Overlay ensuring text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                    {/* Left/Right Nav (Visible on Hover) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev() }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext() }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Play/Pause Indicator */}
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused) }}
                            className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
                        </button>
                    </div>

                    {/* Bottom Information Panel (Liquid Glass style) */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 flex flex-col gap-3 pointer-events-none">
                        <motion.div
                            key={`info-${currentIndex}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="w-full pointer-events-auto"
                        >
                            {/* User Header */}
                            <div
                                className="flex items-center gap-3 mb-3 cursor-pointer w-fit p-2 pr-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
                                onClick={() => navigate(`/profile/${photos[currentIndex].owner?.username}`)}
                            >
                                <Avatar
                                    src={photos[currentIndex].owner?.avatar_url}
                                    alt={photos[currentIndex].owner?.display_name || 'User'}
                                    size="sm"
                                    className="border-2 border-[var(--accent-primary)]/50"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold tracking-tight text-white leading-none">
                                        {photos[currentIndex].owner?.display_name || 'Anônimo'}
                                    </span>
                                    <span className="text-[11px] text-[var(--accent-tertiary)] font-medium">
                                        @{photos[currentIndex].owner?.username}
                                    </span>
                                </div>
                            </div>

                            {/* Description Block */}
                            {photos[currentIndex].description && (
                                <div className="glass-panel p-4 rounded-xl border border-white/5 mb-4 shadow-lg backdrop-blur-lg">
                                    <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                                        {photos[currentIndex].description}
                                    </p>
                                </div>
                            )}

                            {/* Interaction Stats */}
                            <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/5">
                                    <Heart size={14} className={photos[currentIndex].liked_by_me ? "fill-[var(--accent-primary)] text-[var(--accent-primary)]" : ""} />
                                    <span>{photos[currentIndex].likes_count || 0} acessos</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/5">
                                    <MessageSquare size={14} />
                                    <span>{photos[currentIndex].comments_count || 0} comentários</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Progress Bar */}
                    {!isPaused && (
                        <motion.div
                            key={`progress-${currentIndex}`}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-[var(--accent-primary)] opacity-70 z-20"
                        />
                    )}
                </div>
            )}

            {/* Pagination Dots */}
            {photos.length > 1 && (
                <div className="flex gap-1.5 mt-6 justify-center flex-wrap max-w-md">
                    {photos.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx
                                    ? 'w-6 bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.8)]'
                                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                                }`}
                            aria-label={`Ir para a imagem ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox for zooming details */}
            <AnimatePresence>
                {selectedPhoto && (
                    <PhotoLightbox
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onPhotoUpdate={(updated) => {
                            setSelectedPhoto(updated);
                            setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
