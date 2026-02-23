import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Lock, Upload } from 'lucide-react';

export function PrivateGallery() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Minha Galeria</h1>
                <GlassButton variant="primary">
                    <span className="flex items-center gap-2">
                        <Upload size={16} />
                        Upload
                    </span>
                </GlassButton>
            </div>

            <GlassCard className="text-center py-12">
                <Lock size={40} className="mx-auto mb-4 text-white/30" />
                <h2 className="text-lg font-semibold text-white/70 mb-2">
                    Sua galeria está vazia
                </h2>
                <p className="text-sm text-white/40">
                    Faça upload das suas fotos favoritas do The Sims! 🖼️
                </p>
            </GlassCard>
        </div>
    );
}
