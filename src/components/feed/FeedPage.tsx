import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { getPosts } from '@/lib/feedService';
import type { FeedPost } from '@/types';

export function FeedPage() {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const PAGE_SIZE = 20;

    useEffect(() => {
        let mounted = true;
        getPosts(PAGE_SIZE, 0)
            .then((data) => {
                if (mounted) {
                    setPosts(data);
                    setHasMore(data.length === PAGE_SIZE);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        try {
            const more = await getPosts(PAGE_SIZE, posts.length);
            setPosts((prev) => [...prev, ...more]);
            setHasMore(more.length === PAGE_SIZE);
        } catch {
            // ignore
        } finally {
            setLoadingMore(false);
        }
    };

    const handlePostCreated = (post: FeedPost) => {
        setPosts((prev) => [post, ...prev]);
    };

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    // Infinite scroll
    useEffect(() => {
        const scrollContainer = document.getElementById('main-scroll-container') || window;

        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            const isWindow = scrollContainer === window;
            const scrollY = isWindow ? window.scrollY : target.scrollTop;
            const innerHeight = isWindow ? window.innerHeight : target.clientHeight;
            const scrollHeight = isWindow ? document.body.offsetHeight : target.scrollHeight;

            if (
                innerHeight + scrollY >= scrollHeight - 500 &&
                hasMore &&
                !loadingMore
            ) {
                loadMore();
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, posts.length]);

    return (
        <div className="max-w-2xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-6"
            >
                Feed
            </motion.h1>

            <PostComposer onPostCreated={handlePostCreated} />

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-white/30" />
                </div>
            ) : posts.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <MessageSquare size={40} className="mx-auto mb-4 text-white/30" />
                    <h2 className="text-lg font-semibold text-white/70 mb-2">
                        Nenhum post ainda
                    </h2>
                    <p className="text-sm text-white/40">
                        Seja o primeiro a compartilhar algo! 🎮
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handlePostDeleted}
                            />
                        ))}
                    </AnimatePresence>

                    {loadingMore && (
                        <div className="flex justify-center py-4">
                            <Loader2 size={20} className="animate-spin text-white/30" />
                        </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <p className="text-center text-xs text-white/20 py-4">
                            Você viu todos os posts 🎉
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
