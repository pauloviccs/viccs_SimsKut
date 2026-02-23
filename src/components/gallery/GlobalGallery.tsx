import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader2, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { getPublicPhotos } from '@/lib/galleryService';
import type { Photo } from '@/types';

export function GlobalGallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    useEffect(() => {
        let mounted = true;
        getPublicPhotos(60, 0)
            .then((data) => { if (mounted) setPhotos(data); })
            .catch(console.error)
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    return (
        <div>
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-6"
            >
                Galeria Global
            </motion.h1>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-white/30" />
                </div>
            ) : photos.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <Image size={40} className="mx-auto mb-4 text-white/30" />
                    <h2 className="text-lg font-semibold text-white/70 mb-2">Galeria vazia</h2>
                    <p className="text-sm text-white/40">
                        Nenhuma foto pública compartilhada ainda. Que tal ser o primeiro? 📸
                    </p>
                </GlassCard>
            ) : (
                <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                    {photos.map((photo) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="break-inside-avoid glass-heavy rounded-[var(--radius-md)] border border-white/10 overflow-hidden cursor-pointer group"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img
                                src={photo.thumbnail_url || photo.url}
                                alt={photo.description || 'Foto'}
                                loading="lazy"
                                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="p-2 flex items-center gap-2">
                                <Avatar
                                    src={photo.owner?.avatar_url}
                                    alt={photo.owner?.display_name || 'User'}
                                    size="sm"
                                />
                                <span className="text-[11px] text-white/50 truncate">
                                    {photo.owner?.display_name || 'Anônimo'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-3xl max-h-[90vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.description || 'Foto'}
                                className="w-full max-h-[80vh] object-contain rounded-[var(--radius-lg)]"
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                            <div className="mt-3 flex items-center gap-3">
                                <Avatar
                                    src={selectedPhoto.owner?.avatar_url}
                                    alt={selectedPhoto.owner?.display_name || 'User'}
                                    size="md"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white/90">
                                        {selectedPhoto.owner?.display_name || 'Anônimo'}
                                    </p>
                                    {selectedPhoto.description && (
                                        <p className="text-xs text-white/50 mt-0.5">{selectedPhoto.description}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
