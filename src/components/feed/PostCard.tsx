import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { MediaLightbox } from '@/components/ui/MediaLightbox';
import { CommentSection } from './CommentSection';
import { useAuthStore } from '@/store/authStore';
import { toggleLike, deletePost } from '@/lib/feedService';
import { renderPostContent } from '@/lib/renderMentions';
import { getPostImageUrls } from '@/types';
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
    const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

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
                                {post.author?.display_name || post.author?.username || 'Anônimo'}
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
                    {renderPostContent(post.content)}
                </p>
            )}

            {/* Images — grid estilo X/Twitter; clicável para lightbox em tela cheia */}
            {(() => {
                const urls = getPostImageUrls(post);
                const openLightbox = (index: number) => setLightbox({ urls, index });
                if (urls.length === 0) return null;
                if (urls.length === 1) {
                    return (
                        <button
                            type="button"
                            onClick={() => openLightbox(0)}
                            className="mt-3 rounded-[var(--radius-md)] overflow-hidden w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50"
                        >
                            <img
                                src={urls[0]}
                                alt="Post"
                                loading="lazy"
                                className="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity"
                            />
                        </button>
                    );
                }
                if (urls.length === 2) {
                    return (
                        <div className="grid grid-cols-2 gap-0.5 mt-3 rounded-[var(--radius-md)] overflow-hidden aspect-[2/1] w-full max-h-[400px]">
                            {urls.map((src, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => openLightbox(i)}
                                    className="relative min-h-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]/50"
                                >
                                    <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    );
                }
                if (urls.length === 3) {
                    return (
                        <div className="grid grid-cols-2 gap-0.5 mt-3 rounded-[var(--radius-md)] overflow-hidden aspect-[4/3] w-full max-h-[400px]">
                            <button type="button" onClick={() => openLightbox(0)} className="relative row-span-2 min-h-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]/50">
                                <img src={urls[0]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" />
                            </button>
                            <button type="button" onClick={() => openLightbox(1)} className="relative min-h-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]/50">
                                <img src={urls[1]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" />
                            </button>
                            <button type="button" onClick={() => openLightbox(2)} className="relative min-h-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]/50">
                                <img src={urls[2]} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" />
                            </button>
                        </div>
                    );
                }
                // 4 imagens: 2x2 grid quadrada
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 mt-3 rounded-[var(--radius-md)] overflow-hidden aspect-square w-full max-h-[500px]">
                        {urls.map((src, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => openLightbox(i)}
                                className="relative min-h-0 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]/50"
                            >
                                <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity" />
                            </button>
                        ))}
                    </div>
                );
            })()}

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

            {/* Lightbox em tela cheia para mídias do post */}
            <AnimatePresence>
                {lightbox && (
                    <MediaLightbox
                        urls={lightbox.urls}
                        initialIndex={lightbox.index}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>
        </motion.article>
    );
}
