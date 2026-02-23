import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ArrowLeft } from 'lucide-react';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassDivider } from '@/components/ui/GlassDivider';
import { OAuthButton } from '@/components/ui/OAuthButton';
import { signInWithEmail, signInWithOAuth } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function LoginPage() {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);

    // Se já logado, redireciona
    useEffect(() => {
        if (!isLoading && user) {
            navigate('/feed', { replace: true });
        }
    }, [user, isLoading, navigate]);

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmail(email, password);
            // useEffect fará o redirecionamento assim que o estado atualizar
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao entrar';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleOAuth(provider: 'discord' | 'google') {
        setOauthLoading(provider);
        try {
            await signInWithOAuth(provider);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao conectar';
            setError(message);
            setOauthLoading(null);
        }
    }

    return (
        <>
            <FluidBackground />

            <div className="min-h-screen flex items-center justify-center px-6 py-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={spring}
                    className="w-full max-w-[400px]"
                >
                    <GlassCard variant="premium" className="p-10">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                                <LogIn size={22} className="text-[var(--accent-primary)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Entrar</h1>
                                <p className="text-sm text-white/40 mt-0.5">Bem-vindo de volta ao SimsKut</p>
                            </div>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="flex flex-col space-y-4">
                            <OAuthButton
                                provider="discord"
                                onClick={() => handleOAuth('discord')}
                                isLoading={oauthLoading === 'discord'}
                                disabled={!!oauthLoading}
                            />
                            <OAuthButton
                                provider="google"
                                onClick={() => handleOAuth('google')}
                                isLoading={oauthLoading === 'google'}
                                disabled={!!oauthLoading}
                            />
                        </div>

                        <GlassDivider text="ou entre com email" />

                        {/* Email Form */}
                        <form onSubmit={handleEmailLogin} className="flex flex-col space-y-4">
                            <GlassInput
                                label="E-mail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <GlassInput
                                label="Senha"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-[var(--accent-danger)] bg-[var(--accent-danger)]/10 rounded-lg px-4 py-2.5"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <GlassButton
                                type="submit"
                                isLoading={loading}
                                className="w-full mt-2"
                            >
                                Entrar
                            </GlassButton>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <p className="text-sm text-white/35">
                                Não tem conta?{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-[var(--accent-primary)] hover:underline cursor-pointer"
                                >
                                    Cadastre-se
                                </button>
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="text-xs text-white/25 hover:text-white/50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <ArrowLeft size={12} /> Voltar
                            </button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </>
    );
}
