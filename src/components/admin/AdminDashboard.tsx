import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, Users, FileText, BarChart3 } from 'lucide-react';

export function AdminDashboard() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Shield size={24} className="text-[#FF9500]" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <GlassCard className="text-center py-4">
                    <Users size={20} className="mx-auto mb-2 text-[#007AFF]" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-white/50">Usuários</p>
                </GlassCard>
                <GlassCard className="text-center py-4">
                    <FileText size={20} className="mx-auto mb-2 text-[#34C759]" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-white/50">Convites Pendentes</p>
                </GlassCard>
                <GlassCard className="text-center py-4">
                    <BarChart3 size={20} className="mx-auto mb-2 text-[#FF9500]" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-white/50">Posts</p>
                </GlassCard>
            </div>

            {/* Pending Invites */}
            <GlassCard>
                <h2 className="text-lg font-semibold mb-4">📋 Convites Pendentes</h2>
                <p className="text-sm text-white/40 text-center py-8">
                    Nenhum convite pendente no momento.
                </p>
            </GlassCard>
        </div>
    );
}
