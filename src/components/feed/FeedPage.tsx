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
    const [newPosts, setNewPosts] = useState<FeedPost[]>([]);
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

        console.log('[Realtime] Tentando conectar ao canal...', user.id);
        const channel = supabase.channel('realtime_feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'feed_posts' },
                async (payload) => {
                    console.log('[Realtime] Novo post detectado!', payload);
                    const newPostId = payload.new.id;
                    const authorId = payload.new.author_id;

                    // Se eu fui o autor, o PostComposer já adicionou na tela localmente (optimistic UI)
                    // E se eu tentar puxar aqui de novo, duplica. Então eu pulo se fui eu.
                    if (authorId === user.id) {
                        console.log('[Realtime] Post ignorado: Eu sou o autor.');
                        return;
                    }

                    // Busca o post inteiro formatado pra UI (com join de profile etc)
                    const fullPost = await getSinglePost(newPostId);
                    console.log('[Realtime] Post formatado buscado:', fullPost);
                    if (fullPost) {
                        // Verifica se o post já está na tela (em posts)
                        setPosts(currPosts => {
                            if (currPosts.some(p => p.id === fullPost.id)) return currPosts;

                            // Caso contrário, adiciona à fila (buffer de delay) para evitar layout shift no Feed
                            setNewPosts(currNewPosts => {
                                if (currNewPosts.some(p => p.id === fullPost.id)) return currNewPosts;
                                console.log('[Realtime] Post movido para fila de espera.');
                                return [fullPost, ...currNewPosts];
                            });

                            return currPosts;
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Status da subscrição:', status);
            });

        return () => {
            console.log('[Realtime] Desmontando canal de realtime.');
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

    const handlePostEdited = (postId: string, updates: { content: string | null; updated_at: string }) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, content: updates.content, updated_at: updates.updated_at } : p))
        );
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

            <AnimatePresence>
                {newPosts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="sticky top-[88px] z-40 flex justify-center mb-4"
                    >
                        <button
                            onClick={() => {
                                setPosts(prev => [...newPosts, ...prev]);
                                setNewPosts([]);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium py-2.5 px-6 rounded-full shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all flex items-center gap-2 group"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                            Mostrar {newPosts.length} novo{newPosts.length > 1 ? 's' : ''} post{newPosts.length > 1 ? 's' : ''}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                onEdit={handlePostEdited}
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
