import { supabase } from './supabaseClient';
import type { News } from '../types';
import { processAndUploadFeedImage, deleteImage } from './imageService';

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
    createNews: async (news: Omit<News, 'id' | 'created_at' | 'created_by' | 'author'>, imageFile?: File | Blob | null) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("User not authenticated.");

        let uploadedImageUrl = null;
        if (imageFile) {
            const path = `${userData.user.id}/${Date.now()}_news.webp`;
            try {
                uploadedImageUrl = await processAndUploadFeedImage(imageFile, 'news', path);
            } catch (e) {
                console.error("Failed to upload image:", e);
                throw new Error("Falha ao fazer upload da imagem");
            }
        }

        const { data, error } = await supabase
            .from('news')
            .insert({
                ...news,
                image_url: uploadedImageUrl,
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
    updateNews: async (id: string, updates: Partial<Omit<News, 'id' | 'created_at' | 'created_by' | 'author'>>, imageFile?: File | Blob | null | 'remove') => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("User not authenticated.");

        let finalUpdates = { ...updates };

        if (imageFile === 'remove') {
            finalUpdates.image_url = null;
        } else if (imageFile) {
            const path = `${userData.user.id}/${Date.now()}_news.webp`;
            try {
                const url = await processAndUploadFeedImage(imageFile, 'news', path);
                finalUpdates.image_url = url;
            } catch (e) {
                console.error("Failed to upload image:", e);
                throw new Error("Falha ao fazer upload da imagem");
            }
        }

        const { data, error } = await supabase
            .from('news')
            .update(finalUpdates)
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
    deleteNews: async (id: string, imageUrl?: string | null) => {
        // Optionally delete image from storage if it exists
        if (imageUrl) {
            try {
                const pathParts = imageUrl.split('/news/');
                if (pathParts.length > 1) {
                    const path = pathParts[1].split('?')[0]; // remove query params if any
                    await deleteImage('news', path);
                }
            } catch (e) {
                console.error('Failed to delete image from storage', e);
            }
        }

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
