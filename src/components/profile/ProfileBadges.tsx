import { Award, Loader2 } from 'lucide-react';
import { useUserBadges } from '../../hooks/useChallenges';
import { BadgeDisplay } from './BadgeDisplay';

export function ProfileBadges({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
    const { badges, loading, reload } = useUserBadges(userId);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
        );
    }

    const featuredBadges = badges.filter(b => b.is_featured).slice(0, 5);

    if (featuredBadges.length === 0 && !isOwnProfile) {
        return null; // Visitante não vê nada se não tiver destaque
    }

    return (
        <div className="mt-6 mb-2">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-400" />
                Emblemas de Desafios
            </h3>

            {featuredBadges.length > 0 ? (
                <div className="flex flex-wrap gap-4 mb-4">
                    {featuredBadges.map(badge => (
                        <BadgeDisplay
                            key={badge.id}
                            badge={badge}
                            isOwner={isOwnProfile}
                            onUpdate={reload}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-xs text-white/40 italic">
                    Nenhum emblema em destaque. Edite seu perfil para escolher.
                </p>
            )}
        </div>
    );
}
