/* MBA Rock — first-party tracking SDK (track.js)
 * Owns the data: every event lands in OUR Supabase (marketing_events). GA4/ads are
 * an OPTIONAL fan-out that fires only when window.gtag exists. Vendor-independent.
 * Reuses Supabase ciloqphtencjthkedanw + the public-safe publishable key (already
 * shipped in lessons.js / member pages). Safe to load on web, PWA, and app webview.
 *
 * Usage:  MBATrack.track('lesson_complete', { lesson_id:'M1L1', module_id:'M1' });
 *         MBATrack.identify('<member_id>');           // call on sign-in
 * Auto:   page_view on load; queue flush on visibility-hide / beforeunload (offline-safe).
 */
(function () {
  'use strict';
  if (window.MBATrack) return; // single-init guard

  var SB_URL = 'https://ciloqphtencjthkedanw.supabase.co';
  var SB_KEY = 'sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-'; // public-safe publishable key
  var ENDPOINT = SB_URL + '/rest/v1/marketing_events';
  var QUEUE_KEY = 'mr-track-queue-v1';
  var ANON_KEY = 'mr-anon-id';
  var SURFACE = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'web';

  function uuid() {
    try { return crypto.randomUUID(); }
    catch (e) { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  }
  function ls(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); }
    catch (e) { return null; }
  }

  // --- identity ---
  function memberId() {
    var keys = ['mba-rock-member-id', 'mr-member-id', 'mr_member_id', 'memberId'];
    for (var i = 0; i < keys.length; i++) { var v = ls(keys[i]); if (v) return v; }
    var m = new URLSearchParams(location.search).get('m');
    return m || null;
  }
  function anonId() { var a = ls(ANON_KEY); if (!a) { a = uuid(); ls(ANON_KEY, a); } return a; }
  var SESSION_ID = uuid();

  // --- UTM capture (persist first-touch for attribution) ---
  function utm() {
    var q = new URLSearchParams(location.search), out = {}, hit = false;
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (k) {
      var v = q.get('utm_' + k); if (v) { out[k] = v; hit = true; }
    });
    if (q.get('ref')) { out.ref = q.get('ref'); hit = true; }
    if (hit) ls('mr-utm', JSON.stringify(out));
    try { return JSON.parse(ls('mr-utm') || 'null'); } catch (e) { return null; }
  }

  // --- queue (offline-safe) ---
  function readQ() { try { return JSON.parse(ls(QUEUE_KEY) || '[]'); } catch (e) { return []; } }
  function writeQ(q) { ls(QUEUE_KEY, JSON.stringify(q.slice(-200))); } // cap to avoid bloat

  function buildEvent(name, props) {
    return {
      event_name: String(name),
      member_id: memberId(),
      anon_id: anonId(),
      session_id: SESSION_ID,
      surface: SURFACE,
      page: location.pathname + location.search.slice(0, 120),
      props: props || {},
      utm: utm(),
      ts: new Date().toISOString()
    };
  }

  function flush() {
    var q = readQ();
    if (!q.length) return Promise.resolve();
    var batch = q.slice(0, 50);
    return fetch(ENDPOINT, {
      method: 'POST', keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    }).then(function (r) {
      if (r.ok) { writeQ(readQ().slice(batch.length)); }     // drop only what we sent
    }).catch(function () { /* keep queued; retry next flush */ });
  }

  function gtagFanout(name, props) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, props || {}); } catch (e) {}
    try { if (window.dataLayer && window.dataLayer.push) window.dataLayer.push(Object.assign({ event: name }, props || {})); } catch (e) {}
  }

  // --- public API ---
  function track(name, props) {
    if (!name) return;
    var q = readQ(); q.push(buildEvent(name, props)); writeQ(q);
    gtagFanout(name, props);
    flush();
  }
  function identify(id) { if (id) { ['mba-rock-member-id'].forEach(function (k) { if (!ls(k)) ls(k, id); }); } }

  window.MBATrack = { track: track, identify: identify, flush: flush, sessionId: SESSION_ID };

  // --- auto events ---
  if (document.readyState !== 'loading') track('page_view', {});
  else document.addEventListener('DOMContentLoaded', function () { track('page_view', {}); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
})();
