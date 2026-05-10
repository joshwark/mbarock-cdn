/* MBA Rock — Lesson Bundle JS
 * Loaded site-wide via Squarespace Code Injection (Header).
 * Reads URL slug, looks up lesson in lessons.json, injects styled lesson block.
 *
 * v5 — Full hardening per engineering brief (MBA_Rock_Claude_Brief_lessonsjs_fix.pdf)
 *
 *  Fix 1 — BUNDLE_BASE: scan all <script> tags by src instead of document.currentScript
 *           (currentScript is null for defer scripts at execution time).
 *           Falls back to jsDelivr with a console.warn so we always know when it fires.
 *           Supports window.MBA_ROCK_BUNDLE_BASE override from Code Injection.
 *
 *  Fix 2 — MutationObserver: after first inject, watch .course-item (parent of target)
 *           with subtree:true. Uses data-mbaInjected HTML-length fingerprint so the
 *           observer does not re-fire on its own injection. Single observer per page
 *           lifetime tracked on window.__mbaObserverAttached.
 *
 *  Fix 3 — 5-second final retry: re-resolves the target from the DOM fresh, re-injects,
 *           re-attaches observer.
 *
 *  Hardening — SPA route-change hook: patches history.pushState / replaceState and
 *              listens for popstate so lesson-to-lesson navigation re-runs the full
 *              inject pipeline with the correct lesson for the new slug.
 *
 *  Logging — all output prefixed [MBA Rock]: BUNDLE_BASE chosen, fetch URL + status,
 *             target found/not, inject fired, observer re-fired, 5s retry fired,
 *             route change detected.
 *
 * Acceptance criteria (all must pass on hard reload AND SPA navigation):
 *  1. BUNDLE_BASE logs the actual script origin, not the jsDelivr fallback.
 *  2. lessons.json fetch returns 200.
 *  3. .course-item__lesson-content has correct lesson HTML within 1.5s of route stable.
 *  4. After 10s idle, lesson HTML is still present (Squarespace re-render did not wipe it).
 *  5. Navigating to another lesson and back loads correct content for each.
 */
(function () {
  'use strict';

  // ─── 1. BUNDLE_BASE resolution ───────────────────────────────────────────────
  // document.currentScript is null for <script defer> at execution time.
  // Scan all <script> tags for the one that loaded lessons.js instead.
  function resolveBundleBase() {
    // Explicit override from Code Injection (set window.MBA_ROCK_BUNDLE_BASE before us)
    if (window.MBA_ROCK_BUNDLE_BASE) {
      console.log('[MBA Rock] BUNDLE_BASE from window override:', window.MBA_ROCK_BUNDLE_BASE);
      return window.MBA_ROCK_BUNDLE_BASE;
    }
    // Scan all script tags (reverse order — ours is likely near the end)
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (/\/lessons\.js(\?|$)/.test(src)) {
        var base = src.replace(/\/lessons\.js.*$/, '/');
        console.log('[MBA Rock] BUNDLE_BASE resolved from script tag:', base);
        return base;
      }
    }
    console.warn('[MBA Rock] BUNDLE_BASE fallback to jsDelivr — script tag not found');
    return 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/';
  }

  var BUNDLE_BASE = resolveBundleBase();

  // ─── HTML escape ─────────────────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── URL slug extraction ──────────────────────────────────────────────────────
  function currentSlug() {
    var p = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!p) return '';
    if (/^config(\/|$)/.test(p) || /^settings(\/|$)/.test(p)) return '';
    var parts = p.split('/');
    return parts[parts.length - 1].toLowerCase();
  }

  // ─── Render lesson HTML ───────────────────────────────────────────────────────
  // NOTE: We do NOT render the lesson title — Squarespace already shows it.
  function renderLesson(lesson, modules) {
    var c = lesson.content || {};
    var moduleObj = modules.find(function (m) { return m.id === lesson.moduleId; }) || { title: '', color: '#0B2545' };
    var html = '';

    html += '<div class="mr-module-label" style="background:' + moduleObj.color + '">' + esc(moduleObj.title) + '</div>';

    if (lesson.audio_url) {
      html += '<div class="mr-audio">';
      html += '<div class="mr-audio-icon">&#9835;</div>';
      html += '<div class="mr-audio-content">';
      html += '<div class="mr-audio-label">Lesson Song</div>';
      if (lesson.song_title) { html += '<div class="mr-audio-song">' + esc(lesson.song_title) + '</div>'; }
      html += '<audio controls preload="none" class="mr-audio-player" src="' + esc(lesson.audio_url) + '"></audio>';
      html += '</div></div>';
    } else if (lesson.song_title) {
      html += '<div class="mr-audio">';
      html += '<div class="mr-audio-icon">&#9835;</div>';
      html += '<div class="mr-audio-content">';
      html += '<div class="mr-audio-label">Lesson Song</div>';
      html += '<div class="mr-audio-song">' + esc(lesson.song_title) + '</div>';
      html += '<div class="mr-audio-pending">Audio coming soon.</div>';
      html += '</div></div>';
    }

    if (c.intro || c.core) {
      html += '<section class="mr-card">';
      if (c.intro) { html += '<h2>The Idea</h2><p class="mr-pullquote">' + esc(c.intro) + '</p>'; }
      if (c.core) { html += '<h3>Core Concepts</h3><p>' + esc(c.core) + '</p>'; }
      if (c.song_tie_in) { html += '<h3>Song Tie-In</h3><p>' + esc(c.song_tie_in) + '</p>'; }
      if (c.cta) { html += '<h3>Take Action</h3><p><strong>' + esc(c.cta) + '</strong></p>'; }
      html += '</section>';
    }

    if (Array.isArray(c.worksheet) && c.worksheet.length > 0) {
      html += '<section class="mr-card mr-worksheet"><h2>Worksheet</h2><ol class="mr-numbered">';
      c.worksheet.forEach(function (item) { html += '<li>' + esc(item) + '</li>'; });
      html += '</ol></section>';
    }

    if (c.calculator_inputs || c.calculator_outputs || lesson.calculator_url) {
      html += '<section class="mr-card"><h2>Calculator</h2>';
      if (c.calculator_inputs) { html += '<h3>Inputs</h3><p>' + esc(c.calculator_inputs) + '</p>'; }
      if (c.calculator_outputs) { html += '<h3>Outputs</h3><p>' + esc(c.calculator_outputs) + '</p>'; }
      if (lesson.calculator_url) {
        html += '<p><a class="mr-btn" href="' + esc(lesson.calculator_url) + '" target="_blank" rel="noopener">Open Calculator</a></p>';
      }
      html += '</section>';
    }

    if (lesson.embed) {
      var e = lesson.embed;
      html += '<section class="mr-embed">';
      if (e.type === 'project_brief') {
        html += '<h2>' + esc(e.label) + '</h2>';
        html += '<a class="mr-btn" href="' + esc(e.url) + '" target="_blank" rel="noopener">Download Brief</a>';
      } else if (e.type === 'google_form') {
        html += '<h2>' + esc(e.label) + '</h2>';
        html += '<div class="mr-iframe-wrap"><iframe src="' + esc(e.url) + '" height="900" frameborder="0">Loading...</iframe></div>';
      }
      html += '</section>';
    }

    return html;
  }

  // ─── Render assessments page ──────────────────────────────────────────────────
  function renderAssessments(bundle) {
    var lessons = bundle.lessons;
    var html = '<header class="mr-hero"><div class="mr-eyebrow">All Assessments</div><h1 class="mr-title">MBA Rock Assessments</h1></header>';

    function gridSection(title, items) {
      var s = '<section><h2>' + esc(title) + '</h2><div class="mr-assess-grid">';
      items.forEach(function (l) {
        s += '<div class="mr-assess-card"><h3>' + esc(l.title) + '</h3>';
        s += '<a class="mr-btn" href="' + esc(l.embed.url) + '" target="_blank" rel="noopener">';
        s += l.embed.type === 'project_brief' ? 'Download Brief' : 'Open Assessment';
        s += '</a></div>';
      });
      return s + '</div></section>';
    }

    var quizzes  = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Quiz/.test(l.type); });
    var tests    = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Unit Test/.test(l.type); });
    var projects = lessons.filter(function (l) { return l.embed && l.embed.type === 'project_brief'; });

    if (quizzes.length)  html += gridSection('Module Quizzes', quizzes);
    if (tests.length)    html += gridSection('Unit Tests', tests);
    if (projects.length) html += gridSection('Project Briefs', projects);
    return html;
  }

  // ─── Find injection target ────────────────────────────────────────────────────
  // Squarespace Members Area BEM classes — .course-item__lesson-content is primary.
  function findTarget() {
    var selectors = [
      '.course-item__lesson-content',
      '.course-item__content',
      '.course-item-content',
      '.course-lesson-content',
      '.lesson-content',
      '.lesson__content',
      '[class*="course-item__lesson"]',
      '[class*="course-item__content"]',
      '[class*="course-lesson"]',
      '[class*="members-area"] [class*="content"]',
      '.course-syllabus-player__content',
      '.course-content-wrapper',
      '[data-course-item-content]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el !== document.body && el !== document.documentElement) {
        console.log('[MBA Rock] target found:', selectors[i]);
        return el;
      }
    }
    console.warn('[MBA Rock] target not found — falling back to insertSmartly()');
    return null;
  }

  // ─── insertSmartly (non-destructive fallback) ─────────────────────────────────
  function insertSmartly(lessonHtml) {
    var wrap = document.createElement('div');
    wrap.className = 'mr-lesson';
    wrap.innerHTML = lessonHtml;

    var allLinks = document.querySelectorAll('a');
    var courseNavContainer = null;
    for (var i = 0; i < allLinks.length; i++) {
      var txt = (allLinks[i].textContent || '').trim();
      if (txt.indexOf('All Lessons') > -1 || txt.indexOf('Back to') > -1 || txt.indexOf('Course') > -1) {
        var el = allLinks[i];
        while (el && el !== document.body) {
          if (el.tagName !== 'BODY' && el.tagName !== 'MAIN' &&
              el.querySelectorAll('a').length >= 2 && el.querySelectorAll('a').length <= 10) {
            courseNavContainer = el;
            break;
          }
          el = el.parentElement;
        }
        if (courseNavContainer) break;
      }
    }
    if (courseNavContainer && courseNavContainer.parentElement) {
      courseNavContainer.parentElement.insertBefore(wrap, courseNavContainer.nextSibling);
      return;
    }
    var mainEl = document.querySelector('main#page, main[role="main"], main, #page');
    if (mainEl) { mainEl.insertBefore(wrap, mainEl.firstChild); return; }
    var footer = document.querySelector('footer, [id*="footer"], [class*="footer"], [data-footer-sections]');
    if (footer && footer.parentElement) { footer.parentElement.insertBefore(wrap, footer); return; }
    document.body.appendChild(wrap);
  }

  // ─── 2. Core inject with data-mbaInjected fingerprint ────────────────────────
  // Uses HTML length as a cheap fingerprint so the MutationObserver does not
  // re-fire on its own injection.
  function injectLesson(targetEl, lessonHtml) {
    if (!targetEl) return;
    if (targetEl.dataset.mbaInjected === String(lessonHtml.length)) return; // idempotent
    targetEl.innerHTML = lessonHtml;
    targetEl.dataset.mbaInjected = String(lessonHtml.length);
    document.body.classList.add('mr-lesson-active');
    console.log('[MBA Rock] inject fired, length=' + lessonHtml.length);
  }

  // ─── 2. MutationObserver re-injection defense ─────────────────────────────────
  // Attaches to .course-item (parent) with subtree:true so even if Squarespace
  // fully replaces targetEl, the observer survives one level up and can re-resolve.
  // window.__mbaObserverAttached prevents duplicate observers per page lifetime.
  function watchForRerender(targetEl, lessonHtml) {
    if (!window.MutationObserver) return;
    if (window.__mbaObserverAttached) return;
    window.__mbaObserverAttached = true;

    // Attach one level up so we survive targetEl replacement
    var watchRoot = targetEl.closest
      ? (targetEl.closest('.course-item') || targetEl.parentElement || document.body)
      : (targetEl.parentElement || document.body);

    var observer = new MutationObserver(function () {
      // Re-resolve the target in case Squarespace replaced the element
      var fresh = document.querySelector('.course-item__lesson-content') || targetEl;
      if (fresh.dataset.mbaInjected !== String(lessonHtml.length)) {
        console.log('[MBA Rock] observer re-fired — re-injecting');
        injectLesson(fresh, lessonHtml);
      }
    });

    observer.observe(watchRoot, { childList: true, subtree: true, characterData: true });
    console.log('[MBA Rock] MutationObserver attached on', watchRoot.className || watchRoot.tagName);
  }

  // ─── Find lesson by slug ──────────────────────────────────────────────────────
  function findLesson(bundle, slug) {
    var lessons = bundle.lessons;
    var lesson = lessons.find(function (l) { return l.slug === slug; });
    if (lesson) return lesson;

    var idMatch = slug.match(/^(\d)\.?(\d{1,2})\-/) || slug.match(/^(\d)(\d)\-/);
    if (idMatch) {
      var idPart = ('m' + idMatch[1] + 'l' + idMatch[2]).toLowerCase();
      lesson = lessons.find(function (l) { return l.slug.indexOf(idPart + '-') === 0; });
      if (lesson) return lesson;
    }

    lesson = lessons.find(function (l) { return slug.indexOf(l.slug) === 0; });
    if (lesson) return lesson;

    var m = slug.match(/^(m\d+l\d+)/i);
    if (m) {
      var pfx = m[1].toLowerCase();
      lesson = lessons.find(function (l) { return l.slug.indexOf(pfx + '-') === 0; });
      if (lesson) return lesson;
    }

    lesson = lessons.find(function (l) {
      var titleSlug = l.slug.replace(/^m\d+l\d+\-/, '');
      return titleSlug === slug || slug === titleSlug;
    });
    return lesson || null;
  }

  // ─── Run full injection pipeline for current slug ─────────────────────────────
  function runInjection(slug, bundle) {
    var lessonHtml = null;

    if (slug === 'assessments' || slug === 'assessment' || slug === 'all-assessments') {
      lessonHtml = renderAssessments(bundle);
    } else {
      var lesson = findLesson(bundle, slug);
      if (lesson) {
        lessonHtml = renderLesson(lesson, bundle.modules);
      }
    }

    if (!lessonHtml) {
      console.log('[MBA Rock] no lesson matched slug:', slug, '— skipping');
      return;
    }

    console.log('[MBA Rock] matched slug:', slug, '— running injection pipeline');

    function attemptInject() {
      var target = findTarget();
      if (target) {
        injectLesson(target, lessonHtml);
        watchForRerender(target, lessonHtml);
      } else {
        // Target not in DOM yet — insertSmartly as last resort
        if (!document.querySelector('.mr-lesson')) {
          insertSmartly(lessonHtml);
        }
      }
    }

    // Immediate attempt (server-rendered pages)
    attemptInject();

    // 800ms retry (fast Squarespace client-side render)
    setTimeout(attemptInject, 800);

    // 2000ms retry (slow SPA hydration)
    setTimeout(attemptInject, 2000);

    // 3. 5-second final retry — re-resolves target fresh, re-attaches observer
    setTimeout(function () {
      var targetEl = document.querySelector('.course-item__lesson-content');
      if (targetEl && targetEl.dataset.mbaInjected !== String(lessonHtml.length)) {
        console.warn('[MBA Rock] 5s retry firing — initial inject did not stick');
        window.__mbaObserverAttached = false; // allow fresh observer attach
        injectLesson(targetEl, lessonHtml);
        watchForRerender(targetEl, lessonHtml);
      }
    }, 5000);
  }

  // ─── SPA route-change hook ────────────────────────────────────────────────────
  // Squarespace uses pushState navigation between lessons in the same course.
  // Without this, navigating from lesson A → lesson B renders an empty/stale container.
  function hookSPANavigation(bundle) {
    var lastSlug = currentSlug();

    function onRouteChange() {
      setTimeout(function () { // wait one tick for URL to settle
        var newSlug = currentSlug();
        if (newSlug === lastSlug) return;
        console.log('[MBA Rock] route change detected:', lastSlug, '→', newSlug);
        lastSlug = newSlug;
        window.__mbaObserverAttached = false; // reset for new page
        runInjection(newSlug, bundle);
      }, 150);
    }

    var origPush = history.pushState;
    var origReplace = history.replaceState;

    history.pushState = function () {
      origPush.apply(history, arguments);
      onRouteChange();
    };
    history.replaceState = function () {
      origReplace.apply(history, arguments);
      onRouteChange();
    };
    window.addEventListener('popstate', onRouteChange);

    console.log('[MBA Rock] SPA route-change hook installed');
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────────
  function boot() {
    var slug = currentSlug();
    if (!slug) return;

    var fetchUrl = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/lessons.json?v=' + Date.now();
    console.log('[MBA Rock] fetching lessons.json from:', fetchUrl);

    fetch(fetchUrl)
      .then(function (r) {
        console.log('[MBA Rock] lessons.json status:', r.status);
        if (!r.ok) throw new Error('lessons.json ' + r.status);
        return r.json();
      })
      .then(function (bundle) {
        runInjection(slug, bundle);
        hookSPANavigation(bundle);
      })
      .catch(function (err) {
        console.warn('[MBA Rock] boot error:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
