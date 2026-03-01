import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { toggleReaction } from '@/lib/feedService';
import type { PostReactionAggregate } from '@/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯'];

function QuickReactionPopover({
    onSelect,
    onClose,
    anchorRef,
}: {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                anchorRef.current?.contains(e.target as Node) ||
                popoverRef.current?.contains(e.target as Node)
            )
                return;
            onClose();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose, anchorRef]);

    return (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-1 z-[50] glass-popup rounded-[var(--radius-md)] border border-white/10 p-2 shadow-xl"
        >
            <div className="grid grid-cols-4 gap-0.5 sm:grid-cols-4">
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

interface PostReactionsProps {
    postId: string;
    reactions: PostReactionAggregate[];
    currentUserId: string | undefined;
    onReactionsChange: (next: PostReactionAggregate[]) => void;
    /** Compacto para caber na barra de ações (like/comment) */
    compact?: boolean;
}

/**
 * Reações estilo Discord: pills (emoji + count) clicáveis para toggle;
 * botão para adicionar nova reação (abre emoji picker).
 * Responsivo: mesma linha em desktop e mobile.
 */
export function PostReactions({
    postId,
    reactions,
    currentUserId,
    onReactionsChange,
    compact = true,
}: PostReactionsProps) {
    const [reacting, setReacting] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const addButtonRef = useRef<HTMLDivElement>(null);

    const handleToggle = async (emoji: string) => {
        if (!currentUserId || reacting !== null) return;
        setReacting(emoji);

        const prev = reactions.find((r) => r.emoji === emoji);
        const reactedByMe = prev?.reacted_by_me ?? false;
        const count = prev?.count ?? 0;

        // Optimistic update
        const nextList = [...reactions];
        const idx = nextList.findIndex((r) => r.emoji === emoji);
        if (reactedByMe) {
            if (count <= 1) {
                nextList.splice(idx, 1);
            } else {
                nextList[idx] = { ...nextList[idx], count: count - 1, reacted_by_me: false };
            }
        } else {
            if (idx >= 0) {
                nextList[idx] = { ...nextList[idx], count: count + 1, reacted_by_me: true };
            } else {
                nextList.push({ emoji, count: count + 1, reacted_by_me: true });
                nextList.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
            }
        }
        onReactionsChange(nextList);

        try {
            await toggleReaction(postId, currentUserId, emoji);
        } catch {
            onReactionsChange(reactions);
        } finally {
            setReacting(null);
        }
    };

    const handleAddReaction = (emoji: string) => {
        setPickerOpen(false);
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
            handleToggle(emoji);
        } else {
            if (!currentUserId || reacting !== null) return;
            setReacting(emoji);
            const nextList = [...reactions, { emoji, count: 1, reacted_by_me: true }];
            nextList.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
            onReactionsChange(nextList);
            toggleReaction(postId, currentUserId, emoji)
                .catch(() => onReactionsChange(reactions))
                .finally(() => setReacting(null));
        }
    };

    return (
        <div className="flex items-center gap-1 flex-wrap">
            <AnimatePresence mode="popLayout">
                {reactions.map((r) => (
                    <motion.button
                        key={r.emoji}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleToggle(r.emoji)}
                        disabled={!currentUserId || reacting !== null}
                        className={`
                            inline-flex items-center gap-1 rounded-full border transition-all cursor-pointer
                            min-w-0 max-w-[120px] sm:max-w-[140px]
                            ${compact ? 'px-2 py-0.5 text-sm' : 'px-2.5 py-1 text-sm'}
                            ${r.reacted_by_me
                                ? 'bg-white/12 border-white/25 text-white/90 hover:bg-white/18'
                                : 'bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/10 hover:border-white/15'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        title={r.reacted_by_me ? 'Remover sua reação' : 'Adicionar sua reação'}
                    >
                        <span className="text-base leading-none">{r.emoji}</span>
                        {r.count > 0 && (
                            <span className="text-xs tabular-nums truncate">{r.count}</span>
                        )}
                    </motion.button>
                ))}
            </AnimatePresence>

            {currentUserId && (
                <div className="relative inline-flex" ref={addButtonRef}>
                    <button
                        type="button"
                        onClick={() => setPickerOpen(!pickerOpen)}
                        disabled={reacting !== null}
                        className="flex items-center justify-center rounded-full text-white/40 hover:text-[var(--accent-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50 w-8 h-8 min-w-8 min-h-8"
                        title="Adicionar reação"
                    >
                        <SmilePlus size={16} />
                    </button>
                    <AnimatePresence>
                        {pickerOpen && (
                            <QuickReactionPopover
                                onSelect={handleAddReaction}
                                onClose={() => setPickerOpen(false)}
                                anchorRef={addButtonRef}
                            />
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
