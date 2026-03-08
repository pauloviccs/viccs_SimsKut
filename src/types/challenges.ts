export interface Challenge {
    id: string;
    title: string;
    slug: string;
    description: string;
    hashtag?: string;
    rules?: string;
    thumbnail_url?: string;
    badge_image_url: string;
    badge_title: string;
    status: 'active' | 'draft' | 'archived';
    starts_at: string;
    ends_at?: string;
    max_participants?: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Joins opcionais
    milestones?: ChallengeMilestone[];
    stats?: ChallengeStats;
    my_participation?: ChallengeParticipant;
}

export interface ChallengeMilestone {
    id: string;
    challenge_id: string;
    order_index: number;
    title: string;
    description?: string;
    is_final: boolean;
    // Join opcional
    my_entry?: MilestoneEntry;
}

export interface ChallengeParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    status: 'in_progress' | 'completed' | 'abandoned';
    completed_at?: string;
    badge_claimed: boolean;
    enrolled_at: string;
}

export interface MilestoneEntry {
    id: string;
    participant_id: string;
    milestone_id: string;
    user_id: string;
    note?: string;
    media_url_1?: string;
    media_url_2?: string;
    completed_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    challenge_id?: string; // Optional agora para permitir badges independentes
    admin_badge_id?: string;
    badge_image_url: string;
    badge_title: string;
    earned_at: string;
    is_featured: boolean;
}

export interface AdminTitle {
    id: string;
    title: string;
    created_at: string;
}

export interface AdminBadge {
    id: string;
    title: string;
    image_url: string;
    created_at: string;
}

export interface ChallengeStats {
    challenge_id: string;
    total_participants: number;
    total_completed: number;
}

export interface ChallengeProgress {
    participant_id: string;
    user_id: string;
    challenge_id: string;
    status: string;
    milestones_completed: number;
    milestones_total: number;
    progress_pct: number;
}
