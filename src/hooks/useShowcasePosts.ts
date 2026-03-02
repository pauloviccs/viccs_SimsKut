import { useState, useEffect } from 'react';
import { getPublicShowcasePosts } from '@/lib/feedService';
import type { FeedPost } from '@/types';

type ShowcasePost = Pick<FeedPost, 'id' | 'content' | 'image_url' | 'created_at' | 'author' | 'likes_count'>;

interface UseShowcasePostsReturn {
    posts: ShowcasePost[];
    isLoading: boolean;
    error: boolean;
}

export function useShowcasePosts(limit = 3): UseShowcasePostsReturn {
    const [posts, setPosts] = useState<ShowcasePost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchPosts() {
            try {
                setIsLoading(true);
                setError(false);
                const data = await getPublicShowcasePosts(limit);
                if (!cancelled) setPosts(data);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchPosts();

        return () => { cancelled = true; };
    }, [limit]);

    return { posts, isLoading, error };
}
