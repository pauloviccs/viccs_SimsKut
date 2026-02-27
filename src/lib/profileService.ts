import { supabase } from './supabaseClient';
import type { Profile, ProfileStats, FeedPost, PostComment, Photo } from '@/types';

/**
 * profileService — Serviço do perfil do usuário.
 * Imagina como a carteira de identidade do jogador: 
 * puxa os dados, atualiza a bio, sobe o banner, e conta estatísticas.
 */

const BUCKET = 'avatars';

// ======== FETCH ========

/** Busca um profile por username */
export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    if (error) throw error;
    return data;
}

// ======== UPDATE ========

/** Atualiza campos editáveis do perfil */
export async function updateProfile(
    userId: string,
    data: {
        display_name?: string;
        bio?: string;
        website_url?: string | null;
    }
): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

    if (error) throw error;
}

// ======== BANNER ========

/** Upload do banner para Supabase Storage → avatars/{userId}/banner.jpg */
export async function uploadBanner(userId: string, file: Blob): Promise<string> {
    // Validação: máx 5MB, apenas JPG/PNG
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Banner deve ter no máximo 5 MB');
    }

    const path = `${userId}/banner.jpg`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            contentType: 'image/jpeg',
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
}

/** Atualiza banner_url no profile */
export async function updateProfileBanner(userId: string, bannerUrl: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ banner_url: bannerUrl })
        .eq('id', userId);

    if (error) throw error;
}

// ======== STATS (RPC) ========

/** Chama a RPC get_profile_stats para buscar contadores */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
    const { data, error } = await supabase.rpc('get_profile_stats', {
        target_id: userId,
    });

    if (error) throw error;

    return {
        friends_count: data?.friends_count ?? 0,
        posts_count: data?.posts_count ?? 0,
        photos_count: data?.photos_count ?? 0,
    };
}

// ======== USER POSTS ========

/** Busca posts de um usuário específico */
export async function getUserPosts(
    userId: string,
    limit = 20,
    offset = 0
): Promise<FeedPost[]> {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
        .from('feed_posts')
        .select(`
            *,
            author:profiles!author_id(*),
            post_likes(count),
            post_comments(count)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    // Buscar meus likes
    let myLikes: Set<string> = new Set();
    if (currentUserId && data.length > 0) {
        const postIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds);

        myLikes = new Set((likes || []).map((l: any) => l.post_id));
    }

    return data.map((p: any) => ({
        ...p,
        author: Array.isArray(p.author) ? p.author[0] : p.author,
        likes_count: p.post_likes?.[0]?.count ?? 0,
        comments_count: p.post_comments?.[0]?.count ?? 0,
        liked_by_me: myLikes.has(p.id),
    }));
}

// ======== USER COMMENTS ========

/** Busca comentários feitos por um usuário */
export async function getUserComments(
    userId: string,
    limit = 20,
    offset = 0
): Promise<(PostComment & { post?: FeedPost })[]> {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            author:profiles!author_id(*),
            post:feed_posts!post_id(*, post_author:profiles!author_id(*))
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
        post: c.post ? {
            ...c.post,
            author: Array.isArray(c.post.post_author) ? c.post.post_author[0] : c.post.post_author,
        } : undefined,
    }));
}

// ======== USER PHOTOS ========

/** Busca fotos públicas de um usuário */
export async function getUserPhotos(userId: string): Promise<Photo[]> {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
        .from('photos')
        .select(`
            *,
            owner:profiles!owner_id(*),
            photo_likes(count),
            photo_comments(count)
        `)
        .eq('owner_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

    if (error) throw error;

    let myLikes: Set<string> = new Set();
    if (currentUserId && data.length > 0) {
        const photoIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
            .from('photo_likes')
            .select('photo_id')
            .eq('user_id', currentUserId)
            .in('photo_id', photoIds);
        myLikes = new Set((likes || []).map((l: any) => l.photo_id));
    }

    return (data || []).map((p: any) => ({
        ...p,
        owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
        likes_count: p.photo_likes?.[0]?.count ?? 0,
        comments_count: p.photo_comments?.[0]?.count ?? 0,
        liked_by_me: myLikes.has(p.id)
    }));
}

// ======== USER FAMILIES ========

/** Busca as famílias de um usuário com seus respectivos sims e traços */
export async function getUserFamiliesWithSims(userId: string) {
    const { data, error } = await supabase
        .from('families')
        .select(`
            *,
            sims (
                *,
                traits:sim_traits(*)
            )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
