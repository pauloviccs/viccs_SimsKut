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
    // Tradicionais
    'Astronauta', 'Atleta', 'Médico(a)', 'Cientista', 'Detetive',
    'Engenheiro(a)', 'Advogado(a)', 'Político(a)',
    // Criativas
    'Ator/Atriz', 'Músico(a)', 'Escritor(a)', 'Artista / Pintor(a)', 'Comediante',
    // Negócios / Tecnologia
    'Empresário(a)', 'Hacker / Programador(a)', 'Executivo(a)', 'Financista',
    // Mídias
    'Influencer', 'Chef', 'Streamer',
    // Campo / Natureza
    'Fazendeiro(a)', 'Botânico(a)', 'Veterinário(a)',
    // Segurança
    'Policial', 'Militar', 'Agente Secreto',
    // Educação
    'Professor(a)', 'Conselheiro(a)',
    // Vilania / Alternativas
    'Chefe do Crime', 'Vilão(a) em Ascensão',
    // Sobrenatural
    'Alquimista', 'Investigador(a) Paranormal',
    // Outros
    'Gamer Profissional', 'Desempregado(a)', 'Aposentado(a)', 'Outra',
];

const SKILL_OPTIONS = [
    // Criativas
    'Pintura', 'Escrita', 'Fotografia', 'Escultura',
    'Fabricação de Velas', 'Costura', 'Arranjo Floral', 'Mixologia',
    // Musicais
    'Violão', 'Piano', 'Violino', 'Bateria', 'Baixo', 'DJ', 'Canto',
    // Conhecimento / Técnicas
    'Lógica', 'Programação', 'Robótica', 'Eletrônica',
    'Foguete', 'Pesquisa e Debate',
    // Sociais
    'Carisma', 'Comédia', 'Travessura', 'Transmissão ao Vivo',
    // Natureza
    'Jardinagem', 'Pesca', 'Rastreamento', 'Astrologia',
    'Veterinária', 'Escalada', 'Esqui', 'Snowboard', 'Mergulho Livre',
    // Físico
    'Fitness', 'Natação',
    // Culinária
    'Culinária', 'Gastronomia', 'Fabricação de Néctar',
    // Dom do Lar
    'Criatividade (Infantil)', 'Videogame', 'Trabalho Mental (Criança)', 'Motor (Criança)', 'Socialização (Criança)',
];

const QUALITY_OPTIONS = [
    // Emocionais
    'Alegre', 'Bom Humor', 'Mal-Humorado', 'Dramático', 'Infeliz',
    // Mentais
    'Genial', 'Analítico', 'Criativo', 'Curioso', 'Concentrado', 'Nerd', 'Geek', 'Lógico', 'Desonesto',
    // Sociais
    'Extrovertido', 'Tímido', 'Solitário', 'Sedutor', 'Amável',
    'Grosso', 'Manipulador', 'Festeiro', 'Engraçado',
    // Físicos
    'Atlético', 'Preguiçoso', 'Descuidado', 'Guloso', 'Limpo', 'Noturno', 'Madrugador',
    // Românticos
    'Romântico', 'Fiel', 'Ciumento', 'Pervertido', 'Serial Romântico',
    // Negativos
    'Malvado', 'Mesquinho', 'Antipático', 'Egoísta', 'Invejoso', 'Irritadiço',
    // Especiais
    'Aventureiro', 'Perfeccionista', 'Desastrado', 'Ambicioso', 'Neurótico',
    'Workaholic', 'Materialista', 'Amante de Animais', 'Amante da Natureza',
    'Eco-Consciente', 'Autoconfiante', 'Apreciador de Livros',
    'Detesta Crianças', 'Infantil', 'Amante de Cachorros', 'Amante de Gatos',
    'Não-comprometido', 'Cleptomaníaco', 'Paranóico',
];

const ASPIRATION_OPTIONS = [
    // Fortuna
    'Barão das Mansões', 'Fabulosamente Rico',
    // Amor
    'Alma Gêmea', 'Serial Romântico',
    // Família
    'Super Pai/Mãe', 'Grande Família Feliz', 'Vampiro Familiar',
    // Criatividade
    'Autor Best-Seller', 'Pintor Extraordinário', 'Mestre da Música', 'Comediante Brilhante',
    // Conhecimento
    'Nerd do Computador', 'Gênio da Lógica', 'Especialista em Poções', 'Mestre Vampiro', 'Curador de Museu', 'Acadêmico',
    // Esporte
    'Fisiculturista', 'Atleta Extraordinário',
    // Natureza
    'Entusiasta da Pesca', 'Botânico', 'Curador da Selva', 'Guardião do Monte Komorebi',
    // Popularidade
    'Amigo do Mundo', 'Líder da Trupe', 'Piada Viva', 'Ícone da Festa',
    // Animais
    'Amigo dos Animais', 'Treinador(a) Campeão(ã)', 'Fazendeiro(a)',
    // Estilo de Vida
    'Nativo(a) da Cidade', 'Mestre da Cultura de Selvadorada', 'Vida Sustentável', 'Fabricante Mestre', 'Senhor(a) do Néctar', 'Explorador(a) do Espaço', 'Paranormal', 'Lobisomem Alfa', 'Mágico(a) Supremo(a)', 'Filho(a) das Ilhas',
    // Criança
    'Gênio Infantil', 'Prodígio Artístico', 'Turbilhão Social', 'Campeão de Criatividade',
];

const LIFE_STAGE_OPTIONS = [
    { value: 'Recém-nascido', emoji: '👶' },
    { value: 'Bebê', emoji: '👶' },
    { value: 'Criança de colo', emoji: '🧒' },
    { value: 'Criança', emoji: '🧒' },
    { value: 'Adolescente', emoji: '🧑' },
    { value: 'Jovem Adulto', emoji: '🧑' },
    { value: 'Adulto', emoji: '🧑' },
    { value: 'Idoso', emoji: '👴' },
];

const OCCULT_OPTIONS = [
    { value: 'Humano', emoji: '👤' },
    { value: 'Vampiro', emoji: '🧛' },
    { value: 'Feiticeiro(a)', emoji: '🧙' },
    { value: 'Lobisim', emoji: '🐺' },
    { value: 'Sereia/o', emoji: '🧜' },
    { value: 'Alienígena', emoji: '👽' },
    { value: 'Sim Planta', emoji: '🌿' },
    { value: 'Fantasma', emoji: '👻' },
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
    const [simForm, setSimForm] = useState({ name: '', profession: '', bio: '', life_stage: '', occult_type: '', aspiration: '' });
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
        setSimForm({ name: '', profession: '', bio: '', life_stage: '', occult_type: '', aspiration: '' });
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
            life_stage: sim.life_stage || '',
            occult_type: sim.occult_type || '',
            aspiration: sim.aspiration || '',
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
                    ...(simForm.life_stage ? { life_stage: simForm.life_stage } : {}),
                    ...(simForm.occult_type ? { occult_type: simForm.occult_type } : {}),
                    ...(simForm.aspiration ? { aspiration: simForm.aspiration } : {}),
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
                    ...(simForm.life_stage ? { life_stage: simForm.life_stage } : {}),
                    ...(simForm.occult_type ? { occult_type: simForm.occult_type } : {}),
                    ...(simForm.aspiration ? { aspiration: simForm.aspiration } : {}),
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

                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {sim.life_stage && (
                                                <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/70">
                                                    {sim.life_stage}
                                                </span>
                                            )}
                                            {sim.occult_type && (
                                                <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/70">
                                                    {sim.occult_type}
                                                </span>
                                            )}
                                            {sim.aspiration && (
                                                <span className="px-1.5 py-0.5 rounded border border-[var(--accent-warning)]/20 bg-[var(--accent-warning)]/10 text-[10px] text-[var(--accent-warning)] flex items-center gap-1">
                                                    <Star size={10} /> {sim.aspiration}
                                                </span>
                                            )}
                                        </div>

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
                                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 w-full max-w-[90vw] md:max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
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

                                <div className="flex flex-col md:flex-row gap-6 mb-2">
                                    {/* Left side: Photo */}
                                    <div className="flex flex-col items-center gap-4 w-full md:w-1/3 shrink-0">
                                        <div className="relative group cursor-pointer mt-2" onClick={() => simPhotoRef.current?.click()}>
                                            <Avatar
                                                src={simPhotoPreview}
                                                alt={simForm.name || 'Sim'}
                                                size="xl"
                                                className="w-32 h-32 md:w-40 md:h-40"
                                            />
                                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Camera size={24} className="text-white/80" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/40 text-center px-4 hidden md:block">
                                            Clique na imagem para alterar a foto do seu Sim.
                                        </p>
                                    </div>

                                    {/* Right side: Form Fields */}
                                    <div className="flex-1 space-y-4">
                                        <GlassInput
                                            label="Nome do Sim"
                                            value={simForm.name}
                                            onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                                            placeholder="Ex: Bella Goth"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Estágio de Vida */}
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                                                    Estágio de Vida
                                                </label>
                                                <select
                                                    value={simForm.life_stage}
                                                    onChange={(e) => setSimForm({ ...simForm, life_stage: e.target.value })}
                                                    className="w-full min-h-[52px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                                                >
                                                    <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                                    {LIFE_STAGE_OPTIONS.map((s) => (
                                                        <option key={s.value} value={s.value} className="bg-[#0f0f13] text-white">
                                                            {s.emoji} {s.value}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Tipo Oculto */}
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                                                    Tipo de Sim
                                                </label>
                                                <select
                                                    value={simForm.occult_type}
                                                    onChange={(e) => setSimForm({ ...simForm, occult_type: e.target.value })}
                                                    className="w-full min-h-[52px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                                                >
                                                    <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                                    {OCCULT_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value} className="bg-[#0f0f13] text-white">
                                                            {o.emoji} {o.value}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Aspiração */}
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                                                    Aspiração
                                                </label>
                                                <select
                                                    value={simForm.aspiration}
                                                    onChange={(e) => setSimForm({ ...simForm, aspiration: e.target.value })}
                                                    className="w-full min-h-[52px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                                                >
                                                    <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                                    {ASPIRATION_OPTIONS.map((a) => (
                                                        <option key={a} value={a} className="bg-[#0f0f13] text-white">{a}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Profissão */}
                                            <div>
                                                <label className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 block ml-1">
                                                    Profissão
                                                </label>
                                                <select
                                                    value={simForm.profession}
                                                    onChange={(e) => setSimForm({ ...simForm, profession: e.target.value })}
                                                    className="w-full min-h-[52px] px-4 py-3 bg-white/[0.05] border border-white/12 rounded-[var(--radius-sm)] text-white text-sm backdrop-blur-md outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                                                >
                                                    <option value="" className="bg-[#0f0f13] text-white">Selecionar...</option>
                                                    {PROFESSIONS.map((p) => (
                                                        <option key={p} value={p} className="bg-[#0f0f13] text-white">{p}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <GlassInput
                                            label="Bio / Descrição"
                                            value={simForm.bio}
                                            onChange={(e) => setSimForm({ ...simForm, bio: e.target.value })}
                                            placeholder="Uma breve descrição do Sim"
                                        />
                                    </div>
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
