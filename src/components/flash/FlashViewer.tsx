import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { useFlashStore } from '@/store/flashStore';
import { useAuthStore } from '@/store/authStore';
import { markFlashViewed, deleteFlash } from '@/lib/flashService';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { FlashGroup } from '@/types';

const STORY_DURATION_MS = 5000; // 5s por flash

interface FlashViewerProps {
    groups: FlashGroup[];
    onClose: () => void;
    onRefetch: () => void;
}

export function FlashViewer({ groups, onRefetch }: FlashViewerProps) {
    const { viewerOpen, viewingUserId, activeFlashIndex, openViewer, closeViewer, setActiveIndex } = useFlashStore();
    const { profile } = useAuthStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentGroup = groups.find(g => g.author.id === viewingUserId);
    const currentGroupIndex = groups.findIndex(g => g.author.id === viewingUserId);
    const currentFlash = currentGroup?.flashes[activeFlashIndex];
    const isOwn = viewingUserId === profile?.id;

    // Avançar para o próximo flash ou grupo
    const goNext = useCallback(() => {
        if (!currentGroup) return;
        if (activeFlashIndex < currentGroup.flashes.length - 1) {
            setActiveIndex(activeFlashIndex + 1);
        } else {
            // Próximo grupo
            const nextGroup = groups[currentGroupIndex + 1];
            if (nextGroup) {
                openViewer(nextGroup.author.id, 0);
            } else {
                closeViewer();
            }
        }
    }, [currentGroup, activeFlashIndex, groups, currentGroupIndex, openViewer, closeViewer, setActiveIndex]);

    const goPrev = useCallback(() => {
        if (!currentGroup) return;
        if (activeFlashIndex > 0) {
            setActiveIndex(activeFlashIndex - 1);
        } else {
            const prevGroup = groups[currentGroupIndex - 1];
            if (prevGroup) {
                openViewer(prevGroup.author.id, prevGroup.flashes.length - 1);
            }
        }
    }, [currentGroup, activeFlashIndex, groups, currentGroupIndex, openViewer, setActiveIndex]);

    // Timer de avanço automático
    useEffect(() => {
        if (!viewerOpen || !currentFlash) return;

        // Marcar como visto
        markFlashViewed(currentFlash.id).catch(() => { });

        timerRef.current = setTimeout(goNext, STORY_DURATION_MS);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [viewerOpen, currentFlash?.id, goNext]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!currentFlash) return;
        if (!window.confirm('Remover este Flash?')) return;
        try {
            await deleteFlash(currentFlash);
            toast.success('Flash removido.');
            onRefetch();
            closeViewer();
        } catch {
            toast.error('Erro ao remover Flash.');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (!viewerOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') closeViewer();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewerOpen, goNext, goPrev, closeViewer]);

    if (!currentGroup || !currentFlash) return null;

    const totalFlashes = currentGroup.flashes.length;

    return (
        <AnimatePresence>
            {viewerOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.92)' }}
                >
                    {/* Container do flash (aspect 9:16 centralizado) */}
                    <div
                        className="relative w-full h-full max-w-sm mx-auto overflow-hidden"
                        style={{ maxHeight: '100dvh' }}
                    >
                        {/* Imagem de fundo */}
                        <img
                            src={currentFlash.image_url}
                            alt={currentFlash.caption || 'Flash'}
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Overlay gradient (para legibilidade do header/footer) */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

                        {/* Progress bars */}
                        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-10">
                            {Array.from({ length: totalFlashes }).map((_, i) => (
                                <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/25 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: i < activeFlashIndex ? '100%' : '0%' }}
                                        animate={{
                                            width: i < activeFlashIndex ? '100%' : i === activeFlashIndex ? '100%' : '0%',
                                        }}
                                        transition={{
                                            duration: i === activeFlashIndex ? STORY_DURATION_MS / 1000 : 0,
                                            ease: 'linear',
                                        }}
                                        key={`${currentFlash.id}-${i}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Header: avatar + nome + tempo + fechar — z-30 acima das tap zones */}
                        <div className="absolute top-0 left-0 right-0 flex items-center gap-2.5 px-3 pt-8 pb-2 z-30">
                            <div
                                className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #007AFF, #AF52DE)' }}
                            >
                                <Avatar
                                    src={currentGroup.author.avatar_url}
                                    alt={currentGroup.author.display_name || currentGroup.author.username}
                                    size="sm"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate leading-none flex items-center gap-1">
                                    <span className="truncate">{currentGroup.author.display_name || currentGroup.author.username}</span>
                                    {currentGroup.author.is_verified && <VerifiedBadge size={13} />}
                                </p>
                                <p className="text-white/60 text-[10px] mt-0.5">
                                    {formatDistanceToNow(new Date(currentFlash.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>

                            {/* Ações do autor */}
                            {isOwn && (
                                <button
                                    onClick={handleDelete}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-[#FF3B30] hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Remover Flash"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); closeViewer(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Tap zones: esquerda (prev) e direita (next) */}
                        <button
                            onClick={goPrev}
                            className="absolute left-0 top-0 bottom-0 w-1/3 z-20 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft size={28} className="text-white drop-shadow-lg" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-0 top-0 bottom-0 w-1/3 z-20 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight size={28} className="text-white drop-shadow-lg" />
                        </button>

                        {/* Caption (bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 z-10">
                            {currentFlash.caption && (
                                <p className="text-white text-sm text-center leading-snug drop-shadow">
                                    {currentFlash.caption}
                                </p>
                            )}
                            {/* Views (só para o autor) */}
                            {isOwn && (
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <Eye size={13} className="text-white/50" />
                                    <span className="text-white/50 text-xs">
                                        {currentFlash.views_count ?? 0} visualizações
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
