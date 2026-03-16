import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Users, Ticket, MessageSquare, TrendingUp, Save, ExternalLink, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getInviteStats } from '@/lib/inviteService';
import { getDiscordInviteUrl, setDiscordInviteUrl } from '@/lib/settingsService';
import { useAuthStore } from '@/store/authStore';

interface Stats {
    totalUsers: number;
    pendingInvites: number;
    approvedInvites: number;
    totalPosts: number;
}

export function AdminOverview() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        pendingInvites: 0,
        approvedInvites: 0,
        totalPosts: 0,
    });
    const [loading, setLoading] = useState(true);

    // ── Discord URL config ──
    const [discordUrl, setDiscordUrl] = useState('');
    const [discordSaving, setDiscordSaving] = useState(false);
    const [discordSaved, setDiscordSaved] = useState(false);

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

    // Carrega o link atual do Discord
    useEffect(() => {
        getDiscordInviteUrl().then((url) => {
            if (url) setDiscordUrl(url);
        });
    }, []);

    async function handleSaveDiscord() {
        if (!discordUrl.trim()) return;
        setDiscordSaving(true);
        const ok = await setDiscordInviteUrl(discordUrl.trim(), user?.id);
        setDiscordSaving(false);
        if (ok) {
            setDiscordSaved(true);
            setTimeout(() => setDiscordSaved(false), 2500);
        }
    }

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

            {/* Stats Grid */}
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

            {/* ── Configurações Rápidas ── */}
            <GlassCard variant="premium" className="p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Settings size={18} className="text-white/50" />
                    <h2 className="text-lg font-semibold">Configurações Rápidas</h2>
                </div>

                {/* Discord Invite URL */}
                <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-medium">
                        Link de Convite do Discord
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={discordUrl}
                            onChange={(e) => setDiscordUrl(e.target.value)}
                            placeholder="https://discord.gg/..."
                            className="flex-1 px-3 py-2.5 rounded-[var(--radius-sm)] bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-[var(--discord-brand)]/50 transition-colors"
                        />
                        <GlassButton
                            onClick={handleSaveDiscord}
                            isLoading={discordSaving}
                            className="shrink-0"
                            style={{ background: discordSaved ? 'var(--accent-success)' : 'var(--discord-brand)' }}
                        >
                            <span className="flex items-center gap-1.5">
                                <Save size={14} />
                                {discordSaved ? 'Salvo!' : 'Salvar'}
                            </span>
                        </GlassButton>
                    </div>
                    {discordUrl && (
                        <a
                            href={discordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--discord-brand)] hover:underline mt-1"
                        >
                            <ExternalLink size={12} />
                            Testar link atual
                        </a>
                    )}
                </div>
            </GlassCard>

            {/* Atividade Recente */}
            <GlassCard className="p-5">
                <h2 className="text-lg font-semibold mb-3">Atividade Recente</h2>
                <p className="text-sm text-white/40 text-center py-6">
                    Nenhuma atividade recente registrada.
                </p>
            </GlassCard>
        </div>
    );
}
