import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { MentionInput } from '@/components/ui/MentionInput';
import { useAuthStore } from '@/store/authStore';
import { getComments, addComment, deleteComment } from '@/lib/feedService';
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
        if (!user || !text.trim() || sending) return;
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
            <div className="flex items-center gap-2">
                <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.display_name || 'User'}
                    size="sm"
                />
                <div className="flex-1 flex items-center gap-1 bg-white/[0.04] rounded-full px-3 py-1.5 border border-white/[0.06]">
                    <MentionInput
                        value={text}
                        onChange={setText}
                        onKeyDown={handleKeyDown}
                        placeholder="Escreva um comentário..."
                        className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
                        maxLength={500}
                    />
                    <EmojiPicker
                        onSelect={(emoji) => setText((prev) => prev + emoji)}
                        size={14}
                        position="top"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        className={`text-[var(--accent-primary)] transition-opacity cursor-pointer ${!text.trim() ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
