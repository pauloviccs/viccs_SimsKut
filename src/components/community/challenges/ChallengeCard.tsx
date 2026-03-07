import { motion } from 'framer-motion';
import { Challenge } from '../../../types/challenges';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChallengeCardProps {
    challenge: Challenge;
    onClick: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
    const isCompleted = challenge.my_participation?.status === 'completed';
    const participantsCount = challenge.stats?.total_participants || 0;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="group relative flex h-[280px] sm:h-[320px] w-full cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-lg shadow-black/20"
            onClick={() => onClick(challenge)}
        >
            <img
                src={challenge.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'}
                alt={challenge.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 select-none">
                <div className="backdrop-blur-md bg-green-500/20 border border-green-500/30 text-green-100 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    ATIVO
                </div>
                {challenge.ends_at && (
                    <div className="backdrop-blur-md bg-black/50 border border-white/20 text-white/90 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        Encerra em {formatDistanceToNow(new Date(challenge.ends_at), { locale: ptBR })}
                    </div>
                )}
            </div>

            {isCompleted && (
                <div className="absolute top-4 right-4 z-10 backdrop-blur-md bg-amber-500/20 border border-amber-500/30 text-amber-100 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
                    <span>✓</span> CONCLUÍDO
                </div>
            )}

            {/* Bottom Overlay Liquid Glass */}
            <div className="absolute inset-x-0 bottom-0 p-5 pt-32 bg-gradient-to-t from-[#0a0a0a] via-black/80 to-transparent flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="line-clamp-2 text-xl font-bold text-white drop-shadow-md mb-1">{challenge.title}</h3>
                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed mb-4">
                        {challenge.description?.replace(/<[^>]*>?/gm, '')}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70 font-medium">
                        <span className="flex shrink-0 items-center gap-1.5 drop-shadow-sm bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                            👥 {participantsCount} participantes
                        </span>
                        <span className="text-white/90 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1 shrink-0">
                            Ver detalhes <span className="text-[10px]">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
