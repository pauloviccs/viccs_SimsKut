import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EAItemCard } from './EAItemCard';
import { EADetailsModal } from './EADetailsModal';
import type { EaGalleryItem } from '@/lib/eaGalleryService';

interface GalleryGridProps {
    items: EaGalleryItem[];
    selectedIds: string[];
    onToggleSelect: (eaOriginalId: string) => void;
}

const PAGE_SIZE = 8;

export function GalleryGrid({ items, selectedIds, onToggleSelect }: GalleryGridProps) {
    const [page, setPage] = useState(0);
    const [focusedItem, setFocusedItem] = useState<EaGalleryItem | null>(null);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages - 1);
    const start = currentPage * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    const handleNext = () => {
        setPage((p) => (p + 1 < totalPages ? p + 1 : p));
    };

    const handlePrev = () => {
        setPage((p) => (p - 1 >= 0 ? p - 1 : p));
    };

    const totalSelected = selectedIds.length;

    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/70">
                    <span className="font-semibold text-white/90">{totalSelected}</span>
                    <span className="text-white/60"> / 50 itens selecionados para a vitrine</span>
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentPage === 0}
                            className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 disabled:opacity-30 disabled:cursor-default hover:bg-white/10 cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span>
                            Página {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={currentPage >= totalPages - 1}
                            className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/80 disabled:opacity-30 disabled:cursor-default hover:bg-white/10 cursor-pointer"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                    {pageItems.map((item) => {
                        const selected = selectedIds.includes(item.ea_original_id);
                        return (
                            <div
                                key={item.ea_original_id}
                                onClick={() => onToggleSelect(item.ea_original_id)}
                                onDoubleClick={() => setFocusedItem(item)}
                            >
                                <EAItemCard
                                    item={{
                                        ea_original_id: item.ea_original_id,
                                        title: item.title,
                                        thumbnail_url: item.thumbnail_url,
                                        download_count: item.download_count,
                                    }}
                                    selected={selected}
                                    onClick={() => onToggleSelect(item.ea_original_id)}
                                />
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            <EADetailsModal item={focusedItem} onClose={() => setFocusedItem(null)} />
        </div>
    );
}

