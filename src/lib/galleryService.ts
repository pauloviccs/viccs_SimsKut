import { supabase } from './supabaseClient';
import type { GalleryFolder, Photo } from '@/types';

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

export async function getPhotos(
    userId: string,
    folderId?: string | null
): Promise<Photo[]> {
    let query = supabase
        .from('photos')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (folderId) {
        query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getPublicPhotos(limit = 40, offset = 0): Promise<Photo[]> {
    const { data, error } = await supabase
        .from('photos')
        .select('*, owner:profiles!owner_id(*)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((p: any) => ({
        ...p,
        owner: Array.isArray(p.owner) ? p.owner[0] : p.owner,
    }));
}

export async function addPhoto(
    userId: string,
    url: string,
    thumbnailUrl: string | null,
    folderId: string | null,
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

export async function toggleVisibility(photoId: string, current: 'private' | 'public'): Promise<'private' | 'public'> {
    const next = current === 'private' ? 'public' : 'private';
    const { error } = await supabase
        .from('photos')
        .update({ visibility: next })
        .eq('id', photoId);

    if (error) throw error;
    return next;
}
