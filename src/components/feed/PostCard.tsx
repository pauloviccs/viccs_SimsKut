import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CommentSection } from './CommentSection';
import { useAuthStore } from '@/store/authStore';
import { toggleLike, deletePost } from '@/lib/feedService';
import { renderMentions } from '@/lib/renderMentions';
import type { FeedPost } from '@/types';

interface PostCardProps {
    post: FeedPost;
    onDelete?: (postId: string) => void;
    onLikeToggle?: (postId: string, liked: boolean) => void;
}

function timeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return new Date(date).toLocaleDateString('pt-BR');
}

export function PostCard({ post, onDelete, onLikeToggle }: PostCardProps) {
    const { user, isAdmin } = useAuthStore();
    const [liked, setLiked] = useState(post.liked_by_me ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [liking, setLiking] = useState(false);

    const isAuthor = user?.id === post.author_id;

    const handleLike = async () => {
        if (!user || liking) return;
        setLiking(true);

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount((prev) => prev + (newLiked ? 1 : -1));

        try {
            await toggleLike(post.id, user.id);
            onLikeToggle?.(post.id, newLiked);
        } catch {
            // Rollback
            setLiked(!newLiked);
            setLikesCount((prev) => prev + (newLiked ? -1 : 1));
        } finally {
            setLiking(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Deletar este post?')) return;
        try {
            await deletePost(post.id);
            onDelete?.(post.id);
        } catch {
            // ignore
        }
        setShowMenu(false);
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link to={`/profile/${encodeURIComponent(post.author?.username || '')}`}>
                    <Avatar
                        src={post.author?.avatar_url}
                        alt={post.author?.display_name || 'User'}
                        size="md"
                    />
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link to={`/profile/${encodeURIComponent(post.author?.username || '')}`} className="hover:underline">
                            <span className="text-sm font-semibold text-white/90 truncate">
                                {post.author?.display_name || 'Anônimo'}
                            </span>
                        </Link>
                        <Link to={`/profile/${encodeURIComponent(post.author?.username || '')}`} className="hover:underline">
                            <span className="text-xs text-white/30">
                                @{post.author?.username || 'user'}
                            </span>
                        </Link>
                        <span className="text-xs text-white/20">·</span>
                        <span className="text-xs text-white/30">
                            {timeAgo(post.created_at)}
                        </span>
                    </div>
                </div>

                {/* Menu */}
                {(isAuthor || isAdmin) && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-0 top-full mt-1 glass-heavy rounded-[var(--radius-sm)] border border-white/10 py-1 z-10 min-w-[120px]"
                            >
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-3 py-2 text-sm text-[var(--accent-danger)] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                    Deletar
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {post.content && (
                <p className="text-sm text-white/80 mt-3 whitespace-pre-wrap break-words">
                    {renderMentions(post.content)}
                </p>
            )}

            {/* Image */}
            {post.image_url && (
                <div className="mt-3 rounded-[var(--radius-md)] overflow-hidden">
                    <img
                        src={post.image_url}
                        alt="Post image"
                        loading="lazy"
                        className="w-full max-h-[500px] object-cover"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/[0.06]">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${liked
                        ? 'text-[var(--accent-danger)]'
                        : 'text-white/40 hover:text-[var(--accent-danger)]'
                        }`}
                >
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    <span>{likesCount > 0 ? likesCount : ''}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1.5 text-sm text-white/40 hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                >
                    <MessageCircle size={16} />
                    <span>{commentsCount > 0 ? commentsCount : ''}</span>
                </button>
            </div>

            {/* Comments */}
            {showComments && (
                <CommentSection
                    postId={post.id}
                    onCommentCountChange={setCommentsCount}
                />
            )}
        </motion.article>
    );
}
