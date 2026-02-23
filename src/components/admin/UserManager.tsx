import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserX, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/types';

export function UserManager() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                <span className="text-sm text-white/40">{users.length} membros</span>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <span className="inline-block w-6 h-6 border-2 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-8">
                        Nenhum usuário cadastrado.
                    </p>
                ) : (
                    <div className="divide-y divide-white/5">
                        {users.map((user) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                        {user.display_name?.[0]?.toUpperCase() ||
                                            user.username?.[0]?.toUpperCase() ||
                                            '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">
                                                {user.display_name || user.username}
                                            </p>
                                            {user.is_admin && (
                                                <Shield size={12} className="text-[var(--accent-warning)]" />
                                            )}
                                        </div>
                                        <p className="text-xs text-white/30">@{user.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-white/25">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    {!user.is_admin && (
                                        <GlassButton
                                            variant="ghost"
                                            className="!min-h-[32px] !min-w-[32px] !p-1.5 !rounded-lg"
                                            title="Remover acesso"
                                        >
                                            <UserX size={14} className="text-[var(--accent-danger)]" />
                                        </GlassButton>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
