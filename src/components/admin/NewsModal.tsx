import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, ImagePlus, Trash2, Bold, Italic, Underline, Link, Strikethrough, Code, List, ListOrdered, Quote, Minus, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { newsService } from '@/lib/newsService';
import { processAndUploadFeedImage } from '@/lib/imageService';
import type { News } from '@/types';

const Categories = ['Patch Note', 'Evento', 'Novidade', 'Aviso', 'Desafio'] as const;

const newsSchema = z.object({
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(100, 'Título muito longo'),
    excerpt: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'), // removed max limitation
    category: z.enum(Categories, {
        errorMap: () => ({ message: 'Escolha uma categoria válida' }),
    }),
});

type NewsFormData = z.infer<typeof newsSchema>;

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: News | null;
}

export function NewsModal({ isOpen, onClose, initialData }: NewsModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);
    const [isUploadingInline, setIsUploadingInline] = useState(false);
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<NewsFormData>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            title: initialData?.title || '',
            excerpt: initialData?.excerpt || '',
            category: initialData?.category || 'Novidade',
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title,
                excerpt: initialData.excerpt,
                category: initialData.category,
            });
        } else {
            reset({
                title: '',
                excerpt: '',
                category: 'Novidade',
            });
            setPreviewUrl(null);
            setImageFile(null);
        }
    }, [initialData, reset, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
    };

    const mutation = useMutation({
        mutationFn: ({ data, file }: { data: NewsFormData, file: File | null | 'remove' }) => {
            const payload = { ...data, category_color: null };
            if (initialData) {
                return newsService.updateNews(initialData.id, payload, file);
            }
            return newsService.createNews(payload, file === 'remove' ? null : file);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['public-news'] });
            toast({
                title: 'Sucesso',
                description: `Notícia ${initialData ? 'atualizada' : 'criada'} com sucesso!`,
            });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: 'Erro',
                description: `Não foi possível ${initialData ? 'atualizar' : 'criar'} a notícia.`,
                variant: 'destructive'
            });
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    const onSubmit = (data: NewsFormData) => {
        setIsSubmitting(true);
        let fileAction: File | null | 'remove' = imageFile;
        // Se tinha imagem antes e agora não tem nem URL nem File, foi removida
        if (initialData?.image_url && !previewUrl && !imageFile) {
            fileAction = 'remove';
        }
        mutation.mutate({ data, file: fileAction });
    };

    const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingInline(true);
        toast({
            title: 'Fazendo upload...',
            description: 'Enviando imagem, aguarde.',
            duration: 100000, // Keep open until finished
        });

        try {
            const ext = file.name.split('.').pop();
            const filePath = `inline/${Date.now()}.${ext}`;
            const url = await processAndUploadFeedImage(file, 'news', filePath);

            const contentDiv = document.querySelector('[contenteditable]') as HTMLDivElement;

            if (contentDiv) {
                contentDiv.focus();

                // Restore selection if we have one, otherwise just append
                const sel = window.getSelection();
                if (sel && savedRange) {
                    sel.removeAllRanges();
                    sel.addRange(savedRange);
                }

                // We create the image element manually as execCommand('insertImage') strips custom styles/attributes
                const imgNode = document.createElement('img');
                imgNode.src = url;
                imgNode.alt = "Imagem da Notícia";
                // Add inline styling for resize capability within contentEditable
                imgNode.style.maxWidth = '100%';
                imgNode.style.height = 'auto';
                imgNode.style.borderRadius = '8px';
                imgNode.style.marginTop = '1rem';
                imgNode.style.marginBottom = '1rem';

                // Essential for enabling resize handles in some browsers inside contentEditable
                imgNode.style.resize = 'both';
                imgNode.style.overflow = 'hidden';
                imgNode.style.display = 'block';

                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();

                    // We insert a line break, the image, and another line break for spacing
                    const br1 = document.createElement('br');
                    const br2 = document.createElement('br');

                    range.insertNode(br2);
                    range.insertNode(imgNode);
                    range.insertNode(br1);

                    // Move cursor after the inserted image
                    range.setStartAfter(br2);
                    range.setEndAfter(br2);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    // Fallback to end
                    contentDiv.appendChild(document.createElement('br'));
                    contentDiv.appendChild(imgNode);
                    contentDiv.appendChild(document.createElement('br'));
                }

                // Dispara a revalidação do formulário
                setValue('excerpt', contentDiv.innerHTML, { shouldValidate: true });
            }

            // Dismiss loading toast, show success
            queryClient.invalidateQueries(); // hack to dismiss toast globally if we don't have dismiss()
            toast({
                title: 'Sucesso',
                description: 'Imagem inserida.',
            });

        } catch (error) {
            console.error('Error uploading inline image:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível fazer o upload da imagem.',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingInline(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card w-full max-w-5xl rounded-[var(--radius-lg)] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                <h3 className="text-xl font-display font-semibold">
                                    {initialData ? 'Editar Notícia' : 'Nova Notícia'}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-6 overflow-y-auto">
                                {/* Coluna Esquerda: Meta Dados */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-white/80">Título</label>
                                        <input
                                            {...register('title')}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="Ex: SimsKut v2.0 lançado"
                                        />
                                        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-white/80">Categoria</label>
                                        <select
                                            {...register('category')}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                                        >
                                            {Categories.map((cat) => (
                                                <option key={cat} value={cat} className="bg-slate-900 text-white">
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-white/80">Imagem (Opcional)</label>
                                        <div className="mt-1">
                                            {previewUrl ? (
                                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group bg-black/20 flex items-center justify-center">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveImage}
                                                            className="bg-destructive/80 hover:bg-destructive text-white p-2 rounded-full transition-colors"
                                                            title="Remover Imagem"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border border-dashed border-white/20 bg-black/10 hover:bg-white/5 transition-colors cursor-pointer text-white/50 hover:text-white/80">
                                                    <ImagePlus size={24} className="mb-2 opacity-50" />
                                                    <span className="text-xs font-medium">Clique para selecionar</span>
                                                    <span className="text-[10px] opacity-50 mt-1">Recomendado: 1200x800px (16:9)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna Direita: Editor e Ações */}
                                <div className="space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2 h-full flex flex-col">
                                        <label className="text-sm font-medium text-white/80">Conteúdo da Notícia</label>
                                        <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/20 flex flex-col">
                                            {/* Toolbar */}
                                            <div className="flex items-center flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5">
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
                                                }} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Adicionar Link"><Link size={16} /></button>

                                                {/* Inline Image Upload */}
                                                <label className={`p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer ${isUploadingInline ? 'opacity-50 pointer-events-none' : ''}`} title="Inserir Imagem">
                                                    {isUploadingInline ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={isUploadingInline}
                                                        onChange={handleInlineImageUpload}
                                                    />
                                                </label>

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

                                            {/* Content Area */}
                                            <textarea
                                                {...register('excerpt')}
                                                className="hidden"
                                                id="hidden-excerpt"
                                            />
                                            <div
                                                className="w-full flex-1 p-4 prose prose-invert max-w-none focus:outline-none min-h-[300px] text-sm overflow-y-auto text-white/90 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                                contentEditable
                                                onBlur={() => {
                                                    // Save selection when the editor loses focus (e.g. clicking the upload button)
                                                    const sel = window.getSelection();
                                                    if (sel && sel.rangeCount > 0) {
                                                        setSavedRange(sel.getRangeAt(0));
                                                    }
                                                }}
                                                onInput={(e) => {
                                                    const value = e.currentTarget.innerHTML;
                                                    setValue('excerpt', value, { shouldValidate: true });
                                                }}
                                                dangerouslySetInnerHTML={{ __html: initialData?.excerpt || '' }}
                                            />
                                        </div>
                                        {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
                                    </div>

                                    <div className="pt-4 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                                        >
                                            {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                                            {initialData ? 'Salvar Alterações' : 'Criar Notícia'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
