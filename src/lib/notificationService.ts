import { supabase } from './supabaseClient';
import type { Profile } from '@/types';

/**
 * notificationService — Sistema de notificações.
 * Imagina como o carteiro que avisa: "Alguém te mencionou!"
 * Lida com menções (@username), busca de users, e CRUD de notificações.
 */

// ======== TYPES ========

export interface AppNotification {
    id: string;
    user_id: string;
    actor_id: string;
    type: 'mention_post' | 'mention_comment' | 'like_post' | 'like_photo' | 'comment_photo';
    reference_id: string | null;
    content: string | null;
    read: boolean;
    created_at: string;
    actor?: Profile;
}

// ======== NOTIFICATIONS CRUD ========

/** Busca notificações do usuário logado (mais recentes primeiro) */
export async function getNotifications(): Promise<AppNotification[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            actor:profiles!actor_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) throw error;

    return (data || []).map((n: any) => ({
        ...n,
        actor: Array.isArray(n.actor) ? n.actor[0] : n.actor,
    }));
}

/** Cria notificação de menção */
export async function createMentionNotification(
    targetUserId: string,
    actorId: string,
    type: 'mention_post' | 'mention_comment',
    referenceId: string,
    contentPreview: string | null
): Promise<void> {
    // Não notifica a si mesmo
    if (targetUserId === actorId) return;

    const { error } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: actorId,
        type,
        reference_id: referenceId,
        content: contentPreview?.substring(0, 100) || null,
    });

    if (error) console.error('Erro ao criar notificação:', error);
}

/** Cria notificação de interação genérica (like, comment) sem validação de Regex */
export async function createInteractionNotification(
    targetUserId: string,
    actorId: string,
    type: 'like_post' | 'like_photo' | 'comment_photo',
    referenceId: string,
    contentPreview: string | null = null
): Promise<void> {
    // Não notifica a si mesmo
    if (targetUserId === actorId) return;

    // TODO: Num cenário real, antes de inserir um 'like_post' por exemplo, 
    // poderíamos verificar se JÁ EXISTE uma notificação de like não lida desse usuário
    // para evitar spam de "X curtiu" quando ele descurte e curte de novo rápido.
    // Pela vibe coding, vamos inserir direto e deixar o cleanup pra queries futuras.
    const { error } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: actorId,
        type,
        reference_id: referenceId,
        content: contentPreview ? contentPreview.substring(0, 100) : null,
    });

    if (error) console.error(`Erro ao criar notificação de interação (${type}):`, error);
}

/** Exclui a notificação do banco de dados */
export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('Erro ao deletar notificação:', error);
        throw error;
    }
}

// ======== USER SEARCH (Autocomplete @) ========

/** Busca usuários por prefixo de username (para autocomplete do @) */
export async function searchUsers(prefix: string): Promise<Profile[]> {
    if (!prefix || prefix.length < 1) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `${prefix}%`)
        .limit(6);

    if (error) throw error;
    return (data || []) as Profile[];
}

// ======== MENTION HELPERS ========

/** Regex para encontrar @username no texto */
const MENTION_REGEX = /@([a-zA-Z0-9_#]+)/g;

/** Extrai todos os @usernames de um texto */
export function extractMentions(text: string): string[] {
    const matches = text.match(MENTION_REGEX);
    if (!matches) return [];
    // Remove o @ e deduplica
    return [...new Set(matches.map((m) => m.slice(1)))];
}

/** Resolve usernames para IDs (busca no DB) */
export async function resolveUsernames(usernames: string[]): Promise<{ id: string; username: string }[]> {
    if (usernames.length === 0) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', usernames);

    if (error) throw error;
    return data || [];
}

/**
 * Processa menções de um texto: extrai @usernames, resolve IDs, cria notificações.
 * Usa-se após criar um post ou comentário.
 */
export async function processMentions(
    text: string,
    actorId: string,
    type: 'mention_post' | 'mention_comment',
    referenceId: string
): Promise<void> {
    const usernames = extractMentions(text);
    if (usernames.length === 0) return;

    const resolved = await resolveUsernames(usernames);

    await Promise.all(
        resolved.map((user) =>
            createMentionNotification(user.id, actorId, type, referenceId, text)
        )
    );
}
