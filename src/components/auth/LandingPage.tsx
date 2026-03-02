import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles, LogOut, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/authService';

import { LandingV1 } from "../landing-v1/LandingV1";
import { LandingV2 } from "../landing-v2";

export function LandingPage() {
    const navigate = useNavigate();
    const { user, profile, isLoading, logout } = useAuthStore();
    // Tornando a V2 o padrão. Só vai renderizar a V1 se a variável for explicitamente 'false'
    const useNewLanding = import.meta.env.VITE_NEW_LANDING !== 'false';

    const handleLogout = async () => {
        try {
            logout(); // Limpa Zustand primeiro (evita re-render com sessão velha)
            await signOut(); // Depois limpa sessão no Supabase
            // Já estamos em "/", não precisa navegar
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <>
            {/* Header for Logged in Users */}
            {user && (
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-50 pointer-events-auto"
                >
                    <div className="flex items-center gap-3 bg-white/[0.03] p-2 pr-4 rounded-full border border-white/5 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 overflow-hidden border border-white/10 flex items-center justify-center">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Sparkles size={18} className="text-[var(--accent-primary)]" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium line-clamp-1">
                                {isLoading ? '...' : (profile?.display_name || user.email?.split('@')[0])}
                            </span>
                            <span className="text-[10px] text-white/50">
                                @{isLoading ? '...' : (profile?.username || 'user')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <GlassButton
                            variant="ghost"
                            onClick={handleLogout}
                            title="Sair da Conta"
                            className="px-3 py-2 min-h-0 min-w-0"
                        >
                            <LogOut size={18} />
                        </GlassButton>
                        <GlassButton
                            onClick={() => navigate('/feed')}
                            className="px-4 py-2 min-h-0 min-w-0 hidden md:flex"
                        >
                            <span className="flex items-center gap-2 text-sm">
                                Abrir Painel <ArrowRight size={16} />
                            </span>
                        </GlassButton>
                    </div>
                </motion.header>
            )}

            {/* Conditionally Render V1 vs V2 Core Views. V2 uses separate viewport wrapping for max-width overflow behavior while V1 depends on the app container natively. */}
            {useNewLanding ? <LandingV2 /> : <LandingV1 />}
        </>
    );
}
