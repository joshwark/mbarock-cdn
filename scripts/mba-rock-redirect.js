/**
 * MBA Rock — Authed /mba-rock and /mba-rock/[slug] → /dashboard redirect
 * Reason: Squarespace strips inline <script> blocks from Course Overview template.
 * This external script survives because <script src> tags do load.
 *
 * Behaviour:
 *   - On /mba-rock (course root): auth-detect, then redirect to /dashboard
 *   - On /mba-rock/[slug] (course chapter): always redirect authed users to /dashboard#[slug]
 *     so they land on the branded dashboard with the specific lesson focused.
 *
 * Auth detection (same heuristics as before):
 *   - Primary: presence of /mba-rock/m* links (only rendered when authed)
 *   - Fallback: "START COURSE" or "Progress" text in body
 *
 * Deployed: 2026-05-17 (chapter-slug routing added 2026-05-27)
 */
(function () {
  var path = location.pathname || '';
  var rootMatch = /^\/mba-rock\/?$/.test(path);
  var chapterMatch = path.match(/^\/mba-rock\/([a-z0-9\-]+)\/?$/i);
  if (!rootMatch && !chapterMatch) return;

  var lessonSlug = chapterMatch ? chapterMatch[1].toLowerCase() : '';

  function isAuthedCoursView() {
    // Primary signal: links to specific lessons
    var lessonLinks = document.querySelectorAll('a[href*="/mba-rock/m"], a[href*="/mba-rock/"]');
    if (lessonLinks.length > 3) return true;
    // Fallback: "START COURSE" or "Progress" text in body
    if (document.body && /START COURSE|0%\s*Progress|\bProgress\b|My progress/.test(document.body.innerText)) return true;
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
    var dest = 'https://www.mbarock.com/dashboard';
    if (lessonSlug) dest += '#' + lessonSlug;
    window.location.replace(dest);
  }

  function tryRedirect() {
    // On chapter pages, always redirect (lesson is paid content; if you got the URL you're either
    // a member or shouldn't be there — dashboard's own gate will challenge unauthed visitors).
    if (chapterMatch) { doRedirect(); return true; }
    // On the course root, only redirect if auth signals are present.
    if (isAuthedCoursView()) { doRedirect(); return true; }
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
