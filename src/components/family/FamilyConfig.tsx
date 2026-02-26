import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Pencil, Trash2, X, Save, Camera,
    Briefcase, Star, Zap, Loader2, ChevronDown
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { AvatarCropper } from '@/components/settings/AvatarCropper';
import {
    getFamilies, createFamily, updateFamily, deleteFamily,
    getSims, createSim, updateSim, deleteSim,
    addTrait, removeTrait,
} from '@/lib/familyService';
import { processAndUpload } from '@/lib/imageService';
import type { Family, Sim } from '@/types';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const PROFESSIONS = [
    'Astronauta', 'Detetive', 'Médico(a)', 'Cientista', 'Escritor(a)',
    'Chef', 'Artista', 'Atleta', 'Empresário(a)', 'Hacker',
    'Gamer Profissional', 'Influencer', 'Músico(a)', 'Policial',
    'Professor(a)', 'Militar', 'Desempregado(a)', 'Outra',
];

const SKILL_OPTIONS = [
    'Culinária', 'Carisma', 'Jardinagem', 'Violão', 'Piano',
    'Pintura', 'Escrita', 'Lógica', 'Fitness', 'Videogame',
    'Comédia', 'Fotografia', 'Programação', 'Mixologia', 'Robótica',
];

const QUALITY_OPTIONS = [
    'Alegre', 'Genial', 'Criativo', 'Preguiçoso', 'Malvado',
    'Romântico', 'Aventureiro', 'Perfeccionista', 'Desastrado',
    'Festeiro', 'Solitário', 'Geek', 'Guloso', 'Atlético',
];

export function FamilyConfig() {
    const { user } = useAuthStore();
    const [families, setFamilies] = useState<Family[]>([]);
    const [sims, setSims] = useState<Sim[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);
    const [editFamilyName, setEditFamilyName] = useState('');
    const [showCreateSim, setShowCreateSim] = useState(false);
    const [editingSim, setEditingSim] = useState<Sim | null>(null);
    const [familyName, setFamilyName] = useState('');
    const [showNewFamily, setShowNewFamily] = useState(false);

    // Sim form
    const [simForm, setSimForm] = useState({ name: '', profession: '', bio: '' });
    const [simPhotoBlob, setSimPhotoBlob] = useState<Blob | null>(null);
    const [simPhotoPreview, setSimPhotoPreview] = useState<string | null>(null);
    const [simCropFile, setSimCropFile] = useState<File | null>(null);
    const [savingSim, setSavingSim] = useState(false);
    const [newTraitValue, setNewTraitValue] = useState('');
    const [newTraitType, setNewTraitType] = useState<'quality' | 'skill'>('quality');
    const simPhotoRef = useRef<HTMLInputElement>(null);

    // Load families
    useEffect(() => {
        if (!user) return;
        getFamilies(user.id)
            .then(setFamilies)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    // Load sims when family selected
    useEffect(() => {
        if (!selectedFamily) return;
        setLoading(true);
        getSims(selectedFamily.id)
            .then(setSims)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedFamily]);

    const handleCreateFamily = async () => {
        if (!user || !familyName.trim()) return;
        try {
            const fam = await createFamily(user.id, familyName);
            setFamilies((prev) => [fam, ...prev]);
            setFamilyName('');
            setShowNewFamily(false);
        } catch (e) { console.error(e); }
    };

    const openEditFamily = (family: Family) => {
        setEditingFamily(family);
        setEditFamilyName(family.family_name);
    };

    const handleUpdateFamily = async () => {
        if (!editingFamily || !editFamilyName.trim()) return;
        try {
            await updateFamily(editingFamily.id, editFamilyName);
            setFamilies((prev) => prev.map((f) => f.id === editingFamily.id ? { ...f, family_name: editFamilyName } : f));
            if (selectedFamily?.id === editingFamily.id) {
                setSelectedFamily({ ...selectedFamily, family_name: editFamilyName });
            }
            setEditingFamily(null);
        } catch (e) { console.error(e); }
    };

    const handleDeleteFamily = async (familyId: string) => {
        if (!confirm('Deletar família e todos os Sims?')) return;
        try {
            await deleteFamily(familyId);
            setFamilies((prev) => prev.filter((f) => f.id !== familyId));
            if (selectedFamily?.id === familyId) {
                setSelectedFamily(null);
                setSims([]);
            }
        } catch (e) { console.error(e); }
    };

    const openCreateSim = () => {
        setSimForm({ name: '', profession: '', bio: '' });
        setSimPhotoBlob(null);
        setSimPhotoPreview(null);
        setEditingSim(null);
        setShowCreateSim(true);
    };

    const openEditSim = (sim: Sim) => {
        setSimForm({
            name: sim.name,
            profession: sim.profession || '',
            bio: sim.bio || '',
        });
        setSimPhotoPreview(sim.photo_url);
        setSimPhotoBlob(null);
        setEditingSim(sim);
        setShowCreateSim(true);
    };

    const handleSimPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file?.type.startsWith('image/')) return;
        setSimCropFile(file); // Abre o cropper
        e.target.value = '';
    };

    const handleSimCropComplete = (blob: Blob) => {
        setSimCropFile(null);
        setSimPhotoBlob(blob);
        const url = URL.createObjectURL(blob);
        setSimPhotoPreview(url);
    };

    const handleSaveSim = async () => {
        if (!user || !selectedFamily || !simForm.name.trim()) return;
        setSavingSim(true);

        try {
            let photoUrl = editingSim?.photo_url || undefined;

            if (simPhotoBlob) {
                const ts = Date.now();
                const path = `${user.id}/${ts}.webp`;
                const result = await processAndUpload(simPhotoBlob as File, 'sim-photos', path, 300);
                photoUrl = result.url;
            }

            if (editingSim) {
                await updateSim(editingSim.id, {
                    name: simForm.name,
                    profession: simForm.profession || undefined,
                    bio: simForm.bio || undefined,
                    photo_url: photoUrl,
                });
                setSims((prev) => prev.map((s) =>
                    s.id === editingSim.id
                        ? { ...s, ...simForm, photo_url: photoUrl || s.photo_url }
                        : s
                ));
            } else {
                const newSim = await createSim(selectedFamily.id, {
                    name: simForm.name,
                    profession: simForm.profession || undefined,
                    bio: simForm.bio || undefined,
                    photo_url: photoUrl,
                });
                setSims((prev) => [...prev, newSim]);
            }

            setShowCreateSim(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingSim(false);
        }
    };

    const handleDeleteSim = async (simId: string) => {
        if (!confirm('Deletar este Sim?')) return;
        try {
            await deleteSim(simId);
            setSims((prev) => prev.filter((s) => s.id !== simId));
        } catch (e) { console.error(e); }
    };

    const handleAddTrait = async (simId: string) => {
        if (!newTraitValue.trim()) return;
        try {
            const trait = await addTrait(simId, newTraitType, newTraitValue);
            setSims((prev) => prev.map((s) =>
                s.id === simId ? { ...s, traits: [...(s.traits || []), trait] } : s
            ));
            setNewTraitValue('');
        } catch (e) { console.error(e); }
    };

    const handleRemoveTrait = async (simId: string, traitId: string) => {
        try {
            await removeTrait(traitId);
            setSims((prev) => prev.map((s) =>
                s.id === simId ? { ...s, traits: (s.traits || []).filter((t) => t.id !== traitId) } : s
            ));
        } catch (e) { console.error(e); }
    };

    // ===== SIM LIST (inside family) =====
    if (selectedFamily) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setSelectedFamily(null); setSims([]); }}
                        className="w-9 h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                    >
                        <ChevronDown size={18} className="rotate-90" />
                    </button>
                    <h1 className="text-2xl font-bold flex-1">{selectedFamily.family_name}</h1>
                    <GlassButton variant="primary" onClick={openCreateSim}>
                        <span className="flex items-center gap-2"><Plus size={16} /> Novo Sim</span>
                    </GlassButton>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={28} className="animate-spin text-white/30" />
                    </div>
                ) : sims.length === 0 ? (
                    <GlassCard className="text-center py-12">
                        <Users size={40} className="mx-auto mb-4 text-white/30" />
                        <h2 className="text-lg font-semibold text-white/70 mb-2">Nenhum Sim</h2>
                        <p className="text-sm text-white/40">Adicione Sims a esta família!</p>
                    </GlassCard>
                ) : (
                    <div className="space-y-4">
                        {sims.map((sim) => (
                            <motion.div
                                key={sim.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4"
                            >
                                <div className="flex gap-4">
                                    <Avatar
                                        src={sim.photo_url}
                                        alt={sim.name}
                                        size="xl"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white/90">{sim.name}</h3>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditSim(sim)}
                                                    className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 cursor-pointer"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSim(sim.id)}
                                                    className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-[var(--accent-danger)] cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        {sim.profession && (
                                            <p className="text-xs text-[var(--accent-primary)] flex items-center gap-1 mt-1">
                                                <Briefcase size={12} /> {sim.profession}
                                            </p>
                                        )}
                                        {sim.bio && (
                                            <p className="text-xs text-white/50 mt-2">{sim.bio}</p>
                                        )}

                                        {/* Traits */}
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {(sim.traits || []).map((trait) => (
                                                <span
                                                    key={trait.id}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-70 ${trait.trait_type === 'quality'
                                                        ? 'bg-[var(--accent-warning)]/15 text-[var(--accent-warning)]'
                                                        : 'bg-[var(--accent-success)]/15 text-[var(--accent-success)]'
                                                        }`}
                                                    onClick={() => handleRemoveTrait(sim.id, trait.id)}
                                                    title="Clique para remover"
                                                >
                                                    {trait.trait_type === 'quality' ? <Star size={10} /> : <Zap size={10} />}
                                                    {trait.value}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Add Trait */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <select
                                                value={newTraitType}
                                                onChange={(e) => setNewTraitType(e.target.value as 'quality' | 'skill')}
                                                className="bg-white/[0.05] border border-white/10 rounded-lg text-[10px] text-white/60 px-2 py-1.5 outline-none"
                                            >
                                                <option value="quality" className="bg-[#0f0f13] text-white">Qualidade</option>
                                                <option value="skill" className="bg-[#0f0f13] text-white">Habilidade</option>
                                            </select>
                                            <select
                                                value={newTraitValue}
                                                onChange={(e) => setNewTraitValue(e.target.value)}
                                                className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg text-[10px] text-white/60 px-2 py-1.5 outline-none"
                                            >
                                                <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                                {(newTraitType === 'quality' ? QUALITY_OPTIONS : SKILL_OPTIONS).map((opt) => (
                                                    <option key={opt} value={opt} className="bg-[#0f0f13] text-white">{opt}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleAddTrait(sim.id)}
                                                disabled={!newTraitValue}
                                                className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center hover:bg-[var(--accent-primary)]/30 transition-colors cursor-pointer disabled:opacity-30"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Sim Modal */}
                <AnimatePresence>
                    {showCreateSim && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShowCreateSim(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={spring}
                                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 w-full max-w-md"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-semibold text-white/90">
                                        {editingSim ? 'Editar Sim' : 'Novo Sim'}
                                    </h3>
                                    <button
                                        onClick={() => setShowCreateSim(false)}
                                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Photo */}
                                <div className="flex justify-center mb-5">
                                    <div className="relative group cursor-pointer" onClick={() => simPhotoRef.current?.click()}>
                                        <Avatar
                                            src={simPhotoPreview}
                                            alt={simForm.name || 'Sim'}
                                            size="xl"
                                        />
                                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera size={20} className="text-white/80" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <GlassInput
                                        label="Nome do Sim"
                                        value={simForm.name}
                                        onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                                        placeholder="Ex: Bella Goth"
                                    />
                                    <div>
                                        <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                                            Profissão
                                        </label>
                                        <select
                                            value={simForm.profession}
                                            onChange={(e) => setSimForm({ ...simForm, profession: e.target.value })}
                                            className="w-full min-h-[52px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50"
                                        >
                                            <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                            {PROFESSIONS.map((p) => (
                                                <option key={p} value={p} className="bg-[#0f0f13] text-white">{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <GlassInput
                                        label="Bio / Descrição"
                                        value={simForm.bio}
                                        onChange={(e) => setSimForm({ ...simForm, bio: e.target.value })}
                                        placeholder="Uma breve descrição do Sim"
                                    />
                                </div>

                                <GlassButton
                                    onClick={handleSaveSim}
                                    isLoading={savingSim}
                                    className="w-full mt-5"
                                >
                                    <span className="flex items-center gap-2">
                                        <Save size={16} />
                                        {editingSim ? 'Salvar Alterações' : 'Criar Sim'}
                                    </span>
                                </GlassButton>

                                <input
                                    ref={simPhotoRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSimPhotoSelect}
                                    className="hidden"
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cropper para foto do Sim */}
                {simCropFile && (
                    <AvatarCropper
                        file={simCropFile}
                        onCrop={handleSimCropComplete}
                        onCancel={() => setSimCropFile(null)}
                    />
                )}
            </div>
        );
    }

    // ===== FAMILY LIST =====
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Minha Família</h1>
                <GlassButton variant="primary" onClick={() => setShowNewFamily(true)}>
                    <span className="flex items-center gap-2"><Plus size={16} /> Nova Família</span>
                </GlassButton>
            </div>

            <AnimatePresence>
                {showNewFamily && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <GlassCard className="p-4 flex gap-3 items-end">
                            <div className="flex-1">
                                <GlassInput
                                    label="Nome da Família"
                                    value={familyName}
                                    onChange={(e) => setFamilyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                                    placeholder="Ex: Família Goth"
                                />
                            </div>
                            <GlassButton onClick={handleCreateFamily} className="mb-0.5">Criar</GlassButton>
                            <GlassButton variant="secondary" onClick={() => setShowNewFamily(false)} className="mb-0.5">
                                <X size={16} />
                            </GlassButton>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-white/30" />
                </div>
            ) : families.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <Users size={40} className="mx-auto mb-4 text-white/30" />
                    <h2 className="text-lg font-semibold text-white/70 mb-2">Nenhuma família criada</h2>
                    <p className="text-sm text-white/40">
                        Crie sua família Sims e adicione seus personagens! 👨‍👩‍👧‍👦
                    </p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {families.map((fam) => (
                        <motion.div
                            key={fam.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={spring}
                            className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-4 cursor-pointer hover:border-white/20 transition-colors group"
                            onClick={() => setSelectedFamily(fam)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/30 to-[var(--accent-success)]/20 flex items-center justify-center">
                                        <Users size={18} className="text-white/60" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/90">{fam.family_name}</h3>
                                        <p className="text-[10px] text-white/40">{fam.sims_count ?? 0} Sims</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditFamily(fam); }}
                                        className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFamily(fam.id); }}
                                        className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:!text-[var(--accent-danger)] transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Family Modal */}
            <AnimatePresence>
                {editingFamily && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setEditingFamily(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={spring}
                            className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-white/90">Editar Família</h3>
                                <button
                                    onClick={() => setEditingFamily(null)}
                                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <GlassInput
                                    label="Nome da Família"
                                    value={editFamilyName}
                                    onChange={(e) => setEditFamilyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateFamily()}
                                    placeholder="Ex: Família Goth"
                                />
                            </div>

                            <GlassButton
                                onClick={handleUpdateFamily}
                                className="w-full mt-5"
                            >
                                <span className="flex items-center gap-2">
                                    <Save size={16} /> Salvar Alterações
                                </span>
                            </GlassButton>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
