// MBA Rock — Lesson Page Takeover v5 (2026-05-12)
// Premium music school direction. Logo system: hero TL + outro/cert.
// LISTEN. LEARN. LIVE.

(function() {
  if (document.querySelector('[data-mr-dashboard="1"]')) return;
  var path = window.location.pathname || '';
  if (!/\/mba-rock\//.test(path)) return;
  var slugMatch = path.match(/\/mba-rock\/([^/?#]+)/);
  if (!slugMatch || slugMatch[1] === 'curriculum') return;
  var sqSlug = slugMatch[1];

  // VERIFIED slug→lesson mappings. The first 25 are confirmed by walking Squarespace admin.
  // The rest are best-guess overrides based on slug semantics; flag any that show wrong content
  // and we'll lock the mapping. For anything not in this map, fuzzy token-matching kicks in.
  var SLUG_TO_V2 = {
    // Module 1 — Finance
    'm1l1-oxygen-cash-flow':'M1L1','m1l2-three-sheets':'M1L2','m1l3-gross-margin-groove':'M1L3',
    'm1l4-burn-rate-blues':'M1L4','m1l5-bottom-line':'M1L5','16-cash-runway':'M1L1.5',
    '17-april-cash-timing':'M1L1.7','18-receivables-in':'M1L3.5','19-operating-leverage':'M1L4.5',
    '313-unit-economics-reggae':'M1L4',
    // Module 2 — Strategy
    'm2l1-strategy-strut':'M2L5','m2l2-moat':'M2L0.5','m2l3-five-forces':'M2L2',
    'm2l4-swot-vrio':'M2L3','m2l5-differentiate-or-die':'M2L4',
    '26-beneath-the-hood':'M5L4','27-business-model-canvas':'M2L2.3.5','28-dollar-soldier':'M2L1',
    // Module 3 — People & Leadership (mixed: some "m3" slugs are actually Module 4 marketing)
    'm3l1-4-ps':'M7L1','m3l2-stp':'M4L1','m3l3-brand-new':'M4L2','m3l4-persona':'M4L1',
    'm3l5-stake-your-claim':'M4L4','36-market-size-mountain':'M4L4','39-brand-promise':'M4L2',
    '310-worth-align':'M3L1.5',
    // Random-hash Squarespace slugs (auto-generated)
    'jl2e2jg4mb73rzl98gfjnsr3khh7jb':'M4L1','pdmtcm5jmwfbb57knnkttmj4jd9dec':'M4L2',
    'cx6bkyjrl8t58xte5dcxcfw257mlfa':'M4L3','7wmna3a2b9lgrwlm7zlzzf626kdz2t':'M4L3',
    // Module 4 — Marketing / Founder
    'm4l1-idea-to-mvp':'M6L1','m4l2-product-market-fit':'M6L6','m4l3-bootstrap-or-burn':'M5L5',
    'm4l4-the-pitch':'M6L3','m4l5-founder-survival':'M6L13',
    '46-coming-soon':'M6L13','47-negotiation':'M6L4','47-productmarket-fit':'M6L6',
    // Module 5 — Leadership / Ops
    'm5l1-narrative-weight':'M3L2.5','m5l2-innovation-portfolio':'M5L1',
    'm5l3-conflict-cost-estimator':'M3L2.5','m5l4-eq-360-tracker':'M3L5',
    'm5l5-leadership-capstone':'M3L2','56-blank-page-grace':'M3L4','57-resume-clues':'M3L3',
    // Module 6 — Capital / Scaling
    'm6l1-hire-slow-fire-fast':'M3L3','m6l2-org-chart':'M5L3','m6l3-lead-from-the-front':'M3L1',
    'm6l4-cap-table':'M6L2','m6l5-exit-song':'M6L10','66-spreadsheet-north-star':'M9L1'
  };

  // Token stopwords stripped during fuzzy match
  var STOP = {'the':1,'a':1,'an':1,'and':1,'or':1,'to':1,'of':1,'for':1,'in':1,'on':1,'by':1,'is':1,'it':1,'be':1,'as':1,'mba':1,'rock':1,'lesson':1,'l':1,'m':1};

  var V2_URL = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/lessons.v2.json';

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  function injectStyles(brand) {
    if (document.getElementById('mr-v5-styles')) return;
    var c = brand.colors;
    var css = `
    @import url("https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
    .mr5{font-family:"Inter",-apple-system,sans-serif;color:${c.ink};line-height:1.6;max-width:1080px;margin:0 auto;padding:0 24px 120px;letter-spacing:-0.005em;}
    .mr5 *{box-sizing:border-box;}
    .mr5 h1,.mr5 h2,.mr5 h3{font-family:"Fraunces","Tiempos Headline",Georgia,serif;letter-spacing:-0.02em;color:${c.navy};font-weight:600;}
    .mr5 a{color:${c.navy};text-decoration:none;}
    .mr5 ::selection{background:${c.orange_soft};color:${c.navy};}

    /* Slim module crumb (no logo — Squarespace nav has the brand mark) */
    .mr5-crumb-row{display:flex;align-items:center;justify-content:flex-start;padding:32px 0 0;margin-bottom:0;}
    .mr5-crumb{font-family:"Inter",sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#999;font-weight:600;}
    .mr5-crumb a{color:#999;text-decoration:none;transition:color .15s;}
    .mr5-crumb a:hover{color:${c.orange};}
    .mr5-crumb b{color:${c.navy};font-weight:700;}
    .mr5-crumb-sep{margin:0 10px;color:#ccc;}

    /* Hero */
    .mr5-hero{margin:18px 0 44px;padding:0;}
    .mr5-hero-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${c.orange};margin:0 0 22px;}
    .mr5-hero-kicker::before{content:"";width:36px;height:1.5px;background:${c.orange};}
    .mr5-hero h1{font-size:54px;line-height:1.05;margin:0 0 22px;color:${c.navy};font-weight:600;letter-spacing:-0.028em;}
    .mr5-hero-sub{font-family:"Fraunces",serif;font-size:21px;font-weight:400;line-height:1.45;color:#3a3a3a;max-width:780px;margin:0 0 30px;font-style:italic;letter-spacing:-0.005em;}
    .mr5-hero-meta{display:flex;gap:36px;flex-wrap:wrap;padding:18px 0;border-top:1px solid ${c.rule};border-bottom:1px solid ${c.rule};font-size:12px;color:#555;}
    .mr5-hero-meta div{display:flex;flex-direction:column;gap:4px;}
    .mr5-hero-meta .mr5-meta-l{font-size:10.5px;text-transform:uppercase;letter-spacing:.14em;color:#999;font-weight:600;}
    .mr5-hero-meta .mr5-meta-v{font-family:"Fraunces",serif;font-size:18px;color:${c.navy};font-weight:500;}

    /* Section: clean editorial blocks, no white cards */
    .mr5-sec{margin:0 0 60px;position:relative;}
    .mr5-sec-h{display:flex;align-items:baseline;gap:18px;margin:0 0 22px;padding:0 0 14px;border-bottom:1px solid ${c.rule};}
    .mr5-sec-h .mr5-num{font-family:"Fraunces",serif;font-size:36px;color:${c.orange};font-weight:600;line-height:1;letter-spacing:-0.02em;}
    .mr5-sec-h h2{margin:0;font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;flex:1;}
    .mr5-sec-h .mr5-kicker{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#999;font-weight:600;}

    /* Video — clean, no extra chrome */
    .mr5-video{position:relative;width:100%;padding-bottom:56.25%;height:0;border-radius:4px;overflow:hidden;background:#000;box-shadow:0 24px 60px -20px rgba(11,31,58,0.25);}
    .mr5-video > iframe,.mr5-video > video{position:absolute;inset:0;width:100%;height:100%;border:0;}

    /* Audio rows */
    .mr5-audio-row{display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center;padding:22px 0;border-bottom:1px solid ${c.rule};}
    .mr5-audio-row:last-child{border-bottom:0;}
    .mr5-audio-label{font-family:"Fraunces",serif;font-size:18px;font-weight:500;color:${c.navy};line-height:1.25;}
    .mr5-audio-sub{display:block;font-family:"Inter",sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#999;font-weight:600;margin-top:6px;}
    .mr5-audio-row audio{width:100%;height:42px;}

    /* Song lyrics disclosure */
    .mr5-song-block{padding:22px 0;border-bottom:1px solid ${c.rule};}
    .mr5-song-block:last-child{border-bottom:0;}
    .mr5-song-block .mr5-audio-row{padding:0;border-bottom:0;}
    .mr5-lyrics{margin-top:14px;border-top:1px dashed ${c.rule};padding-top:14px;}
    .mr5-lyrics-btn{display:inline-flex;align-items:center;gap:10px;background:transparent;border:0;padding:6px 0;cursor:pointer;font-family:"Inter",sans-serif;font-size:11.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${c.navy};transition:color .15s;}
    .mr5-lyrics-btn:hover{color:${c.orange};}
    .mr5-lyrics-btn .mr5-chev{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;transition:transform .25s ease;color:${c.orange};font-size:10px;}
    .mr5-lyrics-btn[aria-expanded="true"] .mr5-chev{transform:rotate(180deg);}
    .mr5-lyrics-panel{max-height:0;overflow:hidden;transition:max-height .35s ease, opacity .25s ease, margin .25s;opacity:0;margin-top:0;}
    .mr5-lyrics-panel.open{max-height:4000px;opacity:1;margin-top:16px;}
    .mr5-lyrics-body{background:${c.cream};border-left:3px solid ${c.orange};padding:24px 28px;border-radius:0 4px 4px 0;font-family:"Fraunces",serif;font-size:16px;line-height:1.85;color:${c.ink};letter-spacing:-0.005em;white-space:pre-wrap;word-break:break-word;}
    .mr5-lyrics-body em{font-style:italic;color:#555;}
    .mr5-lyrics-body .mr5-stanza-break{display:block;height:14px;}
    .mr5-lyrics-meta{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-family:"Inter",sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#999;font-weight:600;}
    .mr5-lyrics-meta a{color:${c.navy};text-decoration:none;border-bottom:1px solid ${c.rule};padding-bottom:1px;}
    .mr5-lyrics-meta a:hover{border-color:${c.orange};color:${c.orange};}
    .mr5-lyrics-empty{font-family:"Fraunces",serif;font-style:italic;color:#999;font-size:15px;padding:18px 22px;background:${c.cream};border-radius:4px;margin:0;}
    .mr5-lyrics-loading{font-family:"Inter",sans-serif;font-size:13px;color:#999;padding:18px 22px;}

    /* Concepts — strict 2-col grid, every row aligned */
    .mr5-concepts{display:grid;grid-template-columns:1fr 1fr;column-gap:32px;border-top:1px solid ${c.rule};}
    .mr5-concept{display:grid;grid-template-columns:32px 1fr;column-gap:14px;align-items:start;padding:22px 0;border-bottom:1px solid ${c.rule};}
    .mr5-concept-n{font-family:"Fraunces",serif;font-size:13px;color:${c.orange};font-weight:700;letter-spacing:.08em;line-height:1.6;padding-top:2px;}
    .mr5-concept-body{font-family:"Fraunces",serif;font-size:18px;line-height:1.45;color:${c.navy};font-weight:500;letter-spacing:-0.005em;}

    /* Actions — strict 3-column grid, every cell explicitly placed */
    .mr5-actions{counter-reset:mr-step;margin:0;padding:0;list-style:none;}
    .mr5-actions li{counter-increment:mr-step;display:grid;grid-template-columns:54px 1fr 32px;column-gap:22px;align-items:start;padding:22px 0;border-bottom:1px solid ${c.rule};}
    .mr5-actions li:last-child{border-bottom:0;}
    .mr5-actions li::before{content:counter(mr-step,decimal-leading-zero);grid-column:1;grid-row:1;font-family:"Fraunces",serif;font-size:26px;color:${c.orange};font-weight:600;line-height:1.15;letter-spacing:-0.02em;text-align:left;}
    .mr5-action-text{grid-column:2;grid-row:1;font-family:"Inter",sans-serif;font-size:16.5px;line-height:1.6;color:${c.ink};padding-top:2px;}
    .mr5-check{grid-column:3;grid-row:1;cursor:pointer;width:26px;height:26px;border:1.5px solid ${c.rule};border-radius:50%;background:transparent;transition:all .15s;display:flex;align-items:center;justify-content:center;padding:0;margin-top:4px;justify-self:end;}
    .mr5-check:hover{border-color:${c.orange};}
    .mr5-check.done{background:${c.orange};border-color:${c.orange};color:#fff;}
    .mr5-check.done::after{content:"✓";font-weight:700;font-size:14px;font-family:"Inter",sans-serif;}

    /* CTA */
    .mr5-cta{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:40px 0 0;padding:32px 0 0;border-top:2px solid ${c.navy};}
    .mr5-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 28px;font-family:"Inter",sans-serif;font-size:14px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;border-radius:4px;cursor:pointer;border:0;transition:all .15s;text-decoration:none;}
    .mr5-btn-primary{background:${c.navy};color:#fff;}
    .mr5-btn-primary:hover{background:${c.orange};transform:translateY(-1px);}
    .mr5-btn-primary:disabled{background:#1d8444;cursor:default;transform:none;}
    .mr5-btn-ghost{background:transparent;color:${c.navy};border:1.5px solid ${c.navy};}
    .mr5-btn-ghost:hover{background:${c.navy};color:#fff;}

    /* Resources */
    .mr5-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}
    .mr5-res a{display:flex;align-items:center;gap:14px;padding:18px 20px;border:1px solid ${c.rule};border-radius:4px;background:#fff;transition:all .15s;}
    .mr5-res a:hover{border-color:${c.navy};box-shadow:0 8px 24px -8px rgba(11,31,58,0.12);transform:translateY(-1px);}
    .mr5-res-i{width:36px;height:36px;background:${c.cream};color:${c.navy};border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
    .mr5-res-l{font-family:"Fraunces",serif;font-size:15px;font-weight:500;color:${c.navy};line-height:1.3;}
    .mr5-res-l small{display:block;font-family:"Inter",sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#999;font-weight:600;margin-top:3px;}

    /* Certificate / completion outro */
    .mr5-cert{margin:60px 0 0;padding:56px 40px;background:#000;border-radius:6px;color:#fff;text-align:center;position:relative;overflow:hidden;}
    .mr5-cert::before,.mr5-cert::after{content:"";position:absolute;left:0;right:0;height:6px;background:${c.orange};}
    .mr5-cert::before{top:0;}
    .mr5-cert::after{bottom:0;}
    .mr5-cert img{width:140px;height:auto;margin:0 auto 24px;display:block;}
    .mr5-cert-h{font-family:"Fraunces",serif;font-size:14px;letter-spacing:.32em;text-transform:uppercase;color:${c.orange};font-weight:600;margin:0 0 14px;}
    .mr5-cert h3{font-family:"Fraunces",serif;font-size:32px;color:#fff;margin:0 0 14px;font-weight:600;letter-spacing:-0.02em;}
    .mr5-cert p{font-size:14px;color:rgba(255,255,255,0.7);margin:0 auto;max-width:540px;line-height:1.6;}
    .mr5-cert.done{background:#0c2418;}
    .mr5-cert.done .mr5-cert-h{color:#5fd07f;}

    /* Empty states */
    .mr5-empty{font-family:"Fraunces",serif;font-style:italic;color:#999;font-size:16px;margin:0;}

    /* Floating progress chip */
    .mr5-chip{position:fixed;bottom:24px;right:24px;background:${c.navy};color:#fff;padding:14px 20px;border-radius:50px;box-shadow:0 12px 32px -8px rgba(11,31,58,0.4);font-family:"Inter",sans-serif;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;z-index:9999;display:flex;align-items:center;gap:10px;transition:all .2s;border:0;}
    .mr5-chip:hover{background:${c.orange};transform:translateY(-2px);}
    .mr5-chip.done{background:#1d8444;}
    .mr5-chip img{width:22px;height:22px;border-radius:4px;background:#000;padding:1px;}

    @media(max-width:780px){
      .mr5{padding:0 18px 100px;}
      .mr5-crumb-row{padding:18px 0 0;}
      .mr5-crumb{font-size:10px;letter-spacing:.16em;}
      .mr5-crumb-sep{margin:0 6px;}
      .mr5-hero h1{font-size:34px;line-height:1.08;}
      .mr5-hero-sub{font-size:17px;}
      .mr5-hero-meta{gap:22px;}
      .mr5-sec-h .mr5-num{font-size:26px;}
      .mr5-sec-h h2{font-size:22px;}
      .mr5-audio-row{grid-template-columns:1fr;gap:10px;}
      .mr5-concepts{grid-template-columns:1fr;}
      .mr5-concept{padding:18px 0!important;border-right:0!important;}
      .mr5-actions li{grid-template-columns:36px 1fr 26px;column-gap:14px;}
      .mr5-actions li::before{font-size:20px;}
      .mr5-action-text{font-size:14.5px;}
      .mr5-check{width:22px;height:22px;}
      .mr5-btn{padding:14px 22px;font-size:12.5px;}
      .mr5-cert{padding:40px 24px;}
      .mr5-cert h3{font-size:24px;}
      .mr5-chip{bottom:18px;right:18px;padding:10px 14px;font-size:11px;}
    }`;
    var s = document.createElement('style');
    s.id = 'mr-v5-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

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

  function videoEmbed(videoUrl, videoId) {
    if (videoId) return '<div class="mr5-video"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + esc(videoId) + '?rel=0&modestbranding=1&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Lesson video"></iframe></div>';
    if (videoUrl) return '<div class="mr5-video"><video controls preload="metadata"><source src="' + esc(videoUrl) + '" type="video/mp4"></video></div>';
    return '<p class="mr5-empty">Lesson video coming soon. The audio overview below has the full concept walkthrough.</p>';
  }
  function audioPlayer(url, mime) {
    return url ? '<audio controls preload="none"><source src="' + esc(url) + '" type="' + mime + '"></audio>' : '';
  }
  function buildConcepts(arr) {
    if (!arr || !arr.length) return '<p class="mr5-empty">Core concepts pending.</p>';
    return '<div class="mr5-concepts">' + arr.map(function(c, i){
      return '<div class="mr5-concept"><span class="mr5-concept-n">0' + (i+1) + '</span><span class="mr5-concept-body">' + esc(c) + '</span></div>';
    }).join('') + '</div>';
  }
  function buildActions(arr) {
    if (!arr || !arr.length) return '<p class="mr5-empty">Action steps pending.</p>';
    return '<ol class="mr5-actions">' + arr.map(function(a, i){
      return '<li><span class="mr5-action-text">' + esc(a) + '</span><button class="mr5-check" data-action-idx="' + i + '" aria-label="Mark step complete"></button></li>';
    }).join('') + '</ol>';
  }
  function buildResources(lesson, mod) {
    var items = [];
    if (lesson.worksheet_url)            items.push({ icon:'◗', label:'Lesson worksheet', sub:'Download', url: lesson.worksheet_url });
    if (lesson.lyrics_url)               items.push({ icon:'♬', label:'Lyrics sheet',     sub:'Print-ready', url: lesson.lyrics_url });
    if (mod && mod.study_guide_url)      items.push({ icon:'☷', label:'Module study guide', sub:'Full module', url: mod.study_guide_url });
    if (mod && mod.infographic_url)      items.push({ icon:'◈', label:'Module infographic', sub:'Reference card', url: mod.infographic_url });
    if (mod && mod.presenter_deck_url)   items.push({ icon:'▤', label:'Presenter deck',  sub:'Slides', url: mod.presenter_deck_url });
    if (mod && mod.flashcards_app_embed) items.push({ icon:'↻', label:'Flashcards',     sub:'Practice', url: mod.flashcards_app_embed });
    if (!items.length) return '';
    return '<div class="mr5-sec">' +
      '<div class="mr5-sec-h"><span class="mr5-num">⌗</span><h2>Companion materials</h2><span class="mr5-kicker">Resources</span></div>' +
      '<div class="mr5-res">' +
        items.map(function(i){
          return '<a href="' + esc(i.url) + '" target="_blank" rel="noopener"><span class="mr5-res-i">' + i.icon + '</span><span class="mr5-res-l">' + esc(i.label) + '<small>' + esc(i.sub) + '</small></span></a>';
        }).join('') +
      '</div></div>';
  }

  function nextLesson(v2, current) {
    var sorted = v2.lessons.slice().sort(function(a,b){
      return String(a.id).localeCompare(String(b.id), undefined, {numeric:true, sensitivity:'base'});
    });
    var idx = sorted.findIndex(function(l){ return l.id === current.id; });
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  }
  function lessonHref(lesson) {
    var slug = Object.keys(SLUG_TO_V2).find(function(k){ return SLUG_TO_V2[k] === lesson.id; });
    return slug ? '/mba-rock/' + slug : null;
  }
  // Squarespace module totals (the lesson counts you see in the sidebar)
  var SQ_MODULE_SIZE = { M1:9, M2:8, M3:13, M4:7, M5:7, M6:6, M7:0, M8:0, M9:0, M10:0 };

  // Derive Squarespace position from the URL slug.
  //   "m1l3-gross-margin-groove"     → 3
  //   "16-cash-runway"               → 6   (lesson 1.6)
  //   "310-worth-align"              → 10  (lesson 3.10)
  //   "313-unit-economics-reggae"    → 13  (lesson 3.13)
  //   random-hash slugs              → null (fall back to v2 sort order)
  function squarespacePositionFromSlug(slug, moduleId) {
    var m = slug.match(/^m(\d+)l(\d+(?:\.\d+)?)/i);
    if (m) return parseFloat(m[2]);
    m = slug.match(/^(\d+)-/);
    if (m) {
      var n = m[1];
      // First digit = module, rest = lesson position (e.g. "310" = 3.10)
      if (n.length >= 2) return parseInt(n.substring(1), 10);
    }
    return null;
  }

  function moduleProgressLabel(v2, lesson) {
    var mod = v2.modules.find(function(m){ return m.id === lesson.module_id; });
    var sqTotal = SQ_MODULE_SIZE[lesson.module_id];
    var sqPos = squarespacePositionFromSlug(sqSlug, lesson.module_id);
    if (sqPos != null && sqTotal) {
      // Use Squarespace's numbering — what the sidebar shows
      return { moduleTitle: mod ? mod.title : lesson.module_id, position: sqPos, total: sqTotal, mod: mod };
    }
    // Fallback: v2 sort order
    var lessons = v2.lessons.filter(function(l){ return l.module_id === lesson.module_id; })
      .sort(function(a,b){ return String(a.id).localeCompare(String(b.id), undefined, {numeric:true}); });
    var pos = lessons.findIndex(function(l){ return l.id === lesson.id; }) + 1;
    return { moduleTitle: mod ? mod.title : lesson.module_id, position: pos, total: lessons.length, mod: mod };
  }

  function renderPage(lesson, v2) {
    var brand = (v2.global && v2.global.brand) || {};
    var prog = moduleProgressLabel(v2, lesson);
    var mod = prog.mod;
    var next = nextLesson(v2, lesson);
    var nextHref = next ? lessonHref(next) : null;
    var logoUrl = brand.logo_url || '';

    var n = 1;
    function num() { return String(n++).padStart(2, '0'); }

    var html = '<div class="mr5">';

    // Slim module crumb — no logo (Squarespace's site nav already has the brand)
    html += '<div class="mr5-crumb-row"><span class="mr5-crumb"><a href="/course-dashboard">' + esc(brand.name || 'MBA Rock') + '</a><span class="mr5-crumb-sep">/</span>' + esc(prog.moduleTitle) + '<span class="mr5-crumb-sep">/</span><b>Lesson ' + prog.position + ' of ' + prog.total + '</b></span></div>';

    // Hero (editorial, no card)
    html += '<div class="mr5-hero">';
    html += '<div class="mr5-hero-kicker">' + esc(lesson.module_id) + ' &nbsp; The ' + esc((mod && mod.title || '').replace(/^Module \d+:\s*/, '')) + ' module</div>';
    html += '<h1>' + esc(lesson.title) + '</h1>';
    // Diagnostic caption (visible) — proves which v2 lesson matched + how
    if (lesson._matchSource) {
      var srcLabel = { 'verified-map':'verified', 'legacy-slug':'slug', 'slug-v2':'slug', 'fuzzy':'fuzzy-matched' }[lesson._matchSource] || lesson._matchSource;
      html += '<div style="font-family:Inter,sans-serif;font-size:11px;color:#999;letter-spacing:.1em;text-transform:uppercase;margin:0 0 18px;font-weight:600;">URL <code style="background:#f5f1ea;padding:2px 8px;border-radius:3px;color:#0b1f3a;letter-spacing:0;text-transform:none;font-family:ui-monospace,monospace;">' + esc(sqSlug) + '</code> &nbsp;→&nbsp; ' + esc(lesson.id) + ' &nbsp;·&nbsp; ' + srcLabel + '</div>';
    }
    var subtitle = (mod && mod.audio_overview_title) || (lesson.audio_overview_script ? lesson.audio_overview_script.split('\n')[0] : '');
    if (subtitle) html += '<p class="mr5-hero-sub">' + esc(subtitle) + '</p>';
    html += '<div class="mr5-hero-meta">';
    html += '<div><span class="mr5-meta-l">Lesson</span><span class="mr5-meta-v">' + prog.position + ' of ' + prog.total + '</span></div>';
    if (lesson.video_url || lesson.video_id) html += '<div><span class="mr5-meta-l">Video</span><span class="mr5-meta-v">Included</span></div>';
    if (lesson.audio_overview_url)            html += '<div><span class="mr5-meta-l">Audio overview</span><span class="mr5-meta-v">~5 min</span></div>';
    if (lesson.audio_url)                     html += '<div><span class="mr5-meta-l">Song</span><span class="mr5-meta-v">Original track</span></div>';
    if (lesson.core_concepts && lesson.core_concepts.length) html += '<div><span class="mr5-meta-l">Concepts</span><span class="mr5-meta-v">' + lesson.core_concepts.length + '</span></div>';
    if (lesson.take_action && lesson.take_action.length)     html += '<div><span class="mr5-meta-l">Action steps</span><span class="mr5-meta-v">' + lesson.take_action.length + '</span></div>';
    html += '</div></div>';

    // 01 Watch
    html += '<div class="mr5-sec"><div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Watch the lesson</h2><span class="mr5-kicker">Video</span></div>' + videoEmbed(lesson.video_url, lesson.video_id) + '</div>';

    // 02 Listen
    if (lesson.audio_overview_url || lesson.audio_url) {
      html += '<div class="mr5-sec"><div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Listen</h2><span class="mr5-kicker">Audio</span></div>';
      if (lesson.audio_overview_url) {
        html += '<div class="mr5-audio-row"><div><div class="mr5-audio-label">Audio overview</div><span class="mr5-audio-sub">Concept walkthrough</span></div>' + audioPlayer(lesson.audio_overview_url, 'audio/mp4') + '</div>';
      }
      if (lesson.audio_url) {
        html += '<div class="mr5-song-block">';
        html += '<div class="mr5-audio-row"><div><div class="mr5-audio-label">The song</div><span class="mr5-audio-sub">Original track · mnemonic</span></div>' + audioPlayer(lesson.audio_url, 'audio/mpeg') + '</div>';
        html += '<div class="mr5-lyrics">';
        html += '<button class="mr5-lyrics-btn" data-lyrics-toggle="1" aria-expanded="false" aria-controls="mr5-lyrics-panel"><span>View lyrics</span><span class="mr5-chev">▾</span></button>';
        html += '<div class="mr5-lyrics-panel" id="mr5-lyrics-panel" data-lyrics-panel="1"></div>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    // 03 Core concepts
    html += '<div class="mr5-sec"><div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Core concepts</h2><span class="mr5-kicker">What to remember</span></div>' + buildConcepts(lesson.core_concepts) + '</div>';

    // 04 Take action
    html += '<div class="mr5-sec"><div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Take action</h2><span class="mr5-kicker">This week’s playbook</span></div>' + buildActions(lesson.take_action);
    html += '<div class="mr5-cta">';
    html += '<button class="mr5-btn mr5-btn-primary" data-action="complete">Mark lesson complete</button>';
    if (nextHref) html += '<a class="mr5-btn mr5-btn-ghost" href="' + esc(nextHref) + '">Next lesson →</a>';
    else          html += '<a class="mr5-btn mr5-btn-ghost" href="/course-dashboard">Back to dashboard</a>';
    html += '</div></div>';

    // Resources
    html += buildResources(lesson, mod);

    // Certificate / outro
    html += '<div class="mr5-cert" data-cert="1">';
    if (logoUrl) html += '<img src="' + esc(logoUrl) + '" alt="MBA Rock">';
    html += '<div class="mr5-cert-h">Lesson ' + prog.position + ' of ' + prog.total + ' · ' + esc(lesson.module_id) + '</div>';
    html += '<h3 data-cert-title="1">When you’re done</h3>';
    html += '<p data-cert-body="1">Mark this lesson complete to lock in the playbook and unlock the next track. Your full curriculum certificate is built one lesson at a time.</p>';
    html += '</div>';

    html += '</div>'; // mr5

    // Floating chip
    html += '<button class="mr5-chip" data-chip="1">';
    if (logoUrl) html += '<img src="' + esc(logoUrl) + '" alt="">';
    html += '<span>Mark ' + esc(lesson.id) + ' complete</span></button>';
    return html;
  }

  function markComplete(lesson, container) {
    var btn = container.querySelector('[data-action="complete"]');
    var chip = document.querySelector('[data-chip="1"]');
    var cert = container.querySelector('[data-cert="1"]');
    if (btn) { btn.textContent = '✓ Marked complete'; btn.disabled = true; }
    if (chip) { chip.classList.add('done'); chip.querySelector('span').textContent = '✓ Complete'; }
    if (cert) {
      cert.classList.add('done');
      cert.querySelector('[data-cert-title="1"]').textContent = 'Lesson complete. Onward.';
      cert.querySelector('[data-cert-body="1"]').textContent = 'Your progress is saved. Keep stacking the playbook — the next lesson is one click away.';
    }
    try {
      if (window.MR_PROGRESS && typeof window.MR_PROGRESS.markComplete === 'function') window.MR_PROGRESS.markComplete(lesson.id);
      else localStorage.setItem('mr-lesson-complete:' + lesson.id, Date.now().toString());
    } catch (e) { console.warn('progress sync failed', e); }
  }

  // Format raw lyrics text into HTML — preserve stanza breaks (blank lines), preserve [Hook]/[Verse] tags
  function formatLyrics(text) {
    if (!text || typeof text !== 'string') return '';
    var safe = esc(text.trim());
    // Wrap section tags like [Verse 1], [Chorus], [Hook] in italic em
    safe = safe.replace(/(\[[^\]]+\])/g, '<em>$1</em>');
    // Multiple blank lines → stanza break spacer
    safe = safe.replace(/\n\s*\n/g, '<span class="mr5-stanza-break"></span>');
    return safe;
  }

  function expandLyrics(lesson, btn, panel) {
    if (panel.dataset.loaded === '1') {
      panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');
      btn.querySelector('span:first-child').textContent = panel.classList.contains('open') ? 'Hide lyrics' : 'View lyrics';
      return;
    }
    // First open — render content
    panel.dataset.loaded = '1';
    // 1. Inline string field
    if (lesson.lyrics) {
      panel.innerHTML = '<div class="mr5-lyrics-body">' + formatLyrics(lesson.lyrics) + '</div>' +
                        '<div class="mr5-lyrics-meta"><span>Lyrics · ' + esc(lesson.id) + '</span><span>© MBA Rock</span></div>';
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('span:first-child').textContent = 'Hide lyrics';
      return;
    }
    // 2. Fetch from lyrics_url
    if (lesson.lyrics_url) {
      panel.innerHTML = '<div class="mr5-lyrics-loading">Loading lyrics…</div>';
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('span:first-child').textContent = 'Hide lyrics';
      fetch(lesson.lyrics_url, { cache: 'force-cache' })
        .then(function(r){ return r.ok ? r.text() : Promise.reject(r.status); })
        .then(function(txt) {
          panel.innerHTML = '<div class="mr5-lyrics-body">' + formatLyrics(txt) + '</div>' +
            '<div class="mr5-lyrics-meta"><span>Lyrics · ' + esc(lesson.id) + '</span><a href="' + esc(lesson.lyrics_url) + '" target="_blank" rel="noopener">Open source</a></div>';
        })
        .catch(function(err) {
          panel.innerHTML = '<p class="mr5-lyrics-empty">Couldn’t load lyrics (error ' + esc(err) + '). <a href="' + esc(lesson.lyrics_url) + '" target="_blank" rel="noopener" style="color:inherit;border-bottom:1px solid currentColor;">Open file directly</a>.</p>';
        });
      return;
    }
    // 3. Empty state
    panel.innerHTML = '<p class="mr5-lyrics-empty">Lyrics for this track are still being written. Check back soon.</p>';
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('span:first-child').textContent = 'Hide lyrics';
  }

  function wireInteractions(lesson, container) {
    container.addEventListener('click', function(e) {
      var t = e.target;
      if (t.classList && t.classList.contains('mr5-check')) t.classList.toggle('done');
      if ((t.dataset && t.dataset.action === 'complete') || (t.closest && t.closest('[data-chip="1"]'))) {
        markComplete(lesson, container);
      }
      // Lyrics disclosure
      var lyricsBtn = t.closest && t.closest('[data-lyrics-toggle="1"]');
      if (lyricsBtn) {
        var panel = container.querySelector('[data-lyrics-panel="1"]');
        if (panel) expandLyrics(lesson, lyricsBtn, panel);
      }
    });
  }

  function applyV2(lesson, v2) {
    if (!lesson) return false;
    if (document.body && document.body.getAttribute('data-mr-v5-applied') === '1') return true;

    var bodySections = findLessonBodySections().concat(findExtraLessonSections());
    bodySections = Array.from(new Set(bodySections));
    if (bodySections.length === 0) return false;

    bodySections.forEach(function(s) { s.style.display = 'none'; s.setAttribute('data-mrv5-hidden','1'); });

    var brand = (v2.global && v2.global.brand) || { colors:{}, type:{} };
    injectStyles(brand);

    var lastHidden = bodySections[bodySections.length - 1];
    var newSection = document.createElement('section');
    newSection.setAttribute('data-mrv5-replacement', '1');
    newSection.style.cssText = 'background:#fff;padding:0 0 32px;';
    newSection.innerHTML = renderPage(lesson, v2);
    lastHidden.parentNode.insertBefore(newSection, lastHidden.nextSibling);
    // Move the floating chip out to body level
    var chip = newSection.querySelector('[data-chip="1"]');
    if (chip) document.body.appendChild(chip);

    wireInteractions(lesson, newSection);

    try {
      if (localStorage.getItem('mr-lesson-complete:' + lesson.id)) markComplete(lesson, newSection);
    } catch (e) {}

    document.body && document.body.setAttribute('data-mr-v5-applied', '1');
    console.log('[MBA v5] hid', bodySections.length, 'old sections; rendered premium layout for', lesson.id);
    return true;
  }

  function tokenize(s) {
    return String(s||'').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter(function(t){ return t.length >= 2 && !STOP[t] && !/^[0-9]+$/.test(t); });
  }

  function fuzzyMatch(slug, lessons) {
    var slugTokens = tokenize(slug);
    if (!slugTokens.length) return null;
    var best = null, bestScore = 0;
    lessons.forEach(function(l) {
      var corpus = (l.id + ' ' + l.title + ' ' + (l.slug_v2 || '') + ' ' + (l.legacy_slug || '')).toLowerCase();
      var corpusTokens = tokenize(corpus);
      var matches = 0;
      slugTokens.forEach(function(t){
        if (corpusTokens.indexOf(t) !== -1) matches++;
      });
      // Score = matches / slug-token-count, with a small boost for module-prefix agreement
      var score = matches / slugTokens.length;
      var modMatch = slug.match(/^m(\d+)l/i);
      if (modMatch && l.module_id === 'M' + modMatch[1]) score += 0.25;
      if (score > bestScore) { bestScore = score; best = l; }
    });
    return bestScore >= 0.4 ? best : null;
  }

  function findLesson(v2) {
    if (!v2 || !v2.lessons) return null;
    // 1. Hardcoded verified map
    var targetId = SLUG_TO_V2[sqSlug];
    if (targetId) {
      var hit = v2.lessons.find(function(l) { return l.id === targetId; });
      if (hit) { hit._matchSource = 'verified-map'; return hit; }
    }
    // 2. legacy_slug exact match
    var bySlug = v2.lessons.find(function(l) { return l.legacy_slug === sqSlug; });
    if (bySlug) { bySlug._matchSource = 'legacy-slug'; return bySlug; }
    // 3. slug_v2 exact match
    var bySlugV2 = v2.lessons.find(function(l) { return l.slug_v2 === sqSlug; });
    if (bySlugV2) { bySlugV2._matchSource = 'slug-v2'; return bySlugV2; }
    // 4. Fuzzy fallback
    var fuzzy = fuzzyMatch(sqSlug, v2.lessons);
    if (fuzzy) { fuzzy._matchSource = 'fuzzy'; return fuzzy; }
    return null;
  }

  function run() {
    console.log('[MBA v5] slug:', sqSlug, '→', SLUG_TO_V2[sqSlug] || '(unmapped)');
    fetch(V2_URL, { cache: 'no-cache' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(v2) {
        var lesson = findLesson(v2);
        if (!lesson) { console.warn('[MBA v5] no lesson for', sqSlug); return; }
        if (applyV2(lesson, v2)) return;
        var obs = new MutationObserver(function() { if (applyV2(lesson, v2)) obs.disconnect(); });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(function() { applyV2(lesson, v2); }, 1500);
        setTimeout(function() { applyV2(lesson, v2); }, 3000);
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (applyV2(lesson, v2) || attempts > 60) { try { obs.disconnect(); } catch (e) {} clearInterval(poll); }
        }, 500);
      })
      .catch(function(e) { console.error('[MBA v5] fetch failed:', e); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
