// MBA Rock — Standalone V3 Lesson Page Takeover
// Loaded directly via Squarespace site header code injection

/* ============================================================
   MBA ROCK — V1 LESSON PAGE → V2 CONTENT TRANSLATOR v3 (2026-05-12)
   AGGRESSIVE: nukes the old Squarespace lesson body entirely,
   replaces with clean v2 lesson render.

   Safety: only operates within the lesson's content sections.
   Preserves Squarespace's course nav, paywall chrome, top header,
   and footer.
   ============================================================ */
(function() {
  if (document.querySelector('[data-mr-dashboard="1"]')) return;

  var path = window.location.pathname || '';
  if (!/\/mba-rock\//.test(path)) return;
  var slugMatch = path.match(/\/mba-rock\/([^/?#]+)/);
  if (!slugMatch || slugMatch[1] === 'curriculum') return;
  var sqSlug = slugMatch[1];

  // ── 51-slug → v2 lesson_id map ──
  var SLUG_TO_V2 = {
    'm1l1-oxygen-cash-flow':'M1L1','m1l2-three-sheets':'M1L5','m1l3-gross-margin-groove':'M1L3',
    'm1l4-burn-rate-blues':'M1L1.7','m1l5-bottom-line':'M1L2','16-cash-runway':'M1L1.5',
    '17-april-cash-timing':'M1L1.7','18-receivables-in':'M1L3.5','19-operating-leverage':'M1L4.5',
    'm2l1-strategy-strut':'M2L1.5','m2l2-moat':'M2L1','m2l3-five-forces':'M2L2','m2l4-swot-vrio':'M2L3',
    'm2l5-differentiate-or-die':'M2L4','26-beneath-the-hood':'M2L2.1.5','27-business-model-canvas':'M2L2.3.5',
    '28-dollar-soldier':'M2L5','m3l1-4-ps':'M7L1','m3l2-stp':'M4L1','m3l3-brand-new':'M4L2',
    'm3l4-persona':'M4L1','m3l5-stake-your-claim':'M4L4','36-market-size-mountain':'M4L4',
    'jl2e2jg4mb73rzl98gfjnsr3khh7jb':'M4L1','pdmtcm5jmwfbb57knnkttmj4jd9dec':'M4L2','39-brand-promise':'M4L2',
    '310-worth-align':'M3L1.5','cx6bkyjrl8t58xte5dcxcfw257mlfa':'M4L3','7wmna3a2b9lgrwlm7zlzzf626kdz2t':'M4L3',
    '313-unit-economics-reggae':'M1L4','m4l1-idea-to-mvp':'M6L1','m4l2-product-market-fit':'M6L6',
    'm4l3-bootstrap-or-burn':'M5L5','m4l4-the-pitch':'M6L3','m4l5-founder-survival':'M6L13',
    '47-negotiation':'M6L4','46-coming-soon':'M6L13','47-productmarket-fit':'M6L6',
    'm5l1-narrative-weight':'M3L1','m5l2-innovation-portfolio':'M3L1.5','m5l3-conflict-cost-estimator':'M3L2.5',
    'm5l4-eq-360-tracker':'M3L5','m5l5-leadership-capstone':'M3L2','56-blank-page-grace':'M3L4',
    '57-resume-clues':'M3L3','m6l1-hire-slow-fire-fast':'M3L3','m6l2-org-chart':'M6L1',
    'm6l3-lead-from-the-front':'M5L1','m6l4-cap-table':'M6L2','m6l5-exit-song':'M6L10',
    '66-spreadsheet-north-star':'M9L1',
  };

  var V2_URL = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/lessons.v2.json';

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // ── Find every <section data-section-id> that contains lesson body content
  //    (anything with LISTEN/WATCH/CORE CONCEPTS/TAKE ACTION/CALCULATE/SEE/DO headings) ──
  function findLessonBodySections() {
    var hits = new Set();
    var needles = /^(listen|watch|core concepts|take action|the idea|see|do|calculate|lyrics)$/i;
    document.querySelectorAll('h1, h2, h3').forEach(function(h) {
      var t = (h.textContent || '').trim();
      if (needles.test(t)) {
        var section = h.closest('section[data-section-id]') || h.closest('section') || h.closest('[data-section-id]');
        if (section) hits.add(section);
      }
    });
    return Array.from(hits);
  }

  // Also: find Fluid Engine block sections that look like lesson body content (heuristic)
  function findExtraLessonSections() {
    var hits = [];
    document.querySelectorAll('section[data-section-id]').forEach(function(s) {
      var txt = (s.textContent || '').toLowerCase();
      // If a section contains any of the heading words AND isn't the hero/footer
      var hasLessonContent = /(listen|watch|core concepts|take action|calculate|complete & continue)/.test(txt);
      var isHero = s.querySelector('h1') && s.querySelector('img');
      if (hasLessonContent && !isHero) hits.push(s);
    });
    return hits;
  }

  function buildAudioOverviewHtml(url) {
    if (!url) return '<p style="color:#888;font-style:italic;margin:0;">Audio overview coming soon.</p>';
    return '<audio controls preload="none" style="width:100%;border-radius:6px;"><source src="' + esc(url) + '" type="audio/mp4"></audio>';
  }
  function buildSongHtml(url) {
    if (!url) return '<p style="color:#888;font-style:italic;margin:0;">Song coming soon.</p>';
    return '<audio controls preload="none" style="width:100%;border-radius:6px;"><source src="' + esc(url) + '" type="audio/mpeg"></audio>';
  }
  function buildVideoHtml(videoUrl, videoId) {
    if (videoId) {
      return '<div style="position:relative;width:100%;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden;background:#000;"><iframe loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" src="https://www.youtube-nocookie.com/embed/' + esc(videoId) + '?rel=0&modestbranding=1&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Lesson video"></iframe></div>';
    }
    if (videoUrl) {
      return '<video controls preload="none" style="width:100%;border-radius:8px;background:#000;display:block;"><source src="' + esc(videoUrl) + '" type="video/mp4"></video>';
    }
    return '<p style="color:#888;font-style:italic;margin:0;">Video coming soon.</p>';
  }
  function buildConceptsHtml(arr) {
    if (!arr || !arr.length) return '<p style="color:#888;font-style:italic;margin:0;">Core concepts pending.</p>';
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">' +
      arr.map(function(c){ return '<div style="padding:14px 16px;background:#f4f6fa;border-radius:8px;font-size:15px;color:#0b2545;font-weight:500;line-height:1.4;">' + esc(c) + '</div>'; }).join('') +
      '</div>';
  }
  function buildActionsHtml(arr) {
    if (!arr || !arr.length) return '<p style="color:#888;font-style:italic;margin:0;">Action steps pending.</p>';
    return '<ol style="padding-left:28px;margin:0;">' +
      arr.map(function(a){ return '<li style="margin:10px 0;font-size:16px;line-height:1.55;color:#1a1a1a;">' + esc(a) + '</li>'; }).join('') +
      '</ol>';
  }

  function renderV2HTML(lesson) {
    return [
      '<div data-mrv2-rendered="1" style="max-width:900px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,\'Helvetica Neue\',sans-serif;color:#1a1a1a;line-height:1.5;">',
        '<div style="background:linear-gradient(90deg,#0b2545,#1a3a6b);color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:28px;">',
          '<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;margin-bottom:4px;">' + esc(lesson.module_id) + '</div>',
          '<div style="font-size:22px;font-weight:700;line-height:1.2;">' + esc(lesson.id) + ' — ' + esc(lesson.title) + '</div>',
        '</div>',
        '<section style="margin:0 0 32px;">',
          '<h2 style="font-size:1.5em;margin:0 0 14px;letter-spacing:-0.01em;">🎧 Audio Overview</h2>',
          buildAudioOverviewHtml(lesson.audio_overview_url),
        '</section>',
        '<section style="margin:0 0 32px;">',
          '<h2 style="font-size:1.5em;margin:0 0 14px;letter-spacing:-0.01em;">♪ Song</h2>',
          buildSongHtml(lesson.audio_url),
        '</section>',
        '<section style="margin:0 0 32px;">',
          '<h2 style="font-size:1.5em;margin:0 0 14px;letter-spacing:-0.01em;">▷ Video</h2>',
          buildVideoHtml(lesson.video_url, lesson.video_id),
        '</section>',
        '<section style="margin:0 0 32px;">',
          '<h2 style="font-size:1.5em;margin:0 0 14px;letter-spacing:-0.01em;">◆ Core Concepts</h2>',
          buildConceptsHtml(lesson.core_concepts),
        '</section>',
        '<section style="margin:0 0 16px;">',
          '<h2 style="font-size:1.5em;margin:0 0 14px;letter-spacing:-0.01em;">✓ Take Action</h2>',
          buildActionsHtml(lesson.take_action),
        '</section>',
      '</div>'
    ].join('');
  }

  function applyV2(lesson) {
    if (!lesson) return false;
    if (document.body && document.body.getAttribute('data-mr-v2-applied') === '1') return true;

    // 1. Find every section that's part of the lesson body
    var bodySections = findLessonBodySections().concat(findExtraLessonSections());
    bodySections = Array.from(new Set(bodySections));

    if (bodySections.length === 0) {
      // Page hasn't rendered the body yet — return false to retry
      return false;
    }

    // 2. Hide them all (use display:none so we don't break Squarespace's internal refs)
    bodySections.forEach(function(s) {
      s.style.display = 'none';
      s.setAttribute('data-mrv2-hidden', '1');
    });

    // 3. Insert one new section right after the last hidden body section
    var lastHidden = bodySections[bodySections.length - 1];
    var newSection = document.createElement('section');
    newSection.setAttribute('data-mrv2-replacement', '1');
    newSection.style.cssText = 'background:#fafafa;padding:24px 0;';
    newSection.innerHTML = renderV2HTML(lesson);
    lastHidden.parentNode.insertBefore(newSection, lastHidden.nextSibling);

    document.body && document.body.setAttribute('data-mr-v2-applied', '1');
    console.log('[MBA v1→v2] hid', bodySections.length, 'old sections; injected v2 for', lesson.id);
    return true;
  }

  function findLesson(v2) {
    if (!v2 || !v2.lessons) return null;
    var targetId = SLUG_TO_V2[sqSlug];
    if (targetId) {
      var hit = v2.lessons.find(function(l) { return l.id === targetId; });
      if (hit) return hit;
    }
    return v2.lessons.find(function(l) { return l.legacy_slug === sqSlug; }) || null;
  }

  function run() {
    console.log('[MBA v1→v2] slug:', sqSlug, '→', SLUG_TO_V2[sqSlug] || '(unmapped)');
    fetch(V2_URL, { cache: 'no-cache' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(v2) {
        var lesson = findLesson(v2);
        if (!lesson) { console.warn('[MBA v1→v2] no v2 lesson for', sqSlug); return; }

        // Try immediately, then via observer + timed retries
        if (applyV2(lesson)) return;
        var obs = new MutationObserver(function() { if (applyV2(lesson)) obs.disconnect(); });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(function() { applyV2(lesson); }, 1500);
        setTimeout(function() { applyV2(lesson); }, 3000);
        // Extended polling for stubborn renders
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (applyV2(lesson) || attempts > 60) {
            try { obs.disconnect(); } catch(e){}
            clearInterval(poll);
          }
        }, 500);
      })
      .catch(function(e) { console.error('[MBA v1→v2] fetch failed:', e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
