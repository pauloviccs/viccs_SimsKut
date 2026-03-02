import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { newsService } from '@/lib/newsService';
import type { News } from '@/types';
import { NewsModal } from './NewsModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminNews() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: news = [], isLoading, isError } = useQuery({
        queryKey: ['admin-news'],
        queryFn: () => newsService.getNews(50),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, imageUrl }: { id: string, imageUrl?: string | null }) => newsService.deleteNews(id, imageUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['public-news'] });
            toast({
                title: 'Sucesso',
                description: 'Notícia apagada com sucesso.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Erro',
                description: 'Falha ao apagar notícia.',
                variant: 'destructive'
            });
            console.error(error);
        }
    });

    const handleEdit = (item: News) => {
        setEditingNews(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, imageUrl?: string | null) => {
        if (confirm('Tem certeza que deseja apagar esta notícia?')) {
            deleteMutation.mutate({ id, imageUrl });
        }
    };

    const handleCreate = () => {
        setEditingNews(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-display">Notícias & Atualizações</h2>
                    <p className="text-muted-foreground text-sm">Gerencie as novidades exibidas na landing page.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus size={16} className="mr-2" />
                    Nova Notícia
                </button>
            </div>

            <div className="glass-card rounded-[var(--radius-lg)] p-4 border border-white/10 relative overflow-hidden">
                {isLoading ? (
                    <div className="py-12 flex justify-center text-white/50">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="py-12 text-center text-destructive">
                        Erro ao carregar notícias.
                    </div>
                ) : news.length === 0 ? (
                    <div className="py-12 text-center text-white/50">
                        Nenhuma novidade registrada. Crie a primeira!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-white/40 border-b border-white/5">
                                <tr>
                                    <th className="pb-3 font-medium">Título</th>
                                    <th className="pb-3 font-medium">Categoria</th>
                                    <th className="pb-3 font-medium">Autor</th>
                                    <th className="pb-3 font-medium">Data</th>
                                    <th className="pb-3 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {news.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 text-white/90 font-medium">
                                            <div className="max-w-[200px] truncate">{item.title}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.category === 'Patch Note' ? 'bg-primary/20 text-primary' :
                                                item.category === 'Evento' ? 'bg-accent/20 text-accent' :
                                                    item.category === 'Novidade' ? 'bg-secondary/20 text-secondary' :
                                                        item.category === 'Aviso' ? 'bg-destructive/20 text-destructive' :
                                                            'bg-orange-500/20 text-orange-500' // Desafio
                                                }`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="py-4 text-white/60">
                                            {item.author?.display_name || item.author?.username || 'Anônimo'}
                                        </td>
                                        <td className="py-4 text-white/60">
                                            {format(new Date(item.created_at), "dd MMM yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white"
                                                    title="Editar"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.image_url)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive/80 hover:text-destructive"
                                                    title="Apagar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <NewsModal
                    isOpen={isModalOpen}
                    initialData={editingNews}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
