import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { getPosts, getSinglePost } from '@/lib/feedService';
import { supabase } from '@/lib/supabaseClient';
import type { FeedPost } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { MessageSquare } from 'lucide-react'; // Keep MessageSquare for the empty state
import { GlassCard } from '@/components/ui/GlassCard'; // Keep GlassCard for the empty state

export function FeedPage() {
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    const initialFetchDone = useRef(false);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await getPosts(PAGE_SIZE, 0);
            setPosts(data);
            setHasMore(data.length === PAGE_SIZE);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchPosts();
            initialFetchDone.current = true;
        }
    }, []);

    // Subscrição a novos posts via Supabase Realtime
    useEffect(() => {
        if (!user) return; // Só escuta se estiver logado

        const channel = supabase.channel('realtime_feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'feed_posts' },
                async (payload) => {
                    const newPostId = payload.new.id;
                    const authorId = payload.new.author_id;

                    // Se eu fui o autor, o PostComposer já adicionou na tela localmente (optimistic UI)
                    // E se eu tentar puxar aqui de novo, duplica. Então eu pulo se fui eu.
                    if (authorId === user.id) return;

                    // Busca o post inteiro formatado pra UI (com join de profile etc)
                    const fullPost = await getSinglePost(newPostId);
                    if (fullPost) {
                        setPosts(prev => {
                            // Previne o mesmo post entrar 2x em race conditions
                            if (prev.some(p => p.id === fullPost.id)) return prev;
                            return [fullPost, ...prev];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || posts.length === 0) return;

        try {
            setLoadingMore(true);
            const data = await getPosts(PAGE_SIZE, posts.length);
            if (data.length > 0) {
                setPosts(prev => [...prev, ...data]);
            }
            setHasMore(data.length === PAGE_SIZE);
        } catch (err) {
            console.error('Erro ao carregar mais posts:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, posts.length]);

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
