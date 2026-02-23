import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export function RegisterPage() {
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
                        <UserPlus size={24} className="text-[#007AFF]" />
                        <h1 className="text-xl font-bold">Criar Conta</h1>
                    </div>

                    <form className="flex flex-col gap-4">
                        <GlassInput label="Código de Convite" placeholder="SIMS-XXXX-XXXX" />
                        <GlassInput label="Nome de Usuário" placeholder="seunome" />
                        <GlassInput label="Nome de Exibição" placeholder="Como quer ser chamado?" />
                        <GlassInput label="E-mail" type="email" placeholder="voce@email.com" />
                        <GlassInput label="Senha" type="password" placeholder="Mínimo 8 caracteres" />

                        <GlassButton type="submit" className="w-full mt-2">
                            Criar minha conta
                        </GlassButton>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
