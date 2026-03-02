import { supabase } from './supabaseClient';
import type { AppNotification } from './notificationService';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SW_PATH = '/sw.js';

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

/**
 * Mostra uma notificação do navegador (quando o app está aberto em background).
 * Usa o Service Worker para exibir a notificação — único método que funciona no mobile.
 * `new Notification()` é ignorado silenciosamente em iOS e Android.
 */
export function maybeShowBrowserNotification(payload: Pick<AppNotification, 'type' | 'content'>): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Evita duplicar com o painel aberto em foreground
    if (document.visibilityState === 'visible') return;

    const { title, body } = getNotificationTitleAndBody(payload.type, payload.content ?? null);

    if ('serviceWorker' in navigator) {
        // Caminho correto para mobile: delega ao Service Worker
        navigator.serviceWorker.ready
            .then((reg) => reg.showNotification(title, { body, icon: '/favicon-32x32.png', badge: '/favicon-32x32.png' }))
            .catch(() => {
                // Fallback para desktop caso o SW não esteja disponível
                try { new Notification(title, { body }); } catch { /* ignora */ }
            });
    } else {
        // Desktop sem SW
        try { new Notification(title, { body }); } catch { /* ignora */ }
    }
}

/**
 * Solicita permissão para notificações do navegador.
 * IMPORTANTE: Não retorna cedo quando já 'granted' — o chamador deve tentar
 * subscribeToPush() independentemente, pois no iOS a janela de subscrição
 * é de uso único por sessão e o SW precisa ser inscrito logo após o grant.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    // Se já negado, nada a fazer
    if (Notification.permission === 'denied') {
        return 'denied';
    }

    // Se ainda 'default', pede permissão
    if (Notification.permission === 'default') {
        return await Notification.requestPermission();
    }

    // 'granted' — retorna mas NÃO bloqueia chamada de subscribeToPush()
    return Notification.permission;
}

/** Converte base64url em ArrayBuffer para a Push API */
function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const buffer = new ArrayBuffer(raw.length);
    const arr = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return buffer;
}

/** Converte chave binária em base64url (compatível com Web Push payload keys). */
function arrayBufferToBase64Url(input: ArrayBuffer | null): string {
    if (!input) return '';
    const bytes = new Uint8Array(input);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
        let reg = await navigator.serviceWorker.getRegistration(SW_PATH);
        if (!reg) {
            reg = await navigator.serviceWorker.register(SW_PATH);
        }

        // Garante worker ativo antes de manipular subscription
        reg = await navigator.serviceWorker.ready;

        // Recria inscrição para alinhar com a VAPID key atual (evita token stale em iOS após updates)
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
            try {
                await existing.unsubscribe();
            } catch {
                // Segue fluxo e tenta inscrever novamente
            }
        }

        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC),
        });

        const json = sub.toJSON();
        const p256dh = json.keys?.p256dh ?? arrayBufferToBase64Url(sub.getKey('p256dh'));
        const auth = json.keys?.auth ?? arrayBufferToBase64Url(sub.getKey('auth'));

        if (!json.endpoint || !p256dh || !auth) {
            console.error('[Push] Subscrição sem endpoint/keys válidas.');
            return false;
        }

        const { error } = await supabase.from('push_subscriptions').upsert(
            {
                user_id: userId,
                endpoint: json.endpoint,
                p256dh,
                auth,
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

