import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Hash, Rabbit } from 'lucide-react';
import { communityService } from '@/lib/communityService';
import type { TrendingTag } from '@/types';

export function TrendingBunny() {
    const [tags, setTags] = useState<TrendingTag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const data = await communityService.getTrendingTags();
                setTags(data);
            } catch (err) {
                console.error('Failed to load trending tags', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();

        // Polling para simular o Realtime "Trending" (A cada 30 segundos)
        const interval = setInterval(fetchTrending, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-5 mt-6 lg:mt-0 animate-pulse">
                <div className="h-6 w-32 bg-white/10 rounded-md mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="h-3 w-16 bg-white/5 rounded-md"></div>
                            <div className="h-4 w-24 bg-white/10 rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-heavy rounded-[var(--radius-lg)] border border-white/10 p-5 sticky top-24 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-[var(--accent-primary)]/20 p-2 rounded-xl text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]">
                    <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Trending Bunny</h3>
            </div>

            {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-white/50 bg-white/5 rounded-xl border border-white/5 border-dashed">
                    <Rabbit size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">O Coelho está dormindo...</p>
                    <p className="text-xs mt-1">Inicie uma tag no Feed para acordá-lo!</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {tags.map((item, index) => (
                        <Link
                            key={item.tag}
                            to={`/community/hashtag/${item.tag}`}
                            className="group flex flex-col p-3 hover:bg-white/5 rounded-[var(--radius-md)] transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/0 to-[var(--accent-primary)]/0 group-hover:from-[var(--accent-primary)]/5 group-hover:to-transparent transition-all pointer-events-none" />

                            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-0.5 flex items-center justify-between">
                                <span>Ranking {index + 1}</span>
                                {index < 3 && <span className="text-[var(--accent-primary)]">🔥 Em Alta</span>}
                            </span>

                            <h4 className="font-bold text-white/90 group-hover:text-[var(--accent-primary)] transition-colors flex items-center shadow-sm">
                                <Hash size={14} className="text-white/30 mr-0.5" />
                                {item.tag}
                            </h4>

                            <span className="text-xs text-white/40 mt-0.5">
                                {item.count} {item.count === 1 ? 'post' : 'posts'}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
