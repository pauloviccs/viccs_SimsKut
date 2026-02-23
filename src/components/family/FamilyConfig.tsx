import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Users, Plus } from 'lucide-react';

export function FamilyConfig() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Minha Família</h1>
                <GlassButton variant="primary">
                    <span className="flex items-center gap-2">
                        <Plus size={16} />
                        Novo Sim
                    </span>
                </GlassButton>
            </div>

            <GlassCard className="text-center py-12">
                <Users size={40} className="mx-auto mb-4 text-white/30" />
                <h2 className="text-lg font-semibold text-white/70 mb-2">
                    Nenhuma família criada
                </h2>
                <p className="text-sm text-white/40">
                    Crie sua família Sims e adicione seus personagens! 👨‍👩‍👧‍👦
                </p>
            </GlassCard>
        </div>
    );
}
