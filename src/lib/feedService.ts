import { supabase } from './supabaseClient';
import type { FeedPost, PostComment } from '@/types';

/**
 * feedService — Backend do Feed.
 * Imagina como o carteiro: entrega posts, likes e comentários.
 */

const POST_MAX_LENGTH = 280;

// ======== POSTS ========

/** Busca posts do feed com author, contagens e se eu dei like */
export async function getPosts(limit = 20, offset = 0): Promise<FeedPost[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
        .from('feed_posts')
        .select(`
            *,
            author:profiles!author_id(*),
            post_likes(count),
            post_comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    // Buscar meus likes de uma vez
    let myLikes: Set<string> = new Set();
    if (userId && data.length > 0) {
        const postIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
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

/** Cria um novo post */
export async function createPost(
    authorId: string,
    content: string | null,
    imageUrl: string | null
): Promise<FeedPost> {
    if (content && content.length > POST_MAX_LENGTH) {
        throw new Error(`Post deve ter no máximo ${POST_MAX_LENGTH} caracteres`);
    }

    const { data, error } = await supabase
        .from('feed_posts')
        .insert({
            author_id: authorId,
            content: content?.trim() || null,
            image_url: imageUrl,
        })
        .select('*, author:profiles!author_id(*)')
        .single();

    if (error) throw error;

    return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
        likes_count: 0,
        comments_count: 0,
        liked_by_me: false,
    };
}

/** Deleta um post */
export async function deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('feed_posts').delete().eq('id', postId);
    if (error) throw error;
}

// ======== LIKES ========

/** Toggle like em um post */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
    // Verifica se já tem like
    const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing) {
        await supabase.from('post_likes').delete().eq('id', existing.id);
        return false; // unliked
    } else {
        const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
        return true; // liked
    }
}

// ======== COMMENTS ========

/** Busca comentários de um post */
export async function getComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
        .from('post_comments')
        .select('*, author:profiles!author_id(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
    }));
}

/** Adiciona um comentário */
export async function addComment(
    postId: string,
    authorId: string,
    content: string
): Promise<PostComment> {
    const { data, error } = await supabase
        .from('post_comments')
        .insert({
            post_id: postId,
            author_id: authorId,
            content: content.trim(),
        })
        .select('*, author:profiles!author_id(*)')
        .single();

    if (error) throw error;

    return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
    };
}

/** Deleta um comentário */
export async function deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) throw error;
}
