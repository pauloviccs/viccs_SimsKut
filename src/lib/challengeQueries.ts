import { supabase } from './supabaseClient';
import type {
    Challenge, ChallengeMilestone, ChallengeParticipant,
    MilestoneEntry, UserBadge, ChallengeProgress
} from '../types/challenges';

// ── Listar desafios ativos com stats e participação do usuário ──
export async function fetchActiveChallenges(userId?: string): Promise<Challenge[]> {
    const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
      *,
      milestones: challenge_milestones(*, my_entry: challenge_milestone_entries(*)),
      my_participation: challenge_participants(*)
    `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // Se o usuário está logado, devemos filtrar o join de participação e milestones no TS 
    if (error) throw error;
    if (!challenges || challenges.length === 0) return [];

    const challengeIds = challenges.map(c => c.id);
    const { data: statsData } = await supabase
        .from('challenge_stats_view')
        .select('*')
        .in('challenge_id', challengeIds);

    return challenges.map(challenge => {
        // Encontrar a participação EXATA desse usuário (supabase join retorna array pra relationships 1-n)
        const my_part_array = Array.isArray(challenge.my_participation) ? challenge.my_participation : [challenge.my_participation];
        const my_part = userId ? my_part_array.find((p: any) => p && p.user_id === userId) : null;

        // Fitrar as entradas EXATAS desse usuário dentro das milestones para não bugar o tracker visual
        const filteredMilestones = (challenge.milestones || []).map((m: any) => {
            const entryArray = Array.isArray(m.my_entry) ? m.my_entry : (m.my_entry ? [m.my_entry] : []);
            const userEntry = userId ? entryArray.find((e: any) => e && e.user_id === userId) : null;
            return {
                ...m,
                my_entry: userEntry ? [userEntry] : [] // forçamos estrutura array ou empty pra tipagem posterior
            };
        });

        const stats = statsData?.find(s => s.challenge_id === challenge.id);

        return {
            ...challenge,
            milestones: filteredMilestones,
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
    hashtag,
    isFinal,
    challengeId,
}: {
    participantId: string;
    milestoneId: string;
    userId: string;
    mediaFile1: File;
    mediaFile2?: File;
    note?: string;
    hashtag?: string | null;
    isFinal?: boolean;
    challengeId?: string;
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

    const { data: publicUrl1 } = supabase.storage
        .from('challenge-media')
        .getPublicUrl(upload1.path);
    const url1 = publicUrl1.publicUrl;

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

        const { data: publicUrl2 } = supabase.storage
            .from('challenge-media')
            .getPublicUrl(upload2.path);
        url2 = publicUrl2.publicUrl;
    }

    // Inserir entrada no banco para o check-in do milestone
    const { data: entryData, error: entryError } = await supabase
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

    if (entryError) throw entryError;

    // Criar post na aba da comunidade usando feedService-like logic (direct query para feed_posts evita deps circulares grossas mas como import feedService daria erro, fazemos o direct query aqui ou importamos o básico)
    try {
        let postContent = note ? note : 'Check-in de etapa cumprido!';
        if (hashtag) {
            postContent += `\n\n${hashtag}`;
        }

        const imageUrlsForFeed = [url1];
        if (url2) imageUrlsForFeed.push(url2);

        // O FeedPost no supabase espera uma string para a url (pode ser json array ou link direto)
        const imageUrlStr = imageUrlsForFeed.length === 1 ? imageUrlsForFeed[0] : JSON.stringify(imageUrlsForFeed);

        await supabase.from('feed_posts').insert({
            author_id: userId,
            content: postContent,
            image_url: imageUrlStr,
            is_spoiler: false,
        });

    } catch (e) {
        console.error('Non-blocking error: missed to feed post creation during milestone', e);
    }

    // Se for a última milestone, recompensa a badge automaticamente.
    if (isFinal && challengeId) {
        try {
            await awardBadgeToUser(challengeId, userId);
        } catch (e) {
            console.error('Non-blocking error: user badge rewarding failed heavily', e);
        }
    }

    return entryData;
}

// ── [ADMIN / AUTO] Recompensar badge para o usuário ──
export async function awardBadgeToUser(challengeId: string, userId: string): Promise<void> {
    // 1. Fetch Challenge setup para as credenciais da badge
    const { data: challenge } = await supabase
        .from('challenges')
        .select('badge_title, badge_image_url')
        .eq('id', challengeId)
        .single();

    if (!challenge || !challenge.badge_title || !challenge.badge_image_url) {
        return; // não tem badge registrada
    }

    // 2. Check se já possui
    const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();

    if (existing) {
        return; // Já ganhou a badge
    }

    // 3. Destribuir badge
    const { error } = await supabase
        .from('user_badges')
        .insert({
            user_id: userId,
            challenge_id: challengeId,
            badge_title: challenge.badge_title,
            badge_image_url: challenge.badge_image_url,
            is_featured: false
        });

    if (error) throw error;
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

// ── Atualizar múltiplos destaques de uma vez (Modal de Perfil) ──
export async function updateFeaturedBadges(userId: string, badgeIds: string[]): Promise<void> {
    if (badgeIds.length > 5) {
        throw new Error('Você pode selecionar no máximo 5 emblemas para destaque.');
    }

    // Primeiro, removemos destaque de todas as badges do usuário
    const { error: resetError } = await supabase
        .from('user_badges')
        .update({ is_featured: false })
        .eq('user_id', userId);

    if (resetError) throw resetError;

    // Agora ativamos destaque apenas nas selecionadas
    if (badgeIds.length > 0) {
        const { error: updateError } = await supabase
            .from('user_badges')
            .update({ is_featured: true })
            .eq('user_id', userId)
            .in('id', badgeIds);

        if (updateError) throw updateError;
    }
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

// ── [ADMIN] Remover Badge do Usuário ──
export async function removeUserBadge(badgeId: string): Promise<void> {
    const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', badgeId);

    if (error) throw error;
}

// ── [ADMIN] Fetch Badges catalog available from all challenges ──
export async function fetchAllChallengeBadges(): Promise<{ id: string; title: string; image_url: string }[]> {
    const { data, error } = await supabase
        .from('challenges')
        .select('id, badge_title, badge_image_url')
        .not('badge_title', 'is', null);

    if (error) throw error;

    // dedup 
    return data
        ? data.map(d => ({ id: d.id, title: d.badge_title, image_url: d.badge_image_url }))
        : [];
}
