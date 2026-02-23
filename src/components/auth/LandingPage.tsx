import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles, LogIn, UserPlus, LogOut, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/authService';

const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
};

export function LandingPage() {
    const navigate = useNavigate();
    const { user, profile, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await signOut();
            logout();
            // Force a hard refresh of the route locally
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <>
            <FluidBackground />

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
                                {profile?.display_name || user.email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] text-white/50">
                                @{profile?.username || 'user'}
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

            <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...springTransition, delay: 0.1 }}
                    className="text-center max-w-lg"
                >
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ ...springTransition, delay: 0 }}
                        className="w-20 h-20 mx-auto mb-8 rounded-[var(--radius-lg)]
                            bg-gradient-to-br from-[var(--accent-primary)] via-[var(--discord-brand)] to-[var(--accent-success)]
                            flex items-center justify-center
                            shadow-[0_0_60px_rgba(0,122,255,0.3)]"
                    >
                        <Sparkles size={36} className="text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: 0.2 }}
                        className="text-5xl md:text-6xl font-bold mb-4 tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Sims
                        <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-success)] bg-clip-text text-transparent">
                            Kut
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: 0.3 }}
                        className="text-lg text-white/50 mb-2 max-w-md mx-auto"
                    >
                        Rede social privada para comunidades de The Sims
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-sm text-white/30 mb-10"
                    >
                        Acesso exclusivo por convite • Aprovação manual
                    </motion.p>

                    {/* CTAs */}
                    {!user ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springTransition, delay: 0.5 }}
                            className="flex flex-col sm:flex-row gap-[16px] justify-center max-w-sm sm:max-w-none mx-auto"
                        >
                            <GlassButton
                                onClick={() => navigate('/register')}
                                className="px-8 py-3 text-base"
                            >
                                <span className="flex items-center gap-2">
                                    <UserPlus size={18} />
                                    Criar Conta
                                </span>
                            </GlassButton>

                            <GlassButton
                                variant="secondary"
                                onClick={() => navigate('/login')}
                                className="px-8 py-3 text-base"
                            >
                                <span className="flex items-center gap-2">
                                    <LogIn size={18} />
                                    Entrar
                                </span>
                            </GlassButton>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springTransition, delay: 0.5 }}
                            className="flex justify-center"
                        >
                            <GlassButton
                                onClick={() => navigate('/feed')}
                                className="px-8 py-3 text-base"
                            >
                                <span className="flex items-center gap-2">
                                    Entrar no SimsKut <ArrowRight size={18} />
                                </span>
                            </GlassButton>
                        </motion.div>
                    )}
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute bottom-6 text-xs text-white/20"
                >
                    © 2026 SimsKut • Feito com 💎 por VICCS
                </motion.p>
            </div>
        </>
    );
}
