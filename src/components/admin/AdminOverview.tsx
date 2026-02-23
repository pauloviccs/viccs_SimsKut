import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Users, Ticket, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getInviteStats } from '@/lib/inviteService';

interface Stats {
    totalUsers: number;
    pendingInvites: number;
    approvedInvites: number;
    totalPosts: number;
}

export function AdminOverview() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        pendingInvites: 0,
        approvedInvites: 0,
        totalPosts: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const [usersRes, postsRes, inviteStats] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
                    getInviteStats(),
                ]);

                setStats({
                    totalUsers: usersRes.count || 0,
                    totalPosts: postsRes.count || 0,
                    pendingInvites: inviteStats.pending,
                    approvedInvites: inviteStats.approved,
                });
            } catch (err) {
                console.error('Erro ao carregar stats:', err);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    const cards = [
        {
            label: 'Total de Membros',
            value: stats.totalUsers,
            icon: Users,
            color: 'var(--accent-primary)',
        },
        {
            label: 'Convites Pendentes',
            value: stats.pendingInvites,
            icon: Ticket,
            color: 'var(--accent-warning)',
        },
        {
            label: 'Convites Aprovados',
            value: stats.approvedInvites,
            icon: TrendingUp,
            color: 'var(--accent-success)',
        },
        {
            label: 'Total de Posts',
            value: stats.totalPosts,
            icon: MessageSquare,
            color: 'var(--discord-brand)',
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Visão Geral</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <GlassCard key={card.label} variant="premium" className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${card.color}15` }}
                                >
                                    <Icon size={20} style={{ color: card.color }} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1">
                                {loading ? '—' : card.value}
                            </p>
                            <p className="text-xs text-white/40">{card.label}</p>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Quick info */}
            <GlassCard className="p-5">
                <h2 className="text-lg font-semibold mb-3">Atividade Recente</h2>
                <p className="text-sm text-white/40 text-center py-6">
                    Nenhuma atividade recente registrada.
                </p>
            </GlassCard>
        </div>
    );
}
