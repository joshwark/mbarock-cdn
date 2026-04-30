/* MBA Rock — Lesson Bundle JS
 * Loaded site-wide via Squarespace Code Injection (Header).
 * Reads URL slug, looks up lesson in lessons.json, injects styled lesson block,
 * and hides the default Squarespace lesson body.
 *
 * Strategy: Run on every Squarespace page; do nothing unless the slug matches
 * a known MBA Rock lesson or the /assessments page.
 */
(function () {
  'use strict';

  // ---- Configuration ----
  // Bundle URL is set by build pipeline. We assume same origin as this script.
  var BUNDLE_BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) {
      return s.src.replace(/lessons\.js.*$/, '');
    }
    // fallback: figure it out from the link tag
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].href.indexOf('lessons.css') !== -1) {
        return links[i].href.replace(/lessons\.css.*$/, '');
      }
    }
    return '';
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
    var p = window.location.pathname;
    // strip leading/trailing slashes
    p = p.replace(/^\/+|\/+$/g, '');
    // Squarespace can nest under /config/pages/... in admin; ignore those
    if (!p) return '';
    return p.toLowerCase();
  }

  // ---- Build lesson HTML ----
  function renderLesson(lesson, modules) {
    var c = lesson.content || {};
    var moduleObj = modules.find(function (m) { return m.id === lesson.module; }) || { title: '', color: '#0B2545' };
    var html = '';

    // Hero
    html += '<header class="mr-hero">';
    html += '<div class="mr-eyebrow" style="background:' + moduleObj.color + '">' + esc(moduleObj.title) + '</div>';
    html += '<h1 class="mr-title">' + esc(lesson.title) + '</h1>';
    if (c.topic) {
      html += '<p class="mr-subtitle">' + esc(c.topic) + '</p>';
    } else if (lesson.song) {
      html += '<p class="mr-subtitle">Featuring "' + esc(lesson.song) + '"</p>';
    }
    html += '</header>';

    // Audio
    if (lesson.song) {
      html += '<div class="mr-audio">';
      html += '<div class="mr-audio-icon">&#9835;</div>';
      html += '<div class="mr-audio-content">';
      html += '<div class="mr-audio-label">Lesson Song</div>';
      html += '<div class="mr-audio-song">' + esc(lesson.song) + '</div>';
      if (lesson.audio_url) {
        html += '<audio controls preload="none" class="mr-audio-player" src="' + esc(lesson.audio_url) + '"></audio>';
      } else {
        html += '<div class="mr-audio-pending">Audio coming soon — check back shortly.</div>';
      }
      html += '</div></div>';
    }

    // Concept card (intro + core)
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
      c.worksheet.forEach(function (item) {
        html += '<li>' + esc(item) + '</li>';
      });
      html += '</ol></section>';
    }

    // Calculator spec
    if (c.calculator_inputs || c.calculator_outputs || lesson.calculator_url) {
      html += '<section class="mr-card">';
      html += '<h2>Calculator</h2>';
      if (c.calculator_inputs) {
        html += '<h3>Inputs</h3><p>' + esc(c.calculator_inputs) + '</p>';
      }
      if (c.calculator_outputs) {
        html += '<h3>Outputs</h3><p>' + esc(c.calculator_outputs) + '</p>';
      }
      if (lesson.calculator_url) {
        html += '<p><a class="mr-btn" href="' + esc(lesson.calculator_url) + '" target="_blank" rel="noopener">Open Calculator</a></p>';
      }
      html += '</section>';
    }

    // Image prompts (only render if user has image generation in mind)
    if (Array.isArray(c.image_prompts) && c.image_prompts.length > 0) {
      html += '<section class="mr-card">';
      html += '<h2>Visual Anchors</h2>';
      html += '<ol class="mr-numbered">';
      c.image_prompts.forEach(function (item) {
        html += '<li>' + esc(item) + '</li>';
      });
      html += '</ol></section>';
    }

    // Embed: project brief, quiz, or test
    if (lesson.embed) {
      var e = lesson.embed;
      html += '<section class="mr-embed">';
      if (e.type === 'project_brief') {
        html += '<h2>' + esc(e.label) + '</h2>';
        html += '<p>Download the full project brief and rubric.</p>';
        html += '<a class="mr-btn" href="' + esc(e.url) + '" target="_blank" rel="noopener">Download Brief</a>';
      } else if (e.type === 'google_form') {
        html += '<h2>' + esc(e.label) + '</h2>';
        html += '<p>Complete this assessment to track your progress.</p>';
        html += '<div class="mr-iframe-wrap"><iframe src="' + esc(e.url) + '" height="900" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe></div>';
      }
      html += '</section>';
    }

    // Footer nav
    html += '<nav class="mr-footer-nav">';
    html += '<a href="/courses">&larr; All Lessons</a>';
    html += '<a href="/assessments">Assessments &rarr;</a>';
    html += '</nav>';

    return html;
  }

  // ---- Render the /assessments index page ----
  function renderAssessments(bundle) {
    var lessons = bundle.lessons;
    var quizzes = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Quiz/.test(l.type); });
    var tests = lessons.filter(function (l) { return l.embed && l.embed.type === 'google_form' && /Unit Test/.test(l.type); });
    var projects = lessons.filter(function (l) { return l.embed && l.embed.type === 'project_brief'; });

    var html = '';
    html += '<header class="mr-hero">';
    html += '<div class="mr-eyebrow">All Assessments</div>';
    html += '<h1 class="mr-title">MBA Rock Assessments</h1>';
    html += '<p class="mr-subtitle">Six quizzes. Six unit tests. Six projects. One capstone.</p>';
    html += '</header>';

    function gridSection(title, items) {
      var s = '<section><h2 style="font-family:var(--mr-serif);color:var(--mr-navy);font-size:28px;margin:8px 0 18px;">' + esc(title) + '</h2>';
      s += '<div class="mr-assess-grid">';
      items.forEach(function (l) {
        s += '<div class="mr-assess-card">';
        s += '<h3>' + esc(l.title.replace(/^Project:\s*/, '').replace(/^Module\s*/, '')) + '</h3>';
        s += '<p>Module ' + l.module + '</p>';
        var label = l.embed.type === 'project_brief' ? 'Download Brief' : 'Open Assessment';
        s += '<a class="mr-btn" href="' + esc(l.embed.url) + '" target="_blank" rel="noopener">' + label + '</a>';
        s += '</div>';
      });
      s += '</div></section>';
      return s;
    }
    if (quizzes.length) html += gridSection('Module Quizzes', quizzes);
    if (tests.length) html += gridSection('Unit Tests', tests);
    if (projects.length) html += gridSection('Project Briefs', projects);
    return html;
  }

  // ---- Inject into the Squarespace page ----
  function injectInto(target, html) {
    // Wrap in our scoped container
    var wrap = document.createElement('div');
    wrap.className = 'mr-lesson';
    wrap.innerHTML = html;
    // Replace the target's contents
    target.innerHTML = '';
    target.appendChild(wrap);
    document.body.classList.add('mr-lesson-active');
  }

  // Find the best content container in the Squarespace page
  function findTarget() {
    // Common Squarespace content containers, in priority order
    var selectors = [
      // Course lesson templates
      '.lesson-content',
      '.course-lesson-content',
      '.sqs-block-content[data-mbarock-target]',
      // 7.1 main content area
      'main#page article',
      'main#page',
      'main[role="main"]',
      // Older fallbacks
      '#content article',
      '#content'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return document.body;
  }

  // ---- Boot ----
  function boot() {
    var slug = currentSlug();
    if (!slug) return;

    fetch(BUNDLE_BASE + 'lessons.json?v=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('lessons.json fetch failed: ' + r.status);
        return r.json();
      })
      .then(function (bundle) {
        var html = null;

        // /assessments page
        if (slug === 'assessments' || slug === 'assessment' || slug === 'all-assessments') {
          html = renderAssessments(bundle);
        } else {
          // Match a lesson by slug. Be flexible — try exact match first, then prefix match.
          var lesson = bundle.lessons.find(function (l) { return l.slug === slug; });
          if (!lesson) {
            // Try slug starts-with: e.g. URL "/m3l9-brand-promise-extra"
            lesson = bundle.lessons.find(function (l) { return slug.indexOf(l.slug) === 0; });
          }
          if (!lesson) {
            // Try id-only matches: "/m3l9", "/m3l9-anything"
            var m = slug.match(/^(m\d+l\d+)/i);
            if (m) {
              var idPart = m[1].toLowerCase();
              lesson = bundle.lessons.find(function (l) { return l.slug.indexOf(idPart + '-') === 0; });
            }
          }
          if (lesson) {
            html = renderLesson(lesson, bundle.modules);
          }
        }

        if (html) {
          var target = findTarget();
          injectInto(target, html);
          // Fix up document title for SEO if we have a lesson
          // (Squarespace also sets title; this is just a nice-to-have)
        }
      })
      .catch(function (err) {
        // Log but don't break the page
        if (window.console) console.warn('[MBA Rock]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
