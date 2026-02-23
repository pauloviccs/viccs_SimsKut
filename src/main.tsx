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
    const { setUser, setProfile, setLoading } = useAuthStore();

    useEffect(() => {
        // Carrega sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id)
                    .then(setProfile)
                    .catch((err) => console.error('Error fetching initial profile:', err))
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listener de mudanças
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setLoading(true);
                setUser(session.user);
                try {
                    const profile = await fetchProfile(session.user.id);
                    setProfile(profile);
                } catch (err) {
                    console.error('Error fetching profile on auth change:', err);
                    setProfile(null);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [setUser, setProfile, setLoading]);

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
