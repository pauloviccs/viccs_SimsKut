import { supabase } from './supabaseClient';
import { compressImage } from './imageService';
import { createInteractionNotification } from './notificationService';
import type { Flash, FlashGroup, FlashView } from '@/types';

/**
 * flashService — Backend dos Flashes (Stories efêmeros).
 * Cada flash expira em 24h. Só visível para o autor e amigos.
 */

// ── Constantes ─────────────────────────────────────────────────

const FLASH_BUCKET = 'flashes';
const FLASH_MAX_CAPTION = 150;
const FLASH_IMAGE_DEFAULTS = { maxSize: 1080, quality: 0.82 };

// ── Upload ──────────────────────────────────────────────────────

/**
 * Cria um novo Flash: comprime imagem → faz upload no storage → insere na tabela.
 * Retorna o Flash criado ou lança erro.
 */
export async function createFlash(
    imageFile: File | Blob,
    caption?: string
): Promise<Flash> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Comprimir imagem antes do upload (mesma pipeline do feed)
    const compressed = await compressImage(
        imageFile,
        FLASH_IMAGE_DEFAULTS.maxSize,
        FLASH_IMAGE_DEFAULTS.quality
    );

    // Upload: pasta por uid (política RLS de storage)
    const filename = `${user.id}/${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
        .from(FLASH_BUCKET)
        .upload(filename, compressed, { contentType: 'image/webp', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from(FLASH_BUCKET)
        .getPublicUrl(filename);

    // Inserir na tabela
    const trimmedCaption = caption?.trim().slice(0, FLASH_MAX_CAPTION) || null;
    const { data, error } = await supabase
        .from('flashes')
        .insert({ author_id: user.id, image_url: publicUrl, caption: trimmedCaption })
        .select(`*, author: profiles!author_id(*)`)
        .single();

    if (error) throw error;

    // Notificar amigos (não-bloqueante — fire and forget)
    notifyFriendsOfFlash(user.id).catch(console.error);

    return {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
        views_count: 0,
        viewed_by_me: false,
    };
}

// ── Fetch ───────────────────────────────────────────────────────

/**
 * Busca todos os flashes válidos (não expirados) de amigos + próprios,
 * agrupados por autor, ordenados por: amigos com unseen primeiro, depois por recência.
 */
export async function getFlashGroups(): Promise<FlashGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Buscar flashes (RLS já filtra: só amigos + próprio + não expirado)
    const { data: flashes, error } = await supabase
        .from('flashes')
        .select(`
            *,
            author: profiles!author_id(id, username, display_name, avatar_url),
            flash_views(viewer_id)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!flashes || flashes.length === 0) return [];

    // Agrupar por author_id
    const groupMap = new Map<string, FlashGroup>();

    for (const raw of flashes) {
        const author = Array.isArray(raw.author) ? raw.author[0] : raw.author;
        if (!author) continue;

        const viewerIds: string[] = (raw.flash_views || []).map((v: any) => v.viewer_id);
        const viewed_by_me = viewerIds.includes(user.id);
        const views_count = viewerIds.length;

        const flash: Flash = {
            id: raw.id,
            author_id: raw.author_id,
            image_url: raw.image_url,
            caption: raw.caption,
            expires_at: raw.expires_at,
            created_at: raw.created_at,
            author,
            views_count,
            viewed_by_me,
        };

        if (!groupMap.has(raw.author_id)) {
            groupMap.set(raw.author_id, {
                author,
                flashes: [],
                has_unseen: false,
            });
        }

        const group = groupMap.get(raw.author_id)!;
        group.flashes.push(flash);
        if (!viewed_by_me) group.has_unseen = true;
    }

    // Converter para array e ordenar:
    // 1. Próprio usuário primeiro
    // 2. Grupos com unseen primeiro
    // 3. Mais recente primeiro dentro de cada grupo
    return Array.from(groupMap.values()).sort((a, b) => {
        if (a.author.id === user.id) return -1;
        if (b.author.id === user.id) return 1;
        if (a.has_unseen && !b.has_unseen) return -1;
        if (!a.has_unseen && b.has_unseen) return 1;
        return 0;
    });
}

// ── Visualização ────────────────────────────────────────────────

/**
 * Registra que o usuário atual visualizou um flash.
 * Ignora erro de duplicate (UNIQUE constraint) silenciosamente.
 */
export async function markFlashViewed(flashId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('flash_views')
        .upsert(
            { flash_id: flashId, viewer_id: user.id },
            { onConflict: 'flash_id,viewer_id', ignoreDuplicates: true }
        );
}

/**
 * Busca quem viu os flashes de um autor (para o autor ver seus viewers).
 */
export async function getFlashViewers(flashId: string): Promise<FlashView[]> {
    const { data, error } = await supabase
        .from('flash_views')
        .select(`*, viewer: profiles!viewer_id(id, username, display_name, avatar_url)`)
        .eq('flash_id', flashId)
        .order('viewed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((v: any) => ({
        ...v,
        viewer: Array.isArray(v.viewer) ? v.viewer[0] : v.viewer,
    }));
}

// ── Delete ──────────────────────────────────────────────────────

/**
 * Deleta um flash do banco E remove a imagem do storage.
 */
export async function deleteFlash(flash: Flash): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || flash.author_id !== user.id) throw new Error('Sem permissão');

    // Extrair path do storage da URL pública
    const url = new URL(flash.image_url);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/flashes\/(.+)/);
    if (pathMatch) {
        await supabase.storage.from(FLASH_BUCKET).remove([pathMatch[1]]);
    }

    const { error } = await supabase.from('flashes').delete().eq('id', flash.id);
    if (error) throw error;
}

// ── Notificações ────────────────────────────────────────────────

/**
 * Envia notificação para todos os amigos aceitos quando um novo flash é publicado.
 * Fire-and-forget. Não lança erro se falhar.
 */
async function notifyFriendsOfFlash(authorId: string): Promise<void> {
    // Buscar amigos
    const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${authorId},addressee_id.eq.${authorId}`);

    if (!friendships || friendships.length === 0) return;

    const friendIds = friendships.map((f: any) =>
        f.requester_id === authorId ? f.addressee_id : f.requester_id
    );

    for (const friendId of friendIds) {
        await createInteractionNotification(
            friendId,
            authorId,
            'new_flash',
            authorId, // referência ao perfil do autor
            'publicou um novo Flash! ⚡'
        ).catch(() => { });
    }
}
