import { supabase } from './supabaseClient';
import type { FeedPost, Photo, TrendingTag } from '../types';
import { getReactionsAggregateForPosts } from './feedService';

export const communityService = {
    /**
     * Busca as 10 hashtags mais populares baseadas na View 'trending_hashtags'.
     */
    async getTrendingTags(): Promise<TrendingTag[]> {
        const { data, error } = await supabase
            .from('trending_hashtags')
            .select('*');

        if (error) {
            console.error('Error fetching trending tags:', error);
            // Falha silenciosa para nao quebrar a UI se a View ainda nao tiver sido criada no DB pelo usuario
            if (error.code === '42P01') return [];
            throw error;
        }

        return data as TrendingTag[];
    },

    /**
     * Busca os FeedPosts que contêm a hashtag pesquisada.
     */
    async getPostsByTag(tag: string): Promise<FeedPost[]> {
        const query = `%#${tag}%`;
        const userId = (await supabase.auth.getUser()).data.user?.id;

        const { data, error } = await supabase
            .from('feed_posts')
            .select(`
                *,
                author:profiles!author_id(*),
                post_likes(count),
                post_comments(count)
            `)
            .ilike('content', query)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

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

        const postIds = data.map((p: any) => p.id);
        const reactionsMap = postIds.length > 0
            ? await getReactionsAggregateForPosts(postIds, userId ?? undefined)
            : new Map();

        return data.map((p: any) => ({
            ...p,
            author: Array.isArray(p.author) ? p.author[0] : p.author,
            likes_count: p.post_likes?.[0]?.count ?? 0,
            comments_count: p.post_comments?.[0]?.count ?? 0,
            liked_by_me: myLikes.has(p.id),
            reactions: reactionsMap.get(p.id) ?? [],
        }));
    },

    /**
     * Busca as Fotos da Galeria Global que contêm a hashtag pesquisada no description.
     */
    async getPhotosByTag(tag: string): Promise<Photo[]> {
        const query = `%#${tag}%`;
        const userId = (await supabase.auth.getUser()).data.user?.id;

        const { data, error } = await supabase
            .from('photos')
            .select(`
                *,
                owner:profiles!owner_id(*),
                photo_likes(count),
                photo_comments(count)
            `)
            .eq('visibility', 'public')
            .ilike('description', query)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        let myLikes: Set<string> = new Set();
        if (userId && data.length > 0) {
            const photoIds = data.map((p: any) => p.id);
            const { data: likes } = await supabase
                .from('photo_likes')
                .select('photo_id')
                .eq('user_id', userId)
                .in('photo_id', photoIds);
            myLikes = new Set((likes || []).map((l: any) => l.photo_id));
        }

        return (data || []).map((p: any) => ({
            ...p,
            owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
            likes_count: p.photo_likes?.[0]?.count ?? 0,
            comments_count: p.photo_comments?.[0]?.count ?? 0,
            liked_by_me: myLikes.has(p.id)
        })) as Photo[];
    }
};
