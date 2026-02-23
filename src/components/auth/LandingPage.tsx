import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';

const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
};

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <>
            <FluidBackground />

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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-none mx-auto"
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
