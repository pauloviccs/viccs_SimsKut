import { UserBadge } from '../../types/challenges';
import { useState } from 'react';
import { Star } from 'lucide-react';
import * as q from '../../lib/challengeQueries';
import { toast } from 'sonner';

interface BadgeDisplayProps {
    badge: UserBadge;
    isOwner: boolean;
    onUpdate: () => void;
}

export function BadgeDisplay({ badge, isOwner, onUpdate }: BadgeDisplayProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <div
            className="relative group outline-none"
            onClick={() => isOwner && setIsMenuOpen(!isMenuOpen)}
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

            {isOwner && isMenuOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFeature(); setIsMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        {badge.is_featured ? 'Remover destaque' : 'Destacar no topo'}
                    </button>
                </div>
            )}
        </div>
    );
}
