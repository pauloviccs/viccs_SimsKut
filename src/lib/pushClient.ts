import { supabase } from './supabaseClient';
import type { AppNotification } from './notificationService';

const SW_PATH = '/sw.js';
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function getNotificationTitleAndBody(type: AppNotification['type'], content: string | null): {
    title: string;
    body: string | undefined;
} {
    const preview = content ? (content.length > 80 ? `${content.slice(0, 80)}...` : content) : undefined;

    switch (type) {
        case 'like_post':
            return { title: 'Nova curtida no seu post', body: preview };
        case 'like_photo':
            return { title: 'Nova curtida na sua foto', body: preview };
        case 'like_comment':
            return { title: 'Nova curtida no seu comentário', body: preview };
        case 'comment_post':
            return { title: 'Novo comentário no seu post', body: preview };
        case 'comment_photo':
            return { title: 'Novo comentário na sua foto', body: preview };
        case 'mention_post':
        case 'mention_comment':
            return { title: 'Você foi mencionado', body: preview };
        case 'reaction_post':
            return { title: 'Nova reação ao seu post', body: preview };
        case 'new_post_friend':
            return { title: 'Novo post de um amigo', body: preview };
        case 'friend_accept':
            return { title: 'Pedido de amizade aceito', body: preview };
        case 'family_update':
            return { title: 'Atualização em família amiga', body: preview };
        default:
            return { title: 'Nova atividade no SimsKut', body: preview };
    }
}

/** Mostra uma notificação do navegador (quando o app está aberto em background). */
export function maybeShowBrowserNotification(payload: Pick<AppNotification, 'type' | 'content'>): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Evita duplicar com o painel aberto em foreground
    if (document.visibilityState === 'visible') return;

    const { title, body } = getNotificationTitleAndBody(payload.type, payload.content ?? null);

    try {
        new Notification(title, { body });
    } catch {
        // Ignora falhas silenciosamente
    }
}

/** Solicita permissão para notificações do navegador (pode ser chamado a partir de Configurações). */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return Notification.permission;
    }

    return await Notification.requestPermission();
}

/** Converte base64url em Uint8Array para a Push API */
function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

/**
 * Subscreve ao Web Push e armazena no backend.
 * Requer: permissão granted, service worker registrado, VITE_VAPID_PUBLIC_KEY configurada.
 * Retorna true se a subscrição foi armazenada (push offline ativo), false caso contrário.
 */
export async function subscribeToPush(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
    }

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return false;

    if (!VAPID_PUBLIC || VAPID_PUBLIC.length < 20) {
        console.warn('[Push] VITE_VAPID_PUBLIC_KEY não configurada. Push offline desabilitado.');
        return false;
    }

    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });

        const json = sub.toJSON();
        const { error } = await supabase.from('push_subscriptions').upsert(
            {
                user_id: userId,
                endpoint: json.endpoint!,
                p256dh: json.keys?.p256dh ?? '',
                auth: json.keys?.auth ?? '',
                user_agent: navigator.userAgent.slice(0, 500),
            },
            { onConflict: 'user_id,endpoint' }
        );

        if (error) {
            console.error('[Push] Erro ao salvar subscrição:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Push] Erro ao subscrever:', err);
        return false;
    }
}

