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

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                const currentUser = useAuthStore.getState().user;

                // Só refaz as chamadas se for um usuário diferente 
                // Evita problemas com eventos fantasmas (ex: SIGNED_IN seguido de INITIAL_SESSION)
                if (currentUser?.id !== session.user.id) {
                    setLoading(true);
                    setUser(session.user);

                    try {
                        const profile = await fetchProfile(session.user.id);
                        if (mounted) setProfile(profile);
                    } catch (err) {
                        console.error('Error fetching profile on auth change:', err);
                        if (mounted) setProfile(null);
                    } finally {
                        if (mounted) {
                            setLoading(false);
                            setInitialized(true);
                        }
                    }
                } else {
                    // Mesmo usuário, apenas garante que as flags estão prontas
                    if (mounted) {
                        setLoading(false);
                        setInitialized(true);
                    }
                }
            } else {
                // Usuário saiu
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
