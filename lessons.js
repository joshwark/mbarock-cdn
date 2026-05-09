/* MBA Rock — Lesson Bundle JS
 * Loaded site-wide via Squarespace Code Injection (Header).
 * Reads URL slug, looks up lesson in lessons.json, injects styled lesson block.
 *
 * v3 — Robust injection for Squarespace Members Area course lesson pages.
 *   - findTarget() only returns specific course content selectors (not broad main/section)
 *     to avoid wiping Squarespace nav and layout chrome.
 *   - insertSmartly() is the default path: adds after course nav or before footer.
 *   - Boot retries at 800ms and 2000ms to handle Squarespace client-side rendering.
 *   - Dedup guard prevents double-injection on retry.
 */
(function () {
  'use strict';

  // ---- Configuration ----
  var BUNDLE_BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) { return s.src.replace(/lessons\.js.*$/, ''); }
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].href.indexOf('lessons.css') !== -1) {
        return links[i].href.replace(/lessons\.css.*$/, '');
      }
    }
    return 'https://cdn.jsdelivr.net/gh/joshwark/mbarock-cdn@main/';
  })();

  // ---- HTML escape ----
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- URL slug extraction ----
  function currentSlug() {
    var p = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!p) return '';
    if (/^config(\/|$)/.test(p) || /^settings(\/|$)/.test(p)) return '';
    var parts = p.split('/');
    return parts[parts.length - 1].toLowerCase();
  }

  // ---- Build lesson HTML ----
  // NOTE: We do NOT render the lesson title — Squarespace already shows it
  // from the course curriculum template. Rendering it again causes duplicates.
  function renderLesson(lesson, modules) {
    var c = lesson.content || {};
    var moduleObj = modules.find(function (m) { return m.id === lesson.moduleId; }) || { title: '', color: '#0B2545' };
    var html = '';

    // Module label (subtle, not the full title H1)
    html += '<div class="mr-module-label" style="background:' + moduleObj.color + '">' + esc(moduleObj.title) + '</div>';

    // Audio player — primary content
    if (lesson.audio_url) {
      html += '<div class="mr-audio">';
      html += '<div class="mr-audio-icon">&#9835;</div>';
      html += '<div class="mr-audio-content">';
      html += '<div class="mr-audio-label">Lesson Song</div>';
      if (lesson.song_title) {
        html += '<div class="mr-audio-song">' + esc(lesson.song_title) + '</div>';
      }
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

    // Concept card
    if (c.intro || c.core) {
      html += '<section class="mr-card">';
      if (c.intro) {
        html += '<h2>The Idea</h2>';
        html += '<p class="mr-pullquote">' + esc(c.intro) + '</p>';
      }
      if (c.core) {
        html += '<h3>Core Concepts</h3>';
        html += '<p>' + esc(c.core) + '</p>';
      }
      if (c.song_tie_in) {
        html += '<h3>Song Tie-In</h3>';
        html += '<p>' + esc(c.song_tie_in) + '</p>';
      }
      if (c.cta) {
        html += '<h3>Take Action</h3>';
        html += '<p><strong>' + esc(c.cta) + '</strong></p>';
      }
      html += '</section>';
    }

    // Worksheet
    if (Array.isArray(c.worksheet) && c.worksheet.length > 0) {
      html += '<section class="mr-card mr-worksheet">';
      html += '<h2>Worksheet</h2>';
      html += '<ol class="mr-numbered">';
      c.worksheet.forEach(function (item) { html += '<li>' + esc(item) + '</li>'; });
      html += '</ol></section>';
    }

    // Calculator
    if (c.calculator_inputs || c.calculator_outputs || lesson.calculator_url) {
      html += '<section class="mr-card">';
      html += '<h2>Calculator</h2>';
      if (c.calculator_inputs) { html += '<h3>Inputs</h3><p>' + esc(c.calculator_inputs) + '</p>'; }
      if (c.calculator_outputs) { html += '<h3>Outputs</h3><p>' + esc(c.calculator_outputs) + '</p>'; }
      if (lesson.calculator_url) {
        html += '<p><a class="mr-btn" href="' + esc(lesson.calculator_url) + '" target="_blank" rel="noopener">Open Calculator</a></p>';
      }
      html += '</section>';
    }

    // Embed
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

  // ---- Assessments page ----
  function renderAssessments(bundle) {
    var lessons = bundle.lessons;
    var html = '<header class="mr-hero">';
    html += '<div class="mr-eyebrow">All Assessments</div>';
    html += '<h1 class="mr-title">MBA Rock Assessments</h1>';
    html += '</header>';

    var quizzes = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Quiz/.test(l.type); });
    var tests = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Unit Test/.test(l.type); });
    var projects = lessons.filter(function (l) { return l.embed && l.embed.type === 'project_brief'; });

    function gridSection(title, items) {
      var s = '<section><h2>' + esc(title) + '</h2><div class="mr-assess-grid">';
      items.forEach(function (l) {
        s += '<div class="mr-assess-card"><h3>' + esc(l.title) + '</h3>';
        s += '<a class="mr-btn" href="' + esc(l.embed.url) + '" target="_blank" rel="noopener">';
        s += l.embed.type === 'project_brief' ? 'Download Brief' : 'Open Assessment';
        s += '</a></div>';
      });
      s += '</div></section>';
      return s;
    }

    if (quizzes.length) html += gridSection('Module Quizzes', quizzes);
    if (tests.length) html += gridSection('Unit Tests', tests);
    if (projects.length) html += gridSection('Project Briefs', projects);
    return html;
  }

  // ---- Find the best injection target ----
  // Squarespace Members Area course lesson pages use BEM double-underscore classes:
  //   .course-item__lesson-content  ← the lesson body (replaces video placeholder + empty intro)
  //   .course-item__content          ← wider content wrapper (fallback)
  //   .course-item                   ← full lesson container (last resort)
  // We ONLY target specific course containers — never broad page wrappers like
  // main#page, which would wipe Squarespace nav chrome.
  function findTarget() {
    var selectors = [
      // ✅ Primary: Squarespace Members Area course lesson body (BEM double-underscore)
      '.course-item__lesson-content',
      '.course-item__content',
      // Legacy / alternate Squarespace course class patterns
      '.course-item-content',
      '.course-lesson-content',
      '.lesson-content',
      '.lesson__content',
      '[class*="course-item__lesson"]',
      '[class*="course-item__content"]',
      '[class*="course-lesson"]',
      '[class*="members-area"] [class*="content"]',
      // Squarespace 7.1 course player patterns
      '.course-syllabus-player__content',
      '.course-content-wrapper',
      '[data-course-item-content]',
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el !== document.body && el !== document.documentElement) return el;
    }

    // Nothing specific found — insertSmartly() will handle it
    return null;
  }

  // ---- Smart insertion: non-destructive, preserves Squarespace chrome ----
  function insertSmartly(html) {
    var wrap = document.createElement('div');
    wrap.className = 'mr-lesson';
    wrap.innerHTML = html;

    // Strategy 1: insert after the course nav bar (← All Lessons / breadcrumbs)
    var allLinks = document.querySelectorAll('a');
    var courseNavContainer = null;
    for (var i = 0; i < allLinks.length; i++) {
      var txt = (allLinks[i].textContent || '').trim();
      if (txt.indexOf('All Lessons') > -1 || txt.indexOf('all-lessons') > -1 ||
          txt.indexOf('Back to') > -1 || txt.indexOf('Course') > -1) {
        var el = allLinks[i];
        while (el && el !== document.body) {
          // Find a parent that has at least 2 links (nav row) but is not main/body
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

    // Strategy 2: after page header / before the first content section
    var mainEl = document.querySelector('main#page, main[role="main"], main, #page');
    if (mainEl) {
      // Insert as first child of main
      mainEl.insertBefore(wrap, mainEl.firstChild);
      return;
    }

    // Strategy 3: insert before footer
    var footer = document.querySelector('footer, [id*="footer"], [class*="footer"], [data-footer-sections]');
    if (footer && footer.parentElement) {
      footer.parentElement.insertBefore(wrap, footer);
      return;
    }

    // Strategy 4: append to body (last resort)
    document.body.appendChild(wrap);
  }

  // ---- Inject into found target ----
  function injectInto(target, html) {
    var wrap = document.createElement('div');
    wrap.className = 'mr-lesson';
    wrap.innerHTML = html;

    // Clear the target (empty course content area) and inject
    target.innerHTML = '';
    target.appendChild(wrap);
    document.body.classList.add('mr-lesson-active');
  }

  // ---- Lesson slug matching ----
  function findLesson(bundle, slug) {
    var lessons = bundle.lessons;

    // Exact match
    var lesson = lessons.find(function (l) { return l.slug === slug; });
    if (lesson) return lesson;

    // Numeric pattern: e.g. URL "3.9-brand-promise" → match m3l9-brand-promise
    var idMatch = slug.match(/^(\d)\.?(\d{1,2})\-/) || slug.match(/^(\d)(\d)\-/);
    if (idMatch) {
      var idPart = ('m' + idMatch[1] + 'l' + idMatch[2]).toLowerCase();
      lesson = lessons.find(function (l) { return l.slug.indexOf(idPart + '-') === 0; });
      if (lesson) return lesson;
    }

    // Slug starts-with (URL has extra suffix)
    lesson = lessons.find(function (l) { return slug.indexOf(l.slug) === 0; });
    if (lesson) return lesson;

    // mXlY prefix in URL
    var m = slug.match(/^(m\d+l\d+)/i);
    if (m) {
      var pfx = m[1].toLowerCase();
      lesson = lessons.find(function (l) { return l.slug.indexOf(pfx + '-') === 0; });
      if (lesson) return lesson;
    }

    // Title slug fragment (last resort)
    lesson = lessons.find(function (l) {
      var titleSlug = l.slug.replace(/^m\d+l\d+\-/, '');
      return titleSlug === slug || slug === titleSlug;
    });
    return lesson || null;
  }

  // ---- Inject (deduplicated) ----
  function doInject(html) {
    if (document.querySelector('.mr-lesson')) return; // already injected

    var target = findTarget();
    if (target) {
      injectInto(target, html);
    } else {
      insertSmartly(html);
    }
    document.body.classList.add('mr-lesson-active');
  }

  // ---- Boot ----
  // Fetches lessons.json once, then attempts injection immediately, at 800ms, and 2000ms.
  // The retries handle Squarespace SPA pages where course content is rendered client-side
  // after DOMContentLoaded. The dedup guard in doInject() prevents double-injection.
  function boot() {
    var slug = currentSlug();
    if (!slug) return;

    fetch(BUNDLE_BASE + 'lessons.json?v=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('lessons.json ' + r.status);
        return r.json();
      })
      .then(function (bundle) {
        var html = null;

        if (slug === 'assessments' || slug === 'assessment' || slug === 'all-assessments') {
          html = renderAssessments(bundle);
        } else {
          var lesson = findLesson(bundle, slug);
          if (lesson) html = renderLesson(lesson, bundle.modules);
        }

        if (!html) return; // Not an MBA Rock lesson page — do nothing

        // Attempt 1: immediately (catches server-rendered pages)
        doInject(html);

        // Attempt 2: after 800ms (catches fast Squarespace client-side renders)
        setTimeout(function () { doInject(html); }, 800);

        // Attempt 3: after 2000ms (catches slow SPA renders and lazy hydration)
        setTimeout(function () { doInject(html); }, 2000);
      })
      .catch(function (err) {
        if (window.console) console.warn('[MBA Rock]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
