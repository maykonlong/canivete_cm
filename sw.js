/**
 * Service Worker — Canivete Suíço Dev
 * Versionamento via APP_VERSION para invalidar caches automaticamente.
 */

const APP_VERSION = '3.1.0';
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
            .then((cache) => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'no-cache' }))))
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

// Estratégia: Network First para arquivos críticos, Cache First para libs
self.addEventListener('fetch', (event) => {
    // Apenas GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Ignora requests de origens externas (CDNs, Google Fonts, etc)
    if (url.origin !== self.location.origin) return;

    // Network First para arquivos críticos (permite auto-atualização)
    const criticalFiles = ['/sw.js', '/index.html', '/css/style.css', '/js/app.js'];
    const isCritical = criticalFiles.some(p => url.pathname.endsWith(p));

    if (isCritical) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First para libs e outros assets locais
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
