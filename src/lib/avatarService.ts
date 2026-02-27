import { supabase } from './supabaseClient';

/**
 * avatarService — Serviço de upload e gestão de avatar.
 * Imagina como um estúdio fotográfico: recebe a foto, recorta, redimensiona e guarda.
 */

const BUCKET = 'avatars';
const MAX_SIZE = 300;

/** Redimensiona e comprime uma imagem para 300×300 JPEG via Canvas */
export function resizeImage(file: Blob, maxSize = MAX_SIZE): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            canvas.width = maxSize;
            canvas.height = maxSize;
            const ctx = canvas.getContext('2d')!;

            // Desenha centralizado, preenchendo o quadrado
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Falha ao converter imagem'));
                },
                'image/jpeg',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Falha ao carregar imagem'));
        };

        img.src = url;
    });
}

/** Recorta uma seção específica da imagem e redimensiona para 300×300 */
export function cropAndResize(
    file: Blob,
    crop: { x: number; y: number; size: number },
    maxSize = MAX_SIZE
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            canvas.width = maxSize;
            canvas.height = maxSize;
            const ctx = canvas.getContext('2d')!;

            ctx.drawImage(
                img,
                crop.x, crop.y, crop.size, crop.size,
                0, 0, maxSize, maxSize
            );

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Falha ao converter imagem'));
                },
                'image/jpeg',
                0.85
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Falha ao carregar imagem'));
        };

        img.src = url;
    });
}

/** Faz upload do avatar para o Supabase Storage e retorna a URL pública */
export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
    const path = `${userId}.jpg`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Adiciona timestamp para cache busting
    return `${data.publicUrl}?t=${Date.now()}`;
}

/** Atualiza o avatar_url no profile do usuário */
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

    if (error) throw error;
}

/** Atualiza campos do profile (display_name, username, bio, website_url) */
export async function updateProfileInfo(
    userId: string,
    data: { display_name?: string; username?: string; tag_changed?: boolean; bio?: string; website_url?: string | null; zen_background?: any }
): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

    if (error) throw error;
}
