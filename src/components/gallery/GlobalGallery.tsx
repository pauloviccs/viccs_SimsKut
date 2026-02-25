import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { getPublicPhotos } from '@/lib/galleryService';
import { PhotoLightbox } from './PhotoLightbox';
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
                                alt={photo.title || photo.description || 'Foto'}
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
