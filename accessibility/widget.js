/**
 * MBA Rock / BTB Accessibility Widget — v1.0
 * Single-file ADA compliance widget. Deploy via one <script> tag.
 *
 * USAGE:
 *   <script src="https://learn.mbarock.com/accessibility/widget.js"
 *     data-brand="mba-rock"></script>
 *
 * OR configure inline:
 *   <script>window.__ADA_CONFIG = { ... };</script>
 *   <script src="..."></script>
 *
 * (c) 2026 MBA Rock / Better Together Branding
 * License: BTB clients per-site annual license. MBA Rock owns.
 */
(function(){
  'use strict';
  if (window.__ADA_LOADED) return;
  window.__ADA_LOADED = true;

  // ──────────────────────────────────────────────────────────
  // CONFIG (with sensible defaults; overridden by window.__ADA_CONFIG)
  // ──────────────────────────────────────────────────────────
  var defaults = {
    brand: 'mba-rock',
    position: 'bottom-right',
    accentColor: '#F26B1F',
    accentDark: '#D85B12',
    paperColor: '#FDFAF1',
    navyColor: '#0B1F3A',
    inkColor: '#1A1208',
    fontHeading: "'Fraunces', Georgia, serif",
    fontBody: "'Inter', system-ui, -apple-system, sans-serif",
    buttonLabel: 'Accessibility',
    statementUrl: '/accessibility-statement',
    contactEmail: 'josh@adytum.agency',
    showBadge: false,
    storageKey: 'mr-ada-prefs',
    features: {
      textResize: true,
      fontReplace: true,
      contrast: true,
      cursor: true,
      animations: true,
      linkUnderline: true,
      headingHighlight: true,
      altText: true,
      readingMask: true,
      textToSpeech: true,
      keyboardNav: true,
      skipToContent: true
    }
  };
  var cfg = Object.assign({}, defaults, window.__ADA_CONFIG || {});
  cfg.features = Object.assign({}, defaults.features, (window.__ADA_CONFIG && window.__ADA_CONFIG.features) || {});

  // Brand presets (override accent/navy if a known brand is set)
  var brandPresets = {
    'mba-rock': { accentColor: '#F26B1F', accentDark: '#D85B12', navyColor: '#0B1F3A', paperColor: '#FDFAF1' },
    'btb':      { accentColor: '#A3D977', accentDark: '#7FB856', navyColor: '#1B4332', paperColor: '#F4F8F2' },
    'truffle':  { accentColor: '#C9A96E', accentDark: '#A88950', navyColor: '#3D2E20', paperColor: '#FAF5EC' }
  };
  if (brandPresets[cfg.brand] && !window.__ADA_CONFIG) {
    Object.assign(cfg, brandPresets[cfg.brand]);
  }

  // ──────────────────────────────────────────────────────────
  // STATE — persisted in localStorage
  // ──────────────────────────────────────────────────────────
  var state = (function(){
    try { return JSON.parse(localStorage.getItem(cfg.storageKey)) || {}; } catch(e) { return {}; }
  })();
  function save(){ try { localStorage.setItem(cfg.storageKey, JSON.stringify(state)); } catch(e){} }

  // ──────────────────────────────────────────────────────────
  // STYLES — injected once
  // ──────────────────────────────────────────────────────────
  var css = `
    :root{--ada-accent:${cfg.accentColor};--ada-accent-dark:${cfg.accentDark};--ada-navy:${cfg.navyColor};--ada-paper:${cfg.paperColor};--ada-ink:${cfg.inkColor}}
    .ada-btn{position:fixed;${cfg.position.includes('bottom')?'bottom':'top'}:20px;${cfg.position.includes('right')?'right':'left'}:20px;z-index:2147483640;width:56px;height:56px;border-radius:50%;background:var(--ada-accent);color:#fff;border:0;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-size:24px;font-family:${cfg.fontBody};transition:transform .15s ease,box-shadow .15s ease}
    .ada-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.22);background:var(--ada-accent-dark)}
    .ada-btn:focus-visible{outline:3px solid var(--ada-navy);outline-offset:3px}
    .ada-btn .ada-icon{display:block;line-height:1}
    .ada-panel{position:fixed;${cfg.position.includes('bottom')?'bottom':'top'}:90px;${cfg.position.includes('right')?'right':'left'}:20px;z-index:2147483641;width:340px;max-height:75vh;background:var(--ada-paper);color:var(--ada-ink);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;display:none;flex-direction:column;font-family:${cfg.fontBody};font-size:14px;line-height:1.5}
    .ada-panel.open{display:flex}
    .ada-head{background:var(--ada-navy);color:var(--ada-paper);padding:18px 20px;display:flex;align-items:center;justify-content:space-between}
    .ada-head h2{margin:0;font-family:${cfg.fontHeading};font-size:18px;font-weight:700;letter-spacing:-.01em;color:var(--ada-paper)}
    .ada-head .ada-close{background:none;border:0;color:var(--ada-paper);font-size:24px;cursor:pointer;padding:0;line-height:1;opacity:.7}
    .ada-head .ada-close:hover{opacity:1}
    .ada-body{padding:14px 20px;overflow-y:auto;flex:1}
    .ada-group{margin-bottom:18px}
    .ada-group:last-child{margin-bottom:0}
    .ada-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ada-navy);font-weight:700;margin-bottom:8px;opacity:.7}
    .ada-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
    .ada-chip{flex:1 1 auto;min-width:0;padding:8px 10px;background:#fff;border:1.5px solid #E8DFC8;border-radius:8px;font-size:13px;font-weight:600;color:var(--ada-ink);cursor:pointer;text-align:center;transition:all .12s ease;font-family:${cfg.fontBody}}
    .ada-chip:hover{border-color:var(--ada-accent)}
    .ada-chip.active{background:var(--ada-accent);color:#fff;border-color:var(--ada-accent)}
    .ada-chip:focus-visible{outline:3px solid var(--ada-accent);outline-offset:2px}
    .ada-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fff;border:1.5px solid #E8DFC8;border-radius:8px;margin-bottom:6px;cursor:pointer}
    .ada-toggle:hover{border-color:var(--ada-accent)}
    .ada-toggle.on{border-color:var(--ada-accent);background:rgba(242,107,31,.05)}
    .ada-toggle-label{font-size:13px;font-weight:600;color:var(--ada-ink);flex:1}
    .ada-switch{width:36px;height:20px;background:#ccc;border-radius:999px;position:relative;transition:background .2s ease;flex-shrink:0}
    .ada-switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:left .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.2)}
    .ada-toggle.on .ada-switch{background:var(--ada-accent)}
    .ada-toggle.on .ada-switch::after{left:18px}
    .ada-foot{border-top:1px solid #E8DFC8;padding:12px 20px;background:rgba(0,0,0,.02);font-size:12px}
    .ada-foot a{color:var(--ada-accent);text-decoration:none;font-weight:600}
    .ada-foot a:hover{text-decoration:underline}
    .ada-reset{width:100%;margin-top:8px;padding:8px;background:transparent;border:1px solid #E8DFC8;color:var(--ada-ink);font-size:12px;font-weight:600;border-radius:6px;cursor:pointer;font-family:${cfg.fontBody}}
    .ada-reset:hover{background:#fff;border-color:var(--ada-accent);color:var(--ada-accent)}

    /* Skip to content link */
    .ada-skip{position:absolute;top:-100px;left:8px;z-index:2147483647;background:var(--ada-navy);color:var(--ada-paper);padding:10px 18px;border-radius:6px;text-decoration:none;font-family:${cfg.fontBody};font-weight:700;font-size:14px;transition:top .15s ease}
    .ada-skip:focus{top:8px;outline:3px solid var(--ada-accent);outline-offset:2px}

    /* Feature application styles */
    /* Text-size: scale the ROOT font-size (rem unit) AND the body (em unit).
       Rem-based pages scale via root; em/inherit-based pages scale via body. Px-set text
       does not auto-scale (a page-CSS limitation), but root+body together cover most modern layouts. */
    html.ada-text-125{font-size:20px !important}
    html.ada-text-150{font-size:24px !important}
    html.ada-text-200{font-size:32px !important}
    html.ada-text-125 body{font-size:1.25em !important}
    html.ada-text-150 body{font-size:1.5em !important}
    html.ada-text-200 body{font-size:2em !important}
    /* Don't scale inside the ADA panel itself */
    html[class*="ada-text"] .ada-panel,html[class*="ada-text"] .ada-panel *,html[class*="ada-text"] .ada-btn,html[class*="ada-text"] .ada-btn *{font-size:revert !important}
    html.ada-font-dyslexic body,html.ada-font-dyslexic body *{font-family:'OpenDyslexic','Comic Sans MS','Arial',sans-serif !important;letter-spacing:.05em !important;word-spacing:.1em !important}
    html.ada-font-readable body,html.ada-font-readable body *{font-family:Georgia,'Times New Roman',serif !important;line-height:1.7 !important}
    html.ada-contrast-high body{filter:contrast(1.4) saturate(1.2)}
    html.ada-contrast-dark{filter:invert(1) hue-rotate(180deg);background:#000}
    html.ada-contrast-dark img,html.ada-contrast-dark video,html.ada-contrast-dark iframe{filter:invert(1) hue-rotate(180deg)}
    html.ada-contrast-mono body{filter:grayscale(1) contrast(1.1)}
    html.ada-cursor-large *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='${encodeURIComponent(cfg.accentColor)}' d='M2 2l8 22 4-10 10-4z' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E"),auto !important}
    html.ada-cursor-xl *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='${encodeURIComponent(cfg.accentColor)}' d='M3 3l12 33 6-15 15-6z' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E"),auto !important}
    html.ada-pause-anim *,html.ada-pause-anim *::before,html.ada-pause-anim *::after{animation-duration:0s !important;animation-delay:0s !important;animation-iteration-count:1 !important;transition-duration:0s !important;transition-delay:0s !important;scroll-behavior:auto !important}
    html.ada-pause-anim video{display:none !important}
    html.ada-pause-anim .video-replacement{display:block !important;padding:12px;background:#eee;text-align:center;color:#666}
    html.ada-underline-links a{text-decoration:underline !important;text-underline-offset:3px !important}
    html.ada-heading-highlight h1,html.ada-heading-highlight h2,html.ada-heading-highlight h3,html.ada-heading-highlight h4,html.ada-heading-highlight h5,html.ada-heading-highlight h6{outline:2px dashed var(--ada-accent) !important;outline-offset:4px !important;background:rgba(242,107,31,.04) !important}
    html.ada-alt-text img[alt]:not([alt=""])::after{content:" [Alt: " attr(alt) "]";display:block;font-size:11px;color:var(--ada-accent);background:rgba(242,107,31,.08);padding:4px 8px;border-radius:4px;margin-top:4px}
    html.ada-alt-text figure:has(img)::after{content:attr(data-alt);display:block;font-size:11px;color:var(--ada-accent)}
    html.ada-kbd-nav *:focus{outline:4px solid var(--ada-accent) !important;outline-offset:3px !important;box-shadow:0 0 0 6px rgba(242,107,31,.25) !important}

    /* Reading mask — follows cursor */
    .ada-mask{position:fixed;left:0;right:0;height:80px;z-index:2147483639;pointer-events:none;background:rgba(11,31,58,.78);transition:top .05s linear;display:none}
    html.ada-reading-mask .ada-mask{display:block}
    .ada-mask::before,.ada-mask::after{content:'';position:absolute;left:0;right:0;height:50vh;background:rgba(11,31,58,.78)}
    .ada-mask::before{bottom:100%}
    .ada-mask::after{top:100%}

    /* Read aloud highlight */
    .ada-tts-active{background:rgba(242,107,31,.25) !important;outline:2px solid var(--ada-accent);outline-offset:2px}

    /* Compliance badge */
    .ada-badge{position:fixed;${cfg.position.includes('bottom')?'bottom':'top'}:20px;${cfg.position.includes('right')?'right':'left'}:90px;z-index:2147483635;background:var(--ada-navy);color:var(--ada-paper);padding:6px 12px;border-radius:999px;font-family:${cfg.fontBody};font-size:11px;font-weight:600;letter-spacing:.04em;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);display:none}
    .ada-badge:hover{background:var(--ada-accent)}
    @media(max-width:640px){.ada-badge{display:none}}
    .ada-badge.show{display:inline-block}

    @media(prefers-reduced-motion:reduce){.ada-btn,.ada-panel,.ada-chip,.ada-toggle,.ada-switch::after{transition:none !important}}
    @media(max-width:480px){.ada-panel{width:calc(100vw - 40px);right:20px;left:20px;max-height:80vh}}
  `;
  var styleEl = document.createElement('style');
  styleEl.id = 'ada-widget-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ──────────────────────────────────────────────────────────
  // BUILD WIDGET DOM
  // ──────────────────────────────────────────────────────────
  function el(tag, attrs, children){
    var n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(function(kv){ n.setAttribute(kv[0], kv[1]); });
    (children || []).forEach(function(c){ n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function build(){
    // Skip-to-content link (must come first)
    if (cfg.features.skipToContent) {
      var skip = el('a', { href:'#main', class:'ada-skip' }, ['Skip to main content']);
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // The trigger button
    var btn = el('button', { class:'ada-btn', 'aria-label':'Open accessibility menu', 'aria-expanded':'false', 'aria-controls':'ada-panel' });
    btn.innerHTML = '<span class="ada-icon" aria-hidden="true">♿</span>';
    document.body.appendChild(btn);

    // Reading mask
    var mask = el('div', { class:'ada-mask', 'aria-hidden':'true' });
    document.body.appendChild(mask);

    // Panel
    var panel = el('div', { class:'ada-panel', id:'ada-panel', role:'dialog', 'aria-modal':'false', 'aria-labelledby':'ada-title' });
    panel.innerHTML = `
      <div class="ada-head">
        <h2 id="ada-title">${cfg.buttonLabel}</h2>
        <button class="ada-close" aria-label="Close accessibility menu">×</button>
      </div>
      <div class="ada-body">

        ${cfg.features.textResize ? `<div class="ada-group">
          <div class="ada-label">Text size</div>
          <div class="ada-row" role="group" aria-label="Text size">
            <button class="ada-chip" data-feat="text" data-val="100">100%</button>
            <button class="ada-chip" data-feat="text" data-val="125">125%</button>
            <button class="ada-chip" data-feat="text" data-val="150">150%</button>
            <button class="ada-chip" data-feat="text" data-val="200">200%</button>
          </div>
        </div>` : ''}

        ${cfg.features.fontReplace ? `<div class="ada-group">
          <div class="ada-label">Font</div>
          <div class="ada-row" role="group" aria-label="Font choice">
            <button class="ada-chip" data-feat="font" data-val="default">Default</button>
            <button class="ada-chip" data-feat="font" data-val="dyslexic">Dyslexia-friendly</button>
            <button class="ada-chip" data-feat="font" data-val="readable">Readable serif</button>
          </div>
        </div>` : ''}

        ${cfg.features.contrast ? `<div class="ada-group">
          <div class="ada-label">Contrast</div>
          <div class="ada-row" role="group" aria-label="Contrast mode">
            <button class="ada-chip" data-feat="contrast" data-val="default">Default</button>
            <button class="ada-chip" data-feat="contrast" data-val="high">High</button>
            <button class="ada-chip" data-feat="contrast" data-val="dark">Dark</button>
            <button class="ada-chip" data-feat="contrast" data-val="mono">Mono</button>
          </div>
        </div>` : ''}

        ${cfg.features.cursor ? `<div class="ada-group">
          <div class="ada-label">Cursor</div>
          <div class="ada-row" role="group" aria-label="Cursor size">
            <button class="ada-chip" data-feat="cursor" data-val="default">Normal</button>
            <button class="ada-chip" data-feat="cursor" data-val="large">Large</button>
            <button class="ada-chip" data-feat="cursor" data-val="xl">Extra-large</button>
          </div>
        </div>` : ''}

        <div class="ada-group">
          <div class="ada-label">Toggles</div>
          ${cfg.features.animations ? `<div class="ada-toggle" data-feat="pause-anim" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Pause animations</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.linkUnderline ? `<div class="ada-toggle" data-feat="underline-links" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Underline links</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.headingHighlight ? `<div class="ada-toggle" data-feat="heading-highlight" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Highlight headings</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.altText ? `<div class="ada-toggle" data-feat="alt-text" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Show image alt text</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.readingMask ? `<div class="ada-toggle" data-feat="reading-mask" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Reading mask</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.keyboardNav ? `<div class="ada-toggle" data-feat="kbd-nav" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Keyboard navigation aids</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
          ${cfg.features.textToSpeech ? `<div class="ada-toggle" data-feat="tts" tabindex="0" role="switch" aria-checked="false"><span class="ada-toggle-label">Read selected text aloud</span><span class="ada-switch" aria-hidden="true"></span></div>` : ''}
        </div>

        <button class="ada-reset" type="button">Reset all to default</button>
      </div>
      <div class="ada-foot">
        Issues? <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a><br>
        <a href="${cfg.statementUrl}">Accessibility statement</a>
      </div>
    `;
    document.body.appendChild(panel);

    // Compliance badge
    if (cfg.showBadge) {
      var badge = el('a', { class:'ada-badge show', href:cfg.statementUrl, 'aria-label':'Accessibility statement' }, ['♿ WCAG 2.1 AA']);
      document.body.appendChild(badge);
    }

    return { btn:btn, panel:panel };
  }

  // ──────────────────────────────────────────────────────────
  // STATE APPLICATION
  // ──────────────────────────────────────────────────────────
  function apply(){
    var html = document.documentElement;
    // Strip all ada- classes
    html.className = html.className.split(/\s+/).filter(function(c){ return !c.startsWith('ada-'); }).join(' ');

    if (state.text && state.text !== '100') html.classList.add('ada-text-' + state.text);
    if (state.font && state.font !== 'default') html.classList.add('ada-font-' + state.font);
    if (state.contrast && state.contrast !== 'default') html.classList.add('ada-contrast-' + state.contrast);
    if (state.cursor && state.cursor !== 'default') html.classList.add('ada-cursor-' + state.cursor);
    if (state['pause-anim']) html.classList.add('ada-pause-anim');
    if (state['underline-links']) html.classList.add('ada-underline-links');
    if (state['heading-highlight']) html.classList.add('ada-heading-highlight');
    if (state['alt-text']) html.classList.add('ada-alt-text');
    if (state['reading-mask']) html.classList.add('ada-reading-mask');
    if (state['kbd-nav']) html.classList.add('ada-kbd-nav');

    // Update UI to reflect state
    document.querySelectorAll('.ada-chip').forEach(function(c){
      var f = c.getAttribute('data-feat');
      var v = c.getAttribute('data-val');
      c.classList.toggle('active', (state[f] || (f==='text'?'100':'default')) === v);
    });
    document.querySelectorAll('.ada-toggle').forEach(function(t){
      var f = t.getAttribute('data-feat');
      var on = !!state[f];
      t.classList.toggle('on', on);
      t.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    save();
  }

  // ──────────────────────────────────────────────────────────
  // BEHAVIOR
  // ──────────────────────────────────────────────────────────
  function wire(refs){
    var btn = refs.btn;
    var panel = refs.panel;
    var mask = document.querySelector('.ada-mask');

    function open(){ panel.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
    function close(){ panel.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.focus(); }

    btn.addEventListener('click', function(){
      panel.classList.contains('open') ? close() : open();
    });
    panel.querySelector('.ada-close').addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key==='Escape' && panel.classList.contains('open')) close(); });

    // Chip handlers
    panel.querySelectorAll('.ada-chip').forEach(function(c){
      c.addEventListener('click', function(){
        var f = c.getAttribute('data-feat');
        state[f] = c.getAttribute('data-val');
        apply();
      });
    });

    // Toggle handlers
    panel.querySelectorAll('.ada-toggle').forEach(function(t){
      function flip(){
        var f = t.getAttribute('data-feat');
        state[f] = !state[f];
        // Special: TTS doesn't add a class, it activates a behavior
        if (f === 'tts') wireTTS(state.tts);
        apply();
      }
      t.addEventListener('click', flip);
      t.addEventListener('keydown', function(e){ if (e.key===' ' || e.key==='Enter'){ e.preventDefault(); flip(); }});
    });

    // Reset
    panel.querySelector('.ada-reset').addEventListener('click', function(){
      state = {};
      stopTTS();
      apply();
    });

    // Reading mask follow cursor
    document.addEventListener('mousemove', function(e){
      if (state['reading-mask']) mask.style.top = (e.clientY - 40) + 'px';
    });

    // Re-apply if TTS was on
    if (state.tts) wireTTS(true);
  }

  // ──────────────────────────────────────────────────────────
  // TEXT-TO-SPEECH
  // ──────────────────────────────────────────────────────────
  var ttsListener = null;
  function wireTTS(enable){
    if (!('speechSynthesis' in window)) return;
    if (enable && !ttsListener) {
      ttsListener = function(e){
        var sel = window.getSelection().toString().trim();
        if (!sel) {
          // Read the paragraph the user clicked
          var p = e.target.closest('p, li, h1, h2, h3, h4, blockquote, td');
          if (p) sel = p.innerText.trim();
        }
        if (!sel) return;
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(sel);
        u.rate = 0.95;
        u.pitch = 1.0;
        speechSynthesis.speak(u);
      };
      document.addEventListener('click', ttsListener);
    } else if (!enable && ttsListener) {
      document.removeEventListener('click', ttsListener);
      ttsListener = null;
      stopTTS();
    }
  }
  function stopTTS(){ if ('speechSynthesis' in window) speechSynthesis.cancel(); }

  // ──────────────────────────────────────────────────────────
  // OpenDyslexic font (lazy-load only when needed)
  // ──────────────────────────────────────────────────────────
  var dyslexicLoaded = false;
  function loadDyslexicFont(){
    if (dyslexicLoaded) return;
    dyslexicLoaded = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@0.0.4/dist/opendyslexic.css';
    document.head.appendChild(link);
  }

  // Watch state for font changes
  var origState = state.font;
  if (state.font === 'dyslexic') loadDyslexicFont();
  Object.defineProperty(state, 'font', {
    get: function(){ return this._font; },
    set: function(v){ this._font = v; if (v === 'dyslexic') loadDyslexicFont(); }
  });
  if (origState) state.font = origState;

  // ──────────────────────────────────────────────────────────
  // BOOT
  // ──────────────────────────────────────────────────────────
  function boot(){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
      return;
    }
    var refs = build();
    wire(refs);
    apply();

    // Announce to screen readers
    var live = el('div', { class:'ada-live', 'aria-live':'polite', style:'position:absolute;left:-9999px' });
    document.body.appendChild(live);
    window.__ADA_announce = function(msg){ live.textContent = msg; setTimeout(function(){ live.textContent = ''; }, 1000); };
  }

  boot();

  // ──────────────────────────────────────────────────────────
  // PUBLIC API (for client-site config / future extensions)
  // ──────────────────────────────────────────────────────────
  window.MR_ADA = {
    version: '1.0.0',
    config: cfg,
    getState: function(){ return Object.assign({}, state); },
    reset: function(){ state = {}; apply(); },
    open: function(){ document.querySelector('.ada-panel').classList.add('open'); },
    close: function(){ document.querySelector('.ada-panel').classList.remove('open'); }
  };
})();
