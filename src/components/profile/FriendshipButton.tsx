import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Clock, UserMinus, ChevronDown } from 'lucide-react';
import {
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    unfriend,
    type FriendshipStatus,
} from '@/lib/friendshipService';
import type { Profile } from '@/types';

interface FriendshipButtonProps {
    targetProfile: Profile;
}

export function FriendshipButton({ targetProfile }: FriendshipButtonProps) {
    const [status, setStatus] = useState<FriendshipStatus>('none');
    const [friendshipId, setFriendshipId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        getFriendshipStatus(targetProfile.id)
            .then((result) => {
                if (mounted) {
                    setStatus(result.status);
                    setFriendshipId(result.friendshipId);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [targetProfile.id]);

    const handleAction = async (action: 'add' | 'accept' | 'cancel' | 'unfriend') => {
        setActing(true);
        setShowDropdown(false);

        try {
            switch (action) {
                case 'add':
                    await sendFriendRequest(targetProfile.id);
                    setStatus('pending_sent');
                    break;
                case 'accept':
                    if (friendshipId) {
                        await acceptFriendRequest(friendshipId);
                        setStatus('accepted');
                    }
                    break;
                case 'cancel':
                    if (friendshipId) {
                        await removeFriendship(friendshipId);
                        setStatus('none');
                        setFriendshipId(null);
                    }
                    break;
                case 'unfriend':
                    await unfriend(targetProfile.id);
                    setStatus('none');
                    setFriendshipId(null);
                    break;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActing(false);
        }
    };

    if (loading) {
        return (
            <div className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/30 animate-pulse">
                ...
            </div>
        );
    }

    // Estado: Nenhuma relação → Adicionar Amigo
    if (status === 'none') {
        return (
            <button
                onClick={() => handleAction('add')}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
                <UserPlus size={16} />
                {acting ? '...' : 'Adicionar'}
            </button>
        );
    }

    // Estado: Pendente (eu enviei)
    if (status === 'pending_sent') {
        return (
            <button
                onClick={() => handleAction('cancel')}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white/60 hover:border-[var(--accent-danger)]/50 hover:text-[var(--accent-danger)] transition-colors cursor-pointer"
            >
                <Clock size={16} />
                {acting ? '...' : 'Pendente'}
            </button>
        );
    }

    // Estado: Pendente (outro enviou para mim)
    if (status === 'pending_received') {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleAction('accept')}
                    disabled={acting}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-success)] text-white text-sm font-medium hover:bg-[var(--accent-success)]/80 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <UserCheck size={16} />
                    {acting ? '...' : 'Aceitar'}
                </button>
                <button
                    onClick={() => handleAction('cancel')}
                    disabled={acting}
                    className="px-3 py-2 rounded-full border border-white/20 text-sm text-white/40 hover:text-[var(--accent-danger)] hover:border-[var(--accent-danger)]/50 transition-colors cursor-pointer"
                >
                    ✕
                </button>
            </div>
        );
    }

    // Estado: Amigos
    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white/80 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
                <UserCheck size={16} className="text-[var(--accent-success)]" />
                Amigos
                <ChevronDown size={14} className="text-white/40" />
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full mt-1 glass-heavy rounded-[var(--radius-sm)] border border-white/10 py-1 z-20 min-w-[160px]"
                    >
                        <button
                            onClick={() => handleAction('unfriend')}
                            disabled={acting}
                            className="w-full px-3 py-2 text-sm text-[var(--accent-danger)] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                        >
                            <UserMinus size={14} />
                            {acting ? 'Removendo...' : 'Desfazer Amizade'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
