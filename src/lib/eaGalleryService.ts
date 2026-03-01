import { supabase } from './supabaseClient';
import type { EaShowcaseItem } from '@/types';

/**
 * eaGalleryService — Integração com a Sims 4 Gallery (EA) via Edge Function.
 * Camada responsável por:
 * - Buscar criações da EA para um EA ID (lista leve).
 * - Fazer deep-fetch dos itens selecionados.
 * - Sincronizar a vitrine local (tabela saas_ea_showcase).
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

if (!supabaseUrl) {
    throw new Error(
        '❌ VITE_SUPABASE_URL não está configurada.\n' +
        '→ Defina a URL do projeto Supabase para usar a integração da Sims 4 Gallery.'
    );
}

// Deriva o domínio de Functions a partir da URL principal do Supabase.
// Ex: https://xyz.supabase.co → https://xyz.functions.supabase.co
const functionsBaseUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
const EA_SYNC_URL = `${functionsBaseUrl}/ea-sync`;

export interface EaGalleryItem {
    ea_original_id: string;
    title: string;
    thumbnail_url: string | null;
    packs_needed: any;
    original_comments: any;
    download_count: number | null;
    favorite_count: number | null;
}

interface EaListResponse {
    items: EaGalleryItem[];
}

interface DeepFetchResponse {
    items: EaGalleryItem[];
}

async function getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
}

/**
 * Busca a lista leve de criações na EA Gallery para um EA ID.
 * Não toca no banco local — apenas discovery.
 */
export async function fetchEaItems(eaId: string): Promise<EaGalleryItem[]> {
    if (!eaId.trim()) {
        throw new Error('Informe um EA ID válido.');
    }

    const headers = await getAuthHeaders();
    const url = `${EA_SYNC_URL}?eaId=${encodeURIComponent(eaId.trim())}`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[eaGalleryService] Erro ao buscar lista da EA:', res.status, text);
        throw new Error('Não foi possível buscar as criações da EA. Tente novamente mais tarde.');
    }

    const json = (await res.json()) as EaListResponse;
    return Array.isArray(json.items) ? json.items : [];
}

/**
 * Lê a vitrine publicada de um usuário a partir do banco local.
 * Usado tanto na página de configuração quanto no ProfilePage (read-only).
 */
export async function getUserShowcase(userId: string): Promise<EaShowcaseItem[]> {
    const { data, error } = await supabase
        .from('saas_ea_showcase')
        .select('*')
        .eq('user_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EaShowcaseItem[];
}

/**
 * Salva a seleção de até 50 itens na vitrine local.
 * Fluxo:
 * 1) Deep-fetch via Edge Function (rich JSON).
 * 2) Upsert em saas_ea_showcase.
 * 3) Remove entradas que não estão mais selecionadas.
 */
export async function saveShowcaseSelection(
    eaId: string,
    itemIds: string[]
): Promise<EaShowcaseItem[]> {
    const trimmedEaId = eaId.trim();
    if (!trimmedEaId) {
        throw new Error('Informe um EA ID válido.');
    }

    if (itemIds.length === 0) {
        // Se usuário desmarcou tudo, apenas limpa a vitrine.
        const { data: sessionData } = await supabase.auth.getUser();
        const userId = sessionData.user?.id;
        if (!userId) throw new Error('Usuário não autenticado.');

        const { error } = await supabase
            .from('saas_ea_showcase')
            .delete()
            .eq('user_id', userId);
        if (error) throw error;
        return [];
    }

    if (itemIds.length > 50) {
        throw new Error('Você só pode selecionar até 50 criações para a vitrine.');
    }

    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData.user?.id;
    if (!userId) {
        throw new Error('Usuário não autenticado.');
    }

    const headers = await getAuthHeaders();

    const res = await fetch(`${EA_SYNC_URL}/deep-fetch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            eaId: trimmedEaId,
            itemIds,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[eaGalleryService] Erro no deep-fetch da EA:', res.status, text);
        throw new Error('Não foi possível sincronizar os detalhes das criações. Tente novamente.');
    }

    const json = (await res.json()) as DeepFetchResponse;
    const items = Array.isArray(json.items) ? json.items : [];

    // Prepara payload para o Supabase — cache local dos até 50 itens
    const payload = items.map((item) => ({
        user_id: userId,
        ea_original_id: item.ea_original_id,
        title: item.title,
        thumbnail_url: item.thumbnail_url,
        packs_needed: item.packs_needed,
        original_comments: item.original_comments,
        download_count: item.download_count,
        favorite_count: item.favorite_count,
        is_published: true,
    }));

    // 1) Remove itens que não estão mais selecionados (para este usuário)
    const { error: deleteError } = await supabase
        .from('saas_ea_showcase')
        .delete()
        .eq('user_id', userId)
        .not('ea_original_id', 'in', itemIds);

    if (deleteError) throw deleteError;

    // 2) Upsert dos itens atuais (novos + atualizações)
    const { error: upsertError } = await supabase
        .from('saas_ea_showcase')
        .upsert(payload, {
            onConflict: 'user_id,ea_original_id',
        });

    if (upsertError) throw upsertError;

    return await getUserShowcase(userId);
}

