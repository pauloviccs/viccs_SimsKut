import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import * as q from '../../../lib/challengeQueries';
import { supabase } from '../../../lib/supabaseClient';
import { GlassCard } from '../../ui/GlassCard';
import { GlassButton } from '../../ui/GlassButton';
import { toast } from 'sonner';
import { Plus, X, Loader2, Bold, Italic, Underline, Link as LinkIcon, Strikethrough, Code, List, ListOrdered, Quote, Minus, Eraser } from 'lucide-react';

const EditorToolbar = () => (
    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5 rounded-t-xl">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Negrito"><Bold size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Itálico"><Italic size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Sublinhado"><Underline size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('strikeThrough', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Tachado"><Strikethrough size={16} /></button>
        <button type="button" onMouseDown={(e) => {
            e.preventDefault();
            const selection = window.getSelection()?.toString();
            if (selection) {
                document.execCommand('insertHTML', false, `<code>${selection}</code>`);
            } else {
                document.execCommand('formatBlock', false, 'PRE');
            }
        }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Código"><Code size={16} /></button>
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <button type="button" onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt('Cole o link:');
            if (url) document.execCommand('createLink', false, url);
        }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Adicionar Link"><LinkIcon size={16} /></button>

        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Lista com Marcadores"><List size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Lista Numerada"><ListOrdered size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'BLOCKQUOTE'); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Citação"><Quote size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertHorizontalRule', false); }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Linha Divisória"><Minus size={16} /></button>

        <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block"></div>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat', false); }} className="p-1.5 rounded hover:bg-destructive/20 text-white/70 hover:text-destructive transition-colors ml-auto flex items-center gap-1" title="Limpar todas as formatações">
            <Eraser size={16} />
            <span className="text-xs font-medium pr-1 hidden sm:inline-block">Limpar</span>
        </button>
    </div>
);

interface ChallengeAdminFormProps {
    onClose: () => void;
    initialData?: any;
}

export function ChallengeAdminForm({ onClose, initialData }: ChallengeAdminFormProps) {
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        hashtag: initialData?.hashtag || '',
        rules: initialData?.rules || '',
        badge_title: initialData?.badge_title || '',
        status: initialData?.status || 'active',
        starts_at: initialData?.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    });

    const [milestones, setMilestones] = useState<any[]>(
        initialData?.milestones?.length > 0
            ? initialData.milestones
            : [{ title: '', description: '', is_final: true, order_index: 1 }]
    );
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [badgeFile, setBadgeFile] = useState<File | null>(null);

    const handleSlugGen = (title: string) => {
        setFormData(prev => ({
            ...prev,
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        }));
    };

    const uploadAsset = async (file: File, folder: string, challengeId: string) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const filename = `${challengeId}.${ext}`;
        const { error } = await supabase.storage
            .from('challenge-assets')
            .upload(`${folder}/${filename}`, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
            });

        if (error) throw error;

        // Obter URL pública
        const { data: urlData } = supabase.storage
            .from('challenge-assets')
            .getPublicUrl(`${folder}/${filename}`);

        return urlData.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!initialData && !badgeFile) {
            toast.error('Imagem da badge é obrigatória');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Simular ID para os as assets (gera UUID aqui e usa no banco tbm para unificar nome)
            const mockChallengeId = initialData?.id || crypto.randomUUID();

            let thumbnailUrl = initialData?.thumbnail_url || '';
            if (thumbFile) {
                thumbnailUrl = await uploadAsset(thumbFile, 'thumbnails', mockChallengeId);
            }

            let badgeImageUrl = initialData?.badge_image_url || '';
            if (badgeFile) {
                badgeImageUrl = await uploadAsset(badgeFile, 'badges', mockChallengeId);
            }

            // 2. Criar ou Atualizar Desafio
            const p = {
                title: formData.title,
                slug: formData.slug || mockChallengeId,
                description: formData.description,
                hashtag: formData.hashtag,
                rules: formData.rules,
                badge_title: formData.badge_title,
                status: formData.status,
                starts_at: new Date(formData.starts_at).toISOString(),
                thumbnail_url: thumbnailUrl,
                badge_image_url: badgeImageUrl,
            };

            let challengeId = mockChallengeId;
            if (initialData) {
                await q.updateChallenge(initialData.id, p);
                challengeId = initialData.id;
            } else {
                const newChallenge = await q.createChallenge({ ...p, created_by: user.id });
                challengeId = newChallenge.id;
            }

            // 3. Criar ou Atualizar milestones
            const milestonesData = milestones.map((m: any, idx: number) => ({
                ...(m.id ? { id: m.id } : {}),
                challenge_id: challengeId,
                order_index: idx + 1,
                title: m.title,
                description: m.description,
                is_final: m.is_final
            }));
            await q.upsertMilestones(milestonesData);

            toast.success(initialData ? 'Desafio atualizado com sucesso!' : 'Desafio criado com sucesso!');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar desafio');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-bold text-white">{initialData ? 'Editar Desafio' : 'Criar Novo Desafio'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-amber-500">1. Informações Básicas</h3>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Título do Desafio</label>
                                <input required type="text" value={formData.title} onChange={e => handleSlugGen(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500/50" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/80">Descrição (Resumo)</label>
                                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 flex flex-col focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
                                    <EditorToolbar />
                                    <div
                                        className="w-full p-4 prose prose-invert max-w-none focus:outline-none min-h-[120px] text-sm overflow-y-auto text-white/90 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                        contentEditable
                                        onInput={(e) => setFormData({ ...formData, description: e.currentTarget.innerHTML })}
                                        dangerouslySetInnerHTML={{ __html: initialData?.description || '' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Hashtag de Integração</label>
                                <input required type="text" placeholder="#NomeDoDesafio" value={formData.hashtag} onChange={e => setFormData({ ...formData, hashtag: e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}` })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500/50" />
                                <p className="text-xs text-white/40 mt-1">Hashtag usada automaticamente nos envios (ex: #SimsChallenge)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/80">Regras Completas (Opcional)</label>
                                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 flex flex-col focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
                                    <EditorToolbar />
                                    <div
                                        className="w-full p-4 prose prose-invert max-w-none focus:outline-none min-h-[160px] text-sm overflow-y-auto text-white/90 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                        contentEditable
                                        onInput={(e) => setFormData({ ...formData, rules: e.currentTarget.innerHTML })}
                                        dangerouslySetInnerHTML={{ __html: initialData?.rules || '' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-amber-500">2. Identidade & Badge</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Thumbnail (Capa)</label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10">
                                        <span className="text-xs text-white/50 text-center px-2">{thumbFile ? thumbFile.name : 'Proporção 4:3'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Imagem da Badge *</label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-amber-500/50 rounded-xl cursor-pointer bg-amber-500/5 hover:bg-amber-500/10">
                                        <span className="text-xs text-amber-500/70 text-center px-2">{badgeFile ? badgeFile.name : initialData?.badge_image_url ? 'Padrão carregado (Alterar)' : 'PNG transparente (1:1)'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={e => setBadgeFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Título da Badge (Ex: Mãe Lendária)</label>
                                <input required type="text" value={formData.badge_title} onChange={e => setFormData({ ...formData, badge_title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500/50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500/50"
                                >
                                    <option value="active">🟢 Ativo (Público)</option>
                                    <option value="draft">🟡 Rascunho (Oculto)</option>
                                    <option value="archived">⚪ Arquivado (Fechado)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-amber-500">3. Etapas (Milestones)</h3>
                            <GlassButton type="button" onClick={() => setMilestones([...milestones, { title: '', description: '', is_final: false, order_index: milestones.length + 1 }])} className="text-xs py-1.5 px-3">
                                <Plus className="w-4 h-4 mr-1" /> Adicionar Etapa
                            </GlassButton>
                        </div>

                        <div className="space-y-3">
                            {milestones.map((m, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5 relative flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-bold text-white/50 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input required type="text" placeholder="Título da Etapa" value={m.title} onChange={e => {
                                            const newM = [...milestones];
                                            newM[idx].title = e.target.value;
                                            setMilestones(newM);
                                        }}
                                            className="w-full bg-transparent border-b border-white/10 pb-2 text-white focus:outline-none focus:border-amber-500"
                                        />
                                        <input type="text" placeholder="Descrição do que fazer" value={m.description} onChange={e => {
                                            const newM = [...milestones];
                                            newM[idx].description = e.target.value;
                                            setMilestones(newM);
                                        }}
                                            className="w-full bg-transparent border-b border-white/10 pb-2 text-sm text-white/70 focus:outline-none focus:border-amber-500"
                                        />
                                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                                            <input type="checkbox" checked={m.is_final} onChange={e => {
                                                const newM = [...milestones];
                                                newM[idx].is_final = e.target.checked;
                                                setMilestones(newM);
                                            }} />
                                            Esta é a última etapa (conclui o desafio)
                                        </label>
                                    </div>
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                        <GlassButton type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</GlassButton>
                        <GlassButton type="submit" className="bg-amber-600 hover:bg-amber-500 border-none font-bold px-8" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Salvar Alterações' : 'Publicar Desafio')}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
