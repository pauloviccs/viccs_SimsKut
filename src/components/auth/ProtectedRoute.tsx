import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
    children: ReactNode;
    /** Se true, só admins podem acessar */
    adminOnly?: boolean;
}

/**
 * ProtectedRoute — Porteiro das rotas.
 * Imagina um segurança de boate: ele verifica se você tem ingresso (login)
 * e se seu nome está na lista VIP (convite aprovado).
 */
export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const { user, profile, isLoading, isInitialized, isAdmin } = useAuthStore();

    // Aguarda a engine do Supabase levantar do LocalStorage via main.tsx (isInitialized)
    // E aguarda as transições dinâmicas de hooks (isLoading)
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="w-8 h-8 border-3 border-white/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    // Não logado → vai pro login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Se é rota de admin e user não é admin → volta pro feed
    if (adminOnly && !isAdmin) {
        return <Navigate to="/feed" replace />;
    }

    // Se não tem profile ou convite não aprovado → vai pra pending
    // (exceto se for admin — admin não precisa de convite)
    if (!isAdmin && (!profile || !profile.invite_code_used)) {
        return <Navigate to="/pending" replace />;
    }

    return <>{children}</>;
}
