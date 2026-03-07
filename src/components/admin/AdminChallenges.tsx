import { useState, useEffect } from 'react';
import { Plus, Loader2, RefreshCw, Edit } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ChallengeAdminForm } from '../community/challenges/ChallengeAdminForm';
import { AdminBadgeManager } from './AdminBadgeManager';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminChallenges() {
    const [isCreating, setIsCreating] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<any>(null);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('challenges')
                .select('id, title, status, created_at, badge_title')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setChallenges(data || []);
        } catch (err) {
            console.error('Error fetching challenges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (challenge: any) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('challenges')
                .select('*, milestones:challenge_milestones(*)')
                .eq('id', challenge.id)
                .single();
            if (data) {
                data.milestones = data.milestones.sort((a: any, b: any) => a.order_index - b.order_index);
                setEditingChallenge(data);
            }
            if (error) throw error;
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        Desafios da Comunidade
                    </h1>
                    <p className="text-white/50 text-sm mt-1">
                        Crie e gerencie os desafios ativos na plataforma.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <GlassButton
                        onClick={fetchChallenges}
                        variant="ghost"
                        className="!p-2 text-white/60 hover:text-white"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </GlassButton>
                    <GlassButton onClick={() => setIsCreating(true)} className="bg-amber-600 hover:bg-amber-500 border-none font-bold">
                        <Plus className="w-5 h-5 mr-2" />
                        Criar Desafio
                    </GlassButton>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/80">
                        <thead className="bg-[#111] border-b border-white/10 text-white/50 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Desafio</th>
                                <th className="px-6 py-4 font-semibold">Badge Ofertada</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Criado em</th>
                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Carregando desafios...
                                    </td>
                                </tr>
                            ) : challenges.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                                        Nenhum desafio encontrado. Crie um novo acima!
                                    </td>
                                </tr>
                            ) : (
                                challenges.map((challenge) => (
                                    <tr key={challenge.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {challenge.title}
                                        </td>
                                        <td className="px-6 py-4 text-white/70">
                                            {challenge.badge_title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${challenge.status === 'active'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : challenge.status === 'draft'
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    : 'bg-white/10 text-white/50 border border-white/20'
                                                }`}>
                                                {challenge.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white/60">
                                            {format(new Date(challenge.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditClick(challenge)}
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white"
                                                title="Editar"
                                            >
                                                <Edit size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <AdminBadgeManager />

            {(isCreating || editingChallenge) && (
                <ChallengeAdminForm
                    initialData={editingChallenge}
                    onClose={() => {
                        setIsCreating(false);
                        setEditingChallenge(null);
                        fetchChallenges();
                    }}
                />
            )}
        </div>
    );
}

