import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { EaConnectionForm } from './EaConnectionForm';
import { GalleryGrid } from './GalleryGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuthStore } from '@/store/authStore';
import { EaGalleryItem, getUserShowcase, saveShowcaseSelection } from '@/lib/eaGalleryService';

export function Sims4GalleryPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [eaId, setEaId] = useState<string | undefined>(undefined);
    const [availableItems, setAvailableItems] = useState<EaGalleryItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const userId = user?.id;

    const { data: showcase, isLoading: loadingShowcase } = useQuery({
        queryKey: ['ea-showcase', userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) return [];
            const rows = await getUserShowcase(userId);
            // Inicializa seleção com base no que já está salvo
            setSelectedIds(rows.map((r) => r.ea_original_id));
            return rows;
        },
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!eaId) {
                throw new Error('Busque suas criações primeiro informando o EA ID.');
            }
            setError(null);
            setMessage(null);
            return await saveShowcaseSelection(eaId, selectedIds);
        },
        onSuccess: async () => {
            setMessage('Vitrine sincronizada com sucesso!');
            await queryClient.invalidateQueries({ queryKey: ['ea-showcase', userId] });
        },
        onError: (err: unknown) => {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Não foi possível salvar a vitrine.');
        },
    });

    const handleItemsLoaded = (newEaId: string, items: EaGalleryItem[]) => {
        setEaId(newEaId);
        setAvailableItems(items);
        setMessage(null);
        setError(null);
    };

    const handleToggleSelect = (eaOriginalId: string) => {
        setSelectedIds((prev) => {
            const exists = prev.includes(eaOriginalId);
            if (exists) {
                return prev.filter((id) => id !== eaOriginalId);
            }
            if (prev.length >= 50) {
                setError('Limite de 50 itens na vitrine atingido.');
                return prev;
            }
            return [...prev, eaOriginalId];
        });
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Galeria The Sims 4</h1>
            <p className="text-sm text-white/60 mb-4">
                Sincronize suas criações da The Sims 4 Gallery com o SimsKut e escolha até 50
                para exibir como uma vitrine oficial no seu perfil.
            </p>

            <EaConnectionForm initialEaId={eaId} onItemsLoaded={handleItemsLoaded} />

            {availableItems.length > 0 && (
                <GlassCard className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                        <div>
                            <h2 className="text-lg font-semibold text-white/90">Seleção da vitrine</h2>
                            <p className="text-xs text-white/50">
                                Marque as criações que deseja destacar. Você pode salvar no máximo 50 itens.
                            </p>
                        </div>
                        <GlassButton
                            variant="primary"
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                            className="min-w-[150px] flex items-center justify-center gap-2"
                        >
                            {saveMutation.isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Salvar vitrine
                                </>
                            )}
                        </GlassButton>
                    </div>

                    {error && (
                        <p className="text-xs text-[var(--accent-danger)] mb-1">
                            {error}
                        </p>
                    )}
                    {message && (
                        <p className="text-xs text-[var(--accent-success)] mb-1">
                            {message}
                        </p>
                    )}

                    <GalleryGrid
                        items={availableItems}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                </GlassCard>
            )}

            <div className="mt-6">
                <h2 className="text-lg font-semibold text-white/90 mb-2">Prévia pública</h2>
                <p className="text-xs text-white/50 mb-3">
                    É assim que a sua Galeria será exibida no seu perfil para visitantes.
                </p>

                {loadingShowcase ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={24} className="animate-spin text-white/30" />
                    </div>
                ) : !showcase || showcase.length === 0 ? (
                    <GlassCard className="py-8 px-4 text-center">
                        <p className="text-sm text-white/50">
                            Nenhum item na vitrine ainda. Selecione algumas criações e salve para começar.
                        </p>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {showcase.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl overflow-hidden glass-heavy border border-white/12"
                            >
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.title}
                                        className="w-full h-32 md:h-40 object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-32 md:h-40 bg-gradient-to-br from-[#007AFF]/40 via-[#5865F2]/30 to-[#34C759]/40" />
                                )}
                                <div className="p-2">
                                    <p className="text-xs font-medium text-white/90 truncate">
                                        {item.title}
                                    </p>
                                    {item.download_count != null && (
                                        <p className="text-[10px] text-white/45">
                                            {item.download_count} downloads
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

