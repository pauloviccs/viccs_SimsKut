import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { listAllInvites, approveInvite, rejectInvite } from '@/lib/inviteService';
import { useAuthStore } from '@/store/authStore';
import type { InviteCode } from '@/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function InviteManager() {
    const { user } = useAuthStore();
    const [invites, setInvites] = useState<(InviteCode & { profiles?: { username: string; display_name: string } })[]>([]);
    const [filter, setFilter] = useState<StatusFilter>('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    async function loadInvites() {
        setLoading(true);
        try {
            const data = await listAllInvites(filter);
            setInvites(data as typeof invites);
        } catch (err) {
            console.error('Erro ao carregar convites:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInvites();
    }, [filter]);

    async function handleApprove(inviteId: string) {
        if (!user) return;
        setActionLoading(inviteId);
        try {
            await approveInvite(inviteId, user.id);
            await loadInvites();
        } catch (err) {
            console.error('Erro ao aprovar:', err);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(inviteId: string) {
        setActionLoading(inviteId);
        try {
            await rejectInvite(inviteId);
            await loadInvites();
        } catch (err) {
            console.error('Erro ao rejeitar:', err);
        } finally {
            setActionLoading(null);
        }
    }

    const filters: { id: StatusFilter; label: string }[] = [
        { id: 'pending', label: 'Pendentes' },
        { id: 'approved', label: 'Aprovados' },
        { id: 'rejected', label: 'Rejeitados' },
        { id: 'all', label: 'Todos' },
    ];

    const statusColors: Record<string, string> = {
        pending: 'text-[var(--accent-warning)] bg-[var(--accent-warning)]/10',
        approved: 'text-[var(--accent-success)] bg-[var(--accent-success)]/10',
        rejected: 'text-[var(--accent-danger)] bg-[var(--accent-danger)]/10',
        used: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Convites</h1>
                <div className="flex items-center gap-1">
                    <Filter size={14} className="text-white/30 mr-1" />
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-medium
                                transition-colors cursor-pointer
                                ${filter === f.id
                                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                }
                            `}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <span className="inline-block w-6 h-6 border-2 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    </div>
                ) : invites.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-8">
                        Nenhum convite {filter === 'all' ? '' : filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovado' : 'rejeitado'}.
                    </p>
                ) : (
                    <div className="divide-y divide-white/5">
                        {invites.map((invite) => (
                            <motion.div
                                key={invite.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                        {(invite as unknown as { profiles?: { username: string } }).profiles?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {(invite as unknown as { profiles?: { display_name: string; username: string } }).profiles?.display_name ||
                                                (invite as unknown as { profiles?: { username: string } }).profiles?.username ||
                                                'Usuário'}
                                        </p>
                                        <p
                                            className="text-xs text-white/35"
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            {invite.code}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Status */}
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${statusColors[invite.status] || ''}`}
                                    >
                                        {invite.status}
                                    </span>

                                    {/* Actions */}
                                    {invite.status === 'pending' && (
                                        <div className="flex gap-1.5">
                                            <GlassButton
                                                variant="ghost"
                                                onClick={() => handleApprove(invite.id)}
                                                isLoading={actionLoading === invite.id}
                                                className="!min-h-[32px] !min-w-[32px] !p-1.5 !rounded-lg"
                                            >
                                                <Check size={14} className="text-[var(--accent-success)]" />
                                            </GlassButton>
                                            <GlassButton
                                                variant="ghost"
                                                onClick={() => handleReject(invite.id)}
                                                disabled={actionLoading === invite.id}
                                                className="!min-h-[32px] !min-w-[32px] !p-1.5 !rounded-lg"
                                            >
                                                <X size={14} className="text-[var(--accent-danger)]" />
                                            </GlassButton>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
