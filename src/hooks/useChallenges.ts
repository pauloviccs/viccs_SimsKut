import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as q from '../lib/challengeQueries';
import type { Challenge, UserBadge } from '../types/challenges';

export function useChallenges() {
    const { user } = useAuthStore();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadChallenges = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await q.fetchActiveChallenges(user.id);
            setChallenges(data);
        } catch (err: any) {
            setError(err.message ?? 'Erro ao carregar desafios');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadChallenges(); }, [loadChallenges]);

    return { challenges, loading, error, reload: loadChallenges };
}

export function useUserBadges(userId?: string) {
    const { user } = useAuthStore();
    const targetId = userId ?? user?.id;
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBadges = useCallback(async () => {
        if (!targetId) return;
        setLoading(true);
        try {
            const b = await q.fetchUserBadges(targetId);
            setBadges(b);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [targetId]);

    useEffect(() => { loadBadges(); }, [loadBadges]);

    return { badges, loading, reload: loadBadges };
}
