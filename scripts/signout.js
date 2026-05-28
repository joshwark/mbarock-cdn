// MBA Rock — global Sign-Out widget
// Self-injects a fixed-position top-right widget on every page when a session exists.
// Click → clears member-id + Supabase tokens from localStorage + redirects to /landing/.
// Skip rendering on /landing/ (page has its own auth section in the hero) and /sample/ (public sample).
(function(){
  'use strict';
  if (window.__mrSignoutInjected) return;
  window.__mrSignoutInjected = true;

  var SB_URL = 'https://ciloqphtencjthkedanw.supabase.co';
  var SB_KEY = 'sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-';

  function signedIn(){
    try {
      var keys = [
        'sb-ciloqphtencjthkedanw-auth-token',
        'mr-member-id',
        'mr_member_id',
        'mba-rock-member-id',
        'mba-rock-member',
        'memberId'
      ];
      return keys.some(function(k){
        var v = localStorage.getItem(k);
        return v && v.length > 4 && v !== 'guest' && v !== 'null';
      });
    } catch(e){ return false; }
  }

  function getMemberDisplay(){
    try {
      return (
        localStorage.getItem('mr-member-id') ||
        localStorage.getItem('mr_member_id') ||
        localStorage.getItem('mba-rock-member-id') ||
        localStorage.getItem('memberId') ||
        ''
      ).replace(/^"+|"+$/g,'').slice(0, 32);
    } catch(e){ return ''; }
  }

  function clearAllAuth(){
    try {
      // Supabase tokens
      Object.keys(localStorage).forEach(function(k){
        if (k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > -1) localStorage.removeItem(k);
      });
      // Member id signals
      ['mr-member-id','mr_member_id','mba-rock-member-id','mba-rock-member','memberId'].forEach(function(k){
        localStorage.removeItem(k);
      });
    } catch(e){}
  }

  function signOut(){
    // Best-effort Supabase signout
    try {
      var raw = localStorage.getItem('sb-ciloqphtencjthkedanw-auth-token');
      var token = raw ? JSON.parse(raw).access_token : null;
      if (token){
        fetch(SB_URL + '/auth/v1/logout', {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
        }).catch(function(){});
      }
    } catch(e){}
    clearAllAuth();
    location.href = 'https://learn.mbarock.com/landing/';
  }

  function shouldSkipPath(){
    var p = location.pathname.toLowerCase();
    return (
      /^\/landing\/?$/.test(p)       ||
      /^\/sample\/?$/.test(p)        ||
      /^\/d\/[^\/]+\/?$/.test(p)     ||  // public dossier share
      /^\/verify\/?$/.test(p)            // public cert verify
    );
  }

  function inject(){
    if (shouldSkipPath()) return;
    if (!signedIn()) return;
    if (document.getElementById('mr-signout-widget')) return;

    var display = getMemberDisplay();
    var truncated = display.length > 22 ? (display.slice(0,19) + '…') : display;

    var wrap = document.createElement('div');
    wrap.id = 'mr-signout-widget';
    wrap.setAttribute('role','complementary');
    wrap.setAttribute('aria-label','Account');
    wrap.style.cssText =
      'position:fixed;top:14px;right:16px;z-index:99998;' +
      'display:flex;align-items:center;gap:8px;' +
      'background:rgba(11,31,58,0.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'border:1px solid rgba(255,255,255,0.18);border-radius:999px;' +
      'padding:7px 8px 7px 14px;' +
      'font-family:Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'font-size:12.5px;color:#FDFAF1;' +
      'box-shadow:0 4px 14px rgba(0,0,0,0.18);' +
      'pointer-events:auto;' +
      'max-width:calc(100vw - 32px);';

    wrap.innerHTML =
      '<span id="mr-signout-email" style="opacity:0.78;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">' +
        (truncated ? '👤 ' + truncated.replace(/[<>]/g,'') : '👤 Signed in') +
      '</span>' +
      '<button id="mr-signout-btn" type="button" ' +
      'style="background:#F26B1F;color:#fff;border:0;border-radius:999px;padding:6px 14px;' +
      'font:600 12px Inter,system-ui,sans-serif;letter-spacing:.03em;cursor:pointer;white-space:nowrap;">' +
        'Sign out' +
      '</button>';

    // Mobile responsive: hide email on narrow screens
    var mq = '@media(max-width:480px){#mr-signout-widget #mr-signout-email{display:none}#mr-signout-widget{padding:7px 10px}}';
    var styleEl = document.createElement('style');
    styleEl.textContent = mq;
    document.head.appendChild(styleEl);

    document.body.appendChild(wrap);

    document.getElementById('mr-signout-btn').addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      signOut();
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  // Also re-check after 1s in case other scripts populate member-id after our first check
  setTimeout(inject, 1200);
})();
