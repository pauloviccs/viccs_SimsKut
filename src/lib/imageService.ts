import { supabase } from './supabaseClient';

/**
 * imageService — Compressão e upload de imagens.
 * Imagina como uma máquina de xerox inteligente: reduz o tamanho sem perder nitidez.
 *
 * Estratégia: WebP a 80% quality = ~30% menor que JPEG na mesma qualidade visual.
 */

const DEFAULTS = {
    maxSize: 1200,       // px lado maior
    quality: 0.80,       // qualidade WebP
    thumbSize: 400,      // px lado maior para thumbnail
    thumbQuality: 0.60,  // qualidade do thumbnail
};

/** Comprime uma imagem para WebP redimensionado */
export function compressImage(
    file: Blob,
    maxSize = DEFAULTS.maxSize,
    quality = DEFAULTS.quality
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Calcula novo tamanho mantendo proporção
            let w = img.width;
            let h = img.height;
            if (w > maxSize || h > maxSize) {
                if (w > h) {
                    h = Math.round((h * maxSize) / w);
                    w = maxSize;
                } else {
                    w = Math.round((w * maxSize) / h);
                    h = maxSize;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Falha ao comprimir imagem'));
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Falha ao carregar imagem'));
        };

        img.src = url;
    });
}

/** Cria thumbnail de uma imagem */
export function createThumbnail(
    file: Blob,
    size = DEFAULTS.thumbSize,
    quality = DEFAULTS.thumbQuality
): Promise<Blob> {
    return compressImage(file, size, quality);
}

/** Faz upload de uma imagem para o Supabase Storage */
export async function uploadImage(
    bucket: string,
    path: string,
    blob: Blob
): Promise<string> {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
            contentType: 'image/webp',
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/** Upload de imagem completo: comprimir + upload + retorna URL */
export async function processAndUpload(
    file: File | Blob,
    bucket: string,
    path: string,
    maxSize = DEFAULTS.maxSize
): Promise<{ url: string; thumbnailUrl: string }> {
    const [compressed, thumbnail] = await Promise.all([
        compressImage(file, maxSize),
        createThumbnail(file),
    ]);

    const thumbPath = path.replace(/(\.[^.]+)$/, '_thumb$1');

    const [url, thumbnailUrl] = await Promise.all([
        uploadImage(bucket, path, compressed),
        uploadImage(bucket, thumbPath, thumbnail),
    ]);

    return { url, thumbnailUrl };
}

/** Deleta imagem do Storage */
export async function deleteImage(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
}

/**
 * Upload direto sem compressão — para GIFs animados e outros formatos
 * que perderiam qualidade/animação se convertidos para WebP.
 */
export async function uploadRawFile(
    file: File | Blob,
    bucket: string,
    path: string,
    contentType: string
): Promise<{ url: string; thumbnailUrl: string }> {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType,
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    // GIFs usam a mesma URL como thumbnail
    return { url: data.publicUrl, thumbnailUrl: data.publicUrl };
}
