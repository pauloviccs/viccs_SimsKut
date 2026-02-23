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
        async function handleCallback() {
            try {
                // O Supabase processa o hash da URL automaticamente
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session?.user) {
                    console.error('Auth callback error:', error);
                    navigate('/login', { replace: true });
                    return;
                }

                const user = session.user;
                setUser(user);

                // Verifica se profile já existe
                let profile = await fetchProfile(user.id);

                if (!profile) {
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
                        // Profile pode já ter sido criado pelo trigger
                        console.warn('Profile create fallback:', err);
                        profile = await fetchProfile(user.id);
                    }

                    // Criar invite para novo usuário
                    if (profile) {
                        try {
                            await createInviteForUser(user.id);
                        } catch {
                            // Invite pode já ter sido criado pelo trigger
                        }
                    }
                }

                setProfile(profile);
                setLoading(false);

                // Redireciona baseado no status
                if (profile?.is_admin) {
                    navigate('/admin', { replace: true });
                } else {
                    // Para novos users, vai pra pending
                    // Para users aprovados, vai pro feed
                    navigate('/pending', { replace: true });
                }
            } catch (err) {
                console.error('Auth callback failed:', err);
                navigate('/login', { replace: true });
            }
        }

        handleCallback();
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
