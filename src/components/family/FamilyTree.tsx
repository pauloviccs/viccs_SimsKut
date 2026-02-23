import { GlassCard } from '@/components/ui/GlassCard';
import { TreePine } from 'lucide-react';
import { motion } from 'framer-motion';

export function FamilyTree() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <GlassCard className="text-center p-10 max-w-sm">
                    <TreePine size={48} className="mx-auto mb-4 text-[#34C759]/60" />
                    <h1 className="text-xl font-bold mb-2">Árvore Genealógica</h1>
                    <p className="text-sm text-white/50 mb-6">
                        Em desenvolvimento. Breve por aqui! 🌳
                    </p>

                    {/* Barra de progresso decorativa */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#007AFF] to-[#34C759] rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '35%' }}
                            transition={{ duration: 2, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-xs text-white/30 mt-2">35% concluído</p>
                </GlassCard>
            </motion.div>
        </div>
    );
}
