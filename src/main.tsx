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

// Cache global para evitar race conditions em duplo mount do React 18 e múltiplos eventos
let profileFetchPromise: Promise<any> | null = null;
let fetchingUserId: string | null = null;

/**
 * AuthProvider — Ouve mudanças de auth do Supabase e sincroniza com Zustand.
 * Imagina como um radar: sempre escutando se alguém entrou ou saiu.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading, setInitialized } = useAuthStore();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const state = useAuthStore.getState();
                const currentUser = state.user;
                const currentProfile = state.profile;

                // Se é um login novo ou o profile ainda não carregou (exemplo: depois de um F5)
                if (currentUser?.id !== session.user.id || !currentProfile) {
                    setLoading(true);
                    setUser(session.user);

                    try {
                        let profile;
                        // Deduplicação de requisições concorrentes
                        if (profileFetchPromise && fetchingUserId === session.user.id) {
                            profile = await profileFetchPromise;
                        } else {
                            fetchingUserId = session.user.id;
                            profileFetchPromise = fetchProfile(session.user.id);
                            profile = await profileFetchPromise;
                        }

                        // Limpa a promessa cacheada independentemente de quem chamou
                        if (fetchingUserId === session.user.id) {
                            profileFetchPromise = null;
                            fetchingUserId = null;
                        }

                        setProfile(profile);
                    } catch (err) {
                        console.error('Error fetching profile on auth change:', err);
                        setProfile(null);
                    } finally {
                        setLoading(false);
                        setInitialized(true);
                    }
                } else {
                    // Mesmo usuário, estado 100% sincado
                    setLoading(false);
                    setInitialized(true);
                }
            } else {
                // Usuário saiu
                setUser(null);
                setProfile(null);
                setLoading(false);
                setInitialized(true);
            }
        });

        return () => {
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
