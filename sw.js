/* 极简 Service Worker：只为满足 PWA 可安装条件，
   不做任何缓存拦截，内容永远走网络保持最新。 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* 透传 */ });
