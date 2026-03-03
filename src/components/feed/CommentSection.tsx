import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Heart } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { MentionInput } from '@/components/ui/MentionInput';
import { useAuthStore } from '@/store/authStore';
import { getComments, addComment, deleteComment, toggleCommentLike } from '@/lib/feedService';
import { processMentions } from '@/lib/notificationService';
import { renderMentions } from '@/lib/renderMentions';
import type { PostComment } from '@/types';

interface CommentSectionProps {
    postId: string;
    onCommentCountChange?: (count: number) => void;
}

function timeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
    const { user, profile, isAdmin } = useAuthStore();
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let mounted = true;
        getComments(postId)
            .then((data) => {
                if (mounted) {
                    setComments(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [postId]);

    const handleSend = async () => {
        if (!user || !text.trim() || sending || text.length > 280) return;
        setSending(true);

        try {
            const comment = await addComment(postId, user.id, text.trim());
            setComments((prev) => [...prev, comment]);
            setText('');
            onCommentCountChange?.(comments.length + 1);

            // Processar menções (@) e notificar
            processMentions(text.trim(), user.id, 'mention_comment', comment.id).catch(console.error);
        } catch {
            // ignore
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            onCommentCountChange?.(comments.length - 1);
        } catch {
            // ignore
        }
    };

    const handleToggleLike = async (comment: PostComment) => {
        if (!user) return;
        try {
            const liked = await toggleCommentLike(comment.id, user.id);
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment.id
                        ? {
                            ...c,
                            liked_by_me: liked,
                            likes_count: (c.likes_count ?? 0) + (liked ? 1 : -1),
                        }
                        : c
                )
            );
        } catch {
            // ignore
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-white/[0.06]"
        >
            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-3">
                    <span className="w-5 h-5 border-2 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3 mb-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 group">
                            <Avatar
                                src={comment.author?.avatar_url}
                                alt={comment.author?.display_name || 'User'}
                                size="sm"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="inline-block bg-white/[0.04] rounded-[12px] px-3 py-2 max-w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white/80">
                                            {comment.author?.display_name || comment.author?.username || 'Anônimo'}
                                        </span>
                                        <span className="text-[10px] text-white/25">
                                            {timeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-0.5 break-words">
                                        {renderMentions(comment.content)}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <button
                                            onClick={() => handleToggleLike(comment)}
                                            className={`flex items-center gap-1 text-[10px] transition-colors cursor-pointer ${comment.liked_by_me
                                                ? 'text-[var(--accent-danger)]'
                                                : 'text-white/30 hover:text-white/60'
                                                }`}
                                        >
                                            <Heart
                                                size={11}
                                                className={comment.liked_by_me ? 'fill-current' : ''}
                                            />
                                            <span>{comment.likes_count ?? 0}</span>
                                        </button>
                                    </div>
                                </div>
                                {(user?.id === comment.author_id || isAdmin) && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="ml-2 text-white/0 group-hover:text-white/30 hover:!text-[var(--accent-danger)] transition-colors cursor-pointer"
                                        title="Deletar"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2">
                <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.display_name || 'User'}
                    size="sm"
                />
                <div className="flex-1 flex items-end gap-1 bg-white/[0.04] rounded-2xl px-3 py-2 border border-white/[0.06]">
                    <MentionInput
                        value={text}
                        onChange={setText}
                        onKeyDown={handleKeyDown}
                        placeholder="Escreva um comentário..."
                        className="flex-1 w-full bg-transparent text-xs text-white/80 placeholder-white/25 outline-none leading-relaxed"
                        maxLength={280}
                        mode="textarea"
                        autoResize
                        rows={1}
                    />
                    <div className="flex items-center gap-1 pb-0.5 shrink-0">
                        <EmojiPicker
                            onSelect={(emoji) => setText((prev) => prev + emoji)}
                            size={14}
                            position="top"
                        />
                        {/* Contador de caracteres — estilo Twitter */}
                        <CharCounter current={text.length} max={280} />
                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || sending || text.length > 280}
                            className={`text-[var(--accent-primary)] transition-opacity cursor-pointer ${!text.trim() ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────
   CharCounter — anel circular SVG estilo Twitter
   ──────────────────────────────────────────────────────────── */

const RING_RADIUS = 9;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;

function ringColor(remaining: number): string {
    if (remaining <= 20) return '#ef4444';
    if (remaining <= 50) return '#eab308';
    return 'rgba(255,255,255,0.55)';
}

interface CharCounterProps {
    current: number;
    max: number;
}

function CharCounter({ current, max }: CharCounterProps) {
    const remaining = max - current;
    const filled = Math.min(current / max, 1);
    const dashOffset = RING_CIRCUM * (1 - filled);
    const color = ringColor(remaining);
    const showNum = current > 0 && remaining <= 60;

    return (
        <AnimatePresence>
            {current > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="relative flex items-center justify-center select-none shrink-0"
                    style={{ width: 22, height: 22 }}
                    title={`${remaining} caracteres restantes`}
                >
                    {/* Anel SVG — girado -90° para começar do topo */}
                    <svg
                        width={22}
                        height={22}
                        viewBox="0 0 22 22"
                        className="absolute inset-0"
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        {/* trilho */}
                        <circle
                            cx={11} cy={11} r={RING_RADIUS}
                            fill="none"
                            stroke="white"
                            strokeOpacity={remaining <= 20 ? 0.3 : 0.1}
                            strokeWidth={2}
                        />
                        {/* progresso */}
                        <motion.circle
                            cx={11} cy={11} r={RING_RADIUS}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={RING_CIRCUM}
                            animate={{
                                strokeDashoffset: dashOffset,
                                stroke: color,
                                strokeWidth: remaining <= 0 ? 2.5 : 2,
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        />
                    </svg>

                    {/* Número regressivo — só nos últimos 100 chars */}
                    <AnimatePresence mode="wait">
                        {showNum && (
                            <motion.span
                                key={remaining <= 0 ? 'neg' : 'pos'}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.4 }}
                                transition={{ duration: 0.1 }}
                                className="relative z-10 font-semibold tabular-nums leading-none"
                                style={{ fontSize: 7, color }}
                            >
                                {remaining < 0 ? `-${Math.abs(remaining)}` : remaining}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
