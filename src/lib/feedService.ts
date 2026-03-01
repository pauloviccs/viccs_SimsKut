import { supabase } from './supabaseClient';
import type { FeedPost, PostComment, PostReactionAggregate } from '@/types';
import { createInteractionNotification } from './notificationService';

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
    author: profiles!author_id(*),
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

    // Reações agregadas por post (uma query para todos os posts da página)
    const postIds = data.map((p: any) => p.id);
    const reactionsMap = postIds.length > 0
        ? await getReactionsAggregateForPosts(postIds, userId ?? undefined)
        : new Map<string, PostReactionAggregate[]>();

    return data.map((p: any) => ({
        ...p,
        author: Array.isArray(p.author) ? p.author[0] : p.author,
        likes_count: p.post_likes?.[0]?.count ?? 0,
        comments_count: p.post_comments?.[0]?.count ?? 0,
        liked_by_me: myLikes.has(p.id),
        reactions: reactionsMap.get(p.id) ?? [],
    }));
}

/** Busca um único post recém-criado formatado para a UI */
export async function getSinglePost(postId: string): Promise<FeedPost | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
        .from('feed_posts')
        .select(`
        *,
        author: profiles!author_id(*),
            post_likes(count),
            post_comments(count)
                `)
        .eq('id', postId)
        .single();

    if (error || !data) return null;

    let liked_by_me = false;
    if (userId) {
        const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();
        liked_by_me = !!likeData;
    }

    const reactions = await getReactionsAggregateForPosts([postId], userId ?? undefined);

    return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
        likes_count: data.post_likes?.[0]?.count ?? 0,
        comments_count: data.post_comments?.[0]?.count ?? 0,
        liked_by_me,
        reactions: reactions.get(postId) ?? [],
    };
}

/** Cria um novo post. imageUrls: 1–4 URLs (uma única ou várias). Armazenado em image_url como string ou JSON array. */
export async function createPost(
    authorId: string,
    content: string | null,
    imageUrls: string[]
): Promise<FeedPost> {
    if (content && content.length > POST_MAX_LENGTH) {
        throw new Error(`Post deve ter no máximo ${POST_MAX_LENGTH} caracteres`);
    }
    if (imageUrls.length > 4) {
        throw new Error('Máximo de 4 imagens por post');
    }
    const imageUrl = imageUrls.length === 0
        ? null
        : imageUrls.length === 1
            ? imageUrls[0]
            : JSON.stringify(imageUrls);

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

/** Atualiza o conteúdo de um post (apenas autor). Retorna o post atualizado. */
export async function updatePost(postId: string, content: string | null): Promise<Pick<FeedPost, 'id' | 'content' | 'updated_at'> | null> {
    const trimmed = content?.trim() || null;
    if (trimmed && trimmed.length > POST_MAX_LENGTH) {
        throw new Error(`Post deve ter no máximo ${POST_MAX_LENGTH} caracteres`);
    }
    const { data, error } = await supabase
        .from('feed_posts')
        .update({ content: trimmed })
        .eq('id', postId)
        .select('id, content, updated_at')
        .single();

    if (error) throw error;
    return data;
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
        // Remove like
        await supabase.from('post_likes').delete().eq('id', existing.id);
        return false; // unliked
    } else {
        // Adiciona like
        const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId });

        if (error) throw error;

        // --- Notificação ---
        const { data: postData } = await supabase.from('feed_posts').select('author_id, content').eq('id', postId).single();
        if (postData && postData.author_id !== userId) {
            await createInteractionNotification(
                postData.author_id,
                userId,
                'like_post',
                postId,
                postData.content
            );
        }

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

// ======== REACTIONS (estilo Discord) ========

/**
 * Agrega reações por post: para cada post_id retorna lista de { emoji, count, reacted_by_me }.
 * Uma única query para todos os postIds — otimizado.
 */
export async function getReactionsAggregateForPosts(
    postIds: string[],
    currentUserId?: string
): Promise<Map<string, PostReactionAggregate[]>> {
    if (postIds.length === 0) return new Map();

    const { data: rows, error } = await supabase
        .from('post_reactions')
        .select('post_id, emoji, user_id')
        .in('post_id', postIds);

    if (error) throw error;

    const map = new Map<string, PostReactionAggregate[]>();
    for (const postId of postIds) {
        map.set(postId, []);
    }

    const byPostEmoji = new Map<string, { count: number; userIds: Set<string> }>();
    for (const r of rows || []) {
        const key = `${r.post_id}:${r.emoji}`;
        const cur = byPostEmoji.get(key);
        if (cur) {
            cur.count += 1;
            cur.userIds.add(r.user_id);
        } else {
            byPostEmoji.set(key, { count: 1, userIds: new Set([r.user_id]) });
        }
    }

    for (const [key, { count, userIds }] of byPostEmoji) {
        const sep = key.indexOf(':');
        const postId = key.slice(0, sep);
        const emoji = key.slice(sep + 1);
        const reacted_by_me = currentUserId ? userIds.has(currentUserId) : false;
        const list = map.get(postId)!;
        list.push({ emoji, count, reacted_by_me });
    }

    // Ordenar por count desc, depois emoji
    for (const list of map.values()) {
        list.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
    }

    return map;
}

/** Adiciona ou remove reação (toggle). Retorna true se adicionou, false se removeu. */
export async function toggleReaction(
    postId: string,
    userId: string,
    emoji: string
): Promise<boolean> {
    const { data: existing } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

    if (existing) {
        await supabase.from('post_reactions').delete().eq('id', existing.id);
        return false;
    }

    const { error } = await supabase
        .from('post_reactions')
        .insert({ post_id: postId, user_id: userId, emoji });

    if (error) throw error;
    return true;
}
