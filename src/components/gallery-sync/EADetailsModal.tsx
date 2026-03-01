import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Star } from 'lucide-react';
import { DLCBadges } from './DLCBadges';
import type { EaGalleryItem } from '@/lib/eaGalleryService';

interface EADetailsModalProps {
    item: EaGalleryItem | null;
    onClose: () => void;
}

export function EADetailsModal({ item, onClose }: EADetailsModalProps) {
    return (
        <AnimatePresence>
            {item && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        layoutId={`ea-card-${item.ea_original_id}`}
                        className="relative w-full max-w-3xl mx-4 rounded-3xl glass-heavy border border-white/15 overflow-hidden"
                        initial={{ y: 32, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 32, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header imagem */}
                        <div className="relative w-full aspect-video overflow-hidden">
                            {item.thumbnail_url ? (
                                <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#007AFF]/50 via-[#5865F2]/40 to-[#34C759]/40" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/80 cursor-pointer"
                                aria-label="Fechar detalhes"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-white/95 drop-shadow-sm">
                                        {item.title}
                                    </h2>
                                    <DLCBadges packs={item.packs_needed} />
                                </div>
                                <div className="flex gap-3 text-xs text-white/70">
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/8 border border-white/15 backdrop-blur-md">
                                        <Download size={14} />
                                        <span>{item.download_count ?? 0} downloads</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/8 border border-white/15 backdrop-blur-md">
                                        <Star size={14} className="text-yellow-400" />
                                        <span>{item.favorite_count ?? 0} favoritos</span>
                                    </div>
                                </div>
                            </div>

                            {item.original_comments && (
                                <div className="mt-4 max-h-52 overflow-y-auto pr-1">
                                    <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
                                        {typeof item.original_comments === 'string'
                                            ? item.original_comments
                                            : JSON.stringify(item.original_comments, null, 2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

