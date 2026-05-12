// MBA Rock — Lesson Page Takeover v6.8 (2026-05-12)
// v6.8: arcade modal escapes Squarespace iframe + fills full browser viewport.
// LISTEN. LEARN. LIVE.

(function() {
  if (document.querySelector('[data-mr-dashboard="1"]')) return;

  // ── v6.7 RESET: a stale (cached) version of this script may have run first.
  // Tear down its render before we re-apply, so the freshest version always wins.
  try {
    document.querySelectorAll('[data-mrv5-replacement]').forEach(function(el){ el.remove(); });
    document.querySelectorAll('[data-mrv4-replacement]').forEach(function(el){ el.remove(); });
    document.querySelectorAll('[data-chip="1"]').forEach(function(el){ el.remove(); });
    document.querySelectorAll('[data-mrv5-hidden]').forEach(function(el){
      el.style.display = '';
      el.removeAttribute('data-mrv5-hidden');
    });
    document.querySelectorAll('[data-mrv4-hidden]').forEach(function(el){
      el.style.display = '';
      el.removeAttribute('data-mrv4-hidden');
    });
    if (document.body) {
      document.body.removeAttribute('data-mr-v5-applied');
      document.body.removeAttribute('data-mr-v4-applied');
    }
    // Remove any prior arcade modal too
    var prior = document.getElementById('mr5-arcade-modal');
    if (prior) prior.remove();
  } catch (e) { console.warn('[MR v6.7 reset] skipped', e); }
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

  // ── Supabase (for per-account notes — same project as progress sync) ──
  var SUPABASE_URL = 'https://ciloqphtencjthkedanw.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-';
  var MEMBER_KEY = 'mba-rock-member-id';

  // Try a series of Squarespace signals to detect a logged-in member before falling back to guest.
  // First match wins. Caches detected member-id back to localStorage so subsequent loads are instant.
  function detectMemberId() {
    // 1. Already stored in localStorage (from dashboard, prior session, or manual set)
    var stored = localStorage.getItem(MEMBER_KEY);
    if (stored && stored !== 'guest' && stored !== 'null') return stored;

    // 2. Squarespace member-area context (sometimes exposed on window)
    try {
      var ctx = window.Static && window.Static.SQUARESPACE_CONTEXT;
      var mem = ctx && (ctx.authenticatedAccount || ctx.member || ctx.memberArea);
      if (mem) {
        var email = mem.email || mem.emailAddress || (mem.account && mem.account.email);
        if (email) {
          localStorage.setItem(MEMBER_KEY, email);
          console.log('[MR v6.1] detected member via SQUARESPACE_CONTEXT:', email);
          return email;
        }
      }
    } catch (e) {}

    // 3. Squarespace member-area DOM hints (the email may sit in a sign-out link or profile menu)
    try {
      var emailEl = document.querySelector('[data-member-email], .sqs-account-email, .user-account-email');
      if (emailEl && emailEl.textContent) {
        var t = emailEl.textContent.trim();
        if (/@/.test(t)) {
          localStorage.setItem(MEMBER_KEY, t);
          console.log('[MR v6.1] detected member via DOM hint:', t);
          return t;
        }
      }
    } catch (e) {}

    // 4. Cookie sniff — Squarespace sets a cookie like 'crumb' + 'SiteUserSecureAuthToken' when logged in,
    //    but doesn't expose email. We can at least know if a member is signed in.
    try {
      if (/SiteUserSecure/.test(document.cookie)) {
        // Logged in but we don't have an email yet — generate a pseudo-id that's stable per browser
        var bid = localStorage.getItem('mba-rock-browser-id');
        if (!bid) {
          bid = 'browser-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
          localStorage.setItem('mba-rock-browser-id', bid);
        }
        localStorage.setItem(MEMBER_KEY, bid);
        return bid;
      }
    } catch (e) {}

    return 'guest';
  }

  function memberId() { return detectMemberId(); }

  // ── Inline arcade modal (the game lives in this string so it serves as text/html) ──
  var ARCADE_GAME_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\" />\n<title>Whack-a-Vanity-Metric \u00b7 MBA Rock Arcade</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<style>\n  :root{\n    --navy:#0B1F3A;\n    --ink:#0E1116;\n    --orange:#F26B1F;\n    --orange-soft:#FBE2D0;\n    --cream:#FAF8F5;\n    --green:#1d8444;\n    --green-soft:#cdebd4;\n    --red:#a01a1a;\n    --rule:#22293a;\n  }\n  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}\n  html,body{margin:0;padding:0;background:var(--ink);color:#fff;font-family:'Inter',-apple-system,sans-serif;overflow-x:hidden;min-height:100vh;}\n  .app{max-width:880px;margin:0 auto;padding:28px 20px 48px;min-height:100vh;display:flex;flex-direction:column;}\n\n  /* Top bar */\n  .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid var(--rule);padding-bottom:18px;}\n  .brand{font-family:'Fraunces',serif;font-size:14px;letter-spacing:-0.005em;color:#aaa;}\n  .brand b{color:#fff;font-weight:600;}\n  .back{color:var(--orange);font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;font-weight:700;border:1px solid var(--rule);padding:8px 14px;border-radius:30px;transition:all .15s;}\n  .back:hover{background:var(--orange);color:#fff;border-color:var(--orange);}\n\n  /* Title */\n  .title{font-family:'Fraunces',serif;font-size:46px;letter-spacing:-0.025em;line-height:1.05;margin:0 0 8px;font-weight:600;}\n  .title .pop{color:var(--orange);}\n  .subtitle{font-family:'Fraunces',serif;font-style:italic;color:#999;font-size:18px;margin:0 0 32px;line-height:1.45;}\n\n  /* Status bar */\n  .status{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:0 0 22px;}\n  .stat{background:#171c2b;border:1px solid var(--rule);border-radius:12px;padding:14px 18px;}\n  .stat .l{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#888;font-weight:700;margin-bottom:4px;}\n  .stat .v{font-family:'Fraunces',serif;font-size:30px;font-weight:600;line-height:1;letter-spacing:-0.02em;color:#fff;font-variant-numeric:tabular-nums;}\n  .stat.warn .v{color:var(--orange);}\n  .stat.good .v{color:var(--green);}\n\n  /* Grid */\n  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;flex:1;align-content:center;}\n  .hole{\n    position:relative;aspect-ratio:1/1;background:#171c2b;border:1px solid var(--rule);border-radius:14px;\n    display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;\n    transition:background .15s,border-color .15s;\n  }\n  .hole:hover{background:#1d2436;}\n  .hole .mole{\n    position:absolute;inset:8%;border-radius:10px;display:flex;align-items:center;justify-content:center;\n    text-align:center;padding:8px 12px;\n    background:var(--orange);color:#fff;font-family:'Inter',sans-serif;font-weight:700;\n    font-size:clamp(13px,2.4vw,18px);letter-spacing:-0.005em;line-height:1.2;\n    transform:scale(0);transition:transform .12s cubic-bezier(.22,1.6,.36,1);\n    box-shadow:0 8px 24px -8px rgba(242,107,31,.5);\n  }\n  .hole.real .mole{background:var(--green);box-shadow:0 8px 24px -8px rgba(29,132,68,.5);}\n  .hole.up .mole{transform:scale(1);}\n  .hole.bonk-vanity .mole{animation:bonkVanity .35s ease-out forwards;}\n  .hole.bonk-real .mole{animation:bonkReal .45s ease-out forwards;}\n  @keyframes bonkVanity{\n    0%{transform:scale(1);background:var(--orange);}\n    30%{transform:scale(1.3) rotate(8deg);background:var(--orange-soft);color:var(--orange);}\n    100%{transform:scale(0);}\n  }\n  @keyframes bonkReal{\n    0%,100%{transform:scale(1);}\n    20%{transform:scale(1.05);background:var(--red);}\n    40%{transform:scale(0.95) translateX(-6px);}\n    60%{transform:scale(1.05) translateX(6px);}\n    80%{transform:scale(0.98) translateX(-3px);}\n  }\n  .hole .float-points{\n    position:absolute;font-family:'Fraunces',serif;font-size:32px;font-weight:700;font-variant-numeric:tabular-nums;\n    pointer-events:none;animation:floatUp .8s ease-out forwards;letter-spacing:-0.02em;z-index:2;\n  }\n  .hole .float-points.plus{color:var(--orange);}\n  .hole .float-points.minus{color:var(--red);}\n  @keyframes floatUp{\n    0%{transform:translateY(0) scale(.6);opacity:0;}\n    20%{transform:translateY(-8px) scale(1.1);opacity:1;}\n    100%{transform:translateY(-60px) scale(.8);opacity:0;}\n  }\n\n  /* Overlay (start/end screens) */\n  .overlay{\n    position:fixed;inset:0;background:rgba(14,17,22,0.92);backdrop-filter:blur(8px);\n    display:flex;align-items:center;justify-content:center;padding:24px;z-index:100;\n  }\n  .overlay-card{\n    background:#171c2b;border:1px solid var(--rule);border-radius:18px;padding:40px 36px;max-width:440px;width:100%;text-align:center;\n  }\n  .overlay h2{font-family:'Fraunces',serif;font-size:34px;line-height:1.1;letter-spacing:-0.02em;margin:0 0 14px;color:#fff;font-weight:600;}\n  .overlay p{font-family:'Fraunces',serif;font-style:italic;color:#aaa;font-size:17px;line-height:1.5;margin:0 0 26px;}\n  .overlay .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 26px;}\n  .overlay .stats-grid .stat{padding:12px 14px;}\n  .overlay .stats-grid .stat .v{font-size:24px;}\n  .overlay .stats-grid .stat.fail .v{color:var(--red);}\n  .btn{\n    display:inline-block;background:var(--orange);color:#fff;border:0;\n    font-family:'Inter',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;\n    padding:16px 36px;border-radius:50px;cursor:pointer;transition:all .15s;\n    text-decoration:none;\n  }\n  .btn:hover{background:#d75a13;transform:translateY(-2px);box-shadow:0 8px 22px -6px rgba(242,107,31,.5);}\n  .btn.ghost{background:transparent;border:1.5px solid #444;color:#aaa;margin-left:8px;}\n  .btn.ghost:hover{border-color:#aaa;color:#fff;background:transparent;box-shadow:none;}\n  .hint{font-size:11px;color:#666;margin-top:18px;letter-spacing:.06em;}\n\n  /* Tips */\n  .tips{display:flex;gap:16px;justify-content:center;margin:18px 0 0;font-size:12.5px;letter-spacing:.04em;color:#999;}\n  .tips span{display:inline-flex;align-items:center;gap:6px;}\n  .tips .swatch{width:10px;height:10px;border-radius:3px;display:inline-block;}\n  .tips .swatch.v{background:var(--orange);}\n  .tips .swatch.r{background:var(--green);}\n\n  /* High score chip */\n  .hs{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888;font-weight:600;}\n  .hs b{color:var(--orange);font-family:'Fraunces',serif;font-weight:700;letter-spacing:-0.01em;}\n\n  @media(max-width:560px){\n    .title{font-size:32px;}\n    .subtitle{font-size:15px;}\n    .stat .v{font-size:24px;}\n    .stat{padding:10px 12px;}\n    .overlay-card{padding:30px 22px;}\n    .overlay h2{font-size:26px;}\n    .tips{flex-direction:column;align-items:flex-start;gap:8px;}\n  }\n</style>\n</head>\n<body>\n<main class=\"app\">\n  <div class=\"topbar\">\n    <span class=\"brand\"><b>MBA Rock</b> \u00b7 The Arcade</span>\n    <a class=\"back\" href=\"/mba-rock\" id=\"exitBtn\">\u2190 Back to lessons</a>\n  </div>\n\n  <h1 class=\"title\">Whack-a-<span class=\"pop\">Vanity-Metric</span></h1>\n  <p class=\"subtitle\">Bonk the bullshit. Spare the signals.</p>\n\n  <div class=\"status\">\n    <div class=\"stat\" id=\"scoreBox\"><div class=\"l\">Score</div><div class=\"v\" id=\"score\">0</div></div>\n    <div class=\"stat warn\" id=\"timeBox\"><div class=\"l\">Time</div><div class=\"v\" id=\"time\">30</div></div>\n    <div class=\"stat good\" id=\"bestBox\"><div class=\"l\">Best</div><div class=\"v\" id=\"best\">0</div></div>\n  </div>\n\n  <div class=\"grid\" id=\"grid\">\n    <div class=\"hole\" data-h=\"0\"></div>\n    <div class=\"hole\" data-h=\"1\"></div>\n    <div class=\"hole\" data-h=\"2\"></div>\n    <div class=\"hole\" data-h=\"3\"></div>\n    <div class=\"hole\" data-h=\"4\"></div>\n    <div class=\"hole\" data-h=\"5\"></div>\n    <div class=\"hole\" data-h=\"6\"></div>\n    <div class=\"hole\" data-h=\"7\"></div>\n    <div class=\"hole\" data-h=\"8\"></div>\n  </div>\n\n  <div class=\"tips\">\n    <span><span class=\"swatch v\"></span> Orange = vanity metric \u00b7 BONK IT (+1)</span>\n    <span><span class=\"swatch r\"></span> Green = real signal \u00b7 DO NOT BONK (\u22122)</span>\n  </div>\n</main>\n\n<!-- Start overlay -->\n<div class=\"overlay\" id=\"startOverlay\">\n  <div class=\"overlay-card\">\n    <h2>Whack-a-Vanity-Metric</h2>\n    <p>Founders waste years optimizing the wrong numbers. Spend 30 seconds bonking the metrics that don't matter. Just don't bonk the real ones.</p>\n    <div class=\"stats-grid\">\n      <div class=\"stat\"><div class=\"l\">Round</div><div class=\"v\">30s</div></div>\n      <div class=\"stat good\"><div class=\"l\">Best</div><div class=\"v\" id=\"bestStart\">0</div></div>\n    </div>\n    <button class=\"btn\" id=\"startBtn\">Bring 'em on</button>\n    <p class=\"hint\">Click or tap the orange metrics. The green ones are the ones you ACTUALLY want to grow \u2014 those will cost you points.</p>\n  </div>\n</div>\n\n<!-- End overlay -->\n<div class=\"overlay\" id=\"endOverlay\" style=\"display:none\">\n  <div class=\"overlay-card\">\n    <h2 id=\"endTitle\">Round over</h2>\n    <p id=\"endSubtitle\">Here's how you did.</p>\n    <div class=\"stats-grid\">\n      <div class=\"stat\"><div class=\"l\">Score</div><div class=\"v\" id=\"endScore\">0</div></div>\n      <div class=\"stat\"><div class=\"l\">Vanity Bonked</div><div class=\"v\" id=\"endBonked\">0</div></div>\n      <div class=\"stat fail\"><div class=\"l\">Real Bonked</div><div class=\"v\" id=\"endRealBonked\">0</div></div>\n      <div class=\"stat good\"><div class=\"l\">Best</div><div class=\"v\" id=\"endBest\">0</div></div>\n    </div>\n    <button class=\"btn\" id=\"playAgainBtn\">Play again</button>\n    <a class=\"btn ghost\" href=\"/mba-rock\">Back to lessons</a>\n  </div>\n</div>\n\n<script>\nconsole.log('[MBA Arcade] Whack-a-Vanity-Metric v1.1 loaded');\nconst VANITY = [\n  \"Followers\", \"Pageviews\", \"GMV\", \"Bookings\", \"Awards\",\n  \"MAU\", \"Beta Signups\", \"TechCrunch Coverage\", \"Engagement Score\",\n  \"Brand Mentions\", \"Total Downloads\", \"Logo Wins\", \"Vanity ARR\",\n  \"Social Reach\", \"Total Users\", \"Hours Worked\", \"Lines of Code\",\n  \"Press Hits\", \"Q4 Momentum\", \"Vibes\"\n];\nconst REAL = [\n  \"Net Revenue Retention\", \"Gross Margin\", \"Cash Flow\",\n  \"LTV:CAC\", \"Payback Period\", \"Operating Cash Flow\",\n  \"Contribution Margin\", \"Free Cash Flow\", \"Customer Lifetime Value\"\n];\n\nconst GAME_SECONDS = 30;\nconst HOLES = 9;\nconst SPAWN_MIN = 280;\nconst SPAWN_MAX = 700;\nconst POPUP_MIN = 750;\nconst POPUP_MAX = 1400;\nconst REAL_FREQ = 0.22; // 22% of pops are \"real\" metrics (avoid bonking)\n\nconst STORAGE_KEY = 'mr-arcade-vanity-best';\n\nlet score = 0;\nlet bonkedVanity = 0;\nlet bonkedReal = 0;\nlet timeLeft = GAME_SECONDS;\nlet running = false;\nlet timerInt, spawnTimeout;\nconst holes = Array.from(document.querySelectorAll('.hole'));\nconst activePopups = {}; // holeIndex -> {timeout, isReal}\n\nfunction loadBest() {\n  try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch(e) { return 0; }\n}\nfunction saveBest(v) {\n  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch(e) {}\n}\nlet best = loadBest();\ndocument.getElementById('best').textContent = best;\ndocument.getElementById('bestStart').textContent = best;\n\nfunction showMole() {\n  if (!running) return;\n  // pick a free hole\n  const free = holes.filter(h => !h.classList.contains('up') && !h.classList.contains('bonk-vanity') && !h.classList.contains('bonk-real'));\n  if (!free.length) { scheduleSpawn(); return; }\n  const hole = free[Math.floor(Math.random() * free.length)];\n  const idx = parseInt(hole.dataset.h, 10);\n  const isReal = Math.random() < REAL_FREQ;\n  const pool = isReal ? REAL : VANITY;\n  const label = pool[Math.floor(Math.random() * pool.length)];\n\n  hole.classList.toggle('real', isReal);\n  hole.classList.add('up');\n  hole.innerHTML = '<div class=\"mole\">' + label + '</div>';\n\n  const duration = POPUP_MIN + Math.random() * (POPUP_MAX - POPUP_MIN);\n  activePopups[idx] = { isReal };\n  activePopups[idx].timeout = setTimeout(() => { retract(hole, idx); }, duration);\n  scheduleSpawn();\n}\n\nfunction retract(hole, idx) {\n  if (!hole.classList.contains('up')) return;\n  hole.classList.remove('up');\n  setTimeout(() => {\n    if (!hole.classList.contains('bonk-vanity') && !hole.classList.contains('bonk-real')) {\n      hole.innerHTML = '';\n      hole.classList.remove('real');\n    }\n  }, 200);\n  delete activePopups[idx];\n}\n\nfunction scheduleSpawn() {\n  const delay = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);\n  spawnTimeout = setTimeout(showMole, delay);\n}\n\nfunction bonk(hole, idx) {\n  const pop = activePopups[idx];\n  if (!pop) return;\n  clearTimeout(pop.timeout);\n  delete activePopups[idx];\n  const isReal = pop.isReal;\n  const delta = isReal ? -2 : 1;\n  if (isReal) bonkedReal++; else bonkedVanity++;\n  score += delta;\n  document.getElementById('score').textContent = score;\n\n  // Animation + floating points\n  hole.classList.remove('up');\n  hole.classList.add(isReal ? 'bonk-real' : 'bonk-vanity');\n  const pts = document.createElement('div');\n  pts.className = 'float-points ' + (delta > 0 ? 'plus' : 'minus');\n  pts.textContent = (delta > 0 ? '+' : '') + delta;\n  hole.appendChild(pts);\n\n  setTimeout(() => {\n    hole.classList.remove('bonk-vanity', 'bonk-real', 'real');\n    hole.innerHTML = '';\n  }, 500);\n}\n\nholes.forEach(h => {\n  h.addEventListener('click', () => bonk(h, parseInt(h.dataset.h, 10)));\n  h.addEventListener('touchstart', (e) => {\n    e.preventDefault();\n    bonk(h, parseInt(h.dataset.h, 10));\n  }, { passive: false });\n});\n\nfunction tick() {\n  timeLeft--;\n  document.getElementById('time').textContent = timeLeft;\n  if (timeLeft <= 0) endGame();\n}\n\nfunction startGame() {\n  score = 0; bonkedVanity = 0; bonkedReal = 0; timeLeft = GAME_SECONDS; running = true;\n  document.getElementById('score').textContent = '0';\n  document.getElementById('time').textContent = GAME_SECONDS;\n  document.getElementById('startOverlay').style.display = 'none';\n  document.getElementById('endOverlay').style.display = 'none';\n  holes.forEach(h => { h.classList.remove('up','real','bonk-vanity','bonk-real'); h.innerHTML = ''; });\n  Object.values(activePopups).forEach(p => { try { clearTimeout(p.timeout); } catch(e){} });\n  for (const k in activePopups) delete activePopups[k];\n  clearInterval(timerInt); clearTimeout(spawnTimeout);\n  timerInt = setInterval(tick, 1000);\n  scheduleSpawn();\n}\n\nfunction endGame() {\n  running = false;\n  clearInterval(timerInt); clearTimeout(spawnTimeout);\n  Object.values(activePopups).forEach(p => { try { clearTimeout(p.timeout); } catch(e){} });\n  for (const k in activePopups) delete activePopups[k];\n\n  if (score > best) {\n    best = score;\n    saveBest(best);\n    document.getElementById('best').textContent = best;\n  }\n\n  // Tailor end copy\n  let title = 'Round over.';\n  let sub = 'Decent. Bonk harder next time.';\n  if (bonkedReal === 0 && bonkedVanity >= 15) { title = 'Sharp eyes.'; sub = \"You bonked the noise. You spared the signal. That's the job.\"; }\n  else if (bonkedReal >= 3) { title = 'You bonked the real metrics.'; sub = \"That's how founders lose years optimizing the wrong thing. Try again.\"; }\n  else if (score < 5) { title = 'Slow start.'; sub = 'The vanity metrics never stop coming. Faster next round.'; }\n  else if (score >= 20) { title = 'Operator move.'; sub = 'You know what matters and what doesn\u2019t. That instinct compounds.'; }\n\n  document.getElementById('endTitle').textContent = title;\n  document.getElementById('endSubtitle').textContent = sub;\n  document.getElementById('endScore').textContent = score;\n  document.getElementById('endBonked').textContent = bonkedVanity;\n  document.getElementById('endRealBonked').textContent = bonkedReal;\n  document.getElementById('endBest').textContent = best;\n  document.getElementById('endOverlay').style.display = 'flex';\n}\n\ndocument.getElementById('startBtn').addEventListener('click', startGame);\ndocument.getElementById('playAgainBtn').addEventListener('click', startGame);\n\n// Allow Squarespace-style back nav (if opened from a lesson page, \"Back to lessons\" goes to /mba-rock)\n// If the referrer is a lesson, prefer that\ntry {\n  const ref = document.referrer;\n  if (ref && /\\/mba-rock\\//.test(ref)) {\n    document.getElementById('exitBtn').href = ref;\n    document.querySelectorAll('.btn.ghost').forEach(a => a.href = ref);\n  }\n} catch (e) {}\n</script>\n</body>\n</html>\n";

  function openArcadeModal() {
    if (document.getElementById('mr5-arcade-modal')) return;

    // Try to break out of Squarespace's course-player iframe and cover the FULL browser viewport.
    // Same-origin parents allow this; cross-origin throws, in which case we fall back to local body.
    var hostDoc = document;
    try {
      if (window.top && window.top !== window && window.top.document && window.top.document.body) {
        hostDoc = window.top.document;
      }
    } catch (e) { /* cross-origin parent — stay in local */ }

    var overlay = hostDoc.createElement('div');
    overlay.id = 'mr5-arcade-modal';
    overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;background:rgba(14,17,22,0.94);z-index:2147483647;display:flex;flex-direction:column;padding:14px;box-sizing:border-box;backdrop-filter:blur(6px);';
    overlay.innerHTML = '<div style="flex:0 0 auto;display:flex;justify-content:flex-end;margin-bottom:10px;"><button type="button" id="mr5-arcade-close" style="background:transparent;border:1px solid #555;color:#fff;font-family:Inter,sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:10px 18px;border-radius:30px;cursor:pointer;">Close ×</button></div><iframe id="mr5-arcade-frame" style="flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;border-radius:12px;background:#0E1116;display:block;" allow="autoplay"></iframe>';
    hostDoc.body.appendChild(overlay);
    hostDoc.body.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Inject a small CSS override into the embedded game so it fills the iframe width
    var gameHtml = ARCADE_GAME_HTML.replace(
      '</head>',
      '<style>html,body{height:100%;}body{display:flex;align-items:stretch;justify-content:center;}main.app{max-width:980px;width:100%;padding:22px 18px 32px;}</style></head>'
    );
    var frame = overlay.querySelector('#mr5-arcade-frame');
    frame.srcdoc = gameHtml;
    overlay.querySelector('#mr5-arcade-close').addEventListener('click', closeArcadeModal);
    document.addEventListener('keydown', escCloseArcade);
    overlay._hostDoc = hostDoc;
  }
  function closeArcadeModal() {
    var o = document.getElementById('mr5-arcade-modal');
    if (o) {
      var hostDoc = o._hostDoc || document;
      o.remove();
      try { hostDoc.body.style.overflow = ''; } catch(e){}
      document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', escCloseArcade);
  }
  function escCloseArcade(e) { if (e.key === 'Escape') closeArcadeModal(); }

  var SB_HDR = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // ── Tiny markdown-ish renderer: paragraphs, **bold**, *italic*, line breaks. Preserves $..$ math for KaTeX. ──
  function mdLite(text) {
    if (!text) return '';
    var parts = String(text).split(/\n\s*\n/); // split on blank lines = paragraphs
    return parts.map(function(p) {
      p = esc(p.trim());
      // bold then italic (after escape so HTML is safe)
      p = p.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
      p = p.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
      // single newlines → <br>
      p = p.replace(/\n/g, '<br>');
      // wrap UL when paragraph starts with "- "
      if (/^- /.test(p) || /<br>- /.test(p)) {
        var lines = p.split(/<br>|\n/).map(function(l){ return l.replace(/^- /, ''); });
        return '<ul>' + lines.map(function(l){ return '<li>' + l + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + p + '</p>';
    }).join('');
  }

  // ── KaTeX auto-loader (loads CSS + JS + auto-render extension on demand) ──
  var katexReady = null;
  function loadKatex() {
    if (katexReady) return katexReady;
    katexReady = new Promise(function(resolve) {
      // CSS
      if (!document.querySelector('link[data-mr-katex]')) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        l.setAttribute('data-mr-katex', '1');
        document.head.appendChild(l);
      }
      // Core JS
      var s1 = document.createElement('script');
      s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      s1.onload = function() {
        // Auto-render extension
        var s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
        s2.onload = function() { resolve(window.renderMathInElement); };
        s2.onerror = function() { console.warn('[MR v6] KaTeX auto-render failed to load'); resolve(null); };
        document.head.appendChild(s2);
      };
      s1.onerror = function() { console.warn('[MR v6] KaTeX failed to load'); resolve(null); };
      document.head.appendChild(s1);
    });
    return katexReady;
  }

  function renderMath(scope) {
    loadKatex().then(function(renderFn) {
      if (!renderFn) return;
      try {
        renderFn(scope, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$',  right: '$',  display: false }
          ],
          throwOnError: false,
          errorColor: '#a00',
        });
      } catch (e) { console.warn('[MR v6] KaTeX render error', e); }
    });
  }

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

    /* Hero — generous top margin so it doesn't crash into Squarespace's site nav */
    .mr5-hero{margin:48px 0 44px;padding:0;}
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

    /* Concepts — expandable disclosure rows */
    .mr5-concepts-list{border-top:1px solid ${c.rule};}
    .mr5-concept-row{border-bottom:1px solid ${c.rule};}
    .mr5-concept-head{display:grid;grid-template-columns:48px 1fr 32px;align-items:center;width:100%;background:transparent;border:0;padding:22px 4px;text-align:left;cursor:pointer;font-family:"Fraunces",serif;color:${c.navy};transition:background .15s;}
    .mr5-concept-head:hover{background:${c.cream};}
    .mr5-concept-head[disabled]{cursor:default;opacity:.85;}
    .mr5-concept-head[disabled]:hover{background:transparent;}
    .mr5-concept-n{font-family:"Fraunces",serif;font-size:14px;color:${c.orange};font-weight:700;letter-spacing:.08em;}
    .mr5-concept-title{font-family:"Fraunces",serif;font-size:19px;line-height:1.35;color:${c.navy};font-weight:500;letter-spacing:-0.005em;}
    .mr5-concept-chev{font-family:"Fraunces",serif;font-size:22px;color:${c.orange};font-weight:600;line-height:1;text-align:right;transition:transform .25s ease;}
    .mr5-concept-head[aria-expanded="true"] .mr5-concept-chev{transform:rotate(45deg);}
    .mr5-concept-panel{max-height:0;overflow:hidden;transition:max-height .35s ease;}
    .mr5-concept-panel.open{max-height:2000px;}
    .mr5-concept-body{padding:0 4px 22px 56px;font-family:"Fraunces",serif;font-size:17px;line-height:1.7;color:${c.ink};letter-spacing:-0.005em;}
    .mr5-concept-body p{margin:0 0 12px;}
    .mr5-concept-body p:last-child{margin-bottom:0;}
    .mr5-concept-body strong{color:${c.navy};font-weight:600;}
    .mr5-concept-body em{font-style:italic;color:#444;}
    .mr5-concept-body ul{padding-left:22px;margin:6px 0 12px;}
    .mr5-concept-body li{margin:0 0 8px;font-size:16px;line-height:1.6;}
    .mr5-concept-body .katex-display{margin:14px 0;padding:14px 18px;background:${c.cream};border-left:3px solid ${c.orange};border-radius:0 4px 4px 0;}

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

    /* Deeper Dive — long-form editorial */
    .mr5-deepdive{font-family:"Fraunces",serif;color:${c.ink};font-size:18px;line-height:1.75;max-width:780px;}
    .mr5-deepdive p{margin:0 0 18px;}
    .mr5-deepdive strong{color:${c.navy};font-weight:600;}
    .mr5-deepdive em{font-style:italic;color:#444;}
    .mr5-deepdive ul{padding-left:24px;margin:0 0 18px;}
    .mr5-deepdive li{margin:0 0 10px;font-size:17px;line-height:1.65;}
    .mr5-deepdive .katex-display{margin:24px 0;padding:18px 24px;background:${c.cream};border-left:3px solid ${c.orange};border-radius:0 4px 4px 0;overflow-x:auto;}
    .mr5-deepdive .katex{font-size:1.05em;}
    .mr5-equation-label{font-family:"Inter",sans-serif;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:${c.orange};font-weight:600;margin-top:-12px;margin-bottom:18px;padding-left:24px;}

    /* Notes — perpetual per-account journal */
    .mr5-notes{background:${c.cream};border:1px solid ${c.rule};border-radius:8px;padding:6px;}
    .mr5-notes-textarea{width:100%;min-height:220px;padding:24px 28px;border:0;background:transparent;font-family:"Fraunces",serif;font-size:17px;line-height:1.7;color:${c.ink};resize:vertical;outline:none;letter-spacing:-0.005em;}
    .mr5-notes-textarea::placeholder{color:#aaa;font-style:italic;}
    .mr5-notes-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px 4px;border-top:1px dashed ${c.rule};margin-top:4px;font-family:"Inter",sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888;font-weight:600;}
    .mr5-notes-bar .mr5-notes-status{display:inline-flex;align-items:center;gap:6px;}
    .mr5-notes-bar .mr5-notes-status::before{content:"";width:7px;height:7px;border-radius:50%;background:${c.rule};transition:background .2s;}
    .mr5-notes-bar .mr5-notes-status.saving::before{background:#d49f1c;animation:mr5-pulse 1s ease-in-out infinite;}
    .mr5-notes-bar .mr5-notes-status.saved::before{background:#1d8444;}
    .mr5-notes-bar .mr5-notes-status.guest::before{background:#a00;}
    .mr5-notes-bar .mr5-notes-status.error::before{background:#a00;}
    @keyframes mr5-pulse{0%,100%{opacity:.4;}50%{opacity:1;}}
    .mr5-notes-bar a{color:${c.navy};border-bottom:1px solid ${c.rule};padding-bottom:1px;text-decoration:none;}
    .mr5-notes-bar a:hover{border-color:${c.orange};color:${c.orange};}

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

    /* Arcade row — "Need a break?" link to the game */
    .mr5-arcade-row{margin:32px 0 0;}
    .mr5-arcade-btn{display:flex;align-items:center;gap:18px;padding:22px 28px;background:#0E1116;color:#fff;border-radius:14px;text-decoration:none;transition:all .15s;border:1px solid transparent;}
    .mr5-arcade-btn:hover{background:#1d2436;border-color:${c.orange};transform:translateY(-1px);box-shadow:0 12px 28px -10px rgba(242,107,31,0.3);}
    .mr5-arcade-icon{font-size:36px;line-height:1;flex-shrink:0;}
    .mr5-arcade-l{display:block;font-family:"Fraunces",serif;font-size:20px;font-weight:600;letter-spacing:-0.01em;color:#fff;margin-bottom:4px;}
    .mr5-arcade-s{display:block;font-family:"Inter",sans-serif;font-size:13px;color:#aaa;line-height:1.45;}
    .mr5-arcade-s b{color:${c.orange};font-weight:600;}
    .mr5-arcade-chev{margin-left:auto;font-family:"Fraunces",serif;font-size:28px;color:${c.orange};font-weight:600;flex-shrink:0;transition:transform .2s;}
    .mr5-arcade-btn:hover .mr5-arcade-chev{transform:translateX(4px);}
    @media(max-width:680px){
      .mr5-arcade-btn{padding:18px 20px;gap:14px;}
      .mr5-arcade-icon{font-size:28px;}
      .mr5-arcade-l{font-size:17px;}
      .mr5-arcade-s{font-size:12.5px;}
      .mr5-arcade-chev{font-size:22px;}
    }

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
    return '<div class="mr5-concepts-list">' + arr.map(function(c, i){
      var title, body;
      if (typeof c === 'string') { title = c; body = null; }
      else { title = c.title || ''; body = c.body || null; }
      var num = String(i + 1).padStart(2, '0');
      var hasBody = !!(body && body.trim());
      return '<div class="mr5-concept-row' + (hasBody ? ' has-body' : '') + '">' +
        '<button class="mr5-concept-head" ' + (hasBody ? 'data-concept-toggle="1" aria-expanded="false"' : 'disabled') + '>' +
          '<span class="mr5-concept-n">' + num + '</span>' +
          '<span class="mr5-concept-title">' + esc(title) + '</span>' +
          (hasBody ? '<span class="mr5-concept-chev">+</span>' : '') +
        '</button>' +
        (hasBody ? '<div class="mr5-concept-panel"><div class="mr5-concept-body">' + mdLite(body) + '</div></div>' : '') +
        '</div>';
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

    // Crumb row removed in v6.2 — was colliding with Squarespace's own top nav.
    // The kicker below ("M1 · Finance Fundamentals") + the meta strip already convey module + position.

    // Hero (editorial, no card) — clean kicker without "The X module" awkwardness
    html += '<div class="mr5-hero">';
    var modTitle = (mod && mod.title || '').replace(/^Module \d+:\s*/, '');
    html += '<div class="mr5-hero-kicker">' + esc(lesson.module_id) + ' · ' + esc(modTitle) + '</div>';
    html += '<h1>' + esc(lesson.title) + '</h1>';
    // Diagnostic match-source is logged to console only — not visible on the page
    if (lesson._matchSource) {
      try { console.log('[MR v6.2 match]', sqSlug, '→', lesson.id, '·', lesson._matchSource); } catch (e) {}
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

    // Notes — directly below the video so students can take notes while watching
    var noteHint = 'Your notes for ' + esc(lesson.id) + ' — what clicked, what didn’t, what to revisit. Saved to your account.';
    var statusInit = memberId() === 'guest' ? 'guest' : '';
    var statusLabel = memberId() === 'guest' ? 'Sign in to sync notes (local only)' : 'Loading…';
    html += '<div class="mr5-sec" data-mrv6-notes="1">' +
      '<div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Your notes</h2><span class="mr5-kicker">Saved to your account</span></div>' +
      '<div class="mr5-notes">' +
        '<textarea class="mr5-notes-textarea" data-mr-notes-input="1" placeholder="' + noteHint + '" spellcheck="true"></textarea>' +
        '<div class="mr5-notes-bar">' +
          '<span class="mr5-notes-status ' + statusInit + '" data-mr-notes-status="1">' + statusLabel + '</span>' +
          '<span>Member: <a href="/course-dashboard" data-mr-member-label>' + esc(memberId()) + '</a></span>' +
        '</div>' +
      '</div>' +
      '</div>';

    // 02 Listen
    if (lesson.audio_overview_url || lesson.audio_url) {
      html += '<div class="mr5-sec"><div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Listen</h2><span class="mr5-kicker">Audio</span></div>';
      if (lesson.audio_overview_url) {
        html += '<div class="mr5-audio-row"><div><div class="mr5-audio-label">Audio overview</div><span class="mr5-audio-sub">Concept walkthrough</span></div>' + audioPlayer(lesson.audio_overview_url, 'audio/mp4') + '</div>';
      }
      if (lesson.audio_url) {
        var songLabel = lesson.song_title ? esc(lesson.song_title) : 'The song';
        html += '<div class="mr5-song-block">';
        html += '<div class="mr5-audio-row"><div><div class="mr5-audio-label" style="font-style:italic;">"' + songLabel + '"</div><span class="mr5-audio-sub">Song · original track</span></div>' + audioPlayer(lesson.audio_url, 'audio/mpeg') + '</div>';
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

    // 05 Deeper Dive (if lesson has deep_dive content)
    if (lesson.deep_dive && lesson.deep_dive.trim()) {
      html += '<div class="mr5-sec" data-mrv6-deepdive="1">' +
        '<div class="mr5-sec-h"><span class="mr5-num">' + num() + '</span><h2>Deeper dive</h2><span class="mr5-kicker">Behind the concept</span></div>' +
        '<div class="mr5-deepdive">' + mdLite(lesson.deep_dive) + '</div>' +
        '</div>';
    }

    // Resources
    html += buildResources(lesson, mod);

    // Certificate / outro
    html += '<div class="mr5-cert" data-cert="1">';
    if (logoUrl) html += '<img src="' + esc(logoUrl) + '" alt="MBA Rock">';
    html += '<div class="mr5-cert-h">Lesson ' + prog.position + ' of ' + prog.total + ' · ' + esc(lesson.module_id) + '</div>';
    html += '<h3 data-cert-title="1">When you’re done</h3>';
    html += '<p data-cert-body="1">Mark this lesson complete to lock in the playbook and unlock the next track. Your full curriculum certificate is built one lesson at a time.</p>';
    html += '</div>';

    // Break Room — opens the arcade in an inline modal (no Content-Type issues from external host)
    html += '<div class="mr5-arcade-row"><button type="button" class="mr5-arcade-btn" data-mr-arcade="1"><span class="mr5-arcade-icon">🕹</span><span><span class="mr5-arcade-l">Need a break?</span><span class="mr5-arcade-s">Step into <b>The Arcade</b> — Whack-a-Vanity-Metric, 30 seconds, no business cards required.</span></span><span class="mr5-arcade-chev">→</span></button></div>';

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

      // v6.5: swap the static logo for the animated logo video — plays once on lesson completion.
      var img = cert.querySelector('img');
      if (img && !cert.querySelector('video[data-cert-video]')) {
        var v = document.createElement('video');
        v.setAttribute('data-cert-video', '1');
        v.src = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/video/brand/mba-rock-logo-video.mp4';
        v.poster = 'https://raw.githubusercontent.com/joshwark/mbarock-cdn/main/images/brand/mba-rock-logo-poster.jpg';
        v.setAttribute('playsinline', '');
        v.preload = 'auto';
        v.style.cssText = 'width:280px;max-width:80%;height:auto;margin:0 auto 24px;display:block;border-radius:6px;';
        // Try unmuted first (user gesture from button click should allow it)
        v.muted = false;
        img.replaceWith(v);
        var playPromise = v.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function() {
            // Autoplay-with-audio blocked. Fall back to muted autoplay.
            v.muted = true;
            v.play().catch(function(){});
          });
        }
      }
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
      // Concept disclosure
      var conceptBtn = t.closest && t.closest('[data-concept-toggle="1"]');
      if (conceptBtn) {
        var row = conceptBtn.closest('.mr5-concept-row');
        var panel = row && row.querySelector('.mr5-concept-panel');
        if (panel) {
          var open = panel.classList.toggle('open');
          conceptBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (open) renderMath(panel);
        }
      }
      // Arcade button — opens the inline game modal
      var arcadeBtn = t.closest && t.closest('[data-mr-arcade="1"]');
      if (arcadeBtn) { openArcadeModal(); }
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
    wireNotes(lesson, newSection);

    try {
      if (localStorage.getItem('mr-lesson-complete:' + lesson.id)) markComplete(lesson, newSection);
    } catch (e) {}

    // Render LaTeX in the deeper-dive section (if present)
    var deepEl = newSection.querySelector('.mr5-deepdive');
    if (deepEl) renderMath(deepEl);

    document.body && document.body.setAttribute('data-mr-v5-applied', '1');
    console.log('[MBA v6] hid', bodySections.length, 'old sections; rendered premium layout for', lesson.id);
    return true;
  }

  // ── Notes — perpetual per-account journal via Supabase upsert ──
  function wireNotes(lesson, container) {
    var input = container.querySelector('[data-mr-notes-input="1"]');
    var statusEl = container.querySelector('[data-mr-notes-status="1"]');
    if (!input || !statusEl) return;
    var mid = memberId();
    var saveTimer = null;
    var lastSaved = '';

    function setStatus(state, text) {
      statusEl.className = 'mr5-notes-status ' + (state || '');
      statusEl.textContent = text;
    }

    // 1. Hydrate — pull notes from Supabase if signed in, else local cache
    var localKey = 'mr-notes:' + mid + ':' + lesson.id;
    var localCache = '';
    try { localCache = localStorage.getItem(localKey) || ''; } catch (e) {}

    if (mid === 'guest') {
      setStatus('guest', 'Sign in to sync notes (local only)');
      input.value = localCache;
      lastSaved = localCache;
    } else {
      input.value = localCache; // optimistic from local
      lastSaved = localCache;
      setStatus('saving', 'Loading…');
      var url = SUPABASE_URL + '/rest/v1/user_notes?select=notes,updated_at&member_id=eq.' + encodeURIComponent(mid) + '&lesson_id=eq.' + encodeURIComponent(lesson.id);
      fetch(url, { headers: SB_HDR })
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(rows) {
          if (rows && rows.length && rows[0].notes != null) {
            input.value = rows[0].notes;
            lastSaved = rows[0].notes;
            try { localStorage.setItem(localKey, rows[0].notes); } catch (e) {}
          }
          setStatus('saved', 'Saved');
        })
        .catch(function(e) {
          console.warn('[MR v6 notes] pull failed', e);
          setStatus('error', 'Offline — local only');
        });
    }

    // 2. Auto-save on input — debounced 1.2s
    input.addEventListener('input', function() {
      if (saveTimer) clearTimeout(saveTimer);
      setStatus('saving', 'Saving…');
      try { localStorage.setItem(localKey, input.value); } catch (e) {}
      if (mid === 'guest') {
        // local only
        saveTimer = setTimeout(function() {
          lastSaved = input.value;
          setStatus('guest', 'Sign in to sync notes (local only)');
        }, 800);
        return;
      }
      saveTimer = setTimeout(function() {
        var body = [{
          member_id: mid,
          lesson_id: lesson.id,
          notes: input.value,
          updated_at: new Date().toISOString()
        }];
        fetch(SUPABASE_URL + '/rest/v1/user_notes?on_conflict=member_id,lesson_id', {
          method: 'POST', headers: SB_HDR, body: JSON.stringify(body)
        }).then(function(r) {
          if (r.ok) { lastSaved = input.value; setStatus('saved', 'Saved · ' + new Date().toLocaleTimeString().slice(0,5)); }
          else { setStatus('error', 'Save failed ('+r.status+')'); }
        }).catch(function(e) {
          console.warn('[MR v6 notes] push failed', e);
          setStatus('error', 'Offline — local only');
        });
      }, 1200);
    });

    // 3. Save on blur (immediate, no debounce)
    input.addEventListener('blur', function() {
      if (input.value === lastSaved) return;
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      try { localStorage.setItem(localKey, input.value); } catch (e) {}
      if (mid === 'guest') { lastSaved = input.value; return; }
      var body = [{ member_id: mid, lesson_id: lesson.id, notes: input.value, updated_at: new Date().toISOString() }];
      fetch(SUPABASE_URL + '/rest/v1/user_notes?on_conflict=member_id,lesson_id', {
        method: 'POST', headers: SB_HDR, body: JSON.stringify(body)
      }).then(function(r) {
        if (r.ok) { lastSaved = input.value; setStatus('saved', 'Saved'); }
        else { setStatus('error', 'Save failed'); }
      }).catch(function() { setStatus('error', 'Offline'); });
    });
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
