/**
 * Service Worker — Canivete Suíço Dev
 * Versionamento via APP_VERSION para invalidar caches automaticamente.
 */

const APP_VERSION = '2.1.1';
const CACHE_NAME = `canivete-suico-v${APP_VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './libs/qrcode.min.js',
    './libs/jsQR.min.js',
    './libs/papaparse.min.js',
    './libs/sql-formatter.min.js',
    './libs/vkbeautify.min.js',
    './libs/dompurify.min.js',
    './libs/JsBarcode.all.min.js',
    './libs/forge.min.js'
];

// Instala e faz cache dos assets essenciais
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing ${CACHE_NAME}`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Limpa caches antigos quando uma nova versão é ativada
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating ${CACHE_NAME}`);
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log(`[SW] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Estratégia: Cache First para assets locais, Network First para API/proxy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Não cacheia requisições para API/proxy ou externas
    if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ ok: false, error: 'Offline' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Cache First para assets locais
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then((response) => {
                // Cacheia novos requests bem-sucedidos
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});