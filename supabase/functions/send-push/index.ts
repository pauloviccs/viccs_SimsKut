/**
 * Edge Function: send-push
 * Enviada via Database Webhook quando uma nova notificação é inserida.
 * Busca push_subscriptions do user_id e envia Web Push para cada dispositivo.
 *
 * Configuração:
 * 1. Gere VAPID keys: npx web-push generate-vapid-keys
 * 2. Defina o secret: supabase secrets set VAPID_PRIVATE_KEY="sua-chave-privada"
 * 3. Crie o webhook no Dashboard: notifications (INSERT) → Edge Function send-push
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.5';

const NOTIFICATION_TYPES: Record<string, { title: string }> = {
    like_post: { title: 'Nova curtida no seu post' },
    like_photo: { title: 'Nova curtida na sua foto' },
    like_comment: { title: 'Nova curtida no seu comentário' },
    comment_post: { title: 'Novo comentário no seu post' },
    comment_photo: { title: 'Novo comentário na sua foto' },
    mention_post: { title: 'Você foi mencionado' },
    mention_comment: { title: 'Você foi mencionado' },
    reaction_post: { title: 'Nova reação ao seu post' },
    new_post_friend: { title: 'Novo post de um amigo' },
    friend_accept: { title: 'Pedido de amizade aceito' },
    family_update: { title: 'Atualização em família amiga' },
};

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: {
        id: string;
        user_id: string;
        type: string;
        content: string | null;
        reference_id: string | null;
    };
    schema: string;
}

function getTitleAndBody(type: string, content: string | null): { title: string; body: string } {
    const info = NOTIFICATION_TYPES[type] ?? { title: 'Nova atividade no SimsKut' };
    const body = content ? (content.length > 80 ? `${content.slice(0, 80)}...` : content) : '';
    return { title: info.title, body };
}

async function resolveVapidKeysFromEnv(): Promise<webpush.VapidKeys> {
    const vapidPrivateRaw = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!vapidPrivateRaw) {
        throw new Error('VAPID_PRIVATE_KEY not set');
    }

    // Formato 1 (preferido): JSON completo em VAPID_PRIVATE_KEY
    // Ex: {"publicKey":"...","privateKey":"..."}
    try {
        const parsed = JSON.parse(vapidPrivateRaw);
        if (parsed?.publicKey && parsed?.privateKey) {
            return await webpush.importVapidKeys(parsed, { extractable: false });
        }
    } catch {
        // Ignora e tenta fallback abaixo
    }

    // Formato 2 (compatível): private key pura + public key em variável separada
    const vapidPublic =
        Deno.env.get('VAPID_PUBLIC_KEY') ??
        Deno.env.get('VITE_VAPID_PUBLIC_KEY') ??
        Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

    if (!vapidPublic) {
        throw new Error('VAPID_PUBLIC_KEY missing for raw private key mode');
    }

    return await webpush.importVapidKeys(
        {
            publicKey: vapidPublic,
            privateKey: vapidPrivateRaw,
        },
        { extractable: false }
    );
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (!Deno.env.get('VAPID_PRIVATE_KEY')) {
        console.error('[send-push] VAPID_PRIVATE_KEY não configurada');
        return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY not set' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let payload: WebhookPayload;
    try {
        payload = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (payload.type !== 'INSERT' || payload.table !== 'notifications' || payload.schema !== 'public') {
        return new Response(JSON.stringify({ ok: true, skipped: 'not a notification insert' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { user_id, type, content, reference_id } = payload.record;
    const { title, body } = getTitleAndBody(type, content);

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user_id);

    if (error || !subs?.length) {
        return new Response(JSON.stringify({ ok: true, sent: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let vapidKeys: webpush.VapidKeys;
    try {
        vapidKeys = await resolveVapidKeysFromEnv();
    } catch (e) {
        console.error('[send-push] VAPID keys inválidas:', e);
        return new Response(JSON.stringify({ error: 'Invalid VAPID keys' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const appServer = await webpush.ApplicationServer.new({
        contactInformation: 'mailto:admin@simskut.app',
        vapidKeys,
    });

    const pushPayload = JSON.stringify({
        title,
        body,
        tag: 'simskut-notif',
        data: { url: '/feed', reference_id },
    });

    let sent = 0;
    const failed: string[] = [];

    for (const sub of subs) {
        try {
            const subscriber = appServer.subscribe({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            });
            await subscriber.pushTextMessage(pushPayload, {});
            sent++;
        } catch (e) {
            console.warn('[send-push] Falha ao enviar para', sub.endpoint?.slice(0, 50), e);
            failed.push(sub.endpoint);
        }
    }

    return new Response(JSON.stringify({ ok: true, sent, failed: failed.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
});
