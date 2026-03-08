import { UserBadge } from '../../types/challenges';
import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as q from '../../lib/challengeQueries';
import { toast } from 'sonner';

interface BadgeDisplayProps {
    badge: UserBadge;
    isOwner: boolean;
    onUpdate: () => void;
}

export function BadgeDisplay({ badge, isOwner, onUpdate }: BadgeDisplayProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleFeature = async () => {
        try {
            await q.toggleFeaturedBadge(badge.id, badge.user_id, !badge.is_featured);
            toast.success(badge.is_featured ? 'Destaque removido.' : 'Badge destacada com sucesso!');
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao alterar destaque.');
        }
    };

    return (
        <>
            <div
                className="relative group outline-none"
                onClick={() => setIsExpanded(true)}
                onMouseEnter={() => isOwner && setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
            >
                <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center relative transition-transform duration-300 ${badge.is_featured
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] shadow-inner'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer'
                        }`}
                    title={badge.badge_title}
                >
                    <img
                        src={badge.badge_image_url}
                        alt={badge.badge_title}
                        className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/150?text=Badge';
                        }}
                    />
                    {badge.is_featured && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 shadow-lg border border-yellow-200">
                            <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-center mt-2 text-white/70 font-medium truncate max-w-[80px]">
                    {badge.badge_title}
                </p>

                {isOwner && isMenuOpen && !isExpanded && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFeature(); setIsMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            {badge.is_featured ? 'Remover destaque' : 'Destacar no topo'}
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-[#111116] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative cursor-default"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>

                                <div className={`w-32 h-32 mx-auto rounded-[2rem] flex items-center justify-center relative mb-6 shadow-2xl ${badge.is_featured
                                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30'
                                    : 'bg-white/5 border border-white/10'
                                    }`}>
                                    <img
                                        src={badge.badge_image_url}
                                        alt={badge.badge_title}
                                        className="w-20 h-20 object-contain drop-shadow-xl"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://via.placeholder.com/150?text=Badge';
                                        }}
                                    />
                                    {badge.is_featured && (
                                        <div className="absolute -top-3 -right-3 bg-amber-500 rounded-full p-2 shadow-lg border-2 border-[#111116]">
                                            <Star className="w-5 h-5 text-white fill-white" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-center text-white/95 mb-2">{badge.badge_title}</h3>
                                <p className="text-sm text-center text-white/50 mb-6">
                                    Você conquistou este emblema em um desafio épico!
                                </p>

                                {isOwner && (
                                    <button
                                        onClick={() => { toggleFeature(); setIsExpanded(false); }}
                                        className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${badge.is_featured
                                            ? 'bg-white/5 text-white hover:bg-white/10'
                                            : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                            }`}
                                    >
                                        <Star size={16} className={!badge.is_featured ? "fill-black" : ""} />
                                        {badge.is_featured ? 'Remover dos Destaques' : 'Destacar no Perfil'}
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
