import { supabase } from './supabaseClient';
import { generateInviteCode } from './inviteUtils';
import type { InviteCode } from '@/types';

/**
 * inviteService — Gerencia códigos de convite.
 * Imagina como um sistema de ingressos: o user recebe um, e o admin decide se deixa entrar.
 */

/** Cria um código de convite para o usuário recém-cadastrado */
export async function createInviteForUser(userId: string): Promise<InviteCode> {
    const code = generateInviteCode();

    const { data, error } = await supabase
        .from('invite_codes')
        .insert({
            code,
            used_by: userId,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Busca o convite do usuário atual */
export async function getMyInvite(userId: string): Promise<InviteCode | null> {
    const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('used_by', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/** Verifica se o convite do usuário foi aprovado */
export async function checkInviteStatus(
    userId: string
): Promise<'pending' | 'approved' | 'rejected' | 'none'> {
    const invite = await getMyInvite(userId);
    if (!invite) return 'none';
    return invite.status as 'pending' | 'approved' | 'rejected';
}

/** [ADMIN] Lista todos os convites pendentes */
export async function listPendingInvites(): Promise<InviteCode[]> {
    const { data, error } = await supabase
        .from('invite_codes')
        .select('*, profiles:used_by(username, display_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/** [ADMIN] Lista todos os convites (qualquer status) */
export async function listAllInvites(
    statusFilter?: string
): Promise<InviteCode[]> {
    let query = supabase
        .from('invite_codes')
        .select('*, profiles:used_by(username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/** [ADMIN] Aprovar convite */
export async function approveInvite(
    inviteId: string,
    adminId: string
): Promise<void> {
    const { error } = await supabase
        .from('invite_codes')
        .update({
            status: 'approved',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

    if (error) throw error;
}

/** [ADMIN] Rejeitar convite */
export async function rejectInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
        .from('invite_codes')
        .update({ status: 'rejected' })
        .eq('id', inviteId);

    if (error) throw error;
}

/** [ADMIN] Contar stats */
export async function getInviteStats() {
    const [pending, approved, rejected] = await Promise.all([
        supabase
            .from('invite_codes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
        supabase
            .from('invite_codes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved'),
        supabase
            .from('invite_codes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'rejected'),
    ]);

    return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
    };
}
