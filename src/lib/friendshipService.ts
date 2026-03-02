import { supabase } from './supabaseClient';
import type { Profile } from '@/types';
import { createInteractionNotification } from './notificationService';

/**
 * friendshipService — Serviço de amizades.
 * Imagina como o cartão de amizade do The Sims:
 * envia pedido, aceita, recusa, e desfaz a relação.
 */

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

// ======== STATUS ========

/** Verifica o status da amizade entre o usuário logado e um target */
export async function getFriendshipStatus(targetId: string): Promise<{
    status: FriendshipStatus;
    friendshipId: string | null;
}> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId || userId === targetId) {
        return { status: 'none', friendshipId: null };
    }

    const { data, error } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(
            `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),` +
            `and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
        )
        .maybeSingle();

    if (error) throw error;
    if (!data) return { status: 'none', friendshipId: null };

    if (data.status === 'accepted') {
        return { status: 'accepted', friendshipId: data.id };
    }

    if (data.status === 'pending') {
        if (data.requester_id === userId) {
            return { status: 'pending_sent', friendshipId: data.id };
        }
        return { status: 'pending_received', friendshipId: data.id };
    }

    return { status: 'none', friendshipId: null };
}

// ======== ACTIONS ========

/** Envia solicitação de amizade */
export async function sendFriendRequest(targetId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Não autenticado');
    if (userId === targetId) throw new Error('Não é possível adicionar a si mesmo');

    const { error } = await supabase.from('friendships').insert({
        requester_id: userId,
        addressee_id: targetId,
        status: 'pending',
    });

    if (error) throw error;
}

/** Aceita uma solicitação de amizade */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) throw new Error('Não autenticado');

    const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select('requester_id, addressee_id')
        .single();

    if (error) throw error;

    const requesterId = data.requester_id;

    // Notifica quem enviou o pedido de que foi aceito
    if (requesterId && requesterId !== currentUserId) {
        await createInteractionNotification(
            requesterId,
            currentUserId,
            'friend_accept',
            friendshipId,
            null
        );
    }
}

/** Rejeita/cancela uma solicitação ou desfaz amizade */
export async function removeFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

    if (error) throw error;
}

/** Desfaz amizade por targetId */
export async function unfriend(targetId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Não autenticado');

    const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
            `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),` +
            `and(requester_id.eq.${targetId},addressee_id.eq.${userId})`
        );

    if (error) throw error;
}

// ======== LIST ========

/** Lista amigos aceitos de um usuário com profile join */
export async function getFriends(userId: string): Promise<Profile[]> {
    // Buscar friendships aceitas onde userId é parte
    const { data, error } = await supabase
        .from('friendships')
        .select(`
            id,
            requester_id,
            addressee_id,
            requester:profiles!requester_id(*),
            addressee:profiles!addressee_id(*)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

    if (error) throw error;

    // Extrair o profile do "outro" lado da amizade
    return (data || []).map((f: any) => {
        const requester = Array.isArray(f.requester) ? f.requester[0] : f.requester;
        const addressee = Array.isArray(f.addressee) ? f.addressee[0] : f.addressee;
        return requester.id === userId ? addressee : requester;
    });
}

/** Lista amigos aceitos com estatísticas incluídas */
export async function getFriendsWithStats(userId: string): Promise<(Profile & { stats: { friends_count: number; posts_count: number; photos_count: number; } })[]> {
    const friends = await getFriends(userId);

    // Buscar stats para cada amigo em paralelo
    const friendsWithStats = await Promise.all(
        friends.map(async (friend) => {
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_profile_stats', { target_id: friend.id })
                .maybeSingle();

            const stats = (statsError || !statsData ? { friends_count: 0, posts_count: 0, photos_count: 0 } : statsData) as { friends_count: number; posts_count: number; photos_count: number; };

            return {
                ...friend,
                stats
            };
        })
    );

    return friendsWithStats;
}

// ======== PENDING REQUESTS (NOTIFICATIONS) ========

export interface PendingRequest {
    friendshipId: string;
    requester: Profile;
    created_at: string;
}

/** Busca todas as solicitações pendentes recebidas pelo usuário logado */
export async function getPendingRequests(): Promise<PendingRequest[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
        .from('friendships')
        .select(`
            id,
            created_at,
            requester:profiles!requester_id(*)
        `)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((f: any) => ({
        friendshipId: f.id,
        requester: Array.isArray(f.requester) ? f.requester[0] : f.requester,
        created_at: f.created_at,
    }));
}
