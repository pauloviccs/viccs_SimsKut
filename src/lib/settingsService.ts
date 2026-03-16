/**
 * settingsService.ts
 * ─────────────────────────────────────────────
 * Leitura/escrita da tabela `site_settings`.
 * Padrão chave→valor. Simples, modular, cache-friendly.
 */
import { supabase } from './supabaseClient';

// ── Cache em memória (evita N chamadas na mesma sessão) ──
const cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Busca uma configuração por chave.
 * Usa cache local de 1 minuto para não martelar o banco.
 */
export async function getSetting(key: string): Promise<string | null> {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.value;
    }

    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) return null;

    cache.set(key, { value: data.value, ts: Date.now() });
    return data.value;
}

/**
 * Atualiza (upsert) uma configuração.
 * Só admin tem permissão via RLS.
 */
export async function setSetting(
    key: string,
    value: string,
    userId?: string,
): Promise<boolean> {
    const { error } = await supabase
        .from('site_settings')
        .upsert(
            { key, value, updated_at: new Date().toISOString(), updated_by: userId ?? null },
            { onConflict: 'key' },
        );

    if (error) {
        console.error('Erro ao salvar setting:', error.message);
        return false;
    }

    // Invalida cache local
    cache.set(key, { value, ts: Date.now() });
    return true;
}

// ── Helpers com nomes amigáveis ──

export const getDiscordInviteUrl = () => getSetting('discord_invite_url');
export const setDiscordInviteUrl = (url: string, userId?: string) =>
    setSetting('discord_invite_url', url, userId);
