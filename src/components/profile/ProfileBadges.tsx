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

    if (badges.length === 0) {
        return null; // Não exibe se não houver badges
    }

    const featuredBadges = badges.filter(b => b.is_featured);
    const otherBadges = badges.filter(b => !b.is_featured);

    return (
        <div className="mt-6 mb-2">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-400" />
                Emblemas de Desafios
            </h3>

            {featuredBadges.length > 0 && (
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
            )}

            {otherBadges.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {otherBadges.map(badge => (
                        <BadgeDisplay
                            key={badge.id}
                            badge={badge}
                            isOwner={isOwnProfile}
                            onUpdate={reload}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
