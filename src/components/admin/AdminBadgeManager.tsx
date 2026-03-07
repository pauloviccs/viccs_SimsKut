import { useState, useEffect } from 'react';
import { Search, Loader2, Award, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { toast } from 'sonner';
import { fetchAllChallengeBadges, awardBadgeToUser, removeUserBadge, fetchUserBadges } from '@/lib/challengeQueries';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente Administrador Independente focado na Atribuição de Badges
 * Pode ser isolado ou importado dentro de `AdminChallenges`
 */
export function AdminBadgeManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searching, setSearching] = useState(false);

    const [availableBadges, setAvailableBadges] = useState<any[]>([]);
    const [userBadges, setUserBadges] = useState<any[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<string>('');
    const [isAwarding, setIsAwarding] = useState(false);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);

    // Initial load: Badges that exist logically globally
    useEffect(() => {
        fetchAllChallengeBadges()
            .then(badges => setAvailableBadges(badges))
            .catch(e => console.error("Error loading globally available badges:", e));
    }, []);

    // Search users debounce effect handler
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setUsers([]);
                return;
            }
            setSearching(true);
            const { data } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .limit(5);
            setUsers(data || []);
            setSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load active badges of a specific user when they get selected
    useEffect(() => {
        if (!selectedUser) {
            setUserBadges([]);
            return;
        }
        setIsLoadingBadges(true);
        fetchUserBadges(selectedUser.id)
            .then(data => setUserBadges(data))
            .catch(e => console.error(e))
            .finally(() => setIsLoadingBadges(false));
    }, [selectedUser]);

    const handleAward = async () => {
        if (!selectedUser || !selectedBadge) return;
        setIsAwarding(true);
        try {
            await awardBadgeToUser(selectedBadge, selectedUser.id);
            toast.success("Badge entregue com sucesso!");

            // Push Realtime Notification as systemic actor (null is fine, DB constraints apply, we fake it using current Admin as Actor if constraint is failing)
            const currentAdmin = (await supabase.auth.getUser()).data.user?.id;
            if (currentAdmin) {
                await supabase.from('notifications').insert({
                    user_id: selectedUser.id,
                    actor_id: currentAdmin,
                    type: 'badge_awarded',
                    content: 'Parabéns! Você recebeu uma nova badge! ✨🏆'
                });
            }

            // refreshes locally user possession view
            const newBadges = await fetchUserBadges(selectedUser.id);
            setUserBadges(newBadges);
        } catch (e: any) {
            toast.error(e.message || "Erro ao entregar badge");
        } finally {
            setIsAwarding(false);
        }
    };

    const handleRevoke = async (badgeId: string) => {
        if (!confirm('Deseja realmente REMOVER essa badge deste usuário?')) return;
        try {
            await removeUserBadge(badgeId);
            toast.success('Badge removida.');
            setUserBadges(prev => prev.filter(b => b.id !== badgeId));
        } catch (e: any) {
            toast.error(e.message || 'Erro ao remover badge');
        }
    };

    return (
        <GlassCard className="p-6 border-white/10 mt-8">
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Atribuição Manual de Badges
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Lado Equerdo: Seletor de Usuario */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-white/80">Buscar Usuário</label>
                    <div className="relative z-50">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Nome ou username#tag"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111]/50 border border-white/10 rounded-xl py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white/40" />
                        )}

                        <AnimatePresence>
                            {!selectedUser && users.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                                >
                                    {users.map((u, idx) => (
                                        <motion.button
                                            key={u.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 + 0.1 }}
                                            onClick={() => { setSelectedUser(u); setSearchQuery(''); setUsers([]); }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-amber-500/10 hover:pr-4 transition-all text-left border-b border-white/5 last:border-0 group cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/10 group-hover:border-amber-500/50 transition-colors">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 flex items-center justify-center text-xs font-bold text-amber-500">
                                                        {u.display_name?.[0]?.toUpperCase() || u.username[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white leading-tight group-hover:text-amber-400 transition-colors">{u.display_name || 'Anônimo'}</p>
                                                <p className="text-xs text-white/50">@{u.username}</p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {selectedUser && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0 border border-amber-500/50">
                                        {selectedUser.avatar_url && <img src={selectedUser.avatar_url} className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{selectedUser.display_name || 'Anônimo'}</p>
                                        <p className="text-xs text-amber-500/70">@{selectedUser.username}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 text-white/50 hover:text-white bg-black/20 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Lado Direito: Selecionar & Gerenciar Badges */}
                <div className="space-y-4 border-l border-white/10 pl-0 md:pl-8">
                    <label className="block text-sm font-medium text-white/80">Conceder Nova Badge</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedBadge}
                            onChange={(e) => setSelectedBadge(e.target.value)}
                            disabled={!selectedUser}
                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        >
                            <option value="">Selecione a Badge (Desafio)...</option>
                            {availableBadges.map(b => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                        </select>
                        <GlassButton
                            onClick={handleAward}
                            disabled={!selectedUser || !selectedBadge || isAwarding}
                            className="bg-amber-600 hover:bg-amber-500 border-none px-4 py-2 shrink-0 font-semibold"
                        >
                            {isAwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entregar'}
                        </GlassButton>
                    </div>

                    {selectedUser && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <h4 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">
                                Badges Possuídas Atualmente
                            </h4>
                            {isLoadingBadges ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                            ) : userBadges.length === 0 ? (
                                <p className="text-sm text-white/30 italic">O usuário não tem emblemas.</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {userBadges.map(ub => (
                                        <div key={ub.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/40">
                                                    {ub.badge_image_url && <img src={ub.badge_image_url} alt="B" className="w-full h-full object-cover" />}
                                                </div>
                                                <span className="text-sm text-white/80 font-medium truncate w-32">{ub.badge_title}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRevoke(ub.id)}
                                                className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
