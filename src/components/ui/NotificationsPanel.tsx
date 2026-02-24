import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserCheck, X, AtSign, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import {
    getPendingRequests,
    acceptFriendRequest,
    removeFriendship,
    type PendingRequest,
} from '@/lib/friendshipService';
import {
    getNotifications,
    markNotificationRead,
    type AppNotification,
} from '@/lib/notificationService';

/**
 * NotificationsPanel — Centro de notificações unificado.
 * Mostra: solicitações de amizade + menções (@) em posts/comentários.
 */

interface NotificationsPanelProps {
    collapsed?: boolean;
    upward?: boolean;
}

function timeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export function NotificationsPanel({ collapsed = false, upward = false }: NotificationsPanelProps) {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [mentions, setMentions] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [actingOn, setActingOn] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [reqData, mentionData] = await Promise.all([
                getPendingRequests(),
                getNotifications(),
            ]);
            setRequests(reqData);
            setMentions(mentionData);
        } catch (err) {
            console.error('Erro ao buscar notificações:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { if (open) fetchAll(); }, [open, fetchAll]);

    // Fecha ao clicar fora
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const handleAccept = async (friendshipId: string) => {
        setActingOn(friendshipId);
        try {
            await acceptFriendRequest(friendshipId);
            setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
        } catch (err) { console.error(err); }
        finally { setActingOn(null); }
    };

    const handleReject = async (friendshipId: string) => {
        setActingOn(friendshipId);
        try {
            await removeFriendship(friendshipId);
            setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
        } catch (err) { console.error(err); }
        finally { setActingOn(null); }
    };

    const handleDismissMention = async (id: string) => {
        try {
            await markNotificationRead(id);
            setMentions((prev) => prev.filter((m) => m.id !== id));
        } catch (err) { console.error(err); }
    };

    const unreadMentions = mentions.filter((m) => !m.read);
    const totalCount = requests.length + unreadMentions.length;
    const hasAnything = requests.length > 0 || mentions.length > 0;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                type="button"
                title="Notificações"
                className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-[150ms] cursor-pointer text-white/50 hover:text-white/80 hover:bg-white/[0.06]`}
            >
                <div className="relative shrink-0">
                    <Bell size={18} />
                    {totalCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--accent-danger)] text-white text-[9px] font-bold flex items-center justify-center leading-none"
                        >
                            {totalCount > 9 ? '9+' : totalCount}
                        </motion.span>
                    )}
                </div>
                {!collapsed && 'Notificações'}
            </button>

            {/* Popup */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: -4 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 glass-popup rounded-[var(--radius-md)] border border-white/10 overflow-hidden ${collapsed
                            ? 'left-full ml-2 top-0 w-[320px]'
                            : upward
                                ? 'right-0 bottom-full mb-2 w-[300px]'
                                : 'left-0 top-full mt-1 w-full min-w-[300px]'
                            }`}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                            <span className="text-xs font-semibold text-white/70">
                                Notificações
                            </span>
                            {totalCount > 0 && (
                                <span className="text-[10px] text-white/30">{totalCount} nova{totalCount !== 1 ? 's' : ''}</span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
                            {loading ? (
                                <div className="flex justify-center py-6">
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                </div>
                            ) : !hasAnything ? (
                                <div className="py-8 text-center">
                                    <Bell size={24} className="mx-auto mb-2 text-white/15" />
                                    <p className="text-xs text-white/30">Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {/* === Solicitações de amizade === */}
                                    {requests.length > 0 && (
                                        <>
                                            <div className="px-4 py-1.5">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                                                    Solicitações de Amizade
                                                </span>
                                            </div>
                                            {requests.map((req) => (
                                                <motion.div
                                                    key={req.friendshipId}
                                                    layout
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
                                                >
                                                    <Avatar
                                                        src={req.requester.avatar_url}
                                                        alt={req.requester.display_name || 'User'}
                                                        size="sm"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-white/80 truncate">
                                                            {req.requester.display_name || req.requester.username}
                                                        </p>
                                                        <p className="text-[10px] text-white/30">
                                                            quer ser seu amigo · {timeAgo(req.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleAccept(req.friendshipId)}
                                                            disabled={actingOn === req.friendshipId}
                                                            className="w-7 h-7 rounded-full bg-[var(--accent-success)]/20 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/30 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                                            title="Aceitar"
                                                        >
                                                            <UserCheck size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.friendshipId)}
                                                            disabled={actingOn === req.friendshipId}
                                                            className="w-7 h-7 rounded-full bg-white/[0.06] text-white/40 hover:bg-[var(--accent-danger)]/20 hover:text-[var(--accent-danger)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                                            title="Recusar"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </>
                                    )}

                                    {/* === Menções === */}
                                    {mentions.length > 0 && (
                                        <>
                                            {requests.length > 0 && (
                                                <div className="border-t border-white/[0.04] my-1" />
                                            )}
                                            <div className="px-4 py-1.5">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                                                    Menções
                                                </span>
                                            </div>
                                            {mentions.map((notif) => (
                                                <motion.div
                                                    key={notif.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                                                >
                                                    <div className="relative">
                                                        <Avatar
                                                            src={notif.actor?.avatar_url}
                                                            alt={notif.actor?.display_name || 'User'}
                                                            size="sm"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                                                            {notif.type === 'mention_post'
                                                                ? <AtSign size={9} className="text-white" />
                                                                : <MessageCircle size={9} className="text-white" />
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-white/80">
                                                            <span className="font-medium">
                                                                {notif.actor?.display_name || notif.actor?.username}
                                                            </span>
                                                            {' '}te mencionou em um{' '}
                                                            {notif.type === 'mention_post' ? 'post' : 'comentário'}
                                                        </p>
                                                        {notif.content && (
                                                            <p className="text-[10px] text-white/30 truncate mt-0.5">
                                                                "{notif.content.substring(0, 60)}{notif.content.length > 60 ? '...' : ''}"
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-white/20 mt-0.5">
                                                            {timeAgo(notif.created_at)}
                                                        </p>
                                                    </div>
                                                    {!notif.read && (
                                                        <button
                                                            onClick={() => handleDismissMention(notif.id)}
                                                            className="w-6 h-6 rounded-full bg-white/[0.06] text-white/30 hover:text-white/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                                            title="Marcar como lida"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
