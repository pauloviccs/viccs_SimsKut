import { supabase } from './supabaseClient';
import type { News } from '../types';

export const newsService = {
    /**
     * Fetches the latest news.
     */
    getNews: async (limit: number = 20) => {
        const { data, error } = await supabase
            .from('news')
            .select('*, author:profiles!news_created_by_fkey(id, username, display_name, avatar_url, is_admin)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching news:', error);
            throw error;
        }

        return data as News[];
    },

    /**
     * Creates a new news item. Admin only.
     */
    createNews: async (news: Omit<News, 'id' | 'created_at' | 'created_by' | 'author'>) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("User not authenticated.");

        const { data, error } = await supabase
            .from('news')
            .insert({
                ...news,
                created_by: userData.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating news:', error);
            throw error;
        }

        return data as News;
    },

    /**
     * Updates an existing news item. Admin only.
     */
    updateNews: async (id: string, updates: Partial<Omit<News, 'id' | 'created_at' | 'created_by' | 'author'>>) => {
        const { data, error } = await supabase
            .from('news')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating news:', error);
            throw error;
        }

        return data as News;
    },

    /**
     * Deletes a news item. Admin only.
     */
    deleteNews: async (id: string) => {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting news:', error);
            throw error;
        }
    }
};
