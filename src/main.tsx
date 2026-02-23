import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import { fetchProfile } from '@/lib/authService';
import '@/styles/global.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 min
            retry: 1,
        },
    },
});

/**
 * AuthProvider — Ouve mudanças de auth do Supabase e sincroniza com Zustand.
 * Imagina como um radar: sempre escutando se alguém entrou ou saiu.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading, setInitialized } = useAuthStore();

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                // Forçamos a buscar a sessão real do servidor/storage no mount (refresh protegido)
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] Erro ao buscar sessão inicial:', error);
                    setInitialized(true);
                    setLoading(false);
                    return;
                }

                if (session?.user && mounted) {
                    setUser(session.user);
                    try {
                        const profile = await fetchProfile(session.user.id);
                        if (mounted) setProfile(profile);
                    } catch (err) {
                        console.error('[Auth] Error fetching initial profile:', err);
                        if (mounted) setProfile(null);
                    }
                } else if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) {
                    setInitialized(true);
                    setLoading(false);
                }
            }
        }

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // INITIAL_SESSION ignoramos pois já fazemos manualmente com getSession() que é mais seguro contra race conditions de cache
            if (event === 'INITIAL_SESSION') return;

            if (session?.user) {
                const currentUser = useAuthStore.getState().user;
                const currentProfile = useAuthStore.getState().profile;

                // Previne fetch redundante em SIGNED_IN seguido do inicial
                if (currentUser?.id !== session.user.id || !currentProfile) {
                    setLoading(true);
                    setUser(session.user);

                    try {
                        const profile = await fetchProfile(session.user.id);
                        if (mounted) setProfile(profile);
                    } catch (err) {
                        console.error('[Auth] Error fetching profile on auth change:', err);
                        if (mounted) setProfile(null);
                    } finally {
                        if (mounted) {
                            setLoading(false);
                            setInitialized(true);
                        }
                    }
                } else {
                    if (mounted) {
                        setLoading(false);
                        setInitialized(true);
                    }
                }
            } else {
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    setInitialized(true);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [setUser, setProfile, setLoading, setInitialized]);

    return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>
);
