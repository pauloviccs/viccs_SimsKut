import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { newsService } from '@/lib/newsService';
import type { News } from '@/types';

const Categories = ['Patch Note', 'Evento', 'Novidade', 'Aviso', 'Desafio'] as const;

const newsSchema = z.object({
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(100, 'Título muito longo'),
    excerpt: z.string().min(10, 'Resumo deve ter no mínimo 10 caracteres').max(200, 'Resumo muito longo'),
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

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsFormData>({
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
                            className="glass-card w-full max-w-lg rounded-[var(--radius-lg)] border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
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

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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
                                    <label className="text-sm font-medium text-white/80">Resumo</label>
                                    <textarea
                                        {...register('excerpt')}
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                        placeholder="Conte o que há de novo..."
                                    />
                                    {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt.message}</p>}
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
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
