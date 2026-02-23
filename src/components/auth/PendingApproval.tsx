import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuthStore } from '@/store/authStore';
import { getMyInvite, checkInviteStatus } from '@/lib/inviteService';
import { fetchProfile } from '@/lib/authService';
import { supabase } from '@/lib/supabaseClient';
import type { InviteCode } from '@/types';

const DISCORD_URL = 'https://discord.gg/6PsfjsNuGV';
const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function PendingApproval() {
    const navigate = useNavigate();
    const { user, setProfile } = useAuthStore();
    const [invite, setInvite] = useState<InviteCode | null>(null);
    const [copied, setCopied] = useState(false);
    const [checking, setChecking] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (user) {
            getMyInvite(user.id).then(async (inv) => {
                setInvite(inv);
                // 1. Se o convite já for aprovado, ele deve ser liberado automaticamente.
                if (inv?.status === 'approved') {
                    setStatusMessage('✅ Aprovado! Redirecionando...');
                    await syncProfileAndRedirect(inv);
                }
            }).catch(console.error);
        }
    }, [user]);

    async function syncProfileAndRedirect(currentInvite: InviteCode) {
        if (!user) return;

        let newProfile = await fetchProfile(user.id);

        // Fallback: se o RLS impediu o admin de atualizar o profile, o próprio usuário atualiza agora
        if (newProfile && !newProfile.invite_code_used && currentInvite.code) {
            const { error } = await supabase.from('profiles').update({ invite_code_used: currentInvite.code }).eq('id', user.id);
            if (!error) {
                newProfile = { ...newProfile, invite_code_used: currentInvite.code };
            }
        }

        if (newProfile) {
            setProfile(newProfile);
        }

        setTimeout(() => navigate('/feed'), 1500);
    }

    async function handleCopyCode() {
        if (!invite?.code) return;
        await navigator.clipboard.writeText(invite.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleCheckStatus() {
        if (!user) return;
        setChecking(true);
        setStatusMessage('');

        try {
            const status = await checkInviteStatus(user.id);
            if (status === 'approved' && invite) {
                setStatusMessage('✅ Aprovado! Redirecionando...');
                await syncProfileAndRedirect({ ...invite, status: 'approved' });
            } else if (status === 'rejected') {
                setStatusMessage('❌ Seu convite foi negado. Entre em contato com um admin.');
            } else {
                setStatusMessage('⏳ Ainda aguardando aprovação...');
            }
        } catch {
            setStatusMessage('Erro ao verificar. Tente novamente.');
        } finally {
            setChecking(false);
        }
    }

    return (
        <>
            <FluidBackground />

            <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={spring}
                    className="w-full max-w-md"
                >
                    <GlassCard variant="premium" className="p-8 text-center">
                        {/* Icon */}
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-warning)]/15 flex items-center justify-center"
                        >
                            <Clock size={28} className="text-[var(--accent-warning)]" />
                        </motion.div>

                        <h1 className="text-2xl font-bold mb-2">Aguardando Aprovação</h1>
                        <p className="text-sm text-white/45 mb-6 max-w-sm mx-auto">
                            Seu cadastro foi realizado! Agora envie seu código de convite
                            na sala <strong className="text-white/70">#convites</strong> do nosso Discord
                            para que um administrador possa aprová-lo.
                        </p>

                        {/* Invite Code */}
                        <div className="bg-white/[0.04] rounded-[var(--radius-md)] p-5 mb-4 border border-white/10">
                            <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2 font-medium">
                                Seu Código de Convite
                            </p>
                            <p
                                className="text-2xl font-bold tracking-[0.15em] text-[var(--accent-primary)]"
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                {invite?.code || '...'}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] text-xs font-medium mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warning)] animate-pulse" />
                            {invite?.status === 'pending'
                                ? 'Aguardando aprovação'
                                : invite?.status || 'Carregando...'}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2.5">
                            <GlassButton onClick={handleCopyCode} variant="secondary" className="w-full">
                                <span className="flex items-center justify-center gap-2">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copiado!' : 'Copiar Código'}
                                </span>
                            </GlassButton>

                            <GlassButton
                                onClick={() => window.open(DISCORD_URL, '_blank')}
                                className="w-full"
                                style={{ background: 'var(--discord-brand)' }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <ExternalLink size={16} />
                                    Abrir Discord
                                </span>
                            </GlassButton>

                            <GlassButton
                                onClick={handleCheckStatus}
                                variant="ghost"
                                isLoading={checking}
                                className="w-full"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw size={16} />
                                    Verificar Status
                                </span>
                            </GlassButton>
                        </div>

                        {/* Status Message */}
                        {statusMessage && (
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm mt-4 text-white/60"
                            >
                                {statusMessage}
                            </motion.p>
                        )}
                    </GlassCard>
                </motion.div>
            </div>
        </>
    );
}
