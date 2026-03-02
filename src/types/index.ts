/* =============================================
   TYPESCRIPT INTERFACES — SimsKut
   Todas as interfaces derivadas do schema SQL
   ============================================= */

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    website_url: string | null;
    invite_code_used: string | null;
    is_admin: boolean;
    tag_changed: boolean;
    zen_background?: any; // JSONB object config
    pinned_post_id?: string | null;
    created_at: string;
}

export interface ProfileStats {
    friends_count: number;
    posts_count: number;
    photos_count: number;
}

export interface InviteCode {
    id: string;
    code: string;
    visitor_fingerprint: string | null;
    status: 'pending' | 'approved' | 'used' | 'rejected';
    created_at: string;
    approved_at: string | null;
    approved_by: string | null;
    used_by: string | null;
    used_at: string | null;
}

export interface Friendship {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
}

// ======== FEED ========

export interface FeedPost {
    id: string;
    author_id: string;
    content: string | null;
    image_url: string | null;  // single URL ou JSON array de até 4 URLs
    created_at: string;
    updated_at: string;
    // Joined
    author?: Profile;
    // Aggregated
    likes_count?: number;
    comments_count?: number;
    liked_by_me?: boolean;
    /** Reações por emoji (estilo Discord) */
    reactions?: PostReactionAggregate[];
}

/** Retorna sempre um array de URLs de imagem do post (1–4). image_url pode ser string única ou JSON stringified array. */
export function getPostImageUrls(post: { image_url: string | null }): string[] {
    if (!post?.image_url) return [];
    const v = post.image_url.trim();
    if (v.startsWith('[')) {
        try {
            const arr = JSON.parse(v) as unknown;
            return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(0, 4) : [];
        } catch {
            return [v];
        }
    }
    return [v];
}

export interface PostLike {
    id: string;
    post_id: string;
    user_id: string;
    created_at: string;
}

export interface PostComment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    // Joined
    author?: Profile;
    // Aggregated
    likes_count?: number;
    liked_by_me?: boolean;
}

/** Reação (emoji) em um post — estilo Discord. Agregado: emoji, count, reacted_by_me */
export interface PostReactionAggregate {
    emoji: string;
    count: number;
    reacted_by_me: boolean;
}

export interface PostReaction {
    id: string;
    post_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

// ======== GALERIA ========

export interface GalleryFolder {
    id: string;
    owner_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    // Aggregated
    photo_count?: number;
    cover_url?: string | null;
}

export interface Photo {
    id: string;
    owner_id: string;
    url: string;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    visibility: 'private' | 'public';
    folder_id: string | null;
    created_at: string;
    // Joined
    owner?: Profile;
    // Aggregated
    likes_count?: number;
    comments_count?: number;
    liked_by_me?: boolean;
}

export interface PhotoLike {
    id: string;
    photo_id: string;
    user_id: string;
    created_at: string;
}

export interface PhotoComment {
    id: string;
    photo_id: string;
    author_id: string;
    content: string;
    created_at: string;
    // Joined
    author?: Profile;
}

// ======== FAMÍLIA ========

export interface Family {
    id: string;
    owner_id: string;
    family_name: string;
    family_photo_url: string | null;
    created_at: string;
    // Aggregated
    sims_count?: number;
    // Joined
    sims?: Sim[];
}

export interface Sim {
    id: string;
    family_id: string;
    name: string;
    photo_url: string | null;
    profession: string | null;
    bio: string | null;
    created_at: string;
    // Joined
    traits?: SimTrait[];
    photos?: SimPhoto[];
}

export interface SimTrait {
    id: string;
    sim_id: string;
    trait_type: 'quality' | 'skill';
    value: string;
    level: number;
}

export interface SimPhoto {
    id: string;
    sim_id: string;
    url: string;
    caption: string | null;
    created_at: string;
}
