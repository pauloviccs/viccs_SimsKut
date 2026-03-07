import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Gamepad2, AlertCircle } from 'lucide-react';
import { useChallenges } from '../../../hooks/useChallenges';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeDetailModal } from './ChallengeDetailModal';
import { GlassButton } from '../../ui/GlassButton';
import { GlassCard } from '../../ui/GlassCard';
import { Challenge } from '../../../types/challenges';

export function ChallengesHub() {
    const { challenges, loading, error, reload } = useChallenges();
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChallenges = challenges.filter(challenge =>
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full flex-1 relative min-h-[50vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-xl shadow-lg shadow-amber-500/10">
                        <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            Desafios
                        </h1>
                        <p className="text-white/60 text-sm mt-1">
                            Complete missões temáticas e ganhe emblemas exclusivos para o seu perfil.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-6xl mx-auto space-y-6">

                {/* Filters */}
                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Buscar desafios..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl bg-white/5 border border-white/10 aspect-video shadow-sm" />
                    ))}
                </div>
            ) : error ? (
                <GlassCard className="flex flex-col items-center justify-center py-20 text-center border-red-500/20 bg-red-500/5">
                    <AlertCircle className="w-12 h-12 text-red-400/80 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar desafios</h3>
                    <p className="text-white/60 mb-6 text-sm">{error}</p>
                    <GlassButton onClick={reload} variant="ghost" className="border-red-500/30 hover:bg-red-500/10">Tentar Novamente</GlassButton>
                </GlassCard>
            ) : challenges.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                        <Gamepad2 className="w-10 h-10 text-white/20" />
                    </div>
                    <h3 className="text-xl font-medium text-white/90 mb-2">Nenhum desafio ativo no momento</h3>
                    <p className="text-white/50 text-sm max-w-sm">Os administradores estão preparando novas aventuras para a comunidade. Volte em breve!</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredChallenges.map(challenge => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            onClick={setSelectedChallenge}
                        />
                    ))}
                </div>
            )}



            <AnimatePresence>
                {selectedChallenge && (
                    <ChallengeDetailModal
                        challenge={selectedChallenge}
                        onClose={() => setSelectedChallenge(null)}
                        onProgressUpdate={reload}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
