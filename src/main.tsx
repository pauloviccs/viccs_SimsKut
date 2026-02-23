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
        let initDone = false;

        async function loadProfile(userId: string): Promise<void> {
            try {
                const profile = await fetchProfile(userId);
                if (mounted) setProfile(profile);
            } catch (err) {
                console.error('[Auth] Error fetching profile:', err);
                if (mounted) setProfile(null);
            }
        }

        async function initAuth() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] Erro ao buscar sessão inicial:', error);
                    return;
                }

                if (session?.user && mounted) {
                    setUser(session.user);
                    await loadProfile(session.user.id);
                } else if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                initDone = true;
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

            // Ignora INITIAL_SESSION — já cobrimos com getSession()
            if (event === 'INITIAL_SESSION') return;

            // Se initAuth ainda não terminou, ignora para evitar race condition
            if (!initDone) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
                setInitialized(true);
                return;
            }

            if (session?.user) {
                const currentUser = useAuthStore.getState().user;
                const isSameUser = currentUser?.id === session.user.id;

                // TOKEN_REFRESHED do mesmo user — sem necessidade de re-fetch
                if (event === 'TOKEN_REFRESHED' && isSameUser) {
                    return;
                }

                // Novo user ou SIGNED_IN
                setLoading(true);
                setUser(session.user);
                await loadProfile(session.user.id);
                if (mounted) {
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
