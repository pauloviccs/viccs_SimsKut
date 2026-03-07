import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, CheckCircle2, Award, Calendar } from 'lucide-react';
import { Challenge } from '../../../types/challenges';
import { GlassCard } from '../../ui/GlassCard';
import { GlassButton } from '../../ui/GlassButton';
import { useAuthStore } from '../../../store/authStore';
import * as q from '../../../lib/challengeQueries';
import { toast } from 'sonner';
import { MilestoneTracker } from './MilestoneTracker';

interface ChallengeDetailModalProps {
    challenge: Challenge;
    onClose: () => void;
    onProgressUpdate: () => void;
}

export function ChallengeDetailModal({ challenge, onClose, onProgressUpdate }: ChallengeDetailModalProps) {
    const { user } = useAuthStore();
    const [isEnrolling, setIsEnrolling] = useState(false);

    const isEnrolled = !!challenge.my_participation;
    const isCompleted = challenge.my_participation?.status === 'completed';

    const handleEnroll = async () => {
        if (!user) {
            toast.error('Você precisa estar logado para ingressar.');
            return;
        }

        setIsEnrolling(true);
        try {
            await q.enrollInChallenge(challenge.id, user.id);
            toast.success('Inscrição confirmada! Boa sorte no desafio.');
            onProgressUpdate();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao ingressar no desafio.');
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleUnenroll = async () => {
        if (!user) return;

        if (confirm('Tem certeza que deseja sair do desafio? Todo seu progresso será perdido e excluido.')) {
            setIsEnrolling(true);
            try {
                await q.unenrollFromChallenge(challenge.id, user.id);
                toast.success('Você saiu do desafio.');
                onProgressUpdate();
                onClose(); // Optional: close the modal, or just let it update to 'join' screen
            } catch (err: any) {
                toast.error(err.message || 'Erro ao sair do desafio.');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className="w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <GlassCard className="flex-1 overflow-hidden p-0 relative flex flex-col rounded-3xl border border-white/20 shadow-2xl">

                    {/* Header Image */}
                    <div className="relative h-64 shrink-0">
                        <img
                            src={challenge.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'}
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-6 left-6 right-6">
                            <h2 className="text-3xl font-bold text-white drop-shadow-md mb-2">{challenge.title}</h2>
                            <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                {isCompleted && (
                                    <span className="flex items-center gap-1 text-amber-300">
                                        <CheckCircle2 className="w-4 h-4" /> Concluído
                                    </span>
                                )}
                                {challenge.ends_at && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Limite: {new Date(challenge.ends_at).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" /> {challenge.stats?.total_participants || 0} participantes
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

                        {/* Badge Preview */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 shrink-0 border border-white/5">
                                <img
                                    src={challenge.badge_image_url}
                                    alt={challenge.badge_title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/150?text=Badge';
                                    }}
                                />
                            </div>
                            <div>
                                <div className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Recompensa do Desafio
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">{challenge.badge_title}</h4>
                                <p className="text-sm text-white/60">Complete todas as etapas para exibir este título no seu perfil.</p>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold text-white mb-3">Sobre o Desafio</h3>
                            <div
                                className="text-white/80 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                dangerouslySetInnerHTML={{ __html: challenge.description }}
                            />

                            {challenge.rules && (
                                <>
                                    <div className="h-px w-full bg-white/10 my-8" />
                                    <h3 className="text-xl font-semibold text-white mb-3">Regras</h3>
                                    <div
                                        className="text-white/80 leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-white/70"
                                        dangerouslySetInnerHTML={{ __html: challenge.rules }}
                                    />
                                </>
                            )}
                        </div>

                        <div className="h-px w-full bg-white/10 my-8" />

                        {/* Participation Section */}
                        {!isEnrolled ? (
                            <div className="text-center py-4">
                                <p className="text-white/60 mb-6">Junte-se a {challenge.stats?.total_participants || 0} Simmers neste desafio!</p>
                                <GlassButton
                                    onClick={handleEnroll}
                                    disabled={isEnrolling}
                                    className="w-full md:w-auto px-12 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-none shadow-lg shadow-orange-500/20 font-bold"
                                >
                                    {isEnrolling ? 'Ingressando...' : 'Ingressar no Desafio'}
                                </GlassButton>
                            </div>
                        ) : (
                            <div className="mt-8 flex flex-col gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-white">Seu Progresso</h3>
                                        {!isCompleted && (
                                            <button
                                                onClick={handleUnenroll}
                                                disabled={isEnrolling}
                                                className="text-xs text-red-400 hover:text-red-300 font-medium py-1 px-3 rounded-full hover:bg-red-500/10 transition-colors"
                                            >
                                                Abandonar Desafio
                                            </button>
                                        )}
                                    </div>
                                    <MilestoneTracker challenge={challenge} onUpdate={onProgressUpdate} />
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
