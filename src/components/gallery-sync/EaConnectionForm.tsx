import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { fetchEaItems, EaGalleryItem } from '@/lib/eaGalleryService';

interface EaConnectionFormProps {
    initialEaId?: string;
    onItemsLoaded: (eaId: string, items: EaGalleryItem[]) => void;
}

export function EaConnectionForm({ initialEaId, onItemsLoaded }: EaConnectionFormProps) {
    const [eaId, setEaId] = useState(initialEaId ?? '');
    const [error, setError] = useState<string | null>(null);

    const { mutate, isPending } = useMutation({
        mutationFn: async (value: string) => {
            setError(null);
            const trimmed = value.trim();
            if (!trimmed) {
                throw new Error('Informe um EA ID para buscar suas criações.');
            }
            const items = await fetchEaItems(trimmed);
            return { eaId: trimmed, items };
        },
        onSuccess: (data) => {
            onItemsLoaded(data.eaId, data.items);
        },
        onError: (err: unknown) => {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Não foi possível buscar as criações agora.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate(eaId);
    };

    return (
        <GlassCard className="p-4 sm:p-5 mb-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                    <GlassInput
                        label="EA ID"
                        placeholder="Ex: SimGuruGeorge"
                        value={eaId}
                        onChange={(e) => setEaId(e.target.value)}
                    />
                    {error && (
                        <p className="mt-1 text-xs text-[var(--accent-danger)]">
                            {error}
                        </p>
                    )}
                </div>
                <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={isPending}
                    className="whitespace-nowrap min-w-[140px] flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            Buscar criações
                        </>
                    )}
                </GlassButton>
            </form>
            <p className="mt-2 text-[11px] text-white/40">
                Vincule seu EA ID para listar suas criações da The Sims 4 Gallery e escolher até 50 para exibir na sua vitrine.
            </p>
        </GlassCard>
    );
}

