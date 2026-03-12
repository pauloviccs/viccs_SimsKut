import { useState, useEffect } from 'react';
import { Search, Loader2, Award, X, Sparkles, Ribbon, Upload, ShieldCheck } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { supabase } from '@/lib/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { toast } from 'sonner';
import {
    fetchAllChallengeBadges, awardBadgeToUser, removeUserBadge, fetchUserBadges,
    fetchAdminTitles, fetchAdminBadges, createAdminTitle, createAdminBadge,
    assignTitleToUser, awardAdminBadgeToUser
} from '@/lib/challengeQueries';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminBadgeManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searching, setSearching] = useState(false);

    const [availableBadges, setAvailableBadges] = useState<any[]>([]);
    const [adminBadges, setAdminBadges] = useState<any[]>([]);
    const [userBadges, setUserBadges] = useState<any[]>([]);
    // Lista unificada de títulos: admin_titles + badge_titles de desafios
    const [allTitles, setAllTitles] = useState<{ key: string; id: string | null; title: string; source: 'admin' | 'challenge' }[]>([]);

    // Awarding state
    const [selectedBadge, setSelectedBadge] = useState<string>('');
    const [selectedAdminBadge, setSelectedAdminBadge] = useState<string>('');
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [isAwarding, setIsAwarding] = useState(false);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);

    // Creation State
    const [newTitle, setNewTitle] = useState('');
    const [newBadgeTitle, setNewBadgeTitle] = useState('');
    const [newBadgeImage, setNewBadgeImage] = useState('');
    const [isCreatingTitle, setIsCreatingTitle] = useState(false);
    const [isCreatingBadge, setIsCreatingBadge] = useState(false);

    // Initial load — carrega tudo e monta a lista unificada de títulos
    useEffect(() => {
        Promise.all([
            fetchAdminTitles(),
            fetchAllChallengeBadges(),
            fetchAdminBadges(),
        ]).then(([admTitles, challengeBadges, admBadges]) => {
            setAdminBadges(admBadges);

            // Montar availableBadges (para badge de desafio)
            setAvailableBadges(challengeBadges);

            // Montar lista unificada: admin + desafios (sem duplicatas por texto)
            const adminItems = admTitles.map((t: any) => ({
                key: `admin_${t.id}`,
                id: t.id as string | null,
                title: t.title,
                source: 'admin' as const,
            }));
            const existingTitles = new Set(admTitles.map((t: any) => t.title.toLowerCase()));
            const challengeItems = challengeBadges
                .filter((b: any) => b.title && !existingTitles.has(b.title.toLowerCase()))
                .map((b: any) => ({
                    key: `challenge_${b.id}`,
                    id: null as string | null,
                    title: b.title,
                    source: 'challenge' as const,
                }));

            setAllTitles([...adminItems, ...challengeItems]);
        }).catch(console.error);
    }, []);

    // Search users
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setUsers([]);
                return;
            }
            setSearching(true);
            const { data } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url, is_verified')
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .limit(5);
            setUsers(data || []);
            setSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load active user info
    useEffect(() => {
        if (!selectedUser) {
            setUserBadges([]);
            return;
        }
        setIsLoadingBadges(true);
        fetchUserBadges(selectedUser.id)
            .then(data => setUserBadges(data))
            .catch(console.error)
            .finally(() => setIsLoadingBadges(false));
    }, [selectedUser]);

    const handleBadgeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('png')) {
            toast.error('Apenas imagens .png são permitidas para badges.');
            return;
        }

        const img = new Image();
        img.onload = async () => {
            if (img.width > 256 || img.height > 256) {
                toast.warning('A imagem idealmente deve ter 256x256 pixels.', { duration: 4000 });
            }

            let toastId;
            try {
                toastId = toast.loading('Fazendo upload da imagem...');
                const fileName = `badge_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
                const { error } = await supabase.storage
                    .from('challenge-assets')
                    .upload(`global_badges/${fileName}`, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    toast.error(`Erro no upload: ${error.message}`, { id: toastId });
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('challenge-assets')
                    .getPublicUrl(`global_badges/${fileName}`);

                setNewBadgeImage(publicUrlData.publicUrl);
                toast.success('Imagem enviada com sucesso!', { id: toastId });
            } catch (err: any) {
                toast.error('Ocorreu um erro no servidor.', { id: toastId });
                console.error(err);
            }
        };
        img.onerror = () => {
            toast.error('Arquivo de imagem corrompido.');
        };
        img.src = URL.createObjectURL(file);
    };

    const handleCreateTitle = async () => {
        if (!newTitle.trim()) return;
        setIsCreatingTitle(true);
        try {
            const added = await createAdminTitle(newTitle.trim());
            // Adicionar o novo título direto na lista unificada
            setAllTitles(prev => [{
                key: `admin_${added.id}`,
                id: added.id,
                title: added.title,
                source: 'admin' as const,
            }, ...prev]);
            setNewTitle('');
            toast.success("Título global cadastrado com sucesso!");
        } catch (e: any) {
            toast.error(e.message || "Erro ao cadastrar título");
        } finally {
            setIsCreatingTitle(false);
        }
    };

    const handleCreateAdminBadge = async () => {
        if (!newBadgeTitle.trim() || !newBadgeImage.trim()) return;
        setIsCreatingBadge(true);
        try {
            const added = await createAdminBadge(newBadgeTitle.trim(), newBadgeImage.trim());
            setAdminBadges(prev => [added, ...prev]);
            setNewBadgeTitle('');
            setNewBadgeImage('');
            toast.success("Badge global cadastrada com sucesso!");
        } catch (e: any) {
            toast.error(e.message || "Erro ao cadastrar badge");
        } finally {
            setIsCreatingBadge(false);
        }
    };

    const handleAwardChallengeBadge = async () => {
        if (!selectedUser || !selectedBadge) return;
        setIsAwarding(true);
        try {
            await awardBadgeToUser(selectedBadge, selectedUser.id);
            toast.success("Badge de desafio entregue!");
            const newBadges = await fetchUserBadges(selectedUser.id);
            setUserBadges(newBadges);
        } catch (e: any) {
            toast.error(e.message || "Erro ao entregar badge");
        } finally {
            setIsAwarding(false);
        }
    };

    const handleAwardAdminBadge = async () => {
        if (!selectedUser || !selectedAdminBadge) return;
        setIsAwarding(true);
        try {
            const badge = adminBadges.find(b => b.id === selectedAdminBadge);
            if (!badge) throw new Error("Badge não encontrada");
            await awardAdminBadgeToUser(badge.id, badge.title, badge.image_url, selectedUser.id);
            toast.success("Badge global entregue!");
            const newBadges = await fetchUserBadges(selectedUser.id);
            setUserBadges(newBadges);
        } catch (e: any) {
            toast.error(e.message || "Erro ao entregar badge");
        } finally {
            setIsAwarding(false);
        }
    };

    const handleAssignTitle = async () => {
        if (!selectedUser || !selectedTitle) return;
        setIsAwarding(true);
        try {
            // selectedTitle carrega `key` do allTitles, buscamos o objeto completo
            const titleObj = allTitles.find(t => t.key === selectedTitle);
            if (!titleObj) throw new Error('Título não encontrado.');
            // titleId = null para títulos de desafio (sem FK em admin_titles)
            await assignTitleToUser(titleObj.id, titleObj.title, selectedUser.id);
            toast.success(`Título "${titleObj.title}" atribuído e adicionado ao inventário do usuário!`);
        } catch (e: any) {
            toast.error(e.message || "Erro ao atribuir título");
        } finally {
            setIsAwarding(false);
        }
    };

    const handleRevoke = async (badgeId: string) => {
        if (!confirm('Deseja realmente REMOVER essa badge?')) return;
        try {
            await removeUserBadge(badgeId);
            toast.success('Badge removida.');
            setUserBadges(prev => prev.filter(b => b.id !== badgeId));
        } catch (e: any) {
            toast.error(e.message || 'Erro ao remover badge');
        }
    };

    return (
        <div className="space-y-8 mt-8">
            {/* Cadastro Global */}
            <GlassCard className="p-6 border-white/10">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" /> Cadastros Globais Independentes
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/80">Novo Título (Ex: Moderador, Apoiador)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nome do Título..."
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="flex-1 bg-[#111]/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <GlassButton onClick={handleCreateTitle} disabled={!newTitle || isCreatingTitle} className="bg-blue-600 hover:bg-blue-500 border-none px-4 shrink-0">
                                {isCreatingTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                            </GlassButton>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/80">Nova Badge Global (Sem Desafio)</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Nome da badge..."
                                value={newBadgeTitle}
                                onChange={e => setNewBadgeTitle(e.target.value)}
                                className="w-full bg-[#111]/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="URL ou enviar .png..."
                                    value={newBadgeImage}
                                    onChange={e => setNewBadgeImage(e.target.value)}
                                    className="flex-1 bg-[#111]/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                                <label className="flex-shrink-0 cursor-pointer bg-white/10 hover:bg-white/20 transition-colors border border-white/10 rounded-xl px-3 py-2 text-white text-sm flex items-center justify-center">
                                    <Upload className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Upload</span>
                                    <input
                                        type="file"
                                        accept="image/png"
                                        className="hidden"
                                        onChange={handleBadgeImageUpload}
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <GlassButton onClick={handleCreateAdminBadge} disabled={!newBadgeTitle || !newBadgeImage || isCreatingBadge} className="bg-indigo-600 hover:bg-indigo-500 border-none px-6 w-full sm:w-auto">
                                    {isCreatingBadge ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Badge'}
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Atribuição aos Usuários */}
            <GlassCard className="p-6 border-white/10">
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Atribuição Manual em Usuários
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Buscador */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/80">Selecionar Usuário</label>
                        <div className="relative z-50">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Nome ou username#tag"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#111]/50 border border-white/10 rounded-xl py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
                            />
                            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white/40" />}

                            <AnimatePresence>
                                {!selectedUser && users.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                        className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                                    >
                                        {users.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => { setSelectedUser(u); setSearchQuery(''); setUsers([]); }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-amber-500/10 transition-all text-left border-b border-white/5 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                                                    {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-amber-500">{u.username[0]?.toUpperCase()}</div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{u.display_name || 'Anônimo'}</p>
                                                    <p className="text-xs text-white/50">@{u.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {selectedUser && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/50">
                                            {selectedUser.avatar_url && <img src={selectedUser.avatar_url} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                                {selectedUser.display_name}
                                                {selectedUser.is_verified && <VerifiedBadge size={14} />}
                                            </p>
                                            <p className="text-xs text-amber-500/70">@{selectedUser.username}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Verified Toggle */}
                                <button
                                    onClick={async () => {
                                        const newValue = !selectedUser.is_verified;
                                        const { error } = await supabase
                                            .from('profiles')
                                            .update({ is_verified: newValue })
                                            .eq('id', selectedUser.id);
                                        if (error) {
                                            toast.error('Erro ao atualizar verificação: ' + error.message);
                                            return;
                                        }
                                        setSelectedUser({ ...selectedUser, is_verified: newValue });
                                        toast.success(newValue ? 'Usuário verificado! ✓' : 'Verificação removida.');
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        selectedUser.is_verified
                                            ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400'
                                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-400'
                                    }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    {selectedUser.is_verified ? 'Remover Verificação' : 'Verificar Usuário'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="space-y-6 border-l border-white/10 pl-0 md:pl-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-white/80"><Ribbon className="inline w-4 h-4 mr-1 text-blue-400" />1. Atribuir Título</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedTitle}
                                    onChange={e => setSelectedTitle(e.target.value)}
                                    disabled={!selectedUser}
                                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                >
                                    <option value="">(Remover Título Atual / Nenhum)</option>
                                    {allTitles.filter(t => t.source === 'admin').length > 0 && (
                                        <optgroup label="── Títulos Admin ──">
                                            {allTitles.filter(t => t.source === 'admin').map(t => (
                                                <option key={t.key} value={t.key}>{t.title}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {allTitles.filter(t => t.source === 'challenge').length > 0 && (
                                        <optgroup label="── Títulos de Desafios ──">
                                            {allTitles.filter(t => t.source === 'challenge').map(t => (
                                                <option key={t.key} value={t.key}>{t.title}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                                <GlassButton onClick={handleAssignTitle} disabled={!selectedUser || isAwarding} className="bg-blue-600 hover:bg-blue-500 shrink-0">Salvar Título</GlassButton>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-white/80"><Award className="inline w-4 h-4 mr-1 text-orange-400" />2. Conceder Badge</label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <select value={selectedAdminBadge} onChange={e => setSelectedAdminBadge(e.target.value)} disabled={!selectedUser} className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="">Selecione Badge Global...</option>
                                        {adminBadges.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                    </select>
                                    <GlassButton onClick={handleAwardAdminBadge} disabled={!selectedUser || !selectedAdminBadge || isAwarding} className="bg-indigo-600 hover:bg-indigo-500 shrink-0">Entregar</GlassButton>
                                </div>
                                <div className="flex gap-2">
                                    <select value={selectedBadge} onChange={e => setSelectedBadge(e.target.value)} disabled={!selectedUser} className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                        <option value="">Selecione Badge de Desafio...</option>
                                        {availableBadges.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                    </select>
                                    <GlassButton onClick={handleAwardChallengeBadge} disabled={!selectedUser || !selectedBadge || isAwarding} className="bg-amber-600 hover:bg-amber-500 shrink-0">Entregar</GlassButton>
                                </div>
                            </div>
                        </div>

                        {selectedUser && (
                            <div className="pt-4 border-t border-white/10">
                                <h4 className="text-xs text-white/60 mb-2">Inventário do Usuário:</h4>
                                {isLoadingBadges ? <Loader2 className="w-4 animate-spin text-white/30" /> : (
                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                                        {userBadges.map(ub => (
                                            <div key={ub.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                                                <div className="flex items-center gap-2">
                                                    <img src={ub.badge_image_url} alt="" className="w-6 h-6 object-contain" />
                                                    <span className="text-xs text-white/80">{ub.badge_title}</span>
                                                </div>
                                                <button onClick={() => handleRevoke(ub.id)} className="text-[10px] text-red-500">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
