/* Service Worker — SimsKut Web Push */

// Assume controle imediatamente sem esperar por reload.
// Sem isso, o SW fica em estado "waiting" no mobile e nunca processa eventos push.
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    // NUNCA retornar aqui — sem event.waitUntil o browser mata o SW
    // antes de showNotification completar. Usar fallback quando sem dados.
    let payload = { title: 'SimsKut', body: 'Nova atividade' };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch {
            payload.body = event.data.text() || payload.body;
        }
    }
    const options = {
        body: payload.body || undefined,
        icon: '/favicon-32x32.png',
        badge: '/favicon-32x32.png',
        tag: payload.tag || 'simskut-notif',
        renotify: true,
        data: payload.data || {},
    };
    event.waitUntil(self.registration.showNotification(payload.title, options));
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) {
                if (c.url.includes(self.location.origin) && 'focus' in c) {
                    c.navigate(url);
                    return c.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
