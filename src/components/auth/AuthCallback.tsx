import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { fetchProfile, createProfile } from '@/lib/authService';
import { createInviteForUser } from '@/lib/inviteService';
import { useAuthStore } from '@/store/authStore';
import { FluidBackground } from '@/components/ui/FluidBackground';

/**
 * AuthCallback — Página que recebe o redirect do OAuth.
 * Imagina como a portaria de um prédio: recebe o visitante,
 * verifica o documento, e direciona pro apartamento certo.
 *
 * Fluxo:
 * 1. Supabase processa o token na URL automaticamente
 * 2. Verificamos se já tem profile → senão, criamos
 * 3. Verificamos se já tem invite → senão, criamos
 * 4. Redirecionamos para /feed (se aprovado) ou /pending (se novo)
 */
export function AuthCallback() {
    const navigate = useNavigate();
    const { setUser, setProfile, setLoading } = useAuthStore();

    useEffect(() => {
        let mounted = true;

        async function processUser(user: any) {
            if (!mounted) return;
            setUser(user);

            // Verifica se profile já existe
            let profile = await fetchProfile(user.id);

            if (!profile && mounted) {
                // Primeiro login via OAuth — criar profile
                const meta = user.user_metadata;
                const username =
                    meta?.preferred_username ||
                    meta?.user_name ||
                    meta?.name ||
                    user.email?.split('@')[0] ||
                    'user';
                const displayName =
                    meta?.full_name ||
                    meta?.name ||
                    username;

                try {
                    profile = await createProfile(user.id, username, displayName);
                } catch (err) {
                    console.warn('Profile create fallback:', err);
                    profile = await fetchProfile(user.id);
                }

                // Criar invite para novo usuário
                if (profile) {
                    try {
                        await createInviteForUser(user.id);
                    } catch {
                        // Ignore se já existir
                    }
                }
            }

            if (!mounted) return;

            setProfile(profile);
            setLoading(false);

            // Redireciona
            if (profile?.is_admin) {
                navigate('/admin', { replace: true });
            } else {
                navigate('/pending', { replace: true });
            }
        }

        // 1. Tenta a sessão explícita logo de cara, mas não desiste se falhar
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (session?.user && mounted) {
                processUser(session.user);
            } else if (error) {
                console.error('Initial getSession error in callback:', error);
            }
        });

        // 2. Ouve ativamente "SIGNED_IN" ou mudanças de Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user && mounted) {
                processUser(session.user);
            }
        });

        // Timeout preventivo: se nada acontecer em 10 segundos, volta pro login
        const timeoutId = setTimeout(() => {
            if (mounted) {
                console.warn('AuthCallback timeout reached, redirecting to login');
                navigate('/login', { replace: true });
            }
        }, 10000);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [navigate, setUser, setProfile, setLoading]);

    return (
        <>
            <FluidBackground />
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <span className="w-10 h-10 border-3 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                <p className="text-sm text-white/40">Conectando sua conta...</p>
            </div>
        </>
    );
}
