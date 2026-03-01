import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { toggleReaction } from '@/lib/feedService';
import type { PostReactionAggregate } from '@/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯'];

const POPOVER_GAP = 6;
const POPOVER_MIN_WIDTH = 160;

function QuickReactionPopover({
    onSelect,
    onClose,
    anchorRef,
    open,
}: {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLDivElement | null>;
    open: boolean;
}) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useLayoutEffect(() => {
        if (!open || !anchorRef.current) {
            setPosition(null);
            return;
        }
        const anchor = anchorRef.current.getBoundingClientRect();
        const popoverHeight = 88;
        const spaceAbove = anchor.top;
        const spaceBelow = window.innerHeight - anchor.bottom;
        const showAbove = spaceAbove >= popoverHeight + POPOVER_GAP || spaceBelow < spaceAbove;
        const top = showAbove
            ? anchor.top - popoverHeight - POPOVER_GAP
            : anchor.bottom + POPOVER_GAP;
        let left = anchor.left;
        const maxLeft = window.innerWidth - POPOVER_MIN_WIDTH;
        if (left > maxLeft) left = maxLeft;
        if (left < 8) left = 8;
        setPosition({ top, left });
    }, [open, anchorRef]);

    useEffect(() => {
        if (!open) return;
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
    }, [open, onClose, anchorRef]);

    if (!open || position === null) return null;

    const popover = (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] glass-popup rounded-[var(--radius-md)] border border-white/10 p-2 shadow-xl min-w-[var(--popover-min-w)]"
            style={{
                top: position.top,
                left: position.left,
                ['--popover-min-w' as string]: `${POPOVER_MIN_WIDTH}px`,
            }}
        >
            <div className="grid grid-cols-4 gap-0.5">
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>
    );

    return createPortal(popover, document.body);
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
        <div className="flex items-center gap-1 min-w-0">
            {/* Pills em uma única linha, scroll horizontal se precisar — evita “cápsula” vertical sobre a imagem */}
            <div className="flex items-center gap-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide flex-shrink-0 max-w-64">
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
                                inline-flex items-center gap-1 rounded-full border transition-all cursor-pointer shrink-0
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
            </div>

            {currentUserId && (
                <div className="relative inline-flex shrink-0" ref={addButtonRef}>
                    <button
                        type="button"
                        onClick={() => setPickerOpen(!pickerOpen)}
                        disabled={reacting !== null}
                        className="flex items-center justify-center rounded-full text-white/40 hover:text-[var(--accent-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50 w-8 h-8 min-w-8 min-h-8"
                        title="Adicionar reação"
                    >
                        <SmilePlus size={16} />
                    </button>
                    {pickerOpen && (
                        <QuickReactionPopover
                            onSelect={handleAddReaction}
                            onClose={() => setPickerOpen(false)}
                            anchorRef={addButtonRef}
                            open={pickerOpen}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
