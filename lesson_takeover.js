// MBA Rock — Lesson Page Takeover v6.13 (2026-05-12)
// v6.13: module color spine — kicker + section numbers now read --mr5-accent (set per module).
//        Pulls mod.color from lessons.v2.json (M1-M10 each have a canonical color).
// v6.12: adds (a) inline Capstone forms on take_action items with capstone_field,
//             (b) per-lesson quiz block with 80% pass gate.
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

    // Inject CSS override into the embedded game so it fits the iframe gracefully on both mobile (✓) and desktop
    var gameHtml = ARCADE_GAME_HTML.replace(
      '</head>',
      '<style>' +
        'html,body{height:100%;margin:0;overflow:hidden;}' +
        'body{display:flex;align-items:stretch;justify-content:center;}' +
        // Cap width tighter on desktop so 3x3 squares fit vertically without overflow
        'main.app{max-width:680px;width:100%;padding:18px 24px 24px;min-height:0;height:100%;box-sizing:border-box;display:flex;flex-direction:column;}' +
        // Tighter title for shorter desktop viewports
        '.title{font-size:36px!important;margin-bottom:2px!important;}' +
        '.subtitle{font-size:15px!important;margin:0 0 18px!important;}' +
        // Smaller stat cards
        '.status{margin-bottom:14px!important;gap:10px;}' +
        '.stat{padding:10px 14px!important;}' +
        '.stat .v{font-size:24px!important;}' +
        // Grid: cap max-height so squares stay reasonable; center inside available space
        '.grid{flex:1 1 auto;min-height:0;align-content:center;max-width:520px;margin:0 auto;width:100%;gap:10px;}' +
        '.hole{aspect-ratio:1/1;}' +
        // Tighter tips row
        '.tips{margin:14px 0 0;font-size:11.5px;}' +
        // Wide-screen: keep things from getting ridiculous on big monitors
        '@media(min-width:1200px){main.app{max-width:720px;}}' +
        // Short height: shrink title aggressively to keep grid in view
        '@media(max-height:720px){.title{font-size:28px!important;}.subtitle{font-size:14px!important;margin-bottom:12px!important;}.status{margin-bottom:10px!important;}.stat .v{font-size:20px!important;}.tips{margin-top:10px;}.grid{max-width:460px;}}' +
      '</style></head>'
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

  // ── The Operator's Console — calculator gallery (inline modal) ──
  var CONSOLE_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>The Operator's Console \u00b7 MBA Rock</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css\">\n<style>\n:root{\n  --navy:#0B1F3A;\n  --ink:#0E1116;\n  --orange:#F26B1F;\n  --orange-soft:#FBE2D0;\n  --cream:#FAF8F5;\n  --paper:#FFFFFF;\n  --rule:#E5E0D6;\n  --green:#1d8444;\n  --red:#a01a1a;\n  --muted:#8a8a8a;\n}\n*{box-sizing:border-box;}\nhtml,body{margin:0;padding:0;background:var(--cream);color:var(--ink);font-family:'Inter',-apple-system,sans-serif;min-height:100%;}\nh1,h2,h3,h4{font-family:'Fraunces',serif;letter-spacing:-0.015em;color:var(--navy);margin:0;font-weight:600;}\n.eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--orange);font-weight:700;}\n\n.app{display:grid;grid-template-columns:300px 1fr;min-height:100vh;}\n\n/* Sidebar */\n.sidebar{background:var(--paper);border-right:1px solid var(--rule);padding:28px 22px;overflow-y:auto;max-height:100vh;position:sticky;top:0;}\n.brand{margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid var(--rule);}\n.brand h1{font-size:21px;line-height:1.15;margin-bottom:2px;}\n.brand p{margin:0;font-size:11px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;font-weight:600;}\n.search{margin-bottom:18px;position:relative;}\n.search input{width:100%;padding:11px 14px 11px 36px;border:1px solid var(--rule);border-radius:8px;font-family:'Inter',sans-serif;font-size:13.5px;background:var(--cream);color:var(--ink);}\n.search input:focus{outline:none;border-color:var(--orange);background:#fff;}\n.search::before{content:\"\u2315\";position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:16px;line-height:1;}\n.cat-group{margin-bottom:18px;}\n.cat-title{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:0 0 8px 4px;}\n.calc-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:7px;cursor:pointer;font-size:13.5px;color:var(--ink);transition:all .12s;border-left:2px solid transparent;}\n.calc-item:hover{background:var(--cream);}\n.calc-item.active{background:var(--navy);color:#fff;border-left-color:var(--orange);}\n.calc-item.active .calc-num{color:var(--orange);}\n.calc-item.disabled{opacity:0.4;cursor:not-allowed;}\n.calc-num{font-family:'Fraunces',serif;font-size:13px;font-weight:600;color:var(--orange);min-width:18px;}\n.calc-name{flex:1;line-height:1.3;}\n.manage-btn{width:100%;background:transparent;border:1px solid var(--rule);color:var(--navy);font-family:'Inter',sans-serif;font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:11px;border-radius:8px;cursor:pointer;margin-top:14px;transition:all .15s;}\n.manage-btn:hover{background:var(--navy);color:#fff;border-color:var(--navy);}\n\n/* Main content */\n.main{padding:48px 56px;overflow-y:auto;max-height:100vh;}\n.calc-header{margin-bottom:32px;padding-bottom:22px;border-bottom:1px solid var(--rule);}\n.calc-header .eyebrow{margin-bottom:8px;}\n.calc-header h2{font-size:42px;line-height:1.05;letter-spacing:-0.02em;margin-bottom:8px;}\n.calc-header .calc-desc{font-family:'Fraunces',serif;font-style:italic;color:#444;font-size:18px;line-height:1.5;max-width:680px;margin:0;}\n\n.calc-body{display:grid;grid-template-columns:1.1fr 1fr;gap:42px;}\n.calc-inputs h3{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:18px;}\n.field{margin-bottom:18px;}\n.field label{display:block;font-family:'Fraunces',serif;font-size:16px;color:var(--navy);font-weight:500;margin-bottom:6px;}\n.field .field-hint{display:block;font-size:11.5px;color:var(--muted);margin-bottom:8px;line-height:1.4;}\n.field input,.field select,.field textarea{width:100%;padding:13px 16px;border:1px solid var(--rule);border-radius:8px;font-family:'Inter',sans-serif;font-size:15.5px;background:#fff;font-variant-numeric:tabular-nums;color:var(--ink);}\n.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--orange);}\n.field .row{display:flex;gap:10px;align-items:center;}\n.field .prefix{font-family:'Fraunces',serif;font-size:18px;color:var(--muted);min-width:18px;font-variant-numeric:tabular-nums;}\n\n.calc-output{background:var(--paper);border:1px solid var(--rule);border-radius:14px;padding:32px 30px;align-self:flex-start;position:sticky;top:48px;}\n.output-l{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:14px;}\n.output-v{font-family:'Fraunces',serif;font-size:64px;line-height:1;color:var(--navy);font-weight:600;letter-spacing:-0.03em;margin-bottom:8px;font-variant-numeric:tabular-nums;}\n.output-v small{font-size:24px;color:var(--muted);font-weight:400;margin-left:4px;}\n.output-sub{font-family:'Fraunces',serif;font-size:18px;font-style:italic;color:var(--orange);line-height:1.4;margin-bottom:24px;}\n.output-extras{display:grid;gap:10px;padding-top:18px;border-top:1px solid var(--rule);font-size:13.5px;}\n.output-extras .row{display:flex;justify-content:space-between;align-items:baseline;}\n.output-extras .row .k{color:var(--muted);font-weight:500;font-size:12px;letter-spacing:.05em;}\n.output-extras .row .v{font-family:'Fraunces',serif;color:var(--navy);font-weight:600;font-variant-numeric:tabular-nums;font-size:17px;}\n\n.formula{margin:18px 0 24px;padding:18px 22px;background:var(--cream);border-left:3px solid var(--orange);border-radius:0 6px 6px 0;font-size:1.05em;overflow-x:auto;}\n.interpretation{margin-top:28px;padding-top:22px;border-top:1px solid var(--rule);}\n.interpretation .l{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:10px;}\n.interpretation p{font-family:'Fraunces',serif;font-size:17px;line-height:1.55;color:var(--ink);margin:0 0 12px;}\n\n.save-row{display:flex;gap:10px;align-items:center;margin-top:24px;padding-top:22px;border-top:1px solid var(--rule);}\n.save-row input{flex:1;padding:10px 14px;border:1px solid var(--rule);border-radius:7px;font-family:'Inter',sans-serif;font-size:13px;}\n.save-row button{background:var(--navy);color:#fff;border:0;padding:10px 18px;font-family:'Inter',sans-serif;font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;border-radius:7px;cursor:pointer;transition:all .15s;}\n.save-row button:hover{background:var(--orange);}\n\n.lesson-link{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font-family:'Inter',sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy);text-decoration:none;font-weight:600;border-bottom:1px solid var(--rule);padding-bottom:1px;}\n.lesson-link:hover{color:var(--orange);border-color:var(--orange);}\n\n.saved-list{margin-top:18px;padding-top:18px;border-top:1px solid var(--rule);}\n.saved-list .l{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;}\n.saved-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--cream);font-size:13px;}\n.saved-item:last-child{border-bottom:0;}\n.saved-item .name{font-family:'Fraunces',serif;font-size:14px;color:var(--navy);font-weight:500;cursor:pointer;}\n.saved-item .name:hover{color:var(--orange);}\n.saved-item .meta{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums;}\n.saved-item .del{background:transparent;border:0;color:var(--muted);cursor:pointer;font-size:14px;padding:4px 8px;}\n.saved-item .del:hover{color:var(--red);}\n\n.welcome{padding:32px 0;}\n.welcome h2{font-size:36px;margin-bottom:8px;}\n.welcome p{font-family:'Fraunces',serif;font-style:italic;font-size:18px;color:#444;line-height:1.5;max-width:640px;margin:0 0 28px;}\n.welcome-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:18px;}\n.welcome-card{background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:18px 20px;cursor:pointer;transition:all .15s;}\n.welcome-card:hover{border-color:var(--orange);transform:translateY(-2px);box-shadow:0 12px 24px -10px rgba(11,31,58,0.1);}\n.welcome-card .cat-mini{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:6px;}\n.welcome-card .name-mini{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--navy);line-height:1.2;margin-bottom:4px;}\n.welcome-card .desc-mini{font-size:12.5px;color:var(--muted);line-height:1.4;}\n\n/* Manage drawer */\n.manage-modal{position:fixed;inset:0;background:rgba(14,17,22,0.8);z-index:10;display:none;align-items:center;justify-content:center;padding:20px;}\n.manage-modal.open{display:flex;}\n.manage-card{background:#fff;border-radius:14px;max-width:680px;width:100%;max-height:85vh;display:flex;flex-direction:column;}\n.manage-card .head{padding:24px 28px;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;}\n.manage-card .head h3{font-size:22px;}\n.manage-card .head .close{background:transparent;border:1px solid var(--rule);padding:8px 14px;border-radius:30px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;cursor:pointer;}\n.manage-card .body{padding:20px 28px;overflow-y:auto;flex:1;}\n.manage-cat-group{margin-bottom:18px;}\n.manage-cat-title{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:8px;}\n.manage-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--cream);}\n.manage-row .lbl{flex:1;font-family:'Fraunces',serif;font-size:16px;color:var(--navy);}\n.manage-row .src{font-size:11px;color:var(--muted);letter-spacing:.06em;}\n.toggle{position:relative;width:42px;height:24px;background:#ccc;border-radius:30px;cursor:pointer;transition:background .15s;flex-shrink:0;}\n.toggle.on{background:var(--orange);}\n.toggle::after{content:\"\";position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:3px;left:3px;transition:left .15s;}\n.toggle.on::after{left:21px;}\n\n@media(max-width:900px){\n  .app{grid-template-columns:1fr;}\n  .sidebar{position:relative;max-height:none;}\n  .main{padding:28px 22px;}\n  .calc-header h2{font-size:30px;}\n  .calc-body{grid-template-columns:1fr;gap:24px;}\n  .calc-output{position:static;}\n  .output-v{font-size:48px;}\n}\n</style>\n</head>\n<body>\n<main class=\"app\">\n  <aside class=\"sidebar\">\n    <div class=\"brand\">\n      <h1>The Operator's Console</h1>\n      <p>MBA Rock \u00b7 for the field</p>\n    </div>\n    <div class=\"search\">\n      <input type=\"text\" id=\"search\" placeholder=\"Search calculators\u2026\">\n    </div>\n    <div id=\"calcList\"></div>\n    <button class=\"manage-btn\" id=\"manageBtn\">\u2699 Manage calculators</button>\n  </aside>\n\n  <section class=\"main\" id=\"mainContent\">\n    <div class=\"welcome\">\n      <div class=\"eyebrow\">Welcome back</div>\n      <h2>Pick a calculator. Plug in your numbers.</h2>\n      <p>Every equation from the course, ready to use against your real data. Choose from the sidebar, or jump straight to the essentials below.</p>\n      <div class=\"welcome-grid\" id=\"welcomeGrid\"></div>\n    </div>\n  </section>\n</main>\n\n<div class=\"manage-modal\" id=\"manageModal\">\n  <div class=\"manage-card\">\n    <div class=\"head\">\n      <h3>Manage Calculators</h3>\n      <button class=\"close\" id=\"manageClose\">Close \u00d7</button>\n    </div>\n    <div class=\"body\" id=\"manageBody\"></div>\n  </div>\n</div>\n\n<script>\nconsole.log('[Operators Console] v1 loaded');\n\n// \u2500\u2500 Supabase config (same project as notes + progress) \u2500\u2500\nconst SB_URL = 'https://ciloqphtencjthkedanw.supabase.co';\nconst SB_KEY = 'sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-';\nconst SB_HDR = {\n  'apikey': SB_KEY,\n  'Authorization': 'Bearer ' + SB_KEY,\n  'Content-Type': 'application/json',\n  'Prefer': 'resolution=merge-duplicates,return=minimal'\n};\nfunction memberId() {\n  return localStorage.getItem('mba-rock-member-id') || 'guest';\n}\n\n// \u2500\u2500 Helpers \u2500\u2500\nconst fmt = {\n  money: v => '$' + Number(v).toLocaleString('en-US', {maximumFractionDigits: 0}),\n  pct: v => (v*100).toFixed(1) + '%',\n  num: (v, d=2) => Number(v).toFixed(d),\n  months: v => v === Infinity ? '\u221e months' : v.toFixed(1) + ' months',\n  years: v => v.toFixed(2) + ' yrs',\n  ratio: v => v.toFixed(2) + 'x',\n};\n\n// \u2500\u2500 Calculator registry \u2014 30+ calculators across all modules \u2500\u2500\nconst CATEGORIES = {\n  finance:   { label: 'Finance',           order: 1 },\n  marketing: { label: 'Marketing',         order: 2 },\n  operations:{ label: 'Operations',        order: 3 },\n  capital:   { label: 'Capital & Scaling', order: 4 },\n};\n\nconst CALCULATORS = [\n  // \u2500\u2500 FINANCE (M1) \u2500\u2500\n  {\n    id: 'runway', name: 'Cash Runway', category: 'finance', lessonId: 'M1L1', default: true,\n    desc: 'How many months you have before the cash runs out. The single most important number on the operator dashboard.',\n    formula: '\\\\text{Runway (months)} = \\\\dfrac{\\\\text{Cash on Hand}}{\\\\text{Monthly Net Burn}}',\n    fields: [\n      {name:'cash', label:'Cash on hand', hint:'Bank + short-term equivalents', prefix:'$', placeholder:'500000'},\n      {name:'burn', label:'Monthly net burn', hint:'Cash out \u2212 cash in, per month', prefix:'$', placeholder:'75000'},\n    ],\n    compute: ({cash, burn}) => {\n      const months = burn > 0 ? cash/burn : Infinity;\n      return { primary: months, primaryFmt: fmt.months, extras: [] };\n    },\n    interpret: ({primary: m}) => {\n      if (m === Infinity) return \"Profitable. You're not on a runway clock.\";\n      if (m >= 18) return 'Strategic optionality. Room to experiment, hire, and bet.';\n      if (m >= 12) return 'Healthy runway. Execute the plan, watch quarterly.';\n      if (m >= 6)  return 'Focus mode. Defer big bets; tighten the spend.';\n      if (m >= 3)  return 'Emergency. Raise this quarter or cut hard, now.';\n      return 'Critical. You have weeks, not months. Triage immediately.';\n    },\n  },\n  {\n    id: 'breakeven', name: 'Breakeven Analysis', category: 'finance', lessonId: 'M1L1.5', default: true,\n    desc: \"The volume \u2014 in units or revenue \u2014 where you exactly cover costs. The minimum business you need to keep the doors open.\",\n    formula: '\\\\text{Breakeven Units} = \\\\dfrac{\\\\text{Fixed Costs}}{\\\\text{Price} - \\\\text{Variable Cost per Unit}}',\n    fields: [\n      {name:'fixed', label:'Monthly fixed costs', hint:'Rent, salaries, software, etc.', prefix:'$', placeholder:'50000'},\n      {name:'price', label:'Price per unit', prefix:'$', placeholder:'100'},\n      {name:'vc', label:'Variable cost per unit', hint:'Materials, processing, commissions', prefix:'$', placeholder:'40'},\n      {name:'actual', label:'Actual monthly sales (units, optional)', prefix:'#', placeholder:'1200'},\n    ],\n    compute: ({fixed, price, vc, actual}) => {\n      const cm = price - vc;\n      const cmPct = price > 0 ? cm/price : 0;\n      const beUnits = cm > 0 ? fixed/cm : Infinity;\n      const beRev = beUnits * price;\n      const actualRev = (actual||0) * price;\n      const safety = actualRev > 0 ? (actualRev - beRev) / actualRev : null;\n      return {\n        primary: beUnits,\n        primaryFmt: v => v === Infinity ? '\u221e units' : Math.ceil(v).toLocaleString() + ' units',\n        extras: [\n          {k:'Contribution margin', v: fmt.money(cm) + ' / unit (' + fmt.pct(cmPct) + ')'},\n          {k:'Breakeven revenue', v: fmt.money(beRev)},\n          ...(safety !== null ? [{k:'Margin of safety', v: fmt.pct(safety)}] : []),\n        ],\n      };\n    },\n    interpret: ({primary: be, raw: {actual, price}}) => {\n      if (be === Infinity) return 'Contribution margin is zero or negative \u2014 every unit deepens the loss. Fix unit economics before scaling.';\n      const actualRev = (actual||0) * price;\n      const beRev = be * price;\n      if (actualRev === 0) return 'Run the calc with your current monthly volume in the optional field to see your safety margin.';\n      const ratio = actualRev / beRev;\n      if (ratio < 0.7) return 'You\\'re below breakeven. Cash reserves are funding operations \u2014 clock is ticking.';\n      if (ratio < 1.1) return 'Operating around breakeven. Sensitive to demand shocks.';\n      if (ratio < 1.5) return 'Comfortably above breakeven. Healthy operating zone.';\n      return 'Strong margin of safety. You can absorb a meaningful demand drop without losses.';\n    },\n  },\n  {\n    id: 'unit-economics', name: 'Unit Economics: LTV, CAC, Payback', category: 'finance', lessonId: 'M1L4', default: true,\n    desc: 'The full picture: lifetime value, customer acquisition cost, the ratio, and payback period. The single most-used unit-economics frame.',\n    formula: '\\\\text{LTV} = \\\\dfrac{\\\\text{ARPU} \\\\times \\\\text{GM}}{\\\\text{Monthly Churn}}, \\\\quad \\\\text{Payback} = \\\\dfrac{\\\\text{CAC}}{\\\\text{ARPU} \\\\times \\\\text{GM}}',\n    fields: [\n      {name:'arpu', label:'ARPU (monthly revenue per customer)', prefix:'$', placeholder:'100'},\n      {name:'gm', label:'Gross margin (%)', prefix:'%', placeholder:'70'},\n      {name:'churn', label:'Monthly churn (%)', prefix:'%', placeholder:'3'},\n      {name:'cac', label:'CAC (customer acquisition cost)', prefix:'$', placeholder:'500'},\n    ],\n    compute: ({arpu, gm, churn, cac}) => {\n      const gmRatio = gm/100;\n      const churnRatio = churn/100;\n      const monthlyGP = arpu * gmRatio;\n      const ltv = churnRatio > 0 ? monthlyGP/churnRatio : Infinity;\n      const ratio = cac > 0 ? ltv/cac : Infinity;\n      const payback = monthlyGP > 0 ? cac/monthlyGP : Infinity;\n      const lifetime = churnRatio > 0 ? 1/churnRatio : Infinity;\n      return {\n        primary: ratio,\n        primaryFmt: fmt.ratio,\n        primaryLabel: 'LTV : CAC',\n        extras: [\n          {k:'LTV (lifetime value)', v: fmt.money(ltv)},\n          {k:'CAC payback', v: fmt.months(payback)},\n          {k:'Avg customer lifetime', v: fmt.months(lifetime)},\n        ],\n      };\n    },\n    interpret: ({primary: r}) => {\n      if (r === Infinity) return 'Either CAC is zero (organic-only) or churn is zero (perfect retention). Verify the inputs.';\n      if (r < 1) return 'You lose money on every customer. Either CAC must drop, or LTV must rise. Not scalable as-is.';\n      if (r < 3) return 'Tight unit economics. Fragile under stress. Hold off on growth investment until ratio improves.';\n      if (r < 5) return 'Healthy. The venture standard. Scale carefully and watch retention.';\n      return 'Strong. You may be under-investing in growth \u2014 CAC could go higher and still pencil.';\n    },\n  },\n  {\n    id: 'rule-of-40', name: 'Rule of 40', category: 'capital', lessonId: 'M6L1', default: true,\n    desc: 'The public-market filter for SaaS health. Growth + profit margin should sum to 40+. Below means unhealthy mix.',\n    formula: '\\\\text{Rule of 40} = \\\\text{Growth Rate (\\\\%)} + \\\\text{Profit Margin (\\\\%)}',\n    fields: [\n      {name:'growth', label:'YoY revenue growth (%)', prefix:'%', placeholder:'45'},\n      {name:'margin', label:'Profit margin (%, can be negative)', prefix:'%', placeholder:'-10'},\n    ],\n    compute: ({growth, margin}) => {\n      const total = growth + margin;\n      return {\n        primary: total,\n        primaryFmt: v => v.toFixed(1) + '%',\n        extras: [\n          {k:'Growth contribution', v: growth.toFixed(1)+'%'},\n          {k:'Margin contribution', v: margin.toFixed(1)+'%'},\n        ],\n      };\n    },\n    interpret: ({primary: t}) => {\n      if (t >= 60) return 'Elite. Top-quartile public SaaS. Investors pay top multiples for this combination.';\n      if (t >= 40) return 'Healthy. You clear the bar. The mix between growth and margin is acceptable.';\n      if (t >= 25) return 'Below the bar. Either accelerate growth or improve margin. The combination needs work.';\n      return 'Unhealthy. Slow growth AND poor margins. Diagnose which is the bottleneck and fix it.';\n    },\n  },\n  {\n    id: 'wacc', name: 'WACC (Weighted Average Cost of Capital)', category: 'capital', lessonId: 'M6L2', default: true,\n    desc: 'The blended cost of all your capital. The hurdle rate every project must clear to create value.',\n    formula: '\\\\text{WACC} = \\\\dfrac{E}{V} \\\\cdot R_e + \\\\dfrac{D}{V} \\\\cdot R_d \\\\cdot (1 - T)',\n    fields: [\n      {name:'equity', label:'Equity (market value)', prefix:'$', placeholder:'10000000'},\n      {name:'debt', label:'Debt (book value)', prefix:'$', placeholder:'3000000'},\n      {name:'re', label:'Cost of equity (%)', hint:'For startups: 20-35%; mature: 8-15%', prefix:'%', placeholder:'12'},\n      {name:'rd', label:'Cost of debt (%)', hint:'Interest rate on borrowings', prefix:'%', placeholder:'6'},\n      {name:'tax', label:'Tax rate (%)', prefix:'%', placeholder:'25'},\n    ],\n    compute: ({equity, debt, re, rd, tax}) => {\n      const V = equity + debt;\n      if (V <= 0) return { primary: NaN, primaryFmt: ()=>'\u2014', extras: [] };\n      const wE = equity/V;\n      const wD = debt/V;\n      const wacc = wE * (re/100) + wD * (rd/100) * (1 - tax/100);\n      return {\n        primary: wacc,\n        primaryFmt: v => fmt.pct(v),\n        extras: [\n          {k:'Equity weight', v: fmt.pct(wE)},\n          {k:'Debt weight', v: fmt.pct(wD)},\n          {k:'After-tax cost of debt', v: fmt.pct(rd/100 * (1-tax/100))},\n        ],\n      };\n    },\n    interpret: ({primary: w}) => {\n      if (isNaN(w)) return 'Need positive total capital (equity + debt). Check your inputs.';\n      if (w >= 0.20) return 'High hurdle rate. Most projects will struggle to clear it. Bias toward returning cash to shareholders.';\n      if (w >= 0.12) return 'Typical late-stage / growth company WACC. Every project should clear this return or it destroys value.';\n      if (w >= 0.07) return 'Low cost of capital. Mature business range. Investment threshold is achievable.';\n      return 'Very low WACC \u2014 either heavily debt-financed at low rates, or a stable mature business with cheap equity.';\n    },\n  },\n  {\n    id: 'operating-leverage', name: 'Operating Leverage (DOL)', category: 'finance', lessonId: 'M1L4.5', default: true,\n    desc: 'How sensitive your profit is to revenue changes. High DOL = small revenue shifts cause big profit swings \u2014 in both directions.',\n    formula: '\\\\text{DOL} = \\\\dfrac{\\\\text{Contribution Margin}}{\\\\text{EBIT}}',\n    fields: [\n      {name:'cm', label:'Contribution margin ($)', hint:'Revenue \u2212 variable costs', prefix:'$', placeholder:'500000'},\n      {name:'ebit', label:'EBIT (operating profit, $)', prefix:'$', placeholder:'100000'},\n      {name:'change', label:'Hypothetical revenue change (%)', hint:'+10 for a 10% increase, -10 for a decline', prefix:'%', placeholder:'10'},\n    ],\n    compute: ({cm, ebit, change}) => {\n      if (ebit === 0) return { primary: Infinity, primaryFmt: ()=>'\u221e', extras: [] };\n      const dol = cm/ebit;\n      const profitChange = dol * change;\n      return {\n        primary: dol,\n        primaryFmt: fmt.ratio,\n        extras: [\n          {k:'Revenue change', v: change.toFixed(1)+'%'},\n          {k:'\u2192 Profit change', v: (profitChange >= 0 ? '+' : '') + profitChange.toFixed(1)+'%'},\n        ],\n      };\n    },\n    interpret: ({primary: d}) => {\n      if (!isFinite(d)) return 'EBIT is zero or near-zero \u2014 DOL is undefined. Use it when there\\'s real operating profit to leverage.';\n      if (d >= 5) return 'Very high operating leverage. Small revenue moves cause huge profit swings. Powerful in growth; brutal in contraction.';\n      if (d >= 2.5) return 'Meaningful leverage. SaaS-typical. Growth drops disproportionately to profit.';\n      if (d >= 1.5) return 'Moderate leverage. Mixed cost structure. Profit moves somewhat faster than revenue.';\n      return 'Low operating leverage. Mostly variable costs. Profit tracks revenue closely \u2014 stable, but no scale magic.';\n    },\n  },\n  {\n    id: 'ccc', name: 'Cash Conversion Cycle', category: 'finance', lessonId: 'M1L3.5', default: true,\n    desc: 'Days between paying for inputs and getting paid for outputs. Shorter is better. Negative means customers fund your business.',\n    formula: '\\\\text{CCC} = \\\\text{DSO} + \\\\text{DIO} - \\\\text{DPO}',\n    fields: [\n      {name:'dso', label:'Days Sales Outstanding (DSO)', hint:'Avg days customers take to pay you', placeholder:'45'},\n      {name:'dio', label:'Days Inventory Outstanding (DIO)', hint:'0 for services / SaaS', placeholder:'30'},\n      {name:'dpo', label:'Days Payable Outstanding (DPO)', hint:'Avg days you take to pay suppliers', placeholder:'30'},\n    ],\n    compute: ({dso, dio, dpo}) => {\n      const ccc = dso + dio - dpo;\n      return {\n        primary: ccc,\n        primaryFmt: v => v.toFixed(0) + ' days',\n        extras: [\n          {k:'DSO contribution', v: '+' + dso + ' days'},\n          {k:'DIO contribution', v: '+' + dio + ' days'},\n          {k:'DPO offset', v: '\u2212' + dpo + ' days'},\n        ],\n      };\n    },\n    interpret: ({primary: c}) => {\n      if (c < 0) return 'Negative cash conversion cycle \u2014 your customers fund your business. SaaS/marketplace magic. Defend this advantage.';\n      if (c <= 30) return 'Tight cycle. Cash returns quickly. Healthy operating model.';\n      if (c <= 60) return 'Typical for B2B services. Worth pressure-testing DSO and DPO for improvement.';\n      if (c <= 120) return 'Long cycle. Significant working capital tied up. Focus on collections and supplier terms.';\n      return 'Very long cycle. Working capital is consuming the business. Either restructure terms or accept the financing cost.';\n    },\n  },\n  {\n    id: 'npv', name: 'NPV & Discounted Cash Flow', category: 'finance', lessonId: 'M1L3', default: true,\n    desc: 'Present value of a future cash flow stream, minus upfront cost. Positive NPV = creates value at your discount rate.',\n    formula: 'NPV = -C_0 + \\\\sum_{t=1}^{n} \\\\dfrac{C_t}{(1+r)^t}',\n    fields: [\n      {name:'initial', label:'Initial investment', hint:'Today\\'s outflow', prefix:'$', placeholder:'100000'},\n      {name:'cashflows', label:'Future annual cash flows', hint:'Comma-separated, e.g. 30000, 40000, 50000, 50000', placeholder:'30000, 40000, 50000, 50000', type:'text'},\n      {name:'rate', label:'Discount rate (%)', hint:'Your cost of capital / hurdle rate', prefix:'%', placeholder:'12'},\n    ],\n    compute: ({initial, cashflows, rate}) => {\n      const cfs = String(cashflows||'').split(/[,\\s]+/).map(s => parseFloat(s)).filter(x => !isNaN(x));\n      const r = rate/100;\n      let pv = 0;\n      cfs.forEach((cf, i) => { pv += cf / Math.pow(1+r, i+1); });\n      const npv = pv - initial;\n      // Approximate IRR via bisection\n      let irrLow = -0.99, irrHigh = 5, irr = NaN;\n      for (let i = 0; i < 50; i++) {\n        const mid = (irrLow + irrHigh) / 2;\n        let v = -initial;\n        cfs.forEach((cf, j) => { v += cf / Math.pow(1+mid, j+1); });\n        if (Math.abs(v) < 1) { irr = mid; break; }\n        if (v > 0) irrLow = mid; else irrHigh = mid;\n      }\n      if (isNaN(irr)) irr = (irrLow+irrHigh)/2;\n      return {\n        primary: npv,\n        primaryFmt: v => (v >= 0 ? '+' : '') + fmt.money(v),\n        extras: [\n          {k:'Cash flow count', v: cfs.length + ' periods'},\n          {k:'Sum of cash flows (undiscounted)', v: fmt.money(cfs.reduce((a,b)=>a+b,0))},\n          {k:'Implied IRR', v: fmt.pct(irr)},\n        ],\n      };\n    },\n    interpret: ({primary: n, raw:{rate}}) => {\n      if (n > 0) return 'Positive NPV at your ' + rate + '% discount rate. The project creates value. Do it.';\n      if (n === 0) return 'Exactly breakeven at this discount rate. Sensitive to assumptions \u2014 stress-test before committing.';\n      return 'Negative NPV at your ' + rate + '% discount rate. The project destroys value. Either find better cash flows or pass.';\n    },\n  },\n\n  // \u2500\u2500 PHASE 2 calculators \u2014 registered but mark as \"in progress\" (visible but with formula-only) \u2500\u2500\n  {\n    id: 'gross-margin', name: 'Gross Margin', category: 'finance', lessonId: 'M1L1', default: false,\n    desc: 'Revenue minus cost of goods, as a percentage. The ceiling on everything below it.',\n    formula: '\\\\text{Gross Margin} = \\\\dfrac{\\\\text{Revenue} - \\\\text{COGS}}{\\\\text{Revenue}}',\n    fields: [\n      {name:'revenue', label:'Revenue', prefix:'$', placeholder:'1000000'},\n      {name:'cogs', label:'Cost of goods sold (COGS)', prefix:'$', placeholder:'300000'},\n    ],\n    compute: ({revenue, cogs}) => {\n      const gp = revenue - cogs;\n      const gm = revenue > 0 ? gp/revenue : 0;\n      return { primary: gm, primaryFmt: fmt.pct, extras: [{k:'Gross profit', v: fmt.money(gp)}] };\n    },\n    interpret: ({primary: g}) => {\n      if (g >= 0.7) return 'Premium gross margin. Likely software, IP, or strong brand. Captures pricing power.';\n      if (g >= 0.4) return 'Healthy gross margin. Room for opex investment in growth.';\n      if (g >= 0.2) return 'Modest gross margin. Operating leverage is the path to profitability.';\n      return 'Thin gross margin. Commodity territory. Scale OR pricing differentiation are critical.';\n    },\n  },\n  {\n    id: 'free-cash-flow', name: 'Free Cash Flow', category: 'finance', lessonId: 'M1L1', default: false,\n    desc: 'Cash left after all operating expenses and capex. The cash that actually belongs to shareholders.',\n    formula: '\\\\text{FCF} = \\\\text{Operating Cash Flow} - \\\\text{CapEx}',\n    fields: [\n      {name:'ocf', label:'Operating cash flow', prefix:'$', placeholder:'500000'},\n      {name:'capex', label:'CapEx', prefix:'$', placeholder:'100000'},\n    ],\n    compute: ({ocf, capex}) => ({ primary: ocf - capex, primaryFmt: fmt.money, extras: [] }),\n    interpret: ({primary: f}) => f > 0 ? 'Positive FCF. Business funds itself.' : 'Negative FCF. Funded externally \u2014 runway watch applies.',\n  },\n  {\n    id: 'present-value', name: 'Present Value (single)', category: 'finance', lessonId: 'M1L3', default: false,\n    desc: 'What a single future cash payment is worth today, given your discount rate.',\n    formula: 'PV = \\\\dfrac{FV}{(1+r)^n}',\n    fields: [\n      {name:'fv', label:'Future value', prefix:'$', placeholder:'10000'},\n      {name:'rate', label:'Discount rate (%)', prefix:'%', placeholder:'10'},\n      {name:'n', label:'Years out', placeholder:'5'},\n    ],\n    compute: ({fv, rate, n}) => ({ primary: fv / Math.pow(1+rate/100, n), primaryFmt: fmt.money, extras: [{k:'Future value', v: fmt.money(fv)}, {k:'Years', v: n}] }),\n    interpret: ({primary, raw:{fv}}) => 'A future $' + fv.toLocaleString() + ' is worth $' + Math.round(primary).toLocaleString() + ' today at this discount rate.',\n  },\n  {\n    id: 'conversion-funnel', name: 'Funnel Conversion (multi-stage)', category: 'marketing', lessonId: 'M4L3', default: false,\n    desc: 'Multiply each stage to get overall conversion. The bottleneck stage controls everything.',\n    formula: '\\\\text{Overall} = \\\\prod_{i} \\\\text{Stage}_i',\n    fields: [\n      {name:'rates', label:'Stage conversion rates (%, comma-separated)', hint:'e.g. 60, 15, 40, 70', placeholder:'60, 15, 40, 70', type:'text'},\n    ],\n    compute: ({rates}) => {\n      const stages = String(rates||'').split(/[,\\s]+/).map(s => parseFloat(s)/100).filter(x => !isNaN(x));\n      const overall = stages.reduce((a,b) => a*b, 1);\n      return { primary: overall, primaryFmt: fmt.pct, extras: stages.map((s,i) => ({k:'Stage ' + (i+1), v: fmt.pct(s)})) };\n    },\n    interpret: () => 'Find the lowest stage. Improving the bottleneck multiplies through the whole funnel \u2014 far cheaper than scaling top-of-funnel.',\n  },\n  {\n    id: 'price-elasticity', name: 'Price Elasticity', category: 'marketing', lessonId: 'M4L4', default: false,\n    desc: 'How much demand changes when price changes. |PED| > 1 = elastic (price-sensitive); < 1 = pricing power.',\n    formula: 'PED = \\\\dfrac{\\\\% \\\\Delta Q}{\\\\% \\\\Delta P}',\n    fields: [\n      {name:'dq', label:'% change in quantity demanded', prefix:'%', placeholder:'-15'},\n      {name:'dp', label:'% change in price', prefix:'%', placeholder:'10'},\n    ],\n    compute: ({dq, dp}) => ({ primary: dp !== 0 ? dq/dp : NaN, primaryFmt: v => isNaN(v) ? '\u2014' : v.toFixed(2), extras: [] }),\n    interpret: ({primary: e}) => {\n      if (isNaN(e)) return 'Need a non-zero price change to compute.';\n      const a = Math.abs(e);\n      if (a > 1) return 'Elastic demand. You have limited pricing power \u2014 raising prices loses revenue faster than it gains.';\n      if (a < 1) return 'Inelastic demand. You have pricing power \u2014 raises drop to profit.';\n      return 'Unit elastic. Revenue is unchanged by price moves in this range.';\n    },\n  },\n  {\n    id: 'littles-law', name: \"Little's Law\", category: 'operations', lessonId: 'M5L1', default: false,\n    desc: 'The fundamental equation of operations. WIP, throughput, and lead time are rigidly linked.',\n    formula: 'L = \\\\lambda \\\\times W',\n    fields: [\n      {name:'mode', label:'Solve for', type:'select', options:['Lead time (W)','WIP (L)','Throughput (\u03bb)']},\n      {name:'a', label:'Value 1', placeholder:'10'},\n      {name:'b', label:'Value 2', placeholder:'5'},\n    ],\n    compute: ({mode, a, b}) => {\n      let primary, label;\n      if (mode === 'Lead time (W)') { primary = b > 0 ? a/b : 0; label = 'Lead time'; }\n      else if (mode === 'WIP (L)') { primary = a*b; label = 'WIP'; }\n      else { primary = b > 0 ? a/b : 0; label = 'Throughput'; }\n      return { primary, primaryFmt: v => v.toFixed(2), primaryLabel: label, extras: [] };\n    },\n    interpret: () => 'WIP rises \u2192 lead time rises (if throughput held constant). Limit WIP to keep flow.',\n  },\n  {\n    id: 'tco', name: 'Total Cost of Ownership (Build vs Buy)', category: 'operations', lessonId: 'M5L5', default: false,\n    desc: 'Compare 3-5 year TCO of build vs buy. Naive price-tag comparisons mislead.',\n    formula: 'TCO_n = \\\\text{Initial} + n \\\\cdot \\\\text{Annual Maint} + \\\\text{Opportunity Cost}',\n    fields: [\n      {name:'initial', label:'Initial build cost', prefix:'$', placeholder:'200000'},\n      {name:'annual', label:'Annual maintenance cost', prefix:'$', placeholder:'80000'},\n      {name:'years', label:'Time horizon (years)', placeholder:'5'},\n      {name:'saas', label:'Comparable SaaS annual cost', prefix:'$', placeholder:'50000'},\n    ],\n    compute: ({initial, annual, years, saas}) => {\n      const buildTotal = initial + annual*years;\n      const buyTotal = saas*years;\n      const delta = buildTotal - buyTotal;\n      return {\n        primary: delta,\n        primaryFmt: v => (v>=0?'+':'-') + fmt.money(Math.abs(v)),\n        primaryLabel: 'Build \u2212 Buy',\n        extras: [\n          {k:'Build ' + years + '-yr TCO', v: fmt.money(buildTotal)},\n          {k:'Buy ' + years + '-yr TCO', v: fmt.money(buyTotal)},\n        ],\n      };\n    },\n    interpret: ({primary: d}) => d > 0 ? 'Build is more expensive over the horizon. Buy/partner unless the capability is core differentiation.' : 'Build is cheaper over the horizon \u2014 but only if the maintenance assumption holds. Re-evaluate annually.',\n  },\n  {\n    id: 'sharpe', name: 'Sharpe Ratio', category: 'capital', lessonId: 'M6L9', default: false,\n    desc: 'Return per unit of risk. Higher is better. Used for investment portfolio efficiency.',\n    formula: '\\\\text{Sharpe} = \\\\dfrac{R_p - R_f}{\\\\sigma_p}',\n    fields: [\n      {name:'rp', label:'Portfolio return (%)', prefix:'%', placeholder:'15'},\n      {name:'rf', label:'Risk-free rate (%)', prefix:'%', placeholder:'4'},\n      {name:'sigma', label:'Portfolio std deviation (%)', prefix:'%', placeholder:'12'},\n    ],\n    compute: ({rp, rf, sigma}) => ({ primary: sigma > 0 ? (rp-rf)/sigma : NaN, primaryFmt: v => isNaN(v) ? '\u2014' : v.toFixed(2), extras: [] }),\n    interpret: ({primary: s}) => {\n      if (isNaN(s)) return 'Need positive volatility.';\n      if (s >= 2) return 'Excellent risk-adjusted return.';\n      if (s >= 1) return 'Strong. Generally acceptable for active portfolios.';\n      if (s >= 0.5) return 'Modest. Not impressive vs. passive alternatives.';\n      return 'Poor risk-adjusted return. The volatility isn\\'t worth the return premium.';\n    },\n  },\n  {\n    id: 'expected-value', name: 'Expected Value', category: 'capital', lessonId: 'M6L8', default: false,\n    desc: 'Probability-weighted return across all outcomes. Positive EV bets compound over time.',\n    formula: 'EV = \\\\sum_i p_i \\\\cdot v_i',\n    fields: [\n      {name:'scenarios', label:'Scenarios (prob%/value pairs, semicolon-separated)', hint:'e.g. 30/1000000; 40/200000; 30/-100000', placeholder:'30/1000000; 40/200000; 30/-100000', type:'text'},\n    ],\n    compute: ({scenarios}) => {\n      const parts = String(scenarios||'').split(';').map(s => s.trim().split('/')).filter(x => x.length === 2);\n      let ev = 0, totalP = 0;\n      const rows = parts.map(([p,v]) => {\n        const prob = parseFloat(p)/100, val = parseFloat(v);\n        if (!isNaN(prob) && !isNaN(val)) { ev += prob*val; totalP += prob; return {p: prob, v: val}; }\n        return null;\n      }).filter(Boolean);\n      return {\n        primary: ev,\n        primaryFmt: fmt.money,\n        extras: [\n          {k:'Total probability', v: fmt.pct(totalP)},\n          ...rows.map((r,i) => ({k:'Scenario ' + (i+1) + ' (' + fmt.pct(r.p) + ')', v: fmt.money(r.v)})),\n        ],\n      };\n    },\n    interpret: ({primary: ev}) => ev > 0 ? 'Positive EV. Worth taking \u2014 but check that ruin risk (worst case) is survivable.' : 'Negative EV. Pass.',\n  },\n  {\n    id: 'pre-post-money', name: 'Pre/Post-Money Valuation & Dilution', category: 'capital', lessonId: 'M6L3', default: false,\n    desc: 'How much of the company you give up in a round.',\n    formula: '\\\\text{Dilution} = \\\\dfrac{\\\\text{New \\\\$}}{\\\\text{Pre} + \\\\text{New \\\\$}}',\n    fields: [\n      {name:'pre', label:'Pre-money valuation', prefix:'$', placeholder:'40000000'},\n      {name:'raise', label:'New investment', prefix:'$', placeholder:'10000000'},\n      {name:'before', label:'Founders ownership before (%)', prefix:'%', placeholder:'60'},\n    ],\n    compute: ({pre, raise, before}) => {\n      const post = pre + raise;\n      const dilution = post > 0 ? raise/post : 0;\n      const after = (before/100) * (1 - dilution);\n      return {\n        primary: dilution,\n        primaryFmt: fmt.pct,\n        primaryLabel: 'Dilution',\n        extras: [\n          {k:'Post-money', v: fmt.money(post)},\n          {k:'Founders before', v: fmt.pct(before/100)},\n          {k:'Founders after', v: fmt.pct(after)},\n        ],\n      };\n    },\n    interpret: ({primary: d}) => d < 0.15 ? 'Light dilution. Founder ownership well-preserved.' : d < 0.25 ? 'Standard dilution range for a healthy round.' : 'Heavy dilution. Check if the valuation justifies the give-up \u2014 or if smaller raise / better terms work.',\n  },\n];\n\n// \u2500\u2500 State \u2500\u2500\nlet activeId = null;\nlet userToggles = loadToggles(); // {id: bool}\nfunction loadToggles() {\n  try { return JSON.parse(localStorage.getItem('mr-console-toggles') || '{}'); } catch(e) { return {}; }\n}\nfunction saveToggles() {\n  try { localStorage.setItem('mr-console-toggles', JSON.stringify(userToggles)); } catch(e) {}\n}\nfunction isEnabled(c) {\n  return userToggles[c.id] !== undefined ? userToggles[c.id] : c.default;\n}\n\n// \u2500\u2500 Render sidebar \u2500\u2500\nfunction renderSidebar(filter='') {\n  const enabled = CALCULATORS.filter(c => isEnabled(c));\n  const filtered = filter ? enabled.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.desc.toLowerCase().includes(filter.toLowerCase())) : enabled;\n  const byCat = {};\n  filtered.forEach(c => { (byCat[c.category] = byCat[c.category] || []).push(c); });\n  const list = document.getElementById('calcList');\n  list.innerHTML = '';\n  Object.keys(CATEGORIES).sort((a,b) => CATEGORIES[a].order - CATEGORIES[b].order).forEach(cat => {\n    if (!byCat[cat]) return;\n    const grp = document.createElement('div');\n    grp.className = 'cat-group';\n    grp.innerHTML = '<div class=\"cat-title\">' + CATEGORIES[cat].label + '</div>';\n    byCat[cat].forEach((c, i) => {\n      const itm = document.createElement('div');\n      itm.className = 'calc-item' + (c.id === activeId ? ' active' : '');\n      itm.innerHTML = '<span class=\"calc-num\">\u00b7</span><span class=\"calc-name\">' + c.name + '</span>';\n      itm.addEventListener('click', () => selectCalc(c.id));\n      grp.appendChild(itm);\n    });\n    list.appendChild(grp);\n  });\n  if (filtered.length === 0) list.innerHTML = '<p style=\"color:var(--muted);font-size:13px;padding:0 8px;\">No matches. Try a different search or check the Manage menu to enable more calculators.</p>';\n}\n\n// \u2500\u2500 Render welcome \u2500\u2500\nfunction renderWelcome() {\n  const grid = document.getElementById('welcomeGrid');\n  grid.innerHTML = '';\n  CALCULATORS.filter(c => c.default).forEach(c => {\n    const card = document.createElement('div');\n    card.className = 'welcome-card';\n    card.innerHTML = '<div class=\"cat-mini\">' + CATEGORIES[c.category].label + '</div><div class=\"name-mini\">' + c.name + '</div><div class=\"desc-mini\">' + c.desc.slice(0,90) + (c.desc.length > 90 ? '\u2026' : '') + '</div>';\n    card.addEventListener('click', () => selectCalc(c.id));\n    grid.appendChild(card);\n  });\n}\n\n// \u2500\u2500 Render calculator \u2500\u2500\nfunction selectCalc(id) {\n  const c = CALCULATORS.find(x => x.id === id);\n  if (!c) return;\n  activeId = id;\n  renderSidebar(document.getElementById('search').value);\n  const main = document.getElementById('mainContent');\n  let html = '';\n  html += '<div class=\"calc-header\"><div class=\"eyebrow\">' + CATEGORIES[c.category].label + ' \u00b7 ' + c.lessonId + '</div>';\n  html += '<h2>' + c.name + '</h2>';\n  html += '<p class=\"calc-desc\">' + c.desc + '</p></div>';\n  html += '<div class=\"formula\" id=\"formulaDisplay\">' + c.formula + '</div>';\n  html += '<div class=\"calc-body\">';\n  html += '<div class=\"calc-inputs\"><h3>Inputs</h3>';\n  c.fields.forEach(f => {\n    html += '<div class=\"field\"><label>' + f.label + '</label>';\n    if (f.hint) html += '<span class=\"field-hint\">' + f.hint + '</span>';\n    if (f.type === 'text') {\n      html += '<textarea data-field=\"' + f.name + '\" rows=\"2\" placeholder=\"' + (f.placeholder||'') + '\"></textarea>';\n    } else if (f.type === 'select') {\n      html += '<select data-field=\"' + f.name + '\">' + f.options.map(o => '<option>' + o + '</option>').join('') + '</select>';\n    } else {\n      html += '<div class=\"row\">' + (f.prefix ? '<span class=\"prefix\">' + f.prefix + '</span>' : '') + '<input type=\"number\" step=\"any\" data-field=\"' + f.name + '\" placeholder=\"' + (f.placeholder||'') + '\"></div>';\n    }\n    html += '</div>';\n  });\n  html += '</div>';\n  // Output column\n  html += '<div class=\"calc-output\">';\n  html += '<div class=\"output-l\" id=\"outputLabel\">' + (c.fields[0] ? 'Result' : '') + '</div>';\n  html += '<div class=\"output-v\" id=\"outputValue\">\u2014</div>';\n  html += '<div class=\"output-sub\" id=\"outputInterp\"></div>';\n  html += '<div class=\"output-extras\" id=\"outputExtras\"></div>';\n  html += '<div class=\"save-row\"><input type=\"text\" id=\"saveName\" placeholder=\"Name this scenario (e.g. Q4 plan)\"><button id=\"saveBtn\">Save</button></div>';\n  html += '<a class=\"lesson-link\" id=\"lessonLink\" target=\"_blank\" rel=\"noopener\">From ' + c.lessonId + ' \u2192</a>';\n  html += '<div class=\"saved-list\"><div class=\"l\">Saved scenarios</div><div id=\"savedItems\"></div></div>';\n  html += '</div></div>';\n  main.innerHTML = html;\n  // Render formula via KaTeX\n  if (window.katex) {\n    try { window.katex.render(c.formula, document.getElementById('formulaDisplay'), {throwOnError:false, displayMode:true}); }\n    catch(e) {}\n  }\n  // Wire input listeners\n  document.querySelectorAll('[data-field]').forEach(el => el.addEventListener('input', () => recompute(c)));\n  // Save button\n  document.getElementById('saveBtn').addEventListener('click', () => saveScenario(c));\n  // Lesson link \u2014 point back to dashboard / lesson if available\n  const link = document.getElementById('lessonLink');\n  link.href = '/course-dashboard'; // generic fallback; will be member's home for the course\n  // Load saved scenarios\n  loadSavedScenarios(c);\n  recompute(c);\n}\n\nfunction recompute(c) {\n  const inputs = {};\n  c.fields.forEach(f => {\n    const el = document.querySelector('[data-field=\"' + f.name + '\"]');\n    if (!el) return;\n    if (f.type === 'text' || f.type === 'select') inputs[f.name] = el.value;\n    else inputs[f.name] = parseFloat(el.value) || 0;\n  });\n  const allFilled = c.fields.every(f => {\n    const v = inputs[f.name];\n    if (f.type === 'text' || f.type === 'select') return v && String(v).trim().length > 0;\n    return v !== 0 || document.querySelector('[data-field=\"' + f.name + '\"]').value !== '';\n  });\n  if (!allFilled) {\n    document.getElementById('outputValue').textContent = '\u2014';\n    document.getElementById('outputInterp').textContent = '';\n    document.getElementById('outputExtras').innerHTML = '';\n    return;\n  }\n  const result = c.compute(inputs);\n  result.raw = inputs;\n  document.getElementById('outputLabel').textContent = result.primaryLabel || 'Result';\n  document.getElementById('outputValue').innerHTML = result.primaryFmt(result.primary);\n  document.getElementById('outputInterp').textContent = c.interpret({primary: result.primary, raw: inputs});\n  document.getElementById('outputExtras').innerHTML = result.extras.map(e => '<div class=\"row\"><span class=\"k\">' + e.k + '</span><span class=\"v\">' + e.v + '</span></div>').join('');\n}\n\n// \u2500\u2500 Save scenarios via Supabase \u2500\u2500\nfunction saveScenario(c) {\n  const name = document.getElementById('saveName').value.trim();\n  if (!name) { alert('Give the scenario a name first.'); return; }\n  const inputs = {};\n  c.fields.forEach(f => {\n    const el = document.querySelector('[data-field=\"' + f.name + '\"]');\n    if (el) inputs[f.name] = el.value;\n  });\n  const mid = memberId();\n  const key = 'mr-console-saved:' + mid + ':' + c.id;\n  let local = [];\n  try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}\n  const scenario = { name, inputs, ts: Date.now() };\n  local.unshift(scenario);\n  try { localStorage.setItem(key, JSON.stringify(local.slice(0,10))); } catch(e){}\n  document.getElementById('saveName').value = '';\n  loadSavedScenarios(c);\n  // Sync to Supabase\n  if (mid !== 'guest') {\n    fetch(SB_URL + '/rest/v1/user_calc_scenarios?on_conflict=member_id,calc_id,name', {\n      method: 'POST', headers: SB_HDR,\n      body: JSON.stringify([{member_id: mid, calc_id: c.id, name, inputs, updated_at: new Date().toISOString()}])\n    }).catch(e => console.warn('[Console] Supabase save failed', e));\n  }\n}\nfunction loadSavedScenarios(c) {\n  const mid = memberId();\n  const key = 'mr-console-saved:' + mid + ':' + c.id;\n  let local = [];\n  try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}\n  const container = document.getElementById('savedItems');\n  if (!local.length) { container.innerHTML = '<p style=\"color:var(--muted);font-size:12px;font-style:italic;margin:6px 0;\">None saved yet.</p>'; return; }\n  container.innerHTML = local.map((s, i) => '<div class=\"saved-item\"><span class=\"name\" data-idx=\"' + i + '\">' + escapeHtml(s.name) + '</span><span class=\"meta\">' + new Date(s.ts).toLocaleDateString() + '</span><button class=\"del\" data-del=\"' + i + '\">\u00d7</button></div>').join('');\n  container.querySelectorAll('.name').forEach(el => el.addEventListener('click', () => {\n    const idx = parseInt(el.dataset.idx);\n    const s = local[idx];\n    c.fields.forEach(f => {\n      const inp = document.querySelector('[data-field=\"' + f.name + '\"]');\n      if (inp && s.inputs[f.name] !== undefined) inp.value = s.inputs[f.name];\n    });\n    recompute(c);\n  }));\n  container.querySelectorAll('.del').forEach(el => el.addEventListener('click', () => {\n    const idx = parseInt(el.dataset.del);\n    local.splice(idx, 1);\n    try { localStorage.setItem(key, JSON.stringify(local)); } catch(e){}\n    loadSavedScenarios(c);\n  }));\n}\nfunction escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }\n\n// \u2500\u2500 Manage modal \u2500\u2500\nfunction renderManageModal() {\n  const body = document.getElementById('manageBody');\n  body.innerHTML = '';\n  Object.keys(CATEGORIES).sort((a,b) => CATEGORIES[a].order - CATEGORIES[b].order).forEach(cat => {\n    const calcs = CALCULATORS.filter(c => c.category === cat);\n    if (!calcs.length) return;\n    const grp = document.createElement('div');\n    grp.className = 'manage-cat-group';\n    grp.innerHTML = '<div class=\"manage-cat-title\">' + CATEGORIES[cat].label + '</div>';\n    calcs.forEach(c => {\n      const row = document.createElement('div');\n      row.className = 'manage-row';\n      const enabled = isEnabled(c);\n      row.innerHTML = '<span class=\"lbl\">' + c.name + '</span><span class=\"src\">' + c.lessonId + '</span><div class=\"toggle ' + (enabled ? 'on' : '') + '\" data-id=\"' + c.id + '\"></div>';\n      grp.appendChild(row);\n    });\n    body.appendChild(grp);\n  });\n  body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => {\n    const id = t.dataset.id;\n    const c = CALCULATORS.find(x => x.id === id);\n    userToggles[id] = !isEnabled(c);\n    saveToggles();\n    t.classList.toggle('on');\n    renderSidebar(document.getElementById('search').value);\n  }));\n}\ndocument.getElementById('manageBtn').addEventListener('click', () => {\n  renderManageModal();\n  document.getElementById('manageModal').classList.add('open');\n});\ndocument.getElementById('manageClose').addEventListener('click', () => {\n  document.getElementById('manageModal').classList.remove('open');\n});\ndocument.getElementById('manageModal').addEventListener('click', e => {\n  if (e.target === document.getElementById('manageModal')) document.getElementById('manageModal').classList.remove('open');\n});\n\n// \u2500\u2500 Search \u2500\u2500\ndocument.getElementById('search').addEventListener('input', e => renderSidebar(e.target.value));\n\n// \u2500\u2500 KaTeX loader (lazy \u2014 only renders when a calc is opened) \u2500\u2500\n(function(){\n  const s = document.createElement('script');\n  s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';\n  document.head.appendChild(s);\n})();\n\n// \u2500\u2500 Init \u2500\u2500\nrenderSidebar();\nrenderWelcome();\n</script>\n</body>\n</html>\n";

  function openConsoleModal() {
    if (document.getElementById('mr5-console-modal')) return;
    var hostDoc = document;
    try {
      if (window.top && window.top !== window && window.top.document && window.top.document.body) hostDoc = window.top.document;
    } catch (e) {}
    var overlay = hostDoc.createElement('div');
    overlay.id = 'mr5-console-modal';
    overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;background:rgba(14,17,22,0.94);z-index:2147483646;display:flex;flex-direction:column;padding:14px;box-sizing:border-box;backdrop-filter:blur(6px);';
    overlay.innerHTML = '<div style="flex:0 0 auto;display:flex;justify-content:flex-end;margin-bottom:10px;"><button type="button" id="mr5-console-close" style="background:transparent;border:1px solid #555;color:#fff;font-family:Inter,sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:10px 18px;border-radius:30px;cursor:pointer;">Close ×</button></div><iframe id="mr5-console-frame" style="flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;border-radius:12px;background:#FAF8F5;display:block;"></iframe>';
    hostDoc.body.appendChild(overlay);
    hostDoc.body.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    overlay.querySelector('#mr5-console-frame').srcdoc = CONSOLE_HTML;
    overlay.querySelector('#mr5-console-close').addEventListener('click', closeConsoleModal);
    document.addEventListener('keydown', escCloseConsole);
    overlay._hostDoc = hostDoc;
  }
  function closeConsoleModal() {
    var o = document.getElementById('mr5-console-modal');
    if (o) {
      var hostDoc = o._hostDoc || document;
      o.remove();
      try { hostDoc.body.style.overflow = ''; } catch(e){}
      document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', escCloseConsole);
  }
  function escCloseConsole(e) { if (e.key === 'Escape') closeConsoleModal(); }


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
    .mr5-hero-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--mr5-accent, ${c.orange});margin:0 0 22px;}
    .mr5-hero-kicker::before{content:"";width:36px;height:1.5px;background:var(--mr5-accent, ${c.orange});}
    .mr5-hero h1{font-size:54px;line-height:1.05;margin:0 0 22px;color:${c.navy};font-weight:600;letter-spacing:-0.028em;}
    .mr5-hero-sub{font-family:"Fraunces",serif;font-size:21px;font-weight:400;line-height:1.45;color:#3a3a3a;max-width:780px;margin:0 0 30px;font-style:italic;letter-spacing:-0.005em;}
    .mr5-hero-meta{display:flex;gap:36px;flex-wrap:wrap;padding:18px 0;border-top:1px solid ${c.rule};border-bottom:1px solid ${c.rule};font-size:12px;color:#555;}
    .mr5-hero-meta div{display:flex;flex-direction:column;gap:4px;}
    .mr5-hero-meta .mr5-meta-l{font-size:10.5px;text-transform:uppercase;letter-spacing:.14em;color:#999;font-weight:600;}
    .mr5-hero-meta .mr5-meta-v{font-family:"Fraunces",serif;font-size:18px;color:${c.navy};font-weight:500;}

    /* Section: clean editorial blocks, no white cards */
    .mr5-sec{margin:0 0 60px;position:relative;}
    .mr5-sec-h{display:flex;align-items:baseline;gap:18px;margin:0 0 22px;padding:0 0 14px;border-bottom:1px solid ${c.rule};}
    .mr5-sec-h .mr5-num{font-family:"Fraunces",serif;font-size:36px;color:var(--mr5-accent, ${c.orange});font-weight:600;line-height:1;letter-spacing:-0.02em;}
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

    /* Capstone-inline (Take Action items that build the Business Plan) */
    .mr5-capstone-contrib{background:#F6F1E8;border-left:3px solid ${c.orange};padding:14px 18px;border-radius:0 6px 6px 0;margin:0 0 22px;font-family:"Inter",sans-serif;font-size:13.5px;color:${c.ink};line-height:1.5;}
    .mr5-capstone-contrib b{color:${c.orange};font-weight:700;}
    .mr5-capstone-contrib .mr5-cap-fields{display:block;margin-top:4px;font-family:"Fraunces",serif;font-size:14px;color:${c.navy};font-weight:500;letter-spacing:.02em;}
    .mr5-action-capstone{grid-column:2 / span 2;grid-row:2;margin-top:10px;background:#fff;border:1px solid ${c.rule};border-left:3px solid ${c.orange};border-radius:0 8px 8px 0;padding:14px 18px;}
    .mr5-cap-label{font-family:"Inter",sans-serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${c.orange};font-weight:700;margin-bottom:8px;}
    .mr5-cap-label b{color:${c.orange};font-weight:700;}
    .mr5-cap-input{width:100%;padding:10px 14px;border:1px solid ${c.rule};border-radius:6px;font-family:"Inter",sans-serif;font-size:14.5px;line-height:1.5;background:#fff;color:${c.ink};}
    .mr5-cap-input:focus{outline:none;border-color:${c.orange};}
    .mr5-cap-input.long{min-height:72px;resize:vertical;}
    .mr5-cap-status{font-family:"Inter",sans-serif;font-size:11px;color:#888;margin-top:6px;letter-spacing:.04em;display:flex;align-items:center;gap:6px;}
    .mr5-cap-status.saved{color:#1d8444;}
    .mr5-cap-status.saved::before{content:"";width:6px;height:6px;border-radius:50%;background:#1d8444;}
    .mr5-cap-status.saving{color:#d49f1c;}
    .mr5-cap-status.saving::before{content:"";width:6px;height:6px;border-radius:50%;background:#d49f1c;}

    /* Quiz block */
    .mr5-quiz-sec{background:#fff;border:1px solid ${c.rule};border-radius:14px;padding:32px 36px;margin-top:32px;}
    .mr5-quiz-intro{font-family:"Fraunces",serif;font-style:italic;color:#444;font-size:16px;margin:0 0 28px;line-height:1.5;}
    .mr5-quiz-passed{color:#1d8444;font-weight:600;font-style:normal;}
    .mr5-quiz-q{margin-bottom:26px;padding-bottom:26px;border-bottom:1px dashed ${c.rule};}
    .mr5-quiz-q:last-of-type{border-bottom:0;}
    .mr5-quiz-qn{font-family:"Fraunces",serif;font-size:17px;font-weight:500;color:${c.navy};margin-bottom:12px;line-height:1.5;letter-spacing:-0.005em;}
    .mr5-quiz-opts{display:grid;gap:8px;}
    .mr5-quiz-opt{display:grid;grid-template-columns:32px 32px 1fr;align-items:start;gap:10px;padding:11px 14px;border:1px solid ${c.rule};border-radius:8px;cursor:pointer;transition:all .12s;background:#fff;}
    .mr5-quiz-opt:hover{border-color:${c.orange};background:#FFF8F1;}
    .mr5-quiz-opt input[type="radio"]{margin:0;width:16px;height:16px;align-self:center;accent-color:${c.orange};}
    .mr5-quiz-letter{font-family:"Fraunces",serif;font-size:15px;font-weight:600;color:${c.orange};text-align:center;}
    .mr5-quiz-opttext{font-family:"Inter",sans-serif;font-size:14.5px;line-height:1.5;color:${c.ink};}
    .mr5-quiz-opt.correct{background:#e8f5ec;border-color:#1d8444;}
    .mr5-quiz-opt.correct .mr5-quiz-letter{color:#1d8444;}
    .mr5-quiz-opt.wrong{background:#fde9e7;border-color:#a01a1a;}
    .mr5-quiz-opt.wrong .mr5-quiz-letter{color:#a01a1a;}
    .mr5-quiz-feedback{display:none;margin-top:10px;padding:12px 16px;background:${c.cream};border-left:3px solid ${c.orange};border-radius:0 4px 4px 0;font-family:"Fraunces",serif;font-style:italic;font-size:14.5px;line-height:1.55;color:#444;}
    .mr5-quiz-feedback.show{display:block;}
    .mr5-quiz-cta{display:flex;align-items:center;gap:14px;margin-top:24px;padding-top:22px;border-top:1px solid ${c.rule};flex-wrap:wrap;}
    .mr5-quiz-result{font-family:"Fraunces",serif;font-size:18px;font-weight:600;color:${c.navy};margin-left:6px;}
    .mr5-quiz-result.pass{color:#1d8444;}
    .mr5-quiz-result.fail{color:${c.orange};}

    /* Locked next-lesson button (when quiz not passed) */
    .mr5-btn-locked{background:${c.rule}!important;color:#888!important;cursor:not-allowed;pointer-events:none;}
    .mr5-btn-locked::after{content:" 🔒";font-size:12px;}

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
  // ── Capstone inline form: a take_action item can be a string (no Capstone) OR an object {step, capstone_field, ...}
  function buildActions(arr) {
    if (!arr || !arr.length) return '<p class="mr5-empty">Action steps pending.</p>';
    var hasCap = arr.some(function(a){ return typeof a === 'object' && a && a.capstone_field; });
    var html = '';
    if (hasCap) {
      var fields = arr.filter(function(a){ return a && typeof a === 'object' && a.capstone_field; }).map(function(a){ return a.capstone_field; });
      html += '<div class="mr5-capstone-contrib">This lesson builds <b>' + fields.length + '</b> section' + (fields.length===1?'':'s') + ' of your business plan: <span class="mr5-cap-fields">' + fields.map(function(f){ return '§' + esc(f); }).join(' · ') + '</span></div>';
    }
    html += '<ol class="mr5-actions">' + arr.map(function(a, i){
      var step = (typeof a === 'object' && a) ? a.step : a;
      var capField = (typeof a === 'object' && a) ? a.capstone_field : null;
      var capLong = (typeof a === 'object' && a) ? (a.input_type !== 'short-text') : false;
      var html = '<li><span class="mr5-action-text">' + esc(step) + '</span><button class="mr5-check" data-action-idx="' + i + '" aria-label="Mark step complete"></button>';
      if (capField) {
        html += '<div class="mr5-action-capstone" data-cap-field="' + esc(capField) + '">' +
          '<div class="mr5-cap-label">Builds <b>§' + esc(capField) + '</b> in your Business Plan</div>' +
          '<' + (capLong ? 'textarea' : 'input type="text"') + ' class="mr5-cap-input ' + (capLong ? 'long' : '') + '" placeholder="Fill this in — it saves to your Capstone"></' + (capLong ? 'textarea' : 'input') + '>' +
          '<div class="mr5-cap-status" data-cap-status="' + esc(capField) + '">—</div>' +
          '</div>';
      }
      html += '</li>';
      return html;
    }).join('') + '</ol>';
    return html;
  }

  // ── Quiz block: 5 MCQs, 80% to pass, hard gate (disables next-lesson button until passed)
  function buildQuiz(lesson) {
    if (!lesson.quiz || !lesson.quiz.questions || !lesson.quiz.questions.length) return '';
    var passKey = 'mr-quiz-passed:' + memberId() + ':' + lesson.id;
    var alreadyPassed = false;
    try { alreadyPassed = !!localStorage.getItem(passKey); } catch(e){}
    var html = '<div class="mr5-sec mr5-quiz-sec" data-mrv6-quiz="1">' +
      '<div class="mr5-sec-h"><span class="mr5-num">⚐</span><h2>Comprehension check</h2><span class="mr5-kicker">Pass to unlock next</span></div>' +
      '<p class="mr5-quiz-intro">' + (alreadyPassed
        ? '<span class="mr5-quiz-passed">✓ Passed</span> — you can retake any time to refresh.'
        : 'Five questions on this lesson\'s core concepts. <b>4 of 5 to pass.</b> Retake as many times as you want.') + '</p>' +
      '<form class="mr5-quiz-form" data-quiz-form="1">';
    lesson.quiz.questions.forEach(function(q, qi){
      html += '<div class="mr5-quiz-q" data-q-idx="' + qi + '">' +
        '<div class="mr5-quiz-qn">Q' + (qi+1) + '. ' + esc(q.q) + '</div>' +
        '<div class="mr5-quiz-opts">' +
        q.options.map(function(opt, oi){
          return '<label class="mr5-quiz-opt"><input type="radio" name="q' + qi + '" value="' + oi + '">' +
            '<span class="mr5-quiz-letter">' + String.fromCharCode(65+oi) + '</span>' +
            '<span class="mr5-quiz-opttext">' + esc(opt) + '</span></label>';
        }).join('') +
        '</div>' +
        '<div class="mr5-quiz-feedback" data-q-feedback="' + qi + '"></div>' +
        '</div>';
    });
    html += '<div class="mr5-quiz-cta">' +
      '<button type="button" class="mr5-btn mr5-btn-primary" data-quiz-submit="1">Submit answers</button>' +
      '<button type="button" class="mr5-btn mr5-btn-ghost" data-quiz-retake="1" style="display:none;">Retake</button>' +
      '<div class="mr5-quiz-result" data-quiz-result="1"></div>' +
      '</div>';
    html += '</form>' +
      '</div>';
    return html;
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

    // v6.13.1 — Module color spine: every accent reads from --mr5-accent. Falls back to brand orange if module lacks color.
    // FIX 2026-05-12: c.orange was out of scope here — crashed renderPage(). Use literal hex.
    var modAccent = (mod && mod.color) || '#F26B1F';
    var html = '<div class="mr5" style="--mr5-accent:' + modAccent + ';">';

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

    // Quiz block (renders if lesson has quiz)
    html += buildQuiz(lesson);

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

    // The Capstone — your business, built across the course
    html += '<div class="mr5-arcade-row"><a class="mr5-arcade-btn mr5-capstone-btn" href="https://joshwark.github.io/mbarock-cdn/capstone/" target="_blank" rel="noopener"><span class="mr5-arcade-icon">⚐</span><span><span class="mr5-arcade-l">Build my Business</span><span class="mr5-arcade-s">Every Take Action becomes a section of <b>your</b> operating system. Finish the course and you have a launchable business — not just notes.</span></span><span class="mr5-arcade-chev">→</span></a></div>';

    // The Operator's Console — calculator gallery
    html += '<div class="mr5-arcade-row"><button type="button" class="mr5-arcade-btn mr5-console-btn" data-mr-console="1"><span class="mr5-arcade-icon">⚙</span><span><span class="mr5-arcade-l">The Operator&rsquo;s Console</span><span class="mr5-arcade-s">Every equation in the course, ready to run against <b>your</b> numbers. Save scenarios. Revisit weekly.</span></span><span class="mr5-arcade-chev">→</span></button></div>';

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
      // Operator's Console button
      var consoleBtn = t.closest && t.closest('[data-mr-console="1"]');
      if (consoleBtn) { openConsoleModal(); }
      // Quiz submit
      var qSubmit = t.closest && t.closest('[data-quiz-submit="1"]');
      if (qSubmit) { gradeQuiz(lesson, container); }
      // Quiz retake
      var qRetake = t.closest && t.closest('[data-quiz-retake="1"]');
      if (qRetake) { resetQuiz(lesson, container); }
    });
    // Capstone inline form auto-save listeners
    wireCapstoneInline(lesson, container);
  }

  // ── Capstone inline auto-save ──
  function wireCapstoneInline(lesson, container) {
    var inputs = container.querySelectorAll('.mr5-cap-input');
    if (!inputs.length) return;
    var mid = memberId();
    var lsKey = 'mr-capstone:' + mid;
    var local = {};
    try { local = JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch(e){}
    // Hydrate from local first, then from Supabase
    inputs.forEach(function(inp){
      var capField = inp.parentElement.getAttribute('data-cap-field');
      var path = capField.split('.');
      var v = local[path[0]] && local[path[0]][path[1]];
      if (v) inp.value = v;
    });
    if (mid !== 'guest') {
      fetch(SUPABASE_URL + '/rest/v1/user_capstone?select=capstone_data&member_id=eq.' + encodeURIComponent(mid), { headers: SB_HDR })
        .then(function(r){ return r.ok ? r.json() : []; })
        .then(function(rows){
          if (rows && rows[0] && rows[0].capstone_data) {
            local = Object.assign({}, local, rows[0].capstone_data);
            try { localStorage.setItem(lsKey, JSON.stringify(local)); } catch(e){}
            inputs.forEach(function(inp){
              var capField = inp.parentElement.getAttribute('data-cap-field');
              var path = capField.split('.');
              var v = local[path[0]] && local[path[0]][path[1]];
              if (v && !inp.value) inp.value = v;
            });
          }
        }).catch(function(e){ console.warn('[Capstone inline] pull failed', e); });
    }
    // Wire save on debounce + blur
    var timers = {};
    inputs.forEach(function(inp){
      function saveField() {
        var capField = inp.parentElement.getAttribute('data-cap-field');
        var path = capField.split('.');
        local[path[0]] = local[path[0]] || {};
        local[path[0]][path[1]] = inp.value;
        try { localStorage.setItem(lsKey, JSON.stringify(local)); } catch(e){}
        var statusEl = container.querySelector('[data-cap-status="' + capField + '"]');
        if (statusEl) { statusEl.className = 'mr5-cap-status saved'; statusEl.textContent = 'Saved'; }
        if (mid !== 'guest') {
          fetch(SUPABASE_URL + '/rest/v1/user_capstone?on_conflict=member_id', {
            method: 'POST', headers: SB_HDR,
            body: JSON.stringify([{member_id: mid, capstone_data: local, updated_at: new Date().toISOString()}])
          }).catch(function(e){ console.warn('[Capstone inline] save failed', e); });
        }
      }
      inp.addEventListener('input', function(){
        var capField = inp.parentElement.getAttribute('data-cap-field');
        var statusEl = container.querySelector('[data-cap-status="' + capField + '"]');
        if (statusEl) { statusEl.className = 'mr5-cap-status saving'; statusEl.textContent = 'Saving…'; }
        if (timers[capField]) clearTimeout(timers[capField]);
        timers[capField] = setTimeout(saveField, 1000);
      });
      inp.addEventListener('blur', function(){
        var capField = inp.parentElement.getAttribute('data-cap-field');
        if (timers[capField]) { clearTimeout(timers[capField]); timers[capField] = null; }
        saveField();
      });
    });
  }

  // ── Quiz grading ──
  function gradeQuiz(lesson, container) {
    if (!lesson.quiz || !lesson.quiz.questions) return;
    var form = container.querySelector('[data-quiz-form="1"]');
    if (!form) return;
    var correct = 0;
    var answers = {};
    lesson.quiz.questions.forEach(function(q, qi){
      var sel = form.querySelector('input[name="q' + qi + '"]:checked');
      var answerIdx = sel ? parseInt(sel.value, 10) : -1;
      answers['q' + qi] = answerIdx;
      var isCorrect = answerIdx === q.correct;
      if (isCorrect) correct++;
      // Mark options
      var opts = form.querySelectorAll('.mr5-quiz-q[data-q-idx="' + qi + '"] .mr5-quiz-opt');
      opts.forEach(function(o, oi){
        o.classList.remove('correct','wrong');
        if (oi === q.correct) o.classList.add('correct');
        else if (oi === answerIdx && !isCorrect) o.classList.add('wrong');
      });
      // Show explanation on wrong
      var fb = form.querySelector('[data-q-feedback="' + qi + '"]');
      if (fb && (!isCorrect || q.explain)) {
        fb.textContent = q.explain || '';
        if (fb.textContent) fb.classList.add('show');
      }
    });
    var score = Math.round((correct / lesson.quiz.questions.length) * 100);
    var passThreshold = (lesson.quiz.pass_pct || 80);
    var passed = score >= passThreshold;
    var resultEl = container.querySelector('[data-quiz-result="1"]');
    resultEl.className = 'mr5-quiz-result ' + (passed ? 'pass' : 'fail');
    resultEl.textContent = (passed ? '✓ Passed · ' : '✗ Keep going · ') + correct + ' / ' + lesson.quiz.questions.length + ' (' + score + '%)';
    form.querySelector('[data-quiz-submit="1"]').style.display = 'none';
    form.querySelector('[data-quiz-retake="1"]').style.display = '';
    // Persist
    var mid = memberId();
    var passKey = 'mr-quiz-passed:' + mid + ':' + lesson.id;
    if (passed) {
      try { localStorage.setItem(passKey, Date.now().toString()); } catch(e){}
      // Unlock the next-lesson button if it was locked
      var nextBtn = container.querySelector('.mr5-btn-locked');
      if (nextBtn) nextBtn.classList.remove('mr5-btn-locked');
    }
    if (mid !== 'guest') {
      fetch(SUPABASE_URL + '/rest/v1/user_quiz_attempts', {
        method: 'POST', headers: SB_HDR,
        body: JSON.stringify([{
          member_id: mid, lesson_id: lesson.id,
          answers: answers, score: score, passed: passed,
          attempted_at: new Date().toISOString()
        }])
      }).catch(function(e){ console.warn('[Quiz] save attempt failed', e); });
    }
  }
  function resetQuiz(lesson, container) {
    var form = container.querySelector('[data-quiz-form="1"]');
    if (!form) return;
    form.querySelectorAll('.mr5-quiz-opt').forEach(function(o){ o.classList.remove('correct','wrong'); });
    form.querySelectorAll('.mr5-quiz-feedback').forEach(function(f){ f.classList.remove('show'); f.textContent = ''; });
    form.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
    container.querySelector('[data-quiz-result="1"]').textContent = '';
    container.querySelector('[data-quiz-result="1"]').className = 'mr5-quiz-result';
    form.querySelector('[data-quiz-submit="1"]').style.display = '';
    form.querySelector('[data-quiz-retake="1"]').style.display = 'none';
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
