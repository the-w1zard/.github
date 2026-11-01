export function serviceWorkerAdapter(scriptUrl, scope) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let registration = null;
    const init = async () => {
        if (!('serviceWorker' in navigator))
            return;
        registration = await navigator.serviceWorker.register(scriptUrl, scope ? { scope } : undefined);
        navigator.serviceWorker.addEventListener('message', (e) => {
            try {
                messageHandler?.(e.data);
            }
            catch { }
        });
        navigator.serviceWorker.ready.then(() => connectHandler?.());
        registration.addEventListener('updatefound', () => {
            disconnectHandler?.();
        });
    };
    init();
    return {
        send(msg) {
            const sw = navigator.serviceWorker?.controller;
            if (sw) {
                sw.postMessage(msg);
            }
            else {
                registration?.active?.postMessage(msg);
            }
        },
        onMessage(handler) {
            messageHandler = handler;
            return () => { messageHandler = null; };
        },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
export const serviceWorkerScript = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const queue = [];

self.addEventListener('message', async (e) => {
    const msg = e.data;
    if (!msg?.rt) return;

    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });

    if (clients.length === 0) {
        queue.push(msg);
        return;
    }

    for (const client of clients) {
        client.postMessage(msg);
    }
});

self.addEventListener('activate', async () => {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    while (queue.length > 0) {
        const msg = queue.shift();
        for (const client of clients) {
            client.postMessage(msg);
        }
    }
});
`;
