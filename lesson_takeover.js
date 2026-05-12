// MBA Rock — Lesson Page Takeover v4 (2026-05-12)
// Professional, branded, mobile-responsive lesson page.
// LISTEN. LEARN. LIVE.

(function() {
  if (document.querySelector('[data-mr-dashboard="1"]')) return;
  var path = window.location.pathname || '';
  if (!/\/mba-rock\//.test(path)) return;
  var slugMatch = path.match(/\/mba-rock\/([^/?#]+)/);
  if (!slugMatch || slugMatch[1] === 'curriculum') return;
  var sqSlug = slugMatch[1];

  // ── Squarespace slug → v2 lesson_id map (51 lessons) ──
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
    '66-spreadsheet-north-star':'M9L1'
  };

  var V2_URL = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/lessons.v2.json';

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // Inject brand stylesheet once
  function injectStyles() {
    if (document.getElementById('mr-v4-styles')) return;
    var css = `
    .mr-page{font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:#1a1a1a;line-height:1.55;max-width:1080px;margin:0 auto;padding:0 20px 80px;}
    .mr-page *{box-sizing:border-box;}
    .mr-page h1,.mr-page h2,.mr-page h3{font-family:"Georgia","Times New Roman",serif;letter-spacing:-0.01em;color:#0b1f3a;}
    .mr-crumb{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a8a;margin:24px 0 8px;font-weight:600;}
    .mr-crumb a{color:#8a8a8a;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s;}
    .mr-crumb a:hover{border-color:#8a8a8a;}
    .mr-crumb-sep{margin:0 8px;color:#ccc;}
    .mr-hero{background:linear-gradient(135deg,#0b1f3a 0%,#1a3a6b 100%);color:#fff;border-radius:14px;padding:36px 38px;margin:0 0 28px;position:relative;overflow:hidden;}
    .mr-hero::before{content:"";position:absolute;top:-50%;right:-10%;width:340px;height:340px;background:radial-gradient(circle,rgba(242,107,31,0.25) 0%,transparent 70%);}
    .mr-hero-tag{display:inline-block;background:rgba(242,107,31,0.95);color:#fff;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:5px 12px;border-radius:4px;margin-bottom:14px;position:relative;}
    .mr-hero h1{color:#fff;font-size:36px;margin:0 0 14px;line-height:1.15;position:relative;}
    .mr-hero-meta{display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:rgba(255,255,255,0.78);position:relative;}
    .mr-hero-meta span{display:inline-flex;align-items:center;gap:6px;}
    .mr-hero-meta b{color:#fff;font-weight:600;}
    .mr-card{background:#fff;border:1px solid #e8eaee;border-radius:12px;padding:28px 30px;margin:0 0 18px;box-shadow:0 1px 3px rgba(11,31,58,0.04);}
    .mr-card-h{display:flex;align-items:center;gap:12px;margin:0 0 18px;padding:0 0 14px;border-bottom:1px solid #f0f1f4;}
    .mr-card-h .mr-icon{width:34px;height:34px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;color:#fff;background:#f26b1f;flex-shrink:0;}
    .mr-card-h .mr-icon.mr-i-navy{background:#0b1f3a;}
    .mr-card-h h2{margin:0;font-size:21px;color:#0b1f3a;line-height:1.2;}
    .mr-card-h .mr-kicker{font-size:11px;color:#999;letter-spacing:.1em;text-transform:uppercase;font-weight:600;margin-left:auto;}
    .mr-video-wrap{position:relative;width:100%;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden;background:#000;}
    .mr-video-wrap > iframe,.mr-video-wrap > video{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
    .mr-audio-row{display:flex;gap:14px;align-items:center;background:#faf8f5;border-radius:10px;padding:14px 18px;margin:8px 0 0;}
    .mr-audio-row .mr-audio-label{flex:0 0 auto;font-size:13px;font-weight:600;color:#0b1f3a;min-width:130px;}
    .mr-audio-row .mr-audio-sub{display:block;font-size:11px;color:#888;font-weight:400;margin-top:1px;letter-spacing:.02em;}
    .mr-audio-row audio{flex:1;min-width:0;height:38px;}
    .mr-concepts{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
    .mr-concept{background:#faf8f5;border-left:3px solid #f26b1f;padding:14px 16px;border-radius:6px;font-size:15px;color:#0b1f3a;font-weight:500;line-height:1.4;transition:transform .15s,box-shadow .15s;}
    .mr-concept:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(11,31,58,0.06);}
    .mr-actions{list-style:none;padding:0;margin:0;counter-reset:mr-step;}
    .mr-actions li{counter-increment:mr-step;display:grid;grid-template-columns:36px 1fr auto;gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid #f0f1f4;font-size:15.5px;line-height:1.55;color:#1a1a1a;}
    .mr-actions li:last-child{border-bottom:0;}
    .mr-actions li::before{content:counter(mr-step);grid-column:1;background:#0b1f3a;color:#fff;width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;font-family:-apple-system,sans-serif;}
    .mr-check{grid-column:3;cursor:pointer;width:24px;height:24px;border:2px solid #d4d4d4;border-radius:5px;background:#fff;transition:all .15s;display:flex;align-items:center;justify-content:center;}
    .mr-check.done{background:#f26b1f;border-color:#f26b1f;color:#fff;}
    .mr-check.done::after{content:"✓";font-weight:700;font-size:14px;}
    .mr-cta-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:28px 0 0;padding:24px 0 0;border-top:1px solid #f0f1f4;}
    .mr-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;font-size:15px;font-weight:600;border-radius:8px;cursor:pointer;border:0;transition:all .15s;text-decoration:none;font-family:inherit;}
    .mr-btn-primary{background:#f26b1f;color:#fff;}
    .mr-btn-primary:hover{background:#d75a13;transform:translateY(-1px);box-shadow:0 6px 16px rgba(242,107,31,0.3);}
    .mr-btn-ghost{background:transparent;color:#0b1f3a;border:1.5px solid #d4d4d4;}
    .mr-btn-ghost:hover{border-color:#0b1f3a;background:#faf8f5;}
    .mr-resources{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:10px;}
    .mr-resource{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#faf8f5;border-radius:8px;font-size:13.5px;color:#0b1f3a;text-decoration:none;border:1px solid transparent;transition:border-color .15s,background .15s;}
    .mr-resource:hover{border-color:#f26b1f;background:#fff;}
    .mr-resource-i{width:28px;height:28px;background:#0b1f3a;color:#fff;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
    .mr-empty{color:#aaa;font-style:italic;font-size:14px;margin:0;}
    .mr-progress-chip{position:fixed;bottom:24px;right:24px;background:#0b1f3a;color:#fff;padding:12px 20px;border-radius:50px;box-shadow:0 8px 24px rgba(11,31,58,0.2);font-size:13px;font-weight:600;cursor:pointer;z-index:9999;display:flex;align-items:center;gap:10px;transition:all .15s;}
    .mr-progress-chip:hover{background:#f26b1f;transform:translateY(-2px);}
    .mr-progress-chip.done{background:#1d8444;}
    @media(max-width:680px){
      .mr-page{padding:0 14px 80px;}
      .mr-hero{padding:26px 22px;border-radius:10px;}
      .mr-hero h1{font-size:26px;}
      .mr-card{padding:22px 20px;border-radius:10px;}
      .mr-card-h h2{font-size:18px;}
      .mr-audio-row{flex-direction:column;align-items:stretch;gap:10px;}
      .mr-audio-row .mr-audio-label{min-width:auto;}
      .mr-concepts{grid-template-columns:1fr 1fr;gap:8px;}
      .mr-concept{padding:11px 12px;font-size:13.5px;}
      .mr-actions li{grid-template-columns:30px 1fr 28px;gap:10px;font-size:14.5px;}
      .mr-actions li::before{width:26px;height:26px;font-size:12px;}
      .mr-progress-chip{bottom:16px;right:16px;padding:10px 16px;font-size:12px;}
    }`;
    var style = document.createElement('style');
    style.id = 'mr-v4-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Section finders (reuse v3 logic) ──
  function findLessonBodySections() {
    var hits = new Set();
    var needles = /^(listen|watch|core concepts|take action|the idea|see|do|calculate|lyrics)\b/i;
    document.querySelectorAll('h1, h2, h3').forEach(function(h) {
      var t = (h.textContent || '').trim();
      if (needles.test(t)) {
        var s = h.closest('section[data-section-id]') || h.closest('section') || h.closest('[data-section-id]');
        if (s) hits.add(s);
      }
    });
    return Array.from(hits);
  }
  function findExtraLessonSections() {
    var hits = [];
    document.querySelectorAll('section[data-section-id]').forEach(function(s) {
      var txt = (s.textContent || '').toLowerCase();
      var hasLessonContent = /(listen|watch|core concepts|take action|calculate|complete & continue)/.test(txt);
      var isHero = s.querySelector('h1') && s.querySelector('img');
      if (hasLessonContent && !isHero) hits.push(s);
    });
    return hits;
  }

  // ── Render helpers ──
  function videoEmbed(videoUrl, videoId) {
    if (videoId) {
      return '<div class="mr-video-wrap"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + esc(videoId) + '?rel=0&modestbranding=1&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Lesson video"></iframe></div>';
    }
    if (videoUrl) {
      return '<div class="mr-video-wrap"><video controls preload="metadata"><source src="' + esc(videoUrl) + '" type="video/mp4"></video></div>';
    }
    return '<p class="mr-empty">Lesson video coming soon. Listen to the audio overview below in the meantime.</p>';
  }

  function audioPlayer(url, type) {
    if (!url) return '';
    var mime = type === 'song' ? 'audio/mpeg' : 'audio/mp4';
    return '<audio controls preload="none"><source src="' + esc(url) + '" type="' + mime + '"></audio>';
  }

  function buildConcepts(arr) {
    if (!arr || !arr.length) return '<p class="mr-empty">Core concepts pending.</p>';
    return '<div class="mr-concepts">' +
      arr.map(function(c){ return '<div class="mr-concept">' + esc(c) + '</div>'; }).join('') +
      '</div>';
  }

  function buildActions(arr) {
    if (!arr || !arr.length) return '<p class="mr-empty">Action steps pending.</p>';
    return '<ol class="mr-actions">' +
      arr.map(function(a, i){
        return '<li><span></span><span>' + esc(a) + '</span><button class="mr-check" data-action-idx="' + i + '" aria-label="Mark complete"></button></li>';
      }).join('') +
      '</ol>';
  }

  function buildResources(lesson, mod) {
    var items = [];
    if (lesson.worksheet_url)        items.push({ icon:'📋', label:'Worksheet',         url: lesson.worksheet_url });
    if (lesson.lyrics_url)           items.push({ icon:'♪',  label:'Lyrics',            url: lesson.lyrics_url });
    if (mod && mod.study_guide_url)  items.push({ icon:'📖', label:'Module study guide', url: mod.study_guide_url });
    if (mod && mod.infographic_url)  items.push({ icon:'🖼', label:'Module infographic', url: mod.infographic_url });
    if (mod && mod.presenter_deck_url) items.push({ icon:'🎴', label:'Presenter deck',  url: mod.presenter_deck_url });
    if (mod && mod.flashcards_app_embed) items.push({ icon:'🔁', label:'Flashcards',     url: mod.flashcards_app_embed });
    if (!items.length) return '';
    return '<div class="mr-card">' +
      '<div class="mr-card-h"><span class="mr-icon mr-i-navy">📎</span><h2>Resources</h2></div>' +
      '<div class="mr-resources">' +
        items.map(function(i){
          return '<a class="mr-resource" href="' + esc(i.url) + '" target="_blank" rel="noopener"><span class="mr-resource-i">' + i.icon + '</span><span>' + esc(i.label) + '</span></a>';
        }).join('') +
      '</div></div>';
  }

  function nextLesson(v2, current) {
    // Find the next lesson by sort order (module, lesson_number)
    var sorted = v2.lessons.slice().sort(function(a,b){
      var ai = String(a.id), bi = String(b.id);
      return ai.localeCompare(bi, undefined, {numeric:true, sensitivity:'base'});
    });
    var idx = sorted.findIndex(function(l){ return l.id === current.id; });
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  }

  function lessonHref(v2, lesson) {
    // Reverse-lookup in SLUG_TO_V2 — first slug pointing to this lesson_id
    var slug = Object.keys(SLUG_TO_V2).find(function(k){ return SLUG_TO_V2[k] === lesson.id; });
    return slug ? '/mba-rock/' + slug : null;
  }

  function moduleProgressLabel(v2, lesson) {
    var mod = v2.modules.find(function(m){ return m.id === lesson.module_id; });
    var lessons = v2.lessons.filter(function(l){ return l.module_id === lesson.module_id; })
      .sort(function(a,b){ return a.id.localeCompare(b.id, undefined, {numeric:true}); });
    var pos = lessons.findIndex(function(l){ return l.id === lesson.id; }) + 1;
    return { moduleTitle: mod ? mod.title : lesson.module_id, position: pos, total: lessons.length, mod: mod };
  }

  function renderPage(lesson, v2) {
    var prog = moduleProgressLabel(v2, lesson);
    var mod = prog.mod;
    var next = nextLesson(v2, lesson);
    var nextHref = next ? lessonHref(v2, next) : null;

    var html = '';
    html += '<div class="mr-page">';

    // Crumb
    html += '<div class="mr-crumb"><a href="/mba-rock">MBA Rock</a><span class="mr-crumb-sep">/</span><span>' + esc(prog.moduleTitle) + '</span><span class="mr-crumb-sep">/</span><span>Lesson ' + prog.position + ' of ' + prog.total + '</span></div>';

    // Hero
    html += '<div class="mr-hero">';
    html += '<span class="mr-hero-tag">' + esc(lesson.module_id) + ' · Lesson ' + prog.position + ' / ' + prog.total + '</span>';
    html += '<h1>' + esc(lesson.title) + '</h1>';
    html += '<div class="mr-hero-meta">';
    if (lesson.video_url || lesson.video_id) html += '<span><b>▷</b> Video</span>';
    if (lesson.audio_overview_url)            html += '<span><b>🎧</b> Audio overview</span>';
    if (lesson.audio_url)                     html += '<span><b>♪</b> Song</span>';
    if (lesson.core_concepts && lesson.core_concepts.length) html += '<span><b>◆</b> ' + lesson.core_concepts.length + ' core concepts</span>';
    if (lesson.take_action && lesson.take_action.length)     html += '<span><b>✓</b> ' + lesson.take_action.length + ' action steps</span>';
    html += '</div></div>';

    // Watch
    html += '<div class="mr-card">';
    html += '<div class="mr-card-h"><span class="mr-icon">▷</span><h2>Watch the lesson</h2><span class="mr-kicker">Video</span></div>';
    html += videoEmbed(lesson.video_url, lesson.video_id);
    html += '</div>';

    // Listen (audio overview + song stacked)
    if (lesson.audio_overview_url || lesson.audio_url) {
      html += '<div class="mr-card">';
      html += '<div class="mr-card-h"><span class="mr-icon">🎧</span><h2>Listen</h2><span class="mr-kicker">Audio</span></div>';
      if (lesson.audio_overview_url) {
        html += '<div class="mr-audio-row"><div class="mr-audio-label">Audio overview <span class="mr-audio-sub">Concept walkthrough · ~5 min</span></div>' + audioPlayer(lesson.audio_overview_url, 'overview') + '</div>';
      }
      if (lesson.audio_url) {
        html += '<div class="mr-audio-row"><div class="mr-audio-label">Song <span class="mr-audio-sub">Hook the lesson into memory</span></div>' + audioPlayer(lesson.audio_url, 'song') + '</div>';
      }
      html += '</div>';
    }

    // Core concepts
    html += '<div class="mr-card">';
    html += '<div class="mr-card-h"><span class="mr-icon">◆</span><h2>Core concepts</h2><span class="mr-kicker">What to remember</span></div>';
    html += buildConcepts(lesson.core_concepts);
    html += '</div>';

    // Take action
    html += '<div class="mr-card">';
    html += '<div class="mr-card-h"><span class="mr-icon">✓</span><h2>Take action</h2><span class="mr-kicker">This week’s playbook</span></div>';
    html += buildActions(lesson.take_action);

    // CTA row
    html += '<div class="mr-cta-row">';
    html += '<button class="mr-btn mr-btn-primary" data-action="complete">Mark lesson complete</button>';
    if (nextHref) {
      html += '<a class="mr-btn mr-btn-ghost" href="' + esc(nextHref) + '">Next: ' + esc(next.title) + ' →</a>';
    } else {
      html += '<a class="mr-btn mr-btn-ghost" href="/course-dashboard">Back to dashboard</a>';
    }
    html += '</div></div>';

    // Resources card (module-level extras)
    html += buildResources(lesson, mod);

    html += '</div>'; // mr-page

    // Floating progress chip
    html += '<div class="mr-progress-chip" data-chip="1" title="Tap to mark complete"><span>' + esc(lesson.id) + ' · ' + esc(lesson.title.slice(0, 28) + (lesson.title.length > 28 ? '…' : '')) + '</span><span>›</span></div>';

    return html;
  }

  // ── Wire interactions ──
  function wireInteractions(lesson, container) {
    container.addEventListener('click', function(e) {
      var t = e.target;
      // Checkbox per action step (local-only for now)
      if (t.classList && t.classList.contains('mr-check')) {
        t.classList.toggle('done');
      }
      // Mark-complete button OR chip
      if ((t.dataset && t.dataset.action === 'complete') || (t.closest && t.closest('[data-chip="1"]'))) {
        markComplete(lesson, container);
      }
    });
  }

  function markComplete(lesson, container) {
    var btn = container.querySelector('[data-action="complete"]');
    var chip = document.querySelector('[data-chip="1"]');
    if (btn) { btn.textContent = '✓ Marked complete'; btn.disabled = true; btn.style.background = '#1d8444'; }
    if (chip) { chip.classList.add('done'); chip.querySelector('span').textContent = '✓ Complete'; }
    // Hook to Supabase if available
    try {
      if (window.MR_PROGRESS && typeof window.MR_PROGRESS.markComplete === 'function') {
        window.MR_PROGRESS.markComplete(lesson.id);
      } else {
        localStorage.setItem('mr-lesson-complete:' + lesson.id, Date.now().toString());
      }
    } catch (e) { console.warn('progress sync failed', e); }
  }

  function applyV2(lesson, v2) {
    if (!lesson) return false;
    if (document.body && document.body.getAttribute('data-mr-v4-applied') === '1') return true;

    var bodySections = findLessonBodySections().concat(findExtraLessonSections());
    bodySections = Array.from(new Set(bodySections));
    if (bodySections.length === 0) return false;

    bodySections.forEach(function(s) {
      s.style.display = 'none';
      s.setAttribute('data-mrv4-hidden', '1');
    });

    injectStyles();

    var lastHidden = bodySections[bodySections.length - 1];
    var newSection = document.createElement('section');
    newSection.setAttribute('data-mrv4-replacement', '1');
    newSection.style.cssText = 'background:#fafafa;padding:8px 0 48px;';
    newSection.innerHTML = renderPage(lesson, v2);
    lastHidden.parentNode.insertBefore(newSection, lastHidden.nextSibling);

    wireInteractions(lesson, newSection);

    // Restore "complete" state from localStorage
    try {
      if (localStorage.getItem('mr-lesson-complete:' + lesson.id)) {
        markComplete(lesson, newSection);
      }
    } catch (e) {}

    document.body && document.body.setAttribute('data-mr-v4-applied', '1');
    console.log('[MBA v4] hid', bodySections.length, 'old sections; rendered v4 for', lesson.id);
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
    console.log('[MBA v4] slug:', sqSlug, '→', SLUG_TO_V2[sqSlug] || '(unmapped)');
    fetch(V2_URL, { cache: 'no-cache' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(v2) {
        var lesson = findLesson(v2);
        if (!lesson) { console.warn('[MBA v4] no lesson for', sqSlug); return; }

        if (applyV2(lesson, v2)) return;
        var obs = new MutationObserver(function() { if (applyV2(lesson, v2)) obs.disconnect(); });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(function() { applyV2(lesson, v2); }, 1500);
        setTimeout(function() { applyV2(lesson, v2); }, 3000);
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (applyV2(lesson, v2) || attempts > 60) {
            try { obs.disconnect(); } catch (e) {}
            clearInterval(poll);
          }
        }, 500);
      })
      .catch(function(e) { console.error('[MBA v4] fetch failed:', e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
