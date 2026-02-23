import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabaseClient';
import type { FeedPost } from '@/types';

export function AdminFeed() {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPosts() {
            try {
                const { data, error } = await supabase
                    .from('feed_posts')
                    .select('*, author:profiles!author_id(username, display_name, avatar_url)')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                console.error('Erro ao carregar posts:', err);
            } finally {
                setLoading(false);
            }
        }

        loadPosts();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Feed Geral</h1>

            {loading ? (
                <div className="text-center py-8">
                    <span className="inline-block w-6 h-6 border-2 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <GlassCard className="p-8 text-center">
                    <p className="text-sm text-white/40">
                        Nenhum post publicado ainda. O feed ficará aqui assim que membros começarem a postar.
                    </p>
                </GlassCard>
            ) : (
                <div className="flex flex-col gap-4">
                    {posts.map((post) => (
                        <GlassCard key={post.id} className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                    {(post.author as unknown as { display_name?: string; username?: string })?.display_name?.[0]?.toUpperCase() ||
                                        (post.author as unknown as { username?: string })?.username?.[0]?.toUpperCase() ||
                                        '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {(post.author as unknown as { display_name?: string; username?: string })?.display_name ||
                                            (post.author as unknown as { username?: string })?.username ||
                                            'Anônimo'}
                                    </p>
                                    <p className="text-[10px] text-white/30">
                                        {new Date(post.created_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                            {post.content && (
                                <p className="text-sm text-white/70">{post.content}</p>
                            )}
                            {post.image_url && (
                                <img
                                    src={post.image_url}
                                    alt="Post"
                                    className="mt-3 rounded-[var(--radius-sm)] max-h-64 object-cover w-full"
                                />
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
