import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuthStore } from '@/store/authStore';
import { getPhotos } from '@/lib/galleryService';
import type { Photo } from '@/types';

interface GalleryPickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

/**
 * GalleryPicker — Modal para selecionar uma foto da galeria privada do usuário.
 * Imagina como um álbum de figurinhas: você abre, escolhe a que quer e cola no post.
 */
export function GalleryPicker({ onSelect, onClose }: GalleryPickerProps) {
    const { user } = useAuthStore();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getPhotos(user.id)
            .then((data) => setPhotos(data))
            .catch((err) => console.error('Gallery fetch error:', err))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-[500px] max-w-[90vw] max-h-[70vh] glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                            <ImageIcon size={18} className="text-[var(--accent-primary)]" />
                            Minha Galeria
                        </h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2
                                    size={24}
                                    className="text-[var(--accent-primary)] animate-spin"
                                />
                            </div>
                        ) : photos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-white/30">
                                <ImageIcon size={40} className="mb-3 opacity-40" />
                                <p className="text-sm">Nenhuma foto na galeria</p>
                                <p className="text-xs mt-1">
                                    Adicione fotos em "Minha Galeria" primeiro.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map((photo) => (
                                    <button
                                        key={photo.id}
                                        onClick={() => onSelect(photo.url)}
                                        className="relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all duration-150 cursor-pointer group"
                                    >
                                        <img
                                            src={photo.thumbnail_url || photo.url}
                                            alt={photo.description || 'Foto'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                        <GlassButton
                            variant="secondary"
                            onClick={onClose}
                            className="w-full text-sm"
                        >
                            Cancelar
                        </GlassButton>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
