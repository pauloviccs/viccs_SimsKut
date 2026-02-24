import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserMinus, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { getFriendsWithStats, unfriend } from '@/lib/friendshipService';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types';
import { Link } from 'react-router-dom';

interface FriendsListModalProps {
    userId: string;
    onClose: () => void;
    title?: string;
}

type FriendWithStats = Profile & {
    stats: {
        friends_count: number;
        posts_count: number;
        photos_count: number;
    }
};

export function FriendsListModal({ userId, onClose, title = "Amigos" }: FriendsListModalProps) {
    const { user } = useAuthStore();
    const [friends, setFriends] = useState<FriendWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actingMap, setActingMap] = useState<Record<string, boolean>>({});

    const isOwnProfile = user?.id === userId;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getFriendsWithStats(userId)
            .then(data => {
                if (mounted) setFriends(data);
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [userId]);

    const handleUnfriend = async (friendId: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        setActingMap(prev => ({ ...prev, [friendId]: true }));
        try {
            await unfriend(friendId);
            setFriends(prev => prev.filter(f => f.id !== friendId));
        } catch (error) {
            console.error('Falha ao remover amigo', error);
        } finally {
            setActingMap(prev => ({ ...prev, [friendId]: false }));
        }
    };

    const filteredFriends = friends.filter(friend => {
        const term = search.toLowerCase();
        return (friend.display_name?.toLowerCase().includes(term) || friend.username.toLowerCase().includes(term));
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md max-h-[85vh] flex flex-col glass-heavy rounded-[var(--radius-lg)] border border-white/10 shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-lg font-bold text-white/90">{title} <span className="text-white/40 font-normal ml-1">({friends.length})</span></h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 shrink-0 border-b border-white/[0.05]">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            placeholder="Buscar amigo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]/50 focus:bg-black/30 transition-all placeholder:text-white/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-3">
                            <Loader2 size={24} className="animate-spin" />
                            <p className="text-sm">Carregando amigos...</p>
                        </div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-white/40">
                            <p className="text-sm">{search ? 'Nenhum amigo encontrado.' : 'Nenhum amigo ainda.'}</p>
                        </div>
                    ) : (
                        filteredFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                            >
                                <Link
                                    to={`/profile/${encodeURIComponent(friend.username)}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                                >
                                    <Avatar
                                        src={friend.avatar_url}
                                        alt={friend.display_name || friend.username}
                                        size="md"
                                        className="shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <div className="font-semibold text-white/90 truncate text-sm hover:underline">
                                            {friend.display_name || friend.username}
                                        </div>
                                        <div className="text-xs text-white/40 truncate">@{friend.username}</div>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
                                            <span className="font-medium text-white/60">{friend.stats.friends_count} <span className="font-normal opacity-70">amigos</span></span>
                                            <span className="font-medium text-white/60">{friend.stats.posts_count} <span className="font-normal opacity-70">posts</span></span>
                                            <span className="font-medium text-white/60">{friend.stats.photos_count} <span className="font-normal opacity-70">fotos</span></span>
                                        </div>
                                    </div>
                                </Link>

                                {/* Apenas mostra o botão Unfollow se for o próprio perfil do usuário logado */}
                                {isOwnProfile && (
                                    <button
                                        onClick={(e) => handleUnfriend(friend.id, e)}
                                        disabled={actingMap[friend.id]}
                                        className="shrink-0 ml-2 p-2 rounded-full border border-white/10 text-white/40 hover:text-[var(--accent-danger)] hover:border-[var(--accent-danger)]/50 hover:bg-[var(--accent-danger)]/10 transition-colors cursor-pointer"
                                        title="Desfazer amizade"
                                    >
                                        {actingMap[friend.id] ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <UserMinus size={16} />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}
