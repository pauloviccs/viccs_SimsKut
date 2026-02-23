/* =============================================
   TYPESCRIPT INTERFACES — SimsKut
   Todas as interfaces derivadas do schema SQL
   ============================================= */

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    invite_code_used: string | null;
    is_admin: boolean;
    tag_changed: boolean;
    created_at: string;
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

export interface FeedPost {
    id: string;
    author_id: string;
    content: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    author?: Profile;
}

export interface Photo {
    id: string;
    owner_id: string;
    url: string;
    description: string | null;
    visibility: 'private' | 'public';
    created_at: string;
    // Joined
    owner?: Profile;
}

export interface Family {
    id: string;
    owner_id: string;
    family_name: string;
    family_photo_url: string | null;
    created_at: string;
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
