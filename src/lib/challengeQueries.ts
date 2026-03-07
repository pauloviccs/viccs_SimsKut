import { supabase } from './supabaseClient';
import type {
    Challenge, ChallengeMilestone, ChallengeParticipant,
    MilestoneEntry, UserBadge, ChallengeProgress
} from '../types/challenges';

// ── Listar desafios ativos com stats e participação do usuário ──
export async function fetchActiveChallenges(_userId?: string): Promise<Challenge[]> {
    const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
      *,
      milestones: challenge_milestones(*, my_entry: challenge_milestone_entries(*)),
      my_participation: challenge_participants(*)
    `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!challenges || challenges.length === 0) return [];

    const challengeIds = challenges.map(c => c.id);
    const { data: statsData } = await supabase
        .from('challenge_stats_view')
        .select('*')
        .in('challenge_id', challengeIds);

    return challenges.map(challenge => {
        const my_part = Array.isArray(challenge.my_participation) ? challenge.my_participation[0] : challenge.my_participation;
        const stats = statsData?.find(s => s.challenge_id === challenge.id);

        return {
            ...challenge,
            my_participation: my_part,
            stats: stats || { challenge_id: challenge.id, total_participants: 0, total_completed: 0 }
        } as Challenge;
    });
}

// ── Buscar desafio único com todos os detalhes ──
export async function fetchChallengeBySlug(slug: string): Promise<Challenge | null> {
    const { data: challenge, error } = await supabase
        .from('challenges')
        .select(`
      *,
      milestones: challenge_milestones(*)
    `)
        .eq('slug', slug)
        .single();

    if (error) throw error;
    if (!challenge) return null;

    const { data: statsData } = await supabase
        .from('challenge_stats_view')
        .select('*')
        .eq('challenge_id', challenge.id)
        .maybeSingle();

    return {
        ...challenge,
        stats: statsData || { challenge_id: challenge.id, total_participants: 0, total_completed: 0 }
    } as Challenge;
}

// ── Inscrever usuário em desafio ──
export async function enrollInChallenge(
    challengeId: string,
    userId: string
): Promise<ChallengeParticipant> {
    const { data, error } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ── Sair do desafio ──
export async function unenrollFromChallenge(
    challengeId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

    if (error) throw error;
}

// ── Buscar progresso do participante ──
export async function fetchParticipantProgress(
    challengeId: string,
    userId: string
): Promise<ChallengeProgress | null> {
    const { data, error } = await supabase
        .from('challenge_progress_view')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return data;
}

// ── Marcar milestone como concluído com upload ──
export async function completeMilestone({
    participantId,
    milestoneId,
    userId,
    mediaFile1,
    mediaFile2,
    note,
}: {
    participantId: string;
    milestoneId: string;
    userId: string;
    mediaFile1: File;
    mediaFile2?: File;
    note?: string;
}): Promise<MilestoneEntry> {
    const entryId = crypto.randomUUID();
    const basePath = `${userId}/${entryId}`;

    // Upload mídia 1 (obrigatória)
    const { data: upload1, error: err1 } = await supabase.storage
        .from('challenge-media')
        .upload(`${basePath}/1.${mediaFile1.name.split('.').pop()}`, mediaFile1, {
            contentType: mediaFile1.type,
            upsert: false,
        });
    if (err1) throw err1;

    const { data: { publicUrl: url1 } } = supabase.storage
        .from('challenge-media')
        .getPublicUrl(upload1.path);

    // Upload mídia 2 (opcional)
    let url2: string | undefined;
    if (mediaFile2) {
        const { data: upload2, error: err2 } = await supabase.storage
            .from('challenge-media')
            .upload(`${basePath}/2.${mediaFile2.name.split('.').pop()}`, mediaFile2, {
                contentType: mediaFile2.type,
                upsert: false,
            });
        if (err2) throw err2;

        const { data: { publicUrl } } = supabase.storage
            .from('challenge-media')
            .getPublicUrl(upload2.path);
        url2 = publicUrl;
    }

    // Inserir entrada no banco
    const { data, error } = await supabase
        .from('challenge_milestone_entries')
        .insert({
            id: entryId,
            participant_id: participantId,
            milestone_id: milestoneId,
            user_id: userId,
            note,
            media_url_1: url1,
            media_url_2: url2,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ── Buscar badges do usuário ──
export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

// ── Toggle badge em destaque no perfil (máx 3) ──
export async function toggleFeaturedBadge(
    badgeId: string,
    userId: string,
    isFeatured: boolean
): Promise<void> {
    if (isFeatured) {
        // Verificar limite de 3 badges em destaque
        const { count } = await supabase
            .from('user_badges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_featured', true);

        if ((count ?? 0) >= 3) {
            throw new Error('Você já tem 3 emblemas em destaque. Remova um antes de adicionar outro.');
        }
    }

    const { error } = await supabase
        .from('user_badges')
        .update({ is_featured: isFeatured })
        .eq('id', badgeId)
        .eq('user_id', userId);

    if (error) throw error;
}

// ── [ADMIN] Criar desafio ──
export async function createChallenge(
    payload: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>
): Promise<Challenge> {
    const { data, error } = await supabase
        .from('challenges')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ── [ADMIN] Criar milestones em lote ──
export async function createMilestones(
    milestones: Omit<ChallengeMilestone, 'id' | 'created_at'>[]
): Promise<ChallengeMilestone[]> {
    const { data, error } = await supabase
        .from('challenge_milestones')
        .insert(milestones)
        .select();

    if (error) throw error;
    return data ?? [];
}

// ── [ADMIN] Atualizar desafio ──
export async function updateChallenge(
    id: string,
    payload: Partial<Omit<Challenge, 'id' | 'created_at' | 'created_by'>>
): Promise<Challenge> {
    const { data, error } = await supabase
        .from('challenges')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ── [ADMIN] Upsert (Atualizar/Criar) milestones ──
export async function upsertMilestones(
    milestones: Partial<ChallengeMilestone>[]
): Promise<ChallengeMilestone[]> {
    const { data, error } = await supabase
        .from('challenge_milestones')
        .upsert(milestones, { onConflict: 'id' })
        .select();

    if (error) throw error;
    return data ?? [];
}
