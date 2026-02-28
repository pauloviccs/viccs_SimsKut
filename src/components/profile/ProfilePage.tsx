import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays,
    LinkIcon,
    Loader2,
    Camera,
    ImageIcon,
    MessageCircle,
    Users as UsersIcon,
    Briefcase,
    Zap,
    Star
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { PostCard } from '@/components/feed/PostCard';
import { FriendshipButton } from './FriendshipButton';
import { ProfileEditModal } from './ProfileEditModal';
import { FriendsListModal } from './FriendsListModal';
import { SimDetailsModal } from './SimDetailsModal';
import { PhotoLightbox } from '@/components/gallery/PhotoLightbox';
import { useAuthStore } from '@/store/authStore';
import {
    fetchProfileByUsername,
    getProfileStats,
    getUserPosts,
    getUserComments,
    getUserPhotos,
    getUserFamiliesWithSims,
    setPinnedPost
} from '@/lib/profileService';
import type { Profile, ProfileStats, FeedPost, PostComment, Photo, Family } from '@/types';

type ProfileTab = 'posts' | 'replies' | 'media' | 'family';

const tabs: { key: ProfileTab; label: string; icon: any }[] = [
    { key: 'posts', label: 'Posts', icon: MessageCircle },
    { key: 'replies', label: 'Respostas', icon: MessageCircle },
    { key: 'media', label: 'Mídia', icon: ImageIcon },
    { key: 'family', label: 'Família', icon: UsersIcon },
];

export function ProfilePage() {
    const { username: rawUsername } = useParams<{ username: string }>();
    const username = rawUsername ? decodeURIComponent(rawUsername) : undefined;
    const { user } = useAuthStore();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<ProfileStats>({ friends_count: 0, posts_count: 0, photos_count: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);
    const [viewingSim, setViewingSim] = useState<any | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    // Tab data
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [comments, setComments] = useState<(PostComment & { post?: FeedPost })[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [families, setFamilies] = useState<Family[]>([]);
    const [tabLoading, setTabLoading] = useState(false);

    const isOwnProfile = user?.id === profile?.id;

    // Fetch profile
    useEffect(() => {
        if (!username) return;
        let mounted = true;

        setLoading(true);
        fetchProfileByUsername(username)
            .then(async (p) => {
                if (!mounted || !p) {
                    if (mounted) setLoading(false);
                    return;
                }
                setProfile(p);

                const s = await getProfileStats(p.id);
                if (mounted) setStats(s);
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [username]);

    // Fetch tab data
    useEffect(() => {
        if (!profile) return;
        let mounted = true;

        setTabLoading(true);

        const load = async () => {
            try {
                if (activeTab === 'posts') {
                    const data = await getUserPosts(profile.id);
                    if (mounted) setPosts(data);
                } else if (activeTab === 'replies') {
                    const data = await getUserComments(profile.id);
                    if (mounted) setComments(data);
                } else if (activeTab === 'media') {
                    const data = await getUserPhotos(profile.id);
                    if (mounted) setPhotos(data);
                } else if (activeTab === 'family') {
                    const data = await getUserFamiliesWithSims(profile.id);
                    if (mounted) setFamilies(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setTabLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [profile?.id, activeTab]);

    const handleProfileUpdated = (updated: Partial<Profile>) => {
        setProfile((prev) => prev ? { ...prev, ...updated } : prev);
    };

    const handlePostDeleted = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (profile?.pinned_post_id === postId) {
            setProfile((prev) => (prev ? { ...prev, pinned_post_id: null } : prev));
        }
    };

    const handlePostEdited = (postId: string, updates: { content: string | null; updated_at: string }) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, content: updates.content, updated_at: updates.updated_at } : p))
        );
    };

    const handleTogglePin = async (postId: string) => {
        if (!profile) return;
        const newPinnedId = profile.pinned_post_id === postId ? null : postId;
        try {
            await setPinnedPost(profile.id, newPinnedId);
            setProfile((prev) => (prev ? { ...prev, pinned_post_id: newPinnedId } : prev));
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Não foi possível alterar o post fixado.');
        }
    };

    const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
        })
        : '';

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={28} className="animate-spin text-white/30" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <GlassCard className="py-12">
                    <h2 className="text-lg font-semibold text-white/70 mb-2">
                        Usuário não encontrado
                    </h2>
                    <p className="text-sm text-white/40">
                        O perfil @{username} não existe.
                    </p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* =========== BANNER =========== */}
            <div className="relative w-full aspect-[3/1] rounded-t-[var(--radius-lg)] overflow-hidden">
                {profile.banner_url ? (
                    <img
                        src={profile.banner_url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#007AFF]/40 via-[#5865F2]/30 to-[#34C759]/40" />
                )}
                {/* Gradiente inferior para legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* =========== HEADER =========== */}
            <div className="glass-heavy rounded-b-[var(--radius-lg)] border border-white/10 border-t-0 px-4 sm:px-6 pb-4 relative">
                {/* Avatar — Sobreposto ao banner */}
                <div className="flex justify-between items-start">
                    <div className="-mt-16 sm:-mt-20">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#0a0a0f] overflow-hidden">
                            <Avatar
                                src={profile.avatar_url}
                                alt={profile.display_name || profile.username}
                                size="2xl"
                                className="w-full h-full !border-0"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3">
                        {isOwnProfile ? (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white/90 hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                                Editar perfil
                            </button>
                        ) : (
                            <FriendshipButton targetProfile={profile} />
                        )}
                    </div>
                </div>

                {/* Name & Username */}
                <div className="mt-3">
                    <h1 className="text-xl font-bold text-white/95">
                        {profile.display_name || profile.username}
                    </h1>
                    <p className="text-sm text-white/40">@{profile.username}</p>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-white/75 mt-2 whitespace-pre-wrap break-words">
                        {profile.bio}
                    </p>
                )}

                {/* Meta: website + member since */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/40">
                    {profile.website_url && (
                        <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline truncate max-w-[200px]"
                        >
                            <LinkIcon size={14} />
                            {profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                    )}
                    <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        Membro desde {memberSince}
                    </span>
                </div>

                {/* Counters */}
                <div className="flex items-center gap-5 mt-3 text-sm">
                    <button
                        onClick={() => setShowFriendsList(true)}
                        className="text-white/90 font-semibold hover:underline cursor-pointer group"
                    >
                        {stats.friends_count}
                        <span className="text-white/40 font-normal ml-1 group-hover:text-white/60 transition-colors">Amigos</span>
                    </button>
                    <span className="text-white/90 font-semibold">
                        {stats.posts_count}
                        <span className="text-white/40 font-normal ml-1">Posts</span>
                    </span>
                    <span className="text-white/90 font-semibold">
                        {stats.photos_count}
                        <span className="text-white/40 font-normal ml-1">Fotos</span>
                    </span>
                </div>
            </div>

            {/* =========== TABS =========== */}
            <div className="flex border-b border-white/[0.08] mt-4 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                            flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium
                            transition-colors whitespace-nowrap cursor-pointer flex-1 min-w-0
                            ${activeTab === tab.key
                                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                            }
                        `}
                    >
                        <tab.icon size={16} className="shrink-0 hidden sm:block" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* =========== TAB CONTENT =========== */}
            <div className="mt-4 min-h-[200px]">
                {tabLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-white/30" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {posts.length === 0 ? (
                                        <GlassCard className="text-center py-10">
                                            <MessageCircle size={32} className="mx-auto mb-3 text-white/20" />
                                            <p className="text-sm text-white/40">Nenhum post ainda.</p>
                                        </GlassCard>
                                    ) : (
                                        [...posts]
                                            .sort((a, b) => {
                                                const pinnedId = profile?.pinned_post_id;
                                                if (a.id === pinnedId && b.id !== pinnedId) return -1;
                                                if (a.id !== pinnedId && b.id === pinnedId) return 1;
                                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                            })
                                            .map((post) => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    onDelete={handlePostDeleted}
                                                    onEdit={handlePostEdited}
                                                    showPinOption={isOwnProfile}
                                                    isPinned={profile?.pinned_post_id === post.id}
                                                    onTogglePin={isOwnProfile ? () => handleTogglePin(post.id) : undefined}
                                                />
                                            ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'replies' && (
                                <div className="space-y-3">
                                    {comments.length === 0 ? (
                                        <GlassCard className="text-center py-10">
                                            <MessageCircle size={32} className="mx-auto mb-3 text-white/20" />
                                            <p className="text-sm text-white/40">Nenhuma resposta ainda.</p>
                                        </GlassCard>
                                    ) : (
                                        comments.map((comment) => (
                                            <GlassCard key={comment.id} className="p-4">
                                                {/* Original post reference */}
                                                {comment.post && (
                                                    <div className="text-xs text-white/30 mb-2 flex items-center gap-1">
                                                        Respondeu a
                                                        <Link
                                                            to={`/profile/${encodeURIComponent(comment.post.author?.username || '')}`}
                                                            className="text-[var(--accent-primary)] hover:underline"
                                                        >
                                                            @{comment.post.author?.username}
                                                        </Link>
                                                    </div>
                                                )}
                                                <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
                                                    {comment.content}
                                                </p>
                                                <p className="text-xs text-white/30 mt-2">
                                                    {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </GlassCard>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'media' && (
                                <div>
                                    {photos.length === 0 ? (
                                        <GlassCard className="text-center py-10">
                                            <Camera size={32} className="mx-auto mb-3 text-white/20" />
                                            <p className="text-sm text-white/40">Nenhuma foto pública.</p>
                                        </GlassCard>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {photos.map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className="aspect-square rounded-[var(--radius-md)] overflow-hidden border border-white/10 group cursor-pointer"
                                                    onClick={() => setSelectedPhoto(photo)}
                                                >
                                                    <img
                                                        src={photo.thumbnail_url || photo.url}
                                                        alt={photo.title || photo.description || 'Foto'}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'family' && (
                                <div className="space-y-6">
                                    {families.length === 0 ? (
                                        <GlassCard className="text-center py-10">
                                            <UsersIcon size={32} className="mx-auto mb-3 text-white/20" />
                                            <p className="text-sm text-white/40">
                                                Nenhuma família criada.
                                            </p>
                                        </GlassCard>
                                    ) : (
                                        families.map(family => (
                                            <div key={family.id} className="space-y-4">
                                                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/30 to-[var(--accent-success)]/20 flex items-center justify-center">
                                                        <UsersIcon size={18} className="text-white/60" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white/90">{family.family_name}</h3>
                                                        <p className="text-xs text-white/40">{(family.sims as any)?.length || 0} Sims</p>
                                                    </div>
                                                </div>

                                                {(!family.sims || (family.sims as any).length === 0) ? (
                                                    <p className="text-sm text-white/30 italic pl-2">Nenhum Sim nesta família ainda.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {(family.sims as any).map((sim: any) => (
                                                            <div
                                                                key={sim.id}
                                                                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4 cursor-pointer hover:border-white/20 transition-colors"
                                                                onClick={() => setViewingSim(sim)}
                                                            >
                                                                <div className="flex gap-4">
                                                                    <Avatar
                                                                        src={sim.photo_url}
                                                                        alt={sim.name}
                                                                        size="xl"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="text-lg font-semibold text-white/90 truncate">{sim.name}</h3>
                                                                        {sim.profession && (
                                                                            <p className="text-xs text-[var(--accent-primary)] flex items-center gap-1 mt-1 truncate">
                                                                                <Briefcase size={12} className="shrink-0" /> {sim.profession}
                                                                            </p>
                                                                        )}
                                                                        {sim.bio && (
                                                                            <p className="text-xs text-white/50 mt-2 line-clamp-2">{sim.bio}</p>
                                                                        )}

                                                                        {/* Traits */}
                                                                        {sim.traits && sim.traits.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                                                {sim.traits.map((trait: any) => (
                                                                                    <span
                                                                                        key={trait.id}
                                                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${trait.trait_type === 'quality'
                                                                                            ? 'bg-[var(--accent-warning)]/15 text-[var(--accent-warning)]'
                                                                                            : 'bg-[var(--accent-success)]/15 text-[var(--accent-success)]'
                                                                                            }`}
                                                                                    >
                                                                                        {trait.trait_type === 'quality' ? <Star size={10} /> : <Zap size={10} />}
                                                                                        {trait.value}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* =========== EDIT MODAL =========== */}
            {showEditModal && profile && (
                <ProfileEditModal
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleProfileUpdated}
                />
            )}

            {/* =========== FRIENDS LIST MODAL =========== */}
            {showFriendsList && profile && (
                <FriendsListModal
                    userId={profile.id}
                    title={`Amigos de ${profile.display_name || profile.username}`}
                    onClose={() => setShowFriendsList(false)}
                />
            )}

            {/* =========== SHOW SIM MODAL =========== */}
            <AnimatePresence>
                {viewingSim && (
                    <SimDetailsModal
                        sim={viewingSim}
                        onClose={() => setViewingSim(null)}
                    />
                )}
            </AnimatePresence>

            {/* =========== LIGHTBOX MODAL =========== */}
            <AnimatePresence>
                {selectedPhoto && (
                    <PhotoLightbox
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onPhotoUpdate={(updated) => {
                            setSelectedPhoto(updated);
                            setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
