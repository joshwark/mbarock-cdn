/**
 * MBA Rock — Authed /mba-rock → /dashboard redirect
 * Reason: Squarespace strips inline <script> blocks from Course Overview template.
 * This external script survives because <script src> tags do load.
 *
 * Auth detection: presence of lesson-link anchors (only rendered when authed).
 * Fallback signal: presence of "0% Progress" text (also authed-only).
 *
 * Deployed: 2026-05-17
 */
(function () {
  if (!/^\/mba-rock\/?$/.test(location.pathname)) return;

  function isAuthedCoursView() {
    // Primary signal: links to specific lessons
    var lessonLinks = document.querySelectorAll('a[href*="/mba-rock/m"]');
    if (lessonLinks.length > 5) return true;
    // Fallback: "START COURSE" or "Progress" text in body
    if (document.body && /START COURSE|0%\s*Progress|\bProgress\b/.test(document.body.innerText)) return true;
    return false;
  }

  function doRedirect() {
    // Welcome flash so transition feels intentional
    var flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;inset:0;background:#FAF8F5;display:flex;align-items:center;' +
      'justify-content:center;flex-direction:column;font-family:Inter,system-ui,sans-serif;' +
      'z-index:99999;color:#0B1F3A;text-align:center;padding:24px;';
    flash.innerHTML =
      '<div style="font-family:Fraunces,Georgia,serif;font-size:38px;color:#0B1F3A;' +
      'letter-spacing:-0.02em;margin-bottom:8px">Welcome back.</div>' +
      '<div style="font-size:14px;color:#888;letter-spacing:.05em;' +
      'text-transform:uppercase;font-weight:600">Loading your Dashboard…</div>';
    document.documentElement.appendChild(flash);
    window.location.replace('https://www.mbarock.com/dashboard');
  }

  function tryRedirect() {
    if (isAuthedCoursView()) {
      doRedirect();
      return true;
    }
    return false;
  }

  // Try immediately
  if (tryRedirect()) return;
  // Try after DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRedirect);
  }
  // Try after a delay in case Squarespace renders course content async
  setTimeout(tryRedirect, 600);
  setTimeout(tryRedirect, 1500);
})();
