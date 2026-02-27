import { supabase } from './supabaseClient';
import type { GalleryFolder, Photo, PhotoComment } from '@/types';
import { createInteractionNotification } from './notificationService';

/**
 * galleryService — Backend da Galeria Privada.
 * Imagina como um álbum de fotos digital: pastas organizadas com fotos dentro.
 */

// ======== PASTAS ========

export async function getFolders(userId: string): Promise<GalleryFolder[]> {
    const { data, error } = await supabase
        .from('gallery_folders')
        .select('*, photos(count)')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;

    // Buscar cover de cada pasta (primeira foto)
    const folders = (data || []).map((f: any) => ({
        ...f,
        photo_count: f.photos?.[0]?.count ?? 0,
        cover_url: null as string | null,
    }));

    // Buscar covers em batch
    if (folders.length > 0) {
        const folderIds = folders.map((f) => f.id);
        const { data: covers } = await supabase
            .from('photos')
            .select('folder_id, thumbnail_url, url')
            .in('folder_id', folderIds)
            .order('created_at', { ascending: false });

        const coverMap = new Map<string, string>();
        for (const c of covers || []) {
            if (c.folder_id && !coverMap.has(c.folder_id)) {
                coverMap.set(c.folder_id, c.thumbnail_url || c.url);
            }
        }

        for (const f of folders) {
            f.cover_url = coverMap.get(f.id) || null;
        }
    }

    return folders;
}

export async function createFolder(userId: string, name: string): Promise<GalleryFolder> {
    const { data, error } = await supabase
        .from('gallery_folders')
        .insert({ owner_id: userId, name: name.trim() })
        .select()
        .single();

    if (error) throw error;
    return { ...data, photo_count: 0, cover_url: null };
}

export async function renameFolder(folderId: string, name: string): Promise<void> {
    const { error } = await supabase
        .from('gallery_folders')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', folderId);

    if (error) throw error;
}

export async function deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
        .from('gallery_folders')
        .delete()
        .eq('id', folderId);

    if (error) throw error;
}

// ======== FOTOS ========

export async function getPhotos(userId: string, folderId: string | null = null, allFolders: boolean = false): Promise<Photo[]> {
    let query = supabase
        .from('photos')
        .select(`
            *,
            owner:profiles!owner_id(*),
            photo_likes(count),
            photo_comments(count)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (!allFolders) {
        if (folderId) {
            query = query.eq('folder_id', folderId);
        } else {
            query = query.is('folder_id', null);
        }
    }

    const { data, error } = await query;
    if (error) throw error;

    let myLikes: Set<string> = new Set();
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (currentUserId && data.length > 0) {
        const photoIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
            .from('photo_likes')
            .select('photo_id')
            .eq('user_id', currentUserId)
            .in('photo_id', photoIds);
        myLikes = new Set((likes || []).map((l: any) => l.photo_id));
    }

    return (data || []).map((p: any) => ({
        ...p,
        owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
        likes_count: p.photo_likes?.[0]?.count ?? 0,
        comments_count: p.photo_comments?.[0]?.count ?? 0,
        liked_by_me: myLikes.has(p.id)
    }));
}

/** Busca fotos PÚBLICAS globais */
export async function getPublicPhotos(limit = 60, offset = 0): Promise<Photo[]> {
    const { data, error } = await supabase
        .from('photos')
        .select(`
            *,
            owner:profiles!owner_id(*),
            photo_likes(count),
            photo_comments(count)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    let myLikes: Set<string> = new Set();
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (currentUserId && data.length > 0) {
        const photoIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
            .from('photo_likes')
            .select('photo_id')
            .eq('user_id', currentUserId)
            .in('photo_id', photoIds);
        myLikes = new Set((likes || []).map((l: any) => l.photo_id));
    }

    return (data || []).map((p: any) => ({
        ...p,
        owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
        likes_count: p.photo_likes?.[0]?.count ?? 0,
        comments_count: p.photo_comments?.[0]?.count ?? 0,
        liked_by_me: myLikes.has(p.id)
    }));
}

export async function addPhoto(
    userId: string,
    url: string,
    thumbnailUrl: string | null,
    folderId: string | null,
    title: string | null = null,
    description: string | null = null,
    visibility: 'private' | 'public' = 'private'
): Promise<Photo> {
    const { data, error } = await supabase
        .from('photos')
        .insert({
            owner_id: userId,
            url,
            thumbnail_url: thumbnailUrl,
            folder_id: folderId,
            title: title?.trim() || null,
            description: description?.trim() || null,
            visibility,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletePhoto(photoId: string): Promise<void> {
    const { error } = await supabase.from('photos').delete().eq('id', photoId);
    if (error) throw error;
}

export async function toggleVisibility(photoId: string, isPublic: boolean): Promise<Photo> {
    const newVisibility = isPublic ? 'public' : 'private';
    const { data, error } = await supabase
        .from('photos')
        .update({ visibility: newVisibility })
        .eq('id', photoId)
        .select()
        .single();
    if (error) throw error;
    return data as Photo;
}

// ======== LIKES NAS FOTOS ========

/** Toggle like em uma foto */
export async function togglePhotoLike(photoId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
        .from('photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing) {
        await supabase.from('photo_likes').delete().eq('id', existing.id);
        return false; // unliked
    } else {
        const { error } = await supabase
            .from('photo_likes')
            .insert({ photo_id: photoId, user_id: userId });
        if (error) throw error;

        // --- NOTIFICAÇÃO ---
        const { data: photoData } = await supabase.from('photos').select('owner_id, title').eq('id', photoId).single();
        if (photoData && photoData.owner_id !== userId) {
            await createInteractionNotification(
                photoData.owner_id,
                userId,
                'like_photo',
                photoId,
                photoData.title || 'sua foto'
            );
        }

        return true; // liked
    }
}

// ======== COMPORTAMENTO DE COMENTÁRIOS ========

/** Busca comentários de uma foto */
export async function getPhotoComments(photoId: string): Promise<PhotoComment[]> {
    const { data, error } = await supabase
        .from('photo_comments')
        .select('*, author:profiles!author_id(*)')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
    }));
}

/** Adiciona um comentário a uma foto */
export async function addPhotoComment(
    photoId: string,
    authorId: string,
    content: string
): Promise<PhotoComment> {
    const { data, error } = await supabase
        .from('photo_comments')
        .insert({
            photo_id: photoId,
            author_id: authorId,
            content: content.trim(),
        })
        .select('*, author:profiles!author_id(*)')
        .single();

    if (error) throw error;

    // --- NOTIFICAÇÃO ---
    const { data: photoData } = await supabase.from('photos').select('owner_id').eq('id', photoId).single();
    if (photoData && photoData.owner_id !== authorId) {
        await createInteractionNotification(
            photoData.owner_id,
            authorId,
            'comment_photo',
            photoId,
            content.trim()
        );
    }

    return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
    };
}

/** Remove um comentário de foto */
export async function deletePhotoComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('photo_comments').delete().eq('id', commentId);
    if (error) throw error;
}
