import { GlassCard } from '@/components/ui/GlassCard';
import { Image } from 'lucide-react';

export function GlobalGallery() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Galeria Global</h1>

            <GlassCard className="text-center py-12">
                <Image size={40} className="mx-auto mb-4 text-white/30" />
                <h2 className="text-lg font-semibold text-white/70 mb-2">
                    Galeria vazia
                </h2>
                <p className="text-sm text-white/40">
                    Nenhuma foto pública compartilhada ainda. Que tal ser o primeiro? 📸
                </p>
            </GlassCard>
        </div>
    );
}
