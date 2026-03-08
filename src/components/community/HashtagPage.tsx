import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, ImageIcon, MessageSquare, Heart } from 'lucide-react';
import { communityService } from '@/lib/communityService';
import type { FeedPost, Photo } from '@/types';
import { PostCard } from '@/components/feed/PostCard';

export default function HashtagPage() {
    const { tag } = useParams();
    const navigate = useNavigate();

    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    // Naive timeline state (combining photos and posts is more complex for pure timeline, but simple here)
    const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'photos'>('all');

    useEffect(() => {
        if (!tag) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [postsData, photosData] = await Promise.all([
                    communityService.getPostsByTag(tag),
                    communityService.getPhotosByTag(tag)
                ]);

                setPosts(postsData);
                setPhotos(photosData);
            } catch (err) {
                console.error("Failed to load hashtag content", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tag]);

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    const handlePostEdited = (postId: string, updates: { content: string | null; updated_at: string }) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, content: updates.content, updated_at: updates.updated_at } : p))
        );
    };

    const combinedTimeline = [...posts, ...photos].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className="max-w-3xl mx-auto w-full pb-20">
            {/* Header */}
            <div className="glass-heavy sticky top-0 z-[100] mb-6 flex flex-col pt-3 px-4 border-b border-white/10 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-4 mb-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-white flex items-center gap-1">
                            <Hash size={20} className="text-[var(--accent-primary)]" />
                            {tag}
                        </h1>
                        <span className="text-xs text-white/50">
                            {posts.length + photos.length} resultados
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-transparent">
                    {(['all', 'posts', 'photos'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 font-semibold text-sm capitalize relative transition-colors ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/80'
                                }`}
                        >
                            {tab === 'all' ? 'Tudo' : tab === 'posts' ? 'Posts' : 'Galeria'}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="hashttagTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent-primary)] rounded-t-full shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Feed */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 md:w-12 md:h-12 border-2 border-white/10 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                </div>
            ) : combinedTimeline.length === 0 ? (
                <div className="glass-panel p-10 text-center rounded-2xl border border-white/5 mt-4">
                    <Hash size={48} className="mx-auto text-white/20 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Nada por aqui...</h3>
                    <p className="text-white/50">A hashtag #{tag} ainda não foi usada em nenhum post ou foto pública.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Renderizing Logic (Simplificada -> Posts sao PostCards, Fotos sao galerias resumidas) */}
                    {activeTab === 'all' || activeTab === 'posts' ? (
                        <div className="space-y-6">
                            {(activeTab === 'all' ? combinedTimeline : posts).map(item => {
                                if ('content' in item) {
                                    return <PostCard key={item.id} post={item as FeedPost} onDelete={handlePostDeleted} onEdit={handlePostEdited} />;
                                }
                                else if (activeTab === 'all') {
                                    return (
                                        <div key={item.id} className="glass-panel p-4 rounded-[var(--radius-lg)] border border-white/10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ImageIcon size={16} className="text-[var(--accent-tertiary)]" />
                                                <span className="text-sm font-semibold text-white/70">Foto da Galeria Global</span>
                                            </div>
                                            <img src={(item as Photo).url} alt="Galeria" className="w-full rounded-lg object-cover max-h-[400px] mb-3" />
                                            <p className="text-sm text-white/80">{item.description}</p>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    ) : null}

                    {activeTab === 'photos' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map(photo => (
                                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/40 cursor-pointer">
                                    <img
                                        src={photo.thumbnail_url || photo.url}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                        <div className="flex items-center gap-3 text-sm text-white/80">
                                            <span className="flex items-center gap-1.5"><Heart size={14} /> {photo.likes_count || 0}</span>
                                            <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {photo.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
