import { supabase } from './supabaseClient';
import type { FeedPost, Photo, TrendingTag } from '../types';

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

        const { data, error } = await supabase
            .from('feed_posts')
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    role,
                    frame_id,
                    title_id
                ),
                reactions:post_reactions (*)
            `)
            .ilike('content', query)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Formata as reações para o agregador
        const formattedPosts = data?.map((post: any) => {
            const reactionsHash = (post.reactions || []).reduce((acc: any, r: any) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
            }, {});

            const reactionArray = Object.entries(reactionsHash).map(([emoji, count]) => ({
                emoji,
                count: count as number,
                reacted_by_me: false // Para simplicidade na view global
            }));

            return {
                ...post,
                author: Array.isArray(post.author) ? post.author[0] : post.author,
                reactions: reactionArray
            };
        });

        return formattedPosts as FeedPost[];
    },

    /**
     * Busca as Fotos da Galeria Global que contêm a hashtag pesquisada no description.
     */
    async getPhotosByTag(tag: string): Promise<Photo[]> {
        const query = `%#${tag}%`;

        const { data, error } = await supabase
            .from('photos')
            .select(`
                *,
                owner:profiles!owner_id(
                    id,
                    username,
                    avatar_url,
                    role,
                    frame_id,
                    title_id
                )
            `)
            .eq('visibility', 'public')
            .ilike('description', query)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map((p: any) => ({
            ...p,
            owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
        })) as Photo[];
    }
};
