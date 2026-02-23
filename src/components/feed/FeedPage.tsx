import { GlassCard } from '@/components/ui/GlassCard';
import { MessageSquare } from 'lucide-react';

export function FeedPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Feed</h1>

            {/* Empty State */}
            <GlassCard className="text-center py-12">
                <MessageSquare size={40} className="mx-auto mb-4 text-white/30" />
                <h2 className="text-lg font-semibold text-white/70 mb-2">
                    Nenhum post ainda
                </h2>
                <p className="text-sm text-white/40">
                    Seus amigos ainda não postaram nada. Seja o primeiro! 🎮
                </p>
            </GlassCard>
        </div>
    );
}
