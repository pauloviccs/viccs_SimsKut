import { motion } from 'framer-motion';
import { X, Briefcase, Star, Zap } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Sim } from '@/types';

interface SimDetailsModalProps {
    sim: Sim;
    onClose: () => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function SimDetailsModal({ sim, onClose }: SimDetailsModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={spring}
                className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-6 w-full max-w-md relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Banner / Header background decorative */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-success)]/10" />

                <div className="flex flex-col items-center mt-6 relative z-0">
                    <Avatar
                        src={sim.photo_url}
                        alt={sim.name}
                        size="2xl"
                        className="border-4 border-[#0a0a0f]"
                    />

                    <h2 className="text-xl font-bold text-white/95 mt-4 text-center">
                        {sim.name}
                    </h2>

                    {sim.profession && (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--accent-primary)] mt-1">
                            <Briefcase size={14} />
                            <span>{sim.profession}</span>
                        </div>
                    )}
                </div>

                <div className="mt-6 space-y-5">
                    {/* Bio Section */}
                    {sim.bio && (
                        <div>
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Biografia
                            </h3>
                            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                                {sim.bio}
                            </p>
                        </div>
                    )}

                    {/* Traits Section */}
                    {sim.traits && sim.traits.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Características
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {sim.traits.map((trait) => (
                                    <div
                                        key={trait.id}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${trait.trait_type === 'quality'
                                                ? 'bg-[var(--accent-warning)]/10 border-[var(--accent-warning)]/20 text-[var(--accent-warning)]'
                                                : 'bg-[var(--accent-success)]/10 border-[var(--accent-success)]/20 text-[var(--accent-success)]'
                                            }`}
                                    >
                                        {trait.trait_type === 'quality' ? <Star size={12} /> : <Zap size={12} />}
                                        {trait.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
