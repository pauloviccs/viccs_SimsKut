import { supabase } from './supabaseClient';
import type { Profile } from '@/types';

/**
 * authService — Camada de abstração para Supabase Auth.
 * Imagina como um recepcionista: ele verifica quem você é antes de te deixar entrar.
 */

/** Cadastro por email + senha */
export async function signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

/** Login por email + senha */
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

/** Login via OAuth (Discord ou Google) */
export async function signInWithOAuth(provider: 'discord' | 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (error) throw error;
    return data;
}

/** Logout */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/** Busca o perfil do usuário logado */
export async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data;
}

/** Cria o perfil se não existir (pós-signup) */
export async function createProfile(
    userId: string,
    username: string,
    displayName: string
): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            username,
            display_name: displayName,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Listener de mudanças de auth */
export function onAuthStateChange(
    callback: (event: string, session: unknown) => void
) {
    return supabase.auth.onAuthStateChange(callback);
}

/** Pega a sessão atual */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}
