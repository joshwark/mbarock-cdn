/* MBA Rock — shared member auth helper (mr-auth.js)
 * Phase 2 of the security remediation. Gives member-private data calls a real,
 * server-verifiable identity via the existing Supabase Auth (magic-link) session.
 *
 * Pages include:  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *                 <script src="/mr-auth.js"></script>
 * Then use:
 *   await MRAuth.isSignedIn()                      // bool
 *   MRAuth.requireSignIn()                         // redirect to member-tools sign-in (returns here)
 *   await MRAuth.email()                           // canonical member id = auth email (or null)
 *   await MRAuth.headers()                         // {apikey, Authorization: Bearer <user JWT>, ...} — uses the
 *                                                  //   session JWT when signed in (RLS scopes to this member);
 *                                                  //   falls back to anon key when not (public/anon paths only)
 *
 * Uses supabase-js getSession() so the JWT auto-refreshes (a raw localStorage token expires ~1h).
 * Single-init; safe to include anywhere. Defensive throughout.
 */
(function () {
  'use strict';
  if (window.MRAuth) return;

  var SB_URL = 'https://ciloqphtencjthkedanw.supabase.co';
  var ANON   = 'sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-'; // public-safe publishable key
  var STORE  = 'sb-ciloqphtencjthkedanw-auth-token';             // supabase-js v2 default session key

  var _client = null;
  function client() {
    if (_client) return _client;
    try { if (window.supabase && window.supabase.createClient) _client = window.supabase.createClient(SB_URL, ANON); }
    catch (e) {}
    return _client;
  }
  // Fallback: read the persisted session directly if supabase-js isn't on the page.
  function readLS() {
    try {
      var raw = localStorage.getItem(STORE); if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && o.access_token) ? o : (o && o.currentSession) || null;
    } catch (e) { return null; }
  }
  function getSession() {
    var c = client();
    if (c && c.auth && c.auth.getSession) {
      return c.auth.getSession().then(function (r) { return (r && r.data && r.data.session) || null; })
                               .catch(function () { return readLS(); });
    }
    return Promise.resolve(readLS());
  }
  function token()  { return getSession().then(function (s) { return (s && s.access_token) || null; }); }
  function email()  { return getSession().then(function (s) { return (s && s.user && s.user.email) || null; }); }
  function isSignedIn() { return token().then(function (t) { return !!t; }); }
  function headers() {
    return token().then(function (t) {
      return { 'apikey': ANON, 'Authorization': 'Bearer ' + (t || ANON), 'Content-Type': 'application/json' };
    });
  }
  function requireSignIn() {
    try { location.href = '/member-tools/?return=' + encodeURIComponent(location.href); } catch (e) {}
  }

  window.MRAuth = {
    getSession: getSession, token: token, email: email, headers: headers,
    isSignedIn: isSignedIn, requireSignIn: requireSignIn, ANON: ANON, SB_URL: SB_URL
  };
})();
