import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Lock, UploadCloud } from 'lucide-react';
import { ChallengeMilestone, Challenge } from '../../../types/challenges';
import { MilestoneUploadModal } from './MilestoneUploadModal';
import { GlassButton } from '../../ui/GlassButton';
import * as q from '../../../lib/challengeQueries';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/authStore';

interface MilestoneTrackerProps {
    challenge: Challenge;
    onUpdate: () => void;
}

export function MilestoneTracker({ challenge, onUpdate }: MilestoneTrackerProps) {
    const { user } = useAuthStore();
    const [selectedMilestone, setSelectedMilestone] = useState<ChallengeMilestone | null>(null);

    // Ordena os milestones caso não venham ordenados
    const milestones = challenge.milestones?.sort((a, b) => a.order_index - b.order_index) || [];
    const participantId = challenge.my_participation?.id;

    const handleUploadSubmit = async (media1: File, media2?: File, note?: string) => {
        if (!user || !participantId || !selectedMilestone) return;

        await q.completeMilestone({
            participantId,
            milestoneId: selectedMilestone.id,
            userId: user.id,
            mediaFile1: media1,
            mediaFile2: media2,
            note,
        });
        toast.success('Conquista registrada com sucesso!');
        onUpdate();
    };

    return (
        <div className="relative pl-4 mt-6">
            {/* Linha vertical conectora */}
            <div className="absolute left-6 top-6 bottom-8 w-px bg-gradient-to-b from-amber-500/50 to-white/10" />

            <div className="space-y-8 relative">
                {milestones.map((milestone, index) => {
                    const isCompleted = !!milestone.my_entry;
                    // Verifica se o milestone anterior (se houver) está concluído
                    const previousCompleted = index === 0 || !!milestones[index - 1].my_entry;
                    const isCurrent = !isCompleted && previousCompleted;
                    const isLocked = !isCompleted && !isCurrent;

                    return (
                        <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative pl-8 ${isLocked ? 'opacity-50 grayscale' : ''}`}
                        >
                            {/* Ícone de status (Bullet) */}
                            <div className="absolute left-[-16px] top-1 bg-[#1a1a1a] rounded-full z-10 w-8 h-8 flex items-center justify-center ring-4 ring-[#1a1a1a]">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                ) : isCurrent ? (
                                    <Circle className="w-5 h-5 text-amber-400" />
                                ) : (
                                    <Lock className="w-4 h-4 text-white/40" />
                                )}
                            </div>

                            {/* Informações do Milestone */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-lg font-bold text-white">
                                        <span className="text-amber-500/80 mr-2">Etapa {milestone.order_index}:</span>
                                        {milestone.title}
                                    </h4>
                                    {milestone.is_final && (
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                                            Final
                                        </span>
                                    )}
                                </div>

                                {milestone.description && (
                                    <p className="text-sm text-white/70 mb-4">{milestone.description}</p>
                                )}

                                {/* Área de Ação ou Visualização */}
                                {isCompleted && milestone.my_entry ? (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <div className="flex gap-3">
                                            {milestone.my_entry.media_url_1 && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={milestone.my_entry.media_url_1} alt="Evidência 1" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {milestone.my_entry.media_url_2 && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={milestone.my_entry.media_url_2} alt="Evidência 2" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                        {milestone.my_entry.note && (
                                            <p className="mt-3 text-xs text-white/50 italic border-l-2 border-white/10 pl-2">
                                                "{milestone.my_entry.note}"
                                            </p>
                                        )}
                                    </div>
                                ) : isCurrent ? (
                                    <GlassButton
                                        onClick={() => setSelectedMilestone(milestone)}
                                        className="mt-2 text-sm px-4 py-2 flex items-center gap-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                                    >
                                        <UploadCloud className="w-4 h-4" /> Registrar Conquista
                                    </GlassButton>
                                ) : (
                                    <div className="mt-2 text-xs font-medium text-white/40 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Desbloqueie enviando a etapa anterior.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedMilestone && (
                    <MilestoneUploadModal
                        milestoneTitle={selectedMilestone.title}
                        onClose={() => setSelectedMilestone(null)}
                        onSubmit={handleUploadSubmit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
