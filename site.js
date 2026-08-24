/* =================================================================
   FROM THE PULPIT TO THE PALETTE — shared behaviour
   Vanilla JS, no dependencies.
   ================================================================= */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer: fine)').matches;

  /* -------------------------------------------------- config */
  // Inquiry delivery — FormSubmit forwards submissions to the gallery inbox.
  var ADMIN_EMAIL   = 'info@pulpit2palette.com';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/info@pulpit2palette.com';

  /* ============================================================
     1.  PALETTES + SEEDED PAINTING GENERATOR
     ============================================================ */
  var PALETTES = {
    fire:    ['#2A1206', '#7A1111', '#D86A17', '#C8A86B', '#E8C887'],
    water:   ['#0E1730', '#1D2A52', '#2954A3', '#5C86C9', '#C8A86B'],
    multi:   ['#16224A', '#2954A3', '#7A1111', '#D86A17', '#C8A86B', '#2E6B4F'],
    gold:    ['#241B0E', '#7A1111', '#9C7E45', '#C8A86B', '#EBD7A6'],
    sunrise: ['#3A1430', '#7A1111', '#D86A17', '#E8A93A', '#2954A3'],
    earth:   ['#221A12', '#5A3A1E', '#8A5A2A', '#C8A86B', '#2E5A52']
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function paint(w, h, seed, palKey, motif, label) {
    var r = mulberry32((seed || 1) * 2654435761 % 2147483647);
    var pal = PALETTES[palKey] || PALETTES.multi;
    var uid = 'p' + (seed || 0) + Math.floor(r() * 1e5);
    var s = Math.min(w, h) / 1000;
    function rnd(a, b) { return a + (b - a) * r(); }
    function pick(arr) { return arr[Math.floor(r() * arr.length)]; }
    function col(i) { return pal[i % pal.length]; }

    var parts = [];
    parts.push('<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' +
      (label || 'Abstract painting') + '" xmlns="http://www.w3.org/2000/svg">');
    parts.push('<defs>' +
      '<filter id="g' + uid + '"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer></filter>' +
      '<filter id="b' + uid + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="' + (10 * s) + '"/></filter>' +
      '</defs>');

    // base wash
    parts.push('<rect width="' + w + '" height="' + h + '" fill="' + pal[0] + '"/>');

    // broad colour fields
    var fields = Math.round(rnd(2, 4));
    for (var f = 0; f < fields; f++) {
      var fw = rnd(w * 0.4, w * 0.9), fh = rnd(h * 0.3, h * 0.7);
      var fx = rnd(-w * 0.1, w - fw * 0.4), fy = rnd(-h * 0.1, h - fh * 0.4);
      var rot = rnd(-12, 12);
      parts.push('<rect x="' + fx.toFixed(0) + '" y="' + fy.toFixed(0) + '" width="' + fw.toFixed(0) + '" height="' + fh.toFixed(0) +
        '" fill="' + col(f + 1) + '" opacity="' + rnd(0.45, 0.82).toFixed(2) +
        '" transform="rotate(' + rot.toFixed(1) + ' ' + (fx + fw / 2).toFixed(0) + ' ' + (fy + fh / 2).toFixed(0) + ')"/>');
    }

    // broad gestural brush strokes
    var strokes = Math.round(rnd(6, 10));
    for (var i = 0; i < strokes; i++) {
      var x1 = rnd(-w * 0.1, w * 0.4), y1 = rnd(0, h);
      var x2 = rnd(w * 0.6, w * 1.1), y2 = rnd(0, h);
      var cx1 = rnd(0, w), cy1 = rnd(-h * 0.2, h * 1.2);
      var cx2 = rnd(0, w), cy2 = rnd(-h * 0.2, h * 1.2);
      var sw = rnd(28, 120) * s;
      parts.push('<path d="M' + x1.toFixed(0) + ' ' + y1.toFixed(0) + ' C ' + cx1.toFixed(0) + ' ' + cy1.toFixed(0) +
        ', ' + cx2.toFixed(0) + ' ' + cy2.toFixed(0) + ', ' + x2.toFixed(0) + ' ' + y2.toFixed(0) +
        '" fill="none" stroke="' + col(i + 1) + '" stroke-width="' + sw.toFixed(0) +
        '" stroke-linecap="round" opacity="' + rnd(0.5, 0.92).toFixed(2) + '"/>');
    }

    // drips
    var drips = Math.round(rnd(3, 7));
    for (var d = 0; d < drips; d++) {
      var dx = rnd(w * 0.1, w * 0.9), dy = rnd(0, h * 0.5), dl = rnd(h * 0.1, h * 0.5);
      parts.push('<line x1="' + dx.toFixed(0) + '" y1="' + dy.toFixed(0) + '" x2="' + dx.toFixed(0) + '" y2="' +
        (dy + dl).toFixed(0) + '" stroke="' + pick(pal) + '" stroke-width="' + (rnd(3, 9) * s).toFixed(1) +
        '" opacity="' + rnd(0.4, 0.8).toFixed(2) + '"/>');
    }

    // splatter
    var dots = Math.round(rnd(26, 46));
    for (var k = 0; k < dots; k++) {
      parts.push('<circle cx="' + rnd(0, w).toFixed(0) + '" cy="' + rnd(0, h).toFixed(0) +
        '" r="' + (rnd(2, 16) * s).toFixed(1) + '" fill="' + pick(pal) + '" opacity="' + rnd(0.3, 0.95).toFixed(2) + '"/>');
    }

    // sacred motif — luminous cross
    if (motif === 'cross') {
      var ccx = rnd(w * 0.35, w * 0.65), ccy = h * 0.46;
      var armW = rnd(34, 52) * s, vH = h * 0.5, hW = w * 0.32, hY = ccy - vH * 0.18;
      var g = '<g opacity="0.95">' +
        '<rect x="' + (ccx - armW / 2) + '" y="' + (ccy - vH / 2) + '" width="' + armW + '" height="' + vH + '" rx="' + (armW / 2) + '" fill="' + PALETTES.gold[4] + '" filter="url(#b' + uid + ')" opacity="0.6"/>' +
        '<rect x="' + (ccx - hW / 2) + '" y="' + (hY - armW / 2) + '" width="' + hW + '" height="' + armW + '" rx="' + (armW / 2) + '" fill="' + PALETTES.gold[4] + '" filter="url(#b' + uid + ')" opacity="0.6"/>' +
        '<rect x="' + (ccx - armW / 2) + '" y="' + (ccy - vH / 2) + '" width="' + armW + '" height="' + vH + '" rx="' + (armW / 3) + '" fill="' + PALETTES.gold[3] + '"/>' +
        '<rect x="' + (ccx - hW / 2) + '" y="' + (hY - armW / 2) + '" width="' + hW + '" height="' + armW + '" rx="' + (armW / 3) + '" fill="' + PALETTES.gold[3] + '"/>' +
        '</g>';
      parts.push(g);
    }

    // grain
    parts.push('<rect width="' + w + '" height="' + h + '" filter="url(#g' + uid + ')" opacity="0.06"/>');
    parts.push('</svg>');
    return parts.join('');
  }

  /* ============================================================
     2.  ARTWORK DATA (single source for grid + detail)
     ============================================================ */
  // Real catalogue (parsed from filenames into assets/artworks.js)
  var ARTWORKS = (window.ARTWORKS_DATA || []).map(function (a, i) { a.idx = i; return a; });
  window.PTP = { ARTWORKS: ARTWORKS, paint: paint };

  function orientation(a) { return a.orient || ''; }
  function dims(a) { return a.dims || ''; }
  function sizeBucket(a) { var area = (a.w || 0) * (a.h || 0); return area < 150 ? 'Small' : (area <= 600 ? 'Medium' : 'Large'); }
  function byId(id) { for (var i = 0; i < ARTWORKS.length; i++) if (ARTWORKS[i].id === id) return ARTWORKS[i]; return null; }
  function byTitle(t) { for (var i = 0; i < ARTWORKS.length; i++) if (ARTWORKS[i].title === t) return ARTWORKS[i]; return null; }

  /* ============================================================
     3.  RENDER PAINTINGS into [data-painting] elements
     ============================================================ */
  function renderPaintings(scope) {
    var els = (scope || document).querySelectorAll('[data-painting]');
    els.forEach(function (el) {
      if (el.dataset.painted) return;
      var w = +el.dataset.w || 1000;
      var h = +el.dataset.h || 1250;
      el.innerHTML = paint(w, h, +el.dataset.seed || 1, el.dataset.pal || 'multi', el.dataset.motif || '', el.dataset.label || 'Abstract painting');
      el.dataset.painted = '1';
    });
  }

  /* ============================================================
     4.  GENERIC: header, progress, reveal, count-up, menu, year
     ============================================================ */
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    renderPaintings(document);

    // footer year
    var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

    // header + progress + paint veil
    var header = document.querySelector('.header');
    var progress = document.querySelector('.progress');
    var isHome = !!document.querySelector('.hero');
    var tick = false;
    function onScroll() {
      var sy = window.scrollY || 0;
      if (header) header.classList.toggle('scrolled', sy > 20);
      var max = document.documentElement.scrollHeight - innerHeight;
      if (progress) progress.style.width = (max > 0 ? sy / max * 100 : 0) + '%';
      if (isHome && !REDUCE) {
        var p = Math.min(sy / (innerHeight * 1.4), 1);
        root.style.setProperty('--paint', p.toFixed(3));
      }
      tick = false;
    }
    addEventListener('scroll', function () { if (!tick) { requestAnimationFrame(onScroll); tick = true; } }, { passive: true });
    onScroll();

    // mobile menu
    var mBtn = document.querySelector('.menu-btn');
    var menu = document.querySelector('.mobile-menu');
    if (mBtn && menu) {
      var mClose = menu.querySelector('.m-close');
      function setMenu(o) {
        menu.classList.toggle('open', o);
        mBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
        document.body.style.overflow = o ? 'hidden' : '';
      }
      mBtn.addEventListener('click', function () { setMenu(true); });
      if (mClose) mClose.addEventListener('click', function () { setMenu(false); });
      menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }

    // reveal
    var revs = document.querySelectorAll('.reveal, .reveal-cut');
    if ('IntersectionObserver' in window && !REDUCE) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revs.forEach(function (el) { io.observe(el); });
    } else { revs.forEach(function (el) { el.classList.add('in'); }); }

    // count-up
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window && !REDUCE && counters.length) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, t = +el.dataset.count, suf = el.dataset.suffix || '', st = null;
          (function step(ts) { st = st || ts; var p = Math.min((ts - st) / 1400, 1); el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * t) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = t + suf; })(performance.now());
          cio.unobserve(el);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); }); }

    // active nav link
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a, .mobile-menu nav a').forEach(function (a) {
      var href = a.getAttribute('href'); if (href === path) a.classList.add('active');
    });

    initHero(isHome);
    initCursor();
    initInquiry();
    initLightbox();
    initCollection();
    scrollSpy();
    initAnchors();
    initAudio();
    initDetail();
    initTabs();
  });

  /* ============================================================
     5.  HERO: cinematic intro + parallax + floats
     ============================================================ */
  function initHero(isHome) {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    // parallax on the hero image + floats
    var img = hero.querySelector('.hero-media img');
    var floats = hero.querySelectorAll('.hero-float');
    if (!REDUCE && FINE) {
      var ht = false;
      addEventListener('scroll', function () {
        if (ht) return; ht = true;
        requestAnimationFrame(function () {
          var sy = window.scrollY;
          if (sy < innerHeight) {
            if (img) img.style.transform = 'translateY(' + (sy * 0.18) + 'px) scale(1.06)';
            floats.forEach(function (f, i) {
              var sp = (i + 1) * 0.06; f.style.transform = 'translateY(' + (sy * -sp) + 'px)';
            });
          }
          ht = false;
        });
      }, { passive: true });
    }

    var intro = document.querySelector('.intro');
    if (!intro) return;
    intro.style.animation = 'none'; // JS will handle the reveal; the CSS failsafe is only for JS failure
    var seen = false; try { seen = sessionStorage.getItem('ptp-intro') === '1'; } catch (e) {}
    function removeIntro() { if (intro.parentNode) intro.remove(); document.body.style.overflow = ''; }
    function finish() { intro.classList.add('lift'); try { sessionStorage.setItem('ptp-intro', '1'); } catch (e) {} setTimeout(removeIntro, 1250); }

    if (REDUCE || seen || !isHome) { removeIntro(); return; }

    // play sequence: kicker -> "spoken" -> "painted" -> brushstroke -> lift to reveal hero
    document.body.style.overflow = 'hidden';
    var EASE = 'cubic-bezier(.22,.7,.2,1)';
    var kicker = intro.querySelector('.intro-kicker');
    var l1 = intro.querySelector('.l1'), l2 = intro.querySelector('.l2');
    var brush = intro.querySelector('.intro-brush'), brushPath = intro.querySelector('.ib');
    var skip = intro.querySelector('.intro-skip');
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function fade(el, o, y) { if (!el) return; el.style.transition = 'opacity .9s ' + EASE + ', transform .9s ' + EASE; el.style.opacity = o; if (y != null) el.style.transform = 'translateY(' + y + 'px)'; }
    at(200,  function () { fade(kicker, '1', null); });
    at(680,  function () { fade(l1, '1', 0); });
    at(2550, function () { fade(l1, '0', -10); fade(l2, '1', 0); });
    at(4350, function () { if (brush) brush.style.transition = 'opacity .6s ease'; if (brush) brush.style.opacity = '1'; if (brushPath) { brushPath.style.transition = 'stroke-dashoffset 1.15s cubic-bezier(.6,0,.2,1)'; brushPath.style.strokeDashoffset = '0'; } });
    at(5250, function () { fade(l2, '0', -10); fade(kicker, '0', null); if (brush) brush.style.opacity = '0'; });
    at(5650, finish);
    function early() { timers.forEach(clearTimeout); finish(); }
    if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); early(); });
    intro.addEventListener('click', early);
    addEventListener('keydown', function onk(e) { if (e.key === 'Escape') { early(); removeEventListener('keydown', onk); } });
  }

  /* ============================================================
     6.  PAINT CURSOR (canvas particle trail)
     ============================================================ */
  function initCursor() {
    if (REDUCE || !FINE) return;
    var canvas = document.querySelector('.cursor-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(devicePixelRatio || 1, 2);
    var cols = ['#7A1111', '#C8A86B', '#2954A3', '#D86A17', '#1D2A52'];
    var parts = [], last = { x: innerWidth / 2, y: innerHeight / 2 }, moved = false;
    function resize() { canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    resize(); addEventListener('resize', resize);
    document.body.classList.add('brush-cursor');

    // refined ring follower
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    var label = document.createElement('span'); label.className = 'cr-label'; ring.appendChild(label);
    document.body.appendChild(ring);
    var rx = last.x, ry = last.y, mx = last.x, my = last.y;

    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      var dx = e.clientX - last.x, dy = e.clientY - last.y, d = Math.hypot(dx, dy);
      last = { x: e.clientX, y: e.clientY };
      if (!moved) { moved = true; return; }
      // paint-bubble trail — palette dabs that follow the cursor
      var n = Math.min(Math.floor(d / 6), 4);
      for (var i = 0; i < n + 1; i++) {
        parts.push({
          x: e.clientX + (Math.random() - 0.5) * 8, y: e.clientY + (Math.random() - 0.5) * 8,
          r: 2 + Math.random() * 5, c: cols[(Math.random() * cols.length) | 0],
          a: 0.5 + Math.random() * 0.25,
          vx: dx * 0.02 + (Math.random() - 0.5), vy: dy * 0.02 + (Math.random() - 0.5)
        });
      }
      if (parts.length > 120) parts.splice(0, parts.length - 120);
    }, { passive: true });

    // hover states for the ring
    document.addEventListener('mouseover', function (e) {
      var art = e.target.closest && e.target.closest('.art-img, .detail-stage, .room-art');
      var inter = e.target.closest && e.target.closest('a, button, [role="button"], .toggle, select, input, textarea');
      if (art) { label.textContent = e.target.closest('.detail-stage') ? 'Zoom' : 'View'; ring.classList.add('view'); ring.classList.remove('hover'); }
      else if (inter) { ring.classList.add('hover'); ring.classList.remove('view'); }
    });
    document.addEventListener('mouseout', function (e) {
      var to = e.relatedTarget;
      var still = to && to.closest && to.closest('.art-img, .detail-stage, .room-art, a, button, [role="button"], .toggle, select, input, textarea');
      if (!still) { ring.classList.remove('view'); ring.classList.remove('hover'); }
    });

    (function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.a -= 0.014; p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
        if (p.a <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(p.a, 0); ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    })();

    // magnetic buttons — subtle pull toward the cursor
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var ox = e.clientX - (r.left + r.width / 2), oy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (ox * 0.16) + 'px,' + (oy * 0.22) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ============================================================
     7.  COLLECTION grid + filters + pricing toggle
     ============================================================ */
  function initCollection() {
    var grid = document.getElementById('art-grid');
    if (!grid) return;
    var list = ARTWORKS;

    var total = list.length;
    grid.innerHTML = list.map(function (a, i) {
      return '' +
        '<article class="art-card reveal" data-medium="' + a.medium + '" data-size="' + sizeBucket(a) + '" data-orient="' + a.orient + '">' +
          '<button class="art-img" data-lb="' + a.idx + '" aria-label="Expand ' + a.title + '">' +
            '<img src="' + a.thumb + '" srcset="' + a.thumb + ' 1000w, ' + a.img + ' 1800w" sizes="(min-width:900px) 70vw, 94vw" width="' + a.w + '" height="' + a.h + '" alt="' + a.title + ' — ' + a.medium + ', ' + a.dims + '" loading="lazy" decoding="async">' +
            '<span class="art-expand" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10V4h6M20 14v6h-6M4 4l6 6M20 20l-6-6"/></svg></span>' +
          '</button>' +
          '<div class="art-meta">' +
            '<span class="art-num">Work ' + ('0' + (i + 1)).slice(-2) + ' / ' + total + '</span>' +
            '<h3 class="art-title">' + a.title + '</h3>' +
            '<p class="art-spec">' + a.medium + ' &middot; ' + a.dims + '</p>' +
            (a.status === 'collection'
              ? '<span class="btn btn-collection" aria-disabled="true"><span>In Collection</span></span>'
              : '<button class="btn btn-gold inquire" data-id="' + a.id + '"><span>Inquire About This Piece</span></button>') +
          '</div>' +
        '</article>';
    }).join('');

    // filters
    function uniq(fn) { var s = []; list.forEach(function (a) { var v = fn(a); if (v && s.indexOf(v) < 0) s.push(v); }); return s; }
    function fill(sel, vals, sort) { var el = document.getElementById(sel); if (!el) return; if (sort) vals = vals.slice().sort(); vals.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; el.appendChild(o); }); }
    fill('f-medium', uniq(function (a) { return a.medium; }), true);
    fill('f-size', ['Small', 'Medium', 'Large']);
    fill('f-orient', ['Portrait', 'Landscape', 'Square']);

    var cards = Array.prototype.slice.call(grid.children);
    var countEl = document.getElementById('art-count');
    function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    function apply() {
      var m = val('f-medium'), s = val('f-size'), o = val('f-orient'), shown = 0;
      cards.forEach(function (card) {
        var ok = (!m || card.dataset.medium === m) && (!s || card.dataset.size === s) && (!o || card.dataset.orient === o);
        card.classList.toggle('hide', !ok); if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' work' : ' works');
    }
    ['f-medium', 'f-size', 'f-orient'].forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('change', apply); });
    var reset = document.getElementById('f-reset');
    if (reset) reset.addEventListener('click', function () { ['f-medium', 'f-size', 'f-orient'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; }); apply(); });
    apply();

    // click an image to expand it in the lightbox
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (b && window.__openLightbox) window.__openLightbox(+b.dataset.lb);
    });

    // reveal the freshly-rendered cards
    if ('IntersectionObserver' in window && !REDUCE) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
      cards.forEach(function (c) { io.observe(c); });
    } else { cards.forEach(function (c) { c.classList.add('in'); }); }
  }

  /* ============================================================
     8.  INQUIRY MODAL
     ============================================================ */
  function initInquiry() {
    var modal = document.getElementById('inquiry');
    if (!modal) return;
    var panel = modal.querySelector('.modal-panel');
    var form = modal.querySelector('form');
    var sel = document.getElementById('iq-artwork');
    var idField = document.getElementById('iq-id');
    var statusEl = modal.querySelector('.form-status');
    var lastFocus = null;

    // populate the dropdown with every AVAILABLE piece (skip "In Collection" pieces)
    if (sel) {
      ARTWORKS.forEach(function (a) {
        if (a.status === 'collection') return;
        var o = document.createElement('option');
        o.value = a.title; o.setAttribute('data-id', a.id);
        o.textContent = a.title + ' — ' + a.medium + ', ' + a.dims;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { var p = byTitle(sel.value); if (idField) idField.value = p ? p.id : ''; });
    }

    function open(piece, customLabel) {
      lastFocus = document.activeElement;
      var msg = form.querySelector('[name=message]');
      if (piece) { if (sel) sel.value = piece.title; if (idField) idField.value = piece.id || ''; }
      else if (customLabel) {
        if (idField) idField.value = '';
        var hasOpt = sel && Array.prototype.some.call(sel.options, function (o) { return o.value === customLabel; });
        if (hasOpt) { sel.value = customLabel; }
        else { if (sel) sel.value = 'General Inquiry'; if (msg && !msg.value) msg.value = 'Regarding: ' + customLabel; }
      }
      else { if (sel) sel.value = ''; if (idField) idField.value = ''; }
      modal.classList.add('open'); document.body.style.overflow = 'hidden';
      var f = panel.querySelector('select,input,textarea,button'); if (f) f.focus();
      document.addEventListener('keydown', onKey);
    }
    window.__openInquiry = open;
    function close() {
      modal.classList.remove('open'); document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (statusEl) { statusEl.textContent = ''; statusEl.className = 'form-status'; }
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key === 'Tab') {
        var f = panel.querySelectorAll('button,[href],input,select,textarea');
        f = Array.prototype.filter.call(f, function (el) { return !el.disabled && el.offsetParent !== null; });
        if (!f.length) return; var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    // open triggers
    document.addEventListener('click', function (e) {
      var t = e.target.closest('.inquire, [data-inquire]');
      if (t) {
        e.preventDefault();
        var piece = byId(t.dataset.id);
        open(piece, piece ? null : (t.dataset.piece || null));
      }
      if (e.target.closest('[data-close]')) close();
    });

    // submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('[name=email]');
      var name = form.querySelector('[name=name]');
      function fail(msg, el) { statusEl.className = 'form-status err'; statusEl.textContent = msg; if (el) el.focus(); }
      if (!name.value.trim()) return fail('Please share your name.', name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return fail('Please enter a valid email address.', email);
      if (sel && !sel.value) return fail('Please choose a piece (or “General Inquiry”).', sel);
      if (!form.querySelector('[name=consent]').checked) return fail('Please confirm you understand pricing is provided on request.');
      var btn = form.querySelector('[type=submit]'); var label = btn.textContent;
      btn.disabled = true; btn.style.opacity = '.7'; btn.textContent = 'Sending…';
      statusEl.className = 'form-status';

      var payload = {}; new FormData(form).forEach(function (v, k) { payload[k] = v; });
      payload._subject = 'Pulpit2Palette Inquiry — ' + (payload.artwork || 'General');
      payload._template = 'table';
      payload._captcha = 'false';

      function done() { statusEl.className = 'form-status ok'; statusEl.textContent = 'Thank you. Your inquiry has been received — a team member will respond personally within two business days.'; form.reset(); btn.disabled = false; btn.style.opacity = ''; btn.textContent = label; setTimeout(close, 3400); }
      function err() { statusEl.className = 'form-status err'; statusEl.textContent = 'Something went wrong sending your inquiry. Please email ' + ADMIN_EMAIL + ' directly.'; btn.disabled = false; btn.style.opacity = ''; btn.textContent = label; }

      if (FORM_ENDPOINT.indexOf('your-form-id') > -1) { setTimeout(done, 900); return; } // demo mode
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { r.ok ? done() : err(); }).catch(err);
    });
  }

  /* ============================================================
     9.  ARTWORK DETAIL page
     ============================================================ */
  function initDetail() {
    var stage = document.getElementById('detail-stage');
    if (!stage) return;
    var id = new URLSearchParams(location.search).get('id');
    var a = byId(id) || ARTWORKS[0];
    document.title = a.title + ' — Donald Hilliard Jr.';

    // ratio-true painting
    var box = stage.querySelector('[data-painting]');
    var ratio = a.w / a.h;
    var W = 1200, H = Math.round(W / ratio);
    stage.style.aspectRatio = a.w + ' / ' + a.h;
    box.dataset.w = W; box.dataset.h = H; box.dataset.seed = a.seed; box.dataset.pal = a.pal; box.dataset.motif = a.motif; box.dataset.label = a.title;
    renderPaintings(stage);

    function set(sel, val) { var el = document.querySelector(sel); if (el) el.textContent = val; }
    set('[data-f=title]', a.title);
    set('[data-f=collection]', a.collection);
    set('[data-f=medium]', a.medium);
    set('[data-f=dims]', dims(a));
    set('[data-f=year]', a.year);
    set('[data-f=orient]', orientation(a));
    set('[data-f=availability]', a.availability);
    set('[data-f=story]', a.story);
    set('[data-f=notes]', a.notes);
    var exEl = document.querySelector('[data-f=exhibitions]');
    if (exEl) exEl.textContent = a.exhibitions.length ? a.exhibitions.join(' · ') : 'Exhibited by appointment';
    var col = document.querySelector('[data-f=collection-link]'); if (col) col.href = 'collection.html?c=' + encodeURIComponent(a.collection);
    var inq = document.querySelector('[data-inquire]'); if (inq) inq.dataset.id = a.id;

    // zoom to inspect texture
    if (!REDUCE) {
      stage.addEventListener('click', function () { stage.classList.toggle('zoom'); });
      stage.addEventListener('mousemove', function (e) {
        if (!stage.classList.contains('zoom')) return;
        var rect = stage.getBoundingClientRect();
        box.style.transformOrigin = ((e.clientX - rect.left) / rect.width * 100) + '% ' + ((e.clientY - rect.top) / rect.height * 100) + '%';
      });
    }
  }

  /* ============================================================
     10.  EXHIBITION tabs
     ============================================================ */
  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        t.setAttribute('aria-selected', 'true');
        var target = t.dataset.panel;
        document.querySelectorAll('[data-tabpanel]').forEach(function (p) { p.hidden = p.dataset.tabpanel !== target; });
      });
    });
  }

  /* ============================================================
     11.  LIGHTBOX — expand artwork images
     ============================================================ */
  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = lb.querySelector('.lb-img'), titleEl = lb.querySelector('.lb-title'), metaEl = lb.querySelector('.lb-meta');
    var inq = lb.querySelector('.lb-inquire');
    var current = -1, lastFocus = null;

    function fill(i) {
      var a = ARTWORKS[i]; if (!a) return;
      img.src = a.img; img.alt = a.title + ' — ' + a.medium + ', ' + a.dims;
      titleEl.textContent = a.title; metaEl.textContent = a.medium + ' · ' + a.dims;
      // "In Collection" pieces are unavailable — show a non-clickable label, not the inquire CTA
      if (inq) {
        if (a.status === 'collection') {
          inq.className = 'btn btn-collection lb-inquire'; inq.setAttribute('aria-disabled', 'true');
          inq.querySelector('span').textContent = 'In Collection';
        } else {
          inq.className = 'btn btn-gold lb-inquire'; inq.removeAttribute('aria-disabled');
          inq.querySelector('span').textContent = 'Inquire about this piece';
        }
      }
      current = i;
    }
    function openAt(i) {
      lastFocus = document.activeElement; fill(i);
      lb.classList.add('open'); document.body.style.overflow = 'hidden';
      var c = lb.querySelector('.lb-close'); if (c) c.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      lb.classList.remove('open'); document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocus) lastFocus.focus();
    }
    function step(d) { fill((current + d + ARTWORKS.length) % ARTWORKS.length); }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    }
    lb.querySelectorAll('[data-lb-close]').forEach(function (b) { b.addEventListener('click', close); });
    var prev = lb.querySelector('[data-lb-prev]'), next = lb.querySelector('[data-lb-next]');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    if (inq) inq.addEventListener('click', function () { var a = ARTWORKS[current]; close(); if (window.__openInquiry) setTimeout(function () { window.__openInquiry(a); }, 70); });
    window.__openLightbox = openAt;
  }

  /* ============================================================
     12.  SCROLL-SPY — highlight the active section in the nav
     ============================================================ */
  function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"], .mobile-menu nav a[href^="#"]'));
    if (!links.length) return;
    var map = {};
    links.forEach(function (l) { var id = l.getAttribute('href').slice(1); (map[id] = map[id] || []).push(l); });
    var ids = Object.keys(map).filter(function (id) { return document.getElementById(id); });
    if (!ids.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          (map[e.target.id] || []).forEach(function (l) { l.classList.add('active'); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ============================================================
     13.  SMOOTH ANCHOR SCROLL — capped duration so the tabs stay
          snappy even though the gallery is dozens of screens tall
     ============================================================ */
  function initAnchors() {
    var headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 74;
    function scrollToY(toY) {
      // Instant jump — reliable on a page that is dozens of screens tall
      // (a native smooth-scroll across the whole gallery feels broken).
      toY = Math.max(0, Math.min(toY, document.documentElement.scrollHeight - innerHeight));
      window.scrollTo(0, toY);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      scrollToY(target.getBoundingClientRect().top + window.scrollY - headerH);
      try { history.replaceState(null, '', hash); } catch (err) {}
    });
  }

  /* ============================================================
     14.  BACKGROUND MUSIC — header volume slider + mute, ~50% on launch
     ============================================================ */
  function initAudio() {
    var audio = document.getElementById('bg-music');
    var ctl = document.querySelector('.audio-ctl');
    if (!audio || !ctl) return;
    var toggle = ctl.querySelector('.audio-toggle');
    var slider = ctl.querySelector('.audio-vol');
    audio.volume = 0.5;
    audio.addEventListener('error', function () { ctl.style.display = 'none'; }); // no file → hide control

    function setMuted(m) {
      audio.muted = m;
      ctl.classList.toggle('muted', m);
      toggle.setAttribute('aria-pressed', m ? 'true' : 'false');
      toggle.setAttribute('aria-label', m ? 'Unmute music' : 'Mute music');
    }
    setMuted(false);

    // Browsers block autoplay-with-sound until a gesture, so try now AND on first interaction.
    // If the autoplay attempt is rejected, surface the "Play music" cue so the visitor can opt in.
    var cue = document.getElementById('audio-cue');
    function showCue() { if (cue) { cue.classList.remove('hide'); cue.classList.add('show'); } }
    function hideCue() { if (cue) { cue.classList.remove('show'); cue.classList.add('hide'); } }
    var started = false;
    function tryPlay() {
      if (audio.muted) return;
      var p = audio.play();
      if (p && p.then) p.then(function () { started = true; hideCue(); }).catch(function () { showCue(); });
    }
    function onGesture() { if (!started) tryPlay(); }
    tryPlay();
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, onGesture, { passive: true }); });
    audio.addEventListener('playing', function () {
      started = true; hideCue();
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, onGesture); });
    });
    if (cue) cue.addEventListener('click', function () { setMuted(false); tryPlay(); });

    toggle.addEventListener('click', function () { setMuted(!audio.muted); if (!audio.muted) tryPlay(); });
    slider.addEventListener('input', function () {
      var v = (+slider.value) / 100;
      audio.volume = v;
      if (v === 0) { setMuted(true); }
      else { if (audio.muted) setMuted(false); tryPlay(); }
    });
  }

})();
