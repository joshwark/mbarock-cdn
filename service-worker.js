/* MBA Rock PWA service worker — DELIBERATELY CONSERVATIVE.
 * A misconfigured SW can brick a live paid site, so the rules here are strict:
 *   - Only handle same-origin GET. Everything else (POST, auth, Supabase, cross-origin) -> straight to network, untouched.
 *   - NEVER cache: auth/session, Supabase API, the checkout/paywall, /admin, /member-tools, /directory (dynamic/member data).
 *   - Static assets (css/js/img/audio/video/fonts): stale-while-revalidate.
 *   - HTML pages: network-first with cache fallback (so members get the latest, but get an offline copy if truly offline).
 *   - Bump CACHE_VERSION to force-refresh; old caches are purged on activate.
 *   - Kill switch: deploy a SW whose install calls self.registration.unregister() if we ever need to disable.
 */
'use strict';
var CACHE_VERSION = 'mbarock-v4';
var SHELL = CACHE_VERSION + '-shell';

// Precache only the safe, public shell + canon (never auth/checkout).
var PRECACHE = [
  '/dashboard/',
  '/lessons.v2.json',
  '/lessons.js',
  '/calculators.js'
];

// Never let the SW touch these (member-dynamic, auth, payments, analytics writes).
var BYPASS = [/\/admin\//, /\/member-tools\//, /\/directory\//, /\/account\//, /supabase\.co/, /\/d\//, /marketing_events/];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.allSettled(PRECACHE.map(function (u) { return c.add(u); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(CACHE_VERSION) !== 0; })
                           .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isStatic(url) { return /\.(css|js|png|jpe?g|svg|webp|gif|woff2?|mp3|mp4|json)$/i.test(url.pathname); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                                  // never intercept writes
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                   // only same-origin (CDN); skip Squarespace/Supabase/CDNs
  if (BYPASS.some(function (re) { return re.test(url.pathname) || re.test(url.href); })) return;

  if (isStatic(url)) {
    // stale-while-revalidate
    e.respondWith(caches.open(SHELL).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  // HTML / navigations: network-first, fall back to cache, then to /dashboard/ shell.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1) {
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) { caches.open(SHELL).then(function (c) { c.put(req, res.clone()); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('/dashboard/'); });
    }));
  }
});
