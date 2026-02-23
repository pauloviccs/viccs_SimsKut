import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles } from 'lucide-react';

export function LandingPage() {
    const mockCode = 'SIMS-XXXX-XXXX';

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full max-w-sm"
            >
                <GlassCard className="text-center p-8">
                    {/* Logo */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#34C759] flex items-center justify-center">
                        <Sparkles size={28} className="text-white" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2 text-white/95">SimsKut</h1>
                    <p className="text-sm text-white/50 mb-8">
                        Rede social privada para comunidades de The Sims
                    </p>

                    {/* Invite Code Display */}
                    <div className="bg-white/[0.06] rounded-xl p-4 mb-4 border border-white/10">
                        <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">
                            Seu código de convite
                        </p>
                        <p className="text-xl font-mono font-bold tracking-widest text-[#007AFF]">
                            {mockCode}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9500]/15 text-[#FF9500] text-xs font-medium mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-pulse" />
                        Aguardando aprovação
                    </div>

                    <div className="flex flex-col gap-3">
                        <GlassButton variant="primary" className="w-full">
                            Verificar status
                        </GlassButton>
                        <GlassButton variant="ghost" className="w-full">
                            Já tenho uma conta →
                        </GlassButton>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
