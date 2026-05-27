/**
 * MBA Rock — Homepage Music Sampler
 * Opt-in only. No autoplay. Pauses on navigation. Mobile-friendly.
 *
 * Deploy ONLY on the funnel landing page (or any single page).
 * Lazy-loads MP3s on click — adds zero bytes to initial page load.
 *
 * Songs:
 *   1. Oxygen (Cash Flow Management) — M1L1, foundational
 *   2. Brand Is a Promise — M7L2, brand
 *   3. Distribution Rivers — distribution
 *
 * (c) 2026 MBA Rock
 */
(function(){
  'use strict';
  if (window.__MR_MUSIC_LOADED) return;
  window.__MR_MUSIC_LOADED = true;

  // Only render on the funnel landing — adjust this check if Josh wants it elsewhere
  // Default: render everywhere it's loaded. Squarespace footer injection should be page-scoped.

  var CDN = 'https://learn.mbarock.com/audio/homepage-samples';

  var TRACKS = [
    {
      title: "Oxygen",
      subtitle: "Cash Flow Management · Module 1, Lesson 1",
      duration: "3:14",
      url: CDN + "/oxygen.mp3",
      note: "The opening track — about why a profitable company can still run out of cash."
    },
    {
      title: "Brand is a Promise",
      subtitle: "Brand Positioning & Messaging · Module 7, Lesson 2",
      duration: "3:42",
      url: CDN + "/brand-is-a-promise.mp3",
      note: "The framework: brand = promise made × promise kept consistently."
    },
    {
      title: "Distribution Rivers",
      subtitle: "Growth & Distribution",
      duration: "2:56",
      url: CDN + "/distribution-rivers.mp3",
      note: "Where the water flows downhill — and where customers actually find you."
    }
  ];

  // ──────────────────────────────────────────────────────────
  // STYLES
  // ──────────────────────────────────────────────────────────
  var css = `
    .mr-music-btn{
      position:fixed;bottom:20px;left:20px;z-index:2147483630;
      background:#0B1F3A;color:#FDFAF1;border:0;
      padding:12px 20px;border-radius:999px;
      font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.02em;
      cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.22);
      display:flex;align-items:center;gap:10px;
      transition:transform .15s ease,box-shadow .15s ease,background .15s ease;
    }
    .mr-music-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.28);background:#152D52}
    .mr-music-btn:focus-visible{outline:3px solid #F26B1F;outline-offset:3px}
    .mr-music-btn .icon{font-size:16px;line-height:1}
    .mr-music-btn .label{white-space:nowrap}
    .mr-music-btn .pulse{display:inline-block;width:8px;height:8px;background:#F26B1F;border-radius:50%;margin-right:2px;animation:mr-pulse 1.8s ease-in-out infinite}
    @keyframes mr-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}

    .mr-music-panel{
      position:fixed;bottom:80px;left:20px;z-index:2147483631;
      width:340px;max-width:calc(100vw - 40px);
      background:#FDFAF1;color:#1A1208;border-radius:14px;
      box-shadow:0 24px 60px rgba(0,0,0,.32);
      font-family:'Inter',system-ui,sans-serif;
      display:none;flex-direction:column;
      overflow:hidden;
    }
    .mr-music-panel.open{display:flex}

    .mr-music-head{
      background:#0B1F3A;color:#FDFAF1;padding:16px 20px;
      display:flex;align-items:center;justify-content:space-between;
    }
    .mr-music-head h3{
      margin:0;font-family:'Fraunces',Georgia,serif;font-size:17px;font-weight:700;
      letter-spacing:-.01em;color:#FDFAF1;
    }
    .mr-music-head .close{
      background:none;border:0;color:#FDFAF1;font-size:22px;line-height:1;
      cursor:pointer;padding:0;opacity:.75;
    }
    .mr-music-head .close:hover{opacity:1}
    .mr-music-head .close:focus-visible{outline:2px solid #F26B1F;outline-offset:2px;border-radius:4px}
    .mr-music-head .sub{
      font-size:11px;color:rgba(253,250,241,.65);letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-top:2px;
    }

    .mr-music-list{padding:8px 0;max-height:60vh;overflow-y:auto}
    .mr-track{
      display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;
      padding:12px 16px;cursor:pointer;transition:background .12s ease;
      border:none;background:none;width:100%;text-align:left;font-family:inherit;color:inherit;
    }
    .mr-track:hover{background:rgba(242,107,31,.07)}
    .mr-track:focus-visible{outline:2px solid #F26B1F;outline-offset:-2px}
    .mr-track.playing{background:rgba(242,107,31,.12)}
    .mr-track .play-icon{
      width:36px;height:36px;border-radius:50%;
      background:#F26B1F;color:#fff;display:flex;align-items:center;justify-content:center;
      font-size:13px;flex-shrink:0;
    }
    .mr-track .meta{min-width:0;flex:1}
    .mr-track .ttitle{
      font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:700;color:#0B1F3A;line-height:1.2;margin-bottom:2px;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }
    .mr-track .tsub{font-size:11.5px;color:#3D3025;line-height:1.3}
    .mr-track .tdur{font-size:11px;color:#3D3025;opacity:.7;font-variant-numeric:tabular-nums;letter-spacing:.04em;flex-shrink:0}

    .mr-now-playing{
      border-top:1px solid #E8DFC8;padding:14px 18px;background:#F8F1E1;
    }
    .mr-now-playing.empty{display:none}
    .mr-now-playing .np-title{
      font-family:'Fraunces',Georgia,serif;font-size:14px;font-weight:700;color:#0B1F3A;margin-bottom:4px;
    }
    .mr-now-playing .np-note{font-size:12px;color:#3D3025;line-height:1.4;margin-bottom:10px;font-style:italic}
    .mr-controls{display:flex;align-items:center;gap:10px}
    .mr-controls audio{flex:1;height:32px}
    .mr-controls audio::-webkit-media-controls-panel{background:#fff;border-radius:6px}

    .mr-foot{
      padding:10px 18px;border-top:1px solid #E8DFC8;font-size:11.5px;color:#3D3025;background:#fff;
      display:flex;align-items:center;justify-content:space-between;gap:10px;
    }
    .mr-foot a{color:#F26B1F;text-decoration:none;font-weight:600}
    .mr-foot a:hover{text-decoration:underline}

    @media(max-width:480px){
      .mr-music-btn{bottom:12px;left:12px;padding:10px 16px;font-size:12px}
      .mr-music-panel{bottom:64px;left:12px;width:calc(100vw - 24px)}
    }
    @media(prefers-reduced-motion:reduce){
      .mr-music-btn,.mr-track,.mr-music-panel{transition:none !important}
      .mr-music-btn .pulse{animation:none !important}
    }
  `;

  var style = document.createElement('style');
  style.id = 'mr-music-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // ──────────────────────────────────────────────────────────
  // DOM
  // ──────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.className = 'mr-music-btn';
  btn.setAttribute('aria-label', 'Hear sample songs from the MBA Rock course');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mr-music-panel');
  btn.innerHTML = '<span class="pulse" aria-hidden="true"></span><span class="icon" aria-hidden="true">🎵</span><span class="label">Hear 3 sample tracks</span>';
  document.body.appendChild(btn);

  var panel = document.createElement('div');
  panel.className = 'mr-music-panel';
  panel.id = 'mr-music-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Sample music player');
  panel.innerHTML = `
    <div class="mr-music-head">
      <div>
        <h3>3 sample tracks</h3>
        <div class="sub">From the 74 original songs in the course</div>
      </div>
      <button class="close" aria-label="Close music player">×</button>
    </div>
    <div class="mr-music-list" role="list">
      ${TRACKS.map(function(t, i){
        return `<button class="mr-track" data-i="${i}" role="listitem" aria-label="Play ${t.title}">
          <span class="play-icon" aria-hidden="true">▶</span>
          <span class="meta">
            <div class="ttitle">${t.title}</div>
            <div class="tsub">${t.subtitle}</div>
          </span>
          <span class="tdur" aria-hidden="true">${t.duration}</span>
        </button>`;
      }).join('')}
    </div>
    <div class="mr-now-playing empty">
      <div class="np-title"></div>
      <div class="np-note"></div>
      <div class="mr-controls">
        <audio controls preload="none"></audio>
      </div>
    </div>
    <div class="mr-foot">
      <span>Album-paced learning. 74 songs total.</span>
      <a href="https://www.mbarock.com/mba-rock">See pricing →</a>
    </div>
  `;
  document.body.appendChild(panel);

  // ──────────────────────────────────────────────────────────
  // BEHAVIOR
  // ──────────────────────────────────────────────────────────
  var audio = panel.querySelector('audio');
  var nowPlaying = panel.querySelector('.mr-now-playing');
  var npTitle = panel.querySelector('.np-title');
  var npNote = panel.querySelector('.np-note');
  var currentIdx = -1;

  function open(){ panel.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  function close(){ panel.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.focus(); }
  function togglePanel(){ panel.classList.contains('open') ? close() : open(); }

  btn.addEventListener('click', togglePanel);
  panel.querySelector('.close').addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  function playTrack(i){
    var t = TRACKS[i];
    if (!t) return;
    if (currentIdx === i && !audio.paused){
      audio.pause();
      return;
    }
    if (audio.src !== t.url) audio.src = t.url;
    nowPlaying.classList.remove('empty');
    npTitle.textContent = t.title;
    npNote.textContent = t.note;
    audio.play().catch(function(err){
      // Some browsers block even user-gesture play if media isn't ready — show a friendly state
      console.warn('[MR music] play failed:', err);
    });
    currentIdx = i;
    // Update visual state on track rows
    panel.querySelectorAll('.mr-track').forEach(function(tr){
      tr.classList.toggle('playing', parseInt(tr.dataset.i,10) === i);
      tr.querySelector('.play-icon').textContent = parseInt(tr.dataset.i,10) === i ? '⏸' : '▶';
    });
  }

  panel.querySelectorAll('.mr-track').forEach(function(tr){
    tr.addEventListener('click', function(){
      var i = parseInt(tr.dataset.i, 10);
      playTrack(i);
    });
  });

  // When current track pauses or ends, reset its icon
  audio.addEventListener('pause', function(){
    panel.querySelectorAll('.mr-track').forEach(function(tr){
      var i = parseInt(tr.dataset.i, 10);
      if (i === currentIdx) tr.querySelector('.play-icon').textContent = '▶';
    });
  });
  audio.addEventListener('play', function(){
    panel.querySelectorAll('.mr-track').forEach(function(tr){
      var i = parseInt(tr.dataset.i, 10);
      if (i === currentIdx) tr.querySelector('.play-icon').textContent = '⏸';
    });
  });
  audio.addEventListener('ended', function(){
    panel.querySelectorAll('.mr-track').forEach(function(tr){
      tr.querySelector('.play-icon').textContent = '▶';
      tr.classList.remove('playing');
    });
  });

  // Pause on navigation away (single-page apps + regular nav)
  window.addEventListener('beforeunload', function(){
    if (audio && !audio.paused) audio.pause();
  });
  window.addEventListener('pagehide', function(){
    if (audio && !audio.paused) audio.pause();
  });
  // Pause on visibility change (tab switch / page hidden)
  document.addEventListener('visibilitychange', function(){
    if (document.hidden && audio && !audio.paused) audio.pause();
  });

  // Public API for analytics if Josh wants it
  window.MR_MUSIC = {
    version: '1.0.0',
    play: playTrack,
    pause: function(){ audio.pause(); },
    open: open,
    close: close,
    tracks: TRACKS
  };
})();
