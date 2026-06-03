/* MBA Rock — persistent member navigation (nav.js)
 * Self-hosted, CSP-clean. Injected via <script src="/nav.js" defer></script> on member surfaces.
 * - Auth-gated: only members see it (mirrors existing member-page checks).
 * - Owns Sign out; suppresses the legacy floating signout widget by setting
 *   window.__mrSignoutInjected before signout.js runs (signout.js early-returns on that flag).
 * - Sticky top bar on desktop; hamburger drawer on mobile (<=860px).
 * - Non-destructive: prepends its own nodes, never rewrites existing DOM.
 */
(function () {
  "use strict";

  // Suppress the legacy floating sign-out pill (signout.js bails if this is already set).
  try { window.__mrSignoutInjected = true; } catch (e) {}

  if (document.getElementById("mbnav")) return;

  var BASE = "https://learn.mbarock.com";
  var SB_URL = "https://ciloqphtencjthkedanw.supabase.co";
  var SB_KEY = "sb_publishable_qezI6CBipqlcoj3nXV47PQ__4NpVKS-";

  var PRIMARY = [
    { label: "Dashboard",    href: "/dashboard/",         match: "/dashboard" },
    { label: "Capstone",     href: "/capstone/",          match: "/capstone" },
    { label: "Console",      href: "/operators-console/", match: "/operators-console" },
    { label: "Certificates", href: "/certificates/",      match: "/certificates" },
    { label: "Directory",    href: "/directory/",         match: "/directory" }
  ];
  var MORE = [
    { label: "Member Tools",    href: "/member-tools/", match: "/member-tools" },
    { label: "The Dossier",     href: "/dossier/",      match: "/dossier" },
    { label: "What's New",      href: "/whats-new/",    match: "/whats-new" },
    { label: "Adytum Pipeline", href: "/adytum/",       match: "/adytum" },
    { label: "Arcade",          href: "/arcade/",       match: "/arcade" }
  ];

  // Auth gate — mirror existing member-page detection. Only members get the nav.
  function isMember() {
    try {
      if (new URLSearchParams(location.search).get("m")) return true;
      var keys = ["sb-ciloqphtencjthkedanw-auth-token", "mba-rock-member-id", "mr-member-id", "mr_member_id", "memberId"];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && v.length > 4 && v !== "guest" && v !== "null") return true;
      }
      if (document.referrer && /mbarock\.com|panda-reindeer/i.test(document.referrer)) return true;
    } catch (e) {}
    return false;
  }
  if (!isMember()) return;

  function active(a) { try { return location.pathname.indexOf(a.match) === 0; } catch (e) { return false; } }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function links(list, drawer) {
    return list.map(function (a) {
      var cls = (drawer ? "mbnav-d-link" : "mbnav-link") + (active(a) ? " is-active" : "");
      return '<a class="' + cls + '" href="' + BASE + a.href + '">' + esc(a.label) + "</a>";
    }).join("");
  }
  function memberName() {
    try {
      var n = localStorage.getItem("mba-rock-member-name") || "";
      if (!n) {
        var s = JSON.parse(localStorage.getItem("sb-ciloqphtencjthkedanw-auth-token") || "null");
        if (s && s.user && s.user.email) n = s.user.email;
      }
      return (n || "").replace(/^"+|"+$/g, "").slice(0, 28);
    } catch (e) { return ""; }
  }
  function signOut(e) {
    if (e) { e.preventDefault(); }
    try {
      var raw = localStorage.getItem("sb-ciloqphtencjthkedanw-auth-token");
      var tok = raw ? JSON.parse(raw).access_token : null;
      if (tok) {
        fetch(SB_URL + "/auth/v1/logout", { method: "POST", headers: { "apikey": SB_KEY, "Authorization": "Bearer " + tok } }).catch(function () {});
      }
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > -1) localStorage.removeItem(k); });
      ["mr-member-id", "mr_member_id", "mba-rock-member-id", "mba-rock-member", "memberId"].forEach(function (k) { localStorage.removeItem(k); });
    } catch (err) {}
    location.href = BASE + "/landing/";
  }

  function build() {
    if (document.getElementById("mbnav")) return;
    var legacy = document.getElementById("mr-signout-widget");
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);

    var css = [
      ".mbnav{position:sticky;top:0;z-index:9000;background:#0B1F3A;color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif;border-bottom:1px solid rgba(255,255,255,.10);}",
      ".mbnav *{box-sizing:border-box;margin:0;}",
      ".mbnav-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:0 20px;height:56px;}",
      ".mbnav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;}",
      ".mbnav-brand .wm{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:18px;color:#fff;}",
      ".mbnav-brand .tag{font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#F26B1F;border:1px solid rgba(242,107,31,.5);border-radius:999px;padding:2px 7px;}",
      ".mbnav-links{display:flex;align-items:center;gap:2px;flex:1;min-width:0;overflow:hidden;}",
      ".mbnav-link{text-decoration:none;color:rgba(255,255,255,.82);font-size:13.5px;font-weight:600;padding:9px 12px;border-radius:8px;white-space:nowrap;}",
      ".mbnav-link:hover{background:rgba(255,255,255,.08);color:#fff;}",
      ".mbnav-link.is-active{color:#fff;background:rgba(242,107,31,.18);box-shadow:inset 0 -2px 0 #F26B1F;}",
      ".mbnav-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}",
      ".mbnav-more{position:relative;}",
      ".mbnav-more-btn{background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.14);font:600 13px Inter,sans-serif;padding:8px 12px;border-radius:8px;cursor:pointer;}",
      ".mbnav-menu{position:absolute;right:0;top:46px;background:#fff;border:1px solid #E5E0D6;border-radius:12px;box-shadow:0 18px 40px -18px rgba(11,31,58,.5);min-width:210px;padding:6px;display:none;}",
      ".mbnav-menu.open{display:block;}",
      ".mbnav-menu a{display:block;text-decoration:none;color:#0B1F3A;font-size:13.5px;font-weight:600;padding:10px 12px;border-radius:8px;}",
      ".mbnav-menu a:hover{background:#FAF8F5;color:#F26B1F;}",
      ".mbnav-menu a.is-active{color:#F26B1F;}",
      ".mbnav-signout{background:#F26B1F;color:#fff;text-decoration:none;font:700 13px Inter,sans-serif;padding:9px 16px;border-radius:999px;cursor:pointer;border:0;white-space:nowrap;}",
      ".mbnav-burger{display:none;background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:8px;width:40px;height:40px;font-size:20px;line-height:1;cursor:pointer;}",
      ".mbnav-scrim{position:fixed;inset:0;background:rgba(7,16,32,.55);z-index:9001;opacity:0;pointer-events:none;transition:opacity .2s;}",
      ".mbnav-scrim.open{opacity:1;pointer-events:auto;}",
      ".mbnav-drawer{position:fixed;top:0;right:0;height:100%;width:300px;max-width:86vw;background:#0B1F3A;color:#fff;z-index:9002;transform:translateX(100%);transition:transform .22s ease;display:flex;flex-direction:column;padding:16px;overflow-y:auto;font-family:Inter,system-ui,sans-serif;}",
      ".mbnav-drawer.open{transform:translateX(0);}",
      ".mbnav-drawer .dhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}",
      ".mbnav-drawer .dhead .wm{font-family:Fraunces,serif;font-weight:700;font-size:18px;}",
      ".mbnav-drawer .x{background:none;border:0;color:#fff;font-size:28px;line-height:1;cursor:pointer;}",
      ".mbnav-drawer .who{font-size:12px;color:rgba(255,255,255,.6);padding:0 8px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".mbnav-drawer .gl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#F26B1F;font-weight:700;margin:12px 8px 4px;}",
      ".mbnav-d-link{display:block;text-decoration:none;color:rgba(255,255,255,.9);font-size:15px;font-weight:600;padding:11px 12px;border-radius:9px;}",
      ".mbnav-d-link:hover,.mbnav-d-link.is-active{background:rgba(242,107,31,.18);color:#fff;}",
      ".mbnav-drawer .so{margin-top:auto;padding-top:14px;}",
      ".mbnav-drawer .so a{display:block;text-align:center;}",
      "@media(max-width:860px){.mbnav-links,.mbnav-more,.mbnav .mbnav-signout{display:none;}.mbnav-burger{display:inline-flex;align-items:center;justify-content:center;}}"
    ].join("");
    var st = document.createElement("style"); st.id = "mbnav-style"; st.textContent = css; document.head.appendChild(st);

    var bar = document.createElement("nav");
    bar.className = "mbnav"; bar.id = "mbnav"; bar.setAttribute("aria-label", "Member navigation");
    bar.innerHTML =
      '<div class="mbnav-in">' +
        '<a class="mbnav-brand" href="' + BASE + '/dashboard/"><span class="wm">MBA Rock</span><span class="tag">Member</span></a>' +
        '<div class="mbnav-links">' + links(PRIMARY, false) + "</div>" +
        '<div class="mbnav-right">' +
          '<div class="mbnav-more"><button class="mbnav-more-btn" aria-haspopup="true" aria-expanded="false">More ▾</button>' +
            '<div class="mbnav-menu" role="menu">' + links(MORE, false) + "</div></div>" +
          '<a class="mbnav-signout" href="#" data-mbnav-signout>Sign out</a>' +
          '<button class="mbnav-burger" aria-label="Open menu" aria-expanded="false">☰</button>' +
        "</div>" +
      "</div>";
    document.body.insertBefore(bar, document.body.firstChild);

    var who = memberName();
    var scrim = document.createElement("div"); scrim.className = "mbnav-scrim"; document.body.appendChild(scrim);
    var drawer = document.createElement("aside");
    drawer.className = "mbnav-drawer"; drawer.setAttribute("aria-label", "Member menu"); drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML =
      '<div class="dhead"><span class="wm">MBA Rock</span><button class="x" aria-label="Close menu">×</button></div>' +
      (who ? '<div class="who">' + esc(who) + "</div>" : "") +
      '<div class="gl">Learning</div>' + links([PRIMARY[0], PRIMARY[1]], true) +
      '<div class="gl">Tools</div>' + links([PRIMARY[2], PRIMARY[3], PRIMARY[4], MORE[0]], true) +
      '<div class="gl">More</div>' + links([MORE[1], MORE[2], MORE[3], MORE[4]], true) +
      '<div class="so"><a class="mbnav-signout" href="#" data-mbnav-signout>Sign out</a></div>';
    document.body.appendChild(drawer);

    // Nudge known fixed/sticky top widgets below the bar to avoid overlap.
    var sp = document.getElementById("streakPill"); if (sp) { sp.style.top = "72px"; }
    [].forEach.call(document.querySelectorAll(".mr-cd-banner"), function (el) { el.style.top = "56px"; });

    var burger = bar.querySelector(".mbnav-burger");
    var closeB = drawer.querySelector(".x");
    var moreBtn = bar.querySelector(".mbnav-more-btn");
    var menu = bar.querySelector(".mbnav-menu");
    function openD() { drawer.classList.add("open"); scrim.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); burger.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
    function closeD() { drawer.classList.remove("open"); scrim.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
    burger.addEventListener("click", openD);
    closeB.addEventListener("click", closeD);
    scrim.addEventListener("click", closeD);
    moreBtn.addEventListener("click", function (e) { e.stopPropagation(); var o = menu.classList.toggle("open"); moreBtn.setAttribute("aria-expanded", o ? "true" : "false"); });
    document.addEventListener("click", function () { menu.classList.remove("open"); moreBtn.setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeD(); menu.classList.remove("open"); } });
    [].forEach.call(document.querySelectorAll("[data-mbnav-signout]"), function (b) { b.addEventListener("click", signOut); });
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
})();
