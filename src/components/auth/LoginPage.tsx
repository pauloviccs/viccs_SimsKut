import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
            >
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <LogIn size={24} className="text-[#007AFF]" />
                        <h1 className="text-xl font-bold">Entrar</h1>
                    </div>

                    <form className="flex flex-col gap-4">
                        <GlassInput label="E-mail" type="email" placeholder="voce@email.com" />
                        <GlassInput label="Senha" type="password" placeholder="Sua senha" />

                        <GlassButton type="submit" className="w-full mt-2">
                            Entrar
                        </GlassButton>

                        <p className="text-center text-sm text-white/40 mt-2">
                            Não tem conta?{' '}
                            <a href="/register" className="text-[#007AFF] hover:underline">
                                Cadastre-se
                            </a>
                        </p>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
